import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 4: the water wheel, `2x + 5 = 23` (x = 9). The dial runs
// 0–12, past the answer (Luka, after story 1.16: the one x has to be able to reach what he
// found), but Try values can't finish the room: he has to move weights. A float of 5 on
// both pans gives `2x = 18`, which Balance `auto` writes for him, and a split by 2 leaves
// x alone. Story 1.16 gives the room one new idea, Balance: no pin and no poke window, and
// the tray from the start. The pans stay weighed at the slider's x, so at 6 the scale stays
// out of balance through every move (17 against 23, 12 against 18, 6 against 9), and at 9
// it levels: the slider is his check. The answer is refused until the pans are simplified
// (Try values can't finish here), and once x is alone the notebook gives him `x = ☐` and
// the check line as blanks (room/fading.ts). The tilt is 0.75° per unit, so no notch hits
// the 15° clamp (18 units apart at 0 is 13.5°, 6 apart at 12 is 4.5°). Try values has
// faded to a blank page.
export const r04: RoomSpec = {
  id: 'r04',
  machine: 'water-wheel',
  xMeaning: 'load per bucket',
  stages: [
    {
      type: 'solve',
      machines: [{ equation: '2x + 5 = 23' }],
      dial: { min: 0, max: 12, step: 1 },
      tiltPerUnit: 0.75,
      readouts: true,
      ways: ['balance'],
      fading: { try: 'blank', balance: 'auto' },
    },
  ],
  earns: null,
  ideas: ['balance', 'split'],
  mapChange: 'water-wheel-turns',
};
