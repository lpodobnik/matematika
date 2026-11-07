// A room link of version 1, as the workshop sent it (architecture, Pattern 3: "a link
// version, once released, must stay decodable forever"). Never change these: a later
// version's decoder must still read this data as this room.

import type { RoomPayload } from '@/workshop/design';

/** "Tajna vaga": 3x + 4 = 31 with the readouts hidden, solved in two lines. */
export const roomV1 = {
  data: 'AQKKgwAQAfINT0kDalZHjCA',
  room: {
    title: 2,
    design: {
      machines: [{ form: 'ax+b', numbers: { a: 3, b: 4, c: 31, d: 0 } }],
      blinds: { readouts: true, shortDial: false },
      plant: false,
    },
    planted: null,
    solution: [['x=9', '3·9+4=31']],
  } satisfies RoomPayload,
};
