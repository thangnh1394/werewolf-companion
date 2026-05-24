import { useState } from 'react';
import { getSavedDisplayName, saveDisplayName } from '../lib/storage';

/**
 * Returns the saved name (or empty), with a setter that also persists it.
 * Updates to localStorage are debounced behind explicit `persist()` calls
 * so we only save when the user actually submits.
 */
export function usePersistedName(): {
  name: string;
  setName: (next: string) => void;
  persist: () => void;
} {
  const [name, setName] = useState<string>(() => getSavedDisplayName());

  const persist = () => {
    if (name.trim()) saveDisplayName(name);
  };

  return { name, setName, persist };
}
