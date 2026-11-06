// What the scale shows for the stage in play: the pieces on each pan with their labels,
// both sides' values and the tilt. The scene draws this and decides nothing itself.
//
// Which x the pans show (architecture, Pattern 1):
//   exploring (dial, tray, splitter)   the dial's x, shown on the gears too, with both
//                                      sides' values on readouts unless the stage hides them
//   acting out a written line          the stage's solution, `?` on the gears, no readouts
// A committed line acted out is level. A wrong line is acted out while the machine is
// jammed on it, and tips by at least `tuning.jamMinTilt`. Acting out never moves the dial.
// When a wrong x pin resolves, the pans briefly show its own x (`pinRevealView`): the
// scene decides how long, and nothing here changes.

import { tuning } from '@/config/tuning';
import { stageSolution } from '@/math/check';
import { type Equation, equationHasX } from '@/math/expr';
import { formatNumber } from '@/math/format';
import * as q from '@/math/rational';
import { jammedLine } from '@/room/notebook';
import {
  countLabel,
  divisorLabel,
  isNumberPiece,
  numberLabel,
  numberPieceLabel,
  type Piece,
  panPieces,
} from '@/room/pieces';
import { pinRevealX } from '@/room/pin';
import { currentStageSpec, machineEquation } from '@/room/room';
import { isLevel, jamTilt, sideValues, tiltFor } from '@/room/tilt';
import type { RoomState, StageSpec } from '@/room/types';

/** What a small gear shows while a line is acted out, so a written line can't reveal x. */
export const hiddenXLabel = '?';

export type PieceView = Piece & {
  /**
   * The number on the piece: a weight's value, a float's with the school minus (`−6`), or
   * the x a small gear stands for.
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
  /** The x the pans are weighed at. */
  x: number;
  /** A written line is acted out: at the stage's solution, with `?` on the gears. */
  actingOut: boolean;
  left: PanView;
  right: PanView;
  /** Degrees, positive when the left pan is lower (see tiltFor). */
  tilt: number;
  /** The pans hang level: the sides are equal, and the machine isn't jammed on a line. */
  level: boolean;
  /** Null when the stage hides them (`readouts: false`, or the readouts blind), or while acting out. */
  readouts: Readouts | null;
}

function pieceView(piece: Piece, xLabel: string): PieceView {
  if (isNumberPiece(piece)) return { ...piece, label: numberPieceLabel(piece), divisorLabel: null };
  return {
    ...piece,
    label: piece.count === 1n ? xLabel : countLabel(piece.count),
    divisorLabel: piece.divisor === null ? null : divisorLabel(piece.divisor),
  };
}

/**
 * A side's value on its readout. At the dial's x it is a whole number, and content tests
 * keep it 0 or more at every notch (rooms.test.ts); anything else shows as a weight would.
 */
export function readoutLabel(value: q.Rational): string {
  return value.d === 1n ? formatNumber(value.n) : numberLabel(value);
}

/** FR4: both sides' values show while he explores, except where the stage hides them. */
export function showsReadouts(stage: StageSpec): boolean {
  return stage.readouts && !stage.blinds?.readouts;
}

/** The solution of the stage's active machine. */
export function stageX(room: RoomState): number {
  return stageSolution(machineEquation(currentStageSpec(room), room.stage.machine));
}

/** What is on the pans and at which x, before it is drawn (Pattern 1's table). */
interface Weighing {
  equation: Equation;
  x: number;
  actingOut: boolean;
  jammed: boolean;
}

function weighing(room: RoomState): Weighing {
  const { stage } = room;
  const jammed = jammedLine(stage);
  if (jammed) return { equation: jammed, x: stageX(room), actingOut: true, jammed: true };
  if (stage.actingOut)
    return { equation: stage.pans, x: stageX(room), actingOut: true, jammed: false };
  return { equation: stage.pans, x: stage.dialX, actingOut: false, jammed: false };
}

function viewOf(room: RoomState, { equation, x, actingOut, jammed }: Weighing): ScaleView {
  const spec = currentStageSpec(room);
  const values = sideValues(equation, q.rational(x));
  const pieces = panPieces(equation);
  const xLabel = actingOut ? hiddenXLabel : formatNumber(x);
  const tiltPerUnit = spec.tiltPerUnit ?? tuning.tiltPerUnit;
  return {
    x,
    actingOut,
    left: { pieces: pieces.left.map((p) => pieceView(p, xLabel)), value: values.left },
    right: { pieces: pieces.right.map((p) => pieceView(p, xLabel)), value: values.right },
    tilt: jammed ? jamTilt(values, tiltPerUnit) : tiltFor(values, tiltPerUnit),
    // A jammed line always tips, even one that holds for every x.
    level: !jammed && isLevel(values),
    readouts:
      !actingOut && showsReadouts(spec)
        ? { left: readoutLabel(values.left), right: readoutLabel(values.right) }
        : null,
  };
}

export function scaleView(room: RoomState): ScaleView {
  return viewOf(room, weighing(room));
}

/**
 * The pans at a wrong x pin's own x, once it has resolved (Pattern 2, Resolution: "a wrong
 * pin briefly shows its own value's tilt on the pans"): the pans as he explores them, with
 * his x on the gears and the readouts, so he sees what his idea causes. When the stage
 * locked it, the pans hold the check line, which has no x, so the stage's equation is
 * weighed instead. Null for a right pin, a choice pin, or one that hasn't resolved. The
 * scene shows it briefly; it costs nothing.
 */
export function pinRevealView(room: RoomState): ScaleView | null {
  const x = pinRevealX(room);
  if (x === null) return null;
  const { pans, machine } = room.stage;
  const equation = equationHasX(pans) ? pans : machineEquation(currentStageSpec(room), machine);
  return viewOf(room, { equation, x, actingOut: false, jammed: false });
}
