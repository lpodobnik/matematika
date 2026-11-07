// The line-checker table (architecture, Testing Strategy; GDD technical metric NFR11):
// for each stage, lines that must be accepted, including skipped steps, and lines that
// must be rejected, each with its expected verdict. `lines.table.test.ts` runs every row.
// Every change to `math/` adds rows here (project-context.md, Testing).
//
// `before` lists the committed lines between the stage equation and the line, and each
// of them must itself be accepted in turn. Rooms 1–4 list, per stage, the canonical
// solution of each way (`steps.ts`), skipped-step solutions and wrong lines; story 1.13's
// tests in `lines.table.test.ts` check that they are all here, with every line of epic 1's
// acceptance criteria.

import type { MoveKind } from '@/math/moves';

export type LineRow = {
  stage: string;
  before?: readonly string[];
  line: string;
  note?: string;
} & (
  | { verdict: 'incomplete' | 'nonlinear' | 'aside' | 'wrong' | 'answer' | 'check' }
  | { verdict: 'valid'; progress: boolean; move?: MoveKind }
);

const ac = '2x + 7 = 25';
const r01 = 'x + 4 = 9';
const r02a = '3x = 12';
const r02b = 'x : 3 = 5';
const r03a = 'x − 6 = 8';
const r03b = '20 − x = 6';
const r04 = '2x + 5 = 23';
const r05a = '3x + 4 = 22';
const r05b = '3x + 4 = 25';
const r06 = 'x + 56 = 58 + 27';
const r07 = '3x − 1 = 17';
const r08 = '4x + 9 = 41';
const r09 = '135 − 5x = 100';
/** U+202F, the thousands separator the notebook writes. */
const nnbsp = ' ';
const r11 = `5${nnbsp}905 − 27x = 316`;

export const LINE_TABLE: Readonly<Record<string, readonly LineRow[]>> = {
  'story 1.3 acceptance criteria (2x + 7 = 25)': [
    { stage: ac, line: '2x = 18', verdict: 'valid', progress: true, move: 'add-both' },
    { stage: ac, line: '2x = 25 − 7', verdict: 'valid', progress: true, move: 'move-across' },
    { stage: ac, line: 'x = 18 : 2', verdict: 'valid', progress: true, move: 'compound' },
    { stage: ac, line: 'x = 9', verdict: 'answer', note: 'a skipped step' },
    { stage: ac, line: '9 = x', verdict: 'answer' },
    { stage: ac, line: '2x = 32', verdict: 'wrong' },
    { stage: ac, line: 'x = 16', verdict: 'wrong' },
    { stage: ac, line: '2 + x = 25', verdict: 'wrong' },
    { stage: ac, line: '2x + 8 = 26', verdict: 'valid', progress: false, move: 'add-both' },
    { stage: ac, line: 'x = 18 : 0', verdict: 'incomplete' },
    { stage: ac, line: '2x = 25 − 7 = 18', verdict: 'incomplete' },
    { stage: ac, line: 'x3 = 9', verdict: 'incomplete' },
    { stage: ac, before: ['x = 9'], line: '2 · 9 + 7 = 25', verdict: 'check' },
    { stage: ac, before: ['x = 9'], line: '9 · 2 + 7 = 25', verdict: 'check' },
    { stage: ac, before: ['x = 9'], line: '25 = 25', verdict: 'aside' },
    { stage: ac, before: ['x = 9'], line: '2 · 8 + 7 = 25', verdict: 'wrong' },
    { stage: ac, line: '2 · 9 + 7 = 25', verdict: 'aside', note: 'before the answer line' },
    {
      stage: ac,
      before: ['2x = 25 − 7'],
      line: '2x = 18',
      verdict: 'valid',
      progress: true,
      move: 'evaluate',
    },
    {
      stage: ac,
      before: ['2x = 25 − 7', '2x = 18'],
      line: 'x = 18 : 2',
      verdict: 'valid',
      progress: true,
      move: 'split-both',
    },
    {
      stage: ac,
      before: ['2x = 25 − 7', '2x = 18', 'x = 18 : 2'],
      line: 'x = 9',
      verdict: 'answer',
    },
  ],

  'checker rules (2x + 7 = 25)': [
    { stage: ac, line: '', verdict: 'incomplete' },
    { stage: ac, line: '2x + = 25', verdict: 'incomplete' },
    { stage: ac, line: '= 9', verdict: 'incomplete' },
    { stage: ac, line: 'x =', verdict: 'incomplete' },
    { stage: ac, line: '−x = −9', verdict: 'incomplete', note: 'a leading minus' },
    { stage: ac, line: 'x = 10000000', verdict: 'incomplete', note: 'above 9 999 999' },
    { stage: ac, line: '2x + 7 = 25 + (', verdict: 'incomplete' },
    { stage: ac, line: '2x + 7', verdict: 'incomplete', note: 'no =' },
    { stage: ac, line: 'x · x = 81', verdict: 'nonlinear' },
    { stage: ac, line: '18 : x = 2', verdict: 'nonlinear' },
    { stage: ac, line: 'x · x = 18 : 0', verdict: 'incomplete', note: 'division by zero wins' },
    { stage: ac, line: '18 : 0 = 2', verdict: 'incomplete' },
    { stage: ac, line: '25 − 7 = 18', verdict: 'aside' },
    { stage: ac, line: '25 − 7 = 17', verdict: 'wrong' },
    { stage: ac, line: 'x + 1 = x + 2', verdict: 'wrong', note: 'no solution' },
    { stage: ac, line: '2x = 2x', verdict: 'wrong', note: 'every number' },
    { stage: ac, line: 'x − x + 25 = 25', verdict: 'wrong', note: 'every number' },
    { stage: ac, line: 'x = 09', verdict: 'answer', note: 'leading zeros' },
    { stage: ac, line: 'x = 25 − 7 : 2', verdict: 'wrong', note: ': before −' },
    { stage: ac, line: 'x = (25 − 7) : 2', verdict: 'valid', progress: true },
    { stage: ac, line: '7 + 2x = 25', verdict: 'valid', progress: false, move: 'none' },
    { stage: ac, line: '25 = 2x + 7', verdict: 'valid', progress: false, move: 'swap' },
    { stage: ac, line: '2x + 7 = 25', verdict: 'valid', progress: false, move: 'none' },
    {
      stage: ac,
      line: '2x + 7 − 7 = 25 − 7',
      verdict: 'valid',
      progress: false,
      move: 'add-both',
      note: 'three terms on the x side',
    },
    {
      stage: ac,
      line: '2x + 7 = x + 16',
      verdict: 'valid',
      progress: false,
      note: 'x on both sides',
    },
    { stage: ac, line: '2 · (x + 3) + 1 = 25', verdict: 'valid', progress: false },
    {
      stage: ac,
      before: ['x = 18 : 2'],
      line: '2 · 9 + 7 = 25',
      verdict: 'aside',
      note: 'x = 18 : 2 is not the answer line',
    },
    { stage: ac, before: ['x = 9'], line: '7 + 2 · 9 = 25', verdict: 'check' },
    { stage: ac, before: ['x = 9'], line: '25 = 2 · 9 + 7', verdict: 'check' },
    { stage: ac, before: ['x = 9'], line: '18 + 7 = 25', verdict: 'aside' },
    { stage: ac, before: ['x = 9'], line: 'x = 9', verdict: 'answer' },
    { stage: ac, before: ['x = 9'], line: '2x = 18', verdict: 'valid', progress: false },
    { stage: ac, before: ['9 = x'], line: '2 · 9 + 7 = 25', verdict: 'check' },
  ],

  'r01 door lift (x + 4 = 9)': [
    { stage: r01, line: 'x = 5', verdict: 'answer', note: 'Try values and Balance' },
    { stage: r01, before: ['x = 5'], line: '5 + 4 = 9', verdict: 'check' },
    { stage: r01, before: ['x = 5'], line: '4 + 5 = 9', verdict: 'check' },
    { stage: r01, line: 'x = 9 − 4', verdict: 'valid', progress: true, move: 'move-across' },
    { stage: r01, before: ['x = 9 − 4'], line: 'x = 5', verdict: 'answer' },
    { stage: r01, line: 'x = 13', verdict: 'wrong' },
    { stage: r01, line: 'x = 4', verdict: 'wrong' },
    { stage: r01, line: 'x = 5 + 4', verdict: 'wrong' },
    { stage: r01, line: 'x + 4 = 10', verdict: 'wrong' },
    { stage: r01, line: 'x + 5 = 10', verdict: 'valid', progress: false, move: 'add-both' },
    { stage: r01, line: '9 = x + 4', verdict: 'valid', progress: false, move: 'swap' },
    { stage: r01, line: '5 + 4 = 9', verdict: 'aside' },
    { stage: r01, before: ['x = 5'], line: '6 + 4 = 9', verdict: 'wrong' },
  ],

  'r02 street lamps, stage 1 (3x = 12)': [
    { stage: r02a, line: 'x = 4', verdict: 'answer', note: 'Try values and Balance' },
    { stage: r02a, before: ['x = 4'], line: '3 · 4 = 12', verdict: 'check' },
    { stage: r02a, before: ['x = 4'], line: '4 · 3 = 12', verdict: 'check' },
    { stage: r02a, line: 'x = 12 : 3', verdict: 'valid', progress: true, move: 'split-both' },
    { stage: r02a, before: ['x = 12 : 3'], line: 'x = 4', verdict: 'answer' },
    { stage: r02a, line: '3 + x = 12', verdict: 'wrong', note: '3x read as 3 + x' },
    { stage: r02a, line: 'x = 9', verdict: 'wrong' },
    { stage: r02a, line: 'x = 36', verdict: 'wrong' },
    { stage: r02a, line: 'x = 12 − 3', verdict: 'wrong' },
    { stage: r02a, line: 'x · 3 = 12', verdict: 'valid', progress: false, move: 'none' },
    { stage: r02a, line: '6x = 24', verdict: 'valid', progress: false, move: 'compound' },
    { stage: r02a, before: ['x = 4'], line: '3 · 3 = 12', verdict: 'wrong' },
  ],

  'r02 street lamps, stage 2 (x : 3 = 5)': [
    { stage: r02b, line: 'x = 15', verdict: 'answer', note: 'Try values' },
    { stage: r02b, before: ['x = 15'], line: '15 : 3 = 5', verdict: 'check' },
    { stage: r02b, line: 'x = 5 · 3', verdict: 'valid', progress: true, move: 'compound' },
    { stage: r02b, line: 'x = 3 · 5', verdict: 'valid', progress: true },
    { stage: r02b, before: ['x = 5 · 3'], line: 'x = 15', verdict: 'answer' },
    { stage: r02b, line: 'x = 5', verdict: 'wrong' },
    { stage: r02b, line: 'x = 8', verdict: 'wrong' },
    { stage: r02b, line: 'x = 2', verdict: 'wrong' },
    { stage: r02b, line: 'x = 15 : 3', verdict: 'wrong' },
    { stage: r02b, line: 'x : 5 = 3', verdict: 'valid', progress: false },
    { stage: r02b, line: '5 = x : 3', verdict: 'valid', progress: false, move: 'swap' },
    { stage: r02b, line: '3 : x = 5', verdict: 'nonlinear' },
    { stage: r02b, line: '15 : 3 = 5', verdict: 'aside' },
  ],

  'r03 sluice gate, stage 1 (x − 6 = 8)': [
    { stage: r03a, line: 'x = 14', verdict: 'answer', note: 'Try values and Balance' },
    { stage: r03a, before: ['x = 14'], line: '14 − 6 = 8', verdict: 'check' },
    { stage: r03a, line: 'x = 8 + 6', verdict: 'valid', progress: true, move: 'move-across' },
    { stage: r03a, line: 'x = 6 + 8', verdict: 'valid', progress: true },
    { stage: r03a, before: ['x = 8 + 6'], line: 'x = 14', verdict: 'answer' },
    { stage: r03a, line: 'x = 2', verdict: 'wrong' },
    { stage: r03a, line: 'x = 8 − 6', verdict: 'wrong' },
    { stage: r03a, line: 'x − 5 = 9', verdict: 'valid', progress: false, move: 'add-both' },
    { stage: r03a, line: '14 − 6 = 8', verdict: 'aside' },
    { stage: r03a, before: ['x = 14'], line: '14 − 8 = 6', verdict: 'aside' },
  ],

  'r03 sluice gate, stage 2 (20 − x = 6)': [
    { stage: r03b, line: 'x = 14', verdict: 'answer', note: 'Try values' },
    { stage: r03b, before: ['x = 14'], line: '20 − 14 = 6', verdict: 'check' },
    { stage: r03b, line: '14 = x', verdict: 'answer' },
    { stage: r03b, line: 'x = 20 − 6', verdict: 'valid', progress: true, move: 'compound' },
    { stage: r03b, line: '20 = 6 + x', verdict: 'valid', progress: true, move: 'move-across' },
    { stage: r03b, line: '20 − 6 = x', verdict: 'valid', progress: true },
    { stage: r03b, before: ['x = 20 − 6'], line: 'x = 14', verdict: 'answer' },
    { stage: r03b, line: 'x = 26', verdict: 'wrong', note: '20 + 6' },
    { stage: r03b, line: 'x − 20 = 6', verdict: 'wrong' },
    { stage: r03b, line: '20 + x = 6', verdict: 'wrong' },
    { stage: r03b, line: 'x = 6 − 20', verdict: 'wrong' },
    { stage: r03b, line: '20 − 14 = 6', verdict: 'aside' },
    { stage: r03b, before: ['x = 14'], line: '20 − 6 = 14', verdict: 'aside' },
  ],

  'r04 water wheel (2x + 5 = 23)': [
    // The worked sequence (architecture, Balance moves): a float 5 on the left alone
    // shows 2x = 23, which is never written but is wrong if typed; a float 5 on the right
    // writes 2x = 18; the splitter at 2 shows x = 9; he writes x = 9 and the check line.
    { stage: r04, line: '2x = 23', verdict: 'wrong' },
    { stage: r04, line: '2x = 18', verdict: 'valid', progress: true, move: 'add-both' },
    { stage: r04, before: ['2x = 18'], line: 'x = 9', verdict: 'answer' },
    { stage: r04, before: ['2x = 18', 'x = 9'], line: '2 · 9 + 5 = 23', verdict: 'check' },
    // Story 1.11: a typed 2x = 23 − 5, then the split.
    { stage: r04, line: '2x = 23 − 5', verdict: 'valid', progress: true, move: 'move-across' },
    {
      stage: r04,
      before: ['2x = 23 − 5'],
      line: '2x = 18',
      verdict: 'valid',
      progress: true,
      move: 'evaluate',
    },
    { stage: r04, before: ['2x = 23 − 5'], line: 'x = 9', verdict: 'answer' },
    { stage: r04, before: ['2x = 23 − 5', 'x = 9'], line: '2 · 9 + 5 = 23', verdict: 'check' },
    // Story 1.10: Try values can't reach 9 on the dial, but typing still locks it.
    { stage: r04, line: 'x = 9', verdict: 'answer', note: 'a skipped step' },
    { stage: r04, before: ['x = 9'], line: '2 · 9 + 5 = 23', verdict: 'check' },
    { stage: r04, before: ['x = 9'], line: '9 · 2 + 5 = 23', verdict: 'check' },
    { stage: r04, line: '2 · 9 + 5 = 23', verdict: 'aside' },
    { stage: r04, line: 'x = (23 − 5) : 2', verdict: 'valid', progress: true },
    { stage: r04, line: 'x = 23 − 5 : 2', verdict: 'wrong', note: ': before −' },
    { stage: r04, line: '2x = 28', verdict: 'wrong', note: '23 + 5' },
    { stage: r04, line: '2 + x = 18', verdict: 'wrong', note: '2x read as 2 + x' },
    { stage: r04, line: 'x = 18', verdict: 'wrong', note: 'not divided' },
    { stage: r04, line: 'x = 36', verdict: 'wrong', note: 'multiplied' },
    { stage: r04, line: 'x · 2 + 5 = 23', verdict: 'valid', progress: false, move: 'none' },
    { stage: r04, before: ['x = 9'], line: '2 · 9 + 5 = 24', verdict: 'wrong' },
  ],
  'r05 bridge (3x + 4 = 22, then 25)': [
    // Story 2.8: Try values writes x = 6, Balance 3x = 18 (a float 4 on both sides), then a
    // split by 3; then the change, 22 to 25, and the same again at x = 7.
    { stage: r05a, line: 'x = 6', verdict: 'answer' },
    { stage: r05a, before: ['x = 6'], line: '3 · 6 + 4 = 22', verdict: 'check' },
    { stage: r05a, line: '3x = 18', verdict: 'valid', progress: true, move: 'add-both' },
    { stage: r05a, before: ['3x = 18'], line: 'x = 6', verdict: 'answer' },
    { stage: r05a, before: ['3x = 18', 'x = 6'], line: '3 · 6 + 4 = 22', verdict: 'check' },
    { stage: r05a, line: '3x = 26', verdict: 'wrong', note: '22 + 4' },
    { stage: r05a, line: '3 + x = 18', verdict: 'wrong', note: '3x read as 3 + x' },
    { stage: r05a, line: 'x = 18', verdict: 'wrong', note: 'not divided' },
    { stage: r05b, line: 'x = 7', verdict: 'answer' },
    { stage: r05b, before: ['x = 7'], line: '3 · 7 + 4 = 25', verdict: 'check' },
    { stage: r05b, line: '3x = 21', verdict: 'valid', progress: true, move: 'add-both' },
    { stage: r05b, before: ['3x = 21'], line: 'x = 7', verdict: 'answer' },
    { stage: r05b, before: ['3x = 21', 'x = 7'], line: '3 · 7 + 4 = 25', verdict: 'check' },
    { stage: r05b, line: 'x = 6', verdict: 'wrong', note: 'the old answer, before the change' },
    { stage: r05b, line: '3x = 22', verdict: 'wrong', note: 'the old load' },
    { stage: r05b, line: 'x = 9', verdict: 'wrong', note: 'the 3 added to x, not to 3x' },
  ],
  'r06 weighing yard (x + 56 = 58 + 27)': [
    // Story 2.9: judged without adding. Try values and Balance both write x = 29 (a float
    // of 56 on both sides leaves x against 58 + 27 − 56); a comparing line, the 2 by which
    // 58 is more than 56 added to the 27, is a step too.
    { stage: r06, line: 'x = 29', verdict: 'answer' },
    { stage: r06, before: ['x = 29'], line: '29 + 56 = 58 + 27', verdict: 'check' },
    { stage: r06, line: 'x = 58 + 27 − 56', verdict: 'valid', progress: true },
    { stage: r06, line: 'x = 27 + 2', verdict: 'valid', progress: true, note: 'compared' },
    { stage: r06, before: ['x = 27 + 2'], line: 'x = 29', verdict: 'answer' },
    { stage: r06, line: 'x = 85', verdict: 'wrong', note: 'the right side added up, not compared' },
    { stage: r06, line: 'x = 27', verdict: 'wrong', note: 'the 2 left out' },
    { stage: r06, line: 'x = 31', verdict: 'wrong', note: 'the 2 the wrong way' },
  ],
  'r07 old logbook (3x − 1 = 17)': [
    // Story 2.10: the logbook's lines 3x = 18 (right) and x = 15 (wrong, 3x read as 3 + x),
    // then his rewrite, judged against the lines before it, and the check line.
    { stage: r07, line: '3x = 18', verdict: 'valid', progress: true },
    { stage: r07, before: ['3x = 18'], line: 'x = 6', verdict: 'answer' },
    { stage: r07, before: ['3x = 18', 'x = 6'], line: '3 · 6 − 1 = 17', verdict: 'check' },
    { stage: r07, line: 'x = 6', verdict: 'answer', note: 'a skipped step' },
    { stage: r07, before: ['x = 6'], line: '3 · 6 − 1 = 17', verdict: 'check' },
    { stage: r07, before: ['3x = 18'], line: 'x = 15', verdict: 'wrong', note: '3x read as 3 + x' },
    { stage: r07, line: '3x = 16', verdict: 'wrong', note: '17 − 1' },
    { stage: r07, before: ['3x = 18'], line: 'x = 54', verdict: 'wrong', note: 'multiplied' },
  ],
  'r08 tram (4x + 9 = 41)': [
    // Story 4.3: the gear chain's lines (Undo writes the move, then its result), Balance's
    // (a float of 9, then a split by 4), and the wrong ones the chain and the pad can make.
    { stage: r08, line: '4x = 41 − 9', verdict: 'valid', progress: true, move: 'move-across' },
    { stage: r08, before: ['4x = 41 − 9'], line: '4x = 32', verdict: 'valid', progress: true },
    {
      stage: r08,
      before: ['4x = 41 − 9', '4x = 32'],
      line: 'x = 32 : 4',
      verdict: 'valid',
      progress: true,
    },
    {
      stage: r08,
      before: ['4x = 41 − 9', '4x = 32', 'x = 32 : 4'],
      line: 'x = 8',
      verdict: 'answer',
    },
    {
      stage: r08,
      before: ['4x = 41 − 9', '4x = 32', 'x = 32 : 4', 'x = 8'],
      line: '4 · 8 + 9 = 41',
      verdict: 'check',
    },
    { stage: r08, line: '4x = 32', verdict: 'valid', progress: true, move: 'add-both' },
    { stage: r08, before: ['4x = 32'], line: 'x = 8', verdict: 'answer' },
    { stage: r08, before: ['4x = 32', 'x = 8'], line: '4 · 8 + 9 = 41', verdict: 'check' },
    { stage: r08, line: 'x = 8', verdict: 'answer', note: 'a skipped step' },
    { stage: r08, before: ['x = 8'], line: '4 · 8 + 9 = 41', verdict: 'check' },
    { stage: r08, line: '4x = 41 + 9', verdict: 'wrong', note: 'the chain run the wrong way' },
    { stage: r08, line: '4x = 50', verdict: 'wrong', note: '41 + 9' },
    { stage: r08, before: ['4x = 32'], line: 'x = 32 · 4', verdict: 'wrong', note: 'multiplied' },
    { stage: r08, before: ['4x = 32'], line: 'x = 28', verdict: 'wrong', note: '4x read as 4 + x' },
  ],
  'r09 steam lift (135 − 5x = 100)': [
    // Story 4.4: x taken away. The chain's 135 − ☐ is undone by 135 − 100; Balance's x-gear
    // adds 5x to both sides first (story 4.2); and the wrong lines x read as added makes.
    { stage: r09, line: '5x = 135 − 100', verdict: 'valid', progress: true },
    { stage: r09, before: ['5x = 135 − 100'], line: '5x = 35', verdict: 'valid', progress: true },
    {
      stage: r09,
      before: ['5x = 135 − 100', '5x = 35'],
      line: 'x = 35 : 5',
      verdict: 'valid',
      progress: true,
    },
    {
      stage: r09,
      before: ['5x = 135 − 100', '5x = 35', 'x = 35 : 5'],
      line: 'x = 7',
      verdict: 'answer',
    },
    {
      stage: r09,
      before: ['5x = 135 − 100', '5x = 35', 'x = 35 : 5', 'x = 7'],
      line: '135 − 5 · 7 = 100',
      verdict: 'check',
    },
    { stage: r09, line: '135 = 5x + 100', verdict: 'valid', progress: false, move: 'add-both' },
    { stage: r09, before: ['135 = 5x + 100'], line: '35 = 5x', verdict: 'valid', progress: true },
    { stage: r09, before: ['135 = 5x + 100', '35 = 5x'], line: '7 = x', verdict: 'answer' },
    {
      stage: r09,
      before: ['135 = 5x + 100', '35 = 5x', '7 = x'],
      line: '135 − 5 · 7 = 100',
      verdict: 'check',
    },
    { stage: r09, line: 'x = 7', verdict: 'answer', note: 'a skipped step' },
    { stage: r09, before: ['x = 7'], line: '135 − 5 · 7 = 100', verdict: 'check' },
    { stage: r09, line: '5x = 100 + 135', verdict: 'wrong', note: 'the chain’s + 135' },
    { stage: r09, line: '5x = 235', verdict: 'wrong', note: '100 + 135' },
    { stage: r09, line: '5x = 135 + 100', verdict: 'wrong', note: 'the 100 added' },
    { stage: r09, before: ['5x = 35'], line: 'x = 30', verdict: 'wrong', note: '5x read as 5 + x' },
  ],
  // Story 1.13: the rest of epic 1's acceptance-criteria lines. A stage's own equation,
  // copied as a line, is valid without progress (stories 1.2, 1.4 and 1.8–1.11 name them);
  // story 1.2's lines that don't parse are refused on the stage they read like.
  'epic 1 acceptance criteria (story 1.13)': [
    { stage: r01, line: 'x + 4 = 9', verdict: 'valid', progress: false, move: 'none' },
    { stage: r02a, line: '3x = 12', verdict: 'valid', progress: false, move: 'none' },
    { stage: r02b, line: 'x : 3 = 5', verdict: 'valid', progress: false, move: 'none' },
    { stage: r03a, line: 'x − 6 = 8', verdict: 'valid', progress: false, move: 'none' },
    { stage: r03b, line: '20 − x = 6', verdict: 'valid', progress: false, move: 'none' },
    { stage: r04, line: '2x + 5 = 23', verdict: 'valid', progress: false, move: 'none' },
    { stage: r11, line: r11, verdict: 'valid', progress: false, move: 'none' },
    { stage: r02a, line: 'x3 = 12', verdict: 'incomplete', note: 'x followed by a digit' },
    { stage: r03b, line: '−x = 14', verdict: 'incomplete', note: 'a leading minus' },
  ],
  // Story 1.6: lines as the notebook writes them (`formatTokens`, with U+202F between
  // thousands) and as typed on a computer (no spaces, `*`, `/` and `-`).
  'typed in the notebook (story 1.6)': [
    { stage: r01, line: 'x=9-4', verdict: 'valid', progress: true, note: 'keyboard -' },
    { stage: r01, line: 'x=5', verdict: 'answer', note: 'no spaces' },
    { stage: r01, before: ['x=5'], line: '5+4=9', verdict: 'check', note: 'no spaces' },
    { stage: ac, line: 'x=18/2', verdict: 'valid', progress: true, note: 'keyboard /' },
    { stage: ac, before: ['x = 9'], line: '2*9+7=25', verdict: 'check', note: 'keyboard *' },
    { stage: ac, line: `2x = 1${nnbsp}018 − 1${nnbsp}000`, verdict: 'valid', progress: true },
    { stage: ac, line: '2x=1018-1000', verdict: 'valid', progress: true, note: 'as typed' },
    { stage: ac, line: 'x = 009', verdict: 'answer', note: 'leading zeros' },
    { stage: ac, line: '2x +', verdict: 'incomplete', note: 'not finished' },
    { stage: r11, line: `27x = 5${nnbsp}905 − 316`, verdict: 'valid', progress: true },
    { stage: r11, line: `27x = 5${nnbsp}589`, verdict: 'valid', progress: true },
    { stage: r11, line: `x = 5${nnbsp}589 : 27`, verdict: 'valid', progress: true },
    { stage: r11, line: 'x = 207', verdict: 'answer' },
    { stage: r11, before: ['x = 207'], line: `5${nnbsp}905 − 27 · 207 = 316`, verdict: 'check' },
    { stage: r11, before: ['x = 207'], line: '5905-27*207=316', verdict: 'check', note: 'typed' },
    { stage: r11, line: `27x = 6${nnbsp}221`, verdict: 'wrong', note: '5 905 + 316' },
    { stage: r11, line: `x = 5${nnbsp}589`, verdict: 'wrong', note: 'not divided' },
    { stage: r11, line: `5${nnbsp}905 − 27 · 207 = 316`, verdict: 'aside', note: 'before x = 207' },
  ],
  // Story 1.7: Try values `blanks` (rooms 1–3). The notebook writes `x = ☐`, then the check
  // line with x blanked (`blankOutX`: `3x` becomes `3 · ☐`), and he fills in a number. The
  // right fills (`x = 5`, then `5 + 4 = 9`, and so on) are in each room's rows above; these
  // are the other ways a fill can go.
  'Try values blanks filled in (story 1.7)': [
    { stage: r01, line: 'x = 6', verdict: 'wrong', note: 'x = ☐ with 6' },
    { stage: r01, line: 'x = 05', verdict: 'answer', note: 'a leading zero in the blank' },
    { stage: r01, line: 'x =', verdict: 'incomplete', note: 'x = ☐ left empty' },
    { stage: r01, before: ['x = 5'], line: '+ 4 = 9', verdict: 'incomplete', note: 'left empty' },
    { stage: r01, before: ['x = 5'], line: '05 + 4 = 9', verdict: 'check', note: 'leading zero' },
    { stage: r02a, before: ['x = 4'], line: '3 · 5 = 12', verdict: 'wrong', note: '3 · ☐ = 12' },
    { stage: r02a, before: ['x = 4'], line: '3 · = 12', verdict: 'incomplete', note: 'empty' },
    { stage: r02b, before: ['x = 15'], line: '12 : 3 = 5', verdict: 'wrong', note: '☐ : 3 = 5' },
    { stage: r03a, before: ['x = 14'], line: '15 − 6 = 8', verdict: 'wrong', note: '☐ − 6 = 8' },
    { stage: r03b, before: ['x = 14'], line: '20 − 15 = 6', verdict: 'wrong', note: '20 − ☐' },
    // Wrong lines that jam with no tilt of their own at the solution: they tip by
    // tuning.jamMinTilt (room/tilt.ts, jamTilt).
    { stage: r01, line: 'x = x', verdict: 'wrong', note: 'true for every x' },
    { stage: r01, line: 'x + 4 = x + 4', verdict: 'wrong', note: 'true for every x' },
    { stage: r01, line: 'x + 1 = x', verdict: 'wrong', note: 'no solution' },
  ],
};
