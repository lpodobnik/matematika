import { hr } from '@/content/text/hr';
import { formatNumber } from '@/math/format';
import type { DialView } from '@/room/dial';
import type { RangeView } from '@/room/range';
import { primaryPress } from '@/ui/notebook/pad-keys';

/** A range's words: under the first bound, between two, or over the last. */
export function rangeLabels(bounds: readonly number[]): string[] {
  const n = bounds.map((bound) => formatNumber(bound));
  const first = n[0];
  const last = n[n.length - 1];
  if (first === undefined || last === undefined) return [];
  const between = n.slice(1).map((to, i) => hr.range.between(n[i] ?? first, to));
  return [hr.range.under(first), ...between, hr.range.over(last)];
}

interface RangeProps {
  view: RangeView;
  onFlag(index: number): void;
  onConfirm(): void;
}

/**
 * Room 11's range pin at the top of the notebook (story 4.6): the ranges as buttons that
 * flag one, with the pin's confirm under them; once confirmed, the range x is in.
 */
export function RangePanel({ view, onFlag, onConfirm }: RangeProps) {
  const labels = rangeLabels(view.bounds);
  if (view.right !== null) {
    return (
      <section className="story-panel" aria-label={hr.range.label}>
        <p className="story-panel__story" data-written>
          {labels[view.right]}
        </p>
      </section>
    );
  }
  return (
    <section className="story-panel" aria-label={hr.range.label}>
      <ol className="story-panel__options">
        {labels.map((label, i) => (
          <li key={label} className="story-panel__option">
            <button
              type="button"
              tabIndex={-1}
              className="story-panel__choice"
              aria-pressed={view.at === i}
              disabled={!view.asks}
              onPointerDown={(event) => primaryPress(event, () => onFlag(i))}
            >
              <span className="story-panel__flag" aria-hidden="true">
                {view.at === i ? '⚑' : ''}
              </span>
              <span className="story-panel__text">{label}</span>
            </button>
          </li>
        ))}
      </ol>
      {view.confirmable && (
        <button
          type="button"
          tabIndex={-1}
          className="story-panel__confirm"
          onPointerDown={(event) => primaryPress(event, onConfirm)}
        >
          {hr.stories.confirm}
        </button>
      )}
    </section>
  );
}

interface FineProps {
  dial: DialView;
  onNudge(by: 1 | -1): void;
}

/**
 * A coarse dial's single steps (story 4.6; GDD: "+ and − on its plate"): − and + beside the
 * slider's x, in the notebook, since the scene has no room by the dial on a phone.
 */
export function FineDial({ dial, onNudge }: FineProps) {
  const down = dial.turns && dial.x - dial.step >= dial.openMin;
  const up = dial.turns && dial.x + dial.step <= dial.openMax;
  return (
    <fieldset className="fine-dial" aria-label={hr.fineDial.label}>
      <button
        type="button"
        tabIndex={-1}
        className="fine-dial__step"
        aria-label={hr.fineDial.down}
        disabled={!down}
        onPointerDown={(event) => primaryPress(event, () => onNudge(-1))}
      >
        −
      </button>
      <output className="fine-dial__x">x = {formatNumber(dial.x)}</output>
      <button
        type="button"
        tabIndex={-1}
        className="fine-dial__step"
        aria-label={hr.fineDial.up}
        disabled={!up}
        onPointerDown={(event) => primaryPress(event, () => onNudge(1))}
      >
        +
      </button>
    </fieldset>
  );
}
