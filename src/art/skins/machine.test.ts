import type { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { palette } from '@/art/palette';
import { machineSkin } from '@/art/skins/machine';
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

  it('draws the frame, the opening and the door in ink, never in the jam colour', () => {
    for (const part of ['frame', 'opening', 'door'] as const) {
      const { g, colours, shapes } = recordingGraphics();
      machineSkin[part](g, shape);
      expect(shapes.length, part).toBeGreaterThan(0);
      expect(colours, part).not.toContain(palette.jam);
    }
  });

  it('shows a jam by shape as well as colour: a wedge and steam lines (NFR4)', () => {
    const { g, colours, shapes } = recordingGraphics();
    machineSkin.jam(g, shape);
    expect(shapes).toContain('poly');
    expect(shapes).toContain('bezierCurveTo');
    expect(colours).toContain(palette.jam);
  });
});
