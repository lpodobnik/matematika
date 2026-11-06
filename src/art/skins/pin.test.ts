import type { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { palette } from '@/art/palette';
import { type PinShape, pinRayReach, pinSkin } from '@/art/skins/pin';

/** A stand-in for Pixi's Graphics that records the colours and shapes drawn. */
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

const shape: PinShape = { tipY: 900, headY: 800, headRadius: 40, lineWidth: 4 };

describe('pinSkin', () => {
  it('draws the pin, its holder and its places in ink on paper alone', () => {
    const parts = [
      (g: Graphics) => pinSkin.pin(g, shape, false),
      (g: Graphics) => pinSkin.pin(g, shape, true),
      (g: Graphics) => pinSkin.holder(g, shape),
      (g: Graphics) => pinSkin.place(g, 'pan-down', 800, 44, 4),
      (g: Graphics) => pinSkin.beyond(g, 0, 200, 40, 920, 36, 4),
    ];
    for (const draw of parts) {
      const { g, colours, shapes } = recordingGraphics();
      draw(g);
      expect(shapes.length).toBeGreaterThan(0);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) expect([palette.ink, palette.paper]).toContain(colour);
    }
  });

  it('shows a locked pin by shape: a collar at its tip', () => {
    const free = recordingGraphics();
    pinSkin.pin(free.g, shape, false);
    const locked = recordingGraphics();
    pinSkin.pin(locked.g, shape, true);
    expect(locked.shapes.filter((name) => name === 'rect').length).toBe(
      free.shapes.filter((name) => name === 'rect').length + 1,
    );
  });

  it('shows a right pin by shape as well as colour: a flame and rays (NFR4)', () => {
    const { g, colours, shapes } = recordingGraphics();
    pinSkin.light(g, shape);
    expect(colours).toContain(palette.lamp);
    expect(shapes.filter((name) => name === 'lineTo').length).toBeGreaterThanOrEqual(6);
    expect(pinRayReach).toBeGreaterThan(1);
  });

  it('points the two options opposite ways', () => {
    const tips = (option: 'pan-down' | 'pan-up') => {
      const ys: number[] = [];
      const g = new Proxy(
        {},
        {
          get(_target, name: string) {
            return (...args: unknown[]) => {
              if (name === 'lineTo') ys.push(args[1] as number);
              return g;
            };
          },
        },
      ) as Graphics;
      pinSkin.arrow(g, option, 0, 40, 4);
      return ys;
    };
    expect(Math.max(...tips('pan-down'))).toBeGreaterThan(0);
    expect(Math.min(...tips('pan-up'))).toBeLessThan(0);
  });

  it('marks nothing when no place lies beyond the dial', () => {
    const { g, shapes } = recordingGraphics();
    pinSkin.beyond(g, 200, 200, 40, 920, 36, 4);
    expect(shapes).toEqual([]);
  });
});
