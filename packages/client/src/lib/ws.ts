import {
  type ClientMessage,
  type ServerMessage,
  ServerMessageSchema,
} from '@werewolf/shared';
import type PartySocket from 'partysocket';

/**
 * Type-safe send: validates the message will be parseable on the server.
 * Uses JSON.stringify under the hood.
 */
export function sendMessage(socket: PartySocket, message: ClientMessage): void {
  socket.send(JSON.stringify(message));
}

/**
 * Parses an incoming message string, returning the typed message or null
 * if it doesn't match any known server message schema.
 */
export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const obj = JSON.parse(raw);
    const result = ServerMessageSchema.safeParse(obj);
    if (!result.success) {
      console.warn('[ws] Received malformed server message:', result.error);
      return null;
    }
    return result.data;
  } catch (e) {
    console.warn('[ws] Failed to parse message:', e);
    return null;
  }
}

/**
 * Returns the PartyKit host URL. In dev, points to localhost; in prod,
 * to the deployed PartyKit URL (set via VITE_PARTYKIT_HOST env var).
 */
export function getPartyKitHost(): string {
  const fromEnv = import.meta.env['VITE_PARTYKIT_HOST'];
  if (fromEnv && typeof fromEnv === 'string') return fromEnv;
  // Default to localhost for dev
  return 'localhost:1999';
}
