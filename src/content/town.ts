// The town (stories 5.0 and 5.1): the streets of Donji Kotač he walks through, one area at a
// time. Positions are in town units over each area's illustration, 1600 × 1000. Fixing a
// machine opens the way on: room 1's gate leads from the square to the canal. What is open,
// locked or restored comes from the map's rules (city/reach.ts).

import type { NodeId } from '@/city/types';
import type { Ground, Point } from '@/city/walk';
import type { LairId } from '@/fight/types';
import type { RoomId } from '@/room/types';

export type PersonId = 'penkala' | 'nikola' | 'faust';

export type AreaId = 'square' | 'canal' | 'mill' | 'bridge' | 'yard';

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
  /** The lair whose automaton prowls here, or null. */
  lair: LairId | null;
  /** That automaton's round, which it walks back and forth. */
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
    {
      // Down the lamp street to the river, once the lamps are lit.
      to: 'bridge',
      opensWith: 'r02',
      stand: { x: 1560, y: 625 },
      area: { x: 1480, y: 520, w: 120, h: 200 },
      arrive: { x: 300, y: 900 },
      marker: { x: 1540, y: 500 },
    },
  ],
  people: [
    { id: 'penkala', at: { x: 420, y: 600 }, facing: 1, after: null, changesWith: 'r01' },
    { id: 'nikola', at: { x: 1060, y: 450 }, facing: 1, after: 'r01', changesWith: 'r02' },
    // Faust hands over Kristijan's workshop once room 6 is done (narrative design).
    { id: 'faust', at: { x: 300, y: 700 }, facing: 1, after: 'r06', changesWith: 'r06' },
  ],
  lair: null,
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
    {
      // On along the quay to the mill, once the sluice gate lets the water through.
      to: 'mill',
      opensWith: 'r03',
      stand: { x: 1150, y: 960 },
      area: { x: 1060, y: 880, w: 200, h: 120 },
      arrive: { x: 260, y: 880 },
      marker: { x: 1160, y: 860 },
    },
  ],
  people: [],
  // The first automaton, stripping the lamp on the near quay for parts (narrative design,
  // room 3's beat).
  lair: 'lair-20',
  patrol: [
    { x: 780, y: 880 },
    { x: 900, y: 940 },
    { x: 1000, y: 985 },
  ],
  lamps: [],
};

const mill: TownArea = {
  id: 'mill',
  // The cobbled yard in front of the mill, and the quay path back along the canal.
  ground: ground(
    [
      { x: 0, y: 667 },
      { x: 189, y: 556 },
      { x: 522, y: 467 },
      { x: 778, y: 456 },
      { x: 1167, y: 444 },
      { x: 1200, y: 533 },
      { x: 1333, y: 667 },
      { x: 1478, y: 722 },
      { x: 1389, y: 778 },
      { x: 1333, y: 1000 },
      { x: 0, y: 1000 },
    ],
    [{ x: 1211, y: 911, rx: 45, ry: 28 }],
  ),
  arrive: { x: 300, y: 850 },
  places: [
    {
      node: 'r04',
      stand: { x: 540, y: 530 },
      area: { x: 300, y: 80, w: 400, h: 400 },
      marker: { x: 520, y: 110 },
      bloom: { x: 500, y: 300, r: 400 },
    },
  ],
  exits: [
    {
      to: 'canal',
      opensWith: 'r03',
      stand: { x: 180, y: 900 },
      area: { x: 0, y: 780, w: 280, h: 220 },
      arrive: { x: 1100, y: 930 },
      marker: { x: 130, y: 780 },
    },
    {
      // Through the lane past the houses to the weighing yard, once the wheel turns.
      to: 'yard',
      opensWith: 'r04',
      stand: { x: 1420, y: 720 },
      area: { x: 1380, y: 600, w: 220, h: 200 },
      arrive: { x: 250, y: 780 },
      marker: { x: 1460, y: 590 },
    },
  ],
  people: [],
  lair: null,
  patrol: [],
  lamps: [],
};

const bridge: TownArea = {
  id: 'bridge',
  // The street from the square and the quay terrace before the bridge.
  ground: ground([
    { x: 0, y: 720 },
    { x: 140, y: 650 },
    { x: 300, y: 560 },
    { x: 540, y: 435 },
    { x: 780, y: 475 },
    { x: 1140, y: 670 },
    { x: 1150, y: 705 },
    { x: 640, y: 960 },
    { x: 560, y: 1000 },
    { x: 0, y: 1000 },
  ]),
  arrive: { x: 300, y: 900 },
  places: [
    {
      node: 'r05',
      stand: { x: 600, y: 480 },
      area: { x: 200, y: 0, w: 1300, h: 410 },
      marker: { x: 700, y: 60 },
      bloom: { x: 800, y: 250, r: 520 },
    },
  ],
  exits: [
    {
      to: 'square',
      opensWith: 'r02',
      stand: { x: 160, y: 920 },
      area: { x: 0, y: 820, w: 300, h: 180 },
      arrive: { x: 1500, y: 625 },
      marker: { x: 120, y: 800 },
    },
  ],
  people: [],
  // The armour-30 automaton picks through the scrap alley by the bridge.
  lair: 'lair-30',
  patrol: [
    { x: 1200, y: 880 },
    { x: 1300, y: 930 },
    { x: 1240, y: 970 },
  ],
  lamps: [],
};

const yard: TownArea = {
  id: 'yard',
  // The weighing yard, round the weight racks and the sacks.
  ground: ground(
    [
      { x: 0, y: 660 },
      { x: 330, y: 610 },
      { x: 470, y: 470 },
      { x: 880, y: 440 },
      { x: 1100, y: 250 },
      { x: 1550, y: 190 },
      { x: 1600, y: 350 },
      { x: 1600, y: 1000 },
      { x: 0, y: 1000 },
    ],
    [
      { x: 1190, y: 440, rx: 150, ry: 90 },
      { x: 1120, y: 720, rx: 150, ry: 90 },
      { x: 850, y: 760, rx: 150, ry: 80 },
      { x: 855, y: 640, rx: 30, ry: 20 },
      { x: 1530, y: 830, rx: 120, ry: 200 },
      { x: 60, y: 930, rx: 90, ry: 80 },
    ],
  ),
  arrive: { x: 250, y: 780 },
  places: [
    {
      node: 'r06',
      stand: { x: 760, y: 560 },
      area: { x: 800, y: 190, w: 280, h: 330 },
      marker: { x: 930, y: 180 },
      bloom: { x: 850, y: 450, r: 420 },
    },
    {
      // The old archive by the yard, where the logbook is kept.
      node: 'r07',
      stand: { x: 290, y: 640 },
      area: { x: 190, y: 300, w: 140, h: 280 },
      marker: { x: 250, y: 290 },
      bloom: { x: 240, y: 400, r: 260 },
    },
  ],
  exits: [
    {
      to: 'mill',
      opensWith: 'r04',
      stand: { x: 200, y: 770 },
      area: { x: 0, y: 700, w: 300, h: 160 },
      arrive: { x: 1400, y: 720 },
      marker: { x: 150, y: 690 },
    },
  ],
  people: [],
  lair: null,
  patrol: [],
  lamps: [],
};

export const town = {
  width: 1600,
  height: 1000,
  /** His height, in town units; people and the automaton scale from it. */
  figure: 175,
  start: 'square' as AreaId,
  areas: { square, canal, mill, bridge, yard } as Record<AreaId, TownArea>,
};

/** The area that holds a room, so he comes out where he went in. */
export function areaOf(node: NodeId | null): AreaId | null {
  if (!node) return null;
  for (const area of Object.values(town.areas)) {
    if (area.places.some((place) => place.node === node)) return area.id;
  }
  return null;
}
