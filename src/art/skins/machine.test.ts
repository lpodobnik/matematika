import type { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { palette } from '@/art/palette';
import { machineSkin, ventLeft, ventOutlet } from '@/art/skins/machine';
import { steamSkin } from '@/art/skins/steam';
import { machineGeometry } from '@/ui/scene/machine/layout';

/** A stand-in for Pixi's Graphics that records the colours each shape is drawn in. */
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

describe('machineSkin', () => {
  const { shape } = machineGeometry;

  it('draws the frame, the opening, the door, the pulleys, unlit lamps and the vent in ink alone', () => {
    for (const part of ['frame', 'opening', 'door', 'pulley', 'lamp', 'vent'] as const) {
      const { g, colours, shapes } = recordingGraphics();
      machineSkin[part](g, shape);
      expect(shapes.length, part).toBeGreaterThan(0);
      expect(colours, part).not.toContain(palette.jam);
      expect(colours, part).not.toContain(palette.lamp);
    }
  });

  it('gives a pulley spokes, so it shows turning', () => {
    const { g, shapes } = recordingGraphics();
    machineSkin.pulley(g, shape);
    expect(shapes.filter((name) => name === 'lineTo').length).toBeGreaterThanOrEqual(2);
  });

  it('shows a lit lamp by shape as well as colour: a flame and rays (NFR4)', () => {
    const { g, colours, shapes } = recordingGraphics();
    machineSkin.lampLight(g, shape);
    expect(colours).toContain(palette.lamp);
    expect(shapes).toContain('circle');
    expect(shapes.filter((name) => name === 'lineTo').length).toBeGreaterThanOrEqual(6);
  });

  it('stands the vent on the housing’s top at its left end, with its outlet on top', () => {
    const outlet = ventOutlet(shape);
    expect(ventLeft(shape)).toBeGreaterThanOrEqual(-shape.post * 1.5);
    expect(ventLeft(shape)).toBeLessThan(outlet.x);
    expect(outlet.x).toBeLessThan(shape.width / 4);
    expect(outlet.y).toBeLessThan(-shape.housing);
  });

  it('draws a puff of steam in ink alone, denser at its centre', () => {
    const alphas: number[] = [];
    const g = new Proxy(
      {},
      {
        get(_target, name: string) {
          return (...args: unknown[]) => {
            if (name === 'fill') {
              const style = args[0] as { color: number; alpha: number };
              expect(style.color).toBe(palette.ink);
              alphas.push(style.alpha);
            }
            return g;
          };
        },
      },
    ) as Graphics;
    steamSkin.puff(g, 18);
    expect(alphas.length).toBeGreaterThan(1);
    expect([...alphas].sort((a, b) => a - b)).toEqual(alphas);
  });

  it('shows a jam by shape as well as colour: a wedge and steam lines (NFR4)', () => {
    const { g, colours, shapes } = recordingGraphics();
    machineSkin.jam(g, shape);
    expect(shapes).toContain('poly');
    expect(shapes).toContain('bezierCurveTo');
    expect(colours).toContain(palette.jam);
  });
});
