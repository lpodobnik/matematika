import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 6: the weighing yard, `x + 56 = 58 + 27` (x = 29), judged
// without adding (story 2.9). The readouts are hidden, so the pans show only their pieces:
// an x-gear and a 56 against a 58 and a 27. He pins x before anything moves: the 58 is 2
// more than the 56, so x must be 2 more than the 27. The hidden readouts have their own
// question on the pin's tag, and the slider's `x = …` plate still shows. The slider runs
// 20–40 (no notch hits the 15° clamp: 9 apart at 20, 11 at 40). Try values or Balance; Balance
// writes its lines for him (`auto`, not the GDD's `blanks`: filling in each move's numbers
// would be doing the sums the room is about not doing; story 2.9's call), and the last two
// lines come as blanks. Earns the workshop, which opens its gate on the map, and the
// foundry gate shows from here.
export const r06: RoomSpec = {
  id: 'r06',
  machine: 'weighing-yard',
  xMeaning: 'weight of a crate',
  stages: [
    {
      type: 'compare',
      machines: [{ equation: 'x + 56 = 58 + 27' }],
      dial: { min: 20, max: 40, step: 1 },
      pin: { kind: 'level-x' },
      readouts: false,
      ways: ['try', 'balance'],
      fading: { try: 'blank', balance: 'auto' },
    },
  ],
  earns: 'workshop',
  ideas: ['compare'],
  mapChange: 'weighing-yard-weighs',
};
