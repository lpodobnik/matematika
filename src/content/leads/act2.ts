// The leads and knots of Acts 1 and 2 not yet written as their own files (GDD, Structure): the
// neighbours, Knot 1, the wandering-off, the witnesses, the ledgers, the facade and Knot 2. A lead's
// id is stored in saves. Worked examples use other numbers than the scenes do.

import { act2Text } from '@/content/text/hunt-act2';
import type { LineState } from '@/hunt/objects';
import type { LeadSpec } from '@/hunt/spec';
import type { SToken } from '@/math/statement-tokens';

const line = (
  from: number,
  to: number,
  lit: readonly number[] = [],
  marked: number | null = null,
): LineState => ({ kind: 'line', from, to, lit, marked });

/** A Knock's pad in Act 1: what has been taught that a line can use. */
const act1Keys: readonly SToken[] = ['+', '−', '·', ':'];
/** A Knock's pad with ranges and lists. */
const rangeKeys: readonly SToken[] = ['x', '<', '≤', '>', '≥', '≠', ',', '{', '}'];
/** Knot 2's pad: the range signs first, as its first lines need them. */
const act2Keys: readonly SToken[] = [
  'x',
  '≤',
  '<',
  '≥',
  '>',
  '≠',
  '−',
  '+',
  '·',
  ':',
  ',',
  '{',
  '}',
];

/* ------------------------------ The neighbours ------------------------------ */

const neighbours = act2Text.l02;
const nine = 999;

export const l02: LeadSpec = {
  id: 'l02',
  act: 1,
  street: 'u1',
  title: neighbours.title,
  lesson: {
    found: neighbours.lesson.found,
    steps: [
      { object: line(5, 9, [6, 8], 7), say: neighbours.lesson.steps[0] },
      { object: line(5, 9, [7], 6), say: neighbours.lesson.steps[1] },
      { object: line(5, 9, [7], 8), say: neighbours.lesson.steps[2] },
      { object: line(698, 701, [699], 700), say: neighbours.lesson.steps[3] },
      { object: line(5, 9, [6, 8]), say: neighbours.lesson.steps[4] },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: neighbours.tries.mark,
      object: line(96, 101),
      goal: { kind: 'line-mark', at: 100 },
    },
    {
      kind: 'line',
      say: neighbours.tries.up,
      start: '4 999 + 1 =',
      accepts: ['4 999 + 1 = 5 000'],
      keys: [],
    },
    {
      kind: 'line',
      say: neighbours.tries.down,
      start: '7 000 − 1 =',
      accepts: ['7 000 − 1 = 6 999'],
      keys: [],
    },
  ],
  mistake: {
    id: 'l02-nine-plus-one',
    say: neighbours.mistake.say,
    lines: ['45 + 1 = 46', '299 + 1 = 2 910'],
    wrong: 1,
    nudge: neighbours.mistake.nudge,
    show: {
      say: neighbours.mistake.show,
      object: line(297, 301),
      goal: { kind: 'line-mark', at: 300 },
    },
    write: {
      say: neighbours.mistake.write,
      start: '299 + 1 =',
      accepts: ['299 + 1 = 300'],
      keys: [],
    },
    thanks: neighbours.mistake.thanks,
  },
  scenes: [
    {
      kind: 'knock',
      intro: neighbours.street.intro,
      // One side only, so that the numbers run on and next door really is the next number.
      row: { kind: 'street', from: 985, to: 1015 },
      startSide: null,
      clues: [
        {
          id: 'witness',
          kind: 'sum',
          start: '999 + 1 =',
          answer: 1000,
          say: neighbours.street.witness,
          structure: neighbours.street.structureWitness,
        },
        {
          id: 'above',
          kind: 'sum',
          start: '1 001 − 1 =',
          answer: 1000,
          say: neighbours.street.above,
          structure: neighbours.street.structureAbove,
        },
        {
          id: 'postman',
          kind: 'sum',
          start: '998 + 1 + 1 =',
          answer: 1000,
          say: neighbours.street.postman,
          structure: neighbours.street.structurePostman,
        },
      ],
      door: 1000,
      wrongDoors: [
        { door: 998, say: neighbours.street.wrongBelow },
        { door: nine, say: neighbours.street.wrongWitness },
      ],
      grumpy: neighbours.street.grumpy,
      opened: neighbours.street.opened,
      example: neighbours.street.example,
      keys: act1Keys,
      hint: neighbours.street.hint,
      context: { vars: { n: nine } },
    },
    {
      kind: 'knock',
      intro: neighbours.riddle.intro,
      row: { kind: 'street', from: 10, to: 30 },
      startSide: null,
      clues: [
        {
          id: 'riddle',
          kind: 'sum',
          start: '18 − 1 =',
          answer: 17,
          say: neighbours.riddle.clue,
          structure: neighbours.riddle.structure,
        },
      ],
      door: 17,
      wrongDoors: [
        { door: 18, say: neighbours.riddle.wrongEighteen },
        { door: 16, say: neighbours.riddle.wrongSixteen },
      ],
      grumpy: neighbours.riddle.grumpy,
      opened: neighbours.riddle.opened,
      example: neighbours.riddle.example,
      keys: [],
      hint: neighbours.riddle.hint,
    },
  ],
  writeUp: [
    {
      say: neighbours.write.fade,
      start: 'n + ☐ = 1 000',
      accepts: ['n + 1 = 1 000'],
      keys: [],
      context: { vars: { n: nine } },
      // The houses either side of the witness's: 998, n and 1 000.
      object: {
        kind: 'line',
        from: 997,
        to: 1001,
        lit: [998, 1000],
        marked: null,
        point: { at: 999, label: 'n' },
      },
    },
    {
      say: neighbours.write.down,
      start: '',
      accepts: ['n − 1 = 998'],
      keys: ['n', '−', '='],
      context: { vars: { n: nine } },
      // The houses either side of the witness's: 998, n and 1 000.
      object: {
        kind: 'line',
        from: 997,
        to: 1001,
        lit: [998, 1000],
        marked: null,
        point: { at: 999, label: 'n' },
      },
    },
  ],
  find: { say: neighbours.find.say, title: neighbours.find.title, card: neighbours.find.card },
};

/* ------------------------------ Knot 1 ------------------------------ */

const knotOne = act2Text.k1;

export const k1: LeadSpec = {
  id: 'k1',
  act: 1,
  street: 'u1',
  title: knotOne.title,
  lesson: { found: '', steps: [] },
  tries: [],
  mistake: null,
  gives: 'hook',
  beats: ['hook-given'],
  scenes: [
    {
      kind: 'guard',
      id: 'rule-1',
      rule: knotOne.guard.rule,
      intro: knotOne.guard.intro,
      tiles: [
        { id: 'same', face: '3 i 3', breaks: false, thanks: knotOne.guard.thanks.same },
        { id: 'ones', face: '13 i 23', breaks: false, thanks: knotOne.guard.thanks.ones },
        { id: 'moved', face: '3 i 30', breaks: true, thanks: '' },
        { id: 'tens', face: '30 i 35', breaks: false, thanks: knotOne.guard.thanks.tens },
        { id: 'other', face: '4 i 9', breaks: false, thanks: knotOne.guard.thanks.other },
        { id: 'long', face: '203 i 503', breaks: false, thanks: knotOne.guard.thanks.long },
      ],
      write: {
        say: knotOne.guard.write,
        start: '30 =',
        accepts: ['30 = 3 · 10', '30 = 10 · 3'],
        keys: ['·'],
      },
      jammed: knotOne.guard.jammed,
      example: knotOne.guard.example,
      hint: knotOne.guard.hint,
    },
    {
      kind: 'knock',
      intro: knotOne.knock.intro,
      row: { kind: 'street', from: 21, to: 60 },
      startSide: 'even',
      clues: [
        { id: 'side', kind: 'side', side: 'odd', say: knotOne.knock.side },
        {
          id: 'slip',
          kind: 'sum',
          start: '3 · 10 + 5 =',
          answer: 35,
          say: knotOne.knock.slip,
          structure: knotOne.knock.structureSlip,
        },
        {
          id: 'tram',
          kind: 'sum',
          start: '25 + 2 · 5 =',
          answer: 35,
          say: knotOne.knock.tram,
          structure: knotOne.knock.structureTram,
        },
        {
          id: 'watchman',
          kind: 'member',
          start: '☐ ∈ N',
          answer: 35,
          say: knotOne.knock.watchman,
          structure: knotOne.knock.structureWatchman,
        },
      ],
      door: 35,
      wrongDoors: [],
      grumpy: knotOne.knock.grumpy,
      opened: knotOne.knock.opened,
      example: knotOne.knock.example,
      keys: act1Keys,
      hint: knotOne.knock.hint,
    },
  ],
  writeUp: [],
  find: { say: knotOne.find.say, title: knotOne.find.title, card: knotOne.find.card },
};

/* ------------------------------ The wandering-off ------------------------------ */

const wandering = act2Text.w1;

export const w1: LeadSpec = {
  id: 'w1',
  act: 2,
  street: 'u1',
  title: wandering.title,
  lesson: { found: '', steps: [] },
  tries: [],
  mistake: null,
  beats: ['wandered', 'found'],
  scenes: [
    {
      kind: 'knock',
      lost: true,
      intro: wandering.knock.intro,
      row: { kind: 'street', from: 50, to: 80 },
      startSide: 'odd',
      clues: [
        { id: 'side', kind: 'side', side: 'even', say: wandering.knock.side },
        {
          id: 'baker',
          kind: 'sum',
          start: '63 + 1 =',
          answer: 64,
          say: wandering.knock.baker,
          structure: wandering.knock.structureBaker,
        },
        {
          id: 'boy',
          kind: 'sum',
          start: '6 · 10 + 4 =',
          answer: 64,
          say: wandering.knock.boy,
          structure: wandering.knock.structureBoy,
        },
      ],
      door: 64,
      wrongDoors: [],
      grumpy: wandering.knock.grumpy,
      opened: wandering.knock.opened,
      example: wandering.knock.example,
      keys: act1Keys,
      hint: wandering.knock.hint,
    },
  ],
  writeUp: [],
  find: { say: wandering.find.say, title: wandering.find.title, card: wandering.find.card },
};

/* ------------------------------ The witnesses ------------------------------ */

const witnesses = act2Text.l05;
const between = line(11, 17);

export const l05: LeadSpec = {
  id: 'l05',
  act: 2,
  street: 'u1',
  title: witnesses.title,
  lesson: {
    found: witnesses.lesson.found,
    steps: [
      { object: line(45, 55, [47, 52]), say: witnesses.lesson.steps[0] },
      { object: line(525, 535, [527, 531]), say: witnesses.lesson.steps[1] },
      { object: { ...between, lit: [13, 14, 15] }, say: witnesses.lesson.steps[2] },
      { object: { ...between, lit: [12, 13, 14, 15] }, say: witnesses.lesson.steps[3] },
      { object: { ...between, lit: [13, 15] }, say: witnesses.lesson.steps[4] },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: witnesses.tries.mark,
      object: line(20, 30),
      goal: { kind: 'line-mark', at: 25 },
    },
    {
      kind: 'line',
      say: witnesses.tries.list,
      object: line(20, 24),
      start: '{21, ☐, 23}',
      accepts: ['{21, 22, 23}'],
      keys: [],
      context: { list: [21, 22, 23] },
    },
    {
      kind: 'line',
      say: witnesses.tries.range,
      start: '',
      accepts: ['340 < x < 350', '350 > x > 340'],
      keys: ['x', '<', '>'],
    },
  ],
  mistake: {
    id: 'l05-end-counts',
    say: witnesses.mistake.say,
    lines: ['2 < x < 5', '{2, 3, 4, 5}'],
    wrong: 1,
    context: { list: [3, 4] },
    nudge: witnesses.mistake.nudge,
    show: {
      say: witnesses.mistake.show,
      object: line(2, 5),
      goal: { kind: 'line-mark', at: 3 },
    },
    write: {
      say: witnesses.mistake.write,
      start: '',
      accepts: ['{3, 4}', '{4, 3}'],
      keys: ['{', '}', ','],
      context: { list: [3, 4] },
    },
    thanks: witnesses.mistake.thanks,
  },
  scenes: [
    {
      kind: 'knock',
      intro: witnesses.scene.intro,
      row: { kind: 'street', from: 220, to: 250 },
      startSide: 'odd',
      clues: [
        { id: 'side', kind: 'side', side: 'even', say: witnesses.scene.side },
        {
          id: 'range',
          kind: 'limit',
          numbers: [230, 240],
          canonical: '230 < x < 240',
          say: witnesses.scene.range,
          structure: witnesses.scene.structureRange,
        },
        {
          id: 'not',
          kind: 'limit',
          numbers: [232],
          canonical: 'x ≠ 232',
          say: witnesses.scene.not,
          structure: witnesses.scene.structureNot,
        },
        {
          id: 'up-to',
          kind: 'limit',
          numbers: [234],
          canonical: 'x ≤ 234',
          say: witnesses.scene.upTo,
          structure: witnesses.scene.structureUpTo,
        },
      ],
      door: 234,
      wrongDoors: [{ door: 232, say: witnesses.scene.wrongBaker }],
      grumpy: witnesses.scene.grumpy,
      opened: witnesses.scene.opened,
      example: witnesses.scene.example,
      keys: rangeKeys,
      hint: witnesses.scene.hint,
      context: { vars: { x: 234 } },
    },
  ],
  writeUp: [
    {
      say: witnesses.write.range,
      start: '230 ☐ x < 240',
      accepts: ['230 < x < 240'],
      keys: ['<', '≤'],
    },
    {
      say: witnesses.write.list,
      start: '',
      accepts: ['{232, 234, 236, 238}'],
      keys: ['{', '}', ','],
      context: { list: [232, 234, 236, 238] },
    },
  ],
  find: { say: witnesses.find.say, title: witnesses.find.title, card: witnesses.find.card },
};

/* ------------------------------ The ledgers ------------------------------ */

const ledgers = act2Text.l07;

export const l07: LeadSpec = {
  id: 'l07',
  act: 2,
  street: 'u1',
  title: ledgers.title,
  lesson: {
    found: ledgers.lesson.found,
    steps: [
      { object: line(0, 14, [9, 14], 14), say: ledgers.lesson.steps[0] },
      { object: line(0, 14, [5, 14], 14), say: ledgers.lesson.steps[1] },
      {
        object: { kind: 'places', names: ledgers.places, counts: [1, 4, 8] },
        say: ledgers.lesson.steps[2],
      },
      { object: line(0, 14, [5, 14], 9), say: ledgers.lesson.steps[3] },
      {
        object: { kind: 'line', from: 70, to: 90, step: 5, lit: [90, 75, 70], marked: 70 },
        say: ledgers.lesson.steps[4],
      },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: ledgers.tries.jump,
      object: line(0, 15),
      goal: { kind: 'line-mark', at: 13 },
    },
    {
      kind: 'line',
      say: ledgers.tries.pair,
      start: '46 + 27 + 54 =',
      accepts: ['46 + 27 + 54 = 127', '46 + 27 + 54 = 100 + 27 = 127'],
      keys: ['+', '='],
    },
    {
      kind: 'line',
      say: ledgers.tries.out,
      start: '84 − 16 − 24 = 84 − ☐ = 44',
      accepts: ['84 − 16 − 24 = 84 − 40 = 44'],
      keys: [],
    },
  ],
  mistake: {
    id: 'l07-borrow-zero',
    say: ledgers.mistake.say,
    lines: ['300 − 100 = 200', '300 − 189 = 289'],
    wrong: 1,
    nudge: ledgers.mistake.nudge,
    show: {
      say: ledgers.mistake.show,
      object: line(105, 115),
      goal: { kind: 'line-mark', at: 111 },
    },
    write: {
      say: ledgers.mistake.write,
      start: '300 − 189 =',
      accepts: ['300 − 189 = 111'],
      keys: [],
    },
    thanks: ledgers.mistake.thanks,
  },
  scenes: [
    {
      kind: 'unmask',
      intro: ledgers.scene.intro,
      suspects: [
        {
          id: 'prva',
          name: ledgers.scene.who.prva,
          offended: ledgers.scene.offended.prva,
          why: ledgers.scene.why.prva,
        },
        {
          id: 'druga',
          name: ledgers.scene.who.druga,
          offended: ledgers.scene.offended.druga,
          why: ledgers.scene.why.druga,
        },
        { id: 'ljevaonica', name: ledgers.scene.who.ljevaonica, offended: '', why: '' },
      ],
      cards: [
        {
          id: 'a',
          ask: ledgers.scene.cards.a,
          answers: {
            prva: '423 − 37 − 54 = 423 − 91 = 332',
            druga: '423 − 37 − 54 = 423 − 91 = 332',
            ljevaonica: '423 − 37 − 54 = 423 − 17 = 406',
          },
        },
        {
          id: 'b',
          ask: ledgers.scene.cards.b,
          answers: {
            prva: '5 200 − 480 − 320 = 5 200 − 800 = 4 400',
            // One slip, in one digit.
            druga: '5 200 − 480 − 320 = 5 200 − 800 = 4 300',
            ljevaonica: '5 200 − 480 − 320 = 5 200 − 160 = 5 040',
          },
        },
        {
          // Too big to bother calculating: he has to judge what's taken away.
          id: 'c',
          ask: ledgers.scene.cards.c,
          answers: {
            prva: '700 000 000 − 30 − 20 = 700 000 000 − 50',
            druga: '700 000 000 − 30 − 20 = 700 000 000 − 50',
            ljevaonica: '700 000 000 − 30 − 20 = 700 000 000 − 10',
          },
        },
      ],
      required: 2,
      guilty: 'ljevaonica',
      reveal: ledgers.scene.reveal,
      fix: {
        say: ledgers.scene.fix,
        start: '423 − 37 − 54 =',
        accepts: ['423 − 37 − 54 = 423 − 91 = 332', '423 − 37 − 54 = 332'],
        keys: ['−', '='],
      },
      opened: ledgers.scene.opened,
      example: ledgers.scene.example,
      hint: ledgers.scene.hint,
    },
  ],
  writeUp: [
    { say: ledgers.write.pair, start: '37 + 54 = ☐', accepts: ['37 + 54 = 91'], keys: [] },
    {
      say: ledgers.write.whole,
      start: '423 − 37 − 54 =',
      accepts: ['423 − 37 − 54 = 423 − 91 = 332'],
      keys: ['−', '='],
    },
  ],
  find: { say: ledgers.find.say, title: ledgers.find.title, card: ledgers.find.card },
};

/* ------------------------------ The facade ------------------------------ */

const facade = act2Text.l08;

export const l08: LeadSpec = {
  id: 'l08',
  act: 2,
  street: 'u1',
  title: facade.title,
  lesson: {
    found: facade.lesson.found,
    steps: [
      { object: { kind: 'grid', rows: 4, columns: 5 }, say: facade.lesson.steps[0] },
      { object: { kind: 'grid', rows: 4, columns: 5 }, say: facade.lesson.steps[1] },
      { object: { kind: 'grid', rows: 2, columns: 5 }, say: facade.lesson.steps[2] },
      { object: { kind: 'grid', rows: 3, columns: 10 }, say: facade.lesson.steps[3] },
      { object: { kind: 'grid', rows: 5, columns: 0 }, say: facade.lesson.steps[4] },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: facade.tries.build,
      object: { kind: 'grid', rows: 2, columns: 2 },
      goal: { kind: 'grid-size', rows: 3, columns: 6 },
    },
    {
      kind: 'line',
      say: facade.tries.last,
      start: '7 · 4 =',
      accepts: ['7 · 4 = 28'],
      keys: [],
    },
    {
      kind: 'line',
      say: facade.tries.big,
      start: '40 · 100 =',
      accepts: ['40 · 100 = 4 000'],
      keys: [],
    },
  ],
  mistake: {
    id: 'l08-zero-keeps',
    say: facade.mistake.say,
    lines: ['8 · 1 = 8', '8 · 0 = 8'],
    wrong: 1,
    nudge: facade.mistake.nudge,
    show: {
      say: facade.mistake.show,
      object: { kind: 'grid', rows: 8, columns: 1 },
      goal: { kind: 'grid-size', rows: 8, columns: 0 },
    },
    write: {
      say: facade.mistake.write,
      start: '8 · 0 =',
      accepts: ['8 · 0 = 0'],
      keys: [],
    },
    thanks: facade.mistake.thanks,
  },
  scenes: [
    {
      kind: 'windows',
      intro: facade.scene.intro,
      rounds: [
        // The last of 6 rows of 7.
        { rows: 6, columns: 7, target: 42, say: facade.scene.rounds.first },
        // The end of the third row, not of the building.
        { rows: 5, columns: 8, target: 24, say: facade.scene.rounds.second },
        // A larger building, and the end of the sixth row.
        { rows: 8, columns: 9, target: 54, say: facade.scene.rounds.third },
      ],
      sleepy: facade.scene.sleepy,
      reached: facade.scene.reached,
      opened: facade.scene.opened,
      example: facade.scene.example,
      hint: facade.scene.hint,
    },
  ],
  writeUp: [
    { say: facade.write.fade, start: '☐ · 7 = 42', accepts: ['6 · 7 = 42'], keys: [] },
    {
      say: facade.write.whole,
      start: '',
      accepts: ['3 · 8 = 24', '8 · 3 = 24'],
      keys: ['·', '='],
    },
  ],
  find: { say: facade.find.say, title: facade.find.title, card: facade.find.card },
};

/* ------------------------------ Knot 2 ------------------------------ */

const knotTwo = act2Text.k2;

export const k2: LeadSpec = {
  id: 'k2',
  act: 2,
  street: 'u1',
  title: knotTwo.title,
  lesson: { found: '', steps: [] },
  tries: [],
  mistake: null,
  scenes: [
    {
      kind: 'guard',
      id: 'rule-2',
      rule: knotTwo.guard.rule,
      intro: knotTwo.guard.intro,
      tiles: [
        { id: 't21', face: '21', breaks: false, thanks: knotTwo.guard.thanks.one },
        { id: 't38', face: '38', breaks: false, thanks: knotTwo.guard.thanks.eight },
        { id: 't25', face: '25', breaks: true, thanks: '' },
        { id: 't34', face: '34', breaks: false, thanks: knotTwo.guard.thanks.four },
        { id: 't52', face: '52', breaks: false, thanks: knotTwo.guard.thanks.tens },
        { id: 't47', face: '47', breaks: false, thanks: knotTwo.guard.thanks.seven },
      ],
      write: { say: knotTwo.guard.write, start: '25 ≈', accepts: ['25 ≈ 30'], keys: [] },
      jammed: knotTwo.guard.jammed,
      example: knotTwo.guard.example,
      hint: knotTwo.guard.hint,
    },
    {
      kind: 'knock',
      intro: knotTwo.knock.intro,
      row: { kind: 'street', from: 300, to: 360 },
      startSide: 'odd',
      clues: [
        { id: 'side', kind: 'side', side: 'even', say: knotTwo.knock.side },
        {
          id: 'news',
          kind: 'limit',
          numbers: [325, 334],
          canonical: '325 ≤ x ≤ 334',
          say: knotTwo.knock.news,
          structure: knotTwo.knock.structureNews,
        },
        {
          id: 'chalk',
          kind: 'limit',
          numbers: [330],
          canonical: 'x ≠ 330',
          say: knotTwo.knock.chalk,
          structure: knotTwo.knock.structureChalk,
        },
        {
          id: 'books',
          kind: 'sum',
          start: '423 − 37 − 54 =',
          answer: 332,
          say: knotTwo.knock.books,
          structure: knotTwo.knock.structureBooks,
        },
        {
          // The careless mistake: he can copy its 334 onto the books' line, or work the sum out.
          id: 'note',
          kind: 'sum',
          start: '423 − 37 − 54 =',
          answer: 334,
          say: knotTwo.knock.note,
          structure: knotTwo.knock.structureNote,
        },
      ],
      door: 332,
      wrongDoors: [{ door: 334, say: knotTwo.knock.notice }],
      grumpy: knotTwo.knock.grumpy,
      opened: knotTwo.knock.opened,
      example: knotTwo.knock.example,
      keys: act2Keys,
      hint: knotTwo.knock.hint,
      context: { vars: { x: 332 } },
      forged: 'note',
    },
  ],
  writeUp: [],
  find: { say: knotTwo.find.say, title: knotTwo.find.title, card: knotTwo.find.card },
};

export const act2Leads = { l02, k1, w1, l05, l07, l08, k2 };
