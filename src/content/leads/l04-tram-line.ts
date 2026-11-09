// The tram line (GDD, Structure, Act 1): the number line. Only some stops are labelled, so he works
// out the step, on lines with different scales, one of them far from zero.

import { l04Text as text } from '@/content/text/hunt-leads';
import type { LineState } from '@/hunt/objects';
import type { LeadSpec } from '@/hunt/spec';

const fives: LineState = {
  kind: 'line',
  from: 0,
  to: 30,
  step: 5,
  labelled: [0, 10, 20, 30],
  lit: [],
  marked: null,
};

export const l04: LeadSpec = {
  id: 'l04',
  act: 1,
  street: 'u1',
  title: text.title,
  lesson: {
    found: text.lesson.found,
    steps: [
      {
        object: { kind: 'line', from: 0, to: 6, lit: [], marked: null },
        say: text.lesson.steps[0],
      },
      { object: { ...fives, lit: [0, 5, 10] }, say: text.lesson.steps[1] },
      {
        object: {
          kind: 'line',
          from: 997,
          to: 1004,
          labelled: [997, 1000, 1004],
          lit: [],
          marked: null,
        },
        say: text.lesson.steps[2],
      },
    ],
  },
  tries: [
    { kind: 'object', say: text.tries.mark, object: fives, goal: { kind: 'line-mark', at: 25 } },
    {
      kind: 'line',
      say: text.tries.point,
      object: { ...fives, point: { at: 15, label: 'B' } },
      start: 'B =',
      accepts: ['B = 15'],
      keys: [],
      context: { points: { B: 15 } },
    },
  ],
  mistake: {
    id: 'l04-counts-ticks',
    say: text.mistake.say,
    lines: ['A = 10', 'B = 3'],
    wrong: 1,
    context: { points: { A: 10, B: 15 } },
    spot: { ...fives, point: { at: 15, label: 'B' } },
    nudge: text.mistake.nudge,
    show: { say: text.mistake.show, object: fives, goal: { kind: 'line-mark', at: 15 } },
    write: {
      say: text.mistake.write,
      start: 'B =',
      accepts: ['B = 15'],
      keys: [],
      context: { points: { B: 15 } },
    },
    thanks: text.mistake.thanks,
  },
  scenes: [
    {
      kind: 'sneak',
      intro: text.scene.intro,
      boards: [
        {
          // The step is 5, and A is 25.
          stops: 7,
          start: 0,
          exit: null,
          patrols: [{ route: [3, 3, -1, -1] }],
          line: {
            first: 0,
            step: 5,
            labelled: [0, 2, 4],
            asks: [
              { at: 5, label: 'A' },
              { at: 3, label: 'A' },
              { at: 1, label: 'A' },
            ],
          },
        },
        {
          // The step is 20.
          stops: 7,
          start: 0,
          exit: null,
          patrols: [{ route: [2, 3, 2, -1, -1] }],
          line: {
            first: 100,
            step: 20,
            labelled: [0, 2, 4],
            asks: [
              { at: 3, label: 'A' },
              { at: 5, label: 'A' },
              { at: 1, label: 'A' },
            ],
          },
        },
        {
          // Far from zero.
          stops: 8,
          start: 0,
          exit: null,
          patrols: [{ route: [4, 4, -1, -1, -1] }, { route: [6, 5, 6, -1] }],
          line: {
            first: 997,
            step: 1,
            labelled: [3, 5],
            asks: [
              { at: 7, label: 'A' },
              { at: 1, label: 'A' },
              { at: 6, label: 'A' },
            ],
          },
        },
      ],
      caught: text.scene.caught,
      empty: text.scene.empty,
      found: text.scene.found,
      opened: text.scene.opened,
      example: text.scene.example,
      hint: text.scene.hint,
    },
  ],
  writeUp: [
    {
      say: text.write.point,
      start: 'A =',
      accepts: ['A = 25'],
      keys: [],
      context: { points: { A: 25 } },
      object: { ...fives, point: { at: 25, label: 'A' } },
    },
  ],
  find: { say: text.find.say, title: text.find.title, card: text.find.card },
};
