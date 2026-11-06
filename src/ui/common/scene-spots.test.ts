import { describe, expect, it } from 'vitest';
import { rooms } from '@/content/rooms';
import { notchCount } from '@/room/dial';
import { pinTrack, slotCount } from '@/room/pin';
import {
  confirmGapPx,
  confirmSize,
  confirmSpot,
  type HeadSpot,
  pinHeadSpot,
  type Size,
} from '@/ui/common/scene-spots';
import { fitScene } from '@/ui/scene/fit-scene';
import { dialLayout } from '@/ui/scene/scale/dial-layout';
import { labelFontSize } from '@/ui/scene/scale/layout';
import { pinLayout } from '@/ui/scene/scale/pin-layout';

// The scene areas: the 1280 × 800 tablet beside the notebook, and 640 × 360, where the scene
// fills the screen and the notebook slides over it.
const areas: [string, Size][] = [
  ['the tablet', { width: 1280 - 0.32 * 1280, height: 800 }],
  ['640 × 360', { width: 640, height: 360 }],
];

/** Every pin in rooms 1–4, at every place on its track. */
function everyPin() {
  return rooms.flatMap((spec) =>
    spec.stages.flatMap((stage, index) => {
      const track = pinTrack(stage);
      if (!track || stage.dial === 'locked') return [];
      const notches = notchCount(stage.dial);
      const slots = slotCount(track);
      return Array.from({ length: slots }, (_, slot) => ({
        name: `${spec.id}.${index} place ${slot}`,
        notches,
        pin: { kind: track.kind, slots, slot },
      }));
    }),
  );
}

function overlaps(a: { left: number; top: number }, size: Size, head: HeadSpot): boolean {
  const nearestX = Math.max(a.left, Math.min(head.x, a.left + size.width));
  const nearestY = Math.max(a.top, Math.min(head.y, a.top + size.height));
  return Math.hypot(nearestX - head.x, nearestY - head.y) < head.radius;
}

describe("the pin's head in the scene area", () => {
  it('is where the scene draws it: the fitted scene, at its place on the track', () => {
    const area = { width: 640, height: 360 };
    const fit = fitScene(area.width, area.height);
    const layout = pinLayout(
      dialLayout(fit.scale, 14),
      { kind: 'x', slots: 15 },
      labelFontSize(fit.scale),
    );
    const head = pinHeadSpot(area, 1, 14, { kind: 'x', slots: 15, slot: 8 });
    expect(head?.x).toBeCloseTo(fit.x + (layout.originX + 8 * layout.spacing) * fit.scale);
    expect(head?.y).toBeCloseTo(fit.y + layout.headY * fit.scale);
    expect(head?.radius).toBeCloseTo(layout.headRadius * fit.scale);
    expect(head?.centreX).toBeCloseTo(area.width / 2);
  });

  it('is in the first copy when the dev panel draws three', () => {
    const area = { width: 870, height: 800 };
    const one = pinHeadSpot(area, 1, 14, { kind: 'x', slots: 15, slot: 0 });
    const three = pinHeadSpot(area, 3, 14, { kind: 'x', slots: 15, slot: 0 });
    expect(three?.x).toBeLessThan(area.width / 3);
    expect(three?.radius).toBeLessThan(one?.radius ?? 0);
  });

  it('is unknown before the area has a size', () => {
    expect(
      pinHeadSpot({ width: 0, height: 0 }, 1, 14, { kind: 'x', slots: 15, slot: 0 }),
    ).toBeNull();
  });
});

describe('confirmSpot (story 1.14)', () => {
  it.each(areas)('stays fully on screen beside the head, never on it, on %s', (_, area) => {
    for (const { name, notches, pin } of everyPin()) {
      const head = pinHeadSpot(area, 1, notches, pin);
      if (!head) throw new Error(name);
      const spot = confirmSpot(head, pin.kind, area);
      expect(spot.left, name).toBeGreaterThanOrEqual(0);
      expect(spot.top, name).toBeGreaterThanOrEqual(0);
      expect(spot.left + confirmSize.width, name).toBeLessThanOrEqual(area.width);
      expect(spot.top + confirmSize.height, name).toBeLessThanOrEqual(area.height);
      expect(overlaps(spot, confirmSize, head), name).toBe(false);
      // Right next to the head: its near edge within a gap of the head's edge.
      const near = Math.min(
        Math.abs(spot.left - (head.x + head.radius)),
        Math.abs(spot.left + confirmSize.width - (head.x - head.radius)),
      );
      expect(near, name).toBeLessThanOrEqual(confirmGapPx + 1e-9);
      // Its bottom is level with the head's, clear of the knob below.
      expect(spot.top + confirmSize.height).toBeCloseTo(head.y + head.radius);
    }
  });

  it("goes on the side away from the dial's centre, so it never covers the other option", () => {
    const area = { width: 640, height: 360 };
    const stage = rooms[2]?.stages[1];
    if (!stage || stage.dial === 'locked') throw new Error('room 3, stage 2');
    const notches = notchCount(stage.dial);
    const down = pinHeadSpot(area, 1, notches, { kind: 'choice', slots: 2, slot: 0 });
    const up = pinHeadSpot(area, 1, notches, { kind: 'choice', slots: 2, slot: 1 });
    if (!down || !up) throw new Error('no heads');
    expect(confirmSpot(down, 'choice', area).left + confirmSize.width).toBeLessThan(down.x);
    expect(confirmSpot(up, 'choice', area).left).toBeGreaterThan(up.x);
  });

  it("goes toward the dial's centre for an x pin, clear of the pans' readouts", () => {
    const area = { width: 640, height: 360 };
    const stage = rooms[3]?.stages[0];
    if (!stage || stage.dial === 'locked') throw new Error('room 4');
    const notches = notchCount(stage.dial);
    const low = pinHeadSpot(area, 1, notches, { kind: 'x', slots: 13, slot: 0 });
    const high = pinHeadSpot(area, 1, notches, { kind: 'x', slots: 13, slot: 9 });
    if (!low || !high) throw new Error('no heads');
    expect(confirmSpot(low, 'x', area).left).toBeGreaterThan(low.x);
    expect(confirmSpot(high, 'x', area).left + confirmSize.width).toBeLessThan(high.x);
  });

  it('flips to the other side when there is no room, and keeps inside the area', () => {
    const area = { width: 400, height: 300 };
    const atRight: HeadSpot = { x: 380, y: 150, radius: 20, centreX: 200 };
    expect(confirmSpot(atRight, 'choice', area).left + confirmSize.width).toBeLessThanOrEqual(360);
    const atLeft: HeadSpot = { x: 30, y: 150, radius: 20, centreX: 200 };
    expect(confirmSpot(atLeft, 'choice', area).left).toBeGreaterThanOrEqual(50);
    const low: HeadSpot = { x: 200, y: 380, radius: 20, centreX: 200 };
    expect(confirmSpot(low, 'x', area).top + confirmSize.height).toBeLessThanOrEqual(area.height);
  });
});
