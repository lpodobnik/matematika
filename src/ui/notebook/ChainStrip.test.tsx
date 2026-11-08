import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import type { ChainView } from '@/room/chain';
import { ChainStrip, chainChoices } from '@/ui/notebook/ChainStrip';

const view: ChainView = {
  links: [
    { op: 'mul', n: 4, dark: false },
    { op: 'add', n: 9, dark: false },
  ],
  output: 41,
  tappable: 1,
};

describe('the way back (ChainStrip)', () => {
  it('offers exactly two answers for the last step, the numbers already in them', () => {
    const add = chainChoices({ op: 'add', n: 9 }, 41);
    expect(add.map((c) => c.right)).toEqual([false, true]);
    expect(add[1]?.link).toEqual({ op: 'sub', n: 9 });
    const sub = chainChoices({ op: 'sub', n: 9 }, 41);
    expect(sub.map((c) => c.right)).toEqual([true, false]);
    expect(chainChoices({ op: 'mul', n: 4 }, 32).map((c) => c.link.op)).toEqual(['mul', 'div']);
    expect(chainChoices({ op: 'div', n: 4 }, 32).map((c) => c.right)).toEqual([true, false]);
  });

  it('asks what ☐ is where x is taken away from a number', () => {
    const [right, wrong] = chainChoices({ op: 'from', n: 135 }, 100);
    expect(right?.text).toBe('☐ = 135 − 100');
    expect(right?.right).toBe(true);
    expect(wrong?.text).toBe('☐ = 135 + 100');
    expect(wrong?.right).toBe(false);
  });

  it('shows the steps, asks what undoes the last, and has two buttons and no typing', () => {
    const html = renderToString(<ChainStrip view={view} onRun={() => undefined} />);
    expect(html).toContain(hr.chain.label);
    expect(html).toContain(hr.chain.undo('+ 9'));
    // `chain-pick__ops` is the row around them.
    expect(html.match(/chain-pick__op"/g)).toHaveLength(2);
    expect(html).not.toContain('chain-pick__run');
  });

  it('offers nothing while there is no step to undo', () => {
    const html = renderToString(
      <ChainStrip view={{ links: null, output: null, tappable: null }} onRun={() => undefined} />,
    );
    expect(html).toContain(hr.chain.off);
    expect(html).not.toContain('chain-pick__op');
  });
});
