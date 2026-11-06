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
      return view?.confirmable && view.slot !== null
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
 * The button itself, from props only: a pin pressed in, with its label, at least 48 CSS px
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
      <svg className="pin-confirm__icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="7" r="4" />
        <path d="M12 11v8" />
        <path d="M6 21h12" />
        <path d="M9 17l3 3 3-3" />
      </svg>
      <span className="pin-confirm__label">{hr.pin.confirm}</span>
    </button>
  );
}
