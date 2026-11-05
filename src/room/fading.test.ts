import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { formatLine } from '@/math/format';
import { BLANK } from '@/math/tokens';
import { answerTemplate, checkTemplate, openingTemplates } from '@/room/fading';
import type { StageSpec } from '@/room/types';

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
