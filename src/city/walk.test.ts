import { describe, expect, it } from 'vitest';
import { clearLine, findPath, type Ground, nearestOnGround, onGround } from '@/city/walk';

// A 400 × 300 square of ground with a round pond in the middle.
const ground: Ground = {
  outline: [
    { x: 0, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 300 },
    { x: 0, y: 300 },
  ],
  holes: [{ x: 200, y: 150, rx: 60, ry: 60 }],
  cell: 20,
  width: 400,
  height: 300,
};

const length = (from: { x: number; y: number }, path: { x: number; y: number }[]) =>
  path.reduce((sum, p, i) => {
    const a = i === 0 ? from : (path[i - 1] as { x: number; y: number });
    return sum + Math.hypot(p.x - a.x, p.y - a.y);
  }, 0);

describe('walking in the town (story 5.0)', () => {
  it('knows the ground, and the pond is not ground', () => {
    expect(onGround(ground, { x: 20, y: 20 })).toBe(true);
    expect(onGround(ground, { x: 200, y: 150 })).toBe(false);
    expect(onGround(ground, { x: 500, y: 20 })).toBe(false);
  });

  it('walks straight when nothing is in the way', () => {
    expect(findPath(ground, { x: 20, y: 20 }, { x: 380, y: 20 })).toEqual([{ x: 380, y: 20 }]);
  });

  it('walks round the pond, never through it', () => {
    const from = { x: 60, y: 150 };
    const path = findPath(ground, from, { x: 340, y: 150 });
    if (!path) throw new Error('no path');
    expect(path.length).toBeGreaterThan(1);
    expect(path.at(-1)).toEqual({ x: 340, y: 150 });
    let a = from;
    for (const p of path) {
      expect(clearLine(ground, a, p)).toBe(true);
      a = p;
    }
    // Not a long detour: about half round the pond.
    expect(length(from, path)).toBeLessThan(400);
  });

  it('takes a tap in the pond to the nearest ground', () => {
    const near = nearestOnGround(ground, { x: 200, y: 150 });
    expect(near && onGround(ground, near)).toBe(true);
    const path = findPath(ground, { x: 20, y: 20 }, { x: 200, y: 150 });
    if (!path) throw new Error('no path');
    expect(path.length).toBeGreaterThan(0);
    expect(onGround(ground, path.at(-1) as { x: number; y: number })).toBe(true);
  });

  it('stays put when he is already there', () => {
    expect(findPath(ground, { x: 20, y: 20 }, { x: 20, y: 20 })).toEqual([]);
  });

  it('finds no path to ground he cannot reach', () => {
    const split: Ground = {
      ...ground,
      outline: [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
        { x: 400, y: 300 },
        { x: 0, y: 300 },
      ],
      holes: [{ x: 200, y: 150, rx: 40, ry: 400 }],
    };
    expect(findPath(split, { x: 20, y: 150 }, { x: 380, y: 150 })).toBeNull();
  });
});
