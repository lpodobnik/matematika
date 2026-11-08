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
  // Story 1.15: the head is the flag's cloth, right of the pole that stands on the place.
  it('is where the scene draws it: the fitted scene, the cloth beside its place on the track', () => {
    const area = { width: 640, height: 360 };
    const fit = fitScene(area.width, area.height);
    const layout = pinLayout(
      dialLayout(fit.scale, 14),
      { kind: 'x', slots: 15 },
      labelFontSize(fit.scale),
    );
    const head = pinHeadSpot(area, 1, 14, { kind: 'x', slots: 15, slot: 8 });
    expect(layout.headX).toBeGreaterThan(layout.headRadius);
    expect(head?.x).toBeCloseTo(
      fit.x + (layout.originX + 8 * layout.spacing + layout.headX) * fit.scale,
    );
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

describe('confirmSpot', () => {
  it.each(areas)('stays on screen and clear of the flag at every place, on %s', (_, area) => {
    for (const { name, notches, pin } of everyPin()) {
      const head = pinHeadSpot(area, 1, notches, pin);
      if (!head) throw new Error(name);
      const spot = confirmSpot(area, head);
      expect(spot.left, name).toBeGreaterThanOrEqual(confirmGapPx);
      expect(spot.top, name).toBeGreaterThanOrEqual(confirmGapPx);
      expect(spot.left + confirmSize.width, name).toBeLessThanOrEqual(area.width);
      expect(spot.top + confirmSize.height, name).toBeLessThanOrEqual(area.height);
      expect(overlaps(spot, confirmSize, head), name).toBe(false);
    }
  });

  it('is the bottom-right corner whenever the flag is not under it', () => {
    const area = { width: 868, height: 800 };
    const head: HeadSpot = { x: 400, y: 600, radius: 20, centreX: 430 };
    const corner = { left: 868 - confirmGapPx - 132, top: 800 - confirmGapPx - 56 };
    expect(confirmSpot(area, head)).toEqual(corner);
    expect(confirmSpot(area, null)).toEqual(corner);
  });
});
