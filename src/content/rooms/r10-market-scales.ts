import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 10: the market scales, a story room (story 4.5), and a
// breather. Stage 1 opens with a story and empty pans: a basket weighs 60 dag, and with 3 equal
// apples the lot weighs 90. He writes it as the notebook's first line, `60 + 3x = 90`, and
// the pans fill from it; then he solves it (x = 10). Stage 2 opens with the pans for
// `5 + 2x = 19` and three stories; before the slider opens he flags the one that fits,
// then solves it (x = 7). The slider runs 0–15. All three ways can finish; every way has
// faded to a blank page (GDD Fading: Undo's from room 10). At 0.45° a unit no notch of the
// first hits the clamp (30 apart at 0 is 13.5°), at 0.8° none of the second (16 apart at
// 15 is 12.8°).
export const r10: RoomSpec = {
  id: 'r10',
  machine: 'market-scales',
  xMeaning: 'price of a cog',
  stages: [
    {
      type: 'story',
      machines: [{ equation: '60 + 3x = 90' }],
      dial: { min: 0, max: 15, step: 1 },
      tiltPerUnit: 0.45,
      readouts: true,
      ways: ['try', 'balance', 'undo'],
      fading: { try: 'blank', balance: 'blank', undo: 'blank' },
      trayGear: true,
      story: { build: 'wrench' },
    },
    {
      type: 'story',
      machines: [{ equation: '5 + 2x = 19' }],
      dial: { min: 0, max: 15, step: 1 },
      tiltPerUnit: 0.8,
      pin: { kind: 'story-choice' },
      readouts: true,
      ways: ['try', 'balance', 'undo'],
      fading: { try: 'blank', balance: 'blank', undo: 'blank' },
      trayGear: true,
      story: {
        options: [
          { key: 'five-cogs', equation: '5x + 2 = 19' },
          { key: 'box-two-cogs', equation: '5 + 2x = 19' },
          { key: 'box-nineteen', equation: '19 + 2x = 5' },
        ],
      },
    },
  ],
  earns: null,
  ideas: ['story'],
  mapChange: 'market-weighs',
};
