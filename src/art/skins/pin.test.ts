import type { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { palette } from '@/art/palette';
import {
  flagBounds,
  flagParts,
  holderParts,
  type PinShape,
  pinRayReach,
  pinSkin,
} from '@/art/skins/pin';

interface Call {
  name: string;
  args: unknown[];
}

/** A stand-in for Pixi's Graphics that records the colours and shapes drawn. */
function recordingGraphics() {
  const colours: number[] = [];
  const shapes: string[] = [];
  const calls: Call[] = [];
  const g = new Proxy(
    {},
    {
      get(_target, name: string) {
        return (...args: unknown[]) => {
          calls.push({ name, args });
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
  return { g, colours, shapes, calls };
}

const shape: PinShape = { tipY: 900, headX: 43, headY: 800, headRadius: 40, lineWidth: 4 };

/** The y of every point a drawing's polygons and lines go through. */
function pointYs(calls: Call[]): number[] {
  return calls.flatMap((call) => {
    if (call.name === 'poly') return (call.args[0] as number[]).filter((_, i) => i % 2 === 1);
    if (call.name === 'moveTo' || call.name === 'lineTo') return [call.args[1] as number];
    return [];
  });
}

describe('pinSkin', () => {
  it('draws the flag, its holder and its places in ink on paper alone', () => {
    const parts = [
      (g: Graphics) => pinSkin.pin(g, shape, false),
      (g: Graphics) => pinSkin.pin(g, shape, true),
      (g: Graphics) => pinSkin.picture(g, shape, 'tilt-left'),
      (g: Graphics) => pinSkin.holder(g, shape),
      (g: Graphics) => pinSkin.place(g, shape, 'tilt-right'),
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

  // Story 1.15 replaces 1.14's round head on a post: the son took it for a balloon.
  it('is a flag: a pole on the track with a cloth on its right, and no round head', () => {
    const { g, shapes, calls } = recordingGraphics();
    pinSkin.pin(g, shape, false);
    expect(shapes).not.toContain('circle');
    expect(shapes).not.toContain('ellipse');
    const parts = flagParts(shape);
    // The pole stands at the pin's x, from above the cloth down to its spike on the track.
    expect(calls).toContainEqual({ name: 'moveTo', args: [0, parts.poleTop] });
    expect(Math.max(...pointYs(calls))).toBe(shape.tipY);
    expect(parts.poleTop).toBeLessThan(parts.cloth.top);
    // The cloth is right of the pole, centred where the number goes.
    expect(parts.cloth.left).toBeGreaterThan(0);
    expect(parts.cloth.left).toBeLessThan(shape.lineWidth);
    expect(parts.centre).toEqual({ x: shape.headX, y: shape.headY });
    expect((parts.cloth.left + parts.cloth.right) / 2).toBeCloseTo(shape.headX);
    expect(parts.cloth.right - parts.cloth.left).toBeCloseTo(shape.headRadius * 2);
    expect(parts.cloth.top).toBeLessThan(shape.headY);
    expect(parts.cloth.bottom).toBeGreaterThan(shape.headY);
    // Its top and bottom edges wave.
    expect(shapes.filter((name) => name === 'bezierCurveTo')).toHaveLength(2);
  });

  it('shows a locked flag by shape: the spike driven into the track, a plate at its foot', () => {
    const free = recordingGraphics();
    pinSkin.pin(free.g, shape, false);
    const locked = recordingGraphics();
    pinSkin.pin(locked.g, shape, true);
    expect(locked.shapes.filter((name) => name === 'rect').length).toBe(
      free.shapes.filter((name) => name === 'rect').length + 1,
    );
    // Free, the spike's point touches the track; locked, the pole goes into it.
    const freePoint = free.calls.find(
      (call) => call.name === 'poly' && (call.args[0] as number[]).includes(shape.tipY),
    );
    expect(freePoint).toBeDefined();
    expect(Math.max(...pointYs(locked.calls))).toBeGreaterThan(shape.tipY);
    const lockedSpike = locked.calls.filter(
      (call) => call.name === 'poly' && (call.args[0] as number[]).includes(shape.tipY),
    );
    expect(lockedSpike).toHaveLength(0);
  });

  it('shows a right pin by shape as well as colour: a glowing cloth and rays (NFR4)', () => {
    const { g, colours, shapes } = recordingGraphics();
    pinSkin.light(g, shape);
    expect(colours).toContain(palette.lamp);
    expect(shapes.filter((name) => name === 'lineTo').length).toBeGreaterThanOrEqual(6);
    expect(pinRayReach).toBeGreaterThan(1);
  });

  // Story 1.15 replaces 1.14's pan arrows (down, up) with the whole scale tilted.
  it('draws the two options as the whole scale tilted opposite ways', () => {
    const beam = (option: 'tilt-left' | 'tilt-right') => {
      const { g, calls } = recordingGraphics();
      pinSkin.picture(g, shape, option);
      // The beam is the line drawn heaviest.
      const index = calls.findIndex(
        (call) =>
          call.name === 'stroke' &&
          ((call.args[0] as { width?: number }).width ?? 0) > shape.lineWidth,
      );
      const from = calls[index - 2]?.args as [number, number];
      const to = calls[index - 1]?.args as [number, number];
      return { from, to };
    };
    const left = beam('tilt-left');
    const right = beam('tilt-right');
    // Tilted left, the beam's left end is lower (larger y); tilted right, its right end.
    expect(left.from[0]).toBeLessThan(left.to[0]);
    expect(left.from[1]).toBeGreaterThan(left.to[1]);
    expect(right.from[1]).toBeLessThan(right.to[1]);
    // Each picture sits on the cloth.
    const { cloth } = flagParts(shape);
    for (const end of [left.from, left.to, right.from, right.to]) {
      expect(end[0]).toBeGreaterThan(cloth.left);
      expect(end[0]).toBeLessThan(cloth.right);
    }
  });

  it("puts the holder's bracket left of the pole, its top over the cloth, where the tag is tied", () => {
    const holder = holderParts(shape);
    expect(holder.postX).toBeLessThan(0);
    expect(holder.top).toBeLessThan(flagParts(shape).cloth.top);
    expect(holder.tie).toEqual({ x: holder.postX, y: holder.top });
    const bounds = flagBounds(shape);
    expect(bounds.left).toBeLessThan(holder.postX);
    expect(bounds.right).toBeGreaterThan(flagParts(shape).cloth.right);
    expect(bounds.top).toBeLessThan(flagParts(shape).poleTop);
  });

  it('marks nothing when no place lies beyond the dial', () => {
    const { g, shapes } = recordingGraphics();
    pinSkin.beyond(g, 200, 200, 40, 920, 36, 4);
    expect(shapes).toEqual([]);
  });
});
