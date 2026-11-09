// Act 3, the convoy (GDD, Structure): the crate yard, the sixth cart, the coat and Knot 3. The coat
// is the act's last lead, so only its own text may give it away.

import { act3Text as text } from '@/content/text/hunt-act3';
import type { BundlesState, GridState, PackingState } from '@/hunt/objects';
import type { LeadSpec } from '@/hunt/spec';
import type { SToken } from '@/math/statement-tokens';

const grid = (rows: number, columns: number): GridState => ({ kind: 'grid', rows, columns });
const packing = (items: number, per: number): PackingState => ({ kind: 'packing', items, per });
const bundles = (loose: number, count: number, size: number): BundlesState => ({
  kind: 'bundles',
  loose,
  bundles: count,
  size,
});

/** A Knock's pad: the signs he has been taught so far that these streets can use. */
const knockSigns: readonly SToken[] = ['+', '−', '·', ':', '=', 'x', '<', '>', '≤', '≥', '≠'];

// The crate yard: swapping and grouping factors. Crates counted the clever way, to 6 digits.
const l09: LeadSpec = {
  id: 'l09',
  act: 3,
  street: 'u1',
  title: text.l09.title,
  lesson: {
    found: text.l09.lesson.found,
    steps: [
      { object: grid(3, 7), say: text.l09.lesson.steps[0] },
      { object: grid(7, 3), say: text.l09.lesson.steps[1] },
      { object: grid(2, 5), say: text.l09.lesson.steps[2] },
      { object: grid(3, 10), say: text.l09.lesson.steps[3] },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: text.l09.tries.turn,
      object: grid(4, 6),
      goal: { kind: 'grid-size', rows: 6, columns: 4 },
    },
    {
      kind: 'line',
      say: text.l09.tries.pair,
      object: grid(2, 5),
      start: '6 · 2 · 5 =',
      accepts: ['6 · 2 · 5 = 60', '6 · 2 · 5 = 6 · 10 = 60', '6 · 2 · 5 = 10 · 6 = 60'],
      keys: ['·', '='],
    },
    {
      kind: 'line',
      say: text.l09.tries.big,
      start: '25 · 9 · 4 =',
      accepts: ['25 · 9 · 4 = 900', '25 · 9 · 4 = 100 · 9 = 900', '25 · 9 · 4 = 9 · 100 = 900'],
      keys: ['·', '='],
    },
  ],
  // From the content document's traps: `200 · 400 − 400 · 200` is 0.
  mistake: {
    id: 'l09-first-factor-counts-more',
    say: text.l09.mistake.say,
    lines: ['25 · 4 · 3 = 300', '4 · 3 − 3 · 4 = 1'],
    wrong: 1,
    nudge: text.l09.mistake.nudge,
    show: {
      say: text.l09.mistake.show,
      object: grid(4, 3),
      goal: { kind: 'grid-size', rows: 3, columns: 4 },
    },
    write: {
      say: text.l09.mistake.write,
      start: '4 · 3 − 3 · 4 =',
      accepts: ['4 · 3 − 3 · 4 = 0', '4 · 3 − 3 · 4 = 12 − 12 = 0'],
      keys: ['−', '='],
    },
    thanks: text.l09.mistake.thanks,
  },
  scenes: [
    {
      kind: 'knock',
      intro: text.l09.yard.intro,
      row: { kind: 'street', from: 6980, to: 7020 },
      startSide: 'odd',
      clues: [
        { id: 'side', kind: 'side', side: 'even', say: text.l09.yard.side },
        {
          id: 'first',
          kind: 'sum',
          start: '125 · 7 · 8 =',
          answer: 7000,
          say: text.l09.yard.first,
          structure: text.l09.yard.structureFirst,
        },
        {
          id: 'second',
          kind: 'sum',
          start: '8 · 7 · 125 =',
          answer: 7000,
          say: text.l09.yard.second,
          structure: text.l09.yard.structureSecond,
        },
      ],
      door: 7000,
      wrongDoors: [],
      grumpy: text.l09.yard.grumpy,
      opened: text.l09.yard.opened,
      example: text.l09.yard.example,
      keys: knockSigns,
      hint: text.l09.yard.hint,
    },
    {
      kind: 'knock',
      intro: text.l09.big.intro,
      row: { kind: 'street', from: 729_980, to: 730_020 },
      startSide: 'odd',
      clues: [
        { id: 'side', kind: 'side', side: 'even', say: text.l09.big.side },
        {
          id: 'factors',
          kind: 'sum',
          start: '5 · 73 · 2 · 125 · 8 =',
          answer: 730_000,
          say: text.l09.big.factors,
          structure: text.l09.big.structureFactors,
        },
        {
          id: 'rows',
          kind: 'sum',
          start: '730 · 1 000 =',
          answer: 730_000,
          say: text.l09.big.rows,
          structure: text.l09.big.structureRows,
        },
      ],
      door: 730_000,
      wrongDoors: [],
      grumpy: text.l09.big.grumpy,
      opened: text.l09.big.opened,
      example: text.l09.big.example,
      keys: knockSigns,
      hint: text.l09.big.hint,
    },
  ],
  writeUp: [
    { say: text.l09.write.pair, start: '125 · 8 = ☐', accepts: ['125 · 8 = 1 000'], keys: [] },
    {
      say: text.l09.write.whole,
      start: '',
      accepts: ['125 · 7 · 8 = 1 000 · 7 = 7 000', '125 · 7 · 8 = 7 · 1 000 = 7 000'],
      keys: ['·', '='],
    },
  ],
  beats: ['warned'],
  find: { say: text.l09.find.say, title: text.l09.find.title, card: text.l09.find.card },
};

// The sixth cart: division's two meanings, and zero. 120 crates, 20 per cart, is 6 carts, but a
// witness saw 5.
const l10: LeadSpec = {
  id: 'l10',
  act: 3,
  street: 'u1',
  title: text.l10.title,
  lesson: {
    found: text.l10.lesson.found,
    steps: [
      { object: packing(12, 4), say: text.l10.lesson.steps[0] },
      { object: packing(12, 4), say: text.l10.lesson.steps[1] },
      { object: packing(12, 3), say: text.l10.lesson.steps[2] },
      { object: packing(12, 3), say: text.l10.lesson.steps[3] },
      { object: packing(12, 3), say: text.l10.lesson.steps[4] },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: text.l10.tries.per,
      object: packing(8, 1),
      goal: { kind: 'packing-per', per: 2 },
    },
    {
      kind: 'line',
      say: text.l10.tries.share,
      object: packing(18, 6),
      start: '18 : 3 =',
      accepts: ['18 : 3 = 6'],
      keys: [],
    },
    {
      kind: 'line',
      say: text.l10.tries.slash,
      start: '40 : 8 =',
      accepts: ['40 : 8 = 5'],
      keys: [],
    },
  ],
  // From the content document's traps: "3 puta manje" divides, "za 3 manje" subtracts.
  mistake: {
    id: 'l10-takes-away-instead',
    say: text.l10.mistake.say,
    lines: ['15 − 3 = 12', '15 : 3 = 12'],
    wrong: 1,
    nudge: text.l10.mistake.nudge,
    show: {
      say: text.l10.mistake.show,
      object: packing(15, 1),
      goal: { kind: 'packing-per', per: 3 },
    },
    write: {
      say: text.l10.mistake.write,
      start: '15 : 3 =',
      accepts: ['15 : 3 = 5'],
      keys: [],
    },
    thanks: text.l10.mistake.thanks,
  },
  scenes: [
    {
      kind: 'carts',
      intro: text.l10.scene.intro,
      rounds: [
        {
          kind: 'share',
          crates: 120,
          carts: 6,
          bundle: 10,
          say: text.l10.scene.share.say,
          line: {
            say: text.l10.scene.share.line,
            start: '120 : 6 =',
            accepts: ['120 : 6 = 20'],
            keys: [],
          },
        },
        {
          kind: 'loads',
          crates: 120,
          per: 20,
          bundle: 10,
          say: text.l10.scene.loads.say,
          line: {
            say: text.l10.scene.loads.line,
            start: '120 : 20 =',
            accepts: ['120 : 20 = 6'],
            keys: [],
          },
        },
        {
          kind: 'share',
          crates: 60,
          carts: 3,
          bundle: 10,
          say: text.l10.scene.fewer.say,
          line: {
            say: text.l10.scene.fewer.line,
            start: '60 : 3 =',
            accepts: ['60 : 3 = 20'],
            keys: [],
          },
        },
        {
          kind: 'share',
          crates: 1200,
          carts: 6,
          bundle: 200,
          say: text.l10.scene.big.say,
          line: {
            say: text.l10.scene.big.line,
            start: '1 200 : 6 =',
            accepts: ['1 200 : 6 = 200'],
            keys: [],
          },
        },
        {
          kind: 'no-carts',
          crates: 120,
          say: text.l10.scene.noCarts.say,
          result: text.l10.scene.noCarts.result,
        },
        {
          kind: 'no-crates',
          carts: 3,
          say: text.l10.scene.noCrates.say,
          line: {
            say: text.l10.scene.noCrates.line,
            start: '0 : 3 =',
            accepts: ['0 : 3 = 0'],
            keys: [],
          },
        },
      ],
      tipped: text.l10.scene.tipped,
      left: text.l10.scene.left,
      opened: text.l10.scene.opened,
      example: text.l10.scene.example,
      hint: text.l10.scene.hint,
    },
  ],
  writeUp: [
    { say: text.l10.write.fewer, start: '60 : 3 = ☐', accepts: ['60 : 3 = 20'], keys: [] },
    { say: text.l10.write.minus, start: '60 − 3 = ☐', accepts: ['60 − 3 = 57'], keys: [] },
    { say: text.l10.write.whole, start: '', accepts: ['120 : 20 = 6'], keys: [':', '='] },
  ],
  find: { say: text.l10.find.say, title: text.l10.find.title, card: text.l10.find.card },
};

// The coat, the part's biggest moment: order of operations. Bundles draw a sum but don't move, so
// the lesson shows them, and what he moves in Try and Fix is the grid.
const l11: LeadSpec = {
  id: 'l11',
  act: 3,
  street: 'u1',
  title: text.l11.title,
  lesson: {
    found: text.l11.lesson.found,
    steps: [
      { object: bundles(3, 2, 5), say: text.l11.lesson.steps[0] },
      { object: bundles(3, 2, 5), say: text.l11.lesson.steps[1] },
      { object: packing(8, 2), say: text.l11.lesson.steps[2] },
      { object: bundles(4, 3, 2), say: text.l11.lesson.steps[3] },
      { object: bundles(4, 3, 2), say: text.l11.lesson.steps[4] },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: text.l11.tries.bundle,
      object: grid(1, 5),
      goal: { kind: 'grid-size', rows: 3, columns: 5 },
    },
    {
      kind: 'line',
      say: text.l11.tries.add,
      object: grid(3, 5),
      start: '4 + 3 · 5 =',
      accepts: ['4 + 3 · 5 = 19', '4 + 3 · 5 = 4 + 15 = 19'],
      keys: ['+', '='],
    },
    {
      kind: 'line',
      say: text.l11.tries.numbers,
      start: '20 − 12 : 4 =',
      accepts: ['20 − 12 : 4 = 17', '20 − 12 : 4 = 20 − 3 = 17'],
      keys: ['−', '='],
    },
  ],
  mistake: {
    id: 'l11-left-to-right',
    say: text.l11.mistake.say,
    lines: ['2 · 3 + 4 = 10', '2 + 3 · 4 = 20'],
    wrong: 1,
    nudge: text.l11.mistake.nudge,
    show: {
      say: text.l11.mistake.show,
      object: grid(5, 4),
      goal: { kind: 'grid-size', rows: 3, columns: 4 },
    },
    write: {
      say: text.l11.mistake.write,
      start: '2 + 3 · 4 =',
      accepts: ['2 + 3 · 4 = 14', '2 + 3 · 4 = 2 + 12 = 14'],
      keys: ['+', '='],
    },
    thanks: text.l11.mistake.thanks,
  },
  scenes: [
    {
      kind: 'unmask',
      intro: text.l11.unmask.intro,
      suspects: [
        {
          id: 'milka',
          name: text.l11.unmask.who.milka,
          offended: text.l11.unmask.offended.milka,
          why: text.l11.unmask.why.milka,
        },
        {
          id: 'nikola',
          name: text.l11.unmask.who.nikola,
          offended: text.l11.unmask.offended.nikola,
          why: text.l11.unmask.why.nikola,
        },
        {
          id: 'belusic',
          name: text.l11.unmask.who.belusic,
          offended: text.l11.unmask.offended.belusic,
          why: text.l11.unmask.why.belusic,
        },
        {
          id: 'zagorka',
          name: text.l11.unmask.who.zagorka,
          offended: text.l11.unmask.offended.zagorka,
          why: text.l11.unmask.why.zagorka,
        },
        { id: 'vucetic', name: text.l11.unmask.who.vucetic, offended: '', why: '' },
      ],
      cards: [
        {
          id: 'a',
          ask: text.l11.unmask.cards.a,
          answers: {
            milka: '2 + 2 : 2 = 2 + 1 = 3',
            nikola: '2 + 2 : 2 = 2 + 1 = 3',
            belusic: '2 + 2 : 2 = 2 + 1 = 3',
            zagorka: '2 + 2 : 2 = 2 + 1 = 3',
            vucetic: '2 + 2 : 2 = 4 : 2 = 2',
          },
        },
        {
          id: 'b',
          ask: text.l11.unmask.cards.b,
          answers: {
            milka: '6 + 4 · 2 = 6 + 8 = 14',
            nikola: '6 + 4 · 2 = 6 + 8 = 15',
            belusic: '6 + 4 · 2 = 6 + 8 = 14',
            zagorka: '6 + 4 · 2 = 6 + 8 = 14',
            vucetic: '6 + 4 · 2 = 10 · 2 = 20',
          },
        },
        {
          id: 'c',
          ask: text.l11.unmask.cards.c,
          answers: {
            milka: '30 − 6 : 2 = 30 − 3 = 27',
            nikola: '30 − 6 : 2 = 30 − 3 = 27',
            belusic: '30 − 6 : 2 = 30 − 3 = 27',
            zagorka: '30 − 6 : 2 = 30 − 3 = 30',
            vucetic: '30 − 6 : 2 = 24 : 2 = 12',
          },
        },
        {
          id: 'd',
          ask: text.l11.unmask.cards.d,
          answers: {
            milka: '200 − 50 · 2 = 200 − 100 = 100',
            nikola: '200 − 50 · 2 = 200 − 100 = 100',
            belusic: '200 − 50 · 2 = 200 − 100 = 100',
            zagorka: '200 − 50 · 2 = 200 − 100 = 100',
            vucetic: '200 − 50 · 2 = 150 · 2 = 300',
          },
        },
      ],
      required: 2,
      guilty: 'vucetic',
      reveal: text.l11.unmask.reveal,
      fix: {
        say: text.l11.unmask.fix,
        start: '2 + 2 : 2 =',
        accepts: ['2 + 2 : 2 = 3', '2 + 2 : 2 = 2 + 1 = 3'],
        keys: ['+', '='],
      },
      opened: text.l11.unmask.opened,
      example: text.l11.unmask.example,
      hint: text.l11.unmask.hint,
    },
    {
      kind: 'knock',
      intro: text.l11.knock.intro,
      // Both 45 and 125 have to be on it, so that left to right can reach its wrong door.
      row: { kind: 'street', from: 1, to: 129 },
      startSide: 'odd',
      clues: [
        { id: 'side', kind: 'side', side: 'odd', say: text.l11.knock.side },
        {
          id: 'tape',
          kind: 'sum',
          start: '100 − 20 · 3 + 10 : 2 =',
          answer: 45,
          say: text.l11.knock.tape,
          structure: text.l11.knock.structureTape,
        },
        // It has to keep 125 lit: a limit that ruled 125 out would strike that line as leaving no
        // door, and with every clue needed for a knock, the wrong door could never be reached.
        {
          id: 'past',
          kind: 'limit',
          numbers: [40],
          canonical: 'x > 40',
          say: text.l11.knock.past,
          structure: text.l11.knock.structurePast,
        },
      ],
      door: 45,
      wrongDoors: [{ door: 125, say: text.l11.knock.wrong125 }],
      grumpy: text.l11.knock.grumpy,
      opened: text.l11.knock.opened,
      example: text.l11.knock.example,
      keys: knockSigns,
      hint: text.l11.knock.hint,
    },
  ],
  writeUp: [
    {
      say: text.l11.write.fade,
      start: '100 − 20 · 3 + 10 : 2 = 100 − ☐ + 5',
      accepts: ['100 − 20 · 3 + 10 : 2 = 100 − 60 + 5'],
      keys: [],
    },
    {
      say: text.l11.write.whole,
      start: '',
      accepts: ['100 − 60 + 5 = 45', '100 − 60 + 5 = 40 + 5 = 45'],
      keys: ['+', '−', '='],
    },
  ],
  beats: ['coat'],
  find: { say: text.l11.find.say, title: text.l11.find.title, card: text.l11.find.card },
};

// Knot 3: the guard's rule goes left to right, and the real Vucetic's walls turn into one
// expression. 45 comes from the coat; 60 and "3 puta manje" from the sixth cart.
const k3: LeadSpec = {
  id: 'k3',
  act: 3,
  street: 'u1',
  title: text.k3.title,
  lesson: { found: '', steps: [] },
  tries: [],
  mistake: null,
  scenes: [
    {
      kind: 'guard',
      id: 'rule-3',
      rule: text.k3.guard.rule,
      intro: text.k3.guard.intro,
      tiles: [
        { id: 'adds', face: '7 + 8 − 5', breaks: false, thanks: text.k3.guard.thanks.adds },
        { id: 'times', face: '3 · 4 + 2', breaks: false, thanks: text.k3.guard.thanks.timesFirst },
        { id: 'breaks', face: '10 − 2 · 3', breaks: true, thanks: '' },
        {
          id: 'divide',
          face: '12 : 3 + 6',
          breaks: false,
          thanks: text.k3.guard.thanks.divideFirst,
        },
        { id: 'minus', face: '20 − 4 − 6', breaks: false, thanks: text.k3.guard.thanks.minus },
        { id: 'factors', face: '2 · 5 · 3', breaks: false, thanks: text.k3.guard.thanks.factors },
      ],
      write: {
        say: text.k3.guard.write,
        start: '10 − 2 · 3 =',
        accepts: ['10 − 2 · 3 = 4', '10 − 2 · 3 = 10 − 6 = 4'],
        keys: ['−', '='],
      },
      jammed: text.k3.guard.jammed,
      example: text.k3.guard.example,
      hint: text.k3.guard.hint,
    },
    {
      kind: 'knock',
      intro: text.k3.knock.intro,
      row: { kind: 'street', from: 31, to: 99 },
      startSide: 'even',
      clues: [
        { id: 'side', kind: 'side', side: 'odd', say: text.k3.knock.side },
        {
          id: 'limit',
          kind: 'limit',
          numbers: [70],
          canonical: 'x < 70',
          say: text.k3.knock.limit,
          structure: text.k3.knock.structureLimit,
        },
        {
          id: 'story',
          kind: 'sum',
          start: '45 + 60 : 3 =',
          answer: 65,
          say: text.k3.knock.story,
          structure: text.k3.knock.structureStory,
        },
      ],
      door: 65,
      wrongDoors: [{ door: 35, say: text.k3.knock.wrong35 }],
      grumpy: text.k3.knock.grumpy,
      opened: text.k3.knock.opened,
      example: text.k3.knock.example,
      keys: knockSigns,
      hint: text.k3.knock.hint,
    },
  ],
  writeUp: [
    { say: text.k3.write.fade, start: '60 : 3 = ☐', accepts: ['60 : 3 = 20'], keys: [] },
    {
      say: text.k3.write.whole,
      start: '',
      accepts: ['45 + 60 : 3 = 65', '45 + 60 : 3 = 45 + 20 = 65', '60 : 3 + 45 = 65'],
      keys: ['+', ':', '='],
    },
  ],
  beats: ['real-vucetic'],
  find: { say: text.k3.find.say, title: text.k3.find.title, card: text.k3.find.card },
};

export const act3Leads = { l09, l10, l11, k3 };
