import '@/ui/common/common.css';
import { hr } from '@/content/text/hr';
import { pinView } from '@/room/pin';
import type { EffectOption } from '@/room/types';
import { useGame } from '@/store/store';

/**
 * The pin's confirm control (Pattern 2, Pin: "confirming locks it"). It shows only while
 * the pin is placed and not yet locked; confirming opens the dial and the notebook. What
 * confirming does is decided in `room/pin.ts`.
 */
export function PinConfirm() {
  const confirmable = useGame((s) => pinView(s.room)?.confirmable ?? false);
  const option = useGame((s) => pinView(s.room)?.option ?? null);
  const dispatch = useGame((s) => s.dispatch);
  if (!confirmable) return null;
  return <PinConfirmControl option={option} onConfirm={() => dispatch({ type: 'pin/confirm' })} />;
}

interface PinConfirmControlProps {
  /** A choice pin's option where it is, read out in the control's name; null for an x pin. */
  option: EffectOption | null;
  onConfirm(): void;
}

/**
 * The button itself, from props only: a pin pressed in, with its label, in the scene area's
 * bottom-left corner, at least 48 CSS px (common.css). Like the reset control, it acts on
 * release and never takes focus.
 */
export function PinConfirmControl({ option, onConfirm }: PinConfirmControlProps) {
  const name = option ? `${hr.pin.confirm}: ${hr.pin.options[option]}` : hr.pin.confirm;
  return (
    <button
      type="button"
      tabIndex={-1}
      className="pin-confirm"
      aria-label={name}
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
