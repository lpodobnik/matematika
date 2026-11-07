import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 11: the great wheel, `5 905 − 27x = 316` (x = 207), the
// deliberate hard point (story 4.6): too slow to drag. The slider runs in tens, with − and
// + for single steps, so it can reach 207 but only slowly; he simplifies instead, and the
// slider is his check. The GDD's 0–300 would weigh the left side below 0 past 218, so the
// slider runs 0–210 (it still reaches 207; the content tests keep every readout 0 or more).
// The poke window is its first 4 notches (0, 10, 20, 30), and the pin asks whether x is
// under 100, from 100 to 300, or over 300 (GDD). Balance and Undo can finish it, so `x =
// 207` counts only after a simplified line; both have faded to a blank page, and the tray
// has its x-gear. At 0.0025° a unit no notch hits the clamp (5 589 apart at 0 is 14°); near
// 207 the tilt is too small to see, so the readouts tell him, as on any big-number scale.
export const r11: RoomSpec = {
  id: 'r11',
  machine: 'great-wheel',
  xMeaning: 'load per spoke',
  stages: [
    {
      type: 'solve',
      machines: [{ equation: '5905 − 27x = 316' }],
      dial: { min: 0, max: 210, step: 1, coarse: 10 },
      tiltPerUnit: 0.0025,
      pokeNotches: 4,
      pin: { kind: 'range', bounds: [100, 300] },
      readouts: true,
      ways: ['balance', 'undo'],
      fading: { try: 'blank', balance: 'blank', undo: 'blank' },
      trayGear: true,
    },
  ],
  earns: null,
  ideas: ['simplify'],
  mapChange: 'great-wheel-turns',
};
