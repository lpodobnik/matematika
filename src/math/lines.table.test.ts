import { describe, expect, it } from 'vitest';
import { rooms } from '@/content/rooms';
import { check, stageSolution } from '@/math/check';
import { type Equation, hasX } from '@/math/expr';
import { formatEquation } from '@/math/format';
import { LINE_TABLE, type LineRow } from '@/math/lines.table';
import { parse } from '@/math/parse';
import { canonicalSolution } from '@/math/steps';

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

  it('covers every stage of rooms 1–13', () => {
    const stages = new Set(rows.map((row) => row.stage));
    for (const stage of [
      'x + 4 = 9',
      '3x = 12',
      'x : 3 = 5',
      'x − 6 = 8',
      '20 − x = 6',
      '2x + 5 = 23',
      '3x + 4 = 22',
      '3x + 4 = 25',
      'x + 56 = 58 + 27',
      '3x − 1 = 17',
      '4x + 9 = 41',
      '135 − 5x = 100',
      '60 + 3x = 90',
      '5 + 2x = 19',
      '27x + 316 = 5 905',
      '2x − 1 = 7',
      '3x + 4 = 19',
      '3x + 5 = 20',
      '50 − 4x = 34',
    ]) {
      expect(stages, stage).toContain(stage);
    }
  });

  // Story 6.1 (NFR11): every stage of every authored room, read off the rooms themselves, so
  // a room added or changed can't slip past the table.
  it('covers every stage of all 13 rooms, as the rooms are authored', () => {
    const keys = new Set(rows.map((row) => lineKey(row.stage)));
    const authored = rooms.flatMap((room) =>
      room.stages.map((stage, index) => ({
        id: `${room.id} stage ${index + 1}`,
        text: stage.machines[0]?.equation ?? '',
      })),
    );
    expect(new Set(rooms.map((room) => room.id)).size).toBe(13);
    for (const { id, text } of authored) expect(keys.has(lineKey(text)), id).toBe(true);
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

/**
 * A line as the table can be searched for it: in school notation when it parses, so
 * spacing and the thousands separator don't matter; otherwise as typed, without spaces.
 */
function lineKey(text: string | Equation): string {
  if (typeof text !== 'string') return formatEquation(text);
  const parsed = parse(text);
  return parsed.ok ? formatEquation(parsed.equation) : text.replace(/\s/g, '');
}

const allRows = Object.values(LINE_TABLE).flat();

/** The rows for `line` on `stage` after exactly the committed lines `before`. */
function rowsFor(
  stage: string,
  before: readonly (string | Equation)[],
  line: string | Equation,
): LineRow[] {
  const wanted = JSON.stringify([lineKey(stage), before.map(lineKey), lineKey(line)]);
  return allRows.filter(
    (row) =>
      JSON.stringify([lineKey(row.stage), (row.before ?? []).map(lineKey), lineKey(row.line)]) ===
      wanted,
  );
}

/**
 * Every line in epic 1's acceptance criteria (epics.md, stories 1.2–1.11), with the stage
 * it is checked on and the lines committed before it. Story 1.2's parsing examples are
 * checked on the stage they belong to; Try values' blanks (`x = ☐`, `☐ + 4 = 9`, story 1.7)
 * are the lines they become once filled.
 */
const epicOneLines: readonly { story: string; stage: string; before?: string[]; line: string }[] = [
  { story: '1.2', stage: '2x + 7 = 25', line: '2x + 7 = 25' },
  { story: '1.2', stage: 'x : 3 = 5', line: 'x : 3 = 5' },
  { story: '1.2', stage: '20 − x = 6', line: '20 − x = 6' },
  { story: '1.2', stage: '2x + 7 = 25', before: ['x = 9'], line: '2 · 9 + 7 = 25' },
  { story: '1.2', stage: '2x + 7 = 25', line: '9 = x' },
  { story: '1.2', stage: '27x + 316 = 5 905', line: '27x + 316 = 5 905' },
  { story: '1.2', stage: '2x + 7 = 25', line: '2x + = 25' },
  { story: '1.2', stage: '2x + 7 = 25', line: '= 9' },
  { story: '1.2', stage: '2x + 7 = 25', line: 'x =' },
  { story: '1.2', stage: '20 − x = 6', line: '−x = 14' },
  { story: '1.2', stage: '2x + 7 = 25', line: '2x = 25 − 7 = 18' },
  { story: '1.2', stage: '3x = 12', line: 'x3 = 12' },
  { story: '1.2', stage: '2x + 7 = 25', line: 'x = 10000000' },
  { story: '1.2', stage: '2x + 7 = 25', line: 'x + 1 = x + 2' },
  { story: '1.2', stage: '2x + 7 = 25', line: '2x = 2x' },
  { story: '1.3', stage: '2x + 7 = 25', line: '2x = 18' },
  { story: '1.3', stage: '2x + 7 = 25', line: '2x = 25 − 7' },
  { story: '1.3', stage: '2x + 7 = 25', line: 'x = 18 : 2' },
  { story: '1.3', stage: '2x + 7 = 25', line: 'x = 9' },
  { story: '1.3', stage: '2x + 7 = 25', line: '2x = 32' },
  { story: '1.3', stage: '2x + 7 = 25', line: 'x = 16' },
  { story: '1.3', stage: '2x + 7 = 25', line: '2 + x = 25' },
  { story: '1.3', stage: '2x + 7 = 25', line: '2x + 8 = 26' },
  { story: '1.3', stage: '2x + 7 = 25', line: 'x = 18 : 0' },
  { story: '1.3', stage: '2x + 7 = 25', line: 'x3 = 9' },
  { story: '1.3', stage: '2x + 7 = 25', before: ['x = 9'], line: '9 · 2 + 7 = 25' },
  { story: '1.3', stage: '2x + 7 = 25', before: ['x = 9'], line: '25 = 25' },
  { story: '1.3', stage: '2x + 7 = 25', before: ['x = 9'], line: '2 · 8 + 7 = 25' },
  { story: '1.3', stage: '2x + 7 = 25', line: '2 · 9 + 7 = 25' },
  { story: '1.3', stage: '2x + 7 = 25', before: ['2x = 25 − 7'], line: '2x = 18' },
  {
    story: '1.3',
    stage: '2x + 7 = 25',
    before: ['2x = 25 − 7', '2x = 18'],
    line: 'x = 18 : 2',
  },
  {
    story: '1.3',
    stage: '2x + 7 = 25',
    before: ['2x = 25 − 7', '2x = 18', 'x = 18 : 2'],
    line: 'x = 9',
  },
  { story: '1.3', stage: '2x + 5 = 23', line: '2x = 18' },
  { story: '1.3', stage: '2x + 5 = 23', before: ['2x = 18'], line: 'x = 9' },
  { story: '1.4', stage: 'x + 4 = 9', line: 'x + 4 = 9' },
  { story: '1.4', stage: '2x + 5 = 23', before: ['x = 9'], line: '2 · 9 + 5 = 23' },
  { story: '1.4', stage: '3x = 12', before: ['x = 4'], line: '3 · 4 = 12' },
  { story: '1.4', stage: 'x : 3 = 5', before: ['x = 15'], line: '15 : 3 = 5' },
  { story: '1.7', stage: 'x + 4 = 9', line: 'x = 5' },
  { story: '1.7', stage: 'x + 4 = 9', before: ['x = 5'], line: '5 + 4 = 9' },
  { story: '1.8', stage: '3x = 12', line: '3x = 12' },
  { story: '1.9', stage: 'x − 6 = 8', line: 'x − 6 = 8' },
  { story: '1.9', stage: '20 − x = 6', line: '20 − x = 6' },
  { story: '1.10', stage: '2x + 5 = 23', line: '2x + 5 = 23' },
  { story: '1.10', stage: '2x + 5 = 23', line: '2x = 23' },
  { story: '1.10', stage: '2x + 5 = 23', line: 'x = 9' },
  { story: '1.10', stage: '2x + 5 = 23', before: ['x = 9'], line: '2 · 9 + 5 = 23' },
  { story: '1.11', stage: '2x + 5 = 23', line: '2x = 23 − 5' },
  { story: '1.11', stage: '2x + 5 = 23', before: ['2x = 23 − 5'], line: 'x = 9' },
  {
    story: '1.11',
    stage: '2x + 5 = 23',
    before: ['2x = 18', 'x = 9'],
    line: '2 · 9 + 5 = 23',
  },
];

describe('epic 1 in the table (story 1.13)', () => {
  it.each(
    epicOneLines.map(
      (entry) => [`${entry.story}: ${entry.line} on ${entry.stage}`, entry] as const,
    ),
  )('has %s, with its verdict', (_label, entry) => {
    expect(rowsFor(entry.stage, entry.before ?? [], entry.line).length).toBeGreaterThan(0);
  });

  const stages = rooms.flatMap((room) =>
    room.stages.map((stage, index) => ({
      id: `${room.id} stage ${index + 1}`,
      text: stage.machines[0]?.equation ?? '',
      ways: stage.ways,
      trayGear: stage.trayGear === true,
    })),
  );

  describe.each(stages)('$id: $text', ({ text, ways, trayGear }) => {
    const stage = equation(text);
    const rows = allRows.filter((row) => lineKey(row.stage) === lineKey(text));

    it('has the canonical solution of every way that finishes it (steps.ts), line by line', () => {
      for (const way of ways) {
        const lines = canonicalSolution(stage, way, { trayGear }) ?? [];
        expect(lines.length, way).toBeGreaterThanOrEqual(2);
        lines.forEach((line, index) => {
          const found = rowsFor(text, lines.slice(0, index), line);
          expect(found.length, `${way}: ${formatEquation(line)}`).toBeGreaterThan(0);
        });
      }
    });

    it('has a skipped-step solution: the answer straight after the equation, then the check', () => {
      const answers = rows.filter((row) => row.verdict === 'answer');
      const direct = answers.find((row) => (row.before ?? []).length === 0);
      expect(direct, 'x = n with nothing before it').toBeDefined();
      if (!direct) return;
      const checked = rows.filter(
        (row) =>
          row.verdict === 'check' &&
          (row.before ?? []).length === 1 &&
          lineKey(row.before?.[0] ?? '') === lineKey(direct.line),
      );
      expect(checked.length, 'the check line after it').toBeGreaterThanOrEqual(1);
      // The steps it skips are in the table too: an answer line after at least one step.
      expect(answers.some((row) => (row.before ?? []).length > 0)).toBe(true);
    });

    it('has at least two wrong lines', () => {
      expect(rows.filter((row) => row.verdict === 'wrong').length).toBeGreaterThanOrEqual(2);
    });

    // Story 6.1 (NFR11): the right lines every way can write and the wrong ones a child
    // writes, in every stage of every room.
    const n = stageSolution(stage);
    const isAnswerOf = (text: string, value: number) => {
      const key = lineKey(text);
      return key === `x = ${value}` || key === `${value} = x`;
    };

    it('takes the answer either way round, x = n and n = x', () => {
      const answers = rows.filter((row) => row.verdict === 'answer');
      expect(answers.some((row) => lineKey(row.line) === `x = ${n}`)).toBe(true);
      expect(answers.some((row) => lineKey(row.line) === `${n} = x`)).toBe(true);
    });

    it('refuses a wrong answer straight after the equation', () => {
      const wrongAnswers = rows.filter(
        (row) =>
          row.verdict === 'wrong' &&
          (row.before ?? []).length === 0 &&
          /^x = \d[\d ]*$/.test(lineKey(row.line)),
      );
      expect(wrongAnswers.length).toBeGreaterThan(0);
      for (const row of wrongAnswers) expect(isAnswerOf(row.line, n)).toBe(false);
    });

    it('refuses a check line with the wrong number in it, after the answer', () => {
      const wrongChecks = rows.filter((row) => {
        if (row.verdict !== 'wrong' || (row.before ?? []).length === 0) return false;
        const parsed = parse(row.line);
        return parsed.ok && !hasX(parsed.equation.left) && !hasX(parsed.equation.right);
      });
      expect(wrongChecks.length).toBeGreaterThan(0);
    });
  });
});
