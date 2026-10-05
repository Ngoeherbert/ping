/**
 * Deterministic pseudo-random helpers.
 *
 * Every generator in the data layer pulls from a seeded stream so that the
 * same seed always produces the same dataset. That makes mock data stable
 * between reloads and repeatable in tests.
 *
 * The algorithm is mulberry32: small, fast, and good enough for mock data.
 * It is NOT cryptographically secure and must not be used for anything that
 * matters (tokens, passwords, real randomness).
 */

/**
 * @typedef {Object} Rng
 * @property {() => number} next A float in [0, 1).
 * @property {(min: number, max: number) => number} int Inclusive integer range.
 * @property {() => boolean} bool
 * @property {<T>(items: readonly T[]) => T} pick
 * @property {<T>(items: readonly T[], count?: number) => T[]} sample `count` distinct items, capped at the pool size.
 * @property {<T>(items: readonly T[], weights: readonly number[]) => T} weighted
 * @property {() => string} id Monotonic, prefixed ids like "u_7".
 * @property {(chance: number) => boolean} chance True with the given probability.
 * @property {(min: number, max: number) => number} float
 */

/**
 * Build a seeded random stream.
 *
 * @param {string|number} [seed] Same seed always yields the same sequence.
 * @param {string} [prefix] Id prefix used by `rng.id()`, e.g. "u".
 * @returns {Rng}
 */
export function createRng(seed = "ping", prefix = "x") {
  // Hash the seed into a 32-bit integer so string seeds work as well as numbers.
  let h = 2166136261 >>> 0;
  const seedText = String(seed);
  for (let i = 0; i < seedText.length; i += 1) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }

  let state = h >>> 0;
  let counter = 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min, max) => {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return lo + Math.floor(next() * (hi - lo + 1));
  };

  const float = (min, max) => min + next() * (max - min);

  /** @type {Rng} */
  const rng = {
    next,
    int,
    float,
    bool: () => next() < 0.5,
    chance: (p) => next() < p,
    id: () => `${prefix}_${(counter += 1)}`,
    pick: (items) => items[Math.floor(next() * items.length)],
    sample: (items, count) => {
      const pool = items.slice();
      const take = Math.min(count, pool.length);
      const out = [];
      for (let i = 0; i < take; i += 1) {
        out.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
      }
      return out;
    },
    weighted: (items, weights) => {
      const total = weights.reduce((sum, w) => sum + w, 0);
      let roll = next() * total;
      for (let i = 0; i < items.length; i += 1) {
        roll -= weights[i];
        if (roll <= 0) return items[i];
      }
      return items[items.length - 1];
    },
  };

  return rng;
}

/**
 * Shuffle a copy of `items` without mutating the input.
 * @template T
 * @param {readonly T[]} items
 * @param {Rng} rng
 * @returns {T[]}
 */
export function shuffled(items, rng) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/**
 * Fill an array by calling `make` `count` times.
 * @template T
 * @param {number} count
 * @param {(i: number) => T} make
 * @returns {T[]}
 */
export function times(count, make) {
  return Array.from({ length: Math.max(0, Math.floor(count)) }, (_, i) => make(i));
}