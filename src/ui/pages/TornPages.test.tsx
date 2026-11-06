import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { lairs } from '@/content/lairs';
import { hr } from '@/content/text/hr';
import { PAGE_ORDER, PageReturned, PagesReader } from '@/ui/pages/TornPages';

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('torn logbook pages (story 3.4)', () => {
  it('has a page for each of the armour 30, 45 and 60 automatons, in story order', () => {
    expect(PAGE_ORDER).toEqual(['page-1', 'page-2', 'page-3']);
    expect([lairs['lair-30'].page, lairs['lair-45'].page, lairs['lair-60'].page]).toEqual(
      PAGE_ORDER,
    );
    for (const page of PAGE_ORDER) {
      expect(hr.pages.text[page].lines.length).toBeGreaterThan(0);
    }
  });

  it('shows a returned page as a dialog in Kristijan’s hand, with a way to close it', () => {
    const html = renderToString(<PageReturned page="page-1" onClose={() => undefined} />);
    expect(html).toContain('role="dialog"');
    expect(text(html)).toContain(hr.pages.found);
    expect(text(html)).toContain(hr.pages.text['page-1'].lines[0]);
    expect(html).toContain(`>${hr.pages.close}<`);
  });

  it('reads the pages he has again, in story order, whatever order he won them in', () => {
    const html = renderToString(
      <PagesReader pages={['page-3', 'page-1']} onClose={() => undefined} />,
    );
    const shown = [...html.matchAll(/data-page="(page-\d)"/g)].map((m) => m[1]);
    expect(shown).toEqual(['page-1', 'page-3']);
    expect(text(html)).toContain(hr.pages.count(2, 3));
    expect(text(html)).not.toContain(hr.pages.text['page-2'].lines[0] ?? '');
  });
});
