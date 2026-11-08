import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 8: the tram, `4x + 9 = 41` (x = 8), where the gear chain
// arrives (story 4.3; it was earned in room 7). Running the chain backward moves the pans
// too: `4x + 9 = 41` → `4x = 41 − 9` → `4x = 32` on both. The slider runs 0–10 (the GDD,
// and the design pass before epic 2), past the answer, with a poke window of 4 notches
// (0–3: 9, 13, 17, 21 against 41, never level) and a pin where it levels. Balance and Undo
// can finish, not Try values, so `x = 8` counts only after he simplifies (story 1.16), and
// the slider is his check. Undo writes its lines for him (`auto`, GDD Fading), and once x
// is alone the last two come as blanks; Balance has faded to a blank page, and so has Try
// values. At 0.45° a unit no notch hits the 15° clamp (32 apart at 0 is 14.4°).
export const r08: RoomSpec = {
  id: 'r08',
  machine: 'tram',
  xMeaning: 'length per rail',
  stages: [
    {
      type: 'solve',
      machines: [{ equation: '4x + 9 = 41' }],
      dial: { min: 0, max: 10, step: 1 },
      tiltPerUnit: 0.45,
      readouts: true,
      ways: ['undo'],
      fading: { try: 'blank', balance: 'blank', undo: 'auto' },
    },
  ],
  earns: null,
  ideas: ['inverse'],
  mapChange: 'tram-runs',
};
