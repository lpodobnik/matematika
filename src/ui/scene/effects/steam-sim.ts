// The placeholder steam (architecture, ui/scene/effects): puffs leave a vent, rise and drift,
// growing and fading, and start again at the vent when they fade out. The puffs are plain
// objects, stepped in place every frame and copied onto Pixi particles by Steam.tsx, so
// nothing per frame goes through React (rule 6). Presentation only: whether it runs is the
// quality setting's (art/quality.ts).

export interface SteamSpec {
  /** Where puffs start, in the parent container's units. */
  origin: { x: number; y: number };
  /** Puffs in the plume at once. */
  count: number;
  /** A puff's life, from the vent until it has faded out. */
  lifeMs: number;
  /** Upward speed, in units per second. */
  rise: number;
  /** Sideways speed in units per second (negative: left), plus up to ± `spread` at random. */
  drift: number;
  spread: number;
  /** A puff's size, as a scale of its texture, when it leaves the vent and when it fades. */
  startScale: number;
  endScale: number;
  /** A puff's alpha at its strongest. */
  alpha: number;
  /** The puff texture's radius at scale 1. */
  radius: number;
}

export interface Puff {
  x: number;
  y: number;
  /** Its own sideways speed, in units per second. */
  vx: number;
  /** Time since it left the vent. */
  age: number;
  scale: number;
  alpha: number;
}

/** A source of uniform numbers in [0, 1). */
export type Random = () => number;

/**
 * The longest step one frame advances the plume: after a stall (or a hidden tab) the puffs
 * carry on where they were instead of jumping.
 */
export const maxStepMs = 100;

/** A puff fades in over this share of its life, then fades out over the rest. */
const fadeInShare = 0.15;

/** A puff's size and alpha at `t`, from 0 (at the vent) to 1 (faded out). */
export function puffLook(t: number, spec: SteamSpec): { scale: number; alpha: number } {
  const clamped = Math.max(0, Math.min(1, t));
  const fadeIn = Math.min(1, clamped / fadeInShare);
  return {
    scale: spec.startScale + (spec.endScale - spec.startScale) * clamped,
    alpha: spec.alpha * fadeIn * (1 - clamped),
  };
}

function place(puff: Puff, spec: SteamSpec): void {
  const seconds = puff.age / 1000;
  puff.x = spec.origin.x + puff.vx * seconds;
  puff.y = spec.origin.y - spec.rise * seconds;
  const look = puffLook(puff.age / spec.lifeMs, spec);
  puff.scale = look.scale;
  puff.alpha = look.alpha;
}

function sidewaysSpeed(spec: SteamSpec, random: Random): number {
  return spec.drift + (random() * 2 - 1) * spec.spread;
}

/** A full plume, its puffs' ages spread evenly over a life, so it looks steady at once. */
export function createPuffs(spec: SteamSpec, random: Random): Puff[] {
  return Array.from({ length: spec.count }, (_, i) => {
    const puff: Puff = {
      x: 0,
      y: 0,
      vx: sidewaysSpeed(spec, random),
      age: (i / spec.count) * spec.lifeMs,
      scale: 0,
      alpha: 0,
    };
    place(puff, spec);
    return puff;
  });
}

/** Advances every puff by one frame, in place; a puff that has faded starts again at the vent. */
export function stepPuffs(puffs: Puff[], dtMs: number, spec: SteamSpec, random: Random): void {
  const dt = Number.isFinite(dtMs) ? Math.max(0, Math.min(maxStepMs, dtMs)) : 0;
  for (const puff of puffs) {
    puff.age += dt;
    if (puff.age >= spec.lifeMs) {
      puff.age %= spec.lifeMs;
      puff.vx = sidewaysSpeed(spec, random);
    }
    place(puff, spec);
  }
}

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** The box any puff can reach, at its full size, in the parent container's units. */
export function plumeBounds(spec: SteamSpec): Bounds {
  const seconds = spec.lifeMs / 1000;
  const reach = spec.radius * Math.max(spec.startScale, spec.endScale);
  return {
    left: spec.origin.x + Math.min(0, spec.drift - spec.spread) * seconds - reach,
    right: spec.origin.x + Math.max(0, spec.drift + spec.spread) * seconds + reach,
    top: spec.origin.y - spec.rise * seconds - reach,
    bottom: spec.origin.y + reach,
  };
}
