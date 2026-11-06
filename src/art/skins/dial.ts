// Placeholder skin for the x dial: grey ink on paper, drawn in code (architecture, Asset
// Management). Epic 6 replaces it.
//
//   track    a line from notch 0 to the last, a tick on each notch, a stop at both ends;
//            while a poke window holds the dial short, the track past it is fainter
//   clamp    the end of the poke window (story 1.14): a clamp gripping the track across it,
//            its screw on top, so the track is blocked there by shape, not just a thicker
//            tick (NFR4). It lifts away when the pin is confirmed
//   knob     a handle centred on its notch, with an index line down its middle
//   label    the knob's x (story 1.15): a paper plate above it, pointing down at it

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';

export interface TrackShape {
  length: number;
  spacing: number;
  notches: number;
  tickHeight: number;
  lineWidth: number;
}

/** How faint the track is past the poke window's clamp. */
const beyondAlpha = 0.25;

export const dialSkin = {
  /**
   * The track, with its origin at notch 0 on the track's line. Past `faintFrom` notches (the
   * poke window's clamp), its line, ticks and end stop are drawn fainter.
   */
  track(g: Graphics, shape: TrackShape, faintFrom: number | null = null): void {
    g.clear();
    const { length, spacing, notches, tickHeight, lineWidth } = shape;
    const split = faintFrom === null ? length : Math.min(length, faintFrom * spacing);
    const line = { width: lineWidth, color: palette.ink };
    g.moveTo(0, 0)
      .lineTo(split, 0)
      .stroke({ ...line, alpha: 0.6 });
    if (split < length) {
      g.moveTo(split, 0)
        .lineTo(length, 0)
        .stroke({ ...line, alpha: 0.6 * beyondAlpha });
    }
    for (const faint of split < length ? [false, true] : [false]) {
      for (let i = 0; i <= notches; i += 1) {
        if (i * spacing > split !== faint) continue;
        g.moveTo(i * spacing, -tickHeight / 2).lineTo(i * spacing, tickHeight / 2);
      }
      g.stroke({ ...line, alpha: faint ? beyondAlpha : 1 });
    }
    for (const end of [0, length]) {
      g.rect(end - lineWidth, -tickHeight, lineWidth * 2, tickHeight * 2).fill({
        color: palette.ink,
        alpha: end > split ? beyondAlpha : 1,
      });
    }
  },

  /**
   * The poke window's clamp, centred on the track's line at its origin: two jaws gripping
   * the track from above and below, joined by a frame on the far side, with a screw and its
   * handle on top. `width` is how wide its jaws are along the track.
   */
  clamp(g: Graphics, width: number, tickHeight: number, lineWidth: number): void {
    g.clear();
    const ink = { width: lineWidth, color: palette.ink };
    const jaw = tickHeight * 0.45;
    const reach = tickHeight * 0.9;
    const half = width / 2;
    // The frame: a C from the top jaw round the far side to the bottom jaw.
    g.moveTo(-half, -reach)
      .lineTo(half, -reach)
      .lineTo(half, reach)
      .lineTo(-half, reach)
      .stroke({ ...ink, width: lineWidth * 1.5 });
    for (const sign of [-1, 1]) {
      g.rect(-half, sign < 0 ? -reach : reach - jaw, width, jaw)
        .fill({ color: palette.ink, alpha: 0.35 })
        .stroke(ink);
    }
    // A bar across the track between the jaws blocks the knob.
    g.rect(-lineWidth * 1.5, -reach + jaw, lineWidth * 3, (reach - jaw) * 2).fill({
      color: palette.ink,
    });
    // The screw and its handle.
    const top = -reach - tickHeight * 0.7;
    g.moveTo(0, -reach)
      .lineTo(0, top)
      .stroke({ ...ink, width: lineWidth * 1.25 });
    g.moveTo(-half * 0.8, top)
      .lineTo(half * 0.8, top)
      .stroke({ ...ink, width: lineWidth * 1.75 });
  },

  /**
   * The x label's plate (story 1.15), centred over the knob: a small sign with its bottom
   * at `bottom` and a pointer down to the knob's top at `knobTop` (y from the track's line),
   * so it reads as the knob's own x. Its text is drawn over it.
   */
  label(
    g: Graphics,
    width: number,
    height: number,
    bottom: number,
    knobTop: number,
    lineWidth: number,
  ): void {
    g.clear();
    const ink = { width: lineWidth, color: palette.ink };
    const half = Math.min(width / 4, height * 0.22);
    g.poly([-half, bottom - lineWidth, half, bottom - lineWidth, 0, knobTop])
      .fill({ color: palette.ink })
      .stroke({ ...ink, join: 'round' });
    g.roundRect(-width / 2, bottom - height, width, height, height * 0.25)
      .fill({ color: palette.paper })
      .stroke(ink);
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
