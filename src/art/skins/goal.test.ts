import type { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { palette } from '@/art/palette';
import { type GoalCardShape, goalPictureParts, goalSkin } from '@/art/skins/goal';

/** A stand-in for Pixi's Graphics that records colours and stroke widths drawn. */
function recordingGraphics() {
  const colours: number[] = [];
  const widths: number[] = [];
  const g = new Proxy(
    {},
    {
      get(_target, name: string) {
        return (...args: unknown[]) => {
          if (name === 'stroke' || name === 'fill') {
            const style = args[0] as { color?: number; width?: number } | undefined;
            if (style?.color !== undefined) colours.push(style.color);
            if (name === 'stroke' && style?.width !== undefined) widths.push(style.width);
          }
          return g;
        };
      },
    },
  ) as Graphics;
  return { g, colours, widths };
}

const shape: GoalCardShape = {
  box: { x: 1300, y: 860, width: 280, height: 120 },
  picture: { x: 1420, y: 870, width: 2.8 * 40, height: 2.3 * 40 },
  lineWidth: 3,
};

describe('goalSkin (story 1.16)', () => {
  it('keeps the miniature scale inside its picture, the tick clear of the pieces', () => {
    const parts = goalPictureParts(shape.picture);
    const { x, width } = shape.picture;
    const [left, right] = parts.ends;
    expect(left.x - parts.panHalf).toBeGreaterThanOrEqual(x - 1e-9);
    expect(right.x + parts.panHalf).toBeLessThanOrEqual(x + width + 1e-9);
    expect(parts.gear.x - parts.gear.radius).toBeGreaterThanOrEqual(x - 1e-9);
    expect(parts.weight.x + parts.weight.width / 2).toBeLessThanOrEqual(x + width + 1e-9);
    // The tick's rays reach 1.75 of its ring: clear of the gear and the weight beside it.
    const rays = parts.tick.radius * 1.75;
    expect(parts.tick.x - rays).toBeGreaterThan(parts.gear.x + parts.gear.radius);
    expect(parts.tick.x + rays).toBeLessThan(parts.weight.x - parts.weight.width / 2);
    // One x-gear alone on the left pan, the weight on the right one, both standing on them.
    expect(parts.gear.y + parts.gear.radius).toBeCloseTo(parts.panY);
    expect(parts.weight.y).toBe(parts.panY);
  });

  it('draws in ink on paper, lighting lamp-coloured only when the pans match it', () => {
    const plain = recordingGraphics();
    goalSkin.card(plain.g, shape, false);
    goalSkin.picture(plain.g, shape);
    expect(plain.colours).not.toContain(palette.lamp);
    const lit = recordingGraphics();
    goalSkin.card(lit.g, shape, true);
    goalSkin.tick(lit.g, shape);
    expect(lit.colours).toContain(palette.lamp);
  });

  it('marks a match by shape too: a heavier frame, and the tick', () => {
    const plain = recordingGraphics();
    goalSkin.card(plain.g, shape, false);
    const lit = recordingGraphics();
    goalSkin.card(lit.g, shape, true);
    expect(Math.max(...lit.widths)).toBeGreaterThan(Math.max(...plain.widths) * 2);
    const tick = recordingGraphics();
    goalSkin.tick(tick.g, shape);
    expect(tick.colours).toContain(palette.ink);
  });
});
