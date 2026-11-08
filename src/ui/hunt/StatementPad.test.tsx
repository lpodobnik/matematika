import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { STATEMENT_TOKENS, type SToken } from '@/math/statement-tokens';
import { padLayout, StatementPad, signsOnPage } from '@/ui/hunt/StatementPad';

const signs: readonly SToken[] = ['+', '−', '·', ':', '=', '<', '>', '≤', '≥', '≠', '∈', '∉'];

describe('the pad of part 2', () => {
  it('keeps the digits where the rooms’ pad has them', () => {
    const layout = padLayout([]);
    expect(layout.slice(0, 3)).toEqual(['7', '8', '9']);
    expect(layout.slice(5, 8)).toEqual(['4', '5', '6']);
    expect(layout.slice(10, 13)).toEqual(['1', '2', '3']);
    expect(layout[15]).toBe('0');
    expect(layout.slice(-2)).toEqual(['delete', 'enter']);
    expect(layout).toHaveLength(20);
  });

  it('shows only the signs a line needs', () => {
    expect(signsOnPage(['+', '='], 0)).toEqual(['+', '=']);
    const html = renderToString(<StatementPad signs={['+', '=']} onKey={() => undefined} />);
    expect(html).toContain('data-key="+"');
    expect(html).not.toContain('data-key="−"');
    expect(html).not.toContain('data-key="more"');
  });

  it('turns the page when more signs than fit, and every sign can be reached', () => {
    const seen = new Set<string>();
    for (let page = 0; page < 3; page++) {
      const shown = signsOnPage(signs, page);
      expect(shown.length).toBeLessThanOrEqual(8);
      expect(shown[shown.length - 1]).toBe('more');
      for (const sign of shown) seen.add(sign);
    }
    for (const sign of signs) expect(seen.has(sign)).toBe(true);
  });

  it('reaches every sign there is, on as many pages as it takes', () => {
    const all = STATEMENT_TOKENS.filter((token) => !/^[0-9]$/.test(token));
    const seen = new Set<string>();
    for (let page = 0; page < 6; page++) {
      for (const sign of signsOnPage(all, page)) seen.add(sign);
    }
    for (const sign of all) expect(seen.has(sign)).toBe(true);
  });

  it('never opens the keyboard: it holds no input', () => {
    const html = renderToString(<StatementPad signs={signs} onKey={() => undefined} />);
    expect(html).not.toContain('<input');
  });
});
