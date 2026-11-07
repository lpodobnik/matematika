import { hr } from '@/content/text/hr';
import { formatNumber } from '@/math/format';
import type { LinkedView } from '@/room/linked';

/**
 * A linked machine at the top of the notebook (story 4.7): in the first machine, the next
 * one with its ☐ waiting for this answer; in the next, the ☐ filled with the answer that
 * came in, marked, so he sees where the weight came from.
 */
export function LinkedPanel({ view }: { view: LinkedView }) {
  const [before, after] = view.template.split('☐');
  return (
    <section className="story-panel linked-panel" aria-label={hr.linked.label}>
      <p className="story-panel__story">
        <span className="linked-panel__lead">
          {view.role === 'feeds' ? hr.linked.feeds : hr.linked.fed}
        </span>{' '}
        <span className="linked-panel__equation">
          {before}
          <span className="linked-panel__slot" data-filled={view.value !== null || undefined}>
            {view.value === null ? (
              <>
                <span aria-hidden="true">☐</span>
                <span className="chain__said">{hr.linked.slot}</span>
              </>
            ) : (
              formatNumber(view.value)
            )}
          </span>
          {after}
        </span>
      </p>
    </section>
  );
}
