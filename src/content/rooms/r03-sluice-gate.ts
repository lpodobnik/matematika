import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 3: the sluice gate, the first pin. Stage 1, `x − 6 = 8`
// (x = 14), opens a poke window of 4 notches (6, 7, 8, 9) and asks where the pans level
// before the dial opens; the dial starts at 6, so neither side ever weighs below 0. Stage 2,
// `20 − x = 6` (x = 14 again), has no poke window: he pins which way the whole scale tilts
// as x grows before the dial moves (story 1.15). Here x is a balloon, so raising x lightens
// the left side and the scale tilts right. Earns Balance.
export const r03: RoomSpec = {
  id: 'r03',
  machine: 'sluice-gate',
  xMeaning: 'water in the basin before the release, then the water to release',
  stages: [
    {
      type: 'solve',
      machines: [{ equation: 'x − 6 = 8' }],
      dial: { min: 6, max: 20, step: 1 },
      pokeNotches: 4,
      pin: { kind: 'level-x' },
      readouts: true,
      ways: ['try'],
      fading: { try: 'blanks' },
    },
    {
      type: 'predict',
      machines: [{ equation: '20 − x = 6' }],
      dial: { min: 0, max: 20, step: 1 },
      pin: { kind: 'effect', options: ['tilt-left', 'tilt-right'] },
      readouts: true,
      ways: ['try'],
      fading: { try: 'blanks' },
    },
  ],
  earns: 'balance',
  mapChange: 'sluice-gate-releases',
};
