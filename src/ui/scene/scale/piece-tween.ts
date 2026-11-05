// One generic tween for the pieces on a pan (architecture Pattern 1, Which x the pans
// show): when the pans take a new layout, pieces matched by kind and number move from
// where they were to where they go, and the rest fade out or in. Nothing here is per move
// kind; `Move` feeds the play log and later flourishes. Presentation only: what is on the
// pans comes from room/scale.ts.
//
// Pieces are matched on their own pan. A piece that changes pans fades out on one and in
// on the other: the pans ride on separate posts as the beam tips.

import { isNumberPiece } from '@/room/pieces';
import type { PieceView } from '@/room/scale';

/** How long the pans take to change layout. */
export const pieceTweenMs = 450;

export interface Placement {
  x: number;
  y: number;
  alpha: number;
}

/** A piece where it is drawn: its React key, what it is, and where. */
export interface PlacedPiece {
  key: string;
  /** Kind and number: pieces with the same identity are the same piece moved. */
  identity: string;
  at: Placement;
}

export interface PieceMotion {
  key: string;
  from: Placement;
  to: Placement;
}

export interface TweenPlan {
  /** Every piece of the new layout, moving from its match or fading in where it goes. */
  pieces: PieceMotion[];
  /** Pieces of the old layout with no match, fading out where they were. */
  exits: PieceMotion[];
}

/**
 * What a piece is, for matching: its kind and number. A gear or spring is the x it counts
 * and its divider, not its label, which changes with the dial and shows `?` acting out.
 */
export function pieceIdentity(piece: PieceView): string {
  if (isNumberPiece(piece)) return `${piece.kind}:${piece.value.n}/${piece.value.d}`;
  return `${piece.kind}:${piece.count}:${piece.divisor ?? 1n}`;
}

function shown(at: Placement): Placement {
  return { ...at, alpha: 1 };
}

/**
 * Plans the change from `before` (where pieces are drawn now) to `after` (the new layout,
 * at full alpha). Pieces of the same identity pair up in order; a piece left over in
 * `after` fades in, and one left over in `before` fades out.
 */
export function planTween(
  before: readonly PlacedPiece[],
  after: readonly PlacedPiece[],
): TweenPlan {
  const waiting = new Map<string, PlacedPiece[]>();
  for (const piece of before) {
    const list = waiting.get(piece.identity) ?? [];
    list.push(piece);
    waiting.set(piece.identity, list);
  }
  const pieces = after.map((piece): PieceMotion => {
    const match = waiting.get(piece.identity)?.shift();
    const to = shown(piece.at);
    return { key: piece.key, from: match ? match.at : { ...to, alpha: 0 }, to };
  });
  const exits = [...waiting.values()]
    .flat()
    .map(
      (piece): PieceMotion => ({ key: piece.key, from: piece.at, to: { ...piece.at, alpha: 0 } }),
    );
  return { pieces, exits };
}

/** Whether the plan changes anything on screen. */
export function planMoves(plan: TweenPlan): boolean {
  if (plan.exits.length > 0) return true;
  return plan.pieces.some(
    ({ from, to }) => from.x !== to.x || from.y !== to.y || from.alpha !== to.alpha,
  );
}

/** Where a piece is at `t`, from 0 (start) to 1 (end); `t` comes eased from Motion. */
export function placementAt(motion: PieceMotion, t: number): Placement {
  const { from, to } = motion;
  const mix = (a: number, b: number) => a + (b - a) * t;
  return { x: mix(from.x, to.x), y: mix(from.y, to.y), alpha: mix(from.alpha, to.alpha) };
}
