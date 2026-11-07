// The town square (story 5.0): the first street of Donji Kotač he walks through. Positions
// are in town units over the square's illustration, 1600 × 1000. The square holds rooms 1
// and 2, Kristijan's workshop and the first automaton; its people stand where their lines
// belong. What is open, locked or restored comes from the map's rules (city/reach.ts).

import type { NodeId } from '@/city/types';
import type { Ground, Point } from '@/city/walk';
import type { RoomId } from '@/room/types';

export type PersonId = 'penkala' | 'nikola';

export interface TownPlace {
  /** The map node it stands for: tapping it, once there, travels as the map does. */
  node: NodeId;
  /** Where he stands to use it. */
  stand: Point;
  /** The tap area over the illustration, in town units. */
  area: { x: number; y: number; w: number; h: number };
  /** Where the marker for the next machine hangs. */
  marker: Point;
  /** The patch of the square that turns to colour when it restarts. */
  bloom: { x: number; y: number; r: number };
}

export interface TownPerson {
  id: PersonId;
  at: Point;
  /** He faces this way when standing: 1 right, -1 left. */
  facing: 1 | -1;
  /** Shown once this room is done; always when null. */
  after: RoomId | null;
  /** The room whose restart changes what the person says. */
  changesWith: RoomId;
}

export interface TownSpec {
  width: number;
  height: number;
  ground: Ground;
  /** Where he arrives after the naming, and the start of every visit. */
  arrive: Point;
  places: readonly TownPlace[];
  people: readonly TownPerson[];
  /** The automaton's round, which it walks back and forth. */
  patrol: readonly Point[];
  /** Lamp heads that glow once room 2 restarts. */
  lamps: readonly Point[];
  /** His height, in town units; people and the automaton scale from it. */
  figure: number;
}

export const town: TownSpec = {
  width: 1600,
  height: 1000,
  ground: {
    outline: [
      { x: 150, y: 730 },
      { x: 420, y: 560 },
      { x: 520, y: 470 },
      { x: 700, y: 420 },
      { x: 860, y: 340 },
      { x: 1010, y: 300 },
      { x: 1290, y: 420 },
      { x: 1600, y: 560 },
      { x: 1600, y: 690 },
      { x: 1360, y: 630 },
      { x: 1090, y: 800 },
      { x: 1080, y: 1000 },
      { x: 560, y: 1000 },
      { x: 470, y: 880 },
      { x: 330, y: 850 },
    ],
    holes: [{ x: 780, y: 630, rx: 150, ry: 85 }],
    cell: 20,
    width: 1600,
    height: 1000,
  },
  arrive: { x: 700, y: 900 },
  places: [
    {
      node: 'r01',
      stand: { x: 560, y: 500 },
      area: { x: 300, y: 40, w: 420, h: 390 },
      marker: { x: 510, y: 140 },
      bloom: { x: 520, y: 300, r: 330 },
    },
    {
      node: 'r02',
      stand: { x: 1180, y: 430 },
      area: { x: 1150, y: 20, w: 450, h: 340 },
      marker: { x: 1185, y: 130 },
      bloom: { x: 1340, y: 250, r: 330 },
    },
    {
      node: 'workshop',
      stand: { x: 230, y: 720 },
      area: { x: 40, y: 480, w: 160, h: 200 },
      marker: { x: 110, y: 470 },
      bloom: { x: 120, y: 600, r: 200 },
    },
  ],
  people: [
    { id: 'penkala', at: { x: 420, y: 600 }, facing: 1, after: null, changesWith: 'r01' },
    { id: 'nikola', at: { x: 1060, y: 450 }, facing: 1, after: 'r01', changesWith: 'r02' },
  ],
  patrol: [
    { x: 1500, y: 640 },
    { x: 1330, y: 560 },
    { x: 1200, y: 640 },
  ],
  lamps: [
    { x: 1187, y: 222 },
    { x: 1322, y: 165 },
    { x: 1462, y: 75 },
    { x: 545, y: 830 },
  ],
  figure: 175,
};
