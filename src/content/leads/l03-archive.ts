// The archive (GDD, Structure, Act 1): place value and powers of ten. The little one goes alone for
// the first time: halls, rows, shelves, boxes, folders. The route needs the missing place.

import { l03Text as text } from '@/content/text/hunt-leads';
import type { LeadSpec } from '@/hunt/spec';

const hundreds = text.hundreds;
const pipes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export const l03: LeadSpec = {
  id: 'l03',
  act: 1,
  street: 'u1',
  title: text.title,
  lesson: {
    found: text.lesson.found,
    steps: [
      {
        object: { kind: 'places', names: text.places, counts: [0, 0, 0, 1, 0] },
        say: text.lesson.steps[0],
      },
      {
        object: { kind: 'places', names: text.thousands, counts: [1, 0, 0, 0] },
        say: text.lesson.steps[1],
      },
      {
        object: { kind: 'places', names: hundreds, counts: [3, 5, 4] },
        say: text.lesson.steps[2],
      },
    ],
  },
  tries: [
    {
      kind: 'object',
      say: text.tries.places,
      object: { kind: 'places', names: hundreds, counts: [0, 0, 0] },
      goal: { kind: 'places-counts', counts: [3, 5, 4] },
    },
    { kind: 'line', say: text.tries.power, start: '10³ =', accepts: ['10³ = 1 000'], keys: [] },
    {
      kind: 'line',
      say: text.tries.words,
      start: 'x =',
      accepts: ['x = 30 015'],
      keys: [],
      context: { vars: { x: 30_015 } },
    },
  ],
  mistake: {
    id: 'l03-drops-zero',
    say: text.mistake.say,
    lines: ['354 = 3 · 10² + 5 · 10 + 4', '507 = 5 · 10 + 7'],
    wrong: 1,
    nudge: text.mistake.nudge,
    show: {
      say: text.mistake.show,
      object: { kind: 'places', names: hundreds, counts: [0, 5, 7] },
      goal: { kind: 'places-counts', counts: [5, 0, 7] },
    },
    write: {
      say: text.mistake.write,
      start: '507 =',
      accepts: [
        '507 = 5 · 10² + 7',
        '507 = 5 · 10² + 0 · 10 + 7',
        '507 = 5 · 100 + 7',
        '507 = 500 + 7',
      ],
      keys: ['·', '+', '^'],
    },
    thanks: text.mistake.thanks,
  },
  scenes: [
    {
      kind: 'alone',
      intro: text.scene.intro,
      route: text.scene.route,
      junctions: [
        { sign: text.places[0] as string, pipes, right: 3 },
        { sign: text.places[1] as string, pipes, right: 4 },
        { sign: text.places[2] as string, pipes, right: 0 },
        { sign: text.places[3] as string, pipes, right: 7 },
        { sign: text.places[4] as string, pipes, right: 2 },
      ],
      deadEnd: text.scene.deadEnd,
      opened: text.scene.opened,
      example: text.scene.example,
      hint: text.scene.hint,
    },
  ],
  writeUp: [
    {
      say: text.write.fade,
      start: '354 = 3 · 10² + ☐ · 10 + 4',
      accepts: ['354 = 3 · 10² + 5 · 10 + 4'],
      keys: [],
    },
    {
      say: text.write.whole,
      start: '34 072 =',
      accepts: ['34 072 = 3 · 10⁴ + 4 · 10³ + 7 · 10 + 2'],
      keys: ['·', '+', '^'],
    },
  ],
  find: { say: text.find.say, title: text.find.title, card: text.find.card },
};
