import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { r11 } from '@/content/rooms/r11-great-wheel';
import { hr } from '@/content/text/hr';
import { dialView } from '@/room/dial';
import { touchMachine } from '@/room/phases';
import { enterRoom } from '@/room/room';
import { FineDial, RangePanel, rangeLabels } from '@/ui/notebook/RangePanel';

function wheel() {
  const room = enterRoom(r11).room;
  return touchMachine(room)?.room ?? room;
}

describe('the range pin and the fine dial in the notebook (story 4.6)', () => {
  it('shows − x = n + in the notebook, off at the ends', () => {
    const view = dialView(wheel());
    if (!view) throw new Error('no dial');
    const html = renderToString(<FineDial dial={view} onNudge={() => {}} />);
    expect(html).toMatch(/x = (<!-- -->)?0/);
    expect(html.match(/disabled=""/g)).toHaveLength(1);
  });
  it('names its ranges in words', () => {
    expect(rangeLabels([100, 300])).toEqual([
      hr.range.under('100'),
      hr.range.between('100', '300'),
      hr.range.over('300'),
    ]);
  });
});

describe('the range panel (story 4.6 review)', () => {
  const view = { bounds: [100, 300], asks: true, at: null, confirmable: false, right: null };

  it('offers the three ranges, and Potvrdi only once one is flagged in pin', () => {
    const open = renderToString(<RangePanel view={view} onFlag={() => {}} onConfirm={() => {}} />);
    expect(open.match(/story-panel__choice/g)).toHaveLength(3);
    expect(open).not.toContain('story-panel__confirm');
    const flagged = renderToString(
      <RangePanel
        view={{ ...view, at: 1, confirmable: true }}
        onFlag={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(flagged).toContain('aria-pressed="true"');
    expect(flagged).toContain('story-panel__confirm');
  });

  it('shows the range x is in once confirmed', () => {
    const html = renderToString(
      <RangePanel
        view={{ ...view, asks: false, at: 0, right: 1 }}
        onFlag={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(html).toContain(hr.range.between('100', '300'));
    expect(html).not.toContain('story-panel__choice');
  });

  it('turns − and + off at the ends of the reach, and both off while the dial is held', () => {
    const base = dialView(wheel());
    if (!base) throw new Error('no dial');
    const top = renderToString(<FineDial dial={{ ...base, x: 30 }} onNudge={() => {}} />);
    expect(top.match(/disabled=""/g)).toHaveLength(1);
    const held = renderToString(
      <FineDial dial={{ ...base, x: 10, turns: false }} onNudge={() => {}} />,
    );
    expect(held.match(/disabled=""/g)).toHaveLength(2);
  });
});
