// The town's pictures (story 5.0; art-src/CREDITS.md): the square, closed and with the gate
// open, his six looks cut out, the townspeople and the first automaton.

import type { LookId } from '@/city/character';
import type { AreaId, PersonId } from '@/content/town';
import type { RoomId } from '@/room/types';
import automaton20 from '@/ui/town/art/automaton-20.webp';
import bridge from '@/ui/town/art/bridge.webp';
import bridgeDown from '@/ui/town/art/bridge-down.webp';
import canal from '@/ui/town/art/canal.webp';
import canalOpen from '@/ui/town/art/canal-open.webp';
import faust from '@/ui/town/art/faust.webp';
import hill from '@/ui/town/art/hill.webp';
import hillRunning from '@/ui/town/art/hill-running.webp';
import lift from '@/ui/town/art/lift.webp';
import liftUp from '@/ui/town/art/lift-up.webp';
import look1 from '@/ui/town/art/look-1.webp';
import look2 from '@/ui/town/art/look-2.webp';
import look3 from '@/ui/town/art/look-3.webp';
import look4 from '@/ui/town/art/look-4.webp';
import look5 from '@/ui/town/art/look-5.webp';
import look6 from '@/ui/town/art/look-6.webp';
import market from '@/ui/town/art/market.webp';
import marketLevel from '@/ui/town/art/market-level.webp';
import mill from '@/ui/town/art/mill.webp';
import millRunning from '@/ui/town/art/mill-running.webp';
import nikola from '@/ui/town/art/nikola.webp';
import penkala from '@/ui/town/art/penkala.webp';
import square from '@/ui/town/art/square.webp';
import squareGateOpen from '@/ui/town/art/square-gate-open.webp';
import tram from '@/ui/town/art/tram.webp';
import tramRunning from '@/ui/town/art/tram-running.webp';
import wheel from '@/ui/town/art/wheel.webp';
import wheelTurning from '@/ui/town/art/wheel-turning.webp';
import yard from '@/ui/town/art/yard.webp';
import yardLevel from '@/ui/town/art/yard-level.webp';

export { automaton20 };

export const looks: Record<LookId, string> = {
  'look-1': look1,
  'look-2': look2,
  'look-3': look3,
  'look-4': look4,
  'look-5': look5,
  'look-6': look6,
};

/**
 * Which way each picture faces: 1 right, -1 left. The code mirrors a figure to face where he
 * walks, so it needs to know where the picture already looks.
 */
export const lookFacing: Record<LookId, 1 | -1> = {
  'look-1': -1,
  'look-2': 1,
  'look-3': -1,
  'look-4': -1,
  'look-5': -1,
  'look-6': 1,
};
export const personFacing: Record<PersonId, 1 | -1> = { penkala: -1, nikola: 1, faust: 1 };

/** Each person's figure (t31 and t32). */
export const personArt: Record<PersonId, string> = { penkala, nikola, faust };

/**
 * Each area's picture, and the picture of its machine running once its room is done (the
 * gate raised, the sluice open, water on the wheel, the bridge down, the lift up, the scale
 * level). Areas without one keep their picture, in colour once restored.
 */
const pictures: Record<AreaId, { base: string; running?: { room: RoomId; src: string } }> = {
  square: { base: square, running: { room: 'r01', src: squareGateOpen } },
  canal: { base: canal, running: { room: 'r03', src: canalOpen } },
  mill: { base: mill, running: { room: 'r04', src: millRunning } },
  bridge: { base: bridge, running: { room: 'r05', src: bridgeDown } },
  yard: { base: yard, running: { room: 'r06', src: yardLevel } },
  tram: { base: tram, running: { room: 'r08', src: tramRunning } },
  lift: { base: lift, running: { room: 'r09', src: liftUp } },
  market: { base: market, running: { room: 'r10', src: marketLevel } },
  wheel: { base: wheel, running: { room: 'r11', src: wheelTurning } },
  hill: { base: hill, running: { room: 'r13', src: hillRunning } },
};

/** An area's picture as it stands now. */
export function areaArt(area: AreaId, done: readonly RoomId[]): string {
  const { base, running } = pictures[area];
  return running && done.includes(running.room) ? running.src : base;
}

/** An area's picture before its machine runs, and the room that sets it running, if any. */
export function areaChange(area: AreaId): { room: RoomId; before: string } | null {
  const { base, running } = pictures[area];
  return running ? { room: running.room, before: base } : null;
}

/** Every town picture, for the loading screen to fetch before the game starts. */
export const townImages: readonly string[] = [
  ...Object.values(pictures).flatMap(({ base, running }) =>
    running ? [base, running.src] : [base],
  ),
  automaton20,
  ...Object.values(looks),
  ...Object.values(personArt),
];
