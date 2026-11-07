// The town (stories 5.0 and 5.1): the streets of Donji Kotač he walks through, one area at a
// time. Positions are in town units over each area's illustration, 1600 × 1000. Fixing a
// machine opens the way on: room 1's gate leads from the square to the canal. What is open,
// locked or restored comes from the map's rules (city/reach.ts).

import type { NodeId } from '@/city/types';
import type { Ground, Point } from '@/city/walk';
import type { RoomId } from '@/room/types';

export type PersonId = 'penkala' | 'nikola';

export type AreaId = 'square' | 'canal';

/** A tap area over an illustration, in town units. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TownPlace {
  /** The map node it stands for: tapping it, once there, travels as the map does. */
  node: NodeId;
  /** Where he stands to use it. */
  stand: Point;
  area: Rect;
  /** Where the marker for the next machine hangs. */
  marker: Point;
  /** The patch of the area that turns to colour when it restarts. */
  bloom: { x: number; y: number; r: number };
}

/** A way into another area, open once a room is done. */
export interface TownExit {
  to: AreaId;
  /** The room whose restart opens it. */
  opensWith: RoomId;
  stand: Point;
  area: Rect;
  /** Where he comes out in the other area. */
  arrive: Point;
  marker: Point;
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

export interface TownArea {
  id: AreaId;
  ground: Ground;
  /** Where he stands when the game puts him here without a way in (after the naming). */
  arrive: Point;
  places: readonly TownPlace[];
  /** Ways on, listed before places: an open exit takes the tap over a place's area. */
  exits: readonly TownExit[];
  people: readonly TownPerson[];
  /** The first automaton's round, which it walks back and forth, if it is here. */
  patrol: readonly Point[];
  /** Lamp heads that glow once room 2 restarts. */
  lamps: readonly Point[];
}

const ground = (outline: Point[], holes: Ground['holes'] = []): Ground => ({
  outline,
  holes,
  cell: 20,
  width: 1600,
  height: 1000,
});

const square: TownArea = {
  id: 'square',
  ground: ground(
    [
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
    [{ x: 780, y: 630, rx: 150, ry: 85 }],
  ),
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
  exits: [
    {
      // The gate, raised by room 1: through it to the canal.
      to: 'canal',
      opensWith: 'r01',
      stand: { x: 540, y: 480 },
      area: { x: 300, y: 40, w: 420, h: 390 },
      arrive: { x: 470, y: 880 },
      marker: { x: 510, y: 140 },
    },
  ],
  people: [
    { id: 'penkala', at: { x: 420, y: 600 }, facing: 1, after: null, changesWith: 'r01' },
    { id: 'nikola', at: { x: 1060, y: 450 }, facing: 1, after: 'r01', changesWith: 'r02' },
  ],
  patrol: [],
  lamps: [
    { x: 1187, y: 222 },
    { x: 1322, y: 165 },
    { x: 1462, y: 75 },
    { x: 545, y: 830 },
  ],
};

const canal: TownArea = {
  id: 'canal',
  // The near quay, from the stair by the sluice gate down to the bottom edge, round the
  // town wall's tower in the bottom-left corner.
  ground: ground([
    { x: 0, y: 450 },
    { x: 330, y: 575 },
    { x: 560, y: 650 },
    { x: 1000, y: 860 },
    { x: 1240, y: 1000 },
    { x: 420, y: 1000 },
    { x: 410, y: 640 },
    { x: 0, y: 590 },
  ]),
  arrive: { x: 520, y: 880 },
  places: [
    {
      node: 'r03',
      stand: { x: 520, y: 680 },
      area: { x: 530, y: 280, w: 340, h: 380 },
      marker: { x: 700, y: 270 },
      bloom: { x: 720, y: 520, r: 380 },
    },
  ],
  exits: [
    {
      // Back through the wall's gateway to the square.
      to: 'square',
      opensWith: 'r01',
      stand: { x: 440, y: 950 },
      area: { x: 30, y: 860, w: 240, h: 140 },
      arrive: { x: 560, y: 520 },
      marker: { x: 140, y: 860 },
    },
  ],
  people: [],
  // The first automaton, stripping the lamp on the near quay for parts (narrative design,
  // room 3's beat).
  patrol: [
    { x: 780, y: 880 },
    { x: 900, y: 940 },
    { x: 1000, y: 985 },
  ],
  lamps: [],
};

export const town = {
  width: 1600,
  height: 1000,
  /** His height, in town units; people and the automaton scale from it. */
  figure: 175,
  start: 'square' as AreaId,
  areas: { square, canal } as Record<AreaId, TownArea>,
};

/** The area that holds a room, so he comes out where he went in. */
export function areaOf(node: NodeId | null): AreaId | null {
  if (!node) return null;
  for (const area of Object.values(town.areas)) {
    if (area.places.some((place) => place.node === node)) return area.id;
  }
  return null;
}
