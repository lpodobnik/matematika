// Dragging the x dial (architecture, Consistency Rules: Input, The dial; Performance). A
// small controller with no React or Pixi in it, so the gesture can be tested on its own:
//
// - A drag starts anywhere on the dial's track and moves the knob by as much as the finger
//   moves, so he never has to hit the knob itself, and a long range can be covered in
//   several strokes. A mouse drags it the same way.
// - The knob follows every pointer move (`onKnob`, written to Pixi through a ref), and the
//   notch is the one nearest the knob, 24 CSS px apart. Only a change of notch reaches the
//   store (`onNotch`, which dispatches `dial/set`).
// - At either end of the reachable range the knob stops.
// - The drag ends on pointer up, up outside and cancel, and also when the window loses
//   focus or the page is hidden, so a dropped drag never sticks (Android). The knob then
//   settles on the store's notch.

import { type DialView, dialValue, notchOf } from '@/room/dial';
import type { Action } from '@/store/actions';

export interface DialDragOptions {
  /** CSS px of drag per notch (tuning.dialNotchPx). */
  notchPx: number;
  /** Every move, and whenever it settles: the knob's distance from notch 0, in CSS px. */
  onKnob(px: number): void;
  /** The notch under the knob changed during a drag. */
  onNotch(notch: number): void;
}

/** Where the store has the dial, in notches from its minimum. */
export interface DialSync {
  notch: number;
  /** The reachable notches, first to last. */
  first: number;
  last: number;
  /** Whether a drag moves it now (the phase allows it). */
  enabled: boolean;
}

export interface DialDrag {
  /** Takes the store's dial; with no drag in progress the knob settles there. */
  sync(state: DialSync): void;
  /** Starts a drag, unless one is in progress or the dial is still. True if it started. */
  start(pointerId: number, globalX: number): boolean;
  move(pointerId: number, globalX: number): void;
  /** Ends the drag of this pointer, if it has one. */
  end(pointerId: number): void;
  /** Ends any drag (blur, page hidden, unmount). */
  cancel(): void;
  dragging(): boolean;
}

export function createDialDrag(options: DialDragOptions): DialDrag {
  const { notchPx, onKnob, onNotch } = options;
  let state: DialSync = { notch: 0, first: 0, last: 0, enabled: false };
  let drag: { pointerId: number; startX: number; startPx: number; sent: number } | null = null;

  const settle = () => onKnob(state.notch * notchPx);
  const finish = () => {
    if (!drag) return;
    drag = null;
    settle();
  };

  return {
    sync(next) {
      state = next;
      if (!next.enabled) drag = null;
      if (!drag) settle();
    },
    start(pointerId, globalX) {
      if (drag || !state.enabled) return false;
      drag = { pointerId, startX: globalX, startPx: state.notch * notchPx, sent: state.notch };
      return true;
    },
    move(pointerId, globalX) {
      if (!drag || drag.pointerId !== pointerId) return;
      const px = Math.max(
        state.first * notchPx,
        Math.min(state.last * notchPx, drag.startPx + globalX - drag.startX),
      );
      onKnob(px);
      // Story 4.6 review: from between two notches (207 on a dial in tens), a touch sends
      // nothing until the knob has moved half a notch, so a resting finger never moves x.
      const between = !Number.isInteger(drag.startPx / notchPx);
      if (between && Math.abs(px - drag.startPx) < notchPx / 2) return;
      const notch = Math.round(px / notchPx);
      if (notch !== drag.sent) {
        drag.sent = notch;
        onNotch(notch);
      }
    },
    end(pointerId) {
      if (drag?.pointerId === pointerId) finish();
    },
    cancel: finish,
    dragging: () => drag !== null,
  };
}

/** The store's dial as the controller takes it. */
export function dialSync(view: DialView | null): DialSync {
  if (!view) return { notch: 0, first: 0, last: 0, enabled: false };
  return {
    notch: notchOf(view, view.x),
    first: notchOf(view, view.openMin),
    last: notchOf(view, view.openMax),
    enabled: view.turns,
  };
}

/** The action a new notch sends: room 1's notch 5 is x = 5, room 2's second dial's is 15. */
export function notchAction(view: DialView, notch: number): Action {
  return { type: 'dial/set', x: dialValue(view, notch) };
}

/** The parts of a Pixi pointer event the dial reads. */
export interface DialPointerEvent {
  pointerId: number;
  button: number;
  global: { x: number };
}

/** The part of a drag controller the pointer handlers drive (the dial's, and the pin's). */
export type PointerDrag = Pick<DialDrag, 'start' | 'move' | 'end'>;

/**
 * The dial's Pixi pointer handlers: down, then `onGlobalPointerMove` for the drag, ending
 * on up, up outside and cancel. Nothing reacts to hover. Only the main button starts it.
 * The pin's drag uses them too.
 */
export function dialPointerHandlers(drag: PointerDrag) {
  const end = (event: DialPointerEvent) => drag.end(event.pointerId);
  return {
    onPointerDown: (event: DialPointerEvent) => {
      if (event.button === 0) drag.start(event.pointerId, event.global.x);
    },
    onGlobalPointerMove: (event: DialPointerEvent) => drag.move(event.pointerId, event.global.x),
    onPointerUp: end,
    onPointerUpOutside: end,
    onPointerCancel: end,
  };
}

interface Listenable {
  addEventListener(type: string, listener: (event: Event) => void, capture?: boolean): void;
  removeEventListener(type: string, listener: (event: Event) => void, capture?: boolean): void;
}

/**
 * Ends drags the scene can't see end. Pixi 8.22 never turns the DOM's `pointercancel` into
 * a Pixi event, so it is caught on the window; losing focus or hiding the page ends any
 * drag too. Returns the unsubscribe.
 */
export function watchDragCancel(
  win: Listenable,
  doc: Listenable & { visibilityState: string },
  drag: Pick<DialDrag, 'end' | 'cancel'>,
): () => void {
  const onCancel = (event: Event) => {
    const { pointerId } = event as Event & { pointerId?: number };
    if (typeof pointerId === 'number') drag.end(pointerId);
    else drag.cancel();
  };
  const onBlur = () => drag.cancel();
  const onVisibility = () => {
    if (doc.visibilityState === 'hidden') drag.cancel();
  };
  win.addEventListener('pointercancel', onCancel, true);
  win.addEventListener('blur', onBlur);
  doc.addEventListener('visibilitychange', onVisibility);
  return () => {
    win.removeEventListener('pointercancel', onCancel, true);
    win.removeEventListener('blur', onBlur);
    doc.removeEventListener('visibilitychange', onVisibility);
  };
}
