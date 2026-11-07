// Where the goal card stands in the 1600 × 1000 logical scene (story 1.16; room/goal.ts
// decides when it shows and when it lights, hr.ts holds its label). It is a small paper
// card: its label (`Cilj: x sam`, at least 20 CSS px, on two short lines) beside a
// miniature scale, one x-gear alone on one pan and a weight marked `?` on the other.
//
// It stands as near the scene's bottom-right corner as it can: under the right pan, right
// of the dial, its picture as big as fits there. It never covers the pans (with their
// pieces and readouts, at every x the dial reaches and at every tilt), the beam and the
// stand, the dial (its track, knob and plate at every notch), the pin flag on the track,
// the tray, the splitter (both, whenever Balance is earned, so the card doesn't move when
// the splitter comes), the HTML reset control and hint button in the scene area's top-left
// corner, the parts counter in its bottom-left, or the phone's notebook handle. It keeps
// clear of the machine where it can. The handover tags and the hint's tags keep clear of it
// in turn (handover-tag-layout.ts), so it never covers them either.

import { flagBounds } from '@/art/skins/pin';
import { tuning } from '@/config/tuning';
import { hr } from '@/content/text/hr';
import { num, xVar } from '@/math/expr';
import { formatEquation } from '@/math/format';
import { notchCount } from '@/room/dial';
import { goalView } from '@/room/goal';
import { pinTrack, pinView, slotCount } from '@/room/pin';
import { currentStageSpec } from '@/room/room';
import { type ScaleView, scaleView, scaleViewAt } from '@/room/scale';
import type { RoomState, ToolId } from '@/room/types';
import { sceneSize } from '@/ui/scene/fit-scene';
import { machineBounds } from '@/ui/scene/machine/layout';
import { dialLabelTop } from '@/ui/scene/scale/dial-label';
import { type Box, dialLayout } from '@/ui/scene/scale/dial-layout';
import {
  beamPose,
  labelFontSize,
  labelWidth,
  layoutPan,
  type Point,
  readoutBox,
  scaleGeometry,
} from '@/ui/scene/scale/layout';
import { pinLayout, placeX } from '@/ui/scene/scale/pin-layout';
import { resetCorner, tagFontSize, wrapWords } from '@/ui/scene/scale/pin-tag-layout';
import { splitterLayout } from '@/ui/scene/scale/splitter-layout';
import { stageTrayLayout } from '@/ui/scene/scale/tray-layout';

export const goalCardGeometry = {
  /** An estimate of a character's width, in em, on the generous side (as the tags'). */
  charWidth: 0.5,
  lineHeight: 1.15,
  /** Inside the card, and between the label and the picture, in em. */
  padding: 0.3,
  /** The label's lines, at most this many characters: `Cilj:` over `x sam`. */
  wrap: 6,
  /**
   * The miniature scale's height, in ems of the label, tried largest first: as big as fits
   * in the corner (on the tablet), down to the label's two lines (at 640 × 360).
   */
  pictureEms: [4, 3.2, 2.3],
  /** Its width over its height. */
  pictureAspect: 2.8 / 2.3,
  /** A picture bigger than the smallest is taken only this near the corner, in em. */
  cornerEms: 1,
  /** Round the card, for its heavier frame when it lights, in em. */
  glow: 0.1,
  /** From the scene's edges, in scene units. */
  margin: 12,
  /** Kept clear between the card and anything it must not cover, in CSS px. */
  gapPx: 4,
  /** How far below the pans' dishes their surfaces' trays reach (the pan skin draws 18). */
  dishDepth: 22,
  /** The parts counter's corner of the scene area (common.css: 8 px in, 52 tall), in CSS px. */
  partsCornerPx: { width: 128, height: 68 },
  /** The phone's notebook handle (notebook.css: 8 px down, 48 × 96, by the right edge). */
  handlePx: { width: 58, height: 112 },
  /** Under this many CSS px tall, the scene area is a phone's, with the notebook over it. */
  phoneHeightPx: 500,
} as const;

export interface GoalCardLayout {
  /** The card. */
  box: Box;
  /** The card with its glow: what it keeps clear of everything with. */
  bounds: Box;
  lines: string[];
  /** At least 20 CSS px. */
  fontSize: number;
  lineHeight: number;
  /** The top-left of the label's first line. */
  text: Point;
  /** Where the miniature scale is drawn. */
  picture: Box;
  lineWidth: number;
}

/** What the card keeps clear of: `hard` it never covers, `soft` only where nothing else is free. */
export interface CardObstacles {
  hard: Box[];
  soft: Box[];
}

function boxOf(x0: number, y0: number, x1: number, y1: number): Box {
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

function union(a: Box, b: Box): Box {
  return boxOf(
    Math.min(a.x, b.x),
    Math.min(a.y, b.y),
    Math.max(a.x + a.width, b.x + b.width),
    Math.max(a.y + a.height, b.y + b.height),
  );
}

/** Each pan with its pieces, and each readout, in one weighing at `tilt`. */
export function panBoxes(view: ScaleView, tilt: number, labelSize: number): Map<string, Box> {
  const pose = beamPose(tilt);
  const boxes = new Map<string, Box>();
  for (const side of ['left', 'right'] as const) {
    const centre = pose[side];
    const pieces = layoutPan(view[side].pieces, labelSize);
    const half = scaleGeometry.panWidth / 2;
    const top = Math.min(0, ...pieces.map((b) => b.y - b.height));
    const left = Math.min(-half, ...pieces.map((b) => b.x - b.width / 2));
    const right = Math.max(half, ...pieces.map((b) => b.x + b.width / 2));
    const depth = goalCardGeometry.dishDepth;
    boxes.set(side, boxOf(centre.x + left, centre.y + top, centre.x + right, centre.y + depth));
    const label = view.readouts?.[side];
    if (label !== undefined) {
      const r = readoutBox(side, label, labelSize);
      boxes.set(
        `${side}-readout`,
        boxOf(
          centre.x + r.x - r.width / 2,
          centre.y + r.y - r.height / 2,
          centre.x + r.x + r.width / 2,
          centre.y + r.y + r.height / 2,
        ),
      );
    }
  }
  return boxes;
}

/**
 * Where each pan and readout sweeps: its box in every weighing the pans can show (now, and
 * at each x the dial reaches), at that weighing's tilt and at either end of the tilt's
 * range, since a pan moves almost straight up and down between them.
 */
function sweptPans(room: RoomState, labelSize: number): Box[] {
  const views = [scaleView(room)];
  const { dial } = currentStageSpec(room);
  if (dial !== 'locked') {
    for (let x = dial.min; x <= dial.max; x += dial.step) views.push(scaleViewAt(room, x));
  }
  const swept = new Map<string, Box>();
  for (const view of views) {
    for (const tilt of [view.tilt, -tuning.tiltMax, tuning.tiltMax]) {
      for (const [part, box] of panBoxes(view, tilt, labelSize)) {
        const had = swept.get(part);
        swept.set(part, had ? union(had, box) : box);
      }
    }
  }
  return [...swept.values()];
}

/**
 * The dial: its track with the knob at either end (or its whole window, when the track
 * scrolls), from the top of the knob's plate, at every notch, down to the scene's bottom;
 * and the pin's flag where it stands on the track.
 */
export function dialBoxes(room: RoomState, sceneScale: number, labelSize: number): Box[] {
  const spec = currentStageSpec(room);
  const { dial } = spec;
  if (dial === 'locked') return [];
  const layout = dialLayout(sceneScale, notchCount(dial));
  const end = layout.knob.width / 2 + layout.lineWidth * 2;
  const plate = labelWidth(formatEquation({ left: xVar(), right: num(dial.max) }), labelSize);
  const half = Math.max(end, (plate + labelSize * 0.6) / 2);
  const span = layout.scrolls
    ? { from: layout.window.x, to: layout.window.x + layout.window.width }
    : {
        from: layout.originX - half,
        to: layout.originX + layout.length + half,
      };
  const top = layout.trackY + dialLabelTop(layout, sceneScale);
  const boxes = [boxOf(span.from, top, span.to, sceneSize.height)];
  const pin = pinView(room);
  const track = pinTrack(spec);
  if (pin && track && pin.slot !== null) {
    const pins = pinLayout(layout, { kind: pin.kind, slots: slotCount(track) }, labelSize);
    const flag = flagBounds(pins);
    const x = placeX(pins, pin.slot);
    const hit = pins.hitArea;
    boxes.push(
      boxOf(
        x + Math.min(flag.left, hit.x),
        Math.min(flag.top, hit.y),
        x + Math.max(flag.right, hit.x + hit.width),
        pins.tipY,
      ),
    );
  }
  return boxes;
}

/**
 * The HTML laid over the scene, in scene units: the reset control with the hint button
 * under it (`resetCorner`), the parts counter in the bottom-left corner, and on a phone the
 * notebook's handle by the right edge. `origin` is the scene's top-left corner in the scene
 * area, in CSS px (`fitScene`), so the area is the scene with that margin round it.
 */
export function controlBoxes(sceneScale: number, origin: Point): Box[] {
  const { partsCornerPx: parts, handlePx: handle, phoneHeightPx } = goalCardGeometry;
  const toX = (px: number) => (px - origin.x) / sceneScale;
  const toY = (px: number) => (px - origin.y) / sceneScale;
  const width = 2 * origin.x + sceneSize.width * sceneScale;
  const height = 2 * origin.y + sceneSize.height * sceneScale;
  const boxes = [
    resetCorner(sceneScale, origin),
    boxOf(toX(0), toY(height - parts.height), toX(parts.width), toY(height)),
  ];
  if (height < phoneHeightPx) {
    boxes.push(boxOf(toX(width - handle.width), toY(0), toX(width), toY(handle.height)));
  }
  return boxes;
}

/**
 * What the card keeps clear of in the stage as it is now. Hard: the pans in every weighing,
 * the beam and the stand, the dial and the pin's flag, the tray and the splitter whenever
 * Balance is earned, and the HTML controls (`controlBoxes`). Soft: the machine.
 */
export function goalCardObstacles(
  room: RoomState,
  tools: readonly ToolId[],
  sceneScale: number,
  origin: Point,
): CardObstacles {
  const labelSize = labelFontSize(sceneScale);
  const hard = [
    ...sweptPans(room, labelSize),
    ...dialBoxes(room, sceneScale, labelSize),
    ...controlBoxes(sceneScale, origin),
  ];
  if (tools.includes('balance')) {
    hard.push(
      stageTrayLayout(room, sceneScale, labelSize).box,
      splitterLayout(sceneScale, labelSize).box,
    );
  }
  const { pivot, floorY, beamHalfLength } = scaleGeometry;
  const lift = beamHalfLength * Math.sin((tuning.tiltMax * Math.PI) / 180) + 12;
  hard.push(
    // The beam at every tilt; the stand's post with the needle above the pivot (it swings
    // ±15°), and its foot.
    boxOf(pivot.x - beamHalfLength, pivot.y - lift, pivot.x + beamHalfLength, pivot.y + lift),
    boxOf(pivot.x - 40, pivot.y - 110, pivot.x + 40, floorY),
    boxOf(pivot.x - 160, floorY, pivot.x + 160, floorY + 26),
  );
  const machine = machineBounds();
  return { hard, soft: [boxOf(machine.left, machine.top, machine.right, machine.bottom)] };
}

function clearOf(box: Box, obstacles: readonly Box[], gap: number): boolean {
  return obstacles.every(
    (o) =>
      box.x + box.width + gap <= o.x ||
      o.x + o.width + gap <= box.x ||
      box.y + box.height + gap <= o.y ||
      o.y + o.height + gap <= box.y,
  );
}

/** The card's size and its parts' places from its top-left corner, at `fontSize`. */
interface CardShape {
  lines: string[];
  width: number;
  height: number;
  picture: Box;
  text: Point;
}

/**
 * The card with its picture `pictureEms` tall (in ems of the label): the label's lines on the
 * left and the picture on the right, each centred in the card's height.
 */
function cardShape(label: string, fontSize: number, pictureEms: number): CardShape {
  const { charWidth, lineHeight, padding, wrap, pictureAspect } = goalCardGeometry;
  const lines = wrapWords(label, wrap);
  const pad = padding * fontSize;
  const longest = Math.max(...lines.map((line) => [...line].length));
  const textWidth = longest * charWidth * fontSize;
  const textHeight = lines.length * lineHeight * fontSize;
  const pictureHeight = pictureEms * fontSize;
  const inner = Math.max(textHeight, pictureHeight);
  return {
    lines,
    width: pad + textWidth + pad + pictureHeight * pictureAspect + pad,
    height: inner + 2 * pad,
    picture: {
      x: pad + textWidth + pad,
      y: pad + (inner - pictureHeight) / 2,
      width: pictureHeight * pictureAspect,
      height: pictureHeight,
    },
    text: { x: pad, y: pad + (inner - textHeight) / 2 },
  };
}

/**
 * The places to try for a card of `outer` size, nearest the scene's bottom-right corner
 * first: a grid half an em apart, and the places hard up against each obstacle, inside the
 * scene's margin. With each, how far its bottom-right corner is from the scene's.
 */
function spotsFor(
  outer: { width: number; height: number },
  obstacles: readonly Box[],
  gap: number,
  step: number,
) {
  const { margin } = goalCardGeometry;
  const maxX = sceneSize.width - margin - outer.width;
  const maxY = sceneSize.height - margin - outer.height;
  const xs = new Set([maxX, margin]);
  const ys = new Set([maxY, margin]);
  for (let x = maxX; x >= margin; x -= step) xs.add(x);
  for (let y = maxY; y >= margin; y -= step) ys.add(y);
  for (const o of obstacles) {
    xs.add(o.x - gap - outer.width);
    xs.add(o.x + o.width + gap);
    ys.add(o.y - gap - outer.height);
    ys.add(o.y + o.height + gap);
  }
  const corner = { x: sceneSize.width - margin, y: sceneSize.height - margin };
  const spots: { box: Box; far: number }[] = [];
  for (const x of xs) {
    if (x < margin || x > maxX) continue;
    for (const y of ys) {
      if (y < margin || y > maxY) continue;
      const box = { x, y, ...outer };
      spots.push({
        box,
        far: Math.hypot(corner.x - (x + outer.width), corner.y - (y + outer.height)),
      });
    }
  }
  return spots.sort((a, b) => a.far - b.far);
}

/**
 * The goal card for `label` in the stage as it is now, at the scene's scale (CSS px per
 * scene unit), with the scene's top-left corner at `origin` in the scene area. Its picture
 * is as big as fits in the scene's bottom-right corner (`pictureEms`, largest first), clear
 * of everything; failing all, at its smallest, the clear place nearest that corner, clear
 * of everything, else of the hard obstacles (covering the machine). Null where
 * there is none: never for room 4 on the tablet or at 640 × 360 (the layout tests check).
 */
/**
 * How tall the goal banner is, in CSS px (story 1.16, after Luka: "the small cilj x sam in
 * the corner is not noticeable"). Where the scene leaves a band above it at least this
 * tall plus a margin (the tablet, a computer), the goal is a large banner in that band
 * (ui/common/GoalBanner.tsx); only where it doesn't (a phone) does this small card stand in
 * the scene.
 */
export const goalBannerHeight = 88;

/** Whether the band above the scene, `bandPx` CSS px tall, holds the goal banner. */
export function goalBannerFits(bandPx: number): boolean {
  return bandPx >= goalBannerHeight + 16;
}

export function goalCardLayout(
  label: string,
  room: RoomState,
  tools: readonly ToolId[],
  sceneScale: number,
  origin: Point,
): GoalCardLayout | null {
  const fontSize = tagFontSize(sceneScale);
  const glow = goalCardGeometry.glow * fontSize;
  const gap = goalCardGeometry.gapPx / sceneScale;
  const obstacles = goalCardObstacles(room, tools, sceneScale, origin);
  const all = [...obstacles.hard, ...obstacles.soft];
  const sizes = goalCardGeometry.pictureEms;
  for (const [i, ems] of sizes.entries()) {
    const shape = cardShape(label, fontSize, ems);
    const outer = { width: shape.width + 2 * glow, height: shape.height + 2 * glow };
    const spots = spotsFor(outer, all, gap, fontSize / 2);
    const last = i === sizes.length - 1;
    const near = (far: number) => last || far <= goalCardGeometry.cornerEms * fontSize;
    const found =
      spots.find((spot) => near(spot.far) && clearOf(spot.box, all, gap)) ??
      (last ? spots.find((spot) => clearOf(spot.box, obstacles.hard, gap)) : undefined);
    if (found) return placed(shape, found.box, glow, fontSize, sceneScale);
  }
  return null;
}

function placed(
  shape: CardShape,
  bounds: Box,
  glow: number,
  fontSize: number,
  sceneScale: number,
): GoalCardLayout {
  const box = { x: bounds.x + glow, y: bounds.y + glow, width: shape.width, height: shape.height };
  return {
    box,
    bounds,
    lines: shape.lines,
    fontSize,
    lineHeight: goalCardGeometry.lineHeight * fontSize,
    text: { x: box.x + shape.text.x, y: box.y + shape.text.y },
    picture: { ...shape.picture, x: box.x + shape.picture.x, y: box.y + shape.picture.y },
    lineWidth: Math.max(3, 1.5 / sceneScale),
  };
}

/**
 * The goal card's bounds, with its glow, in the stage as it is now, or null when it isn't in
 * the scene: the handover tags and the hint's tags keep clear of it.
 */
export function goalCardBounds(
  room: RoomState,
  tools: readonly ToolId[],
  sceneScale: number,
  origin: Point,
): Box | null {
  if (!goalView(room, tools) || goalBannerFits(origin.y)) return null;
  return goalCardLayout(hr.goal.label, room, tools, sceneScale, origin)?.bounds ?? null;
}
