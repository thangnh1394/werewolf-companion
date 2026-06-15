import type {
  CurrentTurn,
  PublicPlayer,
  RoomPhase,
  SessionId,
  DisplayName,
} from '@werewolf/shared';
import { MAX_PLAYERS, MIN_PLAYERS } from '@werewolf/shared';
import { cryptoShuffle, type ShuffleFn } from './shuffle.js';

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
  /**
   * Card assignments after dealing (Phase 2.4).
   * Map keys are sessionIds; values are cardIds.
   * Populated by dealCards() when game starts. Persists until END_GAME (Phase 2.6).
   * Empty during lobby phase.
   */
  assignments: Map<SessionId, string>;
  /**
   * Current game-flow turn. Initialized on dealCards to {day:1, phase:'night'},
   * mutated by advanceTurn, cleared back to null on endGame.
   * Phase 4.2 feature.
   */
  currentTurn: CurrentTurn | null;
}

export function createEmptyLobby(roomCode: string): LobbyState {
  return {
    roomCode,
    phase: 'lobby',
    players: new Map(),
    hostSessionId: null,
    hostDisconnectedAt: null,
    roomDesk: new Map(),
    assignments: new Map(),
    currentTurn: null,
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
    /** Optional avatar id. Stored on PublicPlayer; visible to all players. */
    avatarId?: string;
  },
): AddPlayerResult {
  // Re-joining (same sessionId): allow without capacity check.
  const existing = state.players.get(args.sessionId);
  if (existing) {
    const updatedPlayer: PublicPlayer = {
      ...existing,
      displayName: args.displayName, // allow name update on re-join
      ...(args.avatarId !== undefined ? { avatarId: args.avatarId } : {}),
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
    ...(args.avatarId !== undefined ? { avatarId: args.avatarId } : {}),
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
 * Validates whether the GM can start the game right now.
 * Phase 4.1: minimum 6 players total, all non-GM must be ready.
 * Deck size must match non-GM player count (GM is excluded from dealing).
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
  if (players.length < MIN_PLAYERS) return { ok: false, reason: 'not_enough_players' };
  const nonGmPlayers = players.filter((p) => p.sessionId !== state.hostSessionId);
  if (!nonGmPlayers.every((p) => p.isReady)) return { ok: false, reason: 'not_all_ready' };

  const deckSize = getDeckSize(state);
  if (deckSize !== nonGmPlayers.length) {
    return { ok: false, reason: 'deck_mismatch', expected: nonGmPlayers.length, actual: deckSize };
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
 * Deals cards: expands the room desk into a flat array, shuffles it, and
 * assigns one card to each player (ordered by joinedAt). Transitions to
 * 'playing' phase.
 *
 * The shuffle function is injectable for deterministic testing.
 * Defense: if deck size != player count, returns state unchanged (caller
 * should have validated via canStartGame first).
 */
export function dealCards(
  state: LobbyState,
  shuffle: ShuffleFn = cryptoShuffle,
): LobbyState {
  // Expand deck into flat array of cardIds
  const flat: string[] = [];
  for (const [cardId, count] of state.roomDesk) {
    for (let i = 0; i < count; i++) flat.push(cardId);
  }

  // GM is excluded from dealing — only non-GM players receive cards.
  const nonGmPlayers = getPlayersList(state).filter(
    (p) => p.sessionId !== state.hostSessionId,
  );
  if (flat.length !== nonGmPlayers.length) {
    // Malformed — don't deal. Caller already validated, this is defense in depth.
    return state;
  }

  const shuffled = shuffle(flat);
  const assignments = new Map<SessionId, string>();
  nonGmPlayers.forEach((p, i) => {
    assignments.set(p.sessionId, shuffled[i]!);
  });

  return { ...state, phase: 'playing', assignments, currentTurn: { day: 1, phase: 'night' } };
}

/**
 * GM-only action: transfer the GM role to another player.
 * Only valid during lobby phase. The old GM loses isHost and isReady;
 * the new GM gains both (mirrors the auto-ready behavior from addPlayer).
 */
export type TransferGmResult =
  | { ok: true; state: LobbyState; oldGm: PublicPlayer; newGm: PublicPlayer }
  | {
      ok: false;
      reason: 'not_host' | 'target_not_found' | 'cannot_transfer_to_self' | 'wrong_phase';
    };

export function transferGm(
  state: LobbyState,
  args: { requesterId: SessionId; targetId: SessionId },
): TransferGmResult {
  if (state.phase !== 'lobby') return { ok: false, reason: 'wrong_phase' };
  if (state.hostSessionId !== args.requesterId) return { ok: false, reason: 'not_host' };
  if (args.requesterId === args.targetId) return { ok: false, reason: 'cannot_transfer_to_self' };

  const currentGm = state.players.get(args.requesterId);
  const target = state.players.get(args.targetId);
  if (!currentGm || !target) return { ok: false, reason: 'target_not_found' };

  const updatedOldGm: PublicPlayer = { ...currentGm, isHost: false, isReady: false };
  const updatedNewGm: PublicPlayer = { ...target, isHost: true, isReady: true };

  const players = new Map(state.players);
  players.set(args.requesterId, updatedOldGm);
  players.set(args.targetId, updatedNewGm);

  return {
    ok: true,
    state: { ...state, players, hostSessionId: args.targetId },
    oldGm: updatedOldGm,
    newGm: updatedNewGm,
  };
}

/**
 * Ends the current game (Phase 2.6).
 *
 * - phase: 'playing' → 'lobby'
 * - assignments: cleared
 * - players' isReady: reset to false for non-host; host stays true
 *   (matches initial room creation behavior — host auto-ready)
 * - roomDesk: PRESERVED (Phase 0 decision — next round uses same deck)
 */
export function endGame(state: LobbyState): LobbyState {
  const players = new Map<SessionId, PublicPlayer>();
  for (const [sid, p] of state.players) {
    const isHostPlayer = p.sessionId === state.hostSessionId;
    players.set(sid, { ...p, isReady: isHostPlayer });
  }

  return {
    ...state,
    phase: 'lobby',
    assignments: new Map(),
    players,
    currentTurn: null,
    // roomDesk explicitly unchanged
  };
}

// ---------- Phase 4.2: Turn Tracking ----------

export interface AdvanceTurnResult {
  ok: boolean;
  reason?: 'not_gm' | 'not_playing' | 'no_active_turn';
  newState?: LobbyState;
  newTurn?: CurrentTurn;
}

/**
 * GM advances the turn. Cycles: night → day (same day#) → night (day+1).
 * Phase 4.2 feature.
 */
export function advanceTurn(
  state: LobbyState,
  requesterId: SessionId,
): AdvanceTurnResult {
  if (state.hostSessionId !== requesterId) {
    return { ok: false, reason: 'not_gm' };
  }
  if (state.phase !== 'playing') {
    return { ok: false, reason: 'not_playing' };
  }
  if (!state.currentTurn) {
    return { ok: false, reason: 'no_active_turn' };
  }

  const newTurn: CurrentTurn = state.currentTurn.phase === 'night'
    ? { day: state.currentTurn.day, phase: 'day' }
    : { day: state.currentTurn.day + 1, phase: 'night' };

  return {
    ok: true,
    newState: { ...state, currentTurn: newTurn },
    newTurn,
  };
}
