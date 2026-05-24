import { Server, type Connection, type ConnectionContext } from 'partyserver';
import {
  ClientMessageSchema,
  HOST_DISCONNECT_TIMEOUT_MS,
  ROOM_IDLE_TTL_MS,
  type ServerMessage,
  type SessionId,
} from '@werewolf/shared';
import {
  addPlayer,
  canStartGame,
  createEmptyLobby,
  getPlayersList,
  kickPlayer,
  type LobbyState,
  markDisconnected,
  removePlayer,
  setPlayerReady,
  startGame,
} from './lobby/lobbyState.js';

/**
 * One LobbyServer Durable Object instance = one room.
 * The room code IS the DO ID (PartyKit URL pattern: /parties/lobby/<code>).
 *
 * State is held in memory (`this.lobby`) and persisted to DO storage on every
 * mutation so it survives evictions. On cold start, hydrateState() restores.
 *
 * Each WebSocket connection is tagged with a sessionId (in connection state).
 * Multiple connections may share a sessionId (same user opening 2 tabs) —
 * we treat that as a refresh/rejoin, not a duplicate player.
 */

interface ConnectionData {
  sessionId: SessionId;
}

/** Maps connection.id (PartyKit's per-socket id) → sessionId. */
const ALARM_KEY_HOST_TIMEOUT = 'alarm:host-timeout';
const ALARM_KEY_IDLE_TTL = 'alarm:idle-ttl';
const STATE_KEY = 'state:lobby';

export default class LobbyServer extends Server {
  static override options = {
    // Use Hibernation API so the DO doesn't burn CPU while idle.
    // Outgoing messages are free; the DO spins up only on incoming.
    hibernate: true,
  };

  /** Authoritative room state. */
  private lobby: LobbyState = createEmptyLobby('');

  /** Whether we've already loaded state from storage. */
  private hydrated = false;

  /**
   * Called by PartyKit when the DO starts. Restore state from storage if any.
   */
  override async onStart(): Promise<void> {
    if (this.hydrated) return;
    const stored = await this.ctx.storage.get<SerializedState>(STATE_KEY);
    if (stored) {
      this.lobby = deserializeState(stored);
    } else {
      this.lobby = createEmptyLobby(this.name);
    }
    this.hydrated = true;
    // Always reset the idle TTL alarm on any activity.
    await this.scheduleIdleAlarm();
  }

  /**
   * Called for every incoming WebSocket connection.
   */
  override async onConnect(conn: Connection, _ctx: ConnectionContext): Promise<void> {
    // The client sends a JOIN message immediately after connecting.
    // We do nothing here except wait. Validation happens in onMessage.
    void conn; // silence unused
  }

  override async onMessage(conn: Connection, message: string): Promise<void> {
    if (!this.hydrated) await this.onStart();

    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      conn.close(1003, 'invalid_json');
      return;
    }

    const result = ClientMessageSchema.safeParse(parsed);
    if (!result.success) {
      conn.close(1003, 'invalid_message');
      return;
    }
    const msg = result.data;

    // Look up the sessionId tag attached to this connection.
    const data = this.getConnData(conn);

    switch (msg.type) {
      case 'JOIN':
        await this.handleJoin(conn, msg.sessionId, msg.displayName, msg.isHost);
        return;

      case 'SET_READY':
        if (!data) {
          conn.close(1008, 'not_joined');
          return;
        }
        await this.handleSetReady(data.sessionId, msg.isReady);
        return;

      case 'KICK_PLAYER':
        if (!data) {
          conn.close(1008, 'not_joined');
          return;
        }
        await this.handleKick(data.sessionId, msg.targetSessionId);
        return;

      case 'START_GAME':
        if (!data) {
          conn.close(1008, 'not_joined');
          return;
        }
        await this.handleStartGame(data.sessionId);
        return;

      case 'LEAVE_ROOM':
        if (!data) return;
        await this.handleLeave(data.sessionId);
        conn.close(1000, 'left');
        return;
    }
  }

  override async onClose(conn: Connection): Promise<void> {
    const data = this.getConnData(conn);
    if (!data) return;

    // Has the user reconnected on a different connection? If so, don't mark them
    // as disconnected (they have at least one active socket).
    if (this.hasOtherConnections(data.sessionId, conn.id)) return;

    const now = Date.now();
    this.lobby = markDisconnected(this.lobby, data.sessionId, now);
    await this.persistState();

    if (this.lobby.hostSessionId === data.sessionId) {
      await this.scheduleHostTimeoutAlarm();
    }

    // Broadcast updated player to others (isConnected: false).
    const player = this.lobby.players.get(data.sessionId);
    if (player) {
      this.broadcastMessage({ type: 'PLAYER_UPDATED', player }, [conn.id]);
    }
  }

  /**
   * Handles PartyKit alarms. We schedule two kinds:
   * 1. Host disconnect timeout (5 min after host disconnects → close room)
   * 2. Idle TTL (2 hr after any activity → cleanup)
   */
  override async onAlarm(): Promise<void> {
    if (!this.hydrated) await this.onStart();

    const now = Date.now();

    // Host timeout check
    if (
      this.lobby.hostDisconnectedAt !== null &&
      now - this.lobby.hostDisconnectedAt >= HOST_DISCONNECT_TIMEOUT_MS
    ) {
      await this.closeRoom('host_timeout');
      return;
    }

    // Idle TTL check
    const lastActivity = await this.ctx.storage.get<number>('lastActivityAt');
    if (lastActivity && now - lastActivity >= ROOM_IDLE_TTL_MS) {
      await this.closeRoom('idle_ttl');
      return;
    }

    // Reschedule whichever alarm is still relevant
    if (this.lobby.hostDisconnectedAt !== null) {
      await this.scheduleHostTimeoutAlarm();
    } else {
      await this.scheduleIdleAlarm();
    }
  }

  // ---------- Handlers ----------

  private async handleJoin(
    conn: Connection,
    sessionId: SessionId,
    displayName: string,
    isHost: boolean,
  ): Promise<void> {
    if (this.lobby.phase === 'playing') {
      this.sendTo(conn, { type: 'JOIN_ERROR', reason: 'room_in_progress' });
      conn.close(1000, 'room_in_progress');
      return;
    }

    const result = addPlayer(this.lobby, {
      sessionId,
      displayName,
      isHost,
      now: Date.now(),
    });

    if (!result.ok) {
      const reason = result.reason === 'room_full' ? 'room_full' : 'room_in_progress';
      this.sendTo(conn, { type: 'JOIN_ERROR', reason });
      conn.close(1000, reason);
      return;
    }

    this.lobby = result.state;
    this.setConnData(conn, { sessionId });
    await this.persistState();
    await this.touchActivity();

    // Send snapshot to the joining client first
    this.sendTo(conn, {
      type: 'STATE_SNAPSHOT',
      roomCode: this.lobby.roomCode,
      phase: this.lobby.phase,
      players: getPlayersList(this.lobby),
      selfSessionId: sessionId,
    });

    // Notify others that someone joined / rejoined
    const isNewPlayer = !this.lobby.players.has(sessionId) ? false : true;
    void isNewPlayer; // both cases broadcast PLAYER_JOINED for simplicity
    this.broadcastMessage({ type: 'PLAYER_JOINED', player: result.player }, [conn.id]);
  }

  private async handleSetReady(sessionId: SessionId, isReady: boolean): Promise<void> {
    const result = setPlayerReady(this.lobby, sessionId, isReady);
    if (!result) return;
    this.lobby = result.state;
    await this.persistState();
    await this.touchActivity();
    this.broadcastMessage({ type: 'PLAYER_UPDATED', player: result.player });
  }

  private async handleKick(requesterId: SessionId, targetId: SessionId): Promise<void> {
    const result = kickPlayer(this.lobby, { requesterId, targetId });
    if (!result.ok) return;

    // Find the target's connection(s) and notify them, then close.
    const targetConns = this.getConnectionsForSession(targetId);
    for (const c of targetConns) {
      this.sendTo(c, { type: 'KICKED' });
      c.close(1000, 'kicked');
    }

    this.lobby = result.state;
    await this.persistState();
    await this.touchActivity();
    this.broadcastMessage({ type: 'PLAYER_LEFT', sessionId: targetId });
  }

  private async handleStartGame(requesterId: SessionId): Promise<void> {
    const check = canStartGame(this.lobby, requesterId);
    if (!check.ok) return;

    this.lobby = startGame(this.lobby);
    await this.persistState();
    await this.touchActivity();

    // Phase 1: just send the stub. Phase 2 will replace this with card dealing.
    this.broadcastMessage({ type: 'GAME_STARTED_STUB' });
  }

  private async handleLeave(sessionId: SessionId): Promise<void> {
    const wasHost = this.lobby.hostSessionId === sessionId;

    if (wasHost) {
      // Host voluntary leave closes the room immediately.
      await this.closeRoom('host_left');
      return;
    }

    this.lobby = removePlayer(this.lobby, sessionId);
    await this.persistState();
    await this.touchActivity();
    this.broadcastMessage({ type: 'PLAYER_LEFT', sessionId });
  }

  // ---------- Helpers ----------

  private async closeRoom(reason: 'host_left' | 'host_timeout' | 'idle_ttl'): Promise<void> {
    this.broadcastMessage({ type: 'ROOM_CLOSED', reason });
    for (const c of this.getConnections()) {
      c.close(1000, reason);
    }
    // Clear persisted state — DO can be evicted; nothing to restore.
    await this.ctx.storage.deleteAll();
    this.lobby = createEmptyLobby(this.name);
  }

  private async persistState(): Promise<void> {
    await this.ctx.storage.put<SerializedState>(STATE_KEY, serializeState(this.lobby));
  }

  private async touchActivity(): Promise<void> {
    await this.ctx.storage.put('lastActivityAt', Date.now());
    await this.scheduleIdleAlarm();
  }

  private async scheduleHostTimeoutAlarm(): Promise<void> {
    if (this.lobby.hostDisconnectedAt === null) return;
    const fireAt = this.lobby.hostDisconnectedAt + HOST_DISCONNECT_TIMEOUT_MS;
    await this.ctx.storage.put(ALARM_KEY_HOST_TIMEOUT, fireAt);
    await this.ctx.storage.setAlarm(fireAt);
  }

  private async scheduleIdleAlarm(): Promise<void> {
    const fireAt = Date.now() + ROOM_IDLE_TTL_MS;
    await this.ctx.storage.put(ALARM_KEY_IDLE_TTL, fireAt);
    // Only set if there's no earlier alarm pending
    const currentAlarm = await this.ctx.storage.getAlarm();
    if (currentAlarm === null || currentAlarm > fireAt) {
      await this.ctx.storage.setAlarm(fireAt);
    }
  }

  private broadcastMessage(message: ServerMessage, exceptIds: string[] = []): void {
    const payload = JSON.stringify(message);
    for (const conn of this.getConnections()) {
      if (exceptIds.includes(conn.id)) continue;
      try {
        conn.send(payload);
      } catch {
        // Ignore send errors on dead sockets
      }
    }
  }

  private sendTo(conn: Connection, message: ServerMessage): void {
    try {
      conn.send(JSON.stringify(message));
    } catch {
      // ignore
    }
  }

  private getConnData(conn: Connection): ConnectionData | null {
    return (conn.state as ConnectionData | null) ?? null;
  }

  private setConnData(conn: Connection, data: ConnectionData): void {
    conn.setState(data);
  }

  private hasOtherConnections(sessionId: SessionId, exceptConnId: string): boolean {
    for (const c of this.getConnections()) {
      if (c.id === exceptConnId) continue;
      const d = this.getConnData(c);
      if (d?.sessionId === sessionId) return true;
    }
    return false;
  }

  private getConnectionsForSession(sessionId: SessionId): Connection[] {
    const result: Connection[] = [];
    for (const c of this.getConnections()) {
      const d = this.getConnData(c);
      if (d?.sessionId === sessionId) result.push(c);
    }
    return result;
  }
}

// ---------- Serialization helpers ----------

interface SerializedState {
  roomCode: string;
  phase: 'lobby' | 'playing';
  players: Array<[string, ReturnType<typeof JSON.parse>]>;
  hostSessionId: string | null;
  hostDisconnectedAt: number | null;
}

function serializeState(state: LobbyState): SerializedState {
  return {
    roomCode: state.roomCode,
    phase: state.phase,
    players: Array.from(state.players.entries()),
    hostSessionId: state.hostSessionId,
    hostDisconnectedAt: state.hostDisconnectedAt,
  };
}

function deserializeState(s: SerializedState): LobbyState {
  return {
    roomCode: s.roomCode,
    phase: s.phase,
    players: new Map(s.players),
    hostSessionId: s.hostSessionId,
    hostDisconnectedAt: s.hostDisconnectedAt,
  };
}
