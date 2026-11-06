// Where the x dial sits in the 1600 × 1000 logical scene, and how big its parts are
// (architecture, Consistency Rules: The dial, Gesture sizes). It is a horizontal track
// under the scale, with a tick on each notch, 24 CSS px apart, inside a fixed window. When
// the range is wider than the window, the track scrolls under it.
//
// Gesture sizes are in CSS px, not scene units, so every size here comes from the scene's
// current scale (CSS px per scene unit): on a phone the ticks spread out in scene units and
// the hit area grows, so a notch is always 24 CSS px and the hit area at least 48.

import { tuning } from '@/config/tuning';
import { assert } from '@/lib/assert';
import { type DialView, notchOf } from '@/room/dial';
import { scaleGeometry } from '@/ui/scene/scale/layout';

export const dialGeometry = {
  centerX: 800,
  /** The track's line. */
  trackY: 920,
  /** The fixed window the track shows through, centred under the scale. */
  windowWidth: 1300,
  /** The dial's band: from just under the stand's foot to the scene's bottom edge. */
  top: scaleGeometry.floorY + 30,
  bottom: 1000,
  /** Knob height, tick height and line width on a large screen, in scene units. */
  knobHeight: 96,
  tickHeight: 36,
  lineWidth: 4,
} as const;

export type DialGeometry = typeof dialGeometry;

/** Architecture, Gesture sizes: hit areas at least 48 CSS px at 640 × 360. */
export const minHitCssPx = 48;
/** On a small screen the knob, ticks and line grow so they stay this big in CSS px. */
const minKnobCssPx = 40;
const minTickCssPx = 10;
const minLineCssPx = 1.5;
/** The knob is a handle this much narrower than it is tall. */
const knobAspect = 0.46;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DialLayout {
  /** Scene units per CSS px: the inverse of the scene's scale. */
  unitsPerPx: number;
  /** Scene units between notches, so 24 CSS px on screen. */
  spacing: number;
  notches: number;
  /** From the first tick to the last. */
  length: number;
  /** The track is longer than the window and scrolls under it. */
  scrolls: boolean;
  /** The window the track shows through, in scene coordinates. */
  window: Box;
  /** The span of track that shows at once, and how far the track scrolls (0 if it fits). */
  viewLength: number;
  maxScroll: number;
  /** Scene x of notch 0 with no scroll; the track container sits at originX − scroll. */
  originX: number;
  trackY: number;
  /** Where a drag can start: the whole window, at least 48 CSS px tall. */
  hitArea: Box;
  knob: { width: number; height: number };
  tickHeight: number;
  lineWidth: number;
}

/** The dial's layout for the scene's scale (CSS px per scene unit) and its notch count. */
export function dialLayout(
  sceneScale: number,
  notches: number,
  geometry: DialGeometry = dialGeometry,
): DialLayout {
  assert(sceneScale > 0 && Number.isFinite(sceneScale), 'the dial needs the scene laid out');
  assert(Number.isInteger(notches) && notches >= 0, `not a notch count: ${notches}`);
  const unitsPerPx = 1 / sceneScale;
  const spacing = tuning.dialNotchPx * unitsPerPx;
  const length = notches * spacing;
  const knobHeight = Math.max(geometry.knobHeight, minKnobCssPx * unitsPerPx);
  const knob = { width: knobHeight * knobAspect, height: knobHeight };
  const lineWidth = Math.max(geometry.lineWidth, minLineCssPx * unitsPerPx);
  const frame: Box = {
    x: geometry.centerX - geometry.windowWidth / 2,
    y: geometry.top,
    width: geometry.windowWidth,
    height: geometry.bottom - geometry.top,
  };
  // Room for half a knob, and the end stop, at either end of the window.
  const inset = knob.width / 2 + lineWidth * 2;
  const viewLength = geometry.windowWidth - 2 * inset;
  const scrolls = length > viewLength;
  const hitHeight = Math.max(frame.height, minHitCssPx * unitsPerPx);
  return {
    unitsPerPx,
    spacing,
    notches,
    length,
    scrolls,
    window: frame,
    viewLength,
    maxScroll: scrolls ? length - viewLength : 0,
    originX: scrolls ? frame.x + inset : geometry.centerX - length / 2,
    trackY: geometry.trackY,
    hitArea: {
      x: frame.x,
      y: Math.max(0, geometry.bottom - hitHeight),
      width: frame.width,
      height: Math.min(hitHeight, geometry.bottom),
    },
    knob,
    tickHeight: Math.max(geometry.tickHeight, minTickCssPx * unitsPerPx),
    lineWidth,
  };
}

/**
 * The scroll that keeps the knob in view, given the knob's distance from notch 0 in scene
 * units. The track moves only when the knob comes within two notches (or a third of the
 * window) of an edge, never past either end, and not at all when it fits.
 */
export function followScroll(layout: DialLayout, scroll: number, offset: number): number {
  if (!layout.scrolls) return 0;
  const margin = Math.min(2 * layout.spacing, layout.viewLength / 3);
  let next = scroll;
  if (offset < next + margin) next = offset - margin;
  if (offset > next + layout.viewLength - margin) next = offset - layout.viewLength + margin;
  return Math.max(0, Math.min(layout.maxScroll, next));
}

/**
 * Where the clamp sits, in notches from notch 0: on the first notch past the poke window,
 * so the knob at the window's end stands just clear of it; or, while a waiting pin holds the
 * dial still (room 3's second stage), on the notch just past the knob. Null when nothing
 * holds the dial short.
 */
export function clampNotch(
  view: Pick<DialView, 'openMax' | 'max' | 'min' | 'step' | 'x' | 'heldByPin'>,
): number | null {
  const end = view.heldByPin ? view.x : view.openMax;
  return end < view.max ? notchOf(view, end) + 1 : null;
}
