// The city's shared clock and key (GDD, Audio and Music; architecture, Audio Architecture).
// Every machine loop is a 16-step bar at one tempo, on one grid that starts when the sound
// does, so a loop that joins lands on the next bar and every restored machine plays in time
// with the others. Every pitch is in D major pentatonic, which has no two notes that clash,
// so any mix of loops sounds like one tune. Pure: no Web Audio here.

/** Beats a minute (architecture: provisional 96). */
export const BPM = 96;
/** Steps in a bar: sixteenth notes, four to a beat. */
export const STEPS = 16;
/** One step, in seconds. */
export const stepSeconds = 60 / BPM / 4;
/** One bar, in seconds (2.5 s at 96 BPM). */
export const barSeconds = stepSeconds * STEPS;

/** D major pentatonic, in semitones above D: D E F# A B. */
const SCALE = [0, 2, 4, 7, 9] as const;
/** Degree 0: D3. */
const BASE_HZ = 146.83;

/**
 * The frequency of a scale degree: 0 is D3, 1 is E3, 5 is D4, -5 is D2 and so on, so every
 * note any loop plays is in the key.
 */
export function frequency(degree: number): number {
  const octave = Math.floor(degree / SCALE.length);
  const index = degree - octave * SCALE.length;
  const semitones = (SCALE[index] ?? 0) + 12 * octave;
  return BASE_HZ * 2 ** (semitones / 12);
}

/** The first bar line at or after `at`, on the grid that started at `origin` (seconds). */
export function nextBarAt(origin: number, at: number): number {
  if (at <= origin) return origin;
  const bars = Math.ceil((at - origin) / barSeconds - 1e-9);
  return origin + bars * barSeconds;
}

/** A step on the grid: its number since the grid started, and when it sounds. */
export interface GridStep {
  index: number;
  time: number;
}

/**
 * The steps that sound in [from, to) on the grid that started at `origin`: what one pass
 * of the lookahead scheduler plays. Steps before the origin never sound.
 */
export function stepsBetween(origin: number, from: number, to: number): GridStep[] {
  // The first step at or after `from`, by the same sum as each step's time below, so windows
  // that meet at a step never both play it or both miss it.
  const timeOf = (index: number) => origin + index * stepSeconds;
  let start = Math.max(0, Math.ceil((from - origin) / stepSeconds));
  while (start > 0 && timeOf(start - 1) >= from) start -= 1;
  while (timeOf(start) < from) start += 1;
  const steps: GridStep[] = [];
  for (let index = start; ; index += 1) {
    const time = timeOf(index);
    if (time >= to) break;
    steps.push({ index, time });
  }
  return steps;
}
