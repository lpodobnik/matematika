import type { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { palette } from '@/art/palette';
import {
  balloonEmblem,
  balloonOutline,
  balloonParts,
  balloonPieceHeight,
  balloonSlice,
  gearSlice,
  isBalloon,
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

function drawn(shape: PieceShape): Call[] {
  const { g, calls } = recordingGraphics();
  scaleSkin.piece(g, shape);
  return calls;
}

/** The polygons a drawing fills or strokes, as point lists. */
function polygons(calls: Call[]): number[][] {
  return calls.filter((call) => call.name === 'poly').map((call) => call.args[0] as number[]);
}

/** Whether (x, y) is inside a polygon (even-odd rule). */
function insidePolygon(points: readonly number[], x: number, y: number): boolean {
  let inside = false;
  const count = points.length / 2;
  for (let i = 0, j = count - 1; i < count; j = i, i += 1) {
    const xi = points[i * 2] ?? 0;
    const yi = points[i * 2 + 1] ?? 0;
    const xj = points[j * 2] ?? 0;
    const yj = points[j * 2 + 1] ?? 0;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const none = { slices: 0, tagWidth: 0, tagHeight: 0, large: false, string: 0 };
const font = 44;
// As layout.ts sizes them at the tablet's label size: a body 2.5 label sizes tall (or 1.12
// times its width), its knot, and a string half a label size long.
const string = font * 0.5;
const weight: PieceShape = { kind: 'weight', width: 88, height: 88, ...none };
const float: PieceShape = {
  kind: 'float',
  width: font * 2.2,
  height: balloonPieceHeight(font * 2.5, string),
  ...none,
  string,
};
const gear: PieceShape = { kind: 'gear', width: 88, height: 88, ...none };
const spring: PieceShape = { ...float, kind: 'spring' };
const largeSpring: PieceShape = {
  kind: 'spring',
  width: font * 3.2,
  height: balloonPieceHeight(font * 3.2 * 1.05, string),
  ...none,
  large: true,
  string,
};
// The body, and the tag beside it.
const tag = { tagWidth: 78, tagHeight: font * 1.15 };
const beside = tag.tagWidth * (1 - tagOverlap);
const thirdOfX: PieceShape = {
  kind: 'gear',
  width: 123 + beside,
  height: 123,
  slices: 3,
  ...tag,
  large: false,
  string: 0,
};
const halfOfSpring: PieceShape = {
  kind: 'spring',
  width: font * 2.6 + beside,
  height: balloonPieceHeight(font * 2.6 * 1.12, string),
  slices: 2,
  ...tag,
  large: false,
  string,
};
const ninthOfSpring: PieceShape = { ...halfOfSpring, slices: 9 };

describe('scaleSkin pieces', () => {
  it('draws every piece in ink and paper alone, divided or not (NFR12)', () => {
    for (const shape of [weight, float, gear, spring, largeSpring, thirdOfX, halfOfSpring]) {
      const calls = drawn(shape);
      const { g, calls: string } = recordingGraphics();
      scaleSkin.balloonString(g, shape);
      const all = [...calls, ...string];
      const colours = [...styles(all, 'stroke'), ...styles(all, 'fill')].map((s) => s?.color);
      expect(colours.length, shape.kind).toBeGreaterThan(0);
      for (const colour of colours) expect([palette.ink, palette.paper]).toContain(colour);
    }
  });
});

describe('a float is a balloon (story 1.15)', () => {
  const parts = balloonParts(float);

  it('floats its balloon above the pan, with a knot at its bottom where the string starts', () => {
    expect(parts.top).toBeCloseTo(-float.height);
    expect(parts.top).toBeLessThan(parts.centre.y);
    expect(parts.centre.y).toBeLessThan(parts.bottom);
    expect(parts.bottom).toBeLessThan(parts.knot);
    // The string is a good share of its height: the balloon is clearly off the pan.
    expect(-parts.knot).toBe(string);
    expect(-parts.knot).toBeGreaterThan(font * 0.4);
    expect(parts.halfWidth * 2).toBeCloseTo(float.width);
  });

  it('is bigger than 1.14’s balloon, and a little taller than it is wide', () => {
    // 1.14: 1.8 label sizes wide and 0.43 × 4 = 1.72 tall.
    expect(parts.halfWidth * 2).toBeGreaterThan(font * 1.8);
    expect(parts.bottom - parts.top).toBeGreaterThan(font * 1.72);
    expect(parts.bottom - parts.top).toBeGreaterThan(parts.halfWidth * 2);
  });

  it('draws a shaded skin with a paper shine on its upper left, a knot, and no arrow', () => {
    const calls = drawn(float);
    const outline = balloonOutline(parts);
    // The skin is shaded, so the paper shine shows on it.
    expect(
      styles(calls, 'fill').some((s) => s?.color === palette.ink && (s.alpha ?? 1) < 0.2),
    ).toBe(true);
    const shine = calls.findIndex((call) => call.name === 'quadraticCurveTo');
    expect(shine).toBeGreaterThan(0);
    const start = calls[shine - 1]?.args as [number, number];
    expect(start[0]).toBeLessThan(parts.centre.x);
    expect(start[1]).toBeLessThanOrEqual(parts.centre.y);
    expect(insidePolygon(outline, start[0], start[1])).toBe(true);
    const shineFill = calls.slice(shine).find((call) => call.name === 'fill');
    expect(shineFill?.args[0]).toEqual({ color: palette.paper });
    // The knot: a dark triangle hanging from the balloon's bottom.
    const knot = polygons(calls).find((points) => points.includes(parts.knot));
    expect(knot).toBeDefined();
    // 1.14 had an arrow above the balloon; it is gone, so nothing is drawn above the balloon.
    for (const points of polygons(calls)) {
      const ys = points.filter((_, i) => i % 2 === 1);
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(parts.top - 1e-9);
    }
  });

  it('draws its string apart, from the knot down to the pan with a curve', () => {
    const { g, calls } = recordingGraphics();
    scaleSkin.balloonString(g, float);
    expect(calls[1]).toEqual({ name: 'moveTo', args: [parts.centre.x, parts.knot] });
    const curve = calls.find((call) => call.name === 'bezierCurveTo');
    expect(curve?.args[5]).toBe(0);
    // The piece itself has no string: only the string's own drawing goes to the pan.
    for (const points of polygons(drawn(float))) {
      const ys = points.filter((_, i) => i % 2 === 1);
      expect(Math.max(...ys)).toBeLessThanOrEqual(parts.knot + 1e-9);
    }
    const other = recordingGraphics();
    scaleSkin.balloonString(other.g, gear);
    expect(other.calls.map((call) => call.name)).toEqual(['clear']);
  });

  it('puts its number at the balloon’s widest point', () => {
    expect(scaleSkin.labelSpot(float)).toEqual(parts.centre);
  });
});

describe('every minus is a balloon (story 1.15)', () => {
  it('draws a spring as the same balloon as a float, with no coil and no cap', () => {
    expect(isBalloon('spring')).toBe(true);
    expect(isBalloon('float')).toBe(true);
    expect(isBalloon('gear')).toBe(false);
    const asSpring = drawn(spring);
    const asFloat = drawn(float);
    expect(polygons(asSpring)[0]).toEqual(polygons(asFloat)[0]);
    const names = asSpring.map((call) => call.name);
    expect(names).not.toContain('lineTo');
    expect(names).not.toContain('roundRect');
  });

  it('carries a small x-gear emblem under its label, inside the balloon', () => {
    for (const shape of [spring, largeSpring]) {
      const parts = balloonParts(shape);
      const outline = balloonOutline(parts);
      const { centre, radius } = balloonEmblem(shape);
      expect(radius).toBeGreaterThan(font * 0.2);
      const label = scaleSkin.labelSpot(shape);
      // Under the label, clear of a label's height.
      expect(centre.y - radius).toBeGreaterThan(label.y + font * 0.36);
      for (const angle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        const x = centre.x + radius * Math.cos(angle);
        const y = centre.y + radius * Math.sin(angle);
        expect(insidePolygon(outline, x, y), `${shape.large} at ${angle}`).toBe(true);
      }
      // The emblem is a toothed wheel, like the gears: more teeth when large.
      const teeth = polygons(drawn(shape)).filter(
        (points) => points.length === (shape.large ? 144 : 80),
      );
      expect(teeth.length, `large ${shape.large}`).toBe(1);
    }
    // A float carries no emblem.
    expect(polygons(drawn(float)).some((points) => points.length === 80)).toBe(false);
  });

  it('cuts a divided balloon into n from its centre, the bottom slice solid, like the gear', () => {
    for (const shape of [halfOfSpring, ninthOfSpring]) {
      const slice = balloonSlice(shape);
      expect(slice.to - slice.from).toBeCloseTo((2 * Math.PI) / shape.slices);
      expect((slice.to + slice.from) / 2).toBeCloseTo(Math.PI / 2);
      const calls = drawn(shape);
      const strokes = styles(calls, 'stroke');
      expect(strokes.some((s) => (s?.alpha ?? 1) < 0.5)).toBe(true);
      // n faint cuts from the centre.
      const { x: cx, y: cy } = slice.parts.centre;
      const cuts = calls.filter(
        (call) => call.name === 'moveTo' && call.args[0] === cx && call.args[1] === cy,
      );
      expect(cuts).toHaveLength(shape.slices);
      // The solid slice reaches down to the balloon's bottom, where the string is tied.
      const ys = slice.polygon.filter((_, i) => i % 2 === 1);
      expect(Math.max(...ys)).toBeCloseTo(slice.parts.bottom, 0);
      // The emblem is inside the solid slice.
      const emblem = balloonEmblem(shape);
      expect(insidePolygon(slice.polygon, emblem.centre.x, emblem.centre.y)).toBe(true);
      expect(emblem.radius).toBeGreaterThan(0);
      // x sits in the ghost above the centre; the tag hangs beside it, clear of x.
      const x = scaleSkin.labelSpot(shape);
      expect(x.y).toBeLessThan(cy);
      expect(x.y).toBeGreaterThan(slice.parts.top + font * 0.5);
      const tagBox = sliceTag(shape);
      expect(tagBox.x - tagBox.width / 2).toBeGreaterThan(cx);
      expect(tagBox.x + tagBox.width / 2).toBeCloseTo(shape.width / 2);
      expect(tagBox.y).toBeGreaterThan(cy);
      expect(tagBox.y + tagBox.height / 2).toBeLessThanOrEqual(0);
      expect(slicedBody(shape).width).toBeCloseTo(shape.width - beside);
    }
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
    const calls = drawn(thirdOfX);
    const strokes = styles(calls, 'stroke');
    expect(strokes.some((s) => (s?.alpha ?? 1) < 0.5)).toBe(true);
    expect(strokes.some((s) => s?.alpha === undefined && s?.color === palette.ink)).toBe(true);
    // Every polygon (the ghost rim and the slice) stays within the gear: no divider below it.
    for (const points of polygons(calls)) {
      const ys = points.filter((_, i) => i % 2 === 1);
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
    expect(drawn(thirdOfX).map((call) => call.name)).toContain('quadraticCurveTo');
  });
});
