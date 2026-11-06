import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fitScene } from '@/ui/scene/fit-scene';
import { machineBounds } from '@/ui/scene/machine/layout';
import { type Box, minHitCssPx } from '@/ui/scene/scale/dial-layout';
import { beamPose, labelFontSize, scaleGeometry } from '@/ui/scene/scale/layout';
import {
  bladeHeight,
  overHolder,
  panAreas,
  splitterGeometry,
  splitterLayout,
} from '@/ui/scene/scale/splitter-layout';
import { trayLayout } from '@/ui/scene/scale/tray-layout';

const tablet = 0.54;
const phone = 360 / 1000; // 640 × 360: the scene's height sets its scale

/** The reset control's box in CSS px from the scene area's top-left corner, read from its CSS. */
function resetBox(): Box {
  const css = readFileSync(new URL('../../common/common.css', import.meta.url), 'utf8');
  const declarations = css.match(/(?:^|\n)\.reset\s*\{([^}]*)\}/)?.[1] ?? '';
  const px = (property: string) =>
    Number(declarations.match(new RegExp(`(?:^|[\\s;])${property}:\\s*(\\d+)px;`))?.[1]);
  return { x: px('left'), y: px('top'), width: px('width'), height: px('height') };
}

/** A box in scene units, in CSS px from the scene area's top-left corner, for a scene fitted at `fit`. */
function onScreen(box: Box, fit: { scale: number; x: number; y: number }): Box {
  return {
    x: fit.x + box.x * fit.scale,
    y: fit.y + box.y * fit.scale,
    width: box.width * fit.scale,
    height: box.height * fit.scale,
  };
}

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

describe('splitterLayout', () => {
  it('puts the holder in the top-left corner: the blade, then + above − beside it', () => {
    const layout = splitterLayout(tablet, labelFontSize(tablet));
    expect(layout.box.x).toBeCloseTo(splitterGeometry.resetClearPx / tablet);
    expect(layout.box.y).toBe(20);
    expect(splitterLayout(4, labelFontSize(4)).box.x).toBe(splitterGeometry.left);
    expect(within(layout.blade, layout.box)).toBe(true);
    expect(layout.up.x).toBeGreaterThan(layout.blade.x + layout.blade.width);
    expect(layout.up.y).toBeLessThan(layout.down.y);
    expect(overlaps(layout.up, layout.down)).toBe(false);
  });

  it.each([
    ['the tablet', tablet],
    ['a phone at 640 × 360', phone],
  ])('keeps the holder clear of the machine and the tray on %s', (_, scale) => {
    const fontSize = labelFontSize(scale);
    const { box } = splitterLayout(scale, fontSize);
    const machine = machineBounds();
    expect(box.x + box.width).toBeLessThan(machine.left);
    expect(overlaps(box, trayLayout(scale, fontSize).box)).toBe(false);
  });

  it.each([
    ['a phone at 640 × 360, the notebook over the scene', fitScene(640, 360)],
    ['an exact 16:10 area of 576 × 360, not letterboxed', fitScene(576, 360)],
    ['the tablet, the notebook beside the scene', fitScene(1280 - 0.32 * 1280, 800)],
    ['an exact 1600 × 1000 area', fitScene(1600, 1000)],
  ])('keeps the holder and its grab areas clear of the reset control on %s', (_, fit) => {
    const reset = resetBox();
    expect(reset.width).toBeGreaterThanOrEqual(48);
    expect(reset.x + reset.width + 8).toBeLessThanOrEqual(splitterGeometry.resetClearPx);
    const layout = splitterLayout(fit.scale, labelFontSize(fit.scale));
    for (const box of [layout.box, layout.grab, layout.up, layout.down]) {
      expect(overlaps(onScreen(box, fit), reset)).toBe(false);
    }
  });

  it('keeps the holder above the left pan with a row of pieces on the tablet', () => {
    const fontSize = labelFontSize(tablet);
    const { box } = splitterLayout(tablet, fontSize);
    const pan = beamPose(0).left;
    expect(box.y + box.height).toBeLessThan(pan.y - bladeHeight(fontSize));
  });

  it.each([
    ['the tablet', tablet],
    ['a phone at 640 × 360', phone],
    ['a large screen', 1],
  ])('makes every button and grab area at least 48 CSS px on %s', (_, scale) => {
    const layout = splitterLayout(scale, labelFontSize(scale));
    const min = minHitCssPx / scale;
    for (const box of [layout.up, layout.down, layout.grab, layout.onPansGrab]) {
      expect(box.width).toBeGreaterThanOrEqual(min - 1e-9);
      expect(box.height).toBeGreaterThanOrEqual(min - 1e-9);
    }
    for (const box of [layout.up, layout.down]) expect(within(box, layout.box)).toBe(true);
    expect(within(layout.blade, layout.grab)).toBe(true);
    expect(within(layout.onPans, layout.onPansGrab)).toBe(true);
  });

  it('lays the blade across both pans after a split that jams, from pan to pan, under the machine', () => {
    const layout = splitterLayout(tablet, labelFontSize(tablet));
    const rest = beamPose(0);
    expect(layout.onPans.x).toBeCloseTo(rest.left.x);
    expect(layout.onPans.x + layout.onPans.width).toBeCloseTo(rest.right.x);
    expect(layout.onPans.y).toBeGreaterThan(machineBounds().bottom);
    expect(layout.onPans.y + layout.onPans.height).toBeLessThan(scaleGeometry.pivot.y);
  });

  it('draws its frame line at least 1.5 CSS px', () => {
    expect(splitterLayout(tablet, labelFontSize(tablet)).lineWidth).toBe(4);
    expect(splitterLayout(phone, labelFontSize(phone)).lineWidth).toBeCloseTo(1.5 / phone);
  });
});

describe('panAreas and overHolder', () => {
  it('covers each pan’s width, with its pieces, at any tilt', () => {
    const areas = panAreas();
    for (const tilt of [-15, 0, 15]) {
      const pose = beamPose(tilt);
      for (const side of ['left', 'right'] as const) {
        const area = areas[side];
        const pan = pose[side];
        expect(area.x).toBeLessThan(pan.x - scaleGeometry.panWidth / 2);
        expect(area.x + area.width).toBeGreaterThan(pan.x + scaleGeometry.panWidth / 2);
        expect(area.y).toBeLessThan(pan.y - 150);
        expect(area.y + area.height).toBeGreaterThan(pan.y);
      }
    }
    expect(overlaps(areas.left, areas.right)).toBe(false);
  });

  it('takes a splitter let go over the holder, or near it, back into it', () => {
    const layout = splitterLayout(tablet, labelFontSize(tablet));
    const { box } = layout;
    expect(overHolder({ x: box.x + 10, y: box.y + 10 }, layout)).toBe(true);
    expect(
      overHolder(
        { x: box.x + box.width + splitterGeometry.dropMargin - 1, y: box.y + box.height },
        layout,
      ),
    ).toBe(true);
    expect(overHolder({ x: 800, y: 500 }, layout)).toBe(false);
  });
});
