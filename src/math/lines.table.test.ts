import { describe, expect, it } from 'vitest';
import { check } from '@/math/check';
import type { Equation } from '@/math/expr';
import { LINE_TABLE, type LineRow } from '@/math/lines.table';
import { parse } from '@/math/parse';

function equation(text: string): Equation {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.equation;
}

/** The stage and the committed lines before the row's line, each accepted in turn. */
function committed(row: LineRow): Equation[] {
  const lines = [equation(row.stage)];
  for (const text of row.before ?? []) {
    const verdict = check(lines, text);
    if (verdict.kind !== 'valid' && verdict.kind !== 'answer') {
      throw new Error(`committed line "${text}" of ${row.stage} is ${verdict.kind}`);
    }
    lines.push(equation(text));
  }
  return lines;
}

function label(row: LineRow): string {
  const before = (row.before ?? []).map((text) => `${text} → `).join('');
  const expected = row.verdict === 'valid' ? `valid, progress ${row.progress}` : row.verdict;
  const note = row.note === undefined ? '' : ` (${row.note})`;
  return `${before}"${row.line}" is ${expected}${note}`;
}

describe.each(Object.entries(LINE_TABLE))('%s', (_name, rows) => {
  it.each(rows.map((row) => [label(row), row] as const))('%s', (_label, row) => {
    const verdict = check(committed(row), row.line);
    expect(verdict.kind).toBe(row.verdict);
    if (row.verdict === 'valid' && verdict.kind === 'valid') {
      expect(verdict.progress).toBe(row.progress);
      if (row.move !== undefined) expect(verdict.move.kind).toBe(row.move);
    }
  });
});

describe('the line table', () => {
  const rows = Object.values(LINE_TABLE).flat();

  it('covers every stage of rooms 1–4', () => {
    const stages = new Set(rows.map((row) => row.stage));
    for (const stage of [
      'x + 4 = 9',
      '3x = 12',
      'x : 3 = 5',
      'x − 6 = 8',
      '20 − x = 6',
      '2x + 5 = 23',
    ]) {
      expect(stages, stage).toContain(stage);
    }
  });

  it('has, for each stage, a check line and at least two wrong lines', () => {
    for (const stage of new Set(rows.map((row) => row.stage))) {
      const kinds = rows.filter((row) => row.stage === stage).map((row) => row.verdict);
      expect(kinds, stage).toContain('check');
      expect(kinds.filter((kind) => kind === 'wrong').length, stage).toBeGreaterThanOrEqual(2);
    }
  });

  it('has no duplicate rows', () => {
    const keys = rows.map((row) => JSON.stringify([row.stage, row.before ?? [], row.line]));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
