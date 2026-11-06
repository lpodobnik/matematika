import type { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { palette } from '@/art/palette';
import { type FrameShape, frameBody, frameTag, splitterSkin, wallXs } from '@/art/skins/splitter';

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

const frame: FrameShape = { width: 240, height: 140, parts: 3, lineWidth: 4 };

describe('splitterSkin', () => {
  it('draws the holder and the frame in ink on paper', () => {
    for (const draw of [
      (g: Graphics) =>
        splitterSkin.holder(g, { x: 20, y: 20, width: 380, height: 200, lineWidth: 4 }),
      (g: Graphics) => splitterSkin.frame(g, frame),
    ]) {
      const { g, colours, shapes } = recordingGraphics();
      draw(g);
      expect(shapes.length).toBeGreaterThan(0);
      for (const colour of colours) expect([palette.ink, palette.paper]).toContain(colour);
    }
  });

  it('never draws a jam: an uneven split is refused, not jammed (story 1.15)', () => {
    for (const parts of [2, 5, 9]) {
      const { g, colours } = recordingGraphics();
      splitterSkin.frame(g, { ...frame, parts });
      expect(colours).not.toContain(palette.jam);
    }
  });

  it('walls the frame into n equal compartments: n − 1 walls (story 1.15)', () => {
    expect(wallXs({ width: 240, parts: 2 })).toEqual([120]);
    expect(wallXs({ width: 240, parts: 3 })).toEqual([80, 160]);
    expect(wallXs({ width: 900, parts: 9 })).toHaveLength(8);
    const { g, shapes } = recordingGraphics();
    splitterSkin.frame(g, { ...frame, parts: 5 });
    const more = recordingGraphics();
    splitterSkin.frame(more.g, { ...frame, parts: 6 });
    const lines = (list: string[]) => list.filter((name) => name === 'moveTo').length;
    expect(lines(more.shapes)).toBe(lines(shapes) + 1);
    expect(lines(shapes)).toBe(4);
  });

  it('puts the tag for `: n` on top, centred, above the compartments', () => {
    const tag = frameTag(frame);
    const body = frameBody(frame);
    expect(tag.y).toBe(0);
    expect(tag.x + tag.width / 2).toBeCloseTo(frame.width / 2);
    expect(tag.width).toBeLessThanOrEqual(frame.width);
    expect(body.y).toBeLessThan(tag.height);
    expect(body.y + body.height).toBe(frame.height);
    expect(body.height).toBeGreaterThan(tag.height);
  });
});
