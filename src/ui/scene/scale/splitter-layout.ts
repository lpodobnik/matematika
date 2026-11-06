// Where the splitter sits in the 1600 × 1000 logical scene, how big its parts are, and how a
// drag of it across both pans, or off them, is read (architecture Pattern 1, Balance moves;
// Pattern 2, Jams; Consistency Rules: Gesture sizes). Presentation only: what a split does
// comes from room/splitter.ts.
//
// The splitter waits in a holder in the scene's top-left corner, left of the machine and
// above the left pan, mirroring the tray: its blade, then + above − beside it. After a
// split that jams, it lies across both pans, from one pan's centre to the other's, just
// under the machine, until he drags it off. The buttons and grab areas are at least 48 CSS
// px, so on a small screen they grow in scene units.
//
// A drag from the holder splits the pans when the finger has passed over both pans and is
// let go anywhere but back over the holder. A drag of the splitter lying on the pans takes
// it off when it is let go over the holder, or at least `liftDistance` from where he
// grabbed it. Let go anywhere else, it slides back.

import { tuning } from '@/config/tuning';
import { trayPiece } from '@/room/tray';
import type { Side } from '@/room/types';
import { type Box, minHitCssPx } from '@/ui/scene/scale/dial-layout';
import { pieceSize, scaleGeometry } from '@/ui/scene/scale/layout';
import type { Point } from '@/ui/scene/scale/tray-layout';

export const splitterGeometry = {
  /** The holder's left edge and top, in scene units. */
  left: 20,
  top: 20,
  /** Inside the holder's frame, and between the blade and its buttons. */
  padding: 16,
  gap: 12,
  /** The blade's length in the holder. */
  bladeWidth: 240,
  /** A button's size on a large screen; at least 48 CSS px on any screen. */
  buttonSize: 80,
  /** The holder's frame line on a large screen. */
  lineWidth: 4,
  /** A splitter let go this close to the holder goes back into it. */
  dropMargin: 40,
  /** The middle of the blade lying across the pans, clear of the machine above it. */
  onPansY: 485,
  /** How far from where he grabbed it the splitter must be let go to come off the pans. */
  liftDistance: 120,
  /** How far around each pan the finger counts as passing over it. */
  panMargin: 40,
  /** The band the pans and their pieces move in, top to bottom, at any tilt. */
  panTop: 240,
  panBottom: 800,
} as const;

export type SplitterGeometry = typeof splitterGeometry;

export interface SplitterLayout {
  unitsPerPx: number;
  /** The holder. */
  box: Box;
  /** The blade in the holder: its box, with its top-left corner where it is drawn from. */
  blade: Box;
  /** Where a drag of the blade in the holder can start, at least 48 CSS px each way. */
  grab: Box;
  /** The + button, above the − button. */
  up: Box;
  down: Box;
  /** The blade lying across the pans, and where a drag of it can start. */
  onPans: Box;
  onPansGrab: Box;
  lineWidth: number;
}

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

/** The blade's height: as tall as the tray's pieces with a two-digit number, so it reads as one of them. */
export function bladeHeight(fontSize: number): number {
  return pieceSize(trayPiece('weight', tuning.trayMaxNumber), fontSize).height * 1.05;
}

/** The splitter's layout for the scene's scale (CSS px per scene unit), with labels at `fontSize`. */
export function splitterLayout(
  sceneScale: number,
  fontSize: number,
  geometry: SplitterGeometry = splitterGeometry,
): SplitterLayout {
  const unitsPerPx = sceneScale > 0 && Number.isFinite(sceneScale) ? 1 / sceneScale : 1;
  const hit = minHitCssPx * unitsPerPx;
  const button = Math.max(geometry.buttonSize, hit);
  const height = bladeHeight(fontSize);
  const cellHeight = Math.max(height, 2 * button + geometry.gap);
  const box: Box = {
    x: geometry.left,
    y: geometry.top,
    width: 2 * geometry.padding + geometry.bladeWidth + geometry.gap + button,
    height: 2 * geometry.padding + cellHeight,
  };
  const cellTop = box.y + geometry.padding;
  const blade: Box = {
    x: box.x + geometry.padding,
    y: cellTop + (cellHeight - height) / 2,
    width: geometry.bladeWidth,
    height,
  };
  const buttonsX = blade.x + blade.width + geometry.gap;
  const buttonsTop = cellTop + (cellHeight - 2 * button - geometry.gap) / 2;
  const { pivot, beamHalfLength } = scaleGeometry;
  const onPans: Box = {
    x: pivot.x - beamHalfLength,
    y: geometry.onPansY - height / 2,
    width: 2 * beamHalfLength,
    height,
  };
  return {
    unitsPerPx,
    box,
    blade,
    grab: grown(blade, hit),
    up: { x: buttonsX, y: buttonsTop, width: button, height: button },
    down: { x: buttonsX, y: buttonsTop + button + geometry.gap, width: button, height: button },
    onPans,
    onPansGrab: grown(onPans, hit),
    lineWidth: Math.max(geometry.lineWidth, 1.5 * unitsPerPx),
  };
}

function inside(point: Point, box: Box, margin = 0): boolean {
  return (
    point.x >= box.x - margin &&
    point.x <= box.x + box.width + margin &&
    point.y >= box.y - margin &&
    point.y <= box.y + box.height + margin
  );
}

/** Each pan's area, where the finger counts as passing over it: the pan's width and the band its pieces move in. */
export function panAreas(geometry: SplitterGeometry = splitterGeometry): Record<Side, Box> {
  const { pivot, beamHalfLength, panWidth } = scaleGeometry;
  const area = (centre: number): Box => ({
    x: centre - panWidth / 2 - geometry.panMargin,
    y: geometry.panTop,
    width: panWidth + 2 * geometry.panMargin,
    height: geometry.panBottom - geometry.panTop,
  });
  return { left: area(pivot.x - beamHalfLength), right: area(pivot.x + beamHalfLength) };
}

const areas = panAreas();

/** The pan the finger is over at `point` (scene units), or null. */
export function panUnder(point: Point): Side | null {
  if (inside(point, areas.left)) return 'left';
  if (inside(point, areas.right)) return 'right';
  return null;
}

/** Whether a splitter let go at `point` goes back into its holder. */
export function overHolder(
  point: Point,
  layout: SplitterLayout,
  geometry: SplitterGeometry = splitterGeometry,
): boolean {
  return inside(point, layout.box, geometry.dropMargin);
}

/** How long the splitter wiggles when it is offered for the first time (hint level 1). */
export const splitterWiggleMs = 700;
