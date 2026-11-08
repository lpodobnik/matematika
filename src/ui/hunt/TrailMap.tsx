import '@/ui/hunt/trail-map.css';
import { useEffect } from 'react';
import { hr } from '@/content/text/hr';
import { trailText } from '@/content/text/hunt-leads';
import { trailPins, trailStart } from '@/content/trail';
import type { LeadId } from '@/hunt/ids';
import type { TrailId } from '@/hunt/trail';

/** How far along the thread is: through the foundry, then what he has solved, in that order. */
export function threadPoints(done: readonly TrailId[]): { x: number; y: number }[] {
  const pins = done.flatMap((lead) => {
    const pin = trailPins.find((candidate) => candidate.lead === lead);
    return pin ? [{ x: pin.x, y: pin.y }] : [];
  });
  return [trailStart, ...pins];
}

/**
 * The trail, over the town in the new district (story 8.3). Pins mark open leads, and a red thread
 * links what he has solved. All of it is drawn from the save.
 */
export function TrailMap({
  done,
  open,
  sealed = [],
  target = null,
  onPick,
  onClose,
}: {
  done: readonly TrailId[];
  /** What he can go to now. Pins for what's still ahead don't show. */
  open: readonly TrailId[];
  sealed?: readonly LeadId[];
  /** Where the black thread is heading. */
  target?: LeadId | null;
  onPick(lead: TrailId): void;
  onClose(): void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const thread = threadPoints(done)
    .map(({ x, y }) => `${x},${y}`)
    .join(' ');
  return (
    <div className="town__overlay trail">
      <h2 className="trail__title">{trailText.title}</h2>
      <div className="trail__map">
        <svg
          className="trail__thread"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline points={thread} />
        </svg>
        <span
          className="trail__start"
          style={{ left: `${trailStart.x}%`, top: `${trailStart.y}%` }}
          aria-hidden="true"
        />
        {trailPins
          .filter((pin) => done.includes(pin.lead) || open.includes(pin.lead))
          .map((pin) => {
            const solved = done.includes(pin.lead);
            return (
              <button
                key={pin.lead}
                type="button"
                className="trail__pin"
                data-lead={pin.lead}
                data-done={solved}
                data-sealed={(sealed as readonly string[]).includes(pin.lead)}
                data-target={target === pin.lead}
                disabled={solved}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                onClick={() => onPick(pin.lead)}
              >
                <span className="trail__needle" aria-hidden="true" />
                <span className="trail__name">
                  {trailText.leads[pin.lead as keyof typeof trailText.leads]}
                </span>
              </button>
            );
          })}
      </div>
      <button type="button" className="town__close" onClick={onClose}>
        {hr.town.close}
      </button>
    </div>
  );
}
