// Where a handover tag hangs in the 1600 × 1000 logical scene (story 1.15; room/handover.ts
// decides which tag shows, hr.ts holds its text). It looks like the pin's question tag
// (pin-tag-layout.ts): a paper card with its text at least 20 CSS px, on a string tied to
// what it is about, or from a nail on the wall:
//
//   dial          by the knob, its string down to the knob's x label
//   tray          at the tray, its string to the shelf's inner bottom corner
//   splitter      at the splitter, its string to its holder's inner bottom corner
//   balance-goal  above the scale, from a nail
//
// (`write` and `check` hang at the notebook, in HTML: ui/notebook/HandoverNote.tsx.)
//
// It must never cover the pans (at every x the dial can reach, and as the scale acts out),
// the dial with its label, or the pin's places; nor the reset control, nor the tool it is
// about or he needs next. It keeps clear of the machine, the stand and the other tool where it can, and
// covers them only where nothing else is free (at 640 × 360, where 20 CSS px text takes a
// large part of the scene). It is drawn over the tools for that. Among the clear places it
// takes the one nearest to what it is about, trying the text wrapped wide first, then
// narrower.

import { assert } from '@/lib/assert';
import { notchCount, notchOf } from '@/room/dial';
import { pinTrack, pinView, slotCount } from '@/room/pin';
import { currentStageSpec } from '@/room/room';
import { type ScaleView, scaleView, scaleViewAt } from '@/room/scale';
import { splitterOffered } from '@/room/splitter';
import { trayOffered } from '@/room/tray';
import type { HandoverId, RoomState, ToolId } from '@/room/types';
import { sceneSize } from '@/ui/scene/fit-scene';
import { machineBounds } from '@/ui/scene/machine/layout';
import { dialLabelTop } from '@/ui/scene/scale/dial-label';
import { type Box, dialLayout, followScroll } from '@/ui/scene/scale/dial-layout';
import { goalCardBounds } from '@/ui/scene/scale/goal-card-layout';
import {
  beamPose,
  labelFontSize,
  layoutPan,
  type Point,
  readoutBox,
  scaleGeometry,
} from '@/ui/scene/scale/layout';
import { pinLayout, placeX } from '@/ui/scene/scale/pin-layout';
import { resetCorner, tagFontSize } from '@/ui/scene/scale/pin-tag-layout';
import { splitterLayout } from '@/ui/scene/scale/splitter-layout';
import { trayLayout } from '@/ui/scene/scale/tray-layout';

/** The handovers whose tags hang in the scene. */
export type SceneHandover = Exclude<HandoverId, 'write' | 'answer' | 'check'>;

export function isSceneHandover(id: HandoverId | null): id is SceneHandover {
  return id !== null && id !== 'write' && id !== 'answer' && id !== 'check';
}

export const handoverTagGeometry = {
  /** An estimate of a character's width, in em, on the generous side (as the pin's tag). */
  charWidth: 0.5,
  lineHeight: 1.25,
  /** Inside the card, in em. */
  padding: 0.4,
  /** Kept clear between the card and anything it must not cover, in CSS px. */
  gapPx: 4,
  /** From the scene's edges, in scene units. */
  margin: 16,
  /** Characters a line, tried widest first. */
  wraps: [30, 26, 22, 18, 16, 14],
  /** A card of more lines than this is not tried. */
  maxLines: 5,
  /** How far below the pans' dishes their surfaces' trays reach (the pan skin draws 18). */
  dishDepth: 22,
  /** Around the pin's places, for the flag lane A draws there. */
  pinPad: 12,
  /** Where the balance goal's tag is wanted: above the scale's pivot. */
  aboveScale: { x: 800, y: 260 },
} as const;

export interface HandoverTagLayout {
  lines: string[];
  /** In scene units: at least 20 CSS px. */
  fontSize: number;
  lineHeight: number;
  /** The card. */
  box: Box;
  /** The top-left of the first line. */
  text: Point;
  /** The hole its string runs through, at the card's edge nearest the tie. */
  hole: Point;
  /** Where the string is tied: what the tag is about, or a nail above the card. */
  tie: Point;
  nail: boolean;
  /** Whether it had to cover the machine or the stand (never the pans, dial or pin). */
  coversMachine: boolean;
}

/** What a tag keeps clear of: `hard` it never covers, `soft` only where nothing else is free. */
export interface TagObstacles {
  hard: Box[];
  soft: Box[];
}

function boxOf(x0: number, y0: number, x1: number, y1: number): Box {
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/** The pans with their pieces and readouts in one weighing, by part. */
function panBoxes(view: ScaleView, labelSize: number): Map<string, Box> {
  const pose = beamPose(view.tilt);
  const boxes = new Map<string, Box>();
  for (const side of ['left', 'right'] as const) {
    const centre = pose[side];
    const pieces = layoutPan(view[side].pieces, labelSize);
    const half = scaleGeometry.panWidth / 2;
    const top = Math.min(0, ...pieces.map((b) => b.y - b.height));
    const left = Math.min(-half, ...pieces.map((b) => b.x - b.width / 2));
    const right = Math.max(half, ...pieces.map((b) => b.x + b.width / 2));
    const depth = handoverTagGeometry.dishDepth;
    boxes.set(side, boxOf(centre.x + left, centre.y + top, centre.x + right, centre.y + depth));
    const label = view.readouts?.[side];
    if (label !== undefined) {
      const r = readoutBox(side, label, labelSize);
      boxes.set(`${side}-readout`, {
        x: centre.x + r.x - r.width / 2,
        y: centre.y + r.y - r.height / 2,
        width: r.width,
        height: r.height,
      });
    }
  }
  return boxes;
}

/**
 * Where each pan and readout sweeps over all the weighings: the box round each part's
 * boxes. A pan moves almost straight up and down, so this covers little more than the
 * pan itself does, and keeps the obstacles few.
 */
function sweptPans(views: readonly ScaleView[], labelSize: number): Box[] {
  const swept = new Map<string, Box>();
  for (const view of views) {
    for (const [part, box] of panBoxes(view, labelSize)) {
      const had = swept.get(part);
      swept.set(
        part,
        had
          ? boxOf(
              Math.min(had.x, box.x),
              Math.min(had.y, box.y),
              Math.max(had.x + had.width, box.x + box.width),
              Math.max(had.y + had.height, box.y + box.height),
            )
          : box,
      );
    }
  }
  return [...swept.values()];
}

/** Every weighing the pans can show while the tag hangs: each x the dial reaches, and now. */
function weighings(room: RoomState): ScaleView[] {
  const views = [scaleView(room)];
  const { dial } = currentStageSpec(room);
  if (dial === 'locked') return views;
  const { min, max } = room.stage.dialOpen;
  for (let x = min; x <= max; x += dial.step) views.push(scaleViewAt(room, x));
  return views;
}

/**
 * What the tag of handover `about` keeps clear of in the stage as it is now, at the scene's
 * scale (CSS px per scene unit), with the scene's top-left corner at `origin` in the scene
 * area, CSS px. Hard: the pans in every weighing, the dial's band from its x label down,
 * the pin (a choice pin's places too), the reset control's corner with the hint button, the
 * goal card (story 1.16), and the tool the tag
 * is about or that he needs next: the splitter for its own tag, else the tray (and for the
 * dial's, both). Soft: the other tool while offered, the machine and the stand. (Until
 * story 1.15's offer rules land, room 4 offers both tools at once.)
 */
export function handoverObstacles(
  about: SceneHandover,
  room: RoomState,
  tools: readonly ToolId[],
  sceneScale: number,
  origin: Point,
): TagObstacles {
  const labelSize = labelFontSize(sceneScale);
  const hard: Box[] = sweptPans(weighings(room), labelSize);
  const soft: Box[] = [];
  const { dial } = currentStageSpec(room);
  if (dial !== 'locked') {
    const layout = dialLayout(sceneScale, notchCount(dial));
    const top = layout.trackY + dialLabelTop(layout, sceneScale);
    hard.push(boxOf(0, top, sceneSize.width, sceneSize.height));
    const pin = pinView(room);
    const track = pinTrack(currentStageSpec(room));
    if (pin && track) {
      // A choice pin's places show its options; an x pin's places are the dial's notches,
      // so only the pin itself stands above them.
      const slots = slotCount(track);
      const pins = pinLayout(layout, { kind: pin.kind, slots }, labelSize);
      const pad = handoverTagGeometry.pinPad;
      const hit = pins.hitArea;
      const shown = pin.kind === 'choice' ? [0, slots - 1] : pin.slot === null ? [] : [pin.slot];
      if (shown.length > 0) {
        const first = placeX(pins, Math.min(...shown));
        const last = placeX(pins, Math.max(...shown));
        hard.push(
          boxOf(first + hit.x - pad, hit.y - pad, last + hit.x + hit.width + pad, pins.tipY),
        );
      }
    }
  }
  hard.push(resetCorner(sceneScale, origin));
  // Story 1.16: the goal card, while the tray is offered.
  const goal = goalCardBounds(room, tools, sceneScale, origin);
  if (goal) hard.push(goal);
  const tray = trayOffered(room, tools) ? [trayLayout(sceneScale, labelSize).box] : [];
  const splitter = splitterOffered(room, tools) ? [splitterLayout(sceneScale, labelSize).box] : [];
  if (about === 'splitter') {
    hard.push(...splitter);
    soft.push(...tray);
  } else if (about === 'dial') {
    hard.push(...tray, ...splitter);
  } else {
    hard.push(...tray);
    soft.push(...splitter);
  }
  const { pivot, floorY } = scaleGeometry;
  const machine = machineBounds();
  soft.push(
    boxOf(machine.left, machine.top, machine.right, machine.bottom),
    // The stand's post with the needle above the pivot (it swings ±15°), and its foot.
    boxOf(pivot.x - 40, pivot.y - 110, pivot.x + 40, floorY),
    boxOf(pivot.x - 160, floorY, pivot.x + 160, floorY + 26),
  );
  return { hard, soft };
}

/** Where a tag's string is tied, or the place a nailed tag is wanted. */
export interface TagAnchor {
  point: Point;
  nail: boolean;
}

/**
 * What a scene handover's tag is about, in the stage as it is now: the top of the knob's x
 * label, the inner bottom corner of the tray's shelf or the splitter's holder, or above
 * the scale.
 */
export function handoverAnchor(
  id: SceneHandover,
  room: RoomState,
  sceneScale: number,
): TagAnchor | null {
  const labelSize = labelFontSize(sceneScale);
  switch (id) {
    case 'dial': {
      const { dial } = currentStageSpec(room);
      if (dial === 'locked') return null;
      const layout = dialLayout(sceneScale, notchCount(dial));
      const offset = notchOf(dial, room.stage.dialX) * layout.spacing;
      const x = layout.originX - followScroll(layout, 0, offset) + offset;
      return { point: { x, y: layout.trackY + dialLabelTop(layout, sceneScale) }, nail: false };
    }
    // The shelf's and the holder's inner bottom corners, toward the middle of the scene,
    // where there is room for the tag.
    case 'tray': {
      const { box } = trayLayout(sceneScale, labelSize);
      return { point: { x: box.x, y: box.y + box.height }, nail: false };
    }
    case 'splitter': {
      const { box } = splitterLayout(sceneScale, labelSize);
      return { point: { x: box.x + box.width, y: box.y + box.height }, nail: false };
    }
    case 'balance-goal':
      return { point: { ...handoverTagGeometry.aboveScale }, nail: true };
  }
}

interface Card {
  lines: string[];
  width: number;
  height: number;
}

/**
 * The words of `text` in lines of at most `maxChars` characters, as the pin's tag wraps
 * them, except that a dash stays at the end of the line before it, never starting one.
 */
export function wrapTagText(text: string, maxChars: number): string[] {
  const words: string[] = [];
  for (const word of text.split(/\s+/).filter((w) => w.length > 0)) {
    const last = words.length - 1;
    if (word === '–' && last >= 0) words[last] = `${words[last]} ${word}`;
    else words.push(word);
  }
  const lines: string[] = [];
  for (const word of words) {
    const line = lines[lines.length - 1];
    if (line !== undefined && `${line} ${word}`.length <= maxChars) {
      lines[lines.length - 1] = `${line} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

function cardOf(text: string, maxChars: number, fontSize: number): Card {
  const lines = wrapTagText(text, maxChars);
  const { charWidth, lineHeight, padding } = handoverTagGeometry;
  const longest = Math.max(...lines.map((line) => [...line].length));
  return {
    lines,
    width: (2 * padding + longest * charWidth) * fontSize,
    height: (lines.length * lineHeight + 2 * padding) * fontSize,
  };
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

/** How far a point is from a box: 0 inside it. */
function distance(point: Point, box: Box): number {
  const dx = Math.max(box.x - point.x, 0, point.x - (box.x + box.width));
  const dy = Math.max(box.y - point.y, 0, point.y - (box.y + box.height));
  return Math.hypot(dx, dy);
}

/** How far above a nailed card its nail is, in em. */
const nailDrop = 0.6;
/** The longest string, in em: a tag further from what it is about hangs from a nail. */
const maxString = 3;

interface Spot {
  card: Card;
  box: Box;
  score: number;
}

/** How far a card is from the anchor; of two as near, the one centred over it wins. */
function score(anchor: Point, box: Box): number {
  return distance(anchor, box) + 0.1 * Math.abs(box.x + box.width / 2 - anchor.x);
}

/** The hole at the card's edge nearest the tie, inset from the corners. */
function holeFor(box: Box, tie: Point, inset: number): Point {
  const x = Math.max(box.x + inset, Math.min(box.x + box.width - inset, tie.x));
  const y = Math.max(box.y + inset / 2, Math.min(box.y + box.height - inset / 2, tie.y));
  if (tie.y >= box.y + box.height) return { x, y: box.y + box.height - inset / 2 };
  if (tie.y <= box.y) return { x, y: box.y + inset / 2 };
  return { x: tie.x < box.x ? box.x + inset / 2 : box.x + box.width - inset / 2, y };
}

/**
 * Whether a string from `from` to `to` is short enough, at most `longest`, and passes over
 * none of the boxes, checked every `step`.
 */
function stringClear(
  from: Point,
  to: Point,
  obstacles: readonly Box[],
  longest: number,
  step: number,
): boolean {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length > longest) return false;
  // The ends are left out, `step` at each: the tie sits on what the tag is about. The rest
  // is tested exactly, so a string can't clip a box's corner between two samples.
  const end = length > 0 ? Math.min(0.5, step / length) : 0.5;
  return !obstacles.some((box) => segmentCrosses(from, to, box, end, 1 - end));
}

/**
 * Whether the part of the segment from `from` to `to` between `t0` and `t1` (0–1 along it)
 * passes through the box's inside (Liang–Barsky clipping).
 */
function segmentCrosses(from: Point, to: Point, box: Box, t0: number, t1: number): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let enter = t0;
  let exit = t1;
  const edges: [number, number][] = [
    [-dx, from.x - box.x],
    [dx, box.x + box.width - from.x],
    [-dy, from.y - box.y],
    [dy, box.y + box.height - from.y],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q <= 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) enter = Math.max(enter, t);
    else exit = Math.min(exit, t);
    if (enter >= exit) return false;
  }
  return true;
}

/**
 * Every place to try for each card, nearest the anchor first: a grid an em apart, and the
 * places hard up against each obstacle and right by the anchor, inside the scene's margin.
 * A nailed tag leaves room for its nail above it.
 */
function candidates(
  cards: readonly Card[],
  obstacles: readonly Box[],
  anchor: TagAnchor,
  gap: number,
  fontSize: number,
): Spot[] {
  const { margin } = handoverTagGeometry;
  const step = fontSize;
  const top = margin + (anchor.nail ? fontSize * nailDrop : 0);
  const spots: Spot[] = [];
  for (const card of cards) {
    const maxX = sceneSize.width - margin - card.width;
    const maxY = sceneSize.height - margin - card.height;
    const xs = [margin, maxX, anchor.point.x - card.width / 2];
    const ys = [top, maxY, anchor.point.y + gap, anchor.point.y - gap - card.height];
    for (let x = margin; x <= maxX; x += step) xs.push(x);
    for (let y = top; y <= maxY; y += step) ys.push(y);
    for (const o of obstacles) {
      xs.push(o.x - gap - card.width, o.x + o.width + gap);
      ys.push(o.y - gap - card.height, o.y + o.height + gap);
    }
    const uniqueY = new Set(ys.filter((y) => y >= top && y <= maxY));
    const uniqueX = new Set(xs.filter((x) => x >= margin && x <= maxX));
    for (const y of uniqueY) {
      for (const x of uniqueX) {
        const box = { x, y, width: card.width, height: card.height };
        spots.push({ card, box, score: score(anchor.point, box) });
      }
    }
  }
  return spots.sort((a, b) => a.score - b.score);
}

/**
 * The places nearest the anchor that keep clear of `obstacles`, from `spots` (nearest
 * first): the nearest whose string to the anchor is short and passes over none of
 * `strings`, and the nearest of all, for a nail, which needs no string. Either is null
 * where there is none.
 */
function nearestSpots(
  spots: readonly Spot[],
  obstacles: readonly Box[],
  strings: readonly Box[],
  anchor: TagAnchor,
  gap: number,
  fontSize: number,
): { strung: Spot | null; any: Spot | null } {
  const inset = handoverTagGeometry.padding * fontSize;
  const longest = maxString * fontSize;
  // Past this score no card is near enough for a string (the score adds at most a tenth
  // of the scene's width to the distance).
  const beyond = longest + 0.1 * sceneSize.width;
  let strung: Spot | null = null;
  let any: Spot | null = null;
  for (const spot of spots) {
    if (any && (strung || anchor.nail || spot.score > beyond)) break;
    if (!clearOf(spot.box, obstacles, gap)) continue;
    any ??= spot;
    if (strung || anchor.nail) continue;
    const hole = holeFor(spot.box, anchor.point, inset);
    if (stringClear(hole, anchor.point, strings, longest, fontSize / 4)) strung = spot;
  }
  return { strung, any };
}

function placed(
  card: Card,
  box: Box,
  fontSize: number,
  anchor: TagAnchor,
  nail: boolean,
  covers: boolean,
) {
  const { padding, lineHeight } = handoverTagGeometry;
  const inset = padding * fontSize;
  const hole = nail
    ? { x: box.x + box.width / 2, y: box.y + inset / 2 }
    : holeFor(box, anchor.point, inset);
  const tie = nail ? { x: hole.x, y: box.y - fontSize * nailDrop } : anchor.point;
  return {
    lines: card.lines,
    fontSize,
    lineHeight: lineHeight * fontSize,
    box,
    text: { x: box.x + inset, y: box.y + inset },
    hole,
    tie,
    nail,
    coversMachine: covers,
  } satisfies HandoverTagLayout;
}

/**
 * The tag for `text` at the scene's scale, the place nearest the anchor, tried in turn:
 * clear of everything with a short string clear of the hard obstacles; clear of the hard ones
 * (covering the machine, the stand or the other tool) with its string clear of them too;
 * then hung from a nail with no string, clear of everything, then of the hard ones; and
 * last (never for rooms 1–4; the layout tests check) right above the anchor at its widest,
 * covering something. A tag about no one thing (`anchor.nail`) always hangs from a nail.
 */
export function handoverTagLayout(
  text: string,
  sceneScale: number,
  anchor: TagAnchor,
  obstacles: TagObstacles,
): HandoverTagLayout {
  const fontSize = tagFontSize(sceneScale);
  const gap = handoverTagGeometry.gapPx / sceneScale;
  const cards = handoverTagGeometry.wraps
    .map((wrap) => cardOf(text, wrap, fontSize))
    .filter((card) => card.lines.length <= handoverTagGeometry.maxLines);
  assert(cards.length > 0, 'the handover needs a card');
  const all = [...obstacles.hard, ...obstacles.soft];
  const spots = candidates(cards, all, anchor, gap, fontSize);
  const found = [all, obstacles.hard].map((boxes) =>
    nearestSpots(spots, boxes, obstacles.hard, anchor, gap, fontSize),
  );
  for (const [tier, spots] of found.entries()) {
    const spot = spots.strung;
    if (spot) return placed(spot.card, spot.box, fontSize, anchor, false, tier > 0);
  }
  for (const [tier, spots] of found.entries()) {
    const spot = spots.any;
    if (spot) return placed(spot.card, spot.box, fontSize, anchor, true, tier > 0);
  }
  const [widest] = cards as [Card];
  const box = {
    x: Math.max(handoverTagGeometry.margin, anchor.point.x - widest.width / 2),
    y: Math.max(handoverTagGeometry.margin, anchor.point.y - gap - widest.height),
    width: widest.width,
    height: widest.height,
  };
  return placed(widest, box, fontSize, anchor, anchor.nail, true);
}
