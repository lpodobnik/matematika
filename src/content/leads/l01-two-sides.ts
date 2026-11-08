// Two sides (GDD, Structure, Act 1): N, N₀, even and odd. The first lead, so its street has only a
// few clues, and a lift to meet 0 in.

import { l01Text as text } from '@/content/text/hunt-leads';
import type { ObjectState } from '@/hunt/objects';
import type { LeadSpec } from '@/hunt/spec';

const pairs = (count: number): ObjectState => ({ kind: 'pairs', count, max: 20 });
const line = (from: number, lit: readonly number[], marked: number | null = null): ObjectState => ({
  kind: 'line',
  from,
  to: 8,
  lit,
  marked,
});

const naturals = [1, 2, 3, 4, 5, 6, 7, 8];

export const l01: LeadSpec = {
  id: 'l01',
  act: 1,
  street: 'u1',
  title: text.title,
  lesson: {
    found: text.lesson.found,
    steps: [
      { object: line(0, naturals), say: text.lesson.steps[0] },
      { object: line(0, naturals, 0), say: text.lesson.steps[1] },
      { object: pairs(14), say: text.lesson.steps[2] },
      { object: pairs(15), say: text.lesson.steps[3] },
      { object: pairs(15), say: text.lesson.steps[4] },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: text.tries.lamps,
      object: pairs(4),
      goal: { kind: 'pairs-count', count: 7 },
    },
    {
      kind: 'line',
      say: text.tries.sum,
      start: '3 · 2 + 1 =',
      accepts: ['3 · 2 + 1 = 7'],
      keys: [],
    },
    {
      kind: 'line',
      say: text.tries.member,
      start: '0 ☐ N',
      accepts: ['0 ∉ N'],
      keys: ['∈', '∉'],
    },
  ],
  mistake: {
    id: 'l01-pairs-left-over',
    say: text.mistake.say,
    lines: ['6 = 3 · 2', '9 = 4 · 2'],
    wrong: 1,
    nudge: text.mistake.nudge,
    show: {
      say: text.mistake.show,
      object: pairs(8),
      goal: { kind: 'pairs-count', count: 9 },
    },
    write: {
      say: text.mistake.write,
      start: '9 =',
      accepts: ['9 = 4 · 2 + 1'],
      keys: ['·', '+'],
    },
    thanks: text.mistake.thanks,
  },
  scenes: [
    {
      kind: 'knock',
      intro: text.street.intro,
      row: { kind: 'street', from: 1, to: 40 },
      startSide: 'even',
      clues: [
        { id: 'side', kind: 'side', side: 'odd', say: text.street.side },
        {
          id: 'pairs',
          kind: 'sum',
          start: '7 · 2 + 1 =',
          answer: 15,
          say: text.street.pairs,
          structure: text.street.structurePairs,
        },
        {
          id: 'almost',
          kind: 'sum',
          start: '8 · 2 − 1 =',
          answer: 15,
          say: text.street.almost,
          structure: text.street.structureAlmost,
        },
      ],
      door: 15,
      wrongDoors: [],
      grumpy: text.street.grumpy,
      opened: text.street.opened,
      example: text.street.example,
      keys: ['+', '−', '·', ':'],
      hint: text.street.hint,
    },
    {
      kind: 'knock',
      intro: text.lift.intro,
      row: { kind: 'lift', from: 0, to: 8 },
      startSide: null,
      clues: [
        {
          id: 'floor',
          kind: 'member',
          start: '☐ ∉ N',
          answer: 0,
          say: text.lift.floor,
          structure: text.lift.structure,
        },
      ],
      door: 0,
      wrongDoors: [],
      grumpy: text.lift.grumpy,
      opened: text.lift.opened,
      example: text.lift.example,
      keys: [],
      hint: text.lift.hint,
    },
  ],
  writeUp: [
    { say: text.write.notN, start: '☐ ∉ N', accepts: ['0 ∉ N'], keys: [] },
    { say: text.write.inN0, start: '0 ∈ ☐', accepts: ['0 ∈ N₀'], keys: ['N', 'N₀'] },
    { say: text.write.sum, start: '', accepts: ['7 · 2 + 1 = 15'], keys: ['+', '·', '='] },
  ],
  find: { say: text.find.say, title: text.find.title, card: text.find.card },
};
