import type { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { palette } from '@/art/palette';
import { type BladeShape, bladeTag, splitterSkin, tickXs } from '@/art/skins/splitter';

/** A stand-in for Pixi's Graphics that records colours and shapes drawn. */
function recordingGraphics() {
  const colours: number[] = [];
  const shapes: string[] = [];
  const g = new Proxy(
    {},
    {
      get(_target, name: string) {
        return (...args: unknown[]) => {
          if (name === 'stroke' || name === 'fill') {
            const style = args[0] as { color?: number } | undefined;
            if (style?.color !== undefined) colours.push(style.color);
          } else if (name !== 'clear') {
            shapes.push(name);
          }
          return g;
        };
      },
    },
  ) as Graphics;
  return { g, colours, shapes };
}

const blade: BladeShape = {
  width: 240,
  height: 92,
  parts: 3,
  halves: false,
  jammed: false,
  lineWidth: 4,
};

describe('splitterSkin', () => {
  it('draws the holder and the blade in ink on paper', () => {
    for (const draw of [
      (g: Graphics) =>
        splitterSkin.holder(g, { x: 20, y: 20, width: 380, height: 200, lineWidth: 4 }),
      (g: Graphics) => splitterSkin.blade(g, blade),
    ]) {
      const { g, colours, shapes } = recordingGraphics();
      draw(g);
      expect(shapes.length).toBeGreaterThan(0);
      for (const colour of colours) expect([palette.ink, palette.paper]).toContain(colour);
    }
  });

  it('draws a blade lying across the pans after a jam in the jam’s colour', () => {
    const { g, colours } = recordingGraphics();
    splitterSkin.blade(g, { ...blade, width: 1000, halves: true, jammed: true });
    expect(colours).toContain(palette.jam);
    const plain = recordingGraphics();
    splitterSkin.blade(plain.g, blade);
    expect(plain.colours).not.toContain(palette.jam);
  });

  it('marks the blade into its parts: n − 1 ticks, or n − 1 on each pan’s half', () => {
    expect(tickXs({ width: 240, parts: 2, halves: false })).toEqual([120]);
    expect(tickXs({ width: 240, parts: 3, halves: false })).toEqual([80, 160]);
    expect(tickXs({ width: 1000, parts: 2, halves: true })).toEqual([250, 750]);
    expect(tickXs({ width: 900, parts: 9, halves: false })).toHaveLength(8);
    const { g, shapes } = recordingGraphics();
    splitterSkin.blade(g, { ...blade, parts: 5 });
    const more = recordingGraphics();
    splitterSkin.blade(more.g, { ...blade, parts: 6 });
    const lines = (list: string[]) => list.filter((name) => name === 'moveTo').length;
    expect(lines(more.shapes)).toBe(lines(shapes) + 1);
  });

  it('puts the tag for the number on top, centred, inside the blade', () => {
    const tag = bladeTag(blade);
    expect(tag.y).toBe(0);
    expect(tag.x + tag.width / 2).toBeCloseTo(blade.width / 2);
    expect(tag.width).toBeLessThanOrEqual(blade.width);
    expect(tag.height).toBeLessThan(blade.height);
  });
});
