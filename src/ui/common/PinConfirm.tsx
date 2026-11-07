import '@/ui/common/common.css';
import type { RefObject } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { hr } from '@/content/text/hr';
import { dialView, notchCount } from '@/room/dial';
import { pinView } from '@/room/pin';
import type { EffectOption } from '@/room/types';
import { useGame } from '@/store/store';
import { confirmSpot, pinHeadSpot } from '@/ui/common/scene-spots';
import { useAreaSize } from '@/ui/common/use-area-size';

interface Props {
  /** The scene area the control is laid over: the pin's head is found in it. */
  area: RefObject<HTMLElement | null>;
}

/**
 * The pin's confirm control (Pattern 2, Pin: "confirming locks it"), right beside the
 * pin's head (story 1.14). It shows only while the pin is placed and not yet locked, and
 * moves with the pin from place to place. Confirming opens the dial and the notebook, and
 * the machine tests the pin. What confirming does is decided in `room/pin.ts`.
 */
export function PinConfirm({ area }: Props) {
  const pin = useGame(
    useShallow((s) => {
      const view = pinView(s.room);
      // A line pin (room 7) is confirmed at the notebook, beside its line (story 2.10).
      return view?.confirmable &&
        view.slot !== null &&
        view.kind !== 'line' &&
        view.kind !== 'story'
        ? { kind: view.kind, slots: view.slots, slot: view.slot, option: view.option }
        : null;
    }),
  );
  const notches = useGame((s) => {
    const dial = dialView(s.room);
    return dial ? notchCount(dial) : null;
  });
  const copies = useGame((s) => s.ui.copies);
  const dispatch = useGame((s) => s.dispatch);
  const size = useAreaSize(area);
  if (!pin || notches === null) return null;
  const head = size ? pinHeadSpot(size, copies, notches, pin) : null;
  const spot = head && size ? confirmSpot(head, pin.kind, size) : null;
  return (
    <PinConfirmControl
      option={pin.option}
      spot={spot}
      onConfirm={() => dispatch({ type: 'pin/confirm' })}
    />
  );
}

interface PinConfirmControlProps {
  /** A choice pin's option where it is, read out in the control's name; null for an x pin. */
  option: EffectOption | null;
  /** Its top-left corner in the scene area, in CSS px; null (hidden) until the area is measured. */
  spot: { left: number; top: number } | null;
  onConfirm(): void;
}

/**
 * The button itself, from props only: a flag driven in, with its label, at least 48 CSS px
 * (common.css). Like the reset control, it acts on release and never takes focus.
 */
export function PinConfirmControl({ option, spot, onConfirm }: PinConfirmControlProps) {
  const name = option ? `${hr.pin.confirm}: ${hr.pin.options[option]}` : hr.pin.confirm;
  return (
    <button
      type="button"
      tabIndex={-1}
      className="pin-confirm"
      aria-label={name}
      style={spot ? { left: spot.left, top: spot.top } : { visibility: 'hidden' }}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onConfirm}
    >
      {/* The pin is a flag (story 1.15): a pole driven into the ground, with its cloth. */}
      <svg className="pin-confirm__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 21V3" />
        <path d="M7 4c3.5-1.5 7.5 1.5 12 0v8c-4.5 1.5-8.5-1.5-12 0" />
        <path d="M3 21h8" />
      </svg>
      <span className="pin-confirm__label">{hr.pin.confirm}</span>
    </button>
  );
}
