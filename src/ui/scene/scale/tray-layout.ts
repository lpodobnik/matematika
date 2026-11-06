// Where the tray sits in the 1600 × 1000 logical scene, how big its parts are, and where a
// carried piece lands (architecture Pattern 1, Balance moves; Consistency Rules: Gesture
// sizes). Presentation only: what the tray holds and what a drop does come from
// room/tray.ts.
//
// The tray is a shelf in the scene's top-right corner, right of the machine and above the
// right pan: its weight, then its float, each with + above − beside it. Its pieces are as
// big as the pans' pieces with a two-digit number, so the shelf doesn't change size as the
// numbers do. The buttons and the pieces' grab areas are at least 48 CSS px, so on a small
// screen they grow in scene units.
//
// A piece carried from the tray lands on the pan whose half of the scene it is let go
// over, anywhere above the stand's foot; a piece carried off a pan lands in the tray when
// let go over the shelf. Let go anywhere else, it slides back.

import { trayPiece } from '@/room/tray';
import type { Side, TrayKind } from '@/room/types';
import { type Box, minHitCssPx } from '@/ui/scene/scale/dial-layout';
import { pieceSize, scaleGeometry } from '@/ui/scene/scale/layout';

export const trayGeometry = {
  /** The shelf's right edge and top, in scene units. */
  right: 1580,
  top: 20,
  /** Inside the shelf's frame, and between a piece and its buttons. */
  padding: 16,
  gap: 12,
  /** Between the weight's buttons and the float. */
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
  /** Where a drag of the piece can start: its cell, at least 48 CSS px each way. */
  grab: Box;
  /** The + button, above the − button. */
  up: Box;
  down: Box;
}

export interface TrayLayout {
  unitsPerPx: number;
  /** The shelf. */
  box: Box;
  /** Where the divider between the weight's slot and the float's stands. */
  dividerX: number;
  slots: TraySlotLayout[];
  lineWidth: number;
}

/** The order of the tray's pieces, left to right. */
export const trayKinds: readonly TrayKind[] = ['weight', 'float'];

function grown(box: Box, size: number): Box {
  const width = Math.max(box.width, size);
  const height = Math.max(box.height, size);
  return {
    x: box.x - (width - box.width) / 2,
    y: box.y - (height - box.height) / 2,
    width,
    height,
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
  const sizes = trayKinds.map((kind) => pieceSize(trayPiece(kind, 99), fontSize));
  const cellWidth = Math.max(...sizes.map((size) => size.width)) + geometry.gap;
  const cellHeight = Math.max(...sizes.map((size) => size.height), 2 * button + geometry.gap);
  const slotWidth = cellWidth + geometry.gap + button;
  const width = 2 * geometry.padding + trayKinds.length * slotWidth + geometry.slotGap;
  const height = 2 * geometry.padding + cellHeight;
  const box: Box = { x: geometry.right - width, y: geometry.top, width, height };
  const cellTop = box.y + geometry.padding;
  const slots = trayKinds.map((kind, i): TraySlotLayout => {
    const left = box.x + geometry.padding + i * (slotWidth + geometry.slotGap);
    const size = sizes[i] ?? { height: 0 };
    const buttonsX = left + cellWidth + geometry.gap;
    const buttonsTop = cellTop + (cellHeight - 2 * button - geometry.gap) / 2;
    return {
      kind,
      piece: { x: left + cellWidth / 2, y: cellTop + (cellHeight + size.height) / 2 },
      grab: grown({ x: left, y: cellTop, width: cellWidth, height: cellHeight }, hit),
      up: { x: buttonsX, y: buttonsTop, width: button, height: button },
      down: { x: buttonsX, y: buttonsTop + button + geometry.gap, width: button, height: button },
    };
  });
  return {
    unitsPerPx,
    box,
    dividerX: box.x + geometry.padding + slotWidth + geometry.slotGap / 2,
    slots,
    lineWidth: Math.max(geometry.lineWidth, 1.5 * unitsPerPx),
  };
}

/** Where a carried piece let go at a point lands: on a pan, in the tray, or nowhere. */
export type DropTarget = Side | 'tray' | null;

/** The pans' halves of the scene: either side of the machine and the stand, above the stand's foot. */
export const panZones = {
  leftEnd: scaleGeometry.pivot.x - 100,
  rightStart: scaleGeometry.pivot.x + 100,
  top: 60,
  bottom: scaleGeometry.floorY + 20,
} as const;

function inside(point: Point, box: Box, margin = 0): boolean {
  return (
    point.x >= box.x - margin &&
    point.x <= box.x + box.width + margin &&
    point.y >= box.y - margin &&
    point.y <= box.y + box.height + margin
  );
}

/** Where a piece let go at `point` (scene units) lands. The shelf comes first. */
export function dropTarget(
  point: Point,
  layout: TrayLayout,
  geometry: TrayGeometry = trayGeometry,
): DropTarget {
  if (inside(point, layout.box, geometry.dropMargin)) return 'tray';
  if (point.y < panZones.top || point.y > panZones.bottom) return null;
  if (point.x < panZones.leftEnd) return 'left';
  if (point.x > panZones.rightStart) return 'right';
  return null;
}

/** How long the tray wiggles when it is offered for the first time (hint level 1). */
export const trayWiggleMs = 700;
/** How long a piece let go where it lands takes to fade, and a refused one to slide back. */
export const landMs = 220;
export const returnMs = 260;
