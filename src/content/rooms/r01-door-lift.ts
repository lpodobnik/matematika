import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 1: the door lift. The dial and the pans; level means equal.
export const r01: RoomSpec = {
  id: 'r01',
  machine: 'door-lift',
  xMeaning: 'counterweight still needed to lift the door',
  stages: [
    {
      type: 'solve',
      machines: [{ equation: 'x + 4 = 9' }],
      dial: { min: 0, max: 10, step: 1 },
      readouts: true,
      ways: ['try'],
      fading: { try: 'blanks' },
    },
  ],
  earns: null,
  ideas: ['equal'],
  mapChange: 'door-lift-opens',
};
