import type { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { palette } from '@/art/palette';
import {
  balloonParts,
  gearSlice,
  type PieceShape,
  scaleSkin,
  slicedBody,
  sliceTag,
  tagOverlap,
} from '@/art/skins/scale';

interface Call {
  name: string;
  args: unknown[];
}

/** A stand-in for Pixi's Graphics that records every call, in order. */
function recordingGraphics() {
  const calls: Call[] = [];
  const g = new Proxy(
    {},
    {
      get(_target, name: string) {
        return (...args: unknown[]) => {
          calls.push({ name, args });
          return g;
        };
      },
    },
  ) as Graphics;
  return { g, calls };
}

function styles(calls: Call[], kind: 'stroke' | 'fill') {
  return calls
    .filter((call) => call.name === kind)
    .map((call) => call.args[0] as { color?: number; alpha?: number } | undefined);
}

const none = { slices: 0, tagWidth: 0, tagHeight: 0, large: false };
const font = 44;
const weight: PieceShape = { kind: 'weight', width: 88, height: 88, ...none };
const float: PieceShape = { kind: 'float', width: 81, height: font * 4, ...none };
const gear: PieceShape = { kind: 'gear', width: 88, height: 88, ...none };
const spring: PieceShape = { kind: 'spring', width: 88, height: 88, ...none };
// As layout.ts sizes them at the tablet's label size: the body, and the tag beside it.
const tag = { tagWidth: 78, tagHeight: font * 1.15 };
const beside = tag.tagWidth * (1 - tagOverlap);
const thirdOfX: PieceShape = {
  kind: 'gear',
  width: 123 + beside,
  height: 123,
  slices: 3,
  ...tag,
  large: false,
};
const halfOfSpring: PieceShape = {
  kind: 'spring',
  width: 106 + beside,
  height: font * 3.5,
  slices: 2,
  ...tag,
  large: false,
};

describe('scaleSkin pieces', () => {
  it('draws every piece in ink and paper alone, divided or not (NFR12)', () => {
    for (const shape of [weight, float, gear, spring, thirdOfX, halfOfSpring]) {
      const { g, calls } = recordingGraphics();
      scaleSkin.piece(g, shape);
      const colours = [...styles(calls, 'stroke'), ...styles(calls, 'fill')].map((s) => s?.color);
      expect(colours.length, shape.kind).toBeGreaterThan(0);
      for (const colour of colours) expect([palette.ink, palette.paper]).toContain(colour);
    }
  });
});

describe('a float is a balloon pulling up (story 1.14)', () => {
  const parts = balloonParts(float.width, float.height);

  it('floats its balloon above the pan on a string, with a knot at its bottom', () => {
    expect(parts.top).toBeLessThan(parts.centre.y);
    expect(parts.centre.y).toBeLessThan(parts.bottom);
    expect(parts.bottom).toBeLessThan(parts.knot);
    // The string is a good share of its height: the balloon is clearly off the pan.
    expect(-parts.knot).toBeGreaterThan(float.height * 0.15);
    expect(parts.halfWidth * 2).toBeLessThanOrEqual(float.width);
  });

  it('has an arrow above it, at least as tall as from its knot to its centre', () => {
    const { tail, tip } = parts.arrow;
    expect(tip).toBe(-float.height);
    expect(tail).toBeLessThan(parts.top);
    expect(tail - tip).toBeGreaterThanOrEqual(parts.knot - parts.centre.y);
  });

  it('draws a curved string and an arrow pointing up, and no round head on a post like the pin', () => {
    const { g, calls } = recordingGraphics();
    scaleSkin.piece(g, float);
    const names = calls.map((call) => call.name);
    // No circle (the pin's head) and no ellipse (the old round float).
    expect(names).not.toContain('circle');
    expect(names).not.toContain('ellipse');
    // The string leaves the pan as a curve, not a straight post.
    const fromPan = calls.findIndex(
      (call) => call.name === 'moveTo' && call.args[1] === parts.knot,
    );
    expect(calls[fromPan + 1]?.name).toBe('bezierCurveTo');
    // The arrow head: its point is the float's top, above its base.
    const heads = calls
      .filter((call) => call.name === 'poly')
      .map((call) => call.args[0] as number[])
      .filter((points) => points.includes(-float.height));
    expect(heads).toHaveLength(1);
    const head = heads[0] ?? [];
    const ys = head.filter((_, i) => i % 2 === 1);
    expect(Math.min(...ys)).toBe(-float.height);
    expect(ys.filter((y) => y > -float.height)).toHaveLength(2);
  });

  it('puts its number at the balloon’s widest point', () => {
    expect(scaleSkin.labelSpot(float)).toEqual(parts.centre);
  });
});

describe('x : n is one slice of a gear cut into n (story 1.14)', () => {
  it('is a sector of 360°/n pointing down from the gear’s centre, which stands on the pan', () => {
    for (const slices of [2, 3, 4, 9]) {
      const slice = gearSlice({ ...thirdOfX, slices });
      expect(slice.to - slice.from).toBeCloseTo((2 * Math.PI) / slices);
      expect((slice.to + slice.from) / 2).toBeCloseTo(Math.PI / 2);
      expect(slice.centre.y + slice.radius).toBeCloseTo(0);
      expect(slice.radius * 2).toBeCloseTo(thirdOfX.height);
    }
  });

  it('draws the whole gear faint and one slice solid, with nothing under the gear', () => {
    const { g, calls } = recordingGraphics();
    scaleSkin.piece(g, thirdOfX);
    const strokes = styles(calls, 'stroke');
    expect(strokes.some((s) => (s?.alpha ?? 1) < 0.5)).toBe(true);
    expect(strokes.some((s) => s?.alpha === undefined && s?.color === palette.ink)).toBe(true);
    // Every polygon (the ghost rim and the slice) stays within the gear: no divider below it.
    for (const call of calls.filter((each) => each.name === 'poly')) {
      const ys = (call.args[0] as number[]).filter((_, i) => i % 2 === 1);
      expect(Math.max(...ys)).toBeLessThanOrEqual(1e-9);
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(-thirdOfX.height - 1e-9);
    }
    // The ghost is cut into three: three faint lines from the centre.
    const { centre } = gearSlice(thirdOfX);
    const cuts = calls.filter(
      (call) => call.name === 'moveTo' && call.args[0] === centre.x && call.args[1] === centre.y,
    );
    expect(cuts).toHaveLength(3);
    // The tag: a paper label on the slice.
    expect(calls.map((call) => call.name)).toContain('roundRect');
  });

  it('puts x in the ghost above the slice, and hangs the tag beside it on a string', () => {
    const slice = gearSlice(thirdOfX);
    const x = scaleSkin.labelSpot(thirdOfX);
    expect(x.x).toBeCloseTo(slice.centre.x);
    expect(x.y).toBeLessThan(slice.centre.y);
    // The gear is the left part of the box; the tag hangs at its right, beside the slice.
    expect(slicedBody(thirdOfX).width).toBeCloseTo(thirdOfX.height);
    const tagBox = sliceTag(thirdOfX);
    expect(tagBox.x - tagBox.width / 2).toBeGreaterThan(slice.centre.x + slice.radius * 0.5);
    expect(tagBox.x + tagBox.width / 2).toBeCloseTo(thirdOfX.width / 2);
    expect(tagBox.y).toBeGreaterThan(slice.centre.y);
    expect(tagBox.y + tagBox.height / 2).toBeLessThanOrEqual(0);
    // A string ties it to the slice.
    const { g, calls } = recordingGraphics();
    scaleSkin.piece(g, thirdOfX);
    expect(calls.map((call) => call.name)).toContain('quadraticCurveTo');
  });

  it('cuts a divided spring’s cap into n layers, its bottom one solid, with x above it', () => {
    const { g, calls } = recordingGraphics();
    scaleSkin.piece(g, halfOfSpring);
    const solid = calls.filter(
      (call, i) => call.name === 'roundRect' && calls[i + 1]?.name === 'fill' && i > 0,
    );
    expect(solid.length).toBeGreaterThanOrEqual(2);
    const x = scaleSkin.labelSpot(halfOfSpring);
    const tagged = scaleSkin.tagSpot(halfOfSpring);
    expect(x.y).toBeLessThan(tagged.y - halfOfSpring.tagHeight / 2);
    expect(tagged.y + halfOfSpring.tagHeight / 2).toBeLessThan(0);
    expect(x.y).toBeGreaterThan(-halfOfSpring.height);
  });
});
