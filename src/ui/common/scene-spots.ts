// Where the pin's head is in the scene area, in CSS px, for the HTML laid over the scene:
// the confirm control beside it, and the `+2` that rises from it (story 1.14). The canvas
// fills the scene area and the 1600 × 1000 scene is fitted and centred in it (fitScene);
// with the dev panel's three copies, the first copy's pin counts. Presentation only, with
// no React, Pixi or DOM, so the layout tests can check it at 640 × 360 and on the tablet.

import type { PinView } from '@/room/pin';
import { copyPlacements } from '@/ui/scene/copies';
import { fitScene } from '@/ui/scene/fit-scene';
import { dialGeometry, dialLayout } from '@/ui/scene/scale/dial-layout';
import { labelFontSize } from '@/ui/scene/scale/layout';
import { pinLayout, placeX } from '@/ui/scene/scale/pin-layout';

export interface Size {
  width: number;
  height: number;
}

/** The pin's head in the scene area: its centre and radius, in CSS px. */
export interface HeadSpot {
  x: number;
  y: number;
  radius: number;
  /** The dial's centre line, in CSS px from the area's left. */
  centreX: number;
}

/**
 * The pin's head in an area of `area` CSS px, with the scene drawn `copies` times and the
 * dial's `notches`, or null before the area has a size.
 */
export function pinHeadSpot(
  area: Size,
  copies: number,
  notches: number,
  pin: Pick<PinView, 'kind' | 'slots' | 'slot'>,
): HeadSpot | null {
  const fit = fitScene(area.width, area.height);
  const [copy] = copyPlacements(copies);
  if (!copy || !(fit.scale > 0) || pin.slots < 1) return null;
  const scale = fit.scale * copy.scale;
  const layout = pinLayout(dialLayout(scale, notches), pin, labelFontSize(scale));
  const toX = (x: number) => fit.x + (copy.x + x * copy.scale) * fit.scale;
  const toY = (y: number) => fit.y + (copy.y + y * copy.scale) * fit.scale;
  return {
    x: toX(placeX(layout, pin.slot)),
    y: toY(layout.headY),
    radius: layout.headRadius * scale,
    centreX: toX(dialGeometry.centerX),
  };
}

/** The confirm control's size (common.css: `.pin-confirm`), in CSS px. */
export const confirmSize: Size = { width: 132, height: 56 };
/** Kept between the control and the head, and between it and the area's edges. */
export const confirmGapPx = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Where the confirm control goes, beside the pin's head (its top-left corner in the area),
 * with its bottom level with the head's, so it stays clear of the knob below. An x pin's
 * control goes on the side toward the dial's centre, over the stand's foot, clear of the
 * pans' readouts under their outer halves; a choice pin's goes on the outer side, so it never
 * covers the other option. It takes the other side when there is no room, and always stays
 * inside the area.
 */
export function confirmSpot(
  head: HeadSpot,
  kind: PinView['kind'],
  area: Size,
  size: Size = confirmSize,
) {
  const gap = confirmGapPx;
  const right = head.x + head.radius + gap;
  const left = head.x - head.radius - gap - size.width;
  const roomRight = right + size.width <= area.width - gap;
  const roomLeft = left >= gap;
  const leftOfCentre = head.x < head.centreX;
  const preferRight = kind === 'choice' ? !leftOfCentre : leftOfCentre;
  const goRight = preferRight ? roomRight || !roomLeft : !roomLeft && roomRight;
  return {
    left: clamp(goRight ? right : left, gap, area.width - gap - size.width),
    top: clamp(head.y + head.radius - size.height, gap, area.height - gap - size.height),
  };
}
