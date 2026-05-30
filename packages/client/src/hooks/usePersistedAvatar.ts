import { useState, useCallback } from 'react';
import { DEFAULT_AVATAR_ID } from '@werewolf/shared';
import { getSavedAvatarId, saveAvatarId } from '../lib/storage';

/**
 * Reactive avatar state synced with localStorage.
 *
 * Used in forms (CreateRoomForm, JoinRoomForm) where the user can change
 * avatar before joining a room. Returns current avatarId + setter that
 * persists to localStorage.
 *
 * Initial value: saved id from storage, or DEFAULT_AVATAR_ID if none.
 */
export function usePersistedAvatar() {
  const [avatarId, setAvatarIdState] = useState<string>(
    () => getSavedAvatarId() ?? DEFAULT_AVATAR_ID,
  );

  const setAvatarId = useCallback((id: string) => {
    setAvatarIdState(id);
    saveAvatarId(id);
  }, []);

  return { avatarId, setAvatarId };
}
