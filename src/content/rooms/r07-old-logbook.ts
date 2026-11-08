import type { RoomSpec } from '@/room/types';

// GDD, Puzzle Progression, room 7: the old logbook, a mistake to find (story 2.10; narrative
// design, the logbook twist). Kristijan's logbook holds `3x − 1 = 17`, then `3x = 18`, then
// the wrong line `x = 15`, which reads 3x as 3 + x: his planted signal, as the room's story
// card tells. The slider runs 1–10 (from 1, so 3x − 1 never weighs below 0; the GDD says
// 0–10) and is open from the start; at 6 the stage equation
// levels. He taps a written line to put it on the scale: at 6, `3x = 18` stays level and
// `x = 15` tips. He pins the line he thinks is wrong; the machine puts it on the scale at 6,
// and the wrong line is struck through for him to rewrite, `x = ☐` and the check line as
// blanks, judged against the lines before it. No shelf or divider: the room is about reading lines,
// and the rewrite needs no Balance move.
// At 0.8° a unit no notch hits the 15° clamp (15 apart at 1 is 12°). Earns the gear chain.
export const r07: RoomSpec = {
  id: 'r07',
  machine: 'old-logbook',
  xMeaning: 'teeth per gear',
  stages: [
    {
      type: 'mistake',
      machines: [{ equation: '3x − 1 = 17' }],
      dial: { min: 1, max: 10, step: 1 },
      tiltPerUnit: 0.8,
      pokeNotches: 'all',
      pin: { kind: 'wrong-line' },
      presetLines: ['3x = 18', 'x = 15'],
      readouts: true,
      ways: ['try'],
      fading: { try: 'blank', balance: 'auto' },
    },
  ],
  earns: 'chain',
  ideas: ['mistake'],
  mapChange: 'logbook-opens',
};
