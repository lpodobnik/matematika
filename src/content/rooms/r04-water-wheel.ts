import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 4: the water wheel, `2x + 5 = 23` (x = 9). The dial runs
// only 0–6, so it can't reach the answer and he has to move weights: a float of 5 on both
// pans gives `2x = 18`, which Balance `auto` writes for him, and a split by 2 leaves x
// alone. Story 1.16 gives the room one new idea, Balance: no pin and no poke window. The
// pans stay weighed at the slider's x, so at 6 the scale stays out of balance through
// every move (17 against 23, 12 against 18, 6 against 9). The answer is refused until the
// pans are simplified (Try values can't finish here), and once x is alone the notebook
// gives him `x = ☐` and the check line as blanks (room/fading.ts). The tilt is 0.75° per
// unit, so no notch hits the 15° clamp (18 units apart at 0 is 13.5°). Try values has
// faded to a blank page.
export const r04: RoomSpec = {
  id: 'r04',
  machine: 'water-wheel',
  xMeaning: 'load per bucket',
  stages: [
    {
      type: 'solve',
      machines: [{ equation: '2x + 5 = 23' }],
      dial: { min: 0, max: 6, step: 1 },
      tiltPerUnit: 0.75,
      readouts: true,
      ways: ['balance'],
      fading: { try: 'blank', balance: 'auto' },
    },
  ],
  earns: null,
  mapChange: 'water-wheel-turns',
};
