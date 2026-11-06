// What the scale shows for the stage in play: the pieces on each pan with their labels,
// both sides' values and the tilt. The scene draws this and decides nothing itself.
//
// Which x the pans show (architecture, Pattern 1; story 1.16): always the slider's, the
// only x. While he explores, after a written line and after a Balance move alike, the pans
// are weighed at the dial's x, with both sides' values on readouts unless the stage hides
// them. Balance moves act on both sides at once, so at a wrong dial value the scale stays
// out of balance through every move: room 4 at 6 weighs 17 against 23, then 12 against 18,
// then 6 against 9. Story 1.15 weighed the pans at the stage's solution after a line or a
// Balance move (acting out) and the slider read `x = ?`; that gave two x's at once, and is
// gone. The pieces always take the last committed line's layout, or where Balance left it.
// Every x-gear shows the letter `x` (a large one `27x`), and every x-balloon (spring) `−x`,
// never the dial's number: the dial's value shows on the slider. A wrong line shows while
// the machine is jammed on it, at the dial's x, and tips by at least `tuning.jamMinTilt`.
// When an x pin beyond the dial resolves (no room 1–4 has one), the pans briefly weigh its
// x (`pinRevealView`): the scene decides how long, and nothing here changes.

import { tuning } from '@/config/tuning';
import { stageSolution } from '@/math/check';
import { type Equation, type Expr, equationHasX, xVar } from '@/math/expr';
import { formatExpr, formatNumber } from '@/math/format';
import * as q from '@/math/rational';
import { shownPans } from '@/room/logbook';
import { jammedLine } from '@/room/notebook';
import {
  countLabel,
  divisorLabel,
  isNumberPiece,
  numberLabel,
  numberPieceLabel,
  type Piece,
  panPieces,
  sidePieces,
} from '@/room/pieces';
import { pinRevealX } from '@/room/pin';
import { currentStageSpec, machineEquation } from '@/room/room';
import { isLevel, jamTilt, sideValues, tiltFor } from '@/room/tilt';
import type { RoomState, Side, StageSpec } from '@/room/types';

export type PieceView = Piece & {
  /**
   * The number on the piece: a weight's value, a float's with the school minus (`−6`); on
   * a gear the letter `x` (a large one `27x`), and on a spring the same with the minus
   * (`−x`, `−27x`). Never the dial's number (story 1.15).
   */
  label: string;
  /** The tag on a divided gear's or spring's slice, `: 3`, or null for none. */
  divisorLabel: string | null;
};

export interface PanView {
  pieces: PieceView[];
  value: q.Rational;
}

/** Both sides' values as text, for the readouts beside the pans. */
export interface Readouts {
  left: string;
  right: string;
}

export interface ScaleView {
  /** The x the pans are weighed at: the dial's (story 1.16), or the machine's pin test's. */
  x: number;
  left: PanView;
  right: PanView;
  /** Degrees, positive when the left pan is lower (see tiltFor). */
  tilt: number;
  /** The pans hang level: the sides are equal, and the machine isn't jammed on a line. */
  level: boolean;
  /** Null only when the stage hides them (`readouts: false`, or the readouts blind). */
  readouts: Readouts | null;
}

/** The school minus, as format.ts writes it before a negative number. */
const minus = formatNumber(-1).replace(formatNumber(1), '');

/** What an x piece shows: `x` or `27x` on a gear, `−x` or `−27x` on a spring. */
export function xLabel(kind: 'gear' | 'spring', count: bigint): string {
  const xs = count === 1n ? formatExpr(xVar()) : countLabel(count);
  return kind === 'spring' ? `${minus}${xs}` : xs;
}

function pieceView(piece: Piece): PieceView {
  if (isNumberPiece(piece)) return { ...piece, label: numberPieceLabel(piece), divisorLabel: null };
  return {
    ...piece,
    label: xLabel(piece.kind, piece.count),
    divisorLabel: piece.divisor === null ? null : divisorLabel(piece.divisor),
  };
}

/** One side's pieces as the scale draws them, with their labels (the splitter's groups use it). */
export function sideViews(expr: Expr, side: Side): PieceView[] {
  return sidePieces(expr, side).map(pieceView);
}

/**
 * A side's value on its readout. At the dial's x it is a whole number, and content tests
 * keep it 0 or more at every notch (rooms.test.ts); anything else shows as a weight would.
 */
export function readoutLabel(value: q.Rational): string {
  return value.d === 1n ? formatNumber(value.n) : numberLabel(value);
}

/** FR4: both sides' values always show (story 1.16), except where the stage hides them. */
export function showsReadouts(stage: StageSpec): boolean {
  return stage.readouts && !stage.blinds?.readouts;
}

/** The solution of the stage's active machine (the handovers read it; the pans never weigh it). */
export function stageX(room: RoomState): number {
  return stageSolution(machineEquation(currentStageSpec(room), room.stage.machine));
}

/** What is on the pans and at which x, before it is drawn (Pattern 1's table). */
interface Weighing {
  equation: Equation;
  x: number;
  jammed: boolean;
}

/** The pans at the dial's x: the last committed line, or the jammed line while jammed. */
function weighing(room: RoomState): Weighing {
  const { stage } = room;
  const jammed = jammedLine(stage);
  return { equation: jammed ?? shownPans(stage), x: stage.dialX, jammed: jammed !== null };
}

function viewOf(room: RoomState, { equation, x, jammed }: Weighing): ScaleView {
  const spec = currentStageSpec(room);
  const values = sideValues(equation, q.rational(x));
  const pieces = panPieces(equation);
  const tiltPerUnit = spec.tiltPerUnit ?? tuning.tiltPerUnit;
  return {
    x,
    left: { pieces: pieces.left.map(pieceView), value: values.left },
    right: { pieces: pieces.right.map(pieceView), value: values.right },
    tilt: jammed ? jamTilt(values, tiltPerUnit) : tiltFor(values, tiltPerUnit),
    // A jammed line always tips, even one that holds for every x.
    level: !jammed && isLevel(values),
    readouts: showsReadouts(spec)
      ? { left: readoutLabel(values.left), right: readoutLabel(values.right) }
      : null,
  };
}

export function scaleView(room: RoomState): ScaleView {
  return viewOf(room, weighing(room));
}

/**
 * The pans with the dial at x instead of where the store has it, as he explores them: the
 * scene shows the machine turning the dial notch by notch to test a pin (story 1.14), while
 * the store already has the dial at the end of the turn.
 */
export function scaleViewAt(room: RoomState, x: number): ScaleView {
  return viewOf(room, { equation: shownPans(room.stage), x, jammed: false });
}

/**
 * The pans at the x of a pin beyond the dial, once it has resolved (Pattern 2, Resolution:
 * the dial can't go there, so the pans weigh its x for a moment): the pans as he explores
 * them, with its x on the gears and the readouts, level for a right pin and tipped for a
 * wrong one. When the stage locked it (a safety only), the pans hold the check line, which
 * has no x, so the stage's equation is weighed instead. Null for a pin the dial reaches, a
 * choice pin, or one that hasn't resolved. The scene shows it briefly; it costs nothing.
 */
export function pinRevealView(room: RoomState): ScaleView | null {
  const x = pinRevealX(room);
  if (x === null) return null;
  const { pans, machine } = room.stage;
  const equation = equationHasX(pans) ? pans : machineEquation(currentStageSpec(room), machine);
  return viewOf(room, { equation, x, jammed: false });
}
