// What a sealed lead gains (GDD, Exploration and the trail map): one plain Sneak board, past the
// guards the black thread has left there. It has no maths in it.

import { sealedText as text } from '@/content/text/hunt-leads';
import type { SneakSpec } from '@/hunt/sneak';

export const sealedBoard: SneakSpec = {
  kind: 'sneak',
  intro: text.intro,
  boards: [
    {
      stops: 8,
      start: 0,
      exit: 7,
      patrols: [{ route: [3, 4, -1, -1] }, { route: [6, 5, 6, -1, -1] }],
      line: null,
    },
  ],
  caught: text.caught,
  empty: '',
  found: text.found,
  opened: text.opened,
  example: [],
  hint: text.hint,
};
