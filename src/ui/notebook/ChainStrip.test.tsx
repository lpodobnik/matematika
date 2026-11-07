import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import type { ChainView } from '@/room/chain';
import { ChainStrip, pickAfterKey, pickedLink, pickText } from '@/ui/notebook/ChainStrip';
import { NotebookPage } from '@/ui/notebook/Notebook';

const css = readFileSync(new URL('./notebook.css', import.meta.url), 'utf8');

const tram: ChainView = {
  links: [
    { op: 'mul', n: 4, dark: false },
    { op: 'add', n: 9, dark: false },
  ],
  output: 41,
  tappable: 1,
};

const noop = () => {};

function strip(view: ChainView, pick: Parameters<typeof ChainStrip>[0]['pick'] = null) {
  return renderToString(
    <ChainStrip view={view} pick={pick} onTap={noop} onOp={noop} onRun={noop} onCancel={noop} />,
  );
}

describe('the gear chain strip (story 4.1)', () => {
  it('draws x, the links and the output, with only the last link a button', () => {
    const html = strip(tram);
    expect(html).toContain('>x<');
    expect(html).toContain('· 4');
    expect(html).toContain('+ 9');
    expect(html).toContain('41');
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain(hr.chain.tap('+ 9'));
  });

  it('draws undone links dark, and no button while the chain doesn’t work', () => {
    const html = strip({
      links: [
        { op: 'mul', n: 4, dark: false },
        { op: 'add', n: 9, dark: true },
      ],
      output: 32,
      tappable: null,
    });
    expect(html).toContain('data-dark="true"');
    expect(html).not.toContain('<button');
    expect(css).toMatch(/\.chain__link\[data-dark="true"\] \{[^}]*background: var\(--ink\)/);
  });

  it('says why when the pans are not a chain', () => {
    expect(strip({ links: null, output: null, tappable: null })).toContain(hr.chain.off);
  });

  it('opens the picker with every operation, never the answer', () => {
    const html = strip(tram, { op: null, digits: '' });
    for (const op of ['plus', 'minus', 'puta', 'podijeljeno', 'broj minus lanac']) {
      expect(html).toContain(`aria-label="${op}"`);
    }
    expect(html).toContain(hr.chain.pickOp);
    expect(html).toMatch(/chain-pick__run"[^>]*disabled/);
    expect(html).not.toContain('− 9');
  });

  it('keeps every control at least 48 CSS px on the tablet', () => {
    expect(css).toMatch(/\.chain__link--last \{[^}]*min-width: 48px;[^}]*min-height: 48px/);
    expect(css).toMatch(/\.chain-pick__cancel \{[^}]*min-width: 48px;[^}]*min-height: 48px/);
  });
});

describe('the pick (story 4.1)', () => {
  it('types digits, takes them back, then the operation, and runs once it has both', () => {
    let pick = { op: 'sub' as const, digits: '' } as Parameters<typeof pickAfterKey>[0];
    expect(pickText(pick)).toBe('− …');
    pick = pickAfterKey(pick, '9').pick;
    expect(pickText(pick)).toBe('− 9');
    expect(pickedLink(pick)).toEqual({ op: 'sub', n: 9 });
    expect(pickAfterKey(pick, 'enter').run).toBe(true);
    expect(pickAfterKey(pick, 'x').pick).toBe(pick);
    pick = pickAfterKey(pick, 'delete').pick;
    expect(pick.digits).toBe('');
    expect(pickAfterKey(pick, 'enter').run).toBe(false);
    expect(pickAfterKey(pick, 'delete').pick.op).toBeNull();
  });

  it('picks the operation from a computer’s keys', () => {
    expect(pickAfterKey({ op: null, digits: '' }, '−').pick.op).toBe('sub');
    expect(pickAfterKey({ op: 'sub', digits: '9' }, ':').pick).toEqual({ op: 'div', digits: '9' });
  });

  it('keeps every control at least 48 CSS px on a phone too (story 4.1 review)', () => {
    const phone = css.slice(css.indexOf('@media (max-height: 499.98px) {\n  .chain {'));
    expect(phone).toMatch(/\.chain__link--last \{[^}]*min-height: 48px/);
    expect(phone).toMatch(/\.chain-pick__cancel \{[^}]*min-height: 48px/);
    expect(phone).toMatch(/\.chain-pick__op,\s*\.chain-pick__run,[^}]*min-height: 48px/);
  });

  it('reads n − ☐ for the number-minus-chain operation', () => {
    expect(pickText({ op: 'from', digits: '' })).toBe('… − ☐');
    expect(pickText({ op: 'from', digits: '135' })).toBe('135 − ☐');
  });

  it('turns the pad’s other keys off while the picker is open', () => {
    const html = renderToString(
      <NotebookPage
        lines={[]}
        draft={[]}
        upcoming={[]}
        blank={false}
        wrong={false}
        refused={0}
        writes={false}
        aside={false}
        chain={tram}
        pick={{ op: 'sub', digits: '' }}
        onKey={noop}
        onSlide={noop}
      />,
    );
    expect(html).toMatch(/data-key="x"[^>]*disabled|disabled[^>]*data-key="x"/);
    expect(html).not.toMatch(/data-key="7"[^>]*disabled=""|disabled=""[^>]*data-key="7"/);
  });
});
