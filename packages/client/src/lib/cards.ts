import { CARDS } from '@werewolf/shared';

/**
 * Returns true if cardId is a known card ID from the shared CARDS list.
 * Used for client-side defense before sending SET_CARD_COUNT.
 */
export function isValidCardId(id: string): boolean {
  return CARDS.some((c) => c.id === id);
}
