// Placeholder skin for the prediction pin: grey ink on paper, drawn in code (architecture,
// Asset Management). Epic 6 replaces it. Shape carries every state, so none is told by
// colour alone (NFR4):
//
//   pin       a small flag (story 1.15): a pole with a flat cap, sharpened like a stake where
//             it touches the track, with a waving cloth on its right that carries the pin's
//             number (or, for a direction pin, its picture). Locked, the point is gone into
//             the track and a plate sits at the foot, as if the pole were driven in, and the
//             cloth is shaded. No round head is left, so it can't be taken for a balloon
//   picture   a direction pin's option (story 1.15): the whole scale, tilted left or right,
//             on the flag's cloth or on the option's place
//   light     a right pin: its cloth glows and rays shine around it, like a lit lamp,
//             because a right call is part of the machine starting
//   holder    the stand the flag waits in before he drags it on: a socket on the track and a
//             bracket over the pole's top, where the question tag's string is tied
//   place     a direction pin's option on the track: a faint flag, its picture in the cloth
//   tag       the paper tag with the pin's question (story 1.14): a card with clipped
//             corners and a punched hole, on a string tied to the holder or to a nail
//   beyond    the marks of places past the dial's end, fainter than the dial's own ticks
//
// The pin is drawn with its origin at its x on the dial's band, where the pole stands; y is
// the scene's. The cloth is centred `headX` right of the pole, on the head's old spot.

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';
import type { EffectOption } from '@/room/types';

export interface PinShape {
  tipY: number;
  /** The cloth's centre: `headX` right of the pole, at `headY`. */
  headX: number;
  headY: number;
  /** Half the cloth's width; its height is a little less than twice this. */
  headRadius: number;
  lineWidth: number;
}

/** The question tag's card, its hole, and where its string is tied, in scene units. */
export interface TagShape {
  box: { x: number; y: number; width: number; height: number };
  hole: { x: number; y: number };
  tie: { x: number; y: number };
  /** Tied to a nail on the wall, not to the holder. */
  nail: boolean;
  lineWidth: number;
}

const heavyFill = { color: palette.ink, alpha: 0.16 };
const lightFill = { color: palette.paper };
const rays = 8;

/** How far a right pin's rays reach from the cloth's centre, as a share of its half width. */
export const pinRayReach = 1.7;

/** The cloth's half height above and below its centre, as shares of its half width. */
const clothAbove = 0.85;
const clothBelow = 0.8;
/** How far the cloth's top and bottom edges wave, as a share of its half width. */
const clothWave = 0.16;
/** A direction pin's picture of the scale, across, as a share of the cloth's half width. */
const pictureSize = 1.9;

/** A flag's parts, from its pole at x = 0 (story 1.15). */
export interface FlagParts {
  /** The pole's top (above the cloth, under a flat cap) and its foot on the track. */
  poleTop: number;
  foot: number;
  /** Where the cloth hangs: its edge on the pole, its fly end, its top and its bottom. */
  cloth: { left: number; right: number; top: number; bottom: number };
  /** The cloth's centre, where its number or picture goes. */
  centre: { x: number; y: number };
}

/** Where the flag's pole and cloth are. */
export function flagParts(shape: PinShape): FlagParts {
  const { tipY, headX, headY, headRadius: r, lineWidth } = shape;
  const top = headY - r * clothAbove;
  return {
    poleTop: top - lineWidth * 3,
    foot: tipY,
    cloth: { left: headX - r, right: headX + r, top, bottom: headY + r * clothBelow },
    centre: { x: headX, y: headY },
  };
}

/** The holder's parts, from where the flag's pole stands in it (story 1.15). */
export interface HolderParts {
  /** The bracket's post, left of the pole, from the track up to its top… */
  postX: number;
  top: number;
  /** …where the question tag's string is tied. */
  tie: { x: number; y: number };
}

/** Where the holder's bracket is: its post left of the pole, its arm over the cloth. */
export function holderParts(shape: PinShape): HolderParts {
  const postX = -shape.headRadius * 0.55;
  const top = flagParts(shape).cloth.top - shape.lineWidth * 2;
  return { postX, top, tie: { x: postX, y: top } };
}

/**
 * The box a flag, or its holder, takes from its pole's x: the holder's bracket on the left,
 * the cloth on the right, from the pole's cap down to the track.
 */
export function flagBounds(shape: PinShape): { left: number; right: number; top: number } {
  const { cloth, poleTop } = flagParts(shape);
  return {
    left: holderParts(shape).postX - shape.lineWidth * 2,
    right: cloth.right + shape.lineWidth,
    top: poleTop - shape.lineWidth * 3,
  };
}

/** The cloth's outline: its edge on the pole, a waving top, its fly end, a waving bottom. */
function cloth(g: Graphics, parts: FlagParts, r: number): Graphics {
  const { left, right, top, bottom } = parts.cloth;
  const w = right - left;
  const wave = r * clothWave;
  return g
    .moveTo(left, top)
    .bezierCurveTo(left + w / 3, top - wave, left + (2 * w) / 3, top + wave, right, top)
    .lineTo(right, bottom)
    .bezierCurveTo(left + (2 * w) / 3, bottom + wave, left + w / 3, bottom - wave, left, bottom)
    .closePath();
}

/**
 * The whole scale, tilted toward `option`, centred at (cx, cy) and `size` across: a stand,
 * a beam through its pivot with its lower end on the option's side, and a pan on a short
 * post at each end. Its lines are `alpha` strong.
 */
function tiltedScale(
  g: Graphics,
  option: EffectOption,
  cx: number,
  cy: number,
  size: number,
  lineWidth: number,
  alpha = 1,
): void {
  const ink = { width: lineWidth, color: palette.ink, alpha };
  const s = size / 2;
  const pivot = { x: cx, y: cy - s * 0.02 };
  const footY = cy + s * 0.62;
  // The stand: a foot and a post up to the pivot.
  g.moveTo(cx - s * 0.32, footY)
    .lineTo(cx + s * 0.32, footY)
    .moveTo(cx, footY)
    .lineTo(pivot.x, pivot.y)
    .stroke(ink);
  // The beam, its left end lower when the scale tilts left: 20°, so the tilt reads at once.
  const reach = s * 0.62;
  const angle = ((option === 'tilt-left' ? -20 : 20) * Math.PI) / 180;
  const dx = reach * Math.cos(angle);
  const dy = reach * Math.sin(angle);
  const ends = [
    { x: pivot.x - dx, y: pivot.y - dy },
    { x: pivot.x + dx, y: pivot.y + dy },
  ];
  g.moveTo(ends[0]?.x ?? 0, ends[0]?.y ?? 0)
    .lineTo(ends[1]?.x ?? 0, ends[1]?.y ?? 0)
    .stroke({ ...ink, width: lineWidth * 1.4 });
  // A pan on a short post above each end, level, as on the real scale.
  const post = s * 0.16;
  const half = s * 0.3;
  for (const end of ends) {
    const panY = end.y - post;
    g.moveTo(end.x, end.y).lineTo(end.x, panY).stroke(ink);
    g.poly([
      end.x - half,
      panY,
      end.x + half,
      panY,
      end.x + half * 0.6,
      panY + s * 0.1,
      end.x - half * 0.6,
      panY + s * 0.1,
    ])
      .fill({ color: palette.ink, alpha: 0.16 * alpha })
      .stroke(ink);
  }
  g.circle(pivot.x, pivot.y, lineWidth * 0.9).fill({ color: palette.ink, alpha });
}

export const pinSkin = {
  /**
   * The flag: pole, cap and cloth. Free, its foot is a spike touching the track; locked,
   * the spike is driven into the track, a plate sits at its foot and the cloth is shaded.
   */
  pin(g: Graphics, shape: PinShape, locked: boolean): void {
    g.clear();
    const { headRadius: r, lineWidth } = shape;
    const parts = flagParts(shape);
    const ink = { width: lineWidth, color: palette.ink };
    const half = lineWidth * 0.75;
    const spike = lineWidth * 5;
    // The pole, down to its sharpened foot, or (driven in) right into the track.
    g.moveTo(0, parts.poleTop)
      .lineTo(0, locked ? parts.foot + lineWidth : parts.foot - spike)
      .stroke({ ...ink, width: half * 2 });
    if (locked) {
      g.rect(-lineWidth * 2.5, parts.foot - lineWidth * 2, lineWidth * 5, lineWidth * 2)
        .fill({ color: palette.ink })
        .stroke(ink);
    } else {
      // Sharpened like a stake, no wider than the pole, so it never reads as an arrow.
      g.poly([-half, parts.foot - spike, half, parts.foot - spike, 0, parts.foot])
        .fill({ color: palette.ink })
        .stroke({ ...ink, width: lineWidth * 0.5 });
    }
    // A flat cap on the pole's top.
    g.rect(-lineWidth * 1.25, parts.poleTop - lineWidth, lineWidth * 2.5, lineWidth).fill({
      color: palette.ink,
    });
    cloth(g, parts, r)
      .fill(locked ? heavyFill : lightFill)
      .stroke({ ...ink, width: locked ? lineWidth * 1.75 : lineWidth });
  },

  /** A direction pin's picture on its flag's cloth: the whole scale, tilted its way. */
  picture(g: Graphics, shape: PinShape, option: EffectOption): void {
    g.clear();
    const { centre } = flagParts(shape);
    tiltedScale(g, option, centre.x, centre.y, shape.headRadius * pictureSize, shape.lineWidth);
  },

  /**
   * A direction pin's option on the track: a faint flag where the flag goes, with the
   * option's picture in its cloth (its word, from hr.ts, is set above it by the scene).
   */
  place(g: Graphics, shape: PinShape, option: EffectOption): void {
    g.clear();
    const { headRadius: r, lineWidth } = shape;
    const parts = flagParts(shape);
    const faint = { width: lineWidth, color: palette.ink, alpha: 0.35 };
    g.moveTo(0, parts.poleTop).lineTo(0, parts.foot).stroke(faint);
    cloth(g, parts, r).fill({ color: palette.paper, alpha: 0.6 }).stroke(faint);
    tiltedScale(g, option, parts.centre.x, parts.centre.y, r * pictureSize, lineWidth, 0.75);
  },

  /** A right pin's glow and rays, over its cloth. */
  light(g: Graphics, shape: PinShape): void {
    g.clear();
    const { headRadius: r, lineWidth } = shape;
    const parts = flagParts(shape);
    cloth(g, parts, r).fill({ color: palette.lamp, alpha: 0.55 });
    const { x, y } = parts.centre;
    const inner = r * 1.15;
    const outer = r * pinRayReach;
    for (let i = 0; i < rays; i += 1) {
      const angle = (i * 2 * Math.PI) / rays;
      // The rays skip the pole, on the cloth's left.
      if (Math.abs(angle - Math.PI) < 0.1) continue;
      g.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner).lineTo(
        x + Math.cos(angle) * outer,
        y + Math.sin(angle) * outer,
      );
    }
    g.stroke({ width: lineWidth, color: palette.lamp });
  },

  /** The holder: a foot and a socket on the track, and a bracket over the pole's top. */
  holder(g: Graphics, shape: PinShape): void {
    g.clear();
    const { tipY, headRadius: r, lineWidth } = shape;
    const ink = { width: lineWidth, color: palette.ink, alpha: 0.6 };
    const { postX, top } = holderParts(shape);
    g.rect(-r * 0.6, tipY, r * 1.2, lineWidth * 2).fill({ color: palette.ink, alpha: 0.6 });
    g.rect(-lineWidth * 2, tipY - lineWidth * 5, lineWidth * 4, lineWidth * 5).stroke(ink);
    // The bracket: up from the foot, over to the pole, and a hook down beside it.
    g.moveTo(postX, tipY)
      .lineTo(postX, top)
      .lineTo(lineWidth * 1.8, top)
      .lineTo(lineWidth * 1.8, top + lineWidth * 3)
      .stroke(ink);
  },

  /** The question tag: its card, the hole punched in it, and its string to the tie. */
  tag(g: Graphics, shape: TagShape): void {
    g.clear();
    const { box, hole, tie, nail, lineWidth } = shape;
    const { x, y, width: w, height: h } = box;
    const c = Math.min(w, h) * 0.14;
    // The card's eight corners: a rectangle with its corners clipped.
    const corners = [
      [x + c, y],
      [x + w - c, y],
      [x + w, y + c],
      [x + w, y + h - c],
      [x + w - c, y + h],
      [x + c, y + h],
      [x, y + h - c],
      [x, y + c],
    ];
    g.poly(corners.flat())
      .fill({ color: palette.paper })
      .stroke({ width: lineWidth, color: palette.ink });
    g.circle(hole.x, hole.y, lineWidth * 1.75)
      .fill({ color: palette.ink, alpha: 0.12 })
      .stroke({ width: lineWidth * 0.75, color: palette.ink });
    g.moveTo(hole.x, hole.y)
      .lineTo(tie.x, tie.y)
      .stroke({ width: lineWidth * 0.75, color: palette.ink, alpha: 0.8 });
    if (nail) g.circle(tie.x, tie.y, lineWidth * 1.5).fill({ color: palette.ink });
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
