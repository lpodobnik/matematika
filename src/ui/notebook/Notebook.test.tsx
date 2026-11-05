import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { hr } from '@/content/text/hr';
import { formatTokens } from '@/math/format';
import { tokenize } from '@/math/tokens';
import { enterLine, lineDisplays, typeToken } from '@/room/notebook';
import { enterRoom } from '@/room/room';
import type { RoomState } from '@/room/types';
import { Notebook, NotebookPage, type NotebookPageProps } from '@/ui/notebook/Notebook';

const css = readFileSync(new URL('./notebook.css', import.meta.url), 'utf8');

function typed(room: RoomState, text: string): RoomState {
  const result = tokenize(text);
  if (!result.ok) throw new Error(text);
  return result.tokens.reduce((current, token) => typeToken(current, token)?.room ?? current, room);
}

/** The page's props for a room, as the Notebook container derives them from the store. */
function propsFor(room: RoomState, extra: Partial<NotebookPageProps> = {}): NotebookPageProps {
  const { stage } = room;
  return {
    lines: lineDisplays(stage.lines),
    draft: formatTokens(stage.draft),
    wrong: stage.jam?.kind === 'line',
    refused: stage.refused,
    writes: true,
    aside: false,
    onKey: () => {},
    onSlide: () => {},
    ...extra,
  };
}

const page = (room: RoomState, extra: Partial<NotebookPageProps> = {}) =>
  renderToString(<NotebookPage {...propsFor(room, extra)} />);

/** The declarations of the first rule for `selector` in `source`. */
function rule(source: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
}

function px(declarations: string, property: string): number {
  const value = declarations.match(new RegExp(`(?:^|[\\s;])${property}:\\s*([^;]+);`))?.[1] ?? '';
  return Number.parseFloat(value.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? 'NaN');
}

/** The body of the media block that starts with `query`. */
function mediaBlock(query: string): string {
  const start = css.indexOf(`@media ${query}`);
  if (start < 0) return '';
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') depth -= 1;
    if (depth === 0) return css.slice(css.indexOf('{', start) + 1, i);
  }
  return '';
}

describe('the notebook page', () => {
  it('opens with the stage equation as its first line, read-only, and an empty draft', () => {
    const html = page(enterRoom(r01).room);
    expect(html).toMatch(
      /<li class="line line--given"><span class="line__text">x \+ 4 = 9<\/span><\/li>/,
    );
    expect(html).toContain('class="line line--draft"');
  });

  it('is never an input: no <input>, <textarea> or editable text, so no OS keyboard', () => {
    const html = page(typed(enterRoom(r01).room, 'x = 5'));
    expect(html).not.toMatch(/<input|<textarea|<select|contenteditable/i);
  });

  it('has the 20 pad keys as buttons, never focused, with delete and enter named in hr.ts', () => {
    const html = page(enterRoom(r01).room);
    const keys = html.match(/<button[^>]*class="pad__key[^"]*"[^>]*>/g) ?? [];
    expect(keys).toHaveLength(20);
    expect(
      keys.every((key) => key.includes('tabindex="-1"') && key.includes('type="button"')),
    ).toBe(true);
    expect(html).toContain(`aria-label="${hr.notebook.delete}"`);
    expect(html).toContain(`aria-label="${hr.notebook.enter}"`);
    for (const face of ['7', 'x', '+', '−', '·', ':', '=', '(', ')']) {
      expect(html).toContain(`aria-label="${face}"`);
    }
  });

  it('shows the draft in school notation as he types: 5905 shows as 5 905', () => {
    const html = page(typed(enterRoom(r01).room, '5905-27x=316'));
    expect(html).toContain('<span class="line__text">5 905 − 27x = 316</span>');
  });

  it('marks a wrong line in the draft, and nothing else', () => {
    const wrong = enterLine(typed(enterRoom(r01).room, 'x = 6'))?.room;
    if (!wrong) throw new Error('enter was ignored');
    expect(page(wrong)).toContain('class="line line--draft line--wrong"');
    expect(page(typed(enterRoom(r01).room, 'x = 6'))).not.toContain('line--wrong');
  });

  it('wiggles the draft after a refusal, and not before', () => {
    const room = typed(enterRoom(r01).room, 'x +');
    expect(page(room)).not.toContain('line--wiggle');
    const refused = enterLine(room)?.room;
    if (!refused) throw new Error('enter was ignored');
    expect(page(refused)).toContain('class="line line--draft line--wiggle"');
  });

  it('appends committed lines under line 0, read-only, and empties the draft', () => {
    const room = enterLine(typed(enterRoom(r01).room, 'x=9-4'))?.room;
    if (!room) throw new Error('enter was ignored');
    const html = page(room);
    expect(html).toMatch(/line--given[\s\S]*x \+ 4 = 9[\s\S]*line--written[\s\S]*x = 9 − 4/);
    expect(html).toContain('<li class="line line--draft"><span class="line__text"></span>');
  });

  it('shows the caret only while the notebook takes keys, and turns the keys off', () => {
    const room = enterRoom(r01).room;
    expect(page(room)).toContain('line__caret');
    const off = page(room, { writes: false });
    expect(off).not.toContain('line__caret');
    expect((off.match(/<button[^>]*class="pad__key[^>]*disabled=""/g) ?? []).length).toBe(20);
  });

  it('has a handle that pushes the notebook aside or brings it back', () => {
    const room = enterRoom(r01).room;
    expect(page(room)).toContain(`aria-label="${hr.notebook.pushAside}"`);
    expect(page(room)).toContain('data-aside="false"');
    const aside = page(room, { aside: true });
    expect(aside).toContain(`aria-label="${hr.notebook.bringBack}"`);
    expect(aside).toContain('data-aside="true"');
  });

  it('renders from the store with no room yet, with the keys off', () => {
    const html = renderToString(<Notebook />);
    expect(html).toContain('notebook-area');
    expect((html.match(/disabled=""/g) ?? []).length).toBe(20);
  });
});

describe('notebook.css', () => {
  it('makes every key at least 48 CSS px both ways, also in the pad grid', () => {
    const key = rule(css, '.pad__key');
    expect(px(key, 'min-width')).toBeGreaterThanOrEqual(48);
    expect(px(key, 'min-height')).toBeGreaterThanOrEqual(48);
    const pad = rule(css, '.pad');
    expect(pad).toMatch(/grid-template-columns:\s*repeat\(5,\s*minmax\(48px,\s*1fr\)\)/);
    expect(pad).toMatch(/grid-auto-rows:\s*clamp\(48px,/);
  });

  it('fits five 48 px keys across the narrowest notebook', () => {
    // Tablet: clamp(280px, …); phone: clamp(280px, …). Five keys, four gaps, the padding.
    const gap = px(rule(css, '.pad'), 'gap');
    const padding = px(rule(css, '.notebook'), 'padding');
    const needed = 5 * 48 + 4 * gap + 2 * padding;
    expect(rule(css, '.notebook-area')).toMatch(/flex:\s*0 0 clamp\(280px,/);
    expect(mediaBlock('(max-height: 499.98px)')).toMatch(/width:\s*clamp\(280px,/);
    expect(needed).toBeLessThanOrEqual(280);
  });

  it('sits beside the scale on the tablet, with no handle', () => {
    const area = rule(css, '.notebook-area');
    expect(area).toMatch(/position:\s*relative;/);
    expect(area).toMatch(/flex:\s*0 0 /);
    expect(rule(css, '.notebook__handle')).toMatch(/display:\s*none;/);
  });

  it('slides over the scale on a phone under 500 CSS px tall, and can be pushed aside', () => {
    const phone = mediaBlock('(max-height: 499.98px)');
    const area = rule(phone, '.notebook-area');
    expect(area).toMatch(/position:\s*absolute;/);
    expect(area).toMatch(/right:\s*0;/);
    expect(area).toMatch(/transition:\s*transform/);
    expect(rule(phone, '.notebook-area[data-aside="true"]')).toMatch(
      /transform:\s*translateX\(100%\);/,
    );
    const handle = rule(phone, '.notebook__handle');
    expect(handle).toMatch(/display:\s*flex;/);
    expect(px(handle, 'width')).toBeGreaterThanOrEqual(48);
    expect(px(handle, 'height')).toBeGreaterThanOrEqual(48);
  });

  it('has no hover states', () => {
    expect(css).not.toContain(':hover');
  });

  it('marks a wrong line by shape as well as colour', () => {
    expect(rule(css, '.line--wrong .line__text')).toMatch(/text-decoration:\s*underline wavy/);
  });
});
