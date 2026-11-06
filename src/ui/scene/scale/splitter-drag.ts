// Dragging the splitter over the scale (architecture Pattern 1, Balance moves; Consistency
// Rules: Input; story 1.15). A small controller with no React or Pixi in it, so the gesture
// can be tested on its own, like the piece drag (piece-drag.ts):
//
// - A drag starts on the divider frame in its holder. The frame follows the finger, keeping
//   where he grabbed it (`onMove`, written to Pixi through a ref, never React state).
// - It ends on pointer up and up outside (`end`): the release handler decides what the drag
//   did, from where he let go: anywhere over the scale splits (splitter-layout.ts,
//   `splitsAt`). When the store takes it, the frame lands (`landing`) and fades where it is;
//   otherwise it goes back (`returning`), an uneven split included, which the scale shows
//   separating and sliding back together.
// - A cancelled drag (the DOM's pointercancel, blur, a hidden page) is not a release: the
//   frame goes back without asking the release handler.
// - Once that short animation ends, `settle` ends the carry. A new drag settles the old one
//   at once. Only a start, a release and a settle change what is carried (`subscribe`), so
//   React renders per drag, never per move.

import { splitBothPans } from '@/room/splitter';
import type { RoomState, ToolId } from '@/room/types';
import type { Action } from '@/store/actions';
import type { Box } from '@/ui/scene/scale/dial-layout';
import { type SplitterLayout, splitsAt } from '@/ui/scene/scale/splitter-layout';
import type { Point } from '@/ui/scene/scale/tray-layout';

/** `held` while he drags; then `landing` (the store took it) or `returning` (it goes back). */
export type SplitterPhase = 'held' | 'landing' | 'returning';

export interface SplitterCarry {
  /** The frame as it stood when he grabbed it: its top-left corner, and its size. */
  home: Box;
  /** Where the finger went down, in scene units. */
  grabbedAt: Point;
  /** The parts on the frame while it is carried. */
  parts: number;
  phase: SplitterPhase;
}

/** Decides what a drag let go at `at` (scene units) did: true if the store took it. */
export type SplitterRelease = (carry: SplitterCarry, at: Point) => boolean;

export interface SplitterDrag {
  /** Starts carrying the frame, grabbed at `at`. Refused while another pointer carries it. */
  start(pointerId: number, home: Box, parts: number, at: Point): boolean;
  move(pointerId: number, at: Point): void;
  /** Lets go of this pointer's frame: the release handler says what it did. */
  end(pointerId: number): void;
  /** This pointer was cancelled: its frame goes back, and the release handler isn't asked. */
  abort(pointerId: number): void;
  /** Lets go of a held frame without a release: it goes back (blur, page hidden, unmount). */
  cancel(): void;
  /** The landing or the way back has played: the carry is over. */
  settle(): void;
  carry(): SplitterCarry | null;
  /** Where the carried frame's top-left corner is now, or null. */
  position(): Point | null;
  /** Called when what is carried changes (start, release, settle): never per move. */
  subscribe(listener: () => void): () => void;
  /** Every move of the carried frame (the splitter writes it to its Pixi container). */
  setMoveListener(listener: ((at: Point) => void) | null): void;
  setReleaseHandler(handler: SplitterRelease | null): void;
}

export function createSplitterDrag(): SplitterDrag {
  let carry: SplitterCarry | null = null;
  let held: { pointerId: number; last: Point } | null = null;
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
  const letGo = (phase: Exclude<SplitterPhase, 'held'>) => {
    if (!carry) return;
    held = null;
    carry = { ...carry, phase };
    notify();
  };

  return {
    start(pointerId, home, parts, grabAt) {
      if (held) return false;
      held = { pointerId, last: grabAt };
      carry = { home, grabbedAt: grabAt, parts, phase: 'held' };
      notify();
      place({ x: home.x, y: home.y });
      return true;
    },
    move(pointerId, point) {
      if (!held || held.pointerId !== pointerId || !carry) return;
      held.last = point;
      const { home, grabbedAt } = carry;
      place({ x: home.x + point.x - grabbedAt.x, y: home.y + point.y - grabbedAt.y });
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
 * What dial-drag's watchDragCancel drives for the splitter drag: the DOM's pointercancel
 * aborts that pointer's drag, and blur or a hidden page cancels any, so the frame goes back
 * and the store is never asked.
 */
export function splitterCancelWatch(drag: SplitterDrag): {
  end(pointerId: number): void;
  cancel(): void;
} {
  return { end: (pointerId) => drag.abort(pointerId), cancel: () => drag.cancel() };
}

/**
 * The store action a release asks for: a split, when the frame is let go anywhere over the
 * scale and not back over its holder. Anything else asks for nothing, and it goes back.
 */
export function splitterAction(at: Point, layout: SplitterLayout): Action | null {
  return splitsAt(at, layout) ? { type: 'splitter/split' } : null;
}

/**
 * Whether the store will take a splitter action now (room/splitter.ts decides), so a drag
 * it ignores (an uneven split among them) goes back instead of landing.
 */
export function splitterTakes(
  room: RoomState | null,
  tools: readonly ToolId[],
  action: Action | null,
): boolean {
  if (!room || action?.type !== 'splitter/split') return false;
  return splitBothPans(room, tools) !== null;
}
