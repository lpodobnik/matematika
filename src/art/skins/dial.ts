// Placeholder skin for the x dial: grey ink on paper, drawn in code (architecture, Asset
// Management). Epic 6 replaces it.
//
//   track    a line from notch 0 to the last, a tick on each notch, a stop at both ends
//   knob     a handle centred on its notch, with an index line down its middle

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';

export interface TrackShape {
  length: number;
  spacing: number;
  notches: number;
  tickHeight: number;
  lineWidth: number;
}

export const dialSkin = {
  /** The track, with its origin at notch 0 on the track's line. */
  track(g: Graphics, shape: TrackShape): void {
    g.clear();
    const { length, spacing, notches, tickHeight, lineWidth } = shape;
    g.moveTo(0, 0).lineTo(length, 0).stroke({ width: lineWidth, color: palette.ink, alpha: 0.6 });
    for (let i = 0; i <= notches; i += 1) {
      g.moveTo(i * spacing, -tickHeight / 2).lineTo(i * spacing, tickHeight / 2);
    }
    g.stroke({ width: lineWidth, color: palette.ink });
    for (const end of [0, length]) {
      g.rect(end - lineWidth, -tickHeight, lineWidth * 2, tickHeight * 2).fill({
        color: palette.ink,
      });
    }
  },

  /** The knob, centred on its notch. */
  knob(g: Graphics, width: number, height: number, lineWidth: number): void {
    g.clear();
    g.roundRect(-width / 2, -height / 2, width, height, width / 3)
      .fill({ color: palette.paper })
      .stroke({ width: lineWidth, color: palette.ink });
    g.moveTo(0, -height / 2 + lineWidth * 2)
      .lineTo(0, height / 2 - lineWidth * 2)
      .stroke({ width: lineWidth, color: palette.ink });
    for (const y of [-height / 4, height / 4]) {
      g.moveTo(-width / 4, y)
        .lineTo(width / 4, y)
        .stroke({ width: lineWidth / 2, color: palette.ink, alpha: 0.6 });
    }
  },
};
