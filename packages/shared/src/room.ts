import { z } from 'zod';
import {
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  ROOM_CODE_PATTERN,
} from './constants.js';

/**
 * Domain primitives.
 */

export const RoomCodeSchema = z
  .string()
  .regex(ROOM_CODE_PATTERN, 'Code must be exactly 6 digits');
export type RoomCode = z.infer<typeof RoomCodeSchema>;

export const SessionIdSchema = z.string().uuid();
export type SessionId = z.infer<typeof SessionIdSchema>;

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(MIN_NAME_LENGTH, 'Name is required')
  .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`);
export type DisplayName = z.infer<typeof DisplayNameSchema>;

/**
 * Public player view — what every client sees about every other player.
 * Never includes private data (card assignment, etc.). Phase 2 will add a
 * separate "private state" channel for card info.
 */
export const PublicPlayerSchema = z.object({
  sessionId: SessionIdSchema,
  displayName: DisplayNameSchema,
  /** Avatar id from @werewolf/shared AVATARS (optional for backward compat with pre-Phase-3.3 rooms). */
  avatarId: z.string().optional(),
  isReady: z.boolean(),
  isHost: z.boolean(),
  joinedAt: z.number().int(), // epoch ms, used for stable join-order sorting
  isConnected: z.boolean(),
});
export type PublicPlayer = z.infer<typeof PublicPlayerSchema>;

/**
 * Lobby phase. Phase 1 only uses 'lobby'. Phase 2 will introduce 'playing'.
 */
export const RoomPhaseSchema = z.enum(['lobby', 'playing']);
export type RoomPhase = z.infer<typeof RoomPhaseSchema>;

/**
 * Reasons a room may close. Used in the ROOM_CLOSED message.
 */
export const RoomClosedReasonSchema = z.enum([
  'host_left',
  'host_timeout',
  'idle_ttl',
  'host_manually_closed',
]);
export type RoomClosedReason = z.infer<typeof RoomClosedReasonSchema>;

/**
 * Reasons a join attempt may fail.
 */
export const JoinErrorReasonSchema = z.enum([
  'room_full',
  'room_not_found',
  'room_in_progress',
  'invalid_code',
  'invalid_name',
]);
export type JoinErrorReason = z.infer<typeof JoinErrorReasonSchema>;
