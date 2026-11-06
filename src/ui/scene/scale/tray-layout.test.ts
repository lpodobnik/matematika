import { describe, expect, it } from 'vitest';
import { trayPiece } from '@/room/tray';
import { machineBounds } from '@/ui/scene/machine/layout';
import { type Box, minHitCssPx } from '@/ui/scene/scale/dial-layout';
import { beamPose, labelFontSize, pieceSize, scaleGeometry } from '@/ui/scene/scale/layout';
import { dropTarget, panZones, trayLayout } from '@/ui/scene/scale/tray-layout';

const tablet = 0.54;
const phone = 360 / 1000; // 640 × 360: the scene's height sets its scale

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function within(inner: Box, outer: Box): boolean {
  return (
    inner.x >= outer.x - 1e-9 &&
    inner.y >= outer.y - 1e-9 &&
    inner.x + inner.width <= outer.x + outer.width + 1e-9 &&
    inner.y + inner.height <= outer.y + outer.height + 1e-9
  );
}

describe('trayLayout', () => {
  it('puts the weight, then the float, on a shelf in the top-right corner of the scene', () => {
    const layout = trayLayout(tablet, labelFontSize(tablet));
    expect(layout.slots.map((slot) => slot.kind)).toEqual(['weight', 'float']);
    const [weight, float] = layout.slots;
    expect(weight?.piece.x).toBeLessThan(float?.piece.x ?? 0);
    expect(layout.box.x + layout.box.width).toBe(1580);
    expect(layout.box.y).toBe(20);
    expect(layout.dividerX).toBeGreaterThan(weight?.up.x ?? 0);
    expect(layout.dividerX).toBeLessThan(float?.grab.x ?? 0);
  });

  it('keeps the shelf right of the machine and above the right pan’s pieces on the tablet', () => {
    const fontSize = labelFontSize(tablet);
    const { box } = trayLayout(tablet, fontSize);
    expect(box.x).toBeGreaterThan(machineBounds().right);
    // The right pan at rest, with a row of pieces on it.
    const pan = beamPose(0).right;
    const row = pieceSize({ ...trayPiece('float', 99) }, fontSize).height;
    expect(box.y + box.height).toBeLessThan(pan.y - row);
  });

  it.each([
    ['the tablet', tablet],
    ['a phone at 640 × 360', phone],
    ['a large screen', 1],
  ])('makes every button and grab area at least 48 CSS px on %s, inside the shelf', (_, scale) => {
    const layout = trayLayout(scale, labelFontSize(scale));
    const min = minHitCssPx / scale;
    for (const slot of layout.slots) {
      for (const box of [slot.up, slot.down, slot.grab]) {
        expect(box.width).toBeGreaterThanOrEqual(min - 1e-9);
        expect(box.height).toBeGreaterThanOrEqual(min - 1e-9);
      }
      for (const box of [slot.up, slot.down]) expect(within(box, layout.box)).toBe(true);
      expect(overlaps(slot.up, slot.down)).toBe(false);
      expect(slot.up.y).toBeLessThan(slot.down.y);
      expect(overlaps(slot.up, slot.grab) || overlaps(slot.down, slot.grab)).toBe(false);
    }
    expect(layout.box.x).toBeGreaterThan(scaleGeometry.pivot.x);
    expect(layout.box.y + layout.box.height).toBeLessThan(scaleGeometry.pivot.y);
  });

  it('fits a two-digit number on either piece, so the shelf keeps its size as the numbers change', () => {
    const fontSize = labelFontSize(tablet);
    const layout = trayLayout(tablet, fontSize);
    for (const slot of layout.slots) {
      const size = pieceSize(trayPiece(slot.kind, 99), fontSize);
      expect(slot.grab.width).toBeGreaterThanOrEqual(size.width);
      expect(slot.piece.y - size.height).toBeGreaterThanOrEqual(layout.box.y);
      expect(slot.piece.y).toBeLessThanOrEqual(layout.box.y + layout.box.height);
    }
  });
});

describe('dropTarget', () => {
  const layout = trayLayout(tablet, labelFontSize(tablet));
  const { box } = layout;

  it('lands on the shelf, or just beside it', () => {
    expect(dropTarget({ x: box.x + 10, y: box.y + 10 }, layout)).toBe('tray');
    expect(dropTarget({ x: box.x - 20, y: box.y + box.height + 20 }, layout)).toBe('tray');
  });

  it('lands on the pan whose half of the scene it is let go over, above the stand’s foot', () => {
    expect(dropTarget({ x: 300, y: 500 }, layout)).toBe('left');
    expect(dropTarget({ x: 40, y: 200 }, layout)).toBe('left');
    expect(dropTarget({ x: 1300, y: 500 }, layout)).toBe('right');
    expect(dropTarget({ x: 1300, y: box.y + box.height + 80 }, layout)).toBe('right');
  });

  it('lands nowhere over the machine and the stand, over the dial, or above the pans', () => {
    expect(dropTarget({ x: 800, y: 300 }, layout)).toBeNull();
    expect(dropTarget({ x: 300, y: panZones.bottom + 1 }, layout)).toBeNull();
    expect(dropTarget({ x: 300, y: 920 }, layout)).toBeNull();
    expect(dropTarget({ x: 300, y: panZones.top - 1 }, layout)).toBeNull();
  });
});
