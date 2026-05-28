import { z } from 'zod';
import {
  DisplayNameSchema,
  JoinErrorReasonSchema,
  PublicPlayerSchema,
  RoomClosedReasonSchema,
  RoomPhaseSchema,
  SessionIdSchema,
} from './room.js';
import { MAX_PLAYERS } from './constants.js';

/**
 * Schema for the room desk over the wire — a record of cardId → count.
 * Only entries with count >= 1 are present; absent cards have count 0.
 */
export const RoomDeskSchema = z.record(z.string(), z.number().int().min(1).max(MAX_PLAYERS));
export type RoomDesk = z.infer<typeof RoomDeskSchema>;

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

/**
 * Host-only: set the count for a specific card in the room desk.
 * count = 0 removes the card entirely; count > 0 sets the new count.
 * Server validates that requester is host and phase === 'lobby'.
 */
export const SetCardCountMessageSchema = z.object({
  type: z.literal('SET_CARD_COUNT'),
  cardId: z.string(),
  count: z.number().int().min(0).max(MAX_PLAYERS),
});
export type SetCardCountMessage = z.infer<typeof SetCardCountMessageSchema>;

export const ClientMessageSchema = z.discriminatedUnion('type', [
  JoinMessageSchema,
  SetReadyMessageSchema,
  KickPlayerMessageSchema,
  StartGameMessageSchema,
  LeaveRoomMessageSchema,
  SetCardCountMessageSchema,
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
  /** Current room desk (cardId → count). Empty record {} when host hasn't picked anything yet. */
  roomDesk: RoomDeskSchema,
  /** The requesting player's own dealt card, if game is playing and they have one. Used for refresh restore. */
  yourCard: z.string().optional(),
});
export type StateSnapshotMessage = z.infer<typeof StateSnapshotMessageSchema>;

/**
 * Broadcast whenever the host changes the room desk composition.
 * Sent to all clients (including the host who triggered it, to confirm the change).
 */
export const RoomDeskUpdatedMessageSchema = z.object({
  type: z.literal('ROOM_DESK_UPDATED'),
  deck: RoomDeskSchema,
});
export type RoomDeskUpdatedMessage = z.infer<typeof RoomDeskUpdatedMessageSchema>;

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
 * Broadcast when the host starts the game. Carries NO card information —
 * cards are sent privately via YOUR_CARD. This only signals the phase change.
 */
export const GameStartedMessageSchema = z.object({
  type: z.literal('GAME_STARTED'),
});
export type GameStartedMessage = z.infer<typeof GameStartedMessageSchema>;

/**
 * Sent PRIVATELY to each connection (never broadcast) with that player's
 * dealt card. The cardId references CARDS in this package.
 */
export const YourCardMessageSchema = z.object({
  type: z.literal('YOUR_CARD'),
  cardId: z.string(),
});
export type YourCardMessage = z.infer<typeof YourCardMessageSchema>;

export const ServerMessageSchema = z.discriminatedUnion('type', [
  StateSnapshotMessageSchema,
  JoinErrorMessageSchema,
  PlayerJoinedMessageSchema,
  PlayerLeftMessageSchema,
  PlayerUpdatedMessageSchema,
  KickedMessageSchema,
  RoomClosedMessageSchema,
  GameStartedMessageSchema,
  YourCardMessageSchema,
  RoomDeskUpdatedMessageSchema,
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
