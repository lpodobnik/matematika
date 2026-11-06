import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 2: the street lamps. Each notch moves the pan by the same
// amount. Two stages: `3x = 12` (x = 4) lights the first lamp, then `x : 3 = 5` (x = 15),
// on a dial in steps of the divisor, lights the second.
export const r02: RoomSpec = {
  id: 'r02',
  machine: 'street-lamps',
  xMeaning: 'oil per lamp, then the oil in a full tank',
  stages: [
    {
      type: 'solve',
      machines: [{ equation: '3x = 12' }],
      dial: { min: 0, max: 10, step: 1 },
      // At 1° per unit the last notch (x = 10, 18 units) would hit the 15° clamp and not move
      // the pans; 0.8° keeps every notch moving them by the same 2.4°.
      tiltPerUnit: 0.8,
      readouts: true,
      ways: ['try'],
      fading: { try: 'blanks' },
    },
    {
      type: 'solve',
      machines: [{ equation: 'x : 3 = 5' }],
      dial: { min: 0, max: 30, step: 3 },
      readouts: true,
      ways: ['try'],
      fading: { try: 'blanks' },
    },
  ],
  earns: null,
  ideas: ['notch'],
  mapChange: 'street-lamps-light',
};
