import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 12: the junction, linked machines (story 4.7). The first
// machine, `2x + 3 = 11` (x = 4), sets a gear size that is passed to the second: its answer
// is the weight in `3x + ☐ = 19`, so the second machine is `3x + 4 = 19` (x = 5). Each
// slider runs 0–10, with a poke window of 4 notches (the first: 3, 5, 7, 9 against 11; the
// second: 4, 7, 10, 13 against 19, never level) and a pin where it levels. All three ways
// can finish; all have faded to a blank page, and the tray has its x-gear. It earns the
// recording drum. At 0.9° a unit the second stage never hits the clamp (15 apart at 0 is
// 13.5°); the first stays under it at the default 1° (8 at 0, 12 at 10).
export const r12: RoomSpec = {
  id: 'r12',
  machine: 'junction',
  xMeaning: 'gear sizes, the first passed to the second',
  stages: [
    {
      type: 'solve',
      machines: [{ equation: '2x + 3 = 11' }],
      dial: { min: 0, max: 10, step: 1 },
      pokeNotches: 4,
      pin: { kind: 'level-x' },
      readouts: true,
      ways: ['try', 'balance', 'undo'],
      fading: { try: 'blank', balance: 'blank', undo: 'blank' },
      trayGear: true,
    },
    {
      type: 'solve',
      machines: [{ equation: '3x + 4 = 19' }],
      dial: { min: 0, max: 10, step: 1 },
      tiltPerUnit: 0.9,
      pokeNotches: 4,
      pin: { kind: 'level-x' },
      readouts: true,
      ways: ['try', 'balance', 'undo'],
      fading: { try: 'blank', balance: 'blank', undo: 'blank' },
      trayGear: true,
      fed: { from: 0, template: '3x + ☐ = 19' },
    },
  ],
  earns: 'drum',
  ideas: ['linked'],
  mapChange: 'junction-switches',
};
