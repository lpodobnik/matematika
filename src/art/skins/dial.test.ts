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
