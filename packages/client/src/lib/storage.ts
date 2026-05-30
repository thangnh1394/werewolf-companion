/**
 * localStorage helpers with safe fallback.
 *
 * Some browsers (iOS Safari private mode) throw on localStorage.setItem.
 * We catch silently — pre-filling a name is a nice-to-have, not critical.
 */

import { STORAGE_KEYS } from '@werewolf/shared';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Quota exceeded or storage disabled — silently ignore.
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ---------- Session ID ----------

/**
 * Returns the persistent session ID for this browser, creating one on first call.
 * Used to identify the same user across page refreshes (so they can rejoin a room).
 */
export function getOrCreateSessionId(): string {
  const existing = safeGet(STORAGE_KEYS.sessionId);
  if (existing && isValidUuid(existing)) return existing;
  const fresh = crypto.randomUUID();
  safeSet(STORAGE_KEYS.sessionId, fresh);
  return fresh;
}

function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// ---------- Display name ----------

export function getSavedDisplayName(): string {
  return safeGet(STORAGE_KEYS.displayName) ?? '';
}

export function saveDisplayName(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  safeSet(STORAGE_KEYS.displayName, trimmed);
}

// ---------- Last room code (for session restore on refresh) ----------

export function getLastRoomCode(): string | null {
  return safeGet(STORAGE_KEYS.lastRoomCode);
}

export function saveLastRoomCode(code: string): void {
  safeSet(STORAGE_KEYS.lastRoomCode, code);
}

export function clearLastRoomCode(): void {
  safeRemove(STORAGE_KEYS.lastRoomCode);
}

// ---------- Avatar id ----------

export function getSavedAvatarId(): string | null {
  return safeGet(STORAGE_KEYS.avatarId);
}

export function saveAvatarId(avatarId: string): void {
  if (!avatarId) return;
  safeSet(STORAGE_KEYS.avatarId, avatarId);
}
