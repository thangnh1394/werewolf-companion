import type * as Party from 'partykit/server';
import {
  ClientMessageSchema,
  HOST_DISCONNECT_TIMEOUT_MS,
  ROOM_IDLE_TTL_MS,
  findCard,
  type ServerMessage,
  type SessionId,
} from '@werewolf/shared';
import {
  addPlayer,
  canStartGame,
  createEmptyLobby,
  dealCards,
  deckAsRecord,
  endGame,
  getPlayersList,
  kickPlayer,
  type LobbyState,
  markDisconnected,
  removePlayer,
  setCardCount,
  setPlayerReady,
  transferGm,
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

const ALARM_KEY_HOST_TIMEOUT = 'alarm:host-timeout';
const ALARM_KEY_IDLE_TTL = 'alarm:idle-ttl';
const STATE_KEY = 'state:lobby';

export default class LobbyServer implements Party.Server {
  static options: Party.ServerOptions = { hibernate: true };

  constructor(readonly room: Party.Room) {}

  /** Authoritative room state. */
  private lobby: LobbyState = createEmptyLobby('');

  /** Whether we've already loaded state from storage. */
  private hydrated = false;

  async onStart(): Promise<void> {
    if (this.hydrated) return;
    const stored = await this.room.storage.get<SerializedState>(STATE_KEY);
    if (stored) {
      this.lobby = deserializeState(stored);
    } else {
      this.lobby = createEmptyLobby(this.room.id);
    }
    this.hydrated = true;
    await this.scheduleIdleAlarm();
  }

  async onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext): Promise<void> {
    void conn;
  }

  async onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection): Promise<void> {
    if (typeof message !== 'string') return;
    if (!this.hydrated) await this.onStart();

    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      sender.close(1003, 'invalid_json');
      return;
    }

    const result = ClientMessageSchema.safeParse(parsed);
    if (!result.success) {
      sender.close(1003, 'invalid_message');
      return;
    }
    const msg = result.data;

    const data = this.getConnData(sender);

    switch (msg.type) {
      case 'JOIN':
        await this.handleJoin(sender, msg.sessionId, msg.displayName, msg.isHost, msg.avatarId);
        return;

      case 'SET_READY':
        if (!data) {
          sender.close(1008, 'not_joined');
          return;
        }
        await this.handleSetReady(data.sessionId, msg.isReady);
        return;

      case 'KICK_PLAYER':
        if (!data) {
          sender.close(1008, 'not_joined');
          return;
        }
        await this.handleKick(data.sessionId, msg.targetSessionId);
        return;

      case 'START_GAME':
        if (!data) {
          sender.close(1008, 'not_joined');
          return;
        }
        await this.handleStartGame(data.sessionId);
        return;

      case 'LEAVE_ROOM':
        if (!data) return;
        await this.handleLeave(data.sessionId);
        sender.close(1000, 'left');
        return;

      case 'SET_CARD_COUNT':
        if (!data) {
          sender.close(1008, 'not_joined');
          return;
        }
        await this.handleSetCardCount(data.sessionId, msg.cardId, msg.count);
        return;

      case 'END_GAME':
        if (!data) {
          sender.close(1008, 'not_joined');
          return;
        }
        await this.handleEndGame(data.sessionId);
        return;

      case 'TRANSFER_GM':
        if (!data) {
          sender.close(1008, 'not_joined');
          return;
        }
        await this.handleTransferGm(data.sessionId, msg.targetSessionId);
        return;
    }
  }

  async onClose(conn: Party.Connection): Promise<void> {
    const data = this.getConnData(conn);
    if (!data) return;

    if (this.hasOtherConnections(data.sessionId, conn.id)) return;

    const now = Date.now();
    this.lobby = markDisconnected(this.lobby, data.sessionId, now);
    await this.persistState();

    if (this.lobby.hostSessionId === data.sessionId) {
      await this.scheduleHostTimeoutAlarm();
    }

    const player = this.lobby.players.get(data.sessionId);
    if (player) {
      this.broadcastMessage({ type: 'PLAYER_UPDATED', player }, [conn.id]);
    }
  }

  async onAlarm(): Promise<void> {
    if (!this.hydrated) await this.onStart();

    const now = Date.now();

    if (
      this.lobby.hostDisconnectedAt !== null &&
      now - this.lobby.hostDisconnectedAt >= HOST_DISCONNECT_TIMEOUT_MS
    ) {
      await this.closeRoom('host_timeout');
      return;
    }

    const lastActivity = await this.room.storage.get<number>('lastActivityAt');
    if (lastActivity && now - lastActivity >= ROOM_IDLE_TTL_MS) {
      await this.closeRoom('idle_ttl');
      return;
    }

    if (this.lobby.hostDisconnectedAt !== null) {
      await this.scheduleHostTimeoutAlarm();
    } else {
      await this.scheduleIdleAlarm();
    }
  }

  // ---------- Handlers ----------

  private async handleJoin(
    conn: Party.Connection,
    sessionId: SessionId,
    displayName: string,
    isHost: boolean,
    avatarId: string | undefined,
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
      ...(avatarId !== undefined ? { avatarId } : {}),
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

    const yourCard = this.lobby.assignments.get(sessionId);
    this.sendTo(conn, {
      type: 'STATE_SNAPSHOT',
      roomCode: this.lobby.roomCode,
      phase: this.lobby.phase,
      players: getPlayersList(this.lobby),
      selfSessionId: sessionId,
      roomDesk: deckAsRecord(this.lobby),
      ...(yourCard ? { yourCard } : {}),
    });

    void (!this.lobby.players.has(sessionId) ? false : true);
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

    this.lobby = dealCards(this.lobby);
    await this.persistState();
    await this.touchActivity();

    // Send each connected player their OWN card privately (never broadcast).
    for (const conn of this.room.getConnections()) {
      const d = this.getConnData(conn);
      if (!d) continue;
      const cardId = this.lobby.assignments.get(d.sessionId);
      if (cardId) this.sendTo(conn, { type: 'YOUR_CARD', cardId });
    }

    // Phase 3.4: pick a random transition variant so all clients see the same animation.
    const variants = ['night', 'campfire', 'dealing'] as const;
    const transitionVariant = variants[Math.floor(Math.random() * variants.length)]!;

    // Broadcast phase change with the chosen transition — NO card information.
    this.broadcastMessage({ type: 'GAME_STARTED', transitionVariant });
  }

  private async handleLeave(sessionId: SessionId): Promise<void> {
    const wasHost = this.lobby.hostSessionId === sessionId;

    if (wasHost) {
      await this.closeRoom('host_left');
      return;
    }

    this.lobby = removePlayer(this.lobby, sessionId);
    await this.persistState();
    await this.touchActivity();
    this.broadcastMessage({ type: 'PLAYER_LEFT', sessionId });
  }

  private async handleSetCardCount(
    requesterId: SessionId,
    cardId: string,
    count: number,
  ): Promise<void> {
    // Only host may edit room desk
    if (this.lobby.hostSessionId !== requesterId) return;
    // Only during lobby phase (locked during play)
    if (this.lobby.phase !== 'lobby') return;
    // Defense in depth: cardId must be a known card
    if (!findCard(cardId)) return;

    this.lobby = setCardCount(this.lobby, cardId, count);
    await this.persistState();
    await this.touchActivity();

    this.broadcastMessage({
      type: 'ROOM_DESK_UPDATED',
      deck: deckAsRecord(this.lobby),
    });
  }

  private async handleTransferGm(requesterId: SessionId, targetId: SessionId): Promise<void> {
    const result = transferGm(this.lobby, { requesterId, targetId });
    if (!result.ok) return;

    this.lobby = result.state;
    await this.persistState();
    await this.touchActivity();

    this.broadcastMessage({ type: 'PLAYER_UPDATED', player: result.oldGm });
    this.broadcastMessage({ type: 'PLAYER_UPDATED', player: result.newGm });
  }

  /**
   * Phase 2.6: Host ends the game.
   * - Clears card assignments
   * - Resets non-host isReady (host stays true)
   * - Keeps roomDesk for next round
   * - Transitions phase: playing → lobby
   * - Broadcasts GAME_ENDED + PLAYER_UPDATED for each player whose state changed
   */
  private async handleEndGame(requesterId: SessionId): Promise<void> {
    // Only host may end the game
    if (this.lobby.hostSessionId !== requesterId) return;
    // Only during playing phase (no-op if already lobby)
    if (this.lobby.phase !== 'playing') return;

    const beforePlayers = this.lobby.players;
    this.lobby = endGame(this.lobby);
    await this.persistState();
    await this.touchActivity();

    // Broadcast phase change first — clients can transition immediately.
    this.broadcastMessage({ type: 'GAME_ENDED' });

    // Then broadcast player updates so each client's player list reflects new ready states.
    for (const [sid, p] of this.lobby.players) {
      const prev = beforePlayers.get(sid);
      if (prev && prev.isReady !== p.isReady) {
        this.broadcastMessage({ type: 'PLAYER_UPDATED', player: p });
      }
    }
  }

  // ---------- Helpers ----------

  private async closeRoom(reason: 'host_left' | 'host_timeout' | 'idle_ttl'): Promise<void> {
    this.broadcastMessage({ type: 'ROOM_CLOSED', reason });
    for (const c of this.room.getConnections()) {
      c.close(1000, reason);
    }
    await this.room.storage.deleteAll();
    this.lobby = createEmptyLobby(this.room.id);
  }

  private async persistState(): Promise<void> {
    await this.room.storage.put<SerializedState>(STATE_KEY, serializeState(this.lobby));
  }

  private async touchActivity(): Promise<void> {
    await this.room.storage.put('lastActivityAt', Date.now());
    await this.scheduleIdleAlarm();
  }

  private async scheduleHostTimeoutAlarm(): Promise<void> {
    if (this.lobby.hostDisconnectedAt === null) return;
    const fireAt = this.lobby.hostDisconnectedAt + HOST_DISCONNECT_TIMEOUT_MS;
    await this.room.storage.put(ALARM_KEY_HOST_TIMEOUT, fireAt);
    await this.room.storage.setAlarm(fireAt);
  }

  private async scheduleIdleAlarm(): Promise<void> {
    const fireAt = Date.now() + ROOM_IDLE_TTL_MS;
    await this.room.storage.put(ALARM_KEY_IDLE_TTL, fireAt);
    const currentAlarm = await this.room.storage.getAlarm();
    if (currentAlarm === null || currentAlarm > fireAt) {
      await this.room.storage.setAlarm(fireAt);
    }
  }

  private broadcastMessage(message: ServerMessage, exceptIds: string[] = []): void {
    const payload = JSON.stringify(message);
    for (const conn of this.room.getConnections()) {
      if (exceptIds.includes(conn.id)) continue;
      try {
        conn.send(payload);
      } catch {
        // ignore dead sockets
      }
    }
  }

  private sendTo(conn: Party.Connection, message: ServerMessage): void {
    try {
      conn.send(JSON.stringify(message));
    } catch {
      // ignore
    }
  }

  private getConnData(conn: Party.Connection): ConnectionData | null {
    return (conn.state as ConnectionData | null) ?? null;
  }

  private setConnData(conn: Party.Connection, data: ConnectionData): void {
    conn.setState(data);
  }

  private hasOtherConnections(sessionId: SessionId, exceptConnId: string): boolean {
    for (const c of this.room.getConnections()) {
      if (c.id === exceptConnId) continue;
      const d = this.getConnData(c);
      if (d?.sessionId === sessionId) return true;
    }
    return false;
  }

  private getConnectionsForSession(sessionId: SessionId): Party.Connection[] {
    const result: Party.Connection[] = [];
    for (const c of this.room.getConnections()) {
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
  /** Optional for backward compat with rooms created before Phase 2.3. */
  roomDesk?: Array<[string, number]>;
  /** Optional for backward compat with rooms created before Phase 2.4. */
  assignments?: Array<[string, string]>;
}

function serializeState(state: LobbyState): SerializedState {
  return {
    roomCode: state.roomCode,
    phase: state.phase,
    players: Array.from(state.players.entries()),
    hostSessionId: state.hostSessionId,
    hostDisconnectedAt: state.hostDisconnectedAt,
    roomDesk: Array.from(state.roomDesk.entries()),
    assignments: Array.from(state.assignments.entries()),
  };
}

function deserializeState(s: SerializedState): LobbyState {
  return {
    roomCode: s.roomCode,
    phase: s.phase,
    players: new Map(s.players),
    hostSessionId: s.hostSessionId as SessionId | null,
    hostDisconnectedAt: s.hostDisconnectedAt,
    roomDesk: new Map(s.roomDesk ?? []),
    assignments: new Map((s.assignments ?? []) as Array<[SessionId, string]>),
  };
}
