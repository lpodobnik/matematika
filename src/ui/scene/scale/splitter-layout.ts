// Where the splitter sits in the 1600 × 1000 logical scene and how big its parts are
// (architecture Pattern 1, Balance moves; Consistency Rules: Gesture sizes; story 1.15).
// Presentation only: what a split does comes from room/splitter.ts.
//
// The splitter waits in a holder in the scene's top-left corner, left of the machine and
// above the left pan, mirroring the tray: its divider frame, with its number `: n` on a tag,
// then its + above its − at the frame's end. The HTML reset control sits over the scene
// area's top-left corner, so the holder starts right of it on any screen (at 640 × 360 the
// scene fills the area and is not letterboxed). The buttons and grab areas are at least 48
// CSS px, so on a small screen they grow in scene units.
//
// A drag of the frame splits the pans when it is let go anywhere over the scale (the same
// zone a tray piece lands in: tray-layout.ts, `overScale`), unless it is let go back over
// its holder. Let go anywhere else, it goes back.

import { type Box, minHitCssPx } from '@/ui/scene/scale/dial-layout';
import { overScale, type Point } from '@/ui/scene/scale/tray-layout';

export const splitterGeometry = {
  /** The holder's left edge and top, in scene units. */
  left: 20,
  top: 20,
  /**
   * The holder's left edge is at least this many CSS px from the scene area's left, clear of
   * the reset control (ui/common/common.css: 8 px in, 56 px wide) with an 8 px gap.
   */
  resetClearPx: 72,
  /** Inside the holder's frame, and between the divider frame and its buttons. */
  padding: 16,
  gap: 12,
  /** The divider frame's width in the holder. */
  frameWidth: 240,
  /** A button's size on a large screen; at least 48 CSS px on any screen. */
  buttonSize: 80,
  /** The holder's frame line on a large screen. */
  lineWidth: 4,
  /** A splitter let go this close to the holder goes back into it. */
  dropMargin: 40,
} as const;

export type SplitterGeometry = typeof splitterGeometry;

export interface SplitterLayout {
  unitsPerPx: number;
  /** The holder. */
  box: Box;
  /** The divider frame in the holder: its box, with its top-left corner where it is drawn from. */
  frame: Box;
  /** Where a drag of the frame can start, at least 48 CSS px each way. */
  grab: Box;
  /** The + button, above the − button, at the frame's end. */
  up: Box;
  down: Box;
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

/**
 * The divider frame's height: tall enough for its tag to carry `: n` at the label size
 * (skins/splitter.ts gives the tag 0.38 of it), with room below for the compartments.
 */
export function frameHeight(fontSize: number): number {
  return fontSize * 3.05;
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
  const height = frameHeight(fontSize);
  const cellHeight = Math.max(height, 2 * button + geometry.gap);
  const box: Box = {
    x: Math.max(geometry.left, geometry.resetClearPx * unitsPerPx),
    y: geometry.top,
    width: 2 * geometry.padding + geometry.frameWidth + geometry.gap + button,
    height: 2 * geometry.padding + cellHeight,
  };
  const cellTop = box.y + geometry.padding;
  const frame: Box = {
    x: box.x + geometry.padding,
    y: cellTop + (cellHeight - height) / 2,
    width: geometry.frameWidth,
    height,
  };
  const buttonsX = frame.x + frame.width + geometry.gap;
  const buttonsTop = cellTop + (cellHeight - 2 * button - geometry.gap) / 2;
  return {
    unitsPerPx,
    box,
    frame,
    grab: grown(frame, hit),
    up: { x: buttonsX, y: buttonsTop, width: button, height: button },
    down: { x: buttonsX, y: buttonsTop + button + geometry.gap, width: button, height: button },
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

/** Whether a splitter let go at `point` goes back into its holder. */
export function overHolder(
  point: Point,
  layout: SplitterLayout,
  geometry: SplitterGeometry = splitterGeometry,
): boolean {
  return inside(point, layout.box, geometry.dropMargin);
}

/** Whether a splitter let go at `point` splits the pans: over the scale, not back over its holder. */
export function splitsAt(point: Point, layout: SplitterLayout): boolean {
  return overScale(point) && !overHolder(point, layout);
}

/** How long the splitter wiggles when it is offered for the first time (hint level 1). */
export const splitterWiggleMs = 700;
