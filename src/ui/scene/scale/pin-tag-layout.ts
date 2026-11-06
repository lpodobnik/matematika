// Where the pin's question tag hangs in the 1600 × 1000 logical scene (story 1.14; GDD,
// Prediction: a tag on the pin's holder asks the question). Presentation only: the
// question comes from hr.ts, and when the tag shows from room/pin.ts (`PinView.asks`).
//
// The tag is a paper card with its text at least 20 CSS px on any screen, so on a phone it
// takes a large part of the scene. It must never cover the pans (at every x the dial can
// reach while the pin is offered), the dial, the pin's places or holder, the stand and its
// needle, the machine, or the reset control. Two spots are tried, each with the question
// wrapped wide first, then narrower:
//
//   on the holder   right above the holder, just over the dial's band, with a short string
//                   from its bottom edge down to the holder's cradle
//   on the wall     high on the scene's left, right of or below the reset control, hung
//                   from a nail, when the pans leave no room above the holder: on a phone,
//                   and in room 3's second stage, where x is a spring and its pan hangs low
//
// Text width is estimated from the number of characters, generously (system-ui runs about
// 0.39–0.48 em a character for these questions), so the card is never too small.

import { assert } from '@/lib/assert';
import { dialTurnsIn } from '@/room/dial';
import { openingPhase } from '@/room/phases';
import { arriveAtStage, fullDial, openingDial } from '@/room/room';
import { scaleViewAt } from '@/room/scale';
import type { RoomSpec, RoomState, StageSpec } from '@/room/types';
import { sceneSize } from '@/ui/scene/fit-scene';
import { machineBounds } from '@/ui/scene/machine/layout';
import { type Box, dialGeometry } from '@/ui/scene/scale/dial-layout';
import {
  beamPose,
  layoutPan,
  type Point,
  readoutBox,
  scaleGeometry,
} from '@/ui/scene/scale/layout';
import { type PinLayout, placeX } from '@/ui/scene/scale/pin-layout';

export const pinTagGeometry = {
  /** NFR4 and the story: the question is at least this big on every supported screen. */
  minTextCssPx: 20,
  /** An estimate of a character's width, in em, on the generous side. */
  charWidth: 0.5,
  lineHeight: 1.25,
  /** Inside the card, in em; the hole for its string sits in it. */
  padding: 0.4,
  /** Kept clear between the card and anything it must not cover, in CSS px. */
  gapPx: 4,
  /** The reset control's corner of the scene area, with a gap: 8 CSS px in, 56 wide. */
  resetCornerPx: 72,
  /** From the scene's edges, in scene units. */
  margin: 20,
  /** Characters a line, tried widest first: a wide card is short and fits under the pans. */
  wraps: [26, 22, 18, 15, 13, 11],
  /** A card of more lines than this is not tried. */
  maxLines: 5,
  /** How far below the pans' dishes their surfaces' trays reach (the pan skin draws 18). */
  dishDepth: 22,
} as const;

export interface PinTagLayout {
  lines: string[];
  /** In scene units: at least 20 CSS px. */
  fontSize: number;
  lineHeight: number;
  /** The card. */
  box: Box;
  /** The top-left of the first line. */
  text: Point;
  /** The hole its string runs through: in its bottom edge on the holder, its top on the wall. */
  hole: Point;
  /** Where the string is tied: the holder's cradle, or a nail on the wall. */
  tie: Point;
  /** Which spot it hangs in. */
  spot: 'holder' | 'wall';
}

/** The tag's text size, in scene units, for the scene's scale (CSS px per scene unit). */
export function tagFontSize(sceneScale: number): number {
  assert(sceneScale > 0 && Number.isFinite(sceneScale), 'the tag needs the scene laid out');
  return Math.ceil(pinTagGeometry.minTextCssPx / sceneScale);
}

/** The words of `text` in lines of at most `maxChars` characters; a longer word has its own. */
export function wrapWords(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter((w) => w.length > 0)) {
    const joined = line === '' ? word : `${line} ${word}`;
    if (line !== '' && joined.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = joined;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

/** The x values the dial can show while the pin is offered: the poke window, or its start. */
function offeredXs(stage: StageSpec): number[] {
  const { dial } = stage;
  const start = fullDial(stage).min;
  if (dial === 'locked' || !dialTurnsIn(stage, openingPhase(stage))) return [start];
  const open = openingDial(stage);
  const xs: number[] = [];
  for (let x = open.min; x <= open.max; x += dial.step) xs.push(x);
  return xs;
}

function boxOf(x0: number, y0: number, x1: number, y1: number): Box {
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/**
 * The HTML reset control's corner of the scene area (ui/common/common.css), in scene units,
 * for the scene's scale and where its top-left corner sits in the area, in CSS px
 * (`fitScene`): on a phone the scene fills the area's height and the control covers its
 * corner; on the tablet the scene is letterboxed below it.
 */
export function resetCorner(sceneScale: number, origin: Point): Box {
  const corner = pinTagGeometry.resetCornerPx;
  return {
    x: -origin.x / sceneScale,
    y: -origin.y / sceneScale,
    width: corner / sceneScale,
    height: corner / sceneScale,
  };
}

/**
 * What the tag must keep clear of, for a stage as it waits for its pin: both pans with their
 * pieces and readouts at every x the dial reaches before the pin is confirmed; the pin's
 * places, its holder and the dial's band; the stand, its needle and the machine; and the
 * reset control's corner (`resetCorner`). `labelSize` is the pieces' label size.
 */
export function tagObstacles(
  spec: RoomSpec,
  stageIndex: number,
  pin: PinLayout,
  slots: number,
  labelSize: number,
  reset: Box,
): Box[] {
  const stage = spec.stages[stageIndex];
  assert(stage, `room ${spec.id} has no stage ${stageIndex}`);
  const room: RoomState = { spec, stageIndex, stage: arriveAtStage(stage) };
  const boxes: Box[] = [];
  for (const x of offeredXs(stage)) {
    const view = scaleViewAt(room, x);
    const pose = beamPose(view.tilt);
    for (const side of ['left', 'right'] as const) {
      const centre = pose[side];
      const pieces = layoutPan(view[side].pieces, labelSize);
      const half = scaleGeometry.panWidth / 2;
      const top = Math.min(0, ...pieces.map((b) => b.y - b.height));
      const left = Math.min(-half, ...pieces.map((b) => b.x - b.width / 2));
      const right = Math.max(half, ...pieces.map((b) => b.x + b.width / 2));
      boxes.push(
        boxOf(
          centre.x + left,
          centre.y + top,
          centre.x + right,
          centre.y + pinTagGeometry.dishDepth,
        ),
      );
      const label = view.readouts?.[side];
      if (label !== undefined) {
        const r = readoutBox(side, label, labelSize);
        boxes.push({
          x: centre.x + r.x - r.width / 2,
          y: centre.y + r.y - r.height / 2,
          width: r.width,
          height: r.height,
        });
      }
    }
  }
  const hit = pin.hitArea;
  for (let slot = -1; slot < slots; slot += 1) {
    // Place −1 is the holder, with its cradle a little wider than the head.
    const x = placeX(pin, slot < 0 ? null : slot);
    boxes.push({ x: x + hit.x, y: hit.y, width: hit.width, height: hit.height });
    const cradle = pin.headRadius * 1.2;
    boxes.push(boxOf(x - cradle, pin.headY - cradle, x + cradle, pin.tipY));
  }
  const { pivot, floorY } = scaleGeometry;
  boxes.push(boxOf(0, dialGeometry.top, sceneSize.width, sceneSize.height));
  // The stand's post with the needle above the pivot (it swings ±15°), and its foot.
  boxes.push(boxOf(pivot.x - 40, pivot.y - 110, pivot.x + 40, floorY));
  boxes.push(boxOf(pivot.x - 160, floorY, pivot.x + 160, floorY + 26));
  const machine = machineBounds();
  boxes.push(boxOf(machine.left, machine.top, machine.right, machine.bottom));
  boxes.push(reset);
  return boxes;
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

function inScene(box: Box): boolean {
  const { margin } = pinTagGeometry;
  return (
    box.x >= margin &&
    box.y >= margin &&
    box.x + box.width <= sceneSize.width - margin &&
    box.y + box.height <= sceneSize.height - margin
  );
}

interface Card {
  lines: string[];
  width: number;
  height: number;
}

function cardOf(text: string, maxChars: number, fontSize: number): Card {
  const lines = wrapWords(text, maxChars);
  const { charWidth, lineHeight, padding } = pinTagGeometry;
  const longest = Math.max(...lines.map((line) => [...line].length));
  return {
    lines,
    width: (2 * padding + longest * charWidth) * fontSize,
    height: (lines.length * lineHeight + 2 * padding) * fontSize,
  };
}

function placed(
  card: Card,
  fontSize: number,
  box: Box,
  hole: Point,
  tie: Point,
  spot: PinTagLayout['spot'],
): PinTagLayout {
  const { padding, lineHeight } = pinTagGeometry;
  return {
    lines: card.lines,
    fontSize,
    lineHeight: lineHeight * fontSize,
    box,
    text: { x: box.x + padding * fontSize, y: box.y + padding * fontSize },
    hole,
    tie,
    spot,
  };
}

/** The holder's cradle tip, right of the pin's head in it, where the string is tied. */
function holderTie(pin: PinLayout): Point {
  const r = pin.headRadius * 1.2;
  return {
    x: pin.holderX + r * Math.cos(Math.PI * 0.15),
    y: pin.headY + r * Math.sin(Math.PI * 0.15),
  };
}

/**
 * The card on the holder: right above it, its string straight down from the bottom edge to
 * the cradle, as low as it fits and as near centred over the holder; or null.
 */
function onHolder(
  card: Card,
  fontSize: number,
  pin: PinLayout,
  obstacles: readonly Box[],
  gap: number,
): PinTagLayout | null {
  const tie = holderTie(pin);
  const step = fontSize / 4;
  const inset = pinTagGeometry.padding * fontSize;
  const off = (b: Box) => Math.abs(b.x + b.width / 2 - tie.x);
  for (let lift = 0; lift <= 8; lift += 1) {
    const y = pin.hitArea.y - gap - card.height - lift * step;
    let best: Box | null = null;
    for (let x = tie.x - card.width + inset; x <= tie.x - inset; x += step) {
      const box = { x, y, width: card.width, height: card.height };
      if (!inScene(box) || !clearOf(box, obstacles, gap)) continue;
      if (!best || off(box) < off(best)) best = box;
    }
    if (best) {
      const hole = { x: tie.x, y: best.y + best.height - inset / 2 };
      return placed(card, fontSize, best, hole, tie, 'holder');
    }
  }
  return null;
}

/**
 * The card on the wall, from a nail above its top edge: the clear place highest, then
 * furthest left; or null.
 */
function onWall(
  card: Card,
  fontSize: number,
  obstacles: readonly Box[],
  gap: number,
): PinTagLayout | null {
  const step = fontSize / 4;
  const nailDrop = fontSize * 0.6;
  const inset = pinTagGeometry.padding * fontSize;
  for (let y = pinTagGeometry.margin + nailDrop; y + card.height <= dialGeometry.top; y += step) {
    for (let x = pinTagGeometry.margin; x + card.width <= sceneSize.width / 2; x += step) {
      const box = { x, y, width: card.width, height: card.height };
      if (inScene(box) && clearOf(box, obstacles, gap)) {
        const hole = { x: x + card.width / 2, y: y + inset / 2 };
        return placed(card, fontSize, box, hole, { x: hole.x, y: y - nailDrop }, 'wall');
      }
    }
  }
  return null;
}

/**
 * The tag for the question at the scene's scale, given the pin's layout and what it must
 * keep clear of (`tagObstacles`): on the holder if it fits there at any width, else on the
 * wall, else (never for rooms 1–4; layout tests check) on the holder at its widest,
 * covering something.
 */
export function pinTagLayout(
  question: string,
  sceneScale: number,
  pin: PinLayout,
  obstacles: readonly Box[],
): PinTagLayout {
  const fontSize = tagFontSize(sceneScale);
  const gap = pinTagGeometry.gapPx / sceneScale;
  const cards = pinTagGeometry.wraps
    .map((wrap) => cardOf(question, wrap, fontSize))
    .filter((card) => card.lines.length <= pinTagGeometry.maxLines);
  assert(cards.length > 0, 'the question needs a card');
  for (const card of cards) {
    const layout = onHolder(card, fontSize, pin, obstacles, gap);
    if (layout) return layout;
  }
  for (const card of cards) {
    const layout = onWall(card, fontSize, obstacles, gap);
    if (layout) return layout;
  }
  const [widest] = cards as [Card];
  const tie = holderTie(pin);
  const box = {
    x: Math.max(pinTagGeometry.margin, tie.x - widest.width / 2),
    y: pin.hitArea.y - gap - widest.height,
    width: widest.width,
    height: widest.height,
  };
  return placed(widest, fontSize, box, { x: tie.x, y: box.y + box.height }, tie, 'holder');
}
