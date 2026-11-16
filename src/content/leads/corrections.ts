// The corrected streets (GDD, Exploration and the trail map): each is won back with a Knock of two
// clues, built from ideas he has already met there. An id is stored in saves.

import { correctionText as text } from '@/content/text/hunt-leads';
import type { CorrectionId } from '@/hunt/ids';
import type { KnockSpec } from '@/hunt/knock';
import type { LeadSpec } from '@/hunt/spec';
import type { SToken } from '@/math/statement-tokens';

const sumKeys: readonly SToken[] = ['+', '−', '·', ':'];
const rangeKeys: readonly SToken[] = ['x', '≤', '<', '≥', '>', '≠', '−', '+', '·', ':'];

function winBack(id: CorrectionId, street: string, knock: KnockSpec, card: string[]): LeadSpec {
  return {
    id,
    act: 2,
    street,
    title: text.title,
    lesson: { found: '', steps: [] },
    tries: [],
    mistake: null,
    scenes: [knock],
    writeUp: [],
    find: { say: text.find.say, title: text.find.title, card },
  };
}

// Arhivska ulica, after the wandering-off: Act 1's place value and neighbours.
const archive: KnockSpec = {
  kind: 'knock',
  intro: text.intro,
  row: { kind: 'street', from: 81, to: 140 },
  startSide: 'odd',
  clues: [
    { id: 'side', kind: 'side', side: 'even', say: text.u2.side },
    {
      id: 'place',
      kind: 'sum',
      start: '1 · 100 + 1 · 10 + 6 =',
      answer: 116,
      say: text.u2.place,
      structure: text.u2.structurePlace,
    },
    {
      id: 'next',
      kind: 'sum',
      start: '115 + 1 =',
      answer: 116,
      say: text.u2.next,
      structure: text.u2.structureNext,
    },
  ],
  door: 116,
  wrongDoors: [],
  grumpy: text.grumpy,
  opened: text.opened,
  example: text.u2.example,
  keys: sumKeys,
  hint: text.u2.hint,
};

// Gornja ulica, after Knot 2: Act 2's rounding and ranges.
const upper: KnockSpec = {
  kind: 'knock',
  intro: text.intro,
  row: { kind: 'street', from: 1, to: 80 },
  startSide: 'even',
  clues: [
    { id: 'side', kind: 'side', side: 'odd', say: text.u1.side },
    {
      id: 'round',
      kind: 'limit',
      numbers: [55, 64],
      canonical: '55 ≤ x ≤ 64',
      say: text.u1.round,
      structure: text.u1.structureRound,
    },
    {
      id: 'less',
      kind: 'limit',
      numbers: [57],
      canonical: 'x < 57',
      say: text.u1.less,
      structure: text.u1.structureLess,
    },
  ],
  door: 55,
  wrongDoors: [],
  grumpy: text.grumpy,
  opened: text.opened,
  example: text.u1.example,
  keys: rangeKeys,
  hint: text.u1.hint,
};

export const correctionSpecs: Readonly<Record<CorrectionId, LeadSpec>> = {
  'fix-u2': winBack('fix-u2', 'u2', archive, [...text.u2.card]),
  'fix-u1': winBack('fix-u1', 'u1', upper, [...text.u1.card]),
};
