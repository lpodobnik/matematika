import '@/ui/common/common.css';
import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { hr } from '@/content/text/hr';
import { predictionKey } from '@/economy/predictions';
import { formatNumber } from '@/math/format';
import { dialView, notchCount } from '@/room/dial';
import { pinView } from '@/room/pin';
import { useGame } from '@/store/store';
import { type HeadSpot, pinHeadSpot, type Size } from '@/ui/common/scene-spots';
import { useAreaSize } from '@/ui/common/use-area-size';
import { usePinTest } from '@/ui/scene/scale/use-pin-test';

/** How long the `+2` takes to rise from the pin and travel to the counter. */
export const partsFlightMs = 900;

/** The counter's icon centre, from the scene area's bottom-left corner (common.css). */
const counterAnchor = { left: 8 + 26, bottom: 8 + 26 };

interface Props {
  /** The scene area the counter sits in: the `+2` flies there from the pin's head. */
  area: RefObject<HTMLElement | null>;
}

interface Flight {
  amount: number;
  /** Rising and travelling now: the pin has shown its result. */
  flying: boolean;
}

/**
 * The parts counter (story 1.14; GDD, Prediction: a right call earns 2 bonus parts), in
 * the scene area's bottom-left corner: a cog on a plate and the number of parts he has. It
 * shows once he has earned any, or while a pin is on screen. When a right pin pays, the
 * counter waits while the machine tests the pin; once the pin lights, a `+2` rises from it
 * and travels to the counter, which then ticks up. That is the only reward signal: parts,
 * never praise (NFR13).
 */
export function PartsCounter({ area }: Props) {
  const { parts, paidHere } = useGame(
    useShallow((s) => ({
      parts: s.save.economy.parts,
      paidHere:
        s.room !== null &&
        s.save.economy.paidPredictions.includes(predictionKey(s.room.spec.id, s.room.stageIndex)),
    })),
  );
  const pin = useGame(
    useShallow((s) => {
      const view = pinView(s.room);
      return view ? { kind: view.kind, slots: view.slots, slot: view.slot } : null;
    }),
  );
  const notches = useGame((s) => {
    const dial = dialView(s.room);
    return dial ? notchCount(dial) : null;
  });
  const copies = useGame((s) => s.ui.copies);
  const test = usePinTest();
  const size = useAreaSize(area);

  const [flight, setFlight] = useState<Flight | null>(null);
  const before = useRef({ parts, paidHere });
  useLayoutEffect(() => {
    const was = before.current;
    before.current = { parts, paidHere };
    if (paidHere && !was.paidHere && parts > was.parts) {
      setFlight({ amount: parts - was.parts, flying: false });
    }
  }, [parts, paidHere]);

  const waiting = flight !== null && !flight.flying;
  const lit = test.result;
  useEffect(() => {
    if (waiting && lit) setFlight((f) => (f ? { ...f, flying: true } : f));
  }, [waiting, lit]);
  const flying = flight?.flying ?? false;
  useEffect(() => {
    if (!flying) return;
    const timer = setTimeout(() => setFlight(null), partsFlightMs);
    return () => clearTimeout(timer);
  }, [flying]);

  const head =
    flying && size && pin && pin.slot !== null && notches !== null
      ? pinHeadSpot(size, copies, notches, pin)
      : null;
  return (
    <PartsCounterView
      shown={parts - (flight?.amount ?? 0)}
      visible={parts > 0 || pin !== null}
      flight={flying && flight ? { amount: flight.amount, from: head, area: size } : null}
    />
  );
}

interface PartsCounterViewProps {
  /** The number on the counter: his parts, less any still flying to it. */
  shown: number;
  visible: boolean;
  /** The `+n` on its way from the pin's head, if one is. */
  flight: { amount: number; from: HeadSpot | null; area: Size | null } | null;
}

/** The counter and the flying `+n`, from props only. */
export function PartsCounterView({ shown, visible, flight }: PartsCounterViewProps) {
  const label = formatNumber(shown);
  // Each time the number goes up, it ticks: its span remounts with the tick animation.
  const [ticks, setTicks] = useState(0);
  const last = useRef(shown);
  useEffect(() => {
    if (shown > last.current) setTicks((n) => n + 1);
    last.current = shown;
  }, [shown]);
  return (
    <>
      {visible && (
        <div className="parts-counter" role="status" aria-label={`${hr.parts.label}: ${label}`}>
          <svg className="parts-counter__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 20h18" />
            <path d="M5 20v-2h14v2" />
            <circle cx="12" cy="10" r="3" />
            <path d="M12 3v2.5M12 14.5V17M5 10h2.5M16.5 10H19M7 5l1.8 1.8M15.2 13.2 17 15M17 5l-1.8 1.8M8.8 13.2 7 15" />
          </svg>
          <span
            key={ticks}
            className={
              ticks > 0
                ? 'parts-counter__number parts-counter__number--tick'
                : 'parts-counter__number'
            }
          >
            {label}
          </span>
        </div>
      )}
      {flight?.from && flight.area && (
        <PartsFlight {...flight} from={flight.from} area={flight.area} />
      )}
    </>
  );
}

interface FlightProps {
  amount: number;
  from: HeadSpot;
  area: Size;
}

/** The `+n` rising from the pin's head and travelling to the counter (common.css). */
function PartsFlight({ amount, from, area }: FlightProps) {
  const toX = counterAnchor.left;
  const toY = area.height - counterAnchor.bottom;
  const style = {
    left: from.x,
    top: from.y - from.radius,
    '--parts-dx': `${toX - from.x}px`,
    '--parts-dy': `${toY - (from.y - from.radius)}px`,
    animationDuration: `${partsFlightMs}ms`,
  } as CSSProperties;
  return (
    <span className="parts-fly" style={style} aria-hidden="true">
      +{formatNumber(amount)}
    </span>
  );
}
