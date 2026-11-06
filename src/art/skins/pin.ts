// Placeholder skin for the prediction pin: grey ink on paper, drawn in code (architecture,
// Asset Management). Epic 6 replaces it. Shape carries every state, so none is told by
// colour alone (NFR4):
//
//   pin       a post from its tip up to a round head; locked, it has a collar at the tip
//             and a heavier head, as if pressed in
//   arrow     a choice pin's option: the pan holding x going down or up, on the head or on
//             the option's place
//   light     a right pin: a flame in its head and rays around it, like a lit lamp, because
//             a right call is part of the machine starting
//   holder    the cradle the pin waits in before he drags it on
//   beyond    the marks of places past the dial's end, fainter than the dial's own ticks
//
// The pin is drawn with its origin at its x on the dial's band; y is the scene's.

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';
import type { EffectOption } from '@/room/types';

export interface PinShape {
  tipY: number;
  headY: number;
  headRadius: number;
  lineWidth: number;
}

const heavyFill = { color: palette.ink, alpha: 0.16 };
const lightFill = { color: palette.paper };
const rays = 8;

/** How far a right pin's rays reach from the head's centre, as a share of its radius. */
export const pinRayReach = 1.7;

export const pinSkin = {
  /** The pin: post and head. A locked pin gets a collar at its tip and a shaded head. */
  pin(g: Graphics, shape: PinShape, locked: boolean): void {
    g.clear();
    const { tipY, headY, headRadius, lineWidth } = shape;
    const ink = { width: lineWidth, color: palette.ink };
    g.moveTo(0, tipY)
      .lineTo(0, headY + headRadius)
      .stroke({ ...ink, width: lineWidth * 1.5 });
    g.poly([-lineWidth * 2, tipY - lineWidth * 3, lineWidth * 2, tipY - lineWidth * 3, 0, tipY])
      .fill({ color: palette.ink })
      .stroke(ink);
    if (locked) {
      g.rect(-headRadius * 0.4, tipY - lineWidth * 5, headRadius * 0.8, lineWidth * 2.5)
        .fill({ color: palette.ink })
        .stroke(ink);
    }
    g.circle(0, headY, headRadius)
      .fill(locked ? heavyFill : lightFill)
      .stroke({ ...ink, width: locked ? lineWidth * 1.75 : lineWidth });
  },

  /**
   * A choice pin's option, centred at (0, y): a small pan, and an arrow from it down or up.
   * `size` is the radius it fits in.
   */
  arrow(g: Graphics, option: EffectOption, y: number, size: number, lineWidth: number): void {
    const ink = { width: lineWidth * 1.25, color: palette.ink };
    const down = option === 'pan-down';
    const panY = y + (down ? -size * 0.45 : size * 0.45);
    g.moveTo(-size * 0.55, panY)
      .lineTo(size * 0.55, panY)
      .stroke({ ...ink, width: lineWidth * 2 });
    const from = panY + (down ? size * 0.18 : -size * 0.18);
    const to = y + (down ? size * 0.7 : -size * 0.7);
    g.moveTo(0, from).lineTo(0, to).stroke(ink);
    const head = down ? -size * 0.28 : size * 0.28;
    g.poly([-size * 0.28, to + head, size * 0.28, to + head, 0, to])
      .fill({ color: palette.ink })
      .stroke(ink);
  },

  /** An option's place on the track: a faint double ring with its arrow, unlike the pin's head. */
  place(g: Graphics, option: EffectOption, y: number, radius: number, lineWidth: number): void {
    g.clear();
    g.circle(0, y, radius).stroke({ width: lineWidth, color: palette.ink, alpha: 0.45 });
    g.circle(0, y, radius * 0.82).stroke({ width: lineWidth / 2, color: palette.ink, alpha: 0.3 });
    pinSkin.arrow(g, option, y, radius * 0.7, lineWidth * 0.75);
  },

  /** A right pin's flame and rays, over its head. */
  light(g: Graphics, shape: PinShape): void {
    g.clear();
    const { headY, headRadius, lineWidth } = shape;
    g.circle(0, headY, headRadius * 0.78).fill({ color: palette.lamp, alpha: 0.85 });
    const inner = headRadius * 1.15;
    const outer = headRadius * pinRayReach;
    for (let i = 0; i < rays; i += 1) {
      const angle = (i * 2 * Math.PI) / rays;
      // The rays skip the post below the head.
      if (Math.abs(angle - Math.PI / 2) < 0.1) continue;
      g.moveTo(Math.cos(angle) * inner, headY + Math.sin(angle) * inner).lineTo(
        Math.cos(angle) * outer,
        headY + Math.sin(angle) * outer,
      );
    }
    g.stroke({ width: lineWidth, color: palette.lamp });
  },

  /** The holder: a cradle under the head and a foot on the track, at the holder's x. */
  holder(g: Graphics, shape: PinShape): void {
    g.clear();
    const { tipY, headY, headRadius, lineWidth } = shape;
    const ink = { width: lineWidth, color: palette.ink, alpha: 0.6 };
    const r = headRadius * 1.2;
    g.arc(0, headY, r, Math.PI * 0.15, Math.PI * 0.85).stroke(ink);
    g.moveTo(0, headY + r)
      .lineTo(0, tipY)
      .stroke(ink);
    g.rect(-headRadius * 0.6, tipY, headRadius * 1.2, lineWidth * 2).fill({
      color: palette.ink,
      alpha: 0.6,
    });
  },

  /**
   * Marks for the places past the dial's end, from `fromX` to `toX` on the track line (x
   * relative to the track's origin): a faint line and a faint tick on each place.
   */
  beyond(
    g: Graphics,
    fromX: number,
    toX: number,
    spacing: number,
    trackY: number,
    tickHeight: number,
    lineWidth: number,
  ): void {
    g.clear();
    if (toX <= fromX) return;
    const faint = { width: lineWidth, color: palette.ink, alpha: 0.3 };
    g.moveTo(fromX, trackY).lineTo(toX, trackY).stroke(faint);
    for (let x = fromX + spacing; x <= toX + spacing / 1000; x += spacing) {
      g.moveTo(x, trackY - tickHeight / 3).lineTo(x, trackY + tickHeight / 3);
    }
    g.stroke(faint);
  },
};
