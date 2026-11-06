// Placeholder skin for the scale and its pieces: grey ink on paper, drawn in code
// (architecture, Asset Management). Epic 6 replaces it. Every piece kind has its own shape,
// so none is told apart by colour alone (NFR4):
//
//   weight   a trapezoid block with a handle
//   float    a balloon with a knot, on a curved string down to the pan, under a bold arrow
//            pointing up: it lifts its pan (story 1.14). No post and no round head, so it
//            can't be taken for the prediction pin, which points down
//   gear     a toothed wheel (more teeth when large)
//   spring   a coil under a cap
//   x : n    one slice of n (story 1.14): a gear divided by n is a faint ghost gear cut
//            into n, carrying x, with one n-th sector drawn solid, standing on the pan; a
//            spring divided by n has its cap cut into n layers, the bottom one solid. A tag
//            `: n` is tied to the solid part and hangs beside it, so it never hides it
//   readout  a display window with a double frame under a pan, unlike any piece
//
// Pieces are drawn with their origin at the bottom centre, rising into negative y. A divided
// piece's body (gear or cap) is the left part of its box, and its tag the right.

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';
import type { PieceKind } from '@/room/pieces';

const ink = { width: 4, color: palette.ink };
const fineInk = { width: 2, color: palette.ink, alpha: 0.6 };
const heavyFill = { color: palette.ink, alpha: 0.16 };
const lightFill = { color: palette.paper };
/** The whole of a divided gear or spring: there, but not on the pan. */
const ghostInk = { width: 2, color: palette.ink, alpha: 0.35 };
const ghostFill = { color: palette.paper, alpha: 0.35 };
/** The one slice that is on the pan: shaded, so it reads solid against its faint whole. */
const sliceFill = { color: palette.ink, alpha: 0.2 };

/** Where a piece's label is centred, from its bottom centre. */
export interface LabelSpot {
  x: number;
  y: number;
}

/** A piece's size and kind, as laid out on its pan. */
export interface PieceShape {
  kind: PieceKind;
  width: number;
  height: number;
  /** A gear or spring divided by n is drawn as one slice of n; 0 for one not divided. */
  slices: number;
  /** The size of the tag showing `: n` beside the slice; 0 for none. */
  tagWidth: number;
  tagHeight: number;
  /** A large gear or spring, standing for more than 12 x. */
  large: boolean;
}

const springCap = 0.56;
/** A divided spring's coil, as a share of its height; its cap, cut into layers, is the rest. */
const dividedCoil = 0.28;
/** How far above a ghost gear's centre its x sits, as a share of its radius: clear of the slice. */
const sliceLabelLift = 0.45;
/** The most parts a piece is drawn cut into, so a huge divisor still shows a 10° sliver. */
const maxDrawnSlices = 36;
/** Where a toothed wheel's teeth start, as a share of its radius. */
const toothRoot = 0.84;

/** The points of a toothed wheel's rim, from angle `from` to `to` (radians, clockwise on screen). */
function toothedRim(
  cx: number,
  cy: number,
  radius: number,
  teeth: number,
  from = 0,
  to = Math.PI * 2,
): number[] {
  const points: number[] = [];
  const steps = teeth * 4;
  const whole = to - from >= Math.PI * 2 - 1e-9;
  const edge = (angle: number) => {
    const r = radius * (1 + toothRoot) * 0.5;
    points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  };
  if (!whole) edge(from);
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    if (!whole && (angle <= from || angle >= to)) continue;
    const r = i % 4 < 2 ? radius : radius * toothRoot;
    points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  if (!whole) edge(to);
  return points;
}

function toothedWheel(g: Graphics, cx: number, cy: number, radius: number, teeth: number): void {
  g.poly(toothedRim(cx, cy, radius, teeth), true)
    .fill(lightFill)
    .stroke(ink);
  g.circle(cx, cy, radius * 0.62).stroke(fineInk);
}

/** A float's parts, from its bottom centre (story 1.14). */
export interface BalloonParts {
  /** The balloon's widest point, where its number sits. */
  centre: LabelSpot;
  /** Its half width, its top, and its bottom where the knot is tied. */
  halfWidth: number;
  top: number;
  bottom: number;
  /** The knot hangs from the balloon's bottom down to here, where the string starts. */
  knot: number;
  /** The arrow above the balloon: from its tail up to its tip, and its head's half width. */
  arrow: { tail: number; tip: number; head: number };
}

/** Shares of a float's height, from the top: arrow, gap, balloon, knot; the string is the rest. */
const balloonShares = { arrow: 0.3, gap: 0.03, balloon: 0.43, knot: 0.04 } as const;
/** The balloon is widest this far down from its top, as a share of its height. */
const balloonWidest = 0.42;

/**
 * Where a float's balloon, knot and arrow are. The balloon floats on its string well above
 * the pan; the arrow is at least as tall as from the knot to the balloon's centre.
 */
export function balloonParts(width: number, height: number): BalloonParts {
  const { arrow, gap, balloon, knot } = balloonShares;
  const tip = -height;
  const tail = tip + height * arrow;
  const top = tail + height * gap;
  const bottom = top + height * balloon;
  return {
    centre: { x: 0, y: top + (bottom - top) * balloonWidest },
    halfWidth: width / 2,
    top,
    bottom,
    knot: bottom + height * knot,
    arrow: { tail, tip, head: Math.min(width * 0.28, height * 0.12) },
  };
}

/**
 * How much of a divided piece's tag overlaps its body (story 1.14): the tag hangs beside the
 * gear or cap, a quarter of it over the body's faint edge, so the solid slice stays in view.
 */
export const tagOverlap = 0.25;

/** A divided gear or spring's body: the gear or cap, at the left of its box, beside its tag. */
export function slicedBody(shape: PieceShape): { left: number; width: number; centreX: number } {
  const width = shape.width - shape.tagWidth * (1 - tagOverlap);
  const left = -shape.width / 2;
  return { left, width, centreX: left + width / 2 };
}

/** A divided gear's parts, from its bottom centre (story 1.14). */
export interface SliceParts {
  /** The ghost gear: its centre and radius. */
  centre: LabelSpot;
  radius: number;
  /** How many slices it is cut into, as drawn. */
  slices: number;
  /** The solid slice: a sector pointing down, from `from` to `to` (radians, clockwise on screen). */
  from: number;
  to: number;
}

/** One slice of a gear cut into n: the gear stands on the pan, and so does its bottom slice. */
export function gearSlice(shape: PieceShape): SliceParts {
  const radius = shape.height / 2;
  const slices = Math.min(Math.max(shape.slices, 1), maxDrawnSlices);
  const half = Math.PI / slices;
  return {
    centre: { x: slicedBody(shape).centreX, y: -radius },
    radius,
    slices,
    from: Math.PI / 2 - half,
    to: Math.PI / 2 + half,
  };
}

/** A divided spring's cap, cut into layers: its top and bottom, and the solid bottom layer's top. */
export function springLayers(shape: PieceShape): { top: number; bottom: number; solidTop: number } {
  const slices = Math.min(Math.max(shape.slices, 1), maxDrawnSlices);
  const bottom = -shape.height * dividedCoil;
  const top = -shape.height;
  return { top, bottom, solidTop: bottom - (bottom - top) / slices };
}

/** A tag's box: its centre, and its size. */
export interface TagBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The tag showing `: n`: beside the body on its right, at the height of the solid part (a
 * gear's slice runs down from its centre), never below the pan or above the piece.
 */
export function sliceTag(shape: PieceShape): TagBox {
  const { tagWidth: width, tagHeight: height } = shape;
  const body = slicedBody(shape);
  const x = body.left + body.width - width * tagOverlap + width / 2;
  const wanted =
    shape.kind === 'gear'
      ? -shape.height / 2 + shape.height * 0.14
      : (springLayers(shape).solidTop + springLayers(shape).bottom) / 2;
  const y = Math.max(-shape.height + height / 2, Math.min(wanted, -height / 2 - 2));
  return { x, y, width, height };
}

/** Where the tag's string is tied on the solid part: on the slice's edge facing the tag. */
function tagKnot(shape: PieceShape): LabelSpot {
  if (shape.kind === 'gear') {
    const { centre, radius, from } = gearSlice(shape);
    return {
      x: centre.x + radius * 0.6 * Math.cos(from),
      y: centre.y + radius * 0.6 * Math.sin(from),
    };
  }
  const body = slicedBody(shape);
  const { bottom, solidTop } = springLayers(shape);
  return { x: body.left + body.width - 8, y: (solidTop + bottom) / 2 };
}

function drawBalloon(g: Graphics, width: number, height: number): void {
  const { centre, halfWidth: rx, top, bottom, knot, arrow } = balloonParts(width, height);
  const cy = centre.y;
  const k = 0.5523;
  // The string: from the knot down to the pan, with a slight curve.
  g.moveTo(0, knot)
    .bezierCurveTo(rx * 0.4, knot * 0.66, -rx * 0.4, knot * 0.33, rx * 0.12, 0)
    .stroke({ ...fineInk, alpha: 0.8 });
  // The balloon: round on top, narrowing to its knot.
  g.moveTo(0, bottom)
    .bezierCurveTo(rx * 0.5, bottom - (bottom - cy) * 0.12, rx, cy + (bottom - cy) * 0.55, rx, cy)
    .bezierCurveTo(rx, cy - (cy - top) * k, rx * k, top, 0, top)
    .bezierCurveTo(-rx * k, top, -rx, cy - (cy - top) * k, -rx, cy)
    .bezierCurveTo(
      -rx,
      cy + (bottom - cy) * 0.55,
      -rx * 0.5,
      bottom - (bottom - cy) * 0.12,
      0,
      bottom,
    )
    .closePath()
    .fill(lightFill)
    .stroke(ink);
  // A shine on its upper left, so it reads as round.
  g.moveTo(-rx * 0.62, cy - (cy - top) * 0.25)
    .quadraticCurveTo(-rx * 0.6, top + (cy - top) * 0.3, -rx * 0.25, top + (cy - top) * 0.18)
    .stroke(fineInk);
  // The knot.
  const knotHalf = Math.max(4, (knot - bottom) * 0.9);
  g.poly([0, bottom - 2, knotHalf, knot, -knotHalf, knot], true)
    .fill({ color: palette.ink })
    .stroke({ ...ink, width: 2 });
  // The arrow: it pulls the pan up.
  const headLength = arrow.head * 1.3;
  g.moveTo(0, arrow.tail)
    .lineTo(0, arrow.tip + headLength * 0.8)
    .stroke({ ...ink, width: 6 });
  g.poly(
    [-arrow.head, arrow.tip + headLength, arrow.head, arrow.tip + headLength, 0, arrow.tip],
    true,
  )
    .fill({ color: palette.ink })
    .stroke({ ...ink, width: 2 });
}

/**
 * The tag beside a slice: a paper tag with a punched hole at its left end, tied to the
 * solid part by a short string.
 */
function drawTag(g: Graphics, shape: PieceShape): void {
  const tag = sliceTag(shape);
  const left = tag.x - tag.width / 2;
  const hole = { x: left + tag.height * 0.24, y: tag.y };
  const knot = tagKnot(shape);
  g.moveTo(knot.x, knot.y)
    .quadraticCurveTo((knot.x + hole.x) / 2, Math.max(knot.y, hole.y) + 6, hole.x, hole.y)
    .stroke({ ...fineInk, alpha: 0.9 });
  g.circle(knot.x, knot.y, 3).fill({ color: palette.ink });
  g.roundRect(left, tag.y - tag.height / 2, tag.width, tag.height, tag.height * 0.25)
    .fill(lightFill)
    .stroke({ ...ink, width: 3 });
  g.circle(hole.x, hole.y, tag.height * 0.08).stroke(fineInk);
}

function drawGearSlice(g: Graphics, shape: PieceShape): void {
  const { centre, radius, slices, from, to } = gearSlice(shape);
  const teeth = shape.large ? 18 : 10;
  const { x: cx, y: cy } = centre;
  // The whole gear, faint, cut into n.
  g.poly(toothedRim(cx, cy, radius, teeth), true)
    .fill(ghostFill)
    .stroke(ghostInk);
  g.circle(cx, cy, radius * 0.62).stroke(ghostInk);
  for (let i = 0; i < slices; i += 1) {
    const angle = from + (i * Math.PI * 2) / slices;
    g.moveTo(cx, cy).lineTo(
      cx + radius * toothRoot * Math.cos(angle),
      cy + radius * toothRoot * Math.sin(angle),
    );
  }
  g.stroke(ghostInk);
  // The one slice on the pan, solid.
  const slice = [cx, cy, ...toothedRim(cx, cy, radius, teeth, from, to)];
  g.poly(slice, true).fill(lightFill);
  g.poly(slice, true).fill(sliceFill).stroke(ink);
  drawTag(g, shape);
}

function drawSpringSlice(g: Graphics, shape: PieceShape): void {
  const { left, width, centreX: cx } = slicedBody(shape);
  const { top, bottom, solidTop } = springLayers(shape);
  const slices = Math.min(Math.max(shape.slices, 1), maxDrawnSlices);
  const corner = Math.min(12, (bottom - solidTop) / 2);
  // The coil, under the solid layer.
  const turns = 5;
  g.moveTo(cx, 0);
  for (let i = 1; i <= turns * 2; i += 1) {
    const x = i === turns * 2 ? 0 : (i % 2 === 0 ? -1 : 1) * width * 0.3;
    g.lineTo(cx + x, (bottom * i) / (turns * 2));
  }
  g.stroke(ink);
  // The whole cap, faint, cut into n layers.
  g.roundRect(left, top, width, bottom - top, 12)
    .fill(ghostFill)
    .stroke(ghostInk);
  for (let i = 1; i < slices; i += 1) {
    const y = bottom - ((bottom - top) * i) / slices;
    g.moveTo(left + 4, y).lineTo(left + width - 4, y);
  }
  g.stroke(ghostInk);
  // The one layer on the coil, solid.
  g.roundRect(left, solidTop, width, bottom - solidTop, corner).fill(lightFill);
  g.roundRect(left, solidTop, width, bottom - solidTop, corner)
    .fill(sliceFill)
    .stroke(ink);
  drawTag(g, shape);
}

export const scaleSkin = {
  /** The fixed stand: foot, post and pivot, with tick marks every 5° above the pivot. */
  stand(g: Graphics, pivot: { x: number; y: number }, floorY: number): void {
    g.clear();
    g.rect(pivot.x - 160, floorY, 320, 26)
      .fill(heavyFill)
      .stroke(ink);
    g.poly([
      pivot.x - 22,
      floorY,
      pivot.x - 12,
      pivot.y,
      pivot.x + 12,
      pivot.y,
      pivot.x + 22,
      floorY,
    ])
      .fill(lightFill)
      .stroke(ink);
    for (let degrees = -15; degrees <= 15; degrees += 5) {
      const angle = ((degrees - 90) * Math.PI) / 180;
      const inner = degrees === 0 ? 92 : 100;
      g.moveTo(pivot.x + inner * Math.cos(angle), pivot.y + inner * Math.sin(angle)).lineTo(
        pivot.x + 116 * Math.cos(angle),
        pivot.y + 116 * Math.sin(angle),
      );
    }
    g.stroke(ink);
  },

  /** The beam, centred on the pivot, with a needle that points straight up when level. */
  beam(g: Graphics, halfLength: number): void {
    g.clear();
    g.moveTo(0, 0)
      .lineTo(0, -96)
      .stroke({ ...ink, width: 5 });
    g.roundRect(-halfLength, -10, halfLength * 2, 20, 10)
      .fill(lightFill)
      .stroke(ink);
    g.circle(0, 0, 16).fill(heavyFill).stroke(ink);
  },

  /** A pan: its surface at y = 0, on a post down to the beam's end. */
  pan(g: Graphics, width: number, postHeight: number): void {
    g.clear();
    g.rect(-6, 0, 12, postHeight).fill(lightFill).stroke(ink);
    g.poly([-width / 2, 0, width / 2, 0, width / 2 - 24, 18, -width / 2 + 24, 18])
      .fill(heavyFill)
      .stroke(ink);
  },

  /** Draws one piece; a divided gear or spring as one slice of n, with its tag. */
  piece(g: Graphics, shape: PieceShape): void {
    g.clear();
    const { kind, width, height } = shape;
    if (kind === 'weight') {
      const body = height * 0.8;
      g.circle(0, -body, height * 0.14).stroke({ ...ink, width: 6 });
      g.poly([-width / 2, 0, width / 2, 0, (width * 0.78) / 2, -body, (-width * 0.78) / 2, -body])
        .fill(heavyFill)
        .stroke(ink);
      return;
    }
    if (kind === 'float') {
      drawBalloon(g, width, height);
      return;
    }
    if (shape.slices > 0) {
      if (kind === 'gear') drawGearSlice(g, shape);
      else drawSpringSlice(g, shape);
      return;
    }
    if (kind === 'gear') {
      toothedWheel(g, 0, -width / 2, width / 2, shape.large ? 18 : 10);
      return;
    }
    const cap = height * springCap;
    const coil = height - cap;
    const turns = 5;
    g.moveTo(0, 0);
    for (let i = 1; i <= turns * 2; i += 1) {
      const x = i === turns * 2 ? 0 : (i % 2 === 0 ? -1 : 1) * width * 0.3;
      g.lineTo(x, -(coil * i) / (turns * 2));
    }
    g.stroke(ink);
    g.roundRect(-width / 2, -height, width, cap, cap / 2)
      .fill(lightFill)
      .stroke(ink);
    if (shape.large)
      g.roundRect(-width / 2 + 8, -height + 8, width - 16, cap - 16, cap / 2).stroke(fineInk);
  },

  /**
   * Where a piece's number is centred: a float's in its balloon; a divided gear's x in the
   * ghost gear above its slice, a divided spring's in the ghost layers above its solid one.
   */
  labelSpot(shape: PieceShape): LabelSpot {
    const { kind, width, height } = shape;
    if (kind === 'weight') return { x: 0, y: -(height * 0.8) / 2 };
    if (kind === 'float') return balloonParts(width, height).centre;
    if (shape.slices > 0) {
      if (kind === 'gear') {
        const { centre, radius } = gearSlice(shape);
        return { x: centre.x, y: centre.y - radius * sliceLabelLift };
      }
      // In the faint layers above the solid one.
      const { top, solidTop } = springLayers(shape);
      return { x: slicedBody(shape).centreX, y: (top + solidTop) / 2 };
    }
    if (kind === 'gear') return { x: 0, y: -width / 2 };
    return { x: 0, y: -height + (height * springCap) / 2 };
  },

  /** Where the text `: n` is centred on its tag (`sliceTag`), right of the tag's hole. */
  tagSpot(shape: PieceShape): LabelSpot {
    const tag = sliceTag(shape);
    return { x: tag.x + tag.height * 0.16, y: tag.y };
  },

  /** A readout's display window, centred on the side's value. */
  readout(g: Graphics, width: number, height: number): void {
    g.clear();
    g.roundRect(-width / 2, -height / 2, width, height, 8)
      .fill(lightFill)
      .stroke({ ...ink, width: 3 });
    g.roundRect(-width / 2 + 7, -height / 2 + 7, width - 14, height - 14, 4).stroke(fineInk);
  },
};
