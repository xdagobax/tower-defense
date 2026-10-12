export interface Rng {
  next(): number;
  int(minInclusive: number, maxExclusive: number): number;
}

export function createRng(seed = 1): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(minInclusive: number, maxExclusive: number): number {
      return Math.floor(next() * (maxExclusive - minInclusive)) + minInclusive;
    },
  };
}
