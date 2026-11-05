// What the scale shows for the stage in play: the pieces on each pan with their labels,
// both sides' values and the tilt. The scene draws this and decides nothing itself.
//
// Which x the pans show (architecture, Pattern 1): while exploring, the dial's x, which the
// gears show too, with both sides' values on readouts unless the stage hides them. Acting
// out a written line (story 1.7) will use the stage's solution, show `?` on the gears and
// hide the readouts.

import { tuning } from '@/config/tuning';
import { formatNumber } from '@/math/format';
import * as q from '@/math/rational';
import { countLabel, isNumberPiece, numberLabel, type Piece, panPieces } from '@/room/pieces';
import { currentStageSpec } from '@/room/room';
import { isLevel, sideValues, tiltFor } from '@/room/tilt';
import type { RoomState, StageSpec } from '@/room/types';

export type PieceView = Piece & {
  /** The number on the piece: a weight's value, or the x a small gear stands for. */
  label: string;
  /** The number on the divider under a gear or spring, or null for none. */
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
  left: PanView;
  right: PanView;
  /** Degrees, positive when the left pan is lower (see tiltFor). */
  tilt: number;
  level: boolean;
  /** Null when the stage hides them (`readouts: false`, or the readouts blind). */
  readouts: Readouts | null;
}

function pieceView(piece: Piece, xLabel: string): PieceView {
  if (isNumberPiece(piece))
    return { ...piece, label: numberLabel(piece.value), divisorLabel: null };
  return {
    ...piece,
    label: piece.count === 1n ? xLabel : countLabel(piece.count),
    divisorLabel: piece.divisor === null ? null : formatNumber(piece.divisor),
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

export function scaleView(room: RoomState): ScaleView {
  const { pans, dialX } = room.stage;
  const spec = currentStageSpec(room);
  const values = sideValues(pans, q.rational(dialX));
  const pieces = panPieces(pans);
  const xLabel = formatNumber(dialX);
  return {
    x: dialX,
    left: { pieces: pieces.left.map((p) => pieceView(p, xLabel)), value: values.left },
    right: { pieces: pieces.right.map((p) => pieceView(p, xLabel)), value: values.right },
    tilt: tiltFor(values, spec.tiltPerUnit ?? tuning.tiltPerUnit),
    level: isLevel(values),
    readouts: showsReadouts(spec)
      ? { left: readoutLabel(values.left), right: readoutLabel(values.right) }
      : null,
  };
}
