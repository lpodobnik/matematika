// Dragging the splitter across both pans, or off them (architecture Pattern 1, Balance
// moves; Pattern 2, Jams; Consistency Rules: Input). A small controller with no React or
// Pixi in it, so the gesture can be tested on its own, like the piece drag (piece-drag.ts):
//
// - A drag starts on the blade in its holder, or on the blade lying across the pans after
//   a split that jammed the machine. The blade follows the finger, keeping where he grabbed
//   it (`onMove`, written to Pixi through a ref, never React state).
// - While it moves, the controller notes which pans the finger has passed over
//   (`panUnder`), so a release knows whether it went across both.
// - It ends on pointer up and up outside (`end`): the release handler decides what the drag
//   did, from where he let go and the pans crossed. When the store takes it, the blade
//   lands (`landing`) and fades where it is; otherwise it slides back (`returning`).
// - A cancelled drag (the DOM's pointercancel, blur, a hidden page) is not a release: the
//   blade slides back without asking the release handler.
// - Once that short animation ends, `settle` ends the carry. A new drag settles the old one
//   at once. Only a start, a release and a settle change what is carried (`subscribe`), so
//   React renders per drag, never per move.

import { liftSplitter, splitBothPans } from '@/room/splitter';
import type { RoomState, Side, ToolId } from '@/room/types';
import type { Action } from '@/store/actions';
import type { Box } from '@/ui/scene/scale/dial-layout';
import {
  overHolder,
  type SplitterLayout,
  splitterGeometry,
} from '@/ui/scene/scale/splitter-layout';
import type { Point } from '@/ui/scene/scale/tray-layout';

/** Where the splitter was grabbed: in its holder, or lying across the pans (a split jam). */
export type SplitterGrab = 'holder' | 'pans';

/** `held` while he drags; then `landing` (the store took it) or `returning` (it slides back). */
export type SplitterPhase = 'held' | 'landing' | 'returning';

export interface SplitterCarry {
  from: SplitterGrab;
  /** The blade as it stood when he grabbed it: its top-left corner, and its size. */
  home: Box;
  /** Where the finger went down, in scene units. */
  grabbedAt: Point;
  /** The parts on the blade while it is carried. */
  parts: number;
  phase: SplitterPhase;
}

/**
 * Decides what a drag let go at `at` (scene units), having passed over the pans in
 * `crossed`, did: true if the store took it.
 */
export type SplitterRelease = (
  carry: SplitterCarry,
  at: Point,
  crossed: readonly Side[],
) => boolean;

export interface SplitterDrag {
  /** Starts carrying the blade, grabbed at `at`. Refused while another pointer carries it. */
  start(pointerId: number, from: SplitterGrab, home: Box, parts: number, at: Point): boolean;
  move(pointerId: number, at: Point): void;
  /** Lets go of this pointer's blade: the release handler says what it did. */
  end(pointerId: number): void;
  /** This pointer was cancelled: its blade slides back, and the release handler isn't asked. */
  abort(pointerId: number): void;
  /** Lets go of a held blade without a release: it slides back (blur, page hidden, unmount). */
  cancel(): void;
  /** The landing or the slide back has played: the carry is over. */
  settle(): void;
  carry(): SplitterCarry | null;
  /** Where the carried blade's top-left corner is now, or null. */
  position(): Point | null;
  /** The pans the finger has passed over in the drag held now, left first. */
  crossed(): Side[];
  /** Called when what is carried changes (start, release, settle): never per move. */
  subscribe(listener: () => void): () => void;
  /** Every move of the carried blade (the splitter writes it to its Pixi container). */
  setMoveListener(listener: ((at: Point) => void) | null): void;
  setReleaseHandler(handler: SplitterRelease | null): void;
}

const sides: readonly Side[] = ['left', 'right'];

/** A splitter drag; `panUnder` says which pan, if any, a point is over. */
export function createSplitterDrag(panUnder: (point: Point) => Side | null): SplitterDrag {
  let carry: SplitterCarry | null = null;
  let held: { pointerId: number; last: Point; crossed: Set<Side> } | null = null;
  let at: Point | null = null;
  let onMove: ((point: Point) => void) | null = null;
  let onRelease: SplitterRelease | null = null;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of [...listeners]) listener();
  };
  const place = (point: Point) => {
    at = point;
    onMove?.(point);
  };
  const crossedNow = () => sides.filter((side) => held?.crossed.has(side));
  const letGo = (phase: Exclude<SplitterPhase, 'held'>) => {
    if (!carry) return;
    held = null;
    carry = { ...carry, phase };
    notify();
  };

  return {
    start(pointerId, from, home, parts, grabAt) {
      if (held) return false;
      held = { pointerId, last: grabAt, crossed: new Set() };
      carry = { from, home, grabbedAt: grabAt, parts, phase: 'held' };
      notify();
      place({ x: home.x, y: home.y });
      return true;
    },
    move(pointerId, point) {
      if (!held || held.pointerId !== pointerId || !carry) return;
      held.last = point;
      const pan = panUnder(point);
      if (pan) held.crossed.add(pan);
      const { home, grabbedAt } = carry;
      place({ x: home.x + point.x - grabbedAt.x, y: home.y + point.y - grabbedAt.y });
    },
    end(pointerId) {
      if (!held || held.pointerId !== pointerId || !carry) return;
      const landed = onRelease?.(carry, held.last, crossedNow()) ?? false;
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
    crossed: crossedNow,
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
 * What dial-drag's watchDragCancel drives for the splitter drag: the DOM's pointercancel
 * aborts that pointer's drag, and blur or a hidden page cancels any, so the blade slides
 * back and the store is never asked.
 */
export function splitterCancelWatch(drag: SplitterDrag): {
  end(pointerId: number): void;
  cancel(): void;
} {
  return { end: (pointerId) => drag.abort(pointerId), cancel: () => drag.cancel() };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * The store action a release asks for. From the holder: a split, once the finger has
 * passed over both pans, unless it is let go back over the holder. From the pans: off the
 * pans, when let go over the holder or at least `liftDistance` from where he grabbed it.
 * Anything else asks for nothing, and the blade slides back.
 */
export function splitterAction(
  carry: Pick<SplitterCarry, 'from' | 'grabbedAt'>,
  at: Point,
  crossed: readonly Side[],
  layout: SplitterLayout,
): Action | null {
  const home = overHolder(at, layout);
  if (carry.from === 'holder') {
    const across = crossed.includes('left') && crossed.includes('right');
    return across && !home ? { type: 'splitter/split' } : null;
  }
  const away = distance(at, carry.grabbedAt) >= splitterGeometry.liftDistance;
  return home || away ? { type: 'splitter/lift' } : null;
}

/**
 * Whether the store will take a splitter action now (room/splitter.ts decides), so a drag
 * it ignores slides back instead of landing.
 */
export function splitterTakes(
  room: RoomState | null,
  tools: readonly ToolId[],
  action: Action | null,
): boolean {
  if (!room || !action) return false;
  if (action.type === 'splitter/split') return splitBothPans(room, tools) !== null;
  if (action.type === 'splitter/lift') return liftSplitter(room) !== null;
  return false;
}
