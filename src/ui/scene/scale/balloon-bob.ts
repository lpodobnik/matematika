// A balloon's gentle bob (story 1.15): it floats a few scene units up and down over about
// 2 s, on its string, so it reads as a balloon pulling up. Presentation only: the scene
// moves the balloon's container on the Pixi ticker and stretches its string to stay tied
// to the pan; nothing is redrawn and the store never hears of it. There is no bob under
// `prefers-reduced-motion`.

export const balloonBob = {
  /** How far it rises and sinks from where it is laid out, in scene units. */
  amplitude: 4,
  /** One rise and fall. */
  periodMs: 2000,
} as const;

/**
 * Where the balloon is at `timeMs`, in scene units from its laid-out place (negative is up),
 * starting at `phase` radians into its bob; always 0 under reduced motion.
 */
export function bobOffset(timeMs: number, phase: number, reducedMotion: boolean): number {
  if (reducedMotion || !Number.isFinite(timeMs)) return 0;
  return -balloonBob.amplitude * Math.sin((2 * Math.PI * timeMs) / balloonBob.periodMs + phase);
}

/** A phase for a piece's key, the same every time, so balloons side by side bob out of step. */
export function bobPhase(key: string): number {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 9973;
  return (hash / 9973) * 2 * Math.PI;
}

/**
 * How much the string, drawn from the knot at `knot` (negative, above the pan) down to the
 * pan at 0, is stretched upright so it reaches the balloon `offset` away and stays on the pan.
 */
export function stringStretch(knot: number, offset: number): number {
  if (!(knot < 0)) return 1;
  return Math.max(0, (knot + offset) / knot);
}
