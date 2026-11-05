import { describe, expect, it } from 'vitest';
import { parse } from '@/math/parse';
import * as q from '@/math/rational';
import { isNumberPiece, panPieces } from '@/room/pieces';
import type { PieceView } from '@/room/scale';
import {
  type PlacedPiece,
  pieceIdentity,
  pieceTweenMs,
  placementAt,
  planMoves,
  planTween,
} from '@/ui/scene/scale/piece-tween';

function placed(key: string, identity: string, x: number, y = 0, alpha = 1): PlacedPiece {
  return { key, identity, at: { x, y, alpha } };
}

/** The left pan's pieces of an equation, as the scale labels them. */
function leftPieces(text: string, label = '?'): PieceView[] {
  const parsed = parse(text);
  if (!parsed.ok) throw new Error(text);
  return panPieces(parsed.equation).left.map((piece): PieceView => {
    if (isNumberPiece(piece)) return { ...piece, label: q.toText(piece.value), divisorLabel: null };
    const divisorLabel = piece.divisor === null ? null : String(piece.divisor);
    return { ...piece, label, divisorLabel };
  });
}

describe('pieceIdentity', () => {
  it('is the kind and the number, never the label a gear shows', () => {
    const [atDial] = leftPieces('x + 4 = 9', '3');
    const [actingOut] = leftPieces('x + 4 = 9', '?');
    if (!atDial || !actingOut) throw new Error('no gear');
    expect(pieceIdentity(atDial)).toBe(pieceIdentity(actingOut));
    const [, four] = leftPieces('x + 4 = 9');
    const [, seven] = leftPieces('x + 7 = 9');
    if (!four || !seven) throw new Error('no weight');
    expect(pieceIdentity(four)).not.toBe(pieceIdentity(seven));
  });

  it('tells weights from floats, gears from springs, and dividers apart', () => {
    const ids = [
      ...leftPieces('x + 4 = 9'),
      ...leftPieces('20 − 4 = x'),
      ...leftPieces('20 − x = 6'),
      ...leftPieces('x : 3 = 5'),
      ...leftPieces('27x = 5 400'),
    ].map(pieceIdentity);
    expect(ids).toEqual([
      'gear:1:1',
      'weight:4/1',
      'weight:20/1',
      'float:4/1',
      'weight:20/1',
      'spring:1:1',
      'gear:1:3',
      'gear:27:1',
    ]);
  });
});

describe('planTween', () => {
  it('moves pieces matched by kind and number, from where they were to where they go', () => {
    const plan = planTween(
      [placed('left-gear-0', 'gear:1:1', -50), placed('left-weight-0', 'weight:4/1', 50)],
      [placed('left-gear-0', 'gear:1:1', 0)],
    );
    expect(plan.pieces).toEqual([
      { key: 'left-gear-0', from: { x: -50, y: 0, alpha: 1 }, to: { x: 0, y: 0, alpha: 1 } },
    ]);
    expect(plan.exits).toEqual([
      { key: 'left-weight-0', from: { x: 50, y: 0, alpha: 1 }, to: { x: 50, y: 0, alpha: 0 } },
    ]);
  });

  it('fades in a piece with no match where it goes', () => {
    const plan = planTween([], [placed('right-weight-0', 'weight:5/1', 30, -10)]);
    expect(plan.pieces).toEqual([
      { key: 'right-weight-0', from: { x: 30, y: -10, alpha: 0 }, to: { x: 30, y: -10, alpha: 1 } },
    ]);
    expect(plan.exits).toEqual([]);
  });

  it('matches by identity, not by key: weight 0 becoming 18 fades, weight 1 of 4 moves', () => {
    // 2x + 7 + 4 = 25 → 2x + 4 = 18 on one pan: the 7 goes, the 4 moves into its place.
    const plan = planTween(
      [placed('left-weight-0', 'weight:7/1', 10), placed('left-weight-1', 'weight:4/1', 60)],
      [placed('left-weight-0', 'weight:4/1', 10)],
    );
    expect(plan.pieces).toEqual([
      { key: 'left-weight-0', from: { x: 60, y: 0, alpha: 1 }, to: { x: 10, y: 0, alpha: 1 } },
    ]);
    expect(plan.exits.map((exit) => exit.key)).toEqual(['left-weight-0']);
  });

  it('pairs several pieces of the same identity in order', () => {
    const plan = planTween(
      [placed('a', 'gear:1:1', 0), placed('b', 'gear:1:1', 10)],
      [placed('c', 'gear:1:1', 100), placed('d', 'gear:1:1', 110), placed('e', 'gear:1:1', 120)],
    );
    expect(plan.pieces.map((motion) => [motion.key, motion.from.x, motion.from.alpha])).toEqual([
      ['c', 0, 1],
      ['d', 10, 1],
      ['e', 120, 0],
    ]);
  });

  it('starts from where a piece is drawn mid-tween, so an interrupted change carries on', () => {
    const plan = planTween(
      [placed('k', 'weight:4/1', 25, -5, 0.5)],
      [placed('k', 'weight:4/1', 0)],
    );
    expect(plan.pieces[0]?.from).toEqual({ x: 25, y: -5, alpha: 0.5 });
  });
});

describe('planMoves and placementAt', () => {
  it('knows when nothing changes on screen', () => {
    const same = [placed('k', 'weight:4/1', 0)];
    expect(planMoves(planTween(same, same))).toBe(false);
    expect(planMoves(planTween(same, [placed('k', 'weight:4/1', 1)]))).toBe(true);
    expect(planMoves(planTween(same, []))).toBe(true);
    expect(planMoves(planTween([], same))).toBe(true);
  });

  it('runs from the start at 0 to the end at 1', () => {
    const motion = { key: 'k', from: { x: 0, y: 10, alpha: 0 }, to: { x: 100, y: -10, alpha: 1 } };
    expect(placementAt(motion, 0)).toEqual(motion.from);
    expect(placementAt(motion, 0.5)).toEqual({ x: 50, y: 0, alpha: 0.5 });
    expect(placementAt(motion, 1)).toEqual(motion.to);
  });

  it('takes under half a second', () => {
    expect(pieceTweenMs).toBeGreaterThan(0);
    expect(pieceTweenMs).toBeLessThanOrEqual(500);
  });
});
