import '@/ui/pages/pages.css';
import { hr } from '@/content/text/hr';
import type { PageId } from '@/fight/types';

/** The three torn pages in story order (narrative design, Found Documents). */
export const PAGE_ORDER: readonly PageId[] = ['page-1', 'page-2', 'page-3'];

/** One torn logbook page, in Kristijan's hand (story 3.4). */
export function TornPage({ page }: { page: PageId }) {
  const { title, lines } = hr.pages.text[page];
  return (
    <article className="torn-page" data-page={page}>
      <h3 className="torn-page__title">{title}</h3>
      {lines.map((line) => (
        <p key={line} className="torn-page__line">
          {line}
        </p>
      ))}
      <p className="torn-page__sign">{hr.pages.sign}</p>
    </article>
  );
}

/**
 * A torn page just returned by a win (story 3.4): it shows over the fight's end until he
 * closes it, then is kept with the others.
 */
export function PageReturned({ page, onClose }: { page: PageId; onClose(): void }) {
  return (
    <div className="pages__backdrop">
      <section className="pages__card" role="dialog" aria-modal="true" aria-label={hr.pages.found}>
        <p className="pages__found">{hr.pages.found}</p>
        <TornPage page={page} />
        {/* biome-ignore lint/a11y/noAutofocus: a dialog's one way out takes the focus */}
        <button type="button" className="pages__close" autoFocus onClick={onClose}>
          {hr.pages.close}
        </button>
      </section>
    </div>
  );
}

/** The pages he has, to read again from the map, in story order (story 3.4). */
export function PagesReader({ pages, onClose }: { pages: readonly PageId[]; onClose(): void }) {
  const kept = PAGE_ORDER.filter((page) => pages.includes(page));
  return (
    <div className="pages__backdrop">
      <section className="pages__card" role="dialog" aria-modal="true" aria-label={hr.pages.title}>
        <div className="pages__head">
          <h2 className="pages__heading">{hr.pages.title}</h2>
          {/* biome-ignore lint/a11y/noAutofocus: a dialog's one way out takes the focus */}
          <button type="button" className="pages__close" autoFocus onClick={onClose}>
            {hr.pages.close}
          </button>
        </div>
        <p className="pages__count">{hr.pages.count(kept.length, PAGE_ORDER.length)}</p>
        <div className="pages__list">
          {kept.map((page) => (
            <TornPage key={page} page={page} />
          ))}
        </div>
      </section>
    </div>
  );
}
