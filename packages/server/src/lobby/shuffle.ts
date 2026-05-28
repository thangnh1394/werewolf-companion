/**
 * Shuffle utilities for card dealing.
 *
 * cryptoShuffle uses crypto.getRandomValues() for fair randomness — no one
 * can predict or bias the deal. Fisher-Yates with rejection sampling to
 * avoid modulo bias.
 */

export type ShuffleFn = <T>(arr: T[]) => T[];

/**
 * Returns a uniformly random integer in [0, maxExclusive) using
 * crypto.getRandomValues with rejection sampling to avoid modulo bias.
 */
function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0]!;
  } while (x >= limit);
  return x % maxExclusive;
}

/**
 * Fisher-Yates shuffle using cryptographic randomness.
 * Returns a new array; does not mutate the input.
 */
export const cryptoShuffle: ShuffleFn = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
};
