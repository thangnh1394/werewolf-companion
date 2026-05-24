import { assign, setup } from 'xstate';
import type {
  PublicPlayer,
  JoinErrorReason,
  RoomClosedReason,
  SessionId,
} from '@werewolf/shared';

/**
 * Lobby state machine — models discrete connection phases.
 *
 * Phases:
 *   connecting    → opening WebSocket, sending JOIN
 *   in_lobby      → got STATE_SNAPSHOT, showing player list
 *   joining_error → JOIN_ERROR received (room full, in progress, etc.)
 *   kicked        → host removed us
 *   room_closed   → host left or timed out
 *   game_starting → host pressed Start (Phase 1: stub, Phase 2: card deal)
 *   disconnected  → temporary network drop; partysocket will reconnect
 */

export interface LobbyContext {
  roomCode: string;
  selfSessionId: SessionId | null;
  players: PublicPlayer[];
  joinError: JoinErrorReason | null;
  closedReason: RoomClosedReason | null;
}

export type LobbyEvent =
  | { type: 'STATE_SNAPSHOT'; selfSessionId: SessionId; players: PublicPlayer[] }
  | { type: 'PLAYER_JOINED'; player: PublicPlayer }
  | { type: 'PLAYER_LEFT'; sessionId: SessionId }
  | { type: 'PLAYER_UPDATED'; player: PublicPlayer }
  | { type: 'JOIN_ERROR'; reason: JoinErrorReason }
  | { type: 'KICKED' }
  | { type: 'ROOM_CLOSED'; reason: RoomClosedReason }
  | { type: 'GAME_STARTED_STUB' }
  | { type: 'CONNECTION_LOST' }
  | { type: 'CONNECTION_RESTORED' };

export const lobbyMachine = setup({
  types: {
    context: {} as LobbyContext,
    events: {} as LobbyEvent,
    input: {} as { roomCode: string },
  },
  actions: {
    applySnapshot: assign({
      selfSessionId: ({ event }) =>
        event.type === 'STATE_SNAPSHOT' ? event.selfSessionId : null,
      players: ({ event }) => (event.type === 'STATE_SNAPSHOT' ? event.players : []),
    }),
    upsertPlayer: assign({
      players: ({ context, event }) => {
        if (event.type !== 'PLAYER_JOINED' && event.type !== 'PLAYER_UPDATED') {
          return context.players;
        }
        const incoming = event.player;
        const idx = context.players.findIndex((p) => p.sessionId === incoming.sessionId);
        if (idx === -1) return [...context.players, incoming];
        const next = [...context.players];
        next[idx] = incoming;
        return next;
      },
    }),
    removePlayer: assign({
      players: ({ context, event }) =>
        event.type === 'PLAYER_LEFT'
          ? context.players.filter((p) => p.sessionId !== event.sessionId)
          : context.players,
    }),
    setJoinError: assign({
      joinError: ({ event }) => (event.type === 'JOIN_ERROR' ? event.reason : null),
    }),
    setClosedReason: assign({
      closedReason: ({ event }) =>
        event.type === 'ROOM_CLOSED' ? event.reason : null,
    }),
  },
}).createMachine({
  id: 'lobby',
  initial: 'connecting',
  context: ({ input }) => ({
    roomCode: input.roomCode,
    selfSessionId: null,
    players: [],
    joinError: null,
    closedReason: null,
  }),
  states: {
    connecting: {
      on: {
        STATE_SNAPSHOT: {
          target: 'in_lobby',
          actions: 'applySnapshot',
        },
        JOIN_ERROR: {
          target: 'joining_error',
          actions: 'setJoinError',
        },
        CONNECTION_LOST: 'disconnected',
      },
    },
    in_lobby: {
      on: {
        STATE_SNAPSHOT: { actions: 'applySnapshot' },
        PLAYER_JOINED: { actions: 'upsertPlayer' },
        PLAYER_UPDATED: { actions: 'upsertPlayer' },
        PLAYER_LEFT: { actions: 'removePlayer' },
        KICKED: 'kicked',
        ROOM_CLOSED: {
          target: 'room_closed',
          actions: 'setClosedReason',
        },
        GAME_STARTED_STUB: 'game_starting',
        CONNECTION_LOST: 'disconnected',
      },
    },
    disconnected: {
      on: {
        CONNECTION_RESTORED: 'connecting',
        STATE_SNAPSHOT: {
          target: 'in_lobby',
          actions: 'applySnapshot',
        },
        ROOM_CLOSED: {
          target: 'room_closed',
          actions: 'setClosedReason',
        },
        KICKED: 'kicked',
      },
    },
    joining_error: {
      type: 'final',
    },
    kicked: {
      type: 'final',
    },
    room_closed: {
      type: 'final',
    },
    game_starting: {
      type: 'final',
    },
  },
});
