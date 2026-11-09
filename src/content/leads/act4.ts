// Act 4, the hiding place, and the last lead (GDD, Structure): brackets, distributivity, remainder,
// the mean, and reading data. The locks come first in the act, because the leads after them use
// brackets; the lamp oil is last, with the last rule guard in front of its four charts.

import { act4Text } from '@/content/text/hunt-act4';
import type { BarsState, BundlesState, GridState, PackingState, StacksState } from '@/hunt/objects';
import type { LeadSpec } from '@/hunt/spec';
import type { SToken } from '@/math/statement-tokens';

const bundles = (loose: number, count: number, size: number): BundlesState => ({
  kind: 'bundles',
  loose,
  bundles: count,
  size,
});
const grid = (rows: number, columns: number): GridState => ({ kind: 'grid', rows, columns });
const packing = (items: number, per: number): PackingState => ({ kind: 'packing', items, per });
const stacks = (...counts: number[]): StacksState => ({
  kind: 'stacks',
  stacks: counts,
  held: null,
});
const bars = (step: number, ...rows: (readonly [string, number])[]): BarsState => ({
  kind: 'bars',
  step,
  bars: rows.map(([label, value]) => ({ label, value })),
});

const t12 = act4Text.l12;

export const l12: LeadSpec = {
  id: 'l12',
  act: 4,
  street: 'u1',
  title: t12.title,
  lesson: {
    found: t12.lesson.found,
    steps: [
      { object: bundles(2, 3, 4), say: t12.lesson.steps[0] },
      { object: bundles(0, 5, 4), say: t12.lesson.steps[1] },
      { object: bundles(0, 2, 6), say: t12.lesson.steps[2] },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: t12.tries.rows,
      object: grid(2, 5),
      goal: { kind: 'grid-size', rows: 5, columns: 5 },
    },
    {
      kind: 'line',
      say: t12.tries.sum,
      start: '(1 + 4) · 3 =',
      accepts: ['(1 + 4) · 3 = 15'],
      keys: [],
    },
    {
      kind: 'line',
      say: t12.tries.place,
      start: '',
      accepts: ['(6 + 2) · 3 = 24'],
      keys: ['(', ')', '+', '·', '='],
    },
  ],
  mistake: {
    id: 'l12-brackets-ignored',
    say: t12.mistake.say,
    // The first comes out right even with the brackets ignored; the second gives it away.
    lines: ['(3 · 2) + 5 = 11', '(3 + 2) · 5 = 13'],
    wrong: 1,
    nudge: t12.mistake.nudge,
    show: {
      say: t12.mistake.show,
      object: grid(3, 5),
      goal: { kind: 'grid-size', rows: 5, columns: 5 },
    },
    write: {
      say: t12.mistake.write,
      start: '(3 + 2) · 5 =',
      accepts: ['(3 + 2) · 5 = 25'],
      keys: [],
    },
    thanks: t12.mistake.thanks,
  },
  scenes: [
    {
      kind: 'locks',
      intro: t12.scene.intro,
      locks: [
        { strip: '2 + 5 · 4', target: 28 },
        { strip: '3 + 4 · 3 + 3', target: 24 },
        { strip: '258 − 34 + 41', target: 183 },
        { strip: '150 − 20 · 3 + 2', target: 50 },
      ],
      shut: t12.scene.shut,
      opened: t12.scene.opened,
      example: t12.scene.example,
      hint: t12.scene.hint,
    },
  ],
  writeUp: [
    {
      say: t12.write.sum,
      start: '(3 + 4) · 3 + 3 = ☐',
      accepts: ['(3 + 4) · 3 + 3 = 24'],
      keys: [],
    },
    {
      say: t12.write.nested,
      start: '{2 + [3 · (4 − 1)]} · 2 = ☐',
      accepts: ['{2 + [3 · (4 − 1)]} · 2 = 22'],
      keys: [],
    },
    {
      say: t12.write.whole,
      start: '',
      accepts: ['258 − (34 + 41) = 183'],
      keys: ['(', ')', '−', '+', '='],
    },
  ],
  find: { say: t12.find.say, title: t12.find.title, card: t12.find.card },
};

const t13 = act4Text.l13;

export const l13: LeadSpec = {
  id: 'l13',
  act: 4,
  street: 'u1',
  title: t13.title,
  lesson: {
    found: t13.lesson.found,
    steps: [
      { object: grid(2, 4), say: t13.lesson.steps[0] },
      { object: grid(3, 4), say: t13.lesson.steps[1] },
      { object: grid(5, 4), say: t13.lesson.steps[2] },
      { object: grid(10, 5), say: t13.lesson.steps[3] },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: t13.tries.rows,
      object: grid(1, 6),
      goal: { kind: 'grid-size', rows: 4, columns: 6 },
    },
    {
      kind: 'line',
      say: t13.tries.parts,
      object: grid(4, 6),
      start: '(1 + 3) · 6 = 1 · 6 +',
      accepts: ['(1 + 3) · 6 = 1 · 6 + 3 · 6'],
      keys: ['·'],
    },
    {
      kind: 'line',
      say: t13.tries.factor,
      start: '8 · 25 + 2 · 25 =',
      accepts: ['8 · 25 + 2 · 25 = (8 + 2) · 25', '8 · 25 + 2 · 25 = 25 · (8 + 2)'],
      keys: ['(', ')', '+', '·'],
    },
  ],
  mistake: {
    id: 'l13-first-only',
    say: t13.mistake.say,
    lines: ['2 · (4 + 5) = 2 · 9', '3 · (2 + 5) = 3 · 2 + 5'],
    wrong: 1,
    nudge: t13.mistake.nudge,
    show: {
      say: t13.mistake.show,
      object: grid(3, 2),
      goal: { kind: 'grid-size', rows: 3, columns: 7 },
    },
    write: {
      say: t13.mistake.write,
      start: '3 · (2 + 5) =',
      accepts: ['3 · (2 + 5) = 3 · 2 + 3 · 5', '3 · (2 + 5) = 3 · 5 + 3 · 2'],
      keys: ['·', '+'],
    },
    thanks: t13.mistake.thanks,
  },
  scenes: [
    {
      kind: 'unmask',
      intro: t13.scene.intro,
      suspects: [
        {
          id: 'zvonar',
          name: t13.scene.who.zvonar,
          offended: t13.scene.offended.zvonar,
          why: t13.scene.why.zvonar,
        },
        {
          id: 'mlinar',
          name: t13.scene.who.mlinar,
          offended: t13.scene.offended.mlinar,
          why: t13.scene.why.mlinar,
        },
        { id: 'dimnjacar', name: t13.scene.who.dimnjacar, offended: '', why: '' },
      ],
      // The two who tell the truth say it differently, and the one who looks the odd one out,
      // the miller, only slipped once. The culprit never multiplies the second number.
      cards: [
        {
          id: 'a',
          ask: t13.scene.cards.a,
          answers: {
            zvonar: '5 · (3 + 4) = 5 · 3 + 5 · 4',
            mlinar: '5 · (3 + 4) = 5 · 7',
            dimnjacar: '5 · (3 + 4) = 5 · 3 + 4',
          },
        },
        {
          id: 'b',
          ask: t13.scene.cards.b,
          answers: {
            zvonar: '12 · (20 + 7) = 12 · 20 + 12 · 7',
            mlinar: '12 · (20 + 7) = 12 · 37',
            dimnjacar: '12 · (20 + 7) = 12 · 20 + 7',
          },
        },
        {
          id: 'c',
          ask: t13.scene.cards.c,
          answers: {
            zvonar: '(409 − 309) · 86 = 409 · 86 − 309 · 86',
            mlinar: '(409 − 309) · 86 = 100 · 86',
            dimnjacar: '(409 − 309) · 86 = 409 · 86 − 309',
          },
        },
      ],
      required: 2,
      guilty: 'dimnjacar',
      reveal: t13.scene.reveal,
      fix: {
        say: t13.scene.fix,
        start: '5 · (3 + 4) =',
        accepts: ['5 · (3 + 4) = 5 · 3 + 5 · 4', '5 · (3 + 4) = 5 · 4 + 5 · 3'],
        keys: ['·', '+'],
      },
      opened: t13.scene.opened,
      example: t13.scene.example,
      hint: t13.scene.hint,
    },
  ],
  writeUp: [
    {
      say: t13.write.fade,
      start: '5 · (3 + 4) = 5 · 3 + ☐',
      accepts: ['5 · (3 + 4) = 5 · 3 + 5 · 4'],
      keys: ['·'],
    },
    {
      say: t13.write.whole,
      start: '409 · 86 − 309 · 86 =',
      accepts: ['409 · 86 − 309 · 86 = (409 − 309) · 86 = 8 600'],
      keys: ['(', ')', '−', '·', '='],
    },
  ],
  find: { say: t13.find.say, title: t13.find.title, card: t13.find.card },
};

const t14 = act4Text.l14;

export const l14: LeadSpec = {
  id: 'l14',
  act: 4,
  street: 'u1',
  title: t14.title,
  lesson: {
    found: t14.lesson.found,
    steps: [
      { object: packing(17, 5), say: t14.lesson.steps[0] },
      { object: packing(17, 5), say: t14.lesson.steps[1] },
      { object: packing(13, 4), say: t14.lesson.steps[2] },
      { object: packing(13, 4), say: t14.lesson.steps[3] },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: t14.tries.pack,
      object: packing(14, 2),
      goal: { kind: 'packing-per', per: 4 },
    },
    {
      kind: 'line',
      say: t14.tries.line,
      start: '14 : 4 =',
      accepts: ['14 : 4 = 3 ost. 2'],
      keys: ['ost.'],
    },
    {
      kind: 'line',
      say: t14.tries.check,
      start: '4 · 3 + 2 =',
      accepts: ['4 · 3 + 2 = 14'],
      keys: [],
    },
  ],
  mistake: {
    id: 'l14-remainder-too-big',
    say: t14.mistake.say,
    lines: ['40 : 9 = 4 ost. 4', '55 : 9 = 5 ost. 10'],
    wrong: 1,
    nudge: t14.mistake.nudge,
    show: { say: t14.mistake.show, object: packing(55, 7), goal: { kind: 'packing-per', per: 9 } },
    write: {
      say: t14.mistake.write,
      start: '55 : 9 =',
      accepts: ['55 : 9 = 6 ost. 1'],
      keys: ['ost.'],
    },
    thanks: t14.mistake.thanks,
  },
  scenes: [
    {
      kind: 'loop',
      intro: t14.scene.intro,
      boards: [
        { lamps: 5, bells: [7, 9, 13, 11] },
        { lamps: 7, bells: [20, 25, 31] },
        { lamps: 7, bells: [100, 90, 123, 75] },
      ],
      taken: t14.scene.taken,
      missed: t14.scene.missed,
      keys: ['ost.'],
      opened: t14.scene.opened,
      example: t14.scene.example,
      hint: t14.scene.hint,
    },
  ],
  writeUp: [
    {
      say: t14.write.fade,
      start: '100 : 7 = 14 ost. ☐',
      accepts: ['100 : 7 = 14 ost. 2'],
      keys: [],
    },
    {
      say: t14.write.check,
      start: '',
      accepts: ['7 · 14 + 2 = 100', '14 · 7 + 2 = 100'],
      keys: ['·', '+', '='],
    },
  ],
  find: { say: t14.find.say, title: t14.find.title, card: t14.find.card },
};

const t15 = act4Text.l15;

export const l15: LeadSpec = {
  id: 'l15',
  act: 4,
  street: 'u1',
  title: t15.title,
  lesson: {
    found: t15.lesson.found,
    steps: [
      { object: stacks(3, 9), say: t15.lesson.steps[0] },
      { object: stacks(6, 6), say: t15.lesson.steps[1] },
      { object: stacks(4, 4, 4, 8), say: t15.lesson.steps[2] },
      { object: stacks(5, 5, 5, 5), say: t15.lesson.steps[3] },
    ],
  },
  tries: [
    { kind: 'object', say: t15.tries.level, object: stacks(2, 8), goal: { kind: 'stacks-level' } },
    {
      kind: 'line',
      say: t15.tries.line,
      object: stacks(5, 5),
      start: 'x̄ = (2 + 8) : 2 =',
      accepts: ['x̄ = (2 + 8) : 2 = 5'],
      keys: [],
    },
    { kind: 'line', say: t15.tries.total, start: '15 · 4 =', accepts: ['15 · 4 = 60'], keys: [] },
  ],
  mistake: {
    id: 'l15-repeats-once',
    say: t15.mistake.say,
    // Its sum comes out right; it's the sum of the wrong things, so it needs the true mean.
    lines: ['x̄ = (4 + 8) : 2 = 6', 'x̄ = (5 + 9) : 2 = 7'],
    wrong: 1,
    context: { mean: 6 },
    nudge: t15.mistake.nudge,
    show: { say: t15.mistake.show, object: stacks(5, 5, 5, 9), goal: { kind: 'stacks-level' } },
    write: {
      say: t15.mistake.write,
      start: 'x̄ = (5 + 5 + 5 + 9) :',
      accepts: ['x̄ = (5 + 5 + 5 + 9) : 4 = 6'],
      keys: ['='],
      context: { mean: 6 },
    },
    thanks: t15.mistake.thanks,
  },
  scenes: [
    {
      kind: 'level',
      intro: t15.scene.intro,
      rounds: [
        {
          stacks: [6, 14],
          line: {
            say: t15.scene.rounds.two,
            start: 'x̄ = (6 + 14) : 2 =',
            accepts: ['x̄ = (6 + 14) : 2 = 10'],
            keys: [],
          },
        },
        {
          stacks: [3, 5, 10],
          line: {
            say: t15.scene.rounds.three,
            start: 'x̄ = (3 + 5 + 10) : 3 =',
            accepts: ['x̄ = (3 + 5 + 10) : 3 = 6'],
            keys: [],
          },
        },
        {
          stacks: [5, 5, 5, 13],
          line: {
            say: t15.scene.rounds.four,
            start: 'x̄ = (5 + 5 + 5 + 13) : 4 =',
            accepts: ['x̄ = (5 + 5 + 5 + 13) : 4 = 7'],
            keys: [],
          },
        },
      ],
      level: t15.scene.level,
      opened: t15.scene.opened,
      example: t15.scene.example,
      hint: t15.scene.hint,
    },
  ],
  writeUp: [
    {
      say: t15.write.fade,
      start: 'x̄ = (6 + 14) : ☐ = 10',
      accepts: ['x̄ = (6 + 14) : 2 = 10'],
      keys: [],
    },
    {
      say: t15.write.whole,
      start: '',
      accepts: ['x̄ = (3 + 5 + 10) : 3 = 6'],
      keys: ['x̄', '=', '(', ')', '+', ':'],
    },
    { say: t15.write.month, start: '', accepts: ['38 · 30 = 1 140'], keys: ['·', '='] },
  ],
  find: { say: t15.find.say, title: t15.find.title, card: t15.find.card },
};

const t16 = act4Text.l16;
const chart = t16.charts;

/** All the signs he's been taught that a wrong idea could use, what these doors ask first. */
const knockKeys: readonly SToken[] = [
  'x',
  '<',
  '>',
  '≤',
  '≥',
  '≠',
  '+',
  '−',
  '·',
  ':',
  '=',
  '(',
  ')',
];
const row = (to: number) => ({ kind: 'street', from: 1, to }) as const;

export const l16: LeadSpec = {
  id: 'l16',
  act: 'last',
  street: 'u1',
  title: t16.title,
  beats: ['near-miss'],
  lesson: {
    found: t16.lesson.found,
    steps: [
      { object: bars(2, ['A', 4], ['B', 8], ['C', 6]), say: t16.lesson.steps[0] },
      { object: bars(10, ['A', 25], ['B', 40], ['C', 10]), say: t16.lesson.steps[1] },
      { object: bars(10, ['A', 25], ['B', 40], ['C', 10]), say: t16.lesson.steps[2] },
      { object: bars(10, ['A', 25], ['B', 40], ['C', 10]), say: t16.lesson.steps[3] },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: t16.tries.step,
      object: { kind: 'line', from: 0, to: 25, step: 5, lit: [], marked: null, labelled: [0, 5] },
      goal: { kind: 'line-mark', at: 15 },
    },
    {
      kind: 'line',
      say: t16.tries.rowA,
      object: bars(5, ['A', 30], ['B', 10], ['C', 25]),
      start: 'A =',
      accepts: ['A = 30'],
      keys: [],
      context: { points: { A: 30 } },
    },
    {
      kind: 'line',
      say: t16.tries.rowB,
      object: bars(5, ['A', 30], ['B', 10], ['C', 25]),
      start: 'B =',
      accepts: ['B = 10'],
      keys: [],
      context: { points: { B: 10 } },
    },
  ],
  mistake: {
    id: 'l16-counts-steps',
    say: t16.mistake.say,
    lines: ['A = 3', 'B = 3'],
    wrong: 1,
    context: { points: { A: 3, B: 30 } },
    nudge: t16.mistake.nudge,
    show: {
      say: t16.mistake.show,
      object: { kind: 'line', from: 0, to: 50, step: 10, lit: [], marked: null, labelled: [0, 10] },
      goal: { kind: 'line-mark', at: 30 },
    },
    write: {
      say: t16.mistake.write,
      start: 'B =',
      accepts: ['B = 30'],
      keys: [],
      context: { points: { B: 30 } },
    },
    thanks: t16.mistake.thanks,
  },
  scenes: [
    {
      kind: 'guard',
      id: 'rule-4',
      rule: t16.guard.rule,
      intro: t16.guard.intro,
      tiles: [
        { id: 'eight', face: '8 : 2', breaks: false, thanks: t16.guard.thanks.eight },
        { id: 'zero', face: '0 : 7', breaks: false, thanks: t16.guard.thanks.zero },
        { id: 'one', face: '7 : 1', breaks: false, thanks: t16.guard.thanks.one },
        { id: 'by-zero', face: '7 : 0', breaks: true, thanks: '' },
        { id: 'same', face: '7 : 7', breaks: false, thanks: t16.guard.thanks.same },
        { id: 'thirty', face: '30 : 5', breaks: false, thanks: t16.guard.thanks.thirty },
      ],
      write: { say: t16.guard.write, start: '0 · 7 =', accepts: ['0 · 7 = 0'], keys: [] },
      jammed: t16.guard.jammed,
      example: t16.guard.example,
      hint: t16.guard.hint,
    },
    // Each chart has a clue he can only write by reading it, since the notebook starts the sum.
    {
      kind: 'knock',
      intro: t16.streets.intro,
      row: row(60),
      startSide: null,
      picture: bars(10, [chart.trg, 45], [chart.most, 35], [chart.mlin, 20], [chart.pusta, 60]),
      clues: [
        {
          id: 'less',
          kind: 'limit',
          numbers: [45],
          canonical: 'x < 45',
          say: t16.streets.less,
          structure: t16.streets.structureLess,
        },
        {
          id: 'difference',
          kind: 'sum',
          start: '60 − 35 =',
          answer: 25,
          say: t16.streets.difference,
          structure: t16.streets.structureDifference,
        },
      ],
      door: 25,
      wrongDoors: [],
      grumpy: t16.streets.grumpy,
      opened: t16.streets.opened,
      example: t16.streets.example,
      keys: knockKeys,
      hint: t16.streets.hint,
    },
    {
      kind: 'knock',
      intro: t16.weeks.intro,
      row: row(40),
      startSide: null,
      picture: bars(
        5,
        [chart.trg1, 20],
        [chart.trg2, 10],
        [chart.most1, 15],
        [chart.most2, 35],
        [chart.pusta1, 25],
        [chart.pusta2, 30],
      ),
      clues: [
        {
          id: 'more',
          kind: 'limit',
          numbers: [10],
          canonical: 'x > 10',
          say: t16.weeks.more,
          structure: t16.weeks.structureMore,
        },
        {
          id: 'difference',
          kind: 'sum',
          start: '35 − 15 =',
          answer: 20,
          say: t16.weeks.difference,
          structure: t16.weeks.structureDifference,
        },
      ],
      door: 20,
      wrongDoors: [],
      grumpy: t16.weeks.grumpy,
      opened: t16.weeks.opened,
      example: t16.weeks.example,
      keys: knockKeys,
      hint: t16.weeks.hint,
    },
    {
      kind: 'knock',
      intro: t16.deliveries.intro,
      row: row(30),
      startSide: null,
      picture: bars(
        1,
        [chart.days.mon, 3],
        [chart.days.tue, 6],
        [chart.days.wed, 2],
        [chart.days.thu, 5],
        [chart.days.fri, 8],
      ),
      clues: [
        {
          id: 'most',
          kind: 'limit',
          numbers: [8],
          canonical: 'x > 8',
          say: t16.deliveries.most,
          structure: t16.deliveries.structureMost,
        },
        {
          id: 'total',
          kind: 'sum',
          start: '3 + 6 + 2 + 5 + 8 =',
          answer: 24,
          say: t16.deliveries.total,
          structure: t16.deliveries.structureTotal,
        },
      ],
      door: 24,
      wrongDoors: [],
      grumpy: t16.deliveries.grumpy,
      opened: t16.deliveries.opened,
      example: t16.deliveries.example,
      keys: knockKeys,
      hint: t16.deliveries.hint,
    },
    // One step on this axis means 10 litres, so what he reads is 3, and what he writes is 30.
    {
      kind: 'knock',
      intro: t16.night.intro,
      row: row(60),
      startSide: null,
      picture: bars(1, [chart.trg, 3], [chart.most, 2], [chart.mlin, 1], [chart.pusta, 6]),
      clues: [
        {
          id: 'more',
          kind: 'limit',
          numbers: [30],
          canonical: 'x > 30',
          say: t16.night.more,
          structure: t16.night.structureMore,
        },
        {
          id: 'difference',
          kind: 'sum',
          start: '60 − 20 =',
          answer: 40,
          say: t16.night.difference,
          structure: t16.night.structureDifference,
        },
      ],
      door: 40,
      wrongDoors: [],
      grumpy: t16.night.grumpy,
      opened: t16.night.opened,
      example: t16.night.example,
      keys: knockKeys,
      hint: t16.night.hint,
    },
  ],
  writeUp: [
    { say: t16.write.fade, start: '35 − 15 = ☐', accepts: ['35 − 15 = 20'], keys: [] },
    { say: t16.write.whole, start: '', accepts: ['60 − 35 = 25'], keys: ['−', '='] },
  ],
  find: { say: t16.find.say, title: t16.find.title, card: t16.find.card },
};

export const act4Leads = { l12, l13, l14, l15, l16 };
