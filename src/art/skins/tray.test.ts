import type { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { palette } from '@/art/palette';
import { traySkin } from '@/art/skins/tray';

/** A stand-in for Pixi's Graphics that records colours, alphas and shapes drawn. */
function recordingGraphics() {
  const colours: number[] = [];
  const alphas: number[] = [];
  const shapes: string[] = [];
  const g = new Proxy(
    {},
    {
      get(_target, name: string) {
        return (...args: unknown[]) => {
          if (name === 'stroke' || name === 'fill') {
            const style = args[0] as { color?: number; alpha?: number } | undefined;
            if (style?.color !== undefined) colours.push(style.color);
            alphas.push(style?.alpha ?? 1);
          } else if (name !== 'clear') {
            shapes.push(name);
          }
          return g;
        };
      },
    },
  ) as Graphics;
  return { g, colours, alphas, shapes };
}

describe('traySkin', () => {
  it('draws the shelf and the buttons in ink on paper alone (colour only on restarted machines)', () => {
    const parts = [
      (g: Graphics) =>
        traySkin.shelf(g, {
          x: 1100,
          y: 20,
          width: 460,
          height: 220,
          dividerX: 1330,
          lineWidth: 4,
        }),
      (g: Graphics) => traySkin.button(g, 89, 1, true, 4),
      (g: Graphics) => traySkin.button(g, 89, -1, false, 4),
    ];
    for (const draw of parts) {
      const { g, colours, shapes } = recordingGraphics();
      draw(g);
      expect(shapes.length).toBeGreaterThan(0);
      for (const colour of colours) expect([palette.ink, palette.paper]).toContain(colour);
    }
  });

  it('tells + from − by shape: + has a second stroke', () => {
    const plus = recordingGraphics();
    traySkin.button(plus.g, 89, 1, true, 4);
    const minus = recordingGraphics();
    traySkin.button(minus.g, 89, -1, true, 4);
    const lines = (shapes: string[]) => shapes.filter((name) => name === 'moveTo').length;
    expect(lines(plus.shapes)).toBe(lines(minus.shapes) + 1);
  });

  it('draws a button that does nothing faint, not in another colour', () => {
    const on = recordingGraphics();
    traySkin.button(on.g, 89, 1, true, 4);
    const off = recordingGraphics();
    traySkin.button(off.g, 89, 1, false, 4);
    expect(off.colours).toEqual(on.colours);
    expect(Math.max(...off.alphas.filter((alpha) => alpha < 1))).toBeLessThan(0.5);
  });
});
