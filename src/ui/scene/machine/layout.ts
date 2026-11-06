// Where the placeholder machine sits in the 1600 × 1000 logical scene: above the scale's
// pivot, between the pans, clear of the needle and of pieces stacked on the pans; and how
// long and how it moves when a stage locks and when the whole machine restarts.
// Presentation only: what it shows comes from room/machine.ts and room/phases.ts.

import {
  type LatchBar,
  lampRayReach,
  latchBar,
  type MachineShape,
  ventLeft,
  ventOutlet,
} from '@/art/skins/machine';
import { tuning } from '@/config/tuning';
import type { Presentation } from '@/room/phases';
import { plumeBounds, type SteamSpec } from '@/ui/scene/effects/steam-sim';

export const machineGeometry = {
  /** The opening's top-left corner. */
  x: 680,
  y: 150,
  shape: {
    width: 240,
    height: 260,
    housing: 70,
    post: 26,
    lamp: 20,
    lampPost: 12,
    vent: 14,
  } satisfies MachineShape,
} as const;

/**
 * The placeholder steam effect (story 1.12), relative to the machine's origin: puffs rise
 * from the vent on the housing's left end and drift a little left, away from the lamps. The
 * plume stays above the housing, under the lamps' rays, and right of the splitter's holder
 * in the scene's top-left corner (story 1.11), even on a phone, where the holder is widest.
 * It runs at the `high` and `medium` quality settings.
 */
export const machineSteam: SteamSpec = {
  origin: ventOutlet(machineGeometry.shape),
  count: 16,
  lifeMs: 2000,
  rise: 16,
  drift: -3,
  spread: 3,
  startScale: 0.35,
  endScale: 1,
  alpha: 0.5,
  radius: 16,
};

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * The lamps' centres, relative to the machine's origin: one per part, spread evenly along
 * the top of the housing, first on the left.
 */
export function lampPositions(count: number, geometry = machineGeometry): Point[] {
  const { width, housing, post, lamp, lampPost } = geometry.shape;
  const left = -post * 1.5;
  const span = width + post * 3;
  const y = -housing - lampPost - lamp;
  return Array.from({ length: count }, (_, i) => ({ x: left + ((i + 1) * span) / (count + 1), y }));
}

/** The housing's two pulleys, relative to the machine's origin. */
export function pulleyPositions(geometry = machineGeometry): Point[] {
  const { width, housing } = geometry.shape;
  return [
    { x: width * 0.25, y: -housing / 2 },
    { x: width * 0.75, y: -housing / 2 },
  ];
}

/**
 * The whole machine's box in the scene: frame, housing, lit lamps' rays, sill, the jam's
 * wedge and steam lines, and the vent with its plume of steam.
 */
export function machineBounds(geometry = machineGeometry, steam = machineSteam): Bounds {
  const { x, y, shape } = geometry;
  const { width, height, housing, post, lamp, lampPost } = shape;
  const plume = plumeBounds(steam);
  return {
    left: x + Math.min(-post * 1.5, ventLeft(shape), plume.left),
    // The jam's steam lines reach about this far right of the door.
    right: x + width + post + 60,
    top: y + Math.min(-housing - lampPost - lamp - lampRayReach(shape), plume.top),
    bottom: y + height + post * 0.6,
  };
}

/** How far up the door is, in scene units, at a share of its travel from 0 (shut) to 1 (open). */
export function doorLift(travel: number, geometry = machineGeometry): number {
  const clamped = Math.max(0, Math.min(1, travel));
  return clamped * geometry.shape.height;
}

/**
 * The share of its travel the door rises to at a machine progress (story 1.14). While the
 * latch holds it, only `tuning.doorLiftBeforeLock` of its travel: progress × that share, so
 * the answer line's 0.9 isn't a door nearly open. Once the latch is out, all the way to the
 * progress, which the check line has set to 1.
 */
export function doorTravel(
  progress: number,
  latched: boolean,
  share: number = tuning.doorLiftBeforeLock,
): number {
  const clamped = Math.max(0, Math.min(1, progress));
  return latched ? clamped * share : clamped;
}

/** The latch bar of the placeholder machine, set by the door's lift before the lock. */
export const machineLatch: LatchBar = latchBar(machineGeometry.shape, tuning.doorLiftBeforeLock);

/**
 * Whether the latch rattles: a line has just brought the machine to the answer line's
 * progress, short of the check line's 1 that locks it, so the door is up against the bar
 * and one more line is needed.
 */
export function latchRattles(before: number, after: number): boolean {
  return before < tuning.progressAnswer && after >= tuning.progressAnswer && after < 1;
}

/** The latch rattles once the door has risen against it… */
export const latchRattleDelayMs = 450;
/** …for this long. */
export const latchRattleMs = 420;

/**
 * The latch's sideways rattle, in scene units, at `t` from 0 to 1: a few small quick
 * knocks that die away, ending where it started. Only the latch moves, not the machine.
 */
export function latchRattle(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return Math.sin(clamped * Math.PI * 8) * (1 - clamped) * 6;
}

/** When the stage locks, the latch slides out in this long, and only then the door rises. */
export const latchSlideMs = 380;

/**
 * At the next stage the latch slides back in once the door is down: this long after the
 * stage starts, which lets the door's spring bring it down first.
 */
export const latchReturnDelayMs = 700;

/**
 * The latch's slide out, as its offset from where it holds the door, at `t` from 0 to 1:
 * eased, from 0 to its whole travel to the left.
 */
export function latchSlide(t: number, bar: LatchBar = machineLatch): number {
  const clamped = Math.max(0, Math.min(1, t));
  const eased = clamped * clamped * (3 - 2 * clamped);
  return -eased * bar.travel;
}

/** How long the machine shakes when it jams. */
export const joltMs = 360;

/**
 * The machine's sideways shake when it jams, in scene units, at `t` from 0 to 1: a few
 * quick swings that die away, ending where it started.
 */
export function joltOffset(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return Math.sin(clamped * Math.PI * 6) * (1 - clamped) * 12;
}

/**
 * How long each presentation plays before the machine reports it done
 * (`presentation/done`): a stage's lock slides the latch out, lets the door rise all the
 * way and its lamp light, and shows the open door a moment; the restart shows the whole
 * machine running. Both are well inside `tuning.presentationTimeoutMs`, the fallback.
 */
export const presentationMs: Readonly<Record<Presentation, number>> = {
  locked: 2200,
  restart: 3600,
};

/**
 * A lamp lights this long after its stage locks, once the latch is out and the door is
 * mostly up…
 */
export const lampDelayMs = 850;
/** …and takes this long to come on. */
export const lampLightMs = 700;

/**
 * A lamp coming on, at `t` from 0 to 1: its light fades in and swells past full size, then
 * settles at full size.
 */
export function lampGlow(t: number): { alpha: number; scale: number } {
  const clamped = Math.max(0, Math.min(1, t));
  const alpha = Math.min(1, clamped * 2);
  const scale = 0.4 + 0.6 * clamped + Math.sin(clamped * Math.PI) * 0.35;
  return { alpha, scale };
}

/** One turn of a pulley while the whole machine runs. */
export const pulleyTurnMs = 1200;

/**
 * The whole machine humming as it restarts, in scene units up and down, at `t` from 0 to 1:
 * quick small beats that start and end at rest.
 */
export function runningHum(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const envelope = Math.sin(clamped * Math.PI);
  return Math.sin(clamped * Math.PI * 24) * envelope * 3;
}
