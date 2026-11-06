// Where the scale's parts sit in the 1600 × 1000 logical scene, and how big its pieces are.
// Presentation only: what is on the pans and how far they tip come from room/scale.ts.
//
// The pans ride on posts above the beam's ends and stay level, so the heavier pan is the
// lower one: which side is heavier shows by position, never by colour alone (NFR4).

import { tagOverlap } from '@/art/skins/scale';
import { isNumberPiece } from '@/room/pieces';
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
}

/**
 * A float's height, as a multiple of the label size: the arrow, the balloon round its number,
 * and the string that holds it well above the pan (story 1.14).
 */
export const floatHeight = 4;
/** A divided gear's diameter, at the least, as a multiple of the label size… */
export const slicedGearSize = 2.8;
/** …and a divided spring's cap width and height, which fit its x above its solid layer. */
export const slicedSpringWidth = 2.4;
export const slicedSpringHeight = 3.5;
/** A slice's tag: its height as a multiple of the label size. */
export const tagHeightShare = 1.15;

/** A piece's size in scene units, large enough for its label with room to spare. */
export function pieceSize(piece: PieceView, fontSize: number): PieceSize {
  const text = labelWidth(piece.label, fontSize);
  const fit = text + fontSize;
  const none = { slices: 0, tagWidth: 0, tagHeight: 0 };
  if (isNumberPiece(piece)) {
    if (piece.kind === 'weight') {
      return { width: Math.max(fontSize * 2, fit), height: fontSize * 2, ...none };
    }
    // The balloon is a little narrower than a weight, so it reads round, not squat.
    const width = Math.max(fontSize * 1.8, text + fontSize * 0.6);
    return { width, height: fontSize * floatHeight, ...none };
  }
  const large = piece.count > 1n;
  if (piece.divisor === null || piece.divisorLabel === null) {
    const diameter = Math.max(fontSize * (large ? 2.8 : 2), fit);
    return { width: diameter, height: diameter, ...none };
  }
  // One slice of n: the whole gear (or cap) is drawn faint around it, with x above the
  // slice, so it is larger than a small gear. The tag hangs beside it, a quarter over its
  // faint edge (tagOverlap), leaving the slice in view. The tag's text sits right of its
  // punched hole: 0.24 of its height clear on each side of the text.
  const tagHeight = fontSize * tagHeightShare;
  const tagWidth = tagTextWidth(piece.divisorLabel, fontSize) + tagHeight * 0.48;
  const beside = tagWidth * (1 - tagOverlap);
  const slices = Number(piece.divisor);
  if (piece.kind === 'gear') {
    const diameter = Math.max(fontSize * slicedGearSize, fit + fontSize * 0.6);
    return { width: diameter + beside, height: diameter, slices, tagWidth, tagHeight };
  }
  const cap = Math.max(fontSize * slicedSpringWidth, fit + fontSize * 0.3);
  return {
    width: cap + beside,
    height: fontSize * slicedSpringHeight,
    slices,
    tagWidth,
    tagHeight,
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

/**
 * Lays pieces out on a pan in the order given: left to right in rows no wider than the
 * pan, each row centred, rows stacked upward. A piece wider than the pan gets a row of
 * its own.
 */
export function layoutPan(
  pieces: readonly PieceView[],
  fontSize: number,
  geometry: ScaleGeometry = scaleGeometry,
): PieceBox[] {
  const { panWidth, gap } = geometry;
  const sized = pieces.map((piece) => ({ key: piece.key, ...pieceSize(piece, fontSize) }));
  const rows: (typeof sized)[] = [];
  let row: typeof sized = [];
  let rowWidth = 0;
  for (const piece of sized) {
    const width = row.length === 0 ? piece.width : rowWidth + gap + piece.width;
    if (row.length > 0 && width > panWidth) {
      rows.push(row);
      row = [piece];
      rowWidth = piece.width;
    } else {
      row.push(piece);
      rowWidth = width;
    }
  }
  if (row.length > 0) rows.push(row);

  const boxes: PieceBox[] = [];
  let bottom = 0;
  for (const pieceRow of rows) {
    const width = pieceRow.reduce((sum, p) => sum + p.width, 0) + gap * (pieceRow.length - 1);
    let left = -width / 2;
    for (const piece of pieceRow) {
      boxes.push({ ...piece, x: left + piece.width / 2, y: bottom });
      left += piece.width + gap;
    }
    bottom -= Math.max(...pieceRow.map((p) => p.height)) + gap;
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
