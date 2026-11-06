// Placeholder skin for the goal card (story 1.16): grey ink on paper, drawn in code
// (architecture, Asset Management). Epic 6 replaces it. Shape carries its state, and colour
// only adds to it (NFR4):
//
//   card      a small paper card standing on a ledge, its label on the left (set by the
//             scene, from hr.ts) and a miniature scale on the right
//   picture   the miniature scale, level: a stand, a beam, a pan at each end; one x-gear
//             alone on the left pan, a weight on the right one (the scene sets `x` and `?`
//             on them)
//   matched   the pans match the picture: the card's frame grows heavier, a tick in a ring
//             stands over the picture's pivot, and it lights like a right pin's lamp
//             (skins/pin.ts): a lamp-coloured glow on the card and rays round the tick

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GoalCardShape {
  box: Rect;
  /** Where the miniature scale goes, inside the card. */
  picture: Rect;
  lineWidth: number;
}

/** The miniature scale's parts, from its picture box; one em is the box's height over 2.3. */
export interface GoalPictureParts {
  /** One em of the card's label, in scene units. */
  em: number;
  pivot: { x: number; y: number };
  footY: number;
  /** The beam's ends, where the pans' posts stand. */
  ends: [{ x: number; y: number }, { x: number; y: number }];
  /** The pans' surface. */
  panY: number;
  panHalf: number;
  gear: { x: number; y: number; radius: number };
  /** The weight's bottom centre, its size, and where its `?` is centred. */
  weight: { x: number; y: number; width: number; height: number };
  /** Where the labels are centred, and their size. */
  gearLabel: { x: number; y: number };
  weightLabel: { x: number; y: number };
  labelSize: number;
  /** The tick's ring, over the pivot, between the pans' pieces. */
  tick: { x: number; y: number; radius: number };
}

/** The picture's height in em: the label's two lines. */
const pictureEms = 2.3;
const rays = 8;

export function goalPictureParts(picture: Rect): GoalPictureParts {
  const em = picture.height / pictureEms;
  const cx = picture.x + picture.width / 2;
  const pivot = { x: cx, y: picture.y + picture.height - 0.75 * em };
  const reach = 0.98 * em;
  const panY = pivot.y - 0.15 * em;
  const radius = 0.42 * em;
  const weight = { x: cx + reach, y: panY, width: 0.84 * em, height: 0.8 * em };
  return {
    em,
    pivot,
    footY: picture.y + picture.height,
    ends: [
      { x: cx - reach, y: pivot.y },
      { x: cx + reach, y: pivot.y },
    ],
    panY,
    panHalf: 0.42 * em,
    gear: { x: cx - reach, y: panY - radius, radius },
    weight,
    gearLabel: { x: cx - reach, y: panY - radius },
    // The middle of the weight's body, which is 0.8 of its height (as skins/scale.ts draws it).
    weightLabel: { x: weight.x, y: panY - weight.height * 0.4 },
    labelSize: 0.58 * em,
    tick: { x: cx, y: picture.y + 0.36 * em, radius: 0.26 * em },
  };
}

/** The rim of a toothed wheel, as the scale's gears have (skins/scale.ts), in points. */
function toothedRim(cx: number, cy: number, radius: number, teeth: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < teeth * 4; i += 1) {
    const angle = (i / (teeth * 4)) * Math.PI * 2;
    const r = i % 4 < 2 ? radius : radius * 0.84;
    points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  return points;
}

export const goalSkin = {
  /**
   * The card on its ledge: paper with rounded corners, its frame heavier and its paper
   * glowing lamp-coloured when the pans match it.
   */
  card(g: Graphics, shape: GoalCardShape, matched: boolean): void {
    g.clear();
    const { box, lineWidth } = shape;
    const radius = Math.min(box.width, box.height) * 0.08;
    g.roundRect(box.x, box.y, box.width, box.height, radius).fill({ color: palette.paper });
    if (matched) {
      g.roundRect(box.x, box.y, box.width, box.height, radius).fill({
        color: palette.lamp,
        alpha: 0.3,
      });
    }
    g.roundRect(box.x, box.y, box.width, box.height, radius).stroke({
      width: matched ? lineWidth * 2.2 : lineWidth,
      color: palette.ink,
    });
    // The ledge it stands on.
    const ledge = box.y + box.height + lineWidth * 0.75;
    g.moveTo(box.x - lineWidth * 2, ledge)
      .lineTo(box.x + box.width + lineWidth * 2, ledge)
      .stroke({ width: lineWidth, color: palette.ink, alpha: 0.5 });
  },

  /** The miniature scale, level, with one x-gear alone on the left pan and a weight on the right. */
  picture(g: Graphics, shape: GoalCardShape): void {
    g.clear();
    const parts = goalPictureParts(shape.picture);
    const { em, pivot, footY, ends, panY, panHalf, gear, weight } = parts;
    const ink = { width: shape.lineWidth, color: palette.ink };
    const shade = { color: palette.ink, alpha: 0.16 };
    // The stand: a foot and a post up to the pivot.
    g.rect(pivot.x - 0.45 * em, footY - 0.12 * em, 0.9 * em, 0.12 * em)
      .fill(shade)
      .stroke(ink);
    g.moveTo(pivot.x, footY - 0.12 * em)
      .lineTo(pivot.x, pivot.y)
      .stroke(ink);
    // The beam, level, and a pan on a short post at each end.
    g.moveTo(ends[0].x, ends[0].y)
      .lineTo(ends[1].x, ends[1].y)
      .stroke({ ...ink, width: shape.lineWidth * 1.4 });
    for (const end of ends) {
      g.moveTo(end.x, end.y).lineTo(end.x, panY).stroke(ink);
      g.poly([
        end.x - panHalf,
        panY,
        end.x + panHalf,
        panY,
        end.x + panHalf * 0.7,
        panY + 0.08 * em,
        end.x - panHalf * 0.7,
        panY + 0.08 * em,
      ])
        .fill(shade)
        .stroke(ink);
    }
    g.circle(pivot.x, pivot.y, shape.lineWidth).fill({ color: palette.ink });
    // One x-gear alone on the left pan…
    g.poly(toothedRim(gear.x, gear.y, gear.radius, 10), true)
      .fill({ color: palette.paper })
      .stroke(ink);
    // …and a weight with its handle on the right one.
    const body = weight.height * 0.8;
    g.circle(weight.x, weight.y - body, weight.height * 0.14).stroke(ink);
    g.poly([
      weight.x - weight.width / 2,
      weight.y,
      weight.x + weight.width / 2,
      weight.y,
      weight.x + (weight.width * 0.78) / 2,
      weight.y - body,
      weight.x - (weight.width * 0.78) / 2,
      weight.y - body,
    ])
      .fill(shade)
      .stroke(ink);
  },

  /** The pans match the picture: a tick in a ring over the pivot, with a lamp's rays round it. */
  tick(g: Graphics, shape: GoalCardShape): void {
    g.clear();
    const { tick } = goalPictureParts(shape.picture);
    const { x, y, radius: r } = tick;
    const { lineWidth } = shape;
    g.circle(x, y, r)
      .fill({ color: palette.lamp, alpha: 0.55 })
      .stroke({ width: lineWidth, color: palette.ink });
    g.moveTo(x - r * 0.5, y)
      .lineTo(x - r * 0.12, y + r * 0.4)
      .lineTo(x + r * 0.55, y - r * 0.4)
      .stroke({ width: lineWidth * 1.4, color: palette.ink, cap: 'round', join: 'round' });
    for (let i = 0; i < rays; i += 1) {
      const angle = (i * 2 * Math.PI) / rays + Math.PI / rays;
      g.moveTo(x + Math.cos(angle) * r * 1.25, y + Math.sin(angle) * r * 1.25).lineTo(
        x + Math.cos(angle) * r * 1.75,
        y + Math.sin(angle) * r * 1.75,
      );
    }
    g.stroke({ width: lineWidth, color: palette.lamp });
  },
};
