// Where the tray sits in the 1600 × 1000 logical scene, how big its parts are, and where a
// carried piece lands (architecture Pattern 1, Balance moves; Consistency Rules: Gesture
// sizes; story 1.15). Presentation only: what the tray holds and what a drop does come from
// room/tray.ts.
//
// The tray is a shelf in the scene's top-right corner, right of the machine and above the
// right pan: its weight, then its float, each with a + directly above it and a − directly
// below its number. The weight's − hangs under the weight; the float's just under its
// balloon, over the string, so the shelf stays above the right pan's pieces. Its pieces are
// as big as the pans' pieces with a two-digit number, so the shelf doesn't change size as
// the numbers do. The buttons and the pieces' grab areas are at least 48 CSS px, so on a
// small screen they grow in scene units.
//
// Every Balance move acts on both sides at once (story 1.15): a piece carried from the tray
// lands when let go anywhere over the scale (either pan, the beam, the space between, above
// the stand's foot), and a piece carried off a pan comes off when let go anywhere off the
// scale, the shelf included. Anywhere else, it slides back.

import { scaleSkin } from '@/art/skins/scale';
import { trayPiece } from '@/room/tray';
import type { TrayKind } from '@/room/types';
import { type Box, minHitCssPx } from '@/ui/scene/scale/dial-layout';
import { pieceSize, scaleGeometry } from '@/ui/scene/scale/layout';

export const trayGeometry = {
  /** The shelf's right edge and top, in scene units. */
  right: 1580,
  top: 20,
  /** Inside the shelf's frame, and between a piece and its buttons. */
  padding: 16,
  gap: 12,
  /** Between the weight's column and the float's. */
  slotGap: 28,
  /** A button's size on a large screen; at least 48 CSS px on any screen. */
  buttonSize: 80,
  /** The shelf's frame line on a large screen. */
  lineWidth: 4,
  /** A piece let go this close to the shelf still lands in it. */
  dropMargin: 40,
} as const;

export type TrayGeometry = typeof trayGeometry;

export interface Point {
  x: number;
  y: number;
}

/** One of the tray's pieces with its stepper. */
export interface TraySlotLayout {
  kind: TrayKind;
  /** Where the piece stands: its bottom centre. */
  piece: Point;
  /** Where a drag of the piece can start: between its buttons, at least 48 CSS px each way. */
  grab: Box;
  /** The + button, directly above the piece, and the − button, directly below its number. */
  up: Box;
  down: Box;
}

export interface TrayLayout {
  unitsPerPx: number;
  /** The shelf. */
  box: Box;
  /** Where the divider between the weight's column and the float's stands. */
  dividerX: number;
  slots: TraySlotLayout[];
  lineWidth: number;
}

/** The order of the tray's pieces, left to right. */
export const trayKinds: readonly TrayKind[] = ['weight', 'float'];

/** A slot's column before it is placed: its size, and where its parts sit from its top. */
interface Column {
  width: number;
  height: number;
  /** The piece's bottom, and the − button's top. */
  pieceBottom: number;
  downTop: number;
}

/**
 * A slot's column: + directly above the piece's number, the piece, and − directly below
 * its number. A weight's number fills it, so its buttons sit above and below it; a float's
 * sits in its balloon, so its + covers the arrow above the balloon and its − the string
 * below, which keeps the shelf short. Between the buttons there is always room for a 48 CSS
 * px grab area.
 */
function column(
  kind: TrayKind,
  fontSize: number,
  button: number,
  hit: number,
  gap: number,
): Column {
  const size = pieceSize(trayPiece(kind, 99), fontSize);
  const width = Math.max(size.width + gap, button, hit);
  if (kind === 'weight') {
    const between = Math.max(size.height + 2 * gap, hit + gap);
    const pieceBottom = button + (between + size.height) / 2;
    return { width, height: 2 * button + between, pieceBottom, downTop: button + between };
  }
  const label = scaleSkin.labelSpot({
    kind,
    width: size.width,
    height: size.height,
    slices: 0,
    tagWidth: 0,
    tagHeight: 0,
    large: false,
  });
  // The number's centre from the piece's top; the band round it is two label sizes tall.
  const numberAt = size.height + label.y;
  const between = Math.max(2 * fontSize + 2 * gap, hit + gap);
  const numberY = button + between / 2;
  const pieceTop = Math.max(0, numberY - numberAt);
  return {
    width,
    height: 2 * button + between,
    pieceBottom: pieceTop + size.height,
    downTop: button + between,
  };
}

/** The tray's layout for the scene's scale (CSS px per scene unit), with labels at `fontSize`. */
export function trayLayout(
  sceneScale: number,
  fontSize: number,
  geometry: TrayGeometry = trayGeometry,
): TrayLayout {
  const unitsPerPx = sceneScale > 0 && Number.isFinite(sceneScale) ? 1 / sceneScale : 1;
  const hit = minHitCssPx * unitsPerPx;
  const button = Math.max(geometry.buttonSize, hit);
  const columns = trayKinds.map((kind) => column(kind, fontSize, button, hit, geometry.gap));
  const tallest = Math.max(...columns.map((each) => each.height));
  const width =
    2 * geometry.padding +
    columns.reduce((sum, each) => sum + each.width, 0) +
    geometry.slotGap * (columns.length - 1);
  const box: Box = {
    x: geometry.right - width,
    y: geometry.top,
    width,
    height: 2 * geometry.padding + tallest,
  };
  let left = box.x + geometry.padding;
  const slots = trayKinds.map((kind, i): TraySlotLayout => {
    const each = columns[i] as Column;
    const top = box.y + geometry.padding + (tallest - each.height) / 2;
    const centre = left + each.width / 2;
    left += each.width + geometry.slotGap;
    const buttonAt = (y: number): Box => ({
      x: centre - button / 2,
      y,
      width: button,
      height: button,
    });
    return {
      kind,
      piece: { x: centre, y: top + each.pieceBottom },
      // The band between the buttons, where the piece's number is.
      grab: {
        x: centre - each.width / 2,
        y: top + button + geometry.gap / 2,
        width: each.width,
        height: each.downTop - button - geometry.gap,
      },
      up: buttonAt(top),
      down: buttonAt(top + each.downTop),
    };
  });
  const first = columns[0] as Column;
  return {
    unitsPerPx,
    box,
    dividerX: box.x + geometry.padding + first.width + geometry.slotGap / 2,
    slots,
    lineWidth: Math.max(geometry.lineWidth, 1.5 * unitsPerPx),
  };
}

/**
 * Where a carried piece let go at a point lands: in the tray, over the scale, or nowhere.
 * There is no one-sided drop (story 1.15), so which pan it is over doesn't matter.
 */
export type DropTarget = 'tray' | 'scale' | null;

/**
 * Over the scale: either pan, the beam and the space between them, from under the wall's
 * top band down to just below the stand's foot. The tray, the splitter and the machine's
 * top sit above it, the dial below it.
 */
export const scaleZone: Box = {
  x: scaleGeometry.pivot.x - scaleGeometry.beamHalfLength - scaleGeometry.panWidth / 2 - 40,
  y: 200,
  width: 2 * (scaleGeometry.beamHalfLength + scaleGeometry.panWidth / 2 + 40),
  height: scaleGeometry.floorY + 20 - 200,
};

function inside(point: Point, box: Box, margin = 0): boolean {
  return (
    point.x >= box.x - margin &&
    point.x <= box.x + box.width + margin &&
    point.y >= box.y - margin &&
    point.y <= box.y + box.height + margin
  );
}

/** Whether a point (scene units) is over the scale, where a tray piece or the splitter lands. */
export function overScale(point: Point): boolean {
  return inside(point, scaleZone);
}

/** Where a piece let go at `point` (scene units) lands. The shelf comes first. */
export function dropTarget(
  point: Point,
  layout: TrayLayout,
  geometry: TrayGeometry = trayGeometry,
): DropTarget {
  if (inside(point, layout.box, geometry.dropMargin)) return 'tray';
  return overScale(point) ? 'scale' : null;
}

/** How long the tray wiggles when it is offered for the first time (hint level 1). */
export const trayWiggleMs = 700;
/** How long a piece let go where it lands takes to fade, and a refused one to slide back. */
export const landMs = 220;
export const returnMs = 260;
/** How long the copies of a dropped piece take to reach the two sides (story 1.15). */
export const copyMs = 360;
