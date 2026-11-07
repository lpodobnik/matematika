// The town's pictures (story 5.0; art-src/CREDITS.md): the square, closed and with the gate
// open, his six looks cut out, the townspeople and the first automaton.

import type { LookId } from '@/city/character';
import type { AreaId, PersonId } from '@/content/town';
import type { RoomId } from '@/room/types';
import automaton20 from '@/ui/town/art/automaton-20.webp';
import bridge from '@/ui/town/art/bridge.webp';
import canal from '@/ui/town/art/canal.webp';
import faust from '@/ui/town/art/faust.webp';
import hill from '@/ui/town/art/hill.webp';
import lift from '@/ui/town/art/lift.webp';
import look1 from '@/ui/town/art/look-1.webp';
import look2 from '@/ui/town/art/look-2.webp';
import look3 from '@/ui/town/art/look-3.webp';
import look4 from '@/ui/town/art/look-4.webp';
import look5 from '@/ui/town/art/look-5.webp';
import look6 from '@/ui/town/art/look-6.webp';
import market from '@/ui/town/art/market.webp';
import mill from '@/ui/town/art/mill.webp';
import nikola from '@/ui/town/art/nikola.webp';
import penkala from '@/ui/town/art/penkala.webp';
import square from '@/ui/town/art/square.webp';
import squareGateOpen from '@/ui/town/art/square-gate-open.webp';
import tram from '@/ui/town/art/tram.webp';
import wheel from '@/ui/town/art/wheel.webp';
import yard from '@/ui/town/art/yard.webp';

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
export const personArt: Record<PersonId, string> = { penkala, nikola, faust };

/** An area's picture as it stands: the square shows the gate raised once room 1 is done. */
export function areaArt(area: AreaId, done: readonly RoomId[]): string {
  if (area === 'canal') return canal;
  if (area === 'mill') return mill;
  if (area === 'bridge') return bridge;
  if (area === 'yard') return yard;
  if (area === 'tram') return tram;
  if (area === 'lift') return lift;
  if (area === 'market') return market;
  if (area === 'wheel') return wheel;
  if (area === 'hill') return hill;
  return done.includes('r01') ? squareGateOpen : square;
}

/** Every town picture, for the loading screen to fetch before the game starts. */
export const townImages: readonly string[] = [
  square,
  squareGateOpen,
  canal,
  mill,
  bridge,
  yard,
  tram,
  lift,
  market,
  wheel,
  hill,
  automaton20,
  ...Object.values(looks),
  ...Object.values(personArt),
];
