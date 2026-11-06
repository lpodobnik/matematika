import type { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { dialSkin } from '@/art/skins/dial';
import { fitScene } from '@/ui/scene/fit-scene';
import { dialLayout } from '@/ui/scene/scale/dial-layout';

/** A stand-in for Pixi's Graphics that records the vertical strokes the skin starts. */
function recordingGraphics() {
  const ticks: number[] = [];
  let at: [number, number] = [0, 0];
  const g = {
    clear: () => g,
    moveTo: (x: number, y: number) => {
      at = [x, y];
      return g;
    },
    lineTo: (x: number, y: number) => {
      if (x === at[0] && y !== at[1]) ticks.push(x);
      return g;
    },
    stroke: () => g,
    fill: () => g,
    rect: () => g,
    roundRect: () => g,
  };
  return { g: g as unknown as Graphics, ticks };
}

describe('dialSkin.track', () => {
  it("draws a tick on each of room 1's notches, 0 to 10, 24 CSS px apart", () => {
    const scale = fitScene(1280 - 0.32 * 1280, 800).scale;
    const layout = dialLayout(scale, 10);
    const { g, ticks } = recordingGraphics();
    dialSkin.track(g, layout);
    expect(ticks).toHaveLength(11);
    expect(ticks[0]).toBe(0);
    for (const [i, x] of ticks.entries()) expect(x * scale).toBeCloseTo(i * 24);
  });
});

/** A stand-in that records each stroke's and fill's alpha, and the boxes of rectangles. */
function alphaGraphics() {
  const strokes: number[] = [];
  const fills: number[] = [];
  const rects: { y: number; height: number }[] = [];
  const g = {
    clear: () => g,
    moveTo: () => g,
    lineTo: () => g,
    stroke: (style: { alpha?: number }) => {
      strokes.push(style.alpha ?? 1);
      return g;
    },
    fill: (style: { alpha?: number }) => {
      fills.push(style.alpha ?? 1);
      return g;
    },
    rect: (_x: number, y: number, _w: number, height: number) => {
      rects.push({ y, height });
      return g;
    },
  };
  return { g: g as unknown as Graphics, strokes, fills, rects };
}

describe('the poke window on the dial (story 1.14)', () => {
  const layout = dialLayout(fitScene(1280 - 0.32 * 1280, 800).scale, 14);

  it('draws the track past the clamp fainter, and the whole track plain without one', () => {
    const plain = alphaGraphics();
    dialSkin.track(plain.g, layout);
    expect(Math.min(...plain.strokes, ...plain.fills)).toBeGreaterThan(0.5);
    const short = alphaGraphics();
    dialSkin.track(short.g, layout, 3.7);
    expect(Math.min(...short.strokes)).toBeLessThan(0.3);
    // The far end stop is faint too.
    expect(short.fills).toEqual([1, expect.any(Number)]);
    expect(short.fills[1]).toBeLessThan(0.3);
  });

  it('grips the track with a clamp that reaches above and below it, past the ticks', () => {
    const clamp = alphaGraphics();
    dialSkin.clamp(clamp.g, layout.spacing * 0.6, layout.tickHeight, layout.lineWidth);
    const top = Math.min(...clamp.rects.map((r) => r.y));
    const bottom = Math.max(...clamp.rects.map((r) => r.y + r.height));
    expect(top).toBeLessThan(-layout.tickHeight / 2);
    expect(bottom).toBeGreaterThan(layout.tickHeight / 2);
  });
});
