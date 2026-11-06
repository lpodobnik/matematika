import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { hr } from '@/content/text/hr';
import { draftDisplay, fillsBlank, lineDisplays } from '@/room/notebook';
import { touchMachine } from '@/room/phases';
import { enterRoom } from '@/room/room';
import type { RoomState } from '@/room/types';
import { NotebookPage, type NotebookPageProps } from '@/ui/notebook/Notebook';

const css = readFileSync(new URL('./hint-note.css', import.meta.url), 'utf8');

const opened = (): RoomState => {
  const room = enterRoom(r01).room;
  return touchMachine(room)?.room ?? room;
};

function page(extra: Partial<NotebookPageProps>): string {
  const { stage } = opened();
  const display = draftDisplay(stage);
  const props: NotebookPageProps = {
    lines: lineDisplays(stage.lines),
    draft: display.draft,
    upcoming: display.upcoming,
    blank: fillsBlank(stage),
    wrong: false,
    refused: 0,
    writes: true,
    aside: true,
    onKey: () => {},
    onSlide: () => {},
    ...extra,
  };
  return renderToString(<NotebookPage {...props} />);
}

describe('the hint button’s tag at the notebook (story 1.16)', () => {
  const answer = hr.hint.answer('x = 5');

  it('hangs the move to write between the lines and the pad, and pulses the draft line', () => {
    const html = page({ hint: { text: answer, presses: 2 } });
    expect(html).toContain(answer);
    expect(html).toContain('handover-note--hint');
    expect(html).toContain('class="line line--draft line--pulse"');
    const note = html.indexOf('handover-note');
    expect(note).toBeGreaterThan(html.indexOf('</ol>'));
    expect(note).toBeLessThan(html.indexOf('class="pad"'));
    // On a phone, with the notebook pushed aside, its handle pulses.
    expect(html).toContain('data-pulse="true"');
  });

  it('takes the handover tag’s place: one tag at a time', () => {
    const html = page({ handover: 'write', hint: { text: answer, presses: 2 } });
    expect(html).toContain(answer);
    expect(html).not.toContain(hr.handover.write);
    expect(page({ handover: 'write', hint: null })).toContain(hr.handover.write);
  });

  it('pops in on each press, and not under reduced motion', () => {
    expect(css).toMatch(/\.handover-note--hint\s*\{[^}]*animation:\s*hint-note-pop/);
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toMatch(/\.handover-note--hint\s*\{[^}]*animation:\s*none/);
  });
});
