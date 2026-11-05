// The line-checker table (architecture, Testing Strategy; GDD technical metric NFR11):
// for each stage, lines that must be accepted, including skipped steps, and lines that
// must be rejected, each with its expected verdict. `lines.table.test.ts` runs every row.
// Every change to `math/` adds rows here (project-context.md, Testing).
//
// `before` lists the committed lines between the stage equation and the line, and each
// of them must itself be accepted in turn. Rooms 1–4 list, per stage, the canonical
// solution of each way (`steps.ts`), skipped-step solutions and wrong lines.

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
