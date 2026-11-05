// A small seeded generator (mulberry32). Its whole state is one unsigned 32-bit integer,
// so a fight can carry it as plain data and a resumed fight rolls the same dice.
// Pure folders never call Math.random(); randomness enters through `ctx.rng` (architecture,
// Consistency Rules), which the store builds with `createRng`.

/** A source of uniform numbers in [0, 1). */
export interface Rng {
  next(): number;
}

/** An `Rng` whose state can be read back, to save it or hand it to a fight. */
export interface SeededRng extends Rng {
  readonly state: number;
}

const increment = 0x6d2b79f5;
const twoTo32 = 4_294_967_296;

/** Turns any number into a valid generator state (an unsigned 32-bit integer). */
export function toRngState(seed: number): number {
  return Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : 0;
}

/** One step of mulberry32: the next uniform number in [0, 1) and the state after it. */
export function stepRng(state: number): { value: number; state: number } {
  const next = (toRngState(state) + increment) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / twoTo32, state: next };
}

export function createRng(seed: number): SeededRng {
  let state = toRngState(seed);
  return {
    next() {
      const step = stepRng(state);
      state = step.state;
      return step.value;
    },
    get state() {
      return state;
    },
  };
}

/** A whole number from 0 to `count − 1`. */
export function randomIndex(rng: Rng, count: number): number {
  return Math.min(count - 1, Math.floor(rng.next() * count));
}

/** A fresh generator state drawn from another generator, such as `ctx.rng`. */
export function seedFrom(rng: Rng): number {
  return Math.floor(rng.next() * twoTo32) >>> 0;
}
