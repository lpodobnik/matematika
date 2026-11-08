// Where the pin's head is in the scene area, in CSS px, for the HTML laid over the scene:
// the `+2` that rises from it (story 1.14), and the confirm control, in the corner. The canvas
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
    // The head is the flag's cloth, right of its pole (story 1.15).
    x: toX(placeX(layout, pin.slot) + layout.headX),
    y: toY(layout.headY),
    radius: layout.headRadius * scale,
    centreX: toX(dialGeometry.centerX),
  };
}

/** The confirm control's size (common.css: `.pin-confirm`), in CSS px. */
export const confirmSize: Size = { width: 132, height: 56 };
/** Kept between the control and the area's edges. */
export const confirmGapPx = 8;

/**
 * Where the confirm control goes (its top-left corner in the area): the scene's bottom-right
 * corner, always the same place, away from the flag and the dial. Only on a small screen, with
 * the flag at the far end of its track and so under that corner, it stands just above the flag.
 */
export function confirmSpot(area: Size, head: HeadSpot | null, size: Size = confirmSize) {
  const left = area.width - confirmGapPx - size.width;
  const top = area.height - confirmGapPx - size.height;
  const underIt = head && head.x + head.radius >= left && head.y + head.radius >= top;
  return {
    left,
    top: underIt ? Math.max(confirmGapPx, head.y - head.radius - confirmGapPx - size.height) : top,
  };
}
