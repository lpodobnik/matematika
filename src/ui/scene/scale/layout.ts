// Where the scale's parts sit in the 1600 × 1000 logical scene, and how big its pieces are.
// Presentation only: what is on the pans and how far they tip come from room/scale.ts.
//
// The pans ride on posts above the beam's ends and stay level, so the heavier pan is the
// lower one: which side is heavier shows by position, never by colour alone (NFR4).

import { balloonDome, balloonPieceHeight, isBalloon, tagOverlap } from '@/art/skins/scale';
import { isNumberPiece, minusLabel } from '@/room/pieces';
import type { PieceView } from '@/room/scale';
import type { Side } from '@/room/types';

export const scaleGeometry = {
  /** The beam turns about this point. */
  pivot: { x: 800, y: 600 },
  beamHalfLength: 500,
  /** From a beam end up to its pan's surface. */
  postHeight: 40,
  panWidth: 470,
  /** The stand's foot; the dial goes below it. */
  floorY: 820,
  /** Space between pieces, and between rows of pieces. */
  gap: 12,
  /** A readout hangs under the outer half of its pan, centred this far out from the post. */
  readoutOffset: 150,
  /** From the pan's surface down to the readout's top, clear of the dish. */
  readoutDrop: 30,
} as const;

export type ScaleGeometry = typeof scaleGeometry;

export interface Point {
  x: number;
  y: number;
}

export interface BeamPose {
  /** The beam's rotation in radians, clockwise on screen. */
  rotation: number;
  /** Where each pan's surface is centred. */
  left: Point;
  right: Point;
}

/** The beam and pans for a tilt in degrees (positive: the left side is heavier). */
export function beamPose(tilt: number, geometry: ScaleGeometry = scaleGeometry): BeamPose {
  // On screen, y points down, so a clockwise turn lowers the right end. The left side
  // being heavier turns the beam the other way.
  const rotation = (-tilt * Math.PI) / 180;
  const dx = geometry.beamHalfLength * Math.cos(rotation);
  const dy = geometry.beamHalfLength * Math.sin(rotation);
  const { x, y } = geometry.pivot;
  return {
    rotation,
    left: { x: x - dx, y: y - dy - geometry.postHeight },
    right: { x: x + dx, y: y + dy - geometry.postHeight },
  };
}

/** GDD and NFR4: numbers on weights are at least 20 px on the tablet. */
export const minNumberCssPx = 20;
/** Label size in scene units when the scene is large enough: 24 CSS px at the tablet's ~0.54. */
export const baseLabelSize = 44;

/**
 * The label size, in scene units, for the scene's current scale (CSS px per scene unit).
 * On a small viewport the labels grow so they never show below 20 CSS px.
 */
export function labelFontSize(sceneScale: number): number {
  if (!(sceneScale > 0) || !Number.isFinite(sceneScale)) return baseLabelSize;
  return Math.max(baseLabelSize, Math.ceil(minNumberCssPx / sceneScale));
}

/** A generous width for a label of digits (and `x`, `:`), as a share of the font size. */
const charWidth = 0.62;

export function labelWidth(label: string, fontSize: number): number {
  return [...label].length * charWidth * fontSize;
}

/**
 * Widths of the characters in a slice's tag, `: 3`, as shares of the font size: a little
 * over what the scene's bold sans draws, so the tag stays small but its text never spills.
 */
const tagCharWidths: Readonly<Record<string, number>> = { ':': 0.32, ' ': 0.3, ' ': 0.2 };

/** The width of a slice's tag text (`: 3`), tighter than `labelWidth`, so the tag stays small. */
export function tagTextWidth(label: string, fontSize: number): number {
  return [...label].reduce((sum, char) => sum + (tagCharWidths[char] ?? 0.6), 0) * fontSize;
}

export interface PieceSize {
  width: number;
  height: number;
  /** A gear or spring divided by n is drawn as one slice of n (story 1.14); 0 for none. */
  slices: number;
  /** The tag showing `: n` beside the slice, 0 by 0 for none; it is part of `width`. */
  tagWidth: number;
  tagHeight: number;
  /** A balloon's string, from its knot down to the bottom of its box; 0 for other pieces. */
  string: number;
}

/**
 * What a piece shows on it: its label, except that a spring is a balloon taking x off its
 * pan (story 1.15), so its x carries the school minus, `−x` or `−27x`.
 */
export function pieceText(piece: Pick<PieceView, 'kind' | 'label'>): string {
  return piece.kind === 'spring' ? minusLabel(piece.label) : piece.label;
}

/**
 * A balloon's width at the least, as a multiple of the label size: bigger than 1.14's 1.8
 * (story 1.15), and larger still for a large one standing for more than 12 x…
 */
export const balloonWidth = 2.2;
export const largeBalloonWidth = 2.7;
/** …its body's height at the least, a little more than its width, so it reads round… */
export const balloonBodyHeight = 2.5;
/** …and its string, which holds it off the pan, as multiples of the label size. */
export const balloonString = 0.5;
/** A divided gear's diameter, at the least, as a multiple of the label size… */
export const slicedGearSize = 2.8;
/** …and a divided balloon's width, which fits its x in the ghost above its solid slice. */
export const slicedBalloonWidth = 2.6;
/** A slice's tag: its height as a multiple of the label size. */
export const tagHeightShare = 1.15;

/** A balloon's body height for its width: a little taller than wide (a large one, rounder). */
function balloonBody(width: number, fontSize: number, large: boolean): number {
  return Math.max(fontSize * balloonBodyHeight, width * (large ? 1.05 : 1.12));
}

/** A piece's size in scene units, large enough for its label with room to spare. */
export function pieceSize(piece: PieceView, fontSize: number): PieceSize {
  const text = labelWidth(pieceText(piece), fontSize);
  const fit = text + fontSize;
  const none = { slices: 0, tagWidth: 0, tagHeight: 0, string: 0 };
  if (piece.kind === 'weight') {
    return { width: Math.max(fontSize * 2, fit), height: fontSize * 2, ...none };
  }
  const large = !isNumberPiece(piece) && piece.count > 1n;
  const divided = !isNumberPiece(piece) && piece.divisor !== null && piece.divisorLabel !== null;
  const string = fontSize * balloonString;
  if (!divided) {
    if (piece.kind === 'gear') {
      const diameter = Math.max(fontSize * (large ? 2.8 : 2), fit);
      return { width: diameter, height: diameter, ...none };
    }
    // A float or a spring: a balloon round its label (story 1.15).
    const width = large
      ? Math.max(fontSize * largeBalloonWidth, fit - fontSize * 0.3)
      : Math.max(fontSize * balloonWidth, fit - fontSize * 0.2);
    const height = balloonPieceHeight(balloonBody(width, fontSize, large), string);
    return { width, height, ...none, string };
  }
  // One slice of n: the whole gear (or balloon) is drawn faint around it, with x above the
  // slice, so it is larger than a small one. The tag hangs beside it, a quarter over its
  // faint edge (tagOverlap), leaving the slice in view. The tag's text sits right of its
  // punched hole: 0.24 of its height clear on each side of the text.
  const divisorText = piece.divisorLabel ?? '';
  const tagHeight = fontSize * tagHeightShare;
  const tagWidth = tagTextWidth(divisorText, fontSize) + tagHeight * 0.48;
  const beside = tagWidth * (1 - tagOverlap);
  const slices = Number(piece.divisor);
  if (piece.kind === 'gear') {
    const diameter = Math.max(fontSize * slicedGearSize, fit + fontSize * 0.6);
    return { width: diameter + beside, height: diameter, slices, tagWidth, tagHeight, string: 0 };
  }
  const body = Math.max(fontSize * slicedBalloonWidth, fit + fontSize * 0.4);
  return {
    width: body + beside,
    height: balloonPieceHeight(balloonBody(body, fontSize, large), string),
    slices,
    tagWidth,
    tagHeight,
    string,
  };
}

/**
 * Where a piece can be grabbed, from its bottom centre: its own box, grown to at least
 * `minSize` each way (48 CSS px, architecture Gesture sizes).
 */
export function grabArea(
  width: number,
  height: number,
  minSize: number,
): { x: number; y: number; width: number; height: number } {
  const w = Math.max(width, minSize);
  const h = Math.max(height, minSize);
  return { x: -w / 2, y: -height - (h - height) / 2, width: w, height: h };
}

export interface PieceBox extends PieceSize {
  key: string;
  /** Centre, from the pan's centre. */
  x: number;
  /** Bottom, from the pan's surface; negative is up. */
  y: number;
}

type Sized = Omit<PieceBox, 'x' | 'y'> & { balloon: boolean };

/** Something laid out in a row: one piece, or a bunch of balloons; x from its left edge. */
interface RowItem {
  members: { piece: Sized; x: number }[];
  width: number;
  height: number;
}

function single(piece: Sized): RowItem {
  return { members: [{ piece, x: piece.width / 2 }], width: piece.width, height: piece.height };
}

/** How far each tier of a bunch rises above the one below: a balloon's dome, centre to top. */
function tierRise(piece: Sized): number {
  return balloonDome(piece.height, piece.string);
}

/**
 * A bunch of balloons (story 1.15), from the front of a run of them, in `room` across: as
 * many side by side as fit (at least one), then the rest in tiers above, each nestled in
 * the gaps of the tier below, as balloons tied together float. Every balloon's box still
 * stands on the row, its string longer the higher it floats. A bunch never stacks one
 * balloon right above another: with room for only one, it is just that one. Null when not
 * even one fits.
 */
function bunch(
  run: readonly Sized[],
  room: number,
  gap: number,
  rowEmpty: boolean,
): RowItem | null {
  let count = 0;
  let width = 0;
  for (const piece of run) {
    const next = count === 0 ? piece.width : width + gap + piece.width;
    if (next > room) break;
    count += 1;
    width = next;
  }
  if (count === 0) {
    if (!rowEmpty) return null;
    return single(run[0] as Sized);
  }
  if (count === 1) return single(run[0] as Sized);
  const ground = run.slice(0, count);
  const centres: number[] = [];
  let left = 0;
  for (const piece of ground) {
    centres.push(left + piece.width / 2);
    left += piece.width + gap;
  }
  const gaps = centres.slice(1).map((x, i) => (x + (centres[i] ?? 0)) / 2);
  const rise = Math.max(...run.map(tierRise));
  const members: RowItem['members'] = [];
  let tier = 0;
  let placed = 0;
  while (placed < run.length) {
    const spots = tier % 2 === 0 ? centres : gaps;
    for (const x of spots) {
      const piece = run[placed];
      if (!piece) break;
      const lift = tier * rise;
      members.push({
        piece: { ...piece, height: piece.height + lift, string: piece.string + lift },
        x,
      });
      placed += 1;
    }
    tier += 1;
  }
  const lefts = members.map((m) => m.x - m.piece.width / 2);
  const shift = Math.min(0, ...lefts);
  const right = Math.max(...members.map((m) => m.x + m.piece.width / 2));
  return {
    members: members.map((m) => ({ ...m, x: m.x - shift })),
    width: right - shift,
    height: Math.max(...members.map((m) => m.piece.height)),
  };
}

/**
 * Lays pieces out on a pan in the order given: left to right in rows no wider than the
 * pan, each row centred, rows stacked upward. A piece wider than the pan gets a row of
 * its own. Balloons next to each other are tied in a bunch (story 1.15): side by side
 * while they fit beside what is already in the row, the rest floating above, nestled
 * between them, so a pan of balloons stays low.
 */
export function layoutPan(
  pieces: readonly PieceView[],
  fontSize: number,
  geometry: ScaleGeometry = scaleGeometry,
): PieceBox[] {
  const { panWidth, gap } = geometry;
  const sized: Sized[] = pieces.map((piece) => ({
    key: piece.key,
    balloon: isBalloon(piece.kind),
    ...pieceSize(piece, fontSize),
  }));
  const rows: RowItem[][] = [];
  let row: RowItem[] = [];
  let rowWidth = 0;
  const place = (item: RowItem) => {
    rowWidth = row.length === 0 ? item.width : rowWidth + gap + item.width;
    row.push(item);
  };
  const breakRow = () => {
    rows.push(row);
    row = [];
    rowWidth = 0;
  };
  let i = 0;
  while (i < sized.length) {
    const piece = sized[i] as Sized;
    const room = row.length === 0 ? panWidth : panWidth - rowWidth - gap;
    if (!piece.balloon) {
      if (row.length > 0 && piece.width > room) breakRow();
      place(single(piece));
      i += 1;
      continue;
    }
    let end = i;
    while (sized[end]?.balloon) end += 1;
    const item = bunch(sized.slice(i, end), room, gap, row.length === 0);
    if (!item) {
      breakRow();
      continue;
    }
    place(item);
    i += item.members.length;
  }
  if (row.length > 0) rows.push(row);

  const boxes: PieceBox[] = [];
  let bottom = 0;
  for (const itemRow of rows) {
    const width = itemRow.reduce((sum, item) => sum + item.width, 0) + gap * (itemRow.length - 1);
    let left = -width / 2;
    for (const item of itemRow) {
      for (const { piece, x } of item.members) {
        const { key, width: w, height, slices, tagWidth, tagHeight, string } = piece;
        boxes.push({
          key,
          width: w,
          height,
          slices,
          tagWidth,
          tagHeight,
          string,
          x: left + x,
          y: bottom,
        });
      }
      left += item.width + gap;
    }
    bottom -= Math.max(...itemRow.map((item) => item.height)) + gap;
  }
  return boxes;
}

export interface ReadoutBox {
  /** Centre, from the pan's centre; positive y is down, under the pan. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where a side's readout sits on its pan: under the dish, on the outer half, away from the
 * post and the beam, so it moves with its pan and can't be mistaken for the other side's.
 * Its number is drawn at the same size as the pieces' numbers.
 */
export function readoutBox(
  side: Side,
  label: string,
  fontSize: number,
  geometry: ScaleGeometry = scaleGeometry,
): ReadoutBox {
  const width = Math.max(fontSize * 2.2, labelWidth(label, fontSize) + fontSize);
  const height = fontSize * 1.4;
  const outward = side === 'left' ? -1 : 1;
  return {
    x: outward * geometry.readoutOffset,
    y: geometry.readoutDrop + height / 2,
    width,
    height,
  };
}
