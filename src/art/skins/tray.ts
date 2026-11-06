// Placeholder skin for the tray of spare pieces: grey ink on paper, drawn in code
// (architecture, Asset Management). Epic 6 replaces it. Its pieces are drawn by the scale's
// skin, so a weight on the tray looks like a weight on a pan.
//
//   shelf    a shallow tray with a lip, and a divider between the weight and the float
//   button   a round button with a − or + drawn as strokes (the sign is the shape, not a
//            font's glyph); a button that does nothing now is drawn faint, never by colour
//            alone (NFR4)
//
// The shelf is drawn in scene coordinates; a button with its origin at its top-left corner.

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';

const heavyFill = { color: palette.ink, alpha: 0.08 };
const lightFill = { color: palette.paper };

export interface ShelfShape {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Where the divider between the two pieces stands, in scene x. */
  dividerX: number;
  lineWidth: number;
}

export const traySkin = {
  /** The shelf: a tray with a lip along its bottom and a divider between its two pieces. */
  shelf(g: Graphics, shape: ShelfShape): void {
    g.clear();
    const { x, y, width, height, dividerX, lineWidth } = shape;
    const ink = { width: lineWidth, color: palette.ink };
    g.roundRect(x, y, width, height, 14).fill(lightFill).stroke(ink);
    const lip = Math.min(18, height * 0.1);
    g.rect(x + lineWidth, y + height - lip, width - lineWidth * 2, lip - lineWidth).fill(heavyFill);
    g.moveTo(dividerX, y + lineWidth * 3)
      .lineTo(dividerX, y + height - lineWidth * 3)
      .stroke({ width: lineWidth / 2, color: palette.ink, alpha: 0.5 });
  },

  /** A stepper button of `size`, with − (`by` −1) or + (`by` 1), faint when it does nothing. */
  button(g: Graphics, size: number, by: 1 | -1, enabled: boolean, lineWidth: number): void {
    g.clear();
    const alpha = enabled ? 1 : 0.35;
    const ink = { width: lineWidth, color: palette.ink, alpha };
    const r = size / 2;
    g.circle(r, r, r * 0.86)
      .fill(lightFill)
      .stroke(ink);
    const arm = r * 0.42;
    const sign = { width: lineWidth * 1.6, color: palette.ink, alpha };
    g.moveTo(r - arm, r)
      .lineTo(r + arm, r)
      .stroke(sign);
    if (by === 1) {
      g.moveTo(r, r - arm)
        .lineTo(r, r + arm)
        .stroke(sign);
    }
  },
};
