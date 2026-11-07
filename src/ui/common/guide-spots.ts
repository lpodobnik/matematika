// Where a room guide's rings go and where its card stands (story 6.1; room/guide.ts says
// what each step rings). The scene's parts are drawn on the canvas, so their boxes come
// from the scene's layouts, in the 1600 × 1000 scene fitted into the scene area (as
// scene-spots.ts finds the pin's head); the HTML parts (the notebook's, the hint button,
// the flag's confirm control, the goal banner) are measured where they are. Presentation
// only, with no React, Pixi or DOM, so the tests can check it at 640 × 360 and on the tablet.

import { flagBounds } from '@/art/skins/pin';
import { hr } from '@/content/text/hr';
import { notchCount } from '@/room/dial';
import type { GuideTarget } from '@/room/guide';
import { pinTrack, pinView, slotCount } from '@/room/pin';
import { currentStageSpec } from '@/room/room';
import { scaleView } from '@/room/scale';
import type { RoomState, ToolId } from '@/room/types';
import type { Size } from '@/ui/common/scene-spots';
import { copyPlacements } from '@/ui/scene/copies';
import { fitScene } from '@/ui/scene/fit-scene';
import { type Box, dialLayout } from '@/ui/scene/scale/dial-layout';
import { dialBoxes, goalCardBounds, panBoxes } from '@/ui/scene/scale/goal-card-layout';
import { labelFontSize, type Point } from '@/ui/scene/scale/layout';
import { pinLayout, placeX } from '@/ui/scene/scale/pin-layout';
import { pinTagLayout, resetCorner, tagObstacles } from '@/ui/scene/scale/pin-tag-layout';
import { splitterLayout } from '@/ui/scene/scale/splitter-layout';
import { stageTrayLayout } from '@/ui/scene/scale/tray-layout';

/** A box on screen, in CSS px. */
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function union(boxes: readonly Box[]): Box | null {
  if (boxes.length === 0) return null;
  const x0 = Math.min(...boxes.map((b) => b.x));
  const y0 = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + b.width));
  const y1 = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/**
 * The scale as it stands: each pan with its pieces and its readout, one ring a side, so a
 * tall stack of pieces on one pan leaves room for the card over the other.
 */
function scaleBoxes(room: RoomState, labelSize: number): Box[] {
  const view = scaleView(room);
  const parts = panBoxes(view, view.tilt, labelSize);
  return (['left', 'right'] as const).flatMap((side) => {
    const box = union(
      [parts.get(side), parts.get(`${side}-readout`)].filter((b) => b !== undefined),
    );
    return box ? [box] : [];
  });
}

/** The flag in its holder and on its first and last places: the track it moves along. */
function pinBox(room: RoomState, sceneScale: number, labelSize: number): Box | null {
  const spec = currentStageSpec(room);
  const view = pinView(room);
  const track = pinTrack(spec);
  if (!view || !track || spec.dial === 'locked') return null;
  const slots = slotCount(track);
  const pins = pinLayout(
    dialLayout(sceneScale, notchCount(spec.dial)),
    { kind: view.kind, slots },
    labelSize,
  );
  const flag = flagBounds(pins);
  const hit = pins.hitArea;
  const at = (x: number): Box => {
    const left = x + Math.min(flag.left, hit.x);
    const top = Math.min(flag.top, hit.y);
    return {
      x: left,
      y: top,
      width: x + Math.max(flag.right, hit.x + hit.width) - left,
      height: pins.tipY - top,
    };
  };
  return union([at(placeX(pins, null)), at(placeX(pins, 0)), at(placeX(pins, slots - 1))]);
}

/** The scene as the guide reads it: the stage, his tools, and how the scene is fitted. */
export interface SceneContext {
  room: RoomState;
  tools: readonly ToolId[];
  /** CSS px per scene unit. */
  sceneScale: number;
  /** The scene's top-left corner in the scene area, in CSS px (`fitScene`). */
  origin: Point;
}

/**
 * The parts of the scene a step rings, in scene units; none for a part not in the scene now
 * (the goal is the scene's small card only where the banner above the scene doesn't fit).
 */
export function sceneTargetBoxes(target: GuideTarget, scene: SceneContext): Box[] {
  const { room, sceneScale } = scene;
  if (!(sceneScale > 0)) return [];
  const labelSize = labelFontSize(sceneScale);
  const one = (box: Box | null | undefined): Box[] => (box ? [box] : []);
  switch (target) {
    case 'dial':
      return one(dialBoxes(room, sceneScale, labelSize)[0]);
    case 'scale':
      return scaleBoxes(room, labelSize);
    case 'pin':
      return one(pinBox(room, sceneScale, labelSize));
    case 'tray':
      return [stageTrayLayout(room, sceneScale, labelSize).box];
    case 'splitter':
      return [splitterLayout(sceneScale, labelSize).box];
    case 'goal':
      return one(goalCardBounds(room, scene.tools, sceneScale, scene.origin));
    default:
      return [];
  }
}

/**
 * What the card keeps clear of in the scene where it can, beyond the rings: the pin's
 * question tag while it asks (Pin.tsx lays it out the same way), which says what the flag is
 * for. In scene units.
 */
export function sceneAvoidBoxes(scene: SceneContext): Box[] {
  const { room, sceneScale, origin } = scene;
  const spec = currentStageSpec(room);
  const view = pinView(room);
  if (!(sceneScale > 0) || !view?.asks || spec.dial === 'locked') return [];
  if (view.kind !== 'x' && view.kind !== 'choice') return [];
  const labelSize = labelFontSize(sceneScale);
  const pins = pinLayout(
    dialLayout(sceneScale, notchCount(spec.dial)),
    { kind: view.kind, slots: view.slots },
    labelSize,
  );
  const reset = resetCorner(sceneScale, origin);
  const obstacles = tagObstacles(room.spec, room.stageIndex, pins, view.slots, labelSize, reset);
  return [pinTagLayout(hr.pin.questions[view.question], sceneScale, pins, obstacles).box];
}

/** A box of the scene, in CSS px from the scene area's top-left, with the first copy's placing. */
export function sceneBoxInArea(box: Box, area: Size, copies: number): Rect | null {
  const fit = fitScene(area.width, area.height);
  const [copy] = copyPlacements(copies);
  if (!copy || !(fit.scale > 0)) return null;
  const toX = (x: number) => fit.x + (copy.x + x * copy.scale) * fit.scale;
  const toY = (y: number) => fit.y + (copy.y + y * copy.scale) * fit.scale;
  const left = toX(box.x);
  const top = toY(box.y);
  return { left, top, width: toX(box.x + box.width) - left, height: toY(box.y + box.height) - top };
}

/** The scale the scene is drawn at in an area: CSS px per scene unit, for the first copy. */
export function sceneScaleIn(area: Size, copies: number): number {
  const [copy] = copyPlacements(copies);
  return fitScene(area.width, area.height).scale * (copy?.scale ?? 1);
}

/** A ring's box: the part with room round it, kept inside the screen. */
export function ringRect(rect: Rect, screen: Size, pad: number): Rect {
  const left = Math.max(2, rect.left - pad);
  const top = Math.max(2, rect.top - pad);
  const right = Math.min(screen.width - 2, rect.left + rect.width + pad);
  const bottom = Math.min(screen.height - 2, rect.top + rect.height + pad);
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

function overlap(a: Rect, b: Rect): number {
  const w = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  const h = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Kept between the card and the region's edges, and the rings, in CSS px. */
export const cardGapPx = 8;

/**
 * Where the card stands (its top-left corner on screen): inside `region` (the scene area,
 * left of the notebook where the notebook lies over it), clear of the rings (`holes`), and
 * clear of the controls (`avoid`) where it can be. It tries the region's top, bottom and
 * middle, centred, left and right, and takes the first that covers no ring and the fewest
 * controls; where every place covers a ring, the one that covers the least.
 */
export function placeGuideCard(
  region: Rect,
  card: Size,
  holes: readonly Rect[],
  avoid: readonly Rect[],
): { left: number; top: number } {
  const gap = cardGapPx;
  const xs = [
    region.left + (region.width - card.width) / 2,
    region.left + gap,
    region.left + region.width - card.width - gap,
  ];
  const ys = [
    region.top + gap,
    region.top + region.height - card.height - gap,
    region.top + (region.height - card.height) / 2,
  ];
  const minLeft = region.left + gap;
  const maxLeft = Math.max(minLeft, region.left + region.width - card.width - gap);
  const minTop = region.top + gap;
  const maxTop = Math.max(minTop, region.top + region.height - card.height - gap);
  const clampLeft = (x: number) => Math.min(maxLeft, Math.max(minLeft, x));
  const clampTop = (y: number) => Math.min(maxTop, Math.max(minTop, y));
  let best: { left: number; top: number; cost: number } | null = null;
  for (const y of ys) {
    for (const x of xs) {
      const spot = { left: clampLeft(x), top: clampTop(y), width: card.width, height: card.height };
      const grown = {
        left: spot.left - gap,
        top: spot.top - gap,
        width: spot.width + 2 * gap,
        height: spot.height + 2 * gap,
      };
      const covers = holes.reduce((sum, hole) => sum + overlap(grown, hole), 0);
      const crowds = avoid.reduce((sum, other) => sum + overlap(spot, other), 0);
      const cost = covers * 1000 + crowds;
      if (!best || cost < best.cost) best = { left: spot.left, top: spot.top, cost };
      if (cost === 0) return { left: spot.left, top: spot.top };
    }
  }
  return best ? { left: best.left, top: best.top } : { left: minLeft, top: minTop };
}
