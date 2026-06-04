/**
 * Constants shared between client and server.
 * Any rule that needs to be enforced on both sides lives here.
 */

export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_PATTERN = /^\d{6}$/;

export const MIN_PLAYERS = 6;
export const MAX_PLAYERS = 20;

export const MIN_NAME_LENGTH = 1;
export const MAX_NAME_LENGTH = 20;

/** How long the server waits for the host to reconnect before closing the room. */
export const HOST_DISCONNECT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/** How long the room can be completely idle before auto-cleanup. */
export const ROOM_IDLE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Reconnect grace window for any player (not just host). */
export const PLAYER_DISCONNECT_GRACE_MS = 10 * 1000; // 10 seconds

/** localStorage keys. */
export const STORAGE_KEYS = {
  sessionId: 'wwc.sessionId',
  displayName: 'wwc.displayName',
  lastRoomCode: 'wwc.lastRoomCode',
  avatarId: 'wwc.avatarId',
} as const;
