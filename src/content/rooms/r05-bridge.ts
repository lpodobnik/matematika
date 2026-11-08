import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 5: the bridge, a prediction of what a change does. Stage 1,
// `3x + 4 = 22` (x = 6), opens a poke window of 4 notches (0–3) and asks where the pans
// level before the slider opens, as room 3 did. Stage 2 is the change (story 2.8): the load
// on the far side grows from 22 to 25, and before the slider opens he pins where it levels
// now (x = 7): three more on the right is one more x, since each x is 3. The change has its
// own question on the pin's tag. Both stages take Try values or Balance; Balance writes its
// lines for him (`auto`), and the last two lines come as blanks. The slider runs 0–10, past
// both answers (the playtests: the one x reaches what he finds), at 0.7° a unit, so no
// notch hits the 15° clamp (21 apart at 0 is 14.7°). Try values has faded to a blank page.
export const r05: RoomSpec = {
  id: 'r05',
  machine: 'bridge',
  xMeaning: 'length per plank',
  stages: [
    {
      type: 'predict',
      machines: [{ equation: '3x + 4 = 22' }],
      dial: { min: 0, max: 10, step: 1 },
      tiltPerUnit: 0.7,
      pokeNotches: 4,
      pin: { kind: 'level-x' },
      readouts: true,
      ways: ['try'],
      fading: { try: 'blank', balance: 'auto' },
    },
    {
      type: 'predict',
      machines: [{ equation: '3x + 4 = 25' }],
      dial: { min: 0, max: 10, step: 1 },
      tiltPerUnit: 0.7,
      pin: { kind: 'level-x' },
      change: { after: 'locked', from: 22, to: 25 },
      readouts: true,
      ways: ['try'],
      fading: { try: 'blank', balance: 'auto' },
    },
  ],
  earns: null,
  ideas: ['prediction', 'balance'],
  mapChange: 'bridge-lowers',
};
