import type {
  PublicPlayer,
  RoomPhase,
  SessionId,
  DisplayName,
} from '@werewolf/shared';
import { MAX_PLAYERS } from '@werewolf/shared';

/**
 * Internal room state held by the LobbyServer Durable Object.
 * This is the authoritative state — clients only see derived public views.
 *
 * Pure data only. No timers, no connections, no side effects.
 * All operations are pure functions that return a new state.
 */
export interface LobbyState {
  roomCode: string;
  phase: RoomPhase;
  /** Ordered by joinedAt. Map keys are sessionIds. */
  players: Map<SessionId, PublicPlayer>;
  /** SessionId of the current host. Null if room has no host yet (brand new room). */
  hostSessionId: SessionId | null;
  /** Epoch ms when host last had an active connection. Null if host is currently connected. */
  hostDisconnectedAt: number | null;
  /**
   * Room desk: card composition for the next match.
   * Map keys are cardIds (from @werewolf/shared CARDS); values are counts >= 1.
   * Cards with count 0 are removed from the map entirely.
   * Persists across rounds (Phase 0 decision).
   */
  roomDesk: Map<string, number>;
}

export function createEmptyLobby(roomCode: string): LobbyState {
  return {
    roomCode,
    phase: 'lobby',
    players: new Map(),
    hostSessionId: null,
    hostDisconnectedAt: null,
    roomDesk: new Map(),
  };
}

/**
 * Returns the list of players sorted by joinedAt (oldest first).
 * The client also sorts (for the "not-ready first" UI), but this gives
 * a stable order in snapshots.
 */
export function getPlayersList(state: LobbyState): PublicPlayer[] {
  return Array.from(state.players.values()).sort((a, b) => a.joinedAt - b.joinedAt);
}

export function getHost(state: LobbyState): PublicPlayer | null {
  if (!state.hostSessionId) return null;
  return state.players.get(state.hostSessionId) ?? null;
}

/**
 * Attempts to add a player. Returns the updated state and the new player,
 * or an error reason.
 */
export type AddPlayerResult =
  | { ok: true; state: LobbyState; player: PublicPlayer }
  | { ok: false; reason: 'room_full' | 'room_in_progress' };

export function addPlayer(
  state: LobbyState,
  args: {
    sessionId: SessionId;
    displayName: DisplayName;
    isHost: boolean;
    now: number;
  },
): AddPlayerResult {
  // Re-joining (same sessionId): allow without capacity check.
  const existing = state.players.get(args.sessionId);
  if (existing) {
    const updatedPlayer: PublicPlayer = {
      ...existing,
      displayName: args.displayName, // allow name update on re-join
      isConnected: true,
    };
    const players = new Map(state.players);
    players.set(args.sessionId, updatedPlayer);
    // If this is the host returning, clear the disconnect timestamp.
    const hostDisconnectedAt =
      state.hostSessionId === args.sessionId ? null : state.hostDisconnectedAt;
    return {
      ok: true,
      state: { ...state, players, hostDisconnectedAt },
      player: updatedPlayer,
    };
  }

  // Brand new join.
  if (state.phase === 'playing') {
    return { ok: false, reason: 'room_in_progress' };
  }
  if (state.players.size >= MAX_PLAYERS) {
    return { ok: false, reason: 'room_full' };
  }

  const isFirstPlayer = state.players.size === 0;
  const claimsHost = args.isHost && isFirstPlayer && state.hostSessionId === null;

  const player: PublicPlayer = {
    sessionId: args.sessionId,
    displayName: args.displayName,
    isReady: claimsHost,
    isHost: claimsHost,
    joinedAt: args.now,
    isConnected: true,
  };

  const players = new Map(state.players);
  players.set(args.sessionId, player);

  return {
    ok: true,
    state: {
      ...state,
      players,
      hostSessionId: claimsHost ? args.sessionId : state.hostSessionId,
    },
    player,
  };
}

/**
 * Marks a player as disconnected. Doesn't remove them — they may rejoin via sessionId.
 * If the player is the host, also records hostDisconnectedAt for the 5-min timeout.
 */
export function markDisconnected(
  state: LobbyState,
  sessionId: SessionId,
  now: number,
): LobbyState {
  const player = state.players.get(sessionId);
  if (!player) return state;

  const players = new Map(state.players);
  players.set(sessionId, { ...player, isConnected: false });

  const hostDisconnectedAt =
    state.hostSessionId === sessionId ? now : state.hostDisconnectedAt;

  return { ...state, players, hostDisconnectedAt };
}

/**
 * Sets a player's ready state. No-op if player doesn't exist.
 */
export function setPlayerReady(
  state: LobbyState,
  sessionId: SessionId,
  isReady: boolean,
): { state: LobbyState; player: PublicPlayer } | null {
  const player = state.players.get(sessionId);
  if (!player) return null;

  const updated: PublicPlayer = { ...player, isReady };
  const players = new Map(state.players);
  players.set(sessionId, updated);

  return { state: { ...state, players }, player: updated };
}

/**
 * Host-only action: forcibly removes a player from the room.
 * Returns error if the requester is not the host, or target is the host themselves,
 * or target doesn't exist.
 */
export type KickPlayerResult =
  | { ok: true; state: LobbyState }
  | { ok: false; reason: 'not_host' | 'target_not_found' | 'cannot_kick_self' };

export function kickPlayer(
  state: LobbyState,
  args: { requesterId: SessionId; targetId: SessionId },
): KickPlayerResult {
  if (state.hostSessionId !== args.requesterId) {
    return { ok: false, reason: 'not_host' };
  }
  if (args.requesterId === args.targetId) {
    return { ok: false, reason: 'cannot_kick_self' };
  }
  if (!state.players.has(args.targetId)) {
    return { ok: false, reason: 'target_not_found' };
  }

  const players = new Map(state.players);
  players.delete(args.targetId);
  return { ok: true, state: { ...state, players } };
}

/**
 * Removes a player entirely (used for voluntary leave and kick).
 */
export function removePlayer(state: LobbyState, sessionId: SessionId): LobbyState {
  if (!state.players.has(sessionId)) return state;
  const players = new Map(state.players);
  players.delete(sessionId);
  return { ...state, players };
}

/**
 * Validates whether the host can start the game right now.
 * Phase 1 rule: minimum 5 players, all must be ready (host auto-ready).
 * Phase 2.3 added: room desk card count must match player count.
 */
export type CanStartResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'not_host' | 'not_enough_players' | 'not_all_ready' | 'already_playing';
    }
  | { ok: false; reason: 'deck_mismatch'; expected: number; actual: number };

export function canStartGame(
  state: LobbyState,
  requesterId: SessionId,
): CanStartResult {
  if (state.hostSessionId !== requesterId) return { ok: false, reason: 'not_host' };
  if (state.phase === 'playing') return { ok: false, reason: 'already_playing' };

  const players = Array.from(state.players.values());
  if (players.length < 5) return { ok: false, reason: 'not_enough_players' };
  const nonHostPlayers = players.filter((p) => p.sessionId !== state.hostSessionId);
  if (!nonHostPlayers.every((p) => p.isReady)) return { ok: false, reason: 'not_all_ready' };

  const deckSize = getDeckSize(state);
  const playerCount = players.length;
  if (deckSize !== playerCount) {
    return { ok: false, reason: 'deck_mismatch', expected: playerCount, actual: deckSize };
  }

  return { ok: true };
}

// ---------- Room desk reducers ----------

/**
 * Set the count of a specific card in the room desk.
 * count <= 0 removes the card entirely.
 * count > MAX_PLAYERS is capped to MAX_PLAYERS (defensive — client should already validate).
 */
export function setCardCount(
  state: LobbyState,
  cardId: string,
  count: number,
): LobbyState {
  const roomDesk = new Map(state.roomDesk);
  if (count <= 0) {
    roomDesk.delete(cardId);
  } else {
    roomDesk.set(cardId, Math.min(count, MAX_PLAYERS));
  }
  return { ...state, roomDesk };
}

/** Total number of cards in the deck (sum of all counts). */
export function getDeckSize(state: LobbyState): number {
  let total = 0;
  for (const count of state.roomDesk.values()) total += count;
  return total;
}

/** Convert internal Map to wire-friendly Record. */
export function deckAsRecord(state: LobbyState): Record<string, number> {
  return Object.fromEntries(state.roomDesk);
}

/**
 * Transitions the room to 'playing' phase. Phase 1 stub — Phase 2 will
 * also do the actual card dealing here.
 */
export function startGame(state: LobbyState): LobbyState {
  return { ...state, phase: 'playing' };
}
