// Where the placeholder machine sits in the 1600 × 1000 logical scene: above the scale's
// pivot, between the pans, clear of the needle and of pieces stacked on the pans.
// Presentation only: what it shows comes from room/machine.ts.

import type { MachineShape } from '@/art/skins/machine';

export const machineGeometry = {
  /** The opening's top-left corner. */
  x: 680,
  y: 150,
  shape: { width: 240, height: 260, housing: 70, post: 26 } satisfies MachineShape,
} as const;

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** The whole machine's box in the scene: frame, housing, sill and the jam's wedge and steam. */
export function machineBounds(geometry = machineGeometry): Bounds {
  const { x, y, shape } = geometry;
  const { width, height, housing, post } = shape;
  return {
    left: x - post * 1.5,
    // The steam lines reach about this far right of the door.
    right: x + width + post + 60,
    top: y - housing,
    bottom: y + height + post * 0.6,
  };
}

/** How far up the door is, in scene units, at a progress from 0 (shut) to 1 (open). */
export function doorLift(progress: number, geometry = machineGeometry): number {
  const clamped = Math.max(0, Math.min(1, progress));
  return clamped * geometry.shape.height;
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
