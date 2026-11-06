import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 4: the water wheel, `2x + 5 = 23` (x = 9). The dial runs
// only 0–6, so it can't reach the answer and he has to move weights: a float of 5 on both
// pans gives `2x = 18`, which Balance `auto` writes for him. The tilt is 0.75° per unit, so
// no notch of the 4-notch poke window (0–3) hits the 15° clamp; the "where it levels" pin
// goes beyond the dial, on a track of 0–12. Try values has faded to a blank page.
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
      pokeNotches: 4,
      pin: { kind: 'level-x', beyondDial: true },
      readouts: true,
      ways: ['balance'],
      fading: { try: 'blank', balance: 'auto' },
    },
  ],
  earns: null,
  mapChange: 'water-wheel-turns',
};
