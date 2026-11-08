import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r04 } from '@/content/rooms/r04-water-wheel';
import type { Equation } from '@/math/expr';
import { formatLine } from '@/math/format';
import { parse } from '@/math/parse';
import { BLANK, type LineToken, tokenize } from '@/math/tokens';
import {
  answerTemplate,
  blanksOnceAlone,
  checkTemplate,
  lastLines,
  openingTemplates,
  withLastLines,
} from '@/room/fading';
import { xAlone } from '@/room/pieces';
import { arriveAtStage } from '@/room/room';
import type { NotebookLine, StageSpec } from '@/room/types';

const roomOne = r01.stages[0] as StageSpec;

function stageWith(equation: string, fading: StageSpec['fading']): StageSpec {
  return { ...roomOne, machines: [{ equation }], fading };
}

const text = (line: ReturnType<typeof formatLine>) =>
  line.map((segment) => (segment.kind === 'blank' ? '☐' : segment.text)).join('');

describe('Try values blanks', () => {
  it('opens with x = ☐, then the check line with x blanked: ☐ + 4 = 9 in room 1', () => {
    const [answer, check, ...rest] = openingTemplates(roomOne, 0);
    expect(rest).toEqual([]);
    expect(answer).toEqual(['x', '=', BLANK]);
    expect(text(formatLine(answer ?? []))).toBe('x = ☐');
    expect(text(formatLine(check ?? []))).toBe('☐ + 4 = 9');
  });

  it('writes the check line as school writes it, with · where x stood after a number', () => {
    const lines = (equation: string) => text(formatLine(checkTemplate(stageWith(equation, {}), 0)));
    expect(lines('3x = 12')).toBe('3 · ☐ = 12');
    expect(lines('x : 3 = 5')).toBe('☐ : 3 = 5');
    expect(lines('x − 6 = 8')).toBe('☐ − 6 = 8');
    expect(lines('20 − x = 6')).toBe('20 − ☐ = 6');
    expect(lines('5 905 − 27x = 316')).toBe('5 905 − 27 · ☐ = 316');
  });

  it('opens with nothing to fill in blank mode, or with no Try values fading', () => {
    expect(
      openingTemplates(stageWith('2x + 5 = 23', { try: 'blank', balance: 'auto' }), 0),
    ).toEqual([]);
    expect(openingTemplates(stageWith('2x + 5 = 23', { balance: 'auto' }), 0)).toEqual([]);
  });

  it('gives each stage its own copy of x = ☐', () => {
    const [first] = openingTemplates(roomOne, 0);
    first?.push('1');
    expect(answerTemplate).toEqual(['x', '=', BLANK]);
  });

  it('refuses a machine the stage does not have', () => {
    expect(() => checkTemplate(roomOne, 1)).toThrow(/no machine 1/);
  });
});

describe('the last two lines as blanks once x is alone (story 1.16)', () => {
  const wheel = r04.stages[0] as StageSpec;
  const equation = (text: string): Equation => {
    const parsed = parse(text);
    if (!parsed.ok) throw new Error(text);
    return parsed.equation;
  };
  const line = (text: string, kind: 'valid' | 'answer' | 'check'): NotebookLine => {
    const tokenized = tokenize(text);
    if (!tokenized.ok) throw new Error(text);
    const verdict =
      kind === 'valid' ? { kind, move: { kind: 'none' as const }, progress: true } : { kind };
    return { tokens: tokenized.tokens, source: 'typed', verdict };
  };
  const given = line('2x + 5 = 23', 'valid');
  const shown = (lines: LineToken[][] | null) => lines?.map((each) => text(formatLine(each)));

  it('knows x alone: a single x against a number, either way round, as a split leaves it', () => {
    for (const each of ['x = 9', '9 = x', '2x : 2 = 18 : 2', 'x + 5 − 5 = 9', 'x = 0']) {
      expect(xAlone(equation(each)), each).toBe(true);
    }
    for (const each of ['2x = 18', 'x + 5 = 14', 'x = x : 2 + 9', 'x : 3 = 5', '9 = 9']) {
      expect(xAlone(equation(each)), each).toBe(false);
    }
  });

  it('gives them where Balance writes the lines (auto) and Try values opens with none', () => {
    expect(blanksOnceAlone(wheel)).toBe(true);
    expect(blanksOnceAlone(roomOne)).toBe(false);
    expect(blanksOnceAlone({ ...wheel, fading: { try: 'blanks', balance: 'auto' } })).toBe(false);
    expect(blanksOnceAlone({ ...wheel, fading: { try: 'blank', balance: 'blank' } })).toBe(true);
    expect(
      lastLines(roomOne, {
        machine: 0,
        pans: equation('x = 5'),
        lines: [],
        dialX: 0,
        phase: 'arrive',
        jam: null,
      }),
    ).toBeNull();
  });

  it('room 4: none until x is alone, then x = ☐ and 2 · ☐ + 5 = 23, then the check line alone', () => {
    const at = (pans: string, ...lines: NotebookLine[]) =>
      shown(
        lastLines(wheel, {
          machine: 0,
          pans: equation(pans),
          lines: [given, ...lines],
          dialX: 0,
          phase: 'arrive',
          jam: null,
        }),
      );
    expect(at('2x + 5 = 23')).toEqual([]);
    expect(at('2x = 18')).toEqual([]);
    expect(at('x = 9')).toEqual(['x = ☐', '2 · ☐ + 5 = 23']);
    expect(at('x = 9', line('x = 9', 'answer'))).toEqual(['2 · ☐ + 5 = 23']);
    // After his answer the check line stays, wherever more moves take the pans.
    expect(at('x + 3 = 12', line('x = 9', 'answer'))).toEqual(['2 · ☐ + 5 = 23']);
    expect(at('9 = 9', line('x = 9', 'answer'), line('2 · 9 + 5 = 23', 'check'))).toEqual([]);
  });

  // Story 1.16 review: 1.16 carried a refused `x = 9` into the new blank (`9`); the blanks
  // that appear now start empty, whatever was in the draft.
  it('brings the blanks up as x comes alone, empty, whatever the draft held', () => {
    const arrived = arriveAtStage(wheel);
    const alone = { ...arrived, pans: equation('x = 9') };
    expect(withLastLines(wheel, arrived)).toBe(arrived);
    const fresh = withLastLines(wheel, alone);
    expect(shown(fresh.templates)).toEqual(['x = ☐', '2 · ☐ + 5 = 23']);
    expect(fresh.draft).toEqual([]);
    const typed = (text: string) => {
      const tokenized = tokenize(text);
      if (!tokenized.ok) throw new Error(text);
      return tokenized.tokens;
    };
    expect(withLastLines(wheel, { ...alone, draft: typed('x = 9') }).draft).toEqual([]);
    expect(withLastLines(wheel, { ...alone, draft: typed('x = 12') }).draft).toEqual([]);
    expect(withLastLines(wheel, { ...alone, draft: typed('2x = 1') }).draft).toEqual([]);
    expect(withLastLines(wheel, { ...alone, draft: typed('x =') }).draft).toEqual([]);
    // Already up to date: the same stage.
    expect(withLastLines(wheel, fresh)).toBe(fresh);
  });

  it('takes them away if a move leaves x not alone before his answer, the blank’s number as text', () => {
    const filling = withLastLines(wheel, { ...arriveAtStage(wheel), pans: equation('x = 9') });
    const moved = withLastLines(wheel, { ...filling, draft: ['9'], pans: equation('x + 3 = 12') });
    expect(moved.templates).toEqual([]);
    expect(formatLine(moved.draft).map((segment) => segment.text)).toEqual(['x = 9']);
    const empty = withLastLines(wheel, { ...filling, pans: equation('x + 3 = 12') });
    expect(empty.draft).toEqual([]);
  });
});
