// The little one follows him (story 7.4): along the spots he has just been on, so it stays on the
// ground without finding its own way, and it keeps a short gap behind him. Pure, so that it can
// be tested; the town's loop runs it every frame and moves the figure through its element.

import type { Point } from '@/city/walk';

export interface FollowTuning {
  /** How far behind him it keeps, in town units. */
  gap: number;
  /** Its top speed, in town units a second. */
  speed: number;
  /** How far he moves before a new spot is kept on the trail. */
  spacing: number;
}

export interface FollowState {
  at: Point;
  /** His recent spots, oldest first, ending with where he last was. */
  trail: readonly Point[];
  facing: 1 | -1;
  moving: boolean;
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * It starts beside him, `beside` to his left where he can see it, and stays until he moves. With
 * nothing beside, it starts where he is.
 */
export function startFollow(at: Point, beside = 0): FollowState {
  const spot = { x: Math.max(beside / 3, at.x - beside), y: at.y + beside / 8 };
  return { at: beside > 0 ? spot : at, trail: [at], facing: 1, moving: false };
}

/** The trail's length from `from` on, through its later spots, to where he is now. */
function lengthTo(trail: readonly Point[], from: number, leader: Point): number {
  let length = 0;
  for (let i = from; i < trail.length; i++) {
    const next = trail[i + 1] ?? leader;
    length += distance(trail[i] as Point, next);
  }
  return length;
}

export function followStep(
  state: FollowState,
  leader: Point,
  dt: number,
  tuning: FollowTuning,
): FollowState {
  const last = state.trail[state.trail.length - 1];
  const moved = !last || distance(last, leader) >= tuning.spacing;
  let trail: Point[] = moved ? [...state.trail, leader] : [...state.trail];
  // Spots closer than the gap stay ahead of it; it heads for the furthest one that keeps it.
  while (trail.length > 1 && lengthTo(trail, 1, leader) >= tuning.gap) trail = trail.slice(1);
  const target = trail[0] as Point;
  const away = distance(state.at, target);
  // Close enough to him, it stops, rather than walking into him.
  if (lengthTo(trail, 0, leader) + away < tuning.gap || away < 1) {
    return { ...state, trail, moving: false };
  }
  const step = tuning.speed * dt;
  const dx = target.x - state.at.x;
  const facing = Math.abs(dx) > 2 ? (dx > 0 ? 1 : -1) : state.facing;
  if (away <= step) return { at: target, trail, facing, moving: true };
  const at = {
    x: state.at.x + (dx / away) * step,
    y: state.at.y + ((target.y - state.at.y) / away) * step,
  };
  return { at, trail, facing, moving: true };
}
