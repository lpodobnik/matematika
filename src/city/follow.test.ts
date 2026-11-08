import { describe, expect, it } from 'vitest';
import { type FollowState, followStep, startFollow } from '@/city/follow';
import { findPath, onGround, type Point } from '@/city/walk';
import { town } from '@/content/town';

const tuning = { gap: 90, speed: 380, spacing: 12 };
const dt = 1 / 60;

/** He walks `path` at his speed, and it follows; returns every spot it stood on. */
function walk(path: readonly Point[], settle = 180): { state: FollowState; spots: Point[] } {
  const start = path[0] as Point;
  let state = startFollow(start);
  let me = start;
  const spots: Point[] = [];
  for (const next of path.slice(1)) {
    while (Math.hypot(next.x - me.x, next.y - me.y) > 320 * dt) {
      const d = Math.hypot(next.x - me.x, next.y - me.y);
      me = {
        x: me.x + ((next.x - me.x) / d) * 320 * dt,
        y: me.y + ((next.y - me.y) / d) * 320 * dt,
      };
      state = followStep(state, me, dt, tuning);
      spots.push(state.at);
    }
    me = next;
  }
  for (let i = 0; i < settle; i++) {
    state = followStep(state, me, dt, tuning);
    spots.push(state.at);
  }
  return { state, spots };
}

describe('the little one following him', () => {
  it('stays put when he does', () => {
    const at = { x: 500, y: 500 };
    let state = startFollow(at);
    for (let i = 0; i < 60; i++) state = followStep(state, at, dt, tuning);
    expect(state.at).toEqual(at);
    expect(state.moving).toBe(false);
  });

  it('keeps about its gap behind him, and stops when he stops', () => {
    const end = { x: 900, y: 500 };
    const { state } = walk([{ x: 200, y: 500 }, end]);
    const gap = Math.hypot(end.x - state.at.x, end.y - state.at.y);
    expect(gap).toBeGreaterThan(60);
    expect(gap).toBeLessThan(130);
    expect(state.moving).toBe(false);
    expect(state.facing).toBe(1);
  });

  it('starts beside him where it can be seen, and stays until he moves', () => {
    const at = { x: 500, y: 500 };
    let state = startFollow(at, 70);
    const spot = state.at;
    expect(Math.hypot(spot.x - at.x, spot.y - at.y)).toBeGreaterThan(50);
    for (let i = 0; i < 60; i++) state = followStep(state, at, dt, tuning);
    expect(state.at).toEqual(spot);
    // He walks off to the right, at his speed.
    for (let i = 1; i <= 60; i++) {
      state = followStep(state, { x: 500 + (i * 400) / 60, y: 500 }, dt, tuning);
    }
    expect(state.at.x).toBeGreaterThan(700);
  });

  it('faces the way it goes', () => {
    const { state } = walk([
      { x: 900, y: 500 },
      { x: 200, y: 500 },
    ]);
    expect(state.facing).toBe(-1);
  });

  it.each(Object.values(town.areas).map((area) => [area.id, area] as const))(
    'never leaves the ground in the %s',
    (_id, area) => {
      const far = area.places[0]?.stand ?? area.exits[0]?.stand ?? area.arrive;
      const route = findPath(area.ground, area.arrive, far);
      expect(route).not.toBeNull();
      const { spots } = walk([area.arrive, ...(route ?? [])]);
      // He may come in just off the cobbles, as the market's way in does: judged from the cobbles on.
      const on = spots.findIndex((spot) => onGround(area.ground, spot));
      const off = spots.slice(on).filter((spot) => !onGround(area.ground, spot));
      // Corners may be cut by less than a cell: it follows his trail, and the trail stays near it.
      const wide = off.filter(
        (spot) =>
          ![-20, 20].some(
            (dx) =>
              onGround(area.ground, { x: spot.x + dx, y: spot.y }) ||
              onGround(area.ground, { x: spot.x, y: spot.y + dx }),
          ),
      );
      expect(wide).toEqual([]);
    },
  );
});
