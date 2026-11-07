import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 13: the clock tower, the line reveal (story 4.8). The
// recording drum (earned in room 12) draws a dot for each x he tries, the left side's value
// there, with the right side as a level line. The poke window is the first 3 notches (0, 1,
// 2): for `3x + 5 = 20` they draw 5, 8, 11. Before the slider opens he pins the next dot,
// at x = 3, among three heights (11, 14, 17); the machine turns the slider there and the
// dot shows. Then the dial is his, the dots lie on a straight line, and it crosses the level
// line at the answer (x = 5). The second machine, `50 − 4x = 34`, draws a falling line (50,
// 46, 42, then 38 or not; x = 4). All three ways can finish both, on a blank page. Once the
// room is restarted the story card explains the word: "linearna" comes from "linija".
// At 0.6° a unit no notch hits the clamp (15 apart at 0 and at 10 in the first is 9°; 16
// and 24 apart in the second are 9.6° and 14.4°).
export const r13: RoomSpec = {
  id: 'r13',
  machine: 'clock-tower',
  xMeaning: 'turns of the winder',
  stages: [
    {
      type: 'predict',
      machines: [{ equation: '3x + 5 = 20' }],
      dial: { min: 0, max: 10, step: 1 },
      tiltPerUnit: 0.6,
      pokeNotches: 3,
      pin: { kind: 'next-dot' },
      readouts: true,
      ways: ['try', 'balance', 'undo'],
      fading: { try: 'blank', balance: 'blank', undo: 'blank' },
      trayGear: true,
      drum: true,
    },
    {
      type: 'predict',
      machines: [{ equation: '50 − 4x = 34' }],
      dial: { min: 0, max: 10, step: 1 },
      tiltPerUnit: 0.6,
      pokeNotches: 3,
      pin: { kind: 'next-dot' },
      readouts: true,
      ways: ['try', 'balance', 'undo'],
      fading: { try: 'blank', balance: 'blank', undo: 'blank' },
      trayGear: true,
      drum: true,
    },
  ],
  earns: null,
  ideas: ['linear'],
  mapChange: 'clock-tower-strikes',
};
