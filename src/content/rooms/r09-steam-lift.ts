import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 9: the steam lift, `135 − 5x = 100` (x = 7), where x lightens
// the pan (story 4.4): five x-balloons hang under the 135, and each notch lifts the left pan
// by 5. The chain reads `x → · 5 → 135 − ☐ → 100`, and its middle link's inverse is
// `135 − 100`, not `+ 135` (story 4.2). From here the tray also holds an x-gear, so Balance
// can add 5x to both sides: `135 = 5x + 100`. The slider runs 0–10 with a poke window of 4
// notches (0–3: 135, 130, 125, 120 against 100, never level) and a pin where it levels. All
// three ways can finish it. Undo gives each result as a blank (`5x = ☐`, GDD Fading); Try
// values and Balance have faded to a blank page. At 0.4° a unit no notch hits the 15° clamp
// (35 apart at 0 is 14°; at 10, 85 against 100 is 6°).
export const r09: RoomSpec = {
  id: 'r09',
  machine: 'steam-lift',
  xMeaning: 'pressure per valve',
  stages: [
    {
      type: 'solve',
      machines: [{ equation: '135 − 5x = 100' }],
      dial: { min: 0, max: 10, step: 1 },
      tiltPerUnit: 0.2,
      readouts: true,
      ways: ['balance'],
      fading: { try: 'blank', balance: 'blank', undo: 'blanks' },
      trayGear: true,
    },
  ],
  earns: null,
  ideas: ['take-away'],
  mapChange: 'steam-lift-rises',
};
