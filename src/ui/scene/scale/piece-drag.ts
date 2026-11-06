// Carrying a piece between the tray and the pans (architecture Pattern 1, Balance moves;
// Consistency Rules: Input). A small controller with no React or Pixi in it, so the
// gesture can be tested on its own, like the dial's (dial-drag.ts):
//
// - A drag starts on one of the tray's pieces (a new weight or float with the stepper's
//   number) or on a weight or float on a pan. Either way the move acts on both sides at
//   once (story 1.15): a tray piece let go over the scale sends a copy to each side, and a
//   pan's piece let go off the scale comes off both. The piece follows the finger, keeping where
//   he grabbed it (`onMove`, written to Pixi through a ref, never React state).
// - It ends on pointer up and up outside (`end`): the release handler decides where it
//   landed, from the point he let go. When the store takes the move the piece lands
//   (`landing`) and fades where it is; otherwise it slides back (`returning`).
// - A cancelled drag is not a drop: on the DOM's pointercancel (`abort`, an Android edge
//   gesture or palm rejection), and on blur or a hidden page (`cancel`), both through
//   dial-drag's watchDragCancel, it slides back without asking the release handler.
// - Once that short animation ends, `settle` ends the carry. A new drag settles the old
//   one at once, so a quick second drag is never refused.
// Only a start, a release and a settle change what is carried (`subscribe`), so React
// renders per drag, never per move.

import type { PieceView } from '@/room/scale';
import { dropOnScale, takeOffPan } from '@/room/tray';
import type { RoomState, Side, ToolId, TrayKind } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DropTarget, Point } from '@/ui/scene/scale/tray-layout';

/** Where a carried piece came from. */
export type DragSource =
  | { from: 'tray'; kind: TrayKind }
  | { from: 'pan'; side: Side; key: string };

/** `held` while he drags; then `landing` (the store took it) or `returning` (it slides back). */
export type CarryPhase = 'held' | 'landing' | 'returning';

export interface Carry {
  source: DragSource;
  /** What is drawn under the finger. */
  piece: PieceView;
  /** Where the piece stood when he grabbed it (its bottom centre, in scene units). */
  home: Point;
  phase: CarryPhase;
}

/** Decides where a piece let go at `at` (scene units) landed: true if the store took it. */
export type ReleaseHandler = (carry: Carry, at: Point) => boolean;

export interface PieceDrag {
  /**
   * Starts carrying `piece` from `home`, grabbed at `at` (scene units). Refused while
   * another pointer carries a piece. True if it started.
   */
  start(pointerId: number, source: DragSource, piece: PieceView, home: Point, at: Point): boolean;
  move(pointerId: number, at: Point): void;
  /** Lets go of this pointer's piece where it is: the release handler says where it landed. */
  end(pointerId: number): void;
  /**
   * This pointer was cancelled (the DOM's pointercancel): its piece slides back without a
   * drop, wherever the finger was. The release handler is not asked.
   */
  abort(pointerId: number): void;
  /** Lets go of any held piece without a drop: it slides back (blur, page hidden, unmount). */
  cancel(): void;
  /** The landing or the slide back has played: the carry is over. */
  settle(): void;
  carry(): Carry | null;
  /** Where the carried piece's bottom centre is now, or null. */
  position(): Point | null;
  /** Called when what is carried changes (start, release, settle): never per move. */
  subscribe(listener: () => void): () => void;
  /** Every move of the carried piece (the tray writes it to its Pixi container). */
  setMoveListener(listener: ((at: Point) => void) | null): void;
  setReleaseHandler(handler: ReleaseHandler | null): void;
}

export function createPieceDrag(): PieceDrag {
  let carry: Carry | null = null;
  let held: { pointerId: number; grab: Point; last: Point } | null = null;
  let at: Point | null = null;
  let onMove: ((point: Point) => void) | null = null;
  let onRelease: ReleaseHandler | null = null;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of [...listeners]) listener();
  };
  const place = (point: Point) => {
    at = point;
    onMove?.(point);
  };
  const letGo = (phase: Exclude<CarryPhase, 'held'>) => {
    if (!carry) return;
    held = null;
    carry = { ...carry, phase };
    notify();
  };

  return {
    start(pointerId, source, piece, home, grabAt) {
      if (held) return false;
      held = { pointerId, grab: grabAt, last: grabAt };
      carry = { source, piece, home, phase: 'held' };
      at = home;
      notify();
      place(home);
      return true;
    },
    move(pointerId, point) {
      if (!held || held.pointerId !== pointerId || !carry) return;
      held.last = point;
      place({ x: carry.home.x + point.x - held.grab.x, y: carry.home.y + point.y - held.grab.y });
    },
    end(pointerId) {
      if (!held || held.pointerId !== pointerId || !carry) return;
      const landed = onRelease?.(carry, held.last) ?? false;
      letGo(landed ? 'landing' : 'returning');
    },
    abort(pointerId) {
      if (held?.pointerId === pointerId) letGo('returning');
    },
    cancel() {
      if (held) letGo('returning');
    },
    settle() {
      if (!carry || held) return;
      carry = null;
      at = null;
      notify();
    },
    carry: () => carry,
    position: () => at,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setMoveListener(listener) {
      onMove = listener;
    },
    setReleaseHandler(handler) {
      onRelease = handler;
    },
  };
}

/**
 * What dial-drag's watchDragCancel drives for the piece drag. Ending a drag is not
 * dropping it: the DOM's pointercancel aborts that pointer's carry, and blur or a hidden
 * page cancels any, so in both cases the piece slides back and the store is never asked.
 */
export function cancelWatch(drag: PieceDrag): { end(pointerId: number): void; cancel(): void } {
  return { end: (pointerId) => drag.abort(pointerId), cancel: () => drag.cancel() };
}

/**
 * The store action a piece let go over `target` asks for (story 1.15): a tray piece over the
 * scale drops a copy on each side, and a pan's piece let go off the scale (the tray or
 * anywhere else) comes off both sides. A tray piece let go off the scale, or a pan's piece
 * let go over it, asks for nothing, and the piece slides back.
 */
export function releaseAction(source: DragSource, target: DropTarget): Action | null {
  if (source.from === 'tray') {
    return target === 'scale' ? { type: 'tray/drop', kind: source.kind } : null;
  }
  return target === 'scale' ? null : { type: 'tray/take', side: source.side, key: source.key };
}

/**
 * Whether the store will take a tray action now (room/tray.ts decides), so a piece it
 * refuses slides back instead of landing.
 */
export function storeTakes(
  room: RoomState | null,
  tools: readonly ToolId[],
  action: Action | null,
): boolean {
  if (!room || !action) return false;
  if (action.type === 'tray/drop') return dropOnScale(room, tools, action.kind) !== null;
  if (action.type === 'tray/take') return takeOffPan(room, tools, action.side, action.key) !== null;
  return false;
}

/** The pan piece hidden while it is carried: its key and what it is, or null. */
export interface HiddenPiece {
  key: string;
  identity: string;
}
