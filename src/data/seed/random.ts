// SPDX-License-Identifier: EUPL-1.2

export interface Random {
  next: () => number;
  chance: (probability: number) => boolean;
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
}

/** Mulberry32: tiny seeded PRNG, so the demo data is identical after every reset. */
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    chance: (probability) => next() < probability,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => {
      const item = items[Math.floor(next() * items.length)];
      if (item === undefined) throw new Error('Cannot pick from an empty list');
      return item;
    },
  };
}
