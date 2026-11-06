// Dragging the prediction pin (architecture, Pattern 2, Pin; Consistency Rules: Input). A
// small controller with no React or Pixi in it, so the gesture can be tested on its own,
// like the dial's (dial-drag.ts):
//
// - A drag starts on the pin's head and moves it left and right by as much as the finger
//   moves; the pin follows every move (`onPin`, written to Pixi through a ref).
// - The place is the one nearest the pin. Only a change of place reaches the store
//   (`onPlace`, which dispatches `pin/set`): the first one takes the pin out of its holder,
//   which sends the stage to `pin` and freezes the dial.
// - While the pin is in its holder it can slide out of it; once placed, it stays on its
//   track, between the first place and the last.
// - The drag ends on pointer up, up outside and cancel (and on blur or a hidden page,
//   through dial-drag's watchDragCancel); the pin then settles on the store's place.

export interface PinDragOptions {
  /** CSS px of drag between places. */
  slotPx: number;
  /** Where the holder is, in CSS px from place 0 (negative: to its left). */
  holderPx: number;
  /** Every move, and whenever it settles: the pin's distance from place 0, in CSS px. */
  onPin(px: number): void;
  /** The place under the pin changed during a drag. */
  onPlace(slot: number): void;
}

/** Where the store has the pin. */
export interface PinSync {
  /** The place it is in, or null in its holder. */
  slot: number | null;
  slots: number;
  /** Whether a drag moves it now: the stage offers it. */
  enabled: boolean;
}

export interface PinDrag {
  sync(state: PinSync): void;
  /** Starts a drag, unless one is in progress or the pin is locked. True if it started. */
  start(pointerId: number, globalX: number): boolean;
  move(pointerId: number, globalX: number): void;
  end(pointerId: number): void;
  cancel(): void;
  dragging(): boolean;
}

export function createPinDrag(options: PinDragOptions): PinDrag {
  const { slotPx, holderPx, onPin, onPlace } = options;
  let state: PinSync = { slot: null, slots: 1, enabled: false };
  let drag: { pointerId: number; startX: number; startPx: number; sent: number | null } | null =
    null;

  const restPx = () => (state.slot === null ? holderPx : state.slot * slotPx);
  const settle = () => onPin(restPx());
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
      drag = { pointerId, startX: globalX, startPx: restPx(), sent: state.slot };
      return true;
    },
    move(pointerId, globalX) {
      if (!drag || drag.pointerId !== pointerId) return;
      const last = (state.slots - 1) * slotPx;
      const first = state.slot === null && drag.sent === null ? holderPx : 0;
      const px = Math.max(first, Math.min(last, drag.startPx + globalX - drag.startX));
      onPin(px);
      // Still in the holder until it is halfway to the first place.
      if (px < -slotPx / 2) return;
      const slot = Math.max(0, Math.min(state.slots - 1, Math.round(px / slotPx)));
      if (slot !== drag.sent) {
        drag.sent = slot;
        onPlace(slot);
      }
    },
    end(pointerId) {
      if (drag?.pointerId === pointerId) finish();
    },
    cancel: finish,
    dragging: () => drag !== null,
  };
}
