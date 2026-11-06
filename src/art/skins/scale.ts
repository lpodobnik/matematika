// Placeholder skin for the scale and its pieces: grey ink on paper, drawn in code
// (architecture, Asset Management). Epic 6 replaces it. Every piece kind has its own shape,
// so none is told apart by colour alone (NFR4):
//
//   weight   a trapezoid block with a handle
//   float    a balloon (story 1.15: bigger than 1.14's, with a shine, a knot and a string
//            down to the pan): it lifts its pan. Its string is drawn on its own
//            (`balloonString`), so the scene can bob the balloon and stretch the string
//   gear     a toothed wheel (more teeth when large)
//   spring   every minus is a balloon (story 1.15): the same balloon as a float, carrying a
//            small x-gear emblem under its label (with more teeth when large). The data kind
//            stays `spring`; no coil is drawn anywhere
//   x : n    one slice of n (story 1.14): a gear divided by n is a faint ghost gear cut
//            into n, carrying x, with one n-th sector drawn solid, standing on the pan; a
//            balloon divided by n is drawn the same way (story 1.15): a faint ghost balloon
//            cut into n from its centre, its bottom sector, on the string, solid and carrying
//            the emblem. A tag `: n` is tied to the solid part and hangs beside it, so it
//            never hides it
//   readout  a display window with a double frame under a pan, unlike any piece
//
// Pieces are drawn with their origin at the bottom centre, rising into negative y. A divided
// piece's body (gear or balloon) is the left part of its box, and its tag the right.

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';
import type { PieceKind } from '@/room/pieces';

const ink = { width: 4, color: palette.ink };
const fineInk = { width: 2, color: palette.ink, alpha: 0.6 };
const heavyFill = { color: palette.ink, alpha: 0.16 };
const lightFill = { color: palette.paper };
/** The whole of a divided gear or balloon: there, but not on the pan. */
const ghostInk = { width: 2, color: palette.ink, alpha: 0.35 };
const ghostFill = { color: palette.paper, alpha: 0.35 };
/** The one slice that is on the pan: shaded, so it reads solid against its faint whole. */
const sliceFill = { color: palette.ink, alpha: 0.2 };
/** A balloon's skin: a light shade over paper, so its paper shine shows (story 1.15). */
const balloonFill = { color: palette.ink, alpha: 0.1 };

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
  /**
   * A balloon's string, from its knot down to the bottom of its box (story 1.15): longer for
   * a balloon higher in a bunch, so it still reaches the pan. 0 for other pieces.
   */
  string: number;
}

/** How far above a ghost gear's or balloon's centre its x sits, as a share of its radius. */
const sliceLabelLift = 0.45;
/** The most parts a piece is drawn cut into, so a huge divisor still shows a 10° sliver. */
const maxDrawnSlices = 36;
/** Where a toothed wheel's teeth start, as a share of its radius. */
const toothRoot = 0.84;

/** A float or spring: drawn as a balloon (story 1.15). */
export function isBalloon(kind: PieceKind): boolean {
  return kind === 'float' || kind === 'spring';
}

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

/**
 * A divided gear's or balloon's body: the gear or balloon, at the left of its box, beside its
 * tag; a piece not divided is all body.
 */
export function slicedBody(shape: PieceShape): { left: number; width: number; centreX: number } {
  const width = shape.width - shape.tagWidth * (1 - tagOverlap);
  const left = -shape.width / 2;
  return { left, width, centreX: left + width / 2 };
}

/** A balloon's parts, from its piece's bottom centre (story 1.15). */
export interface BalloonParts {
  /** The balloon's widest point: a float's number sits here, and a divided one is cut from it. */
  centre: LabelSpot;
  /** Its half width, its top, and its bottom where the knot is tied. */
  halfWidth: number;
  top: number;
  bottom: number;
  /** The knot hangs from the balloon's bottom down to here, where the string starts. */
  knot: number;
}

/**
 * The knot's share of a balloon and its knot, above the string. 1.14's arrow above the
 * balloon is gone (story 1.15): the balloon itself, bobbing on its string, shows that it
 * pulls up.
 */
const knotShare = 0.06;
/** The balloon is widest this far down from its top, as a share of its height. */
export const balloonWidest = 0.42;
/** How many points each of a balloon's four curves is drawn with. */
const outlineSteps = 16;

/** A balloon piece's height: its balloon `body` tall, its knot, and its string. */
export function balloonPieceHeight(body: number, string: number): number {
  return body / (1 - knotShare) + string;
}

/** How far a balloon piece of `height`, with its string, rises from its widest point to its top. */
export function balloonDome(height: number, string: number): number {
  return (height - string) * (1 - knotShare) * balloonWidest;
}

/**
 * Where a balloon's body, knot and string are. The balloon floats on its string above the
 * pan; a divided one is the left part of its box (`slicedBody`).
 */
export function balloonParts(shape: PieceShape): BalloonParts {
  const body = slicedBody(shape);
  const top = -shape.height;
  const knot = -shape.string;
  const bottom = knot - (knot - top) * knotShare;
  return {
    centre: { x: body.centreX, y: top + (bottom - top) * balloonWidest },
    halfWidth: body.width / 2,
    top,
    bottom,
    knot,
  };
}

/** A point on a cubic Bézier curve at t. */
function bezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/**
 * The balloon's outline as a polygon, clockwise from its bottom: round on top, narrowing to
 * its knot. Drawn as points, so a divided balloon's slice can be cut from it.
 */
export function balloonOutline(parts: BalloonParts): number[] {
  const { centre, halfWidth: rx, top, bottom } = parts;
  const { x: cx, y: cy } = centre;
  const k = 0.5523;
  const low = (bottom - cy) * 0.55;
  const tip = (bottom - cy) * 0.12;
  const rise = cy - top;
  // Four curves, each [start, control, control, end] as x, y pairs.
  const curves: [number, number][][] = [
    [
      [cx, bottom],
      [cx + rx * 0.5, bottom - tip],
      [cx + rx, cy + low],
      [cx + rx, cy],
    ],
    [
      [cx + rx, cy],
      [cx + rx, cy - rise * k],
      [cx + rx * k, top],
      [cx, top],
    ],
    [
      [cx, top],
      [cx - rx * k, top],
      [cx - rx, cy - rise * k],
      [cx - rx, cy],
    ],
    [
      [cx - rx, cy],
      [cx - rx, cy + low],
      [cx - rx * 0.5, bottom - tip],
      [cx, bottom],
    ],
  ];
  const points: number[] = [];
  for (const curve of curves) {
    const [a, b, c, d] = curve as [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ];
    for (let i = 0; i < outlineSteps; i += 1) {
      const t = i / outlineSteps;
      points.push(bezier(a[0], b[0], c[0], d[0], t), bezier(a[1], b[1], c[1], d[1], t));
    }
  }
  return points;
}

/** Where a ray from (cx, cy) at `angle` leaves a closed polygon, nearest first. */
function rayExit(points: readonly number[], cx: number, cy: number, angle: number): LabelSpot {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = Number.POSITIVE_INFINITY;
  const count = points.length / 2;
  for (let i = 0; i < count; i += 1) {
    const ax = points[i * 2] ?? 0;
    const ay = points[i * 2 + 1] ?? 0;
    const bx = points[((i + 1) % count) * 2] ?? 0;
    const by = points[((i + 1) % count) * 2 + 1] ?? 0;
    const ex = bx - ax;
    const ey = by - ay;
    const denominator = dx * ey - dy * ex;
    if (Math.abs(denominator) < 1e-12) continue;
    const t = ((ax - cx) * ey - (ay - cy) * ex) / denominator;
    const u = ((ax - cx) * dy - (ay - cy) * dx) / denominator;
    if (t > 1e-9 && u >= -1e-9 && u <= 1 + 1e-9 && t < best) best = t;
  }
  return { x: cx + dx * best, y: cy + dy * best };
}

/** One slice of a divided balloon (story 1.15): its sector, pointing down to the knot. */
export interface BalloonSlice {
  parts: BalloonParts;
  /** How many slices it is cut into, as drawn. */
  slices: number;
  /** The solid sector: from `from` to `to` (radians, clockwise on screen), around the centre. */
  from: number;
  to: number;
  /** The solid sector as a polygon: the centre, then along the outline. */
  polygon: number[];
}

/** The bottom slice of a balloon cut into n from its centre, on the string. */
export function balloonSlice(shape: PieceShape): BalloonSlice {
  const parts = balloonParts(shape);
  const slices = Math.min(Math.max(shape.slices, 1), maxDrawnSlices);
  const half = Math.PI / slices;
  const from = Math.PI / 2 - half;
  const to = Math.PI / 2 + half;
  const outline = balloonOutline(parts);
  const { x: cx, y: cy } = parts.centre;
  const polygon = [cx, cy];
  const steps = 24;
  for (let i = 0; i <= steps; i += 1) {
    const exit = rayExit(outline, cx, cy, from + ((to - from) * i) / steps);
    polygon.push(exit.x, exit.y);
  }
  return { parts, slices, from, to, polygon };
}

/** The x-gear emblem a spring's balloon carries: its centre and radius (story 1.15). */
export function balloonEmblem(shape: PieceShape): { centre: LabelSpot; radius: number } {
  const parts = balloonParts(shape);
  const { centre, halfWidth, bottom } = parts;
  if (shape.slices > 0) {
    // In the solid slice, halfway down it, as large as the slice's width there allows.
    const slices = Math.min(Math.max(shape.slices, 1), maxDrawnSlices);
    const down = (bottom - centre.y) * 0.5;
    const fit = slices > 2 ? down * Math.tan(Math.PI / slices) * 0.7 : halfWidth;
    return {
      centre: { x: centre.x, y: centre.y + down },
      radius: Math.min(halfWidth * 0.26, fit),
    };
  }
  // Under the label, in the balloon's lower half.
  return {
    centre: { x: centre.x, y: centre.y + (bottom - centre.y) * 0.56 },
    radius: halfWidth * 0.3,
  };
}

/**
 * How much of a divided piece's tag overlaps its body (story 1.14): the tag hangs beside the
 * gear or balloon, a quarter of it over the body's faint edge, so the solid slice stays in view.
 */
export const tagOverlap = 0.25;

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

/** A tag's box: its centre, and its size. */
export interface TagBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The tag showing `: n`: beside the body on its right, at the height of the solid part (a
 * slice runs down from its gear's or balloon's centre), never below the pan or above the piece.
 */
export function sliceTag(shape: PieceShape): TagBox {
  const { tagWidth: width, tagHeight: height } = shape;
  const body = slicedBody(shape);
  const x = body.left + body.width - width * tagOverlap + width / 2;
  let wanted: number;
  if (shape.kind === 'gear') {
    wanted = -shape.height / 2 + shape.height * 0.14;
  } else {
    const { centre, bottom } = balloonParts(shape);
    wanted = centre.y + (bottom - centre.y) * 0.4;
  }
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
  const { parts, from } = balloonSlice(shape);
  const { x: cx, y: cy } = parts.centre;
  const edge = rayExit(balloonOutline(parts), cx, cy, from);
  return { x: cx + (edge.x - cx) * 0.6, y: cy + (edge.y - cy) * 0.6 };
}

/** The balloon's paper shine, on its upper left: a crescent, so it reads round and glossy. */
function drawShine(g: Graphics, parts: BalloonParts): void {
  const { centre, halfWidth: rx, top } = parts;
  const rise = centre.y - top;
  const x0 = centre.x - rx * 0.66;
  const y0 = centre.y - rise * 0.12;
  const x1 = centre.x - rx * 0.2;
  const y1 = top + rise * 0.16;
  g.moveTo(x0, y0)
    .quadraticCurveTo(centre.x - rx * 0.74, top + rise * 0.2, x1, y1)
    .quadraticCurveTo(centre.x - rx * 0.4, top + rise * 0.5, x0, y0)
    .closePath()
    .fill(lightFill);
}

/** The knot under the balloon: a small tied triangle. */
function drawKnot(g: Graphics, parts: BalloonParts): void {
  const { centre, bottom, knot } = parts;
  const half = Math.max(5, (knot - bottom) * 0.8);
  g.poly([centre.x, bottom - 2, centre.x + half, knot, centre.x - half, knot], true)
    .fill({ color: palette.ink })
    .stroke({ ...ink, width: 2 });
}

/** A spring's x-gear emblem on its balloon. */
function drawEmblem(g: Graphics, shape: PieceShape): void {
  const { centre, radius } = balloonEmblem(shape);
  if (!(radius > 0)) return;
  const teeth = shape.large ? 18 : 10;
  g.poly(toothedRim(centre.x, centre.y, radius, teeth), true)
    .fill(lightFill)
    .stroke({ ...ink, width: 2.5 });
  g.circle(centre.x, centre.y, radius * 0.35).stroke({ ...fineInk, alpha: 0.9 });
}

/** A whole balloon: skin, shine, knot, and a spring's emblem; its string is drawn apart. */
function drawBalloon(g: Graphics, shape: PieceShape): void {
  const parts = balloonParts(shape);
  const outline = balloonOutline(parts);
  g.poly(outline, true).fill(lightFill);
  g.poly(outline, true)
    .fill(balloonFill)
    .stroke({ ...ink, width: shape.large ? 5 : 4 });
  drawShine(g, parts);
  drawKnot(g, parts);
  if (shape.kind === 'spring') drawEmblem(g, shape);
}

/**
 * A balloon divided by n (story 1.15, like the gear's slice): the whole balloon faint, cut
 * into n from its centre, with its bottom sector, on the string, solid; the emblem in it,
 * and the tag beside it.
 */
function drawBalloonSlice(g: Graphics, shape: PieceShape): void {
  const { parts, slices, from, polygon } = balloonSlice(shape);
  const outline = balloonOutline(parts);
  const { x: cx, y: cy } = parts.centre;
  g.poly(outline, true).fill(ghostFill).stroke(ghostInk);
  for (let i = 0; i < slices; i += 1) {
    const edge = rayExit(outline, cx, cy, from + (i * Math.PI * 2) / slices);
    g.moveTo(cx, cy).lineTo(edge.x, edge.y);
  }
  g.stroke(ghostInk);
  g.poly(polygon, true).fill(lightFill);
  g.poly(polygon, true).fill(sliceFill).stroke(ink);
  drawKnot(g, parts);
  if (shape.kind === 'spring') drawEmblem(g, shape);
  drawTag(g, shape);
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

  /**
   * Draws one piece; a divided gear or balloon as one slice of n, with its tag. A balloon's
   * string is not drawn here (`balloonString`), so the scene can bob the balloon over it.
   */
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
    if (isBalloon(kind)) {
      if (shape.slices > 0) drawBalloonSlice(g, shape);
      else drawBalloon(g, shape);
      return;
    }
    if (shape.slices > 0) {
      drawGearSlice(g, shape);
      return;
    }
    toothedWheel(g, 0, -width / 2, width / 2, shape.large ? 18 : 10);
  },

  /**
   * A balloon's string, from its knot down to the pan with a slight curve; nothing for other
   * pieces. The scene stretches it as the balloon bobs, so it stays tied to both.
   */
  balloonString(g: Graphics, shape: PieceShape): void {
    g.clear();
    if (!isBalloon(shape.kind)) return;
    const { centre, halfWidth: rx, knot } = balloonParts(shape);
    const x = centre.x;
    // A gentle S: a short string sways less, so it never looks like a zigzag.
    const sway = Math.min(rx * 0.3, -knot * 0.25);
    g.moveTo(x, knot)
      .bezierCurveTo(x + sway, knot * 0.66, x - sway, knot * 0.33, x + sway * 0.3, 0)
      .stroke({ ...fineInk, width: 2.5, alpha: 0.85 });
  },

  /**
   * Where a piece's number is centred: a float's at its balloon's widest point; a spring's
   * balloon's a little higher, over its emblem; a divided gear's or balloon's x in the ghost
   * above its slice.
   */
  labelSpot(shape: PieceShape): LabelSpot {
    const { kind, width, height } = shape;
    if (kind === 'weight') return { x: 0, y: -(height * 0.8) / 2 };
    if (isBalloon(kind)) {
      const { centre, top } = balloonParts(shape);
      if (shape.slices > 0) return { x: centre.x, y: centre.y - (centre.y - top) * sliceLabelLift };
      if (kind === 'float') return centre;
      return { x: centre.x, y: centre.y - (centre.y - top) * 0.12 };
    }
    if (shape.slices > 0) {
      const { centre, radius } = gearSlice(shape);
      return { x: centre.x, y: centre.y - radius * sliceLabelLift };
    }
    return { x: 0, y: -width / 2 };
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
