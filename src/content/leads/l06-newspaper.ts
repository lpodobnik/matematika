// The newspaper (GDD, Structure, Act 2): rounding and estimating. Zagorka rounds everything; one
// figure can't be true, and the error is the distance between them.

import { l06Text as text } from '@/content/text/hunt-leads';
import type { LineState } from '@/hunt/objects';
import type { LeadSpec } from '@/hunt/spec';

const tens: LineState = { kind: 'line', from: 325, to: 335, lit: [], marked: null };
const thousands: LineState = {
  kind: 'line',
  from: 2000,
  to: 3000,
  step: 500,
  lit: [],
  marked: null,
};
const decade: LineState = {
  kind: 'line',
  from: 320,
  to: 340,
  step: 10,
  lit: [],
  marked: null,
};

export const l06: LeadSpec = {
  id: 'l06',
  act: 2,
  street: 'u1',
  title: text.title,
  lesson: {
    found: text.lesson.found,
    steps: [
      {
        object: { ...tens, lit: [325, 326, 327, 328, 329, 330, 331, 332, 333, 334] },
        say: text.lesson.steps[0],
      },
      { object: { ...tens, marked: 334 }, say: text.lesson.steps[1] },
      {
        object: { ...tens, lit: [330, 331, 332, 333, 334], marked: 334 },
        say: text.lesson.steps[2],
      },
    ],
  },
  tries: [
    { kind: 'object', say: text.tries.mark, object: decade, goal: { kind: 'line-mark', at: 330 } },
    {
      kind: 'line',
      say: text.tries.line,
      start: '487 ≈',
      accepts: ['487 ≈ 490'],
      keys: [],
    },
  ],
  mistake: {
    id: 'l06-chains-rounding',
    say: text.mistake.say,
    lines: ['2 540 ≈ 3 000', '2 449 ≈ 3 000'],
    wrong: 1,
    nudge: text.mistake.nudge,
    show: { say: text.mistake.show, object: thousands, goal: { kind: 'line-mark', at: 2000 } },
    write: { say: text.mistake.write, start: '2 449 ≈', accepts: ['2 449 ≈ 2 000'], keys: [] },
    thanks: text.mistake.thanks,
  },
  scenes: [
    {
      kind: 'unmask',
      intro: text.scene.intro,
      suspects: [
        {
          id: 'zagorka',
          name: text.scene.who.zagorka,
          offended: text.scene.offended.zagorka,
          why: text.scene.why.zagorka,
        },
        {
          id: 'slagar',
          name: text.scene.who.slagar,
          offended: '',
          why: '',
        },
        {
          id: 'raznosac',
          name: text.scene.who.raznosac,
          offended: text.scene.offended.raznosac,
          why: text.scene.why.raznosac,
        },
      ],
      cards: [
        {
          id: 'a',
          ask: text.scene.cards.a,
          answers: { zagorka: '334 ≈ 330', slagar: '334 ≈ 340', raznosac: '334 ≈ 330' },
        },
        {
          id: 'b',
          ask: text.scene.cards.b,
          answers: { zagorka: '5 632 ≈ 5 600', slagar: '5 632 ≈ 5 700', raznosac: '5 632 ≈ 5 500' },
        },
        {
          id: 'c',
          ask: text.scene.cards.c,
          answers: {
            zagorka: '71 240 ≈ 71 000',
            slagar: '71 240 ≈ 72 000',
            raznosac: '71 240 ≈ 71 000',
          },
        },
      ],
      required: 2,
      guilty: 'slagar',
      reveal: text.scene.reveal,
      fix: { say: text.scene.fix, start: '334 ≈', accepts: ['334 ≈ 330'], keys: [] },
      opened: text.scene.opened,
      example: text.scene.example,
      hint: text.scene.hint,
    },
  ],
  writeUp: [
    { say: text.write.approx, start: '334 ≈', accepts: ['334 ≈ 330'], keys: [] },
    { say: text.write.error, start: '', accepts: ['334 − 330 = 4'], keys: ['−', '='] },
  ],
  find: { say: text.find.say, title: text.find.title, card: text.find.card },
};
