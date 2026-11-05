// Runs the pieces' generic tween (piece-tween.ts) on one pan. Positions and alpha go to
// the Pixi containers through refs on every frame, never through React state
// (architecture, Animation); React state changes only when pieces that fade out start and
// stop being drawn. Pieces get their place only from here, so a piece's container never
// shows anywhere but where the tween puts it.

import { animate } from 'motion';
import type { Container } from 'pixi.js';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PieceView } from '@/room/scale';
import type { PieceBox } from '@/ui/scene/scale/layout';
import {
  type PieceMotion,
  type PlacedPiece,
  type Placement,
  pieceIdentity,
  pieceTweenMs,
  placementAt,
  planMoves,
  planTween,
} from '@/ui/scene/scale/piece-tween';

/** A piece of the old layout, still drawn while it fades out. */
export interface Ghost {
  key: string;
  piece: PieceView;
  box: PieceBox;
}

interface Shown {
  identity: string;
  piece: PieceView;
  box: PieceBox;
}

function place(node: Container, at: Placement): void {
  node.position.set(at.x, at.y);
  node.alpha = at.alpha;
}

export interface PieceTween {
  ghosts: readonly Ghost[];
  /** The ref for the container of the piece (or ghost) with this key. Stable per key. */
  refFor(key: string): (node: Container | null) => void;
}

export function usePieceTween(
  pieces: readonly PieceView[],
  boxes: readonly PieceBox[],
): PieceTween {
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const nodes = useRef(new Map<string, Container>());
  const refs = useRef(new Map<string, (node: Container | null) => void>());
  /** Where each piece and ghost is drawn now, by key. */
  const placements = useRef(new Map<string, Placement>());
  /** The pieces on the pan now, by key, as last laid out. */
  const shown = useRef(new Map<string, Shown>());
  const generation = useRef(0);

  const refFor = useCallback((key: string) => {
    let ref = refs.current.get(key);
    if (!ref) {
      ref = (node: Container | null) => {
        if (!node) {
          nodes.current.delete(key);
          return;
        }
        nodes.current.set(key, node);
        const at = placements.current.get(key);
        if (at) place(node, at);
      };
      refs.current.set(key, ref);
    }
    return ref;
  }, []);

  // Only a change of what is drawn, or where, starts a tween: a new draft or a dial notch
  // that changes no label width keeps the pieces where they are.
  const signature = useMemo(
    () =>
      pieces
        .map((piece, i) => `${piece.key}|${pieceIdentity(piece)}|${boxes[i]?.x}|${boxes[i]?.y}`)
        .join(';'),
    [pieces, boxes],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: the signature stands for pieces and boxes
  useLayoutEffect(() => {
    const laidOut = pieces.flatMap((piece, i) => {
      const box = boxes[i];
      return box ? [{ piece, box, identity: pieceIdentity(piece) }] : [];
    });
    const before: PlacedPiece[] = [...shown.current].map(([key, { identity }]) => ({
      key,
      identity,
      at: placements.current.get(key) ?? { x: 0, y: 0, alpha: 0 },
    }));
    const after: PlacedPiece[] = laidOut.map(({ piece, box, identity }) => ({
      key: piece.key,
      identity,
      at: { x: box.x, y: box.y, alpha: 1 },
    }));
    const plan = planTween(before, after);
    const old = shown.current;
    shown.current = new Map(laidOut.map((item) => [item.piece.key, item]));

    generation.current += 1;
    const tag = `exit-${generation.current}`;
    const exits: (Ghost & { motion: PieceMotion })[] = plan.exits.flatMap((exit) => {
      const was = old.get(exit.key);
      if (!was) return [];
      const key = `${tag}-${exit.key}`;
      return [{ key, piece: was.piece, box: was.box, motion: { ...exit, key } }];
    });
    const motions = [...plan.pieces, ...exits.map((exit) => exit.motion)];

    // Forget refs and places of keys no longer drawn (earlier ghosts, removed pieces).
    const live = new Set(motions.map((motion) => motion.key));
    for (const key of [...refs.current.keys()]) if (!live.has(key)) refs.current.delete(key);
    for (const key of [...placements.current.keys()]) {
      if (!live.has(key)) placements.current.delete(key);
    }

    const apply = (t: number) => {
      for (const motion of motions) {
        const at = placementAt(motion, t);
        placements.current.set(motion.key, at);
        const node = nodes.current.get(motion.key);
        if (node) place(node, at);
      }
    };

    if (!planMoves(plan)) {
      apply(1);
      setGhosts((current) => (current.length === 0 ? current : []));
      return;
    }
    apply(0);
    setGhosts(exits.map(({ key, piece, box }) => ({ key, piece, box })));
    const controls = animate(0, 1, {
      duration: pieceTweenMs / 1000,
      ease: 'easeInOut',
      onUpdate: apply,
      onComplete: () => {
        apply(1);
        setGhosts([]);
      },
    });
    return () => controls.stop();
  }, [signature]);

  // Labels can change without the layout changing (a dial notch, `?` while acting out), so
  // a piece that later fades out shows the label it had last, not the one it was laid out with.
  useLayoutEffect(() => {
    for (const piece of pieces) {
      const entry = shown.current.get(piece.key);
      if (entry && entry.identity === pieceIdentity(piece)) entry.piece = piece;
    }
  });

  return { ghosts, refFor };
}
