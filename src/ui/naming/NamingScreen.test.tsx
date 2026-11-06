import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import { NamingBoard } from '@/ui/naming/NamingScreen';

const css = readFileSync(new URL('./naming.css', import.meta.url), 'utf8');
const done = () => undefined;

describe('the naming screen (story 2.4)', () => {
  it('asks who he is, with a name field and the six looks', () => {
    const html = renderToString(<NamingBoard onDone={done} />);
    expect(html).toContain(hr.naming.ask);
    expect(html).toContain('<input');
    expect(html).toContain('autoCapitalize="words"');
    for (const label of hr.naming.looks) expect(html).toContain(`aria-label="${label}"`);
    expect(html.match(/class="naming__look"/g)).toHaveLength(6);
  });

  it('keeps the confirm button off until he has a name and a look', () => {
    const confirm = (html: string) => html.match(/<button type="submit"[^>]*>/)?.[0] ?? '';
    expect(confirm(renderToString(<NamingBoard onDone={done} />))).toContain(
      'aria-disabled="true"',
    );
    const nameOnly = { name: 'Ivo', look: null, replied: false };
    expect(confirm(renderToString(<NamingBoard onDone={done} initial={nameOnly} />))).toContain(
      'aria-disabled="true"',
    );
    const both = { name: 'Ivo', look: 'look-2' as const, replied: false };
    const html = renderToString(<NamingBoard onDone={done} initial={both} />);
    expect(confirm(html)).toContain('aria-disabled="false"');
    // Never `disabled`, so Enter on the keyboard still reaches the form.
    expect(confirm(html)).not.toMatch(/ disabled/);
    expect(html).toMatch(/aria-pressed="true" aria-label="[^"]*"/);
  });

  it('has Penkala answer with his name', () => {
    const replied = { name: ' Ivo ', look: 'look-2' as const, replied: true };
    const html = renderToString(<NamingBoard onDone={done} initial={replied} />);
    expect(html).toContain(hr.naming.reply('Ivo'));
    expect(html).toContain(hr.naming.next);
  });

  it('shows every look in grey (NFR12), with targets of at least 48 CSS px', () => {
    expect(css).toMatch(/\.naming__look img,\s*\.naming__portrait \{[^}]*filter: grayscale\(1\)/);
    expect(css).toMatch(/\.naming__look \{[^}]*min-height: 48px/);
    expect(css).toMatch(/\.naming__button \{[^}]*min-height: 48px/);
    expect(css).toMatch(/\.naming__input \{[^}]*min-height: 48px/);
  });
});
