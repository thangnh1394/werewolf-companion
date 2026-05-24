/**
 * Generates a 6-digit room code.
 * Range: 000000 - 999999 (1,000,000 possible codes).
 * For our use case (1-10 simultaneous rooms), collisions are statistically negligible.
 *
 * Note: this is the client-side helper. The server-side LobbyServer treats the
 * room ID (which IS the code) as authoritative — if a client tries to create a
 * room whose code is already in use, the existing room's host claim wins.
 */
export function generateRoomCode(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return n.toString().padStart(6, '0');
}
