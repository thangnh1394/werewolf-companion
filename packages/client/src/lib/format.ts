/**
 * Formats a 6-digit code as "482 915" for readability.
 */
export function formatRoomCode(code: string): string {
  if (code.length !== 6) return code;
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/**
 * Returns the full shareable URL for a room.
 * Used in QR code and copy-to-clipboard.
 */
export function buildShareUrl(code: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://werewolf-companion.local';
  return `${origin}/?code=${code}`;
}

/**
 * Returns initials from a display name. Used for avatar circles.
 * "Hoàng" -> "H", "Nguyễn Văn A" -> "N"
 */
export function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}
