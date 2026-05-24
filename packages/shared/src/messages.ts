import { z } from 'zod';
import {
  DisplayNameSchema,
  JoinErrorReasonSchema,
  PublicPlayerSchema,
  RoomClosedReasonSchema,
  RoomPhaseSchema,
  SessionIdSchema,
} from './room.js';

/**
 * All WebSocket messages between client and server are typed and validated
 * via these Zod schemas. Both sides import this file. If the contract changes,
 * it changes here once.
 *
 * Convention:
 * - Client → Server: imperative verbs (JOIN, SET_READY, KICK_PLAYER, START_GAME)
 * - Server → Client: events / snapshots (STATE_SNAPSHOT, PLAYER_JOINED, ROOM_CLOSED)
 */

// ---------- Client → Server messages ----------

export const JoinMessageSchema = z.object({
  type: z.literal('JOIN'),
  sessionId: SessionIdSchema,
  displayName: DisplayNameSchema,
  /**
   * 6-digit code the user entered. The server validates this matches the
   * room they're connecting to (the room ID comes from the URL path).
   * If the room has no host yet (room is being created), the client
   * passes `isHost: true` to claim it.
   */
  isHost: z.boolean(),
});
export type JoinMessage = z.infer<typeof JoinMessageSchema>;

export const SetReadyMessageSchema = z.object({
  type: z.literal('SET_READY'),
  isReady: z.boolean(),
});
export type SetReadyMessage = z.infer<typeof SetReadyMessageSchema>;

export const KickPlayerMessageSchema = z.object({
  type: z.literal('KICK_PLAYER'),
  targetSessionId: SessionIdSchema,
});
export type KickPlayerMessage = z.infer<typeof KickPlayerMessageSchema>;

export const StartGameMessageSchema = z.object({
  type: z.literal('START_GAME'),
});
export type StartGameMessage = z.infer<typeof StartGameMessageSchema>;

export const LeaveRoomMessageSchema = z.object({
  type: z.literal('LEAVE_ROOM'),
});
export type LeaveRoomMessage = z.infer<typeof LeaveRoomMessageSchema>;

export const ClientMessageSchema = z.discriminatedUnion('type', [
  JoinMessageSchema,
  SetReadyMessageSchema,
  KickPlayerMessageSchema,
  StartGameMessageSchema,
  LeaveRoomMessageSchema,
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// ---------- Server → Client messages ----------

/**
 * Full snapshot of room state. Sent immediately after a successful JOIN.
 * Client uses this to hydrate its UI.
 */
export const StateSnapshotMessageSchema = z.object({
  type: z.literal('STATE_SNAPSHOT'),
  roomCode: z.string(),
  phase: RoomPhaseSchema,
  players: z.array(PublicPlayerSchema),
  /** sessionId of the requesting client — they may need to identify themselves in the list */
  selfSessionId: SessionIdSchema,
});
export type StateSnapshotMessage = z.infer<typeof StateSnapshotMessageSchema>;

/**
 * Sent when a join attempt fails. Connection will be closed by server after this.
 */
export const JoinErrorMessageSchema = z.object({
  type: z.literal('JOIN_ERROR'),
  reason: JoinErrorReasonSchema,
});
export type JoinErrorMessage = z.infer<typeof JoinErrorMessageSchema>;

export const PlayerJoinedMessageSchema = z.object({
  type: z.literal('PLAYER_JOINED'),
  player: PublicPlayerSchema,
});
export type PlayerJoinedMessage = z.infer<typeof PlayerJoinedMessageSchema>;

export const PlayerLeftMessageSchema = z.object({
  type: z.literal('PLAYER_LEFT'),
  sessionId: SessionIdSchema,
});
export type PlayerLeftMessage = z.infer<typeof PlayerLeftMessageSchema>;

export const PlayerUpdatedMessageSchema = z.object({
  type: z.literal('PLAYER_UPDATED'),
  player: PublicPlayerSchema,
});
export type PlayerUpdatedMessage = z.infer<typeof PlayerUpdatedMessageSchema>;

/**
 * Sent only to the kicked player, just before their connection is closed.
 */
export const KickedMessageSchema = z.object({
  type: z.literal('KICKED'),
});
export type KickedMessage = z.infer<typeof KickedMessageSchema>;

export const RoomClosedMessageSchema = z.object({
  type: z.literal('ROOM_CLOSED'),
  reason: RoomClosedReasonSchema,
});
export type RoomClosedMessage = z.infer<typeof RoomClosedMessageSchema>;

/**
 * Phase 1 placeholder: when host starts the game, server broadcasts this so
 * everyone sees the "Phase 2 will be here" stub. Phase 2 will replace this
 * with the real card-dealing flow.
 */
export const GameStartedStubMessageSchema = z.object({
  type: z.literal('GAME_STARTED_STUB'),
});
export type GameStartedStubMessage = z.infer<typeof GameStartedStubMessageSchema>;

export const ServerMessageSchema = z.discriminatedUnion('type', [
  StateSnapshotMessageSchema,
  JoinErrorMessageSchema,
  PlayerJoinedMessageSchema,
  PlayerLeftMessageSchema,
  PlayerUpdatedMessageSchema,
  KickedMessageSchema,
  RoomClosedMessageSchema,
  GameStartedStubMessageSchema,
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
