// The town's pictures (story 5.0; art-src/CREDITS.md): the square, closed and with the gate
// open, his six looks cut out, the townspeople and the first automaton.

import type { LookId } from '@/city/character';
import type { AreaId, PersonId } from '@/content/town';
import type { RoomId } from '@/room/types';
import automaton20 from '@/ui/town/art/automaton-20.webp';
import canal from '@/ui/town/art/canal.webp';
import look1 from '@/ui/town/art/look-1.webp';
import look2 from '@/ui/town/art/look-2.webp';
import look3 from '@/ui/town/art/look-3.webp';
import look4 from '@/ui/town/art/look-4.webp';
import look5 from '@/ui/town/art/look-5.webp';
import look6 from '@/ui/town/art/look-6.webp';
import nikola from '@/ui/town/art/nikola.webp';
import penkala from '@/ui/town/art/penkala.webp';
import square from '@/ui/town/art/square.webp';
import squareGateOpen from '@/ui/town/art/square-gate-open.webp';

export { automaton20, square, squareGateOpen };

export const looks: Record<LookId, string> = {
  'look-1': look1,
  'look-2': look2,
  'look-3': look3,
  'look-4': look4,
  'look-5': look5,
  'look-6': look6,
};

/** Each person's figure (t31 and t32). */
export const personArt: Record<PersonId, string> = { penkala, nikola };

/** An area's picture as it stands: the square shows the gate raised once room 1 is done. */
export function areaArt(area: AreaId, done: readonly RoomId[]): string {
  if (area === 'canal') return canal;
  return done.includes('r01') ? squareGateOpen : square;
}

/** Every town picture, for the loading screen to fetch before the game starts. */
export const townImages: readonly string[] = [
  square,
  squareGateOpen,
  canal,
  automaton20,
  ...Object.values(looks),
  ...Object.values(personArt),
];
