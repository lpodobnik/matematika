// What the scale shows for the stage in play: the pieces on each pan with their labels,
// both sides' values and the tilt. The scene draws this and decides nothing itself.
//
// Which x the pans show (architecture, Pattern 1): while exploring, the dial's x, which the
// gears show too. Acting out a written line (story 1.7) will use the stage's solution and
// show `?` on the gears.

import { tuning } from '@/config/tuning';
import { formatNumber } from '@/math/format';
import * as q from '@/math/rational';
import { countLabel, isNumberPiece, numberLabel, type Piece, panPieces } from '@/room/pieces';
import { currentStageSpec } from '@/room/room';
import { isLevel, sideValues, tiltFor } from '@/room/tilt';
import type { RoomState } from '@/room/types';

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

export interface ScaleView {
  /** The x the pans are weighed at. */
  x: number;
  left: PanView;
  right: PanView;
  /** Degrees, positive when the left pan is lower (see tiltFor). */
  tilt: number;
  level: boolean;
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

export function scaleView(room: RoomState): ScaleView {
  const { pans, dialX } = room.stage;
  const values = sideValues(pans, q.rational(dialX));
  const pieces = panPieces(pans);
  const xLabel = formatNumber(dialX);
  return {
    x: dialX,
    left: { pieces: pieces.left.map((p) => pieceView(p, xLabel)), value: values.left },
    right: { pieces: pieces.right.map((p) => pieceView(p, xLabel)), value: values.right },
    tilt: tiltFor(values, currentStageSpec(room).tiltPerUnit ?? tuning.tiltPerUnit),
    level: isLevel(values),
  };
}
