// The town (stories 5.0 and 5.1): the streets of Donji Kotač he walks through, one area at a
// time. Positions are in town units over each area's illustration, 1600 × 1000. Fixing a
// machine opens the way on: room 1's gate leads from the square to the canal. What is open,
// locked or restored comes from the map's rules (city/reach.ts).

import type { NodeId } from '@/city/types';
import type { Ground, Point } from '@/city/walk';
import type { LairId } from '@/fight/types';
import type { HuntMark } from '@/hunt/ids';
import type { RoomId } from '@/room/types';

export type PersonId = 'penkala' | 'nikola' | 'faust' | 'milka' | 'vucetic' | 'zagorka';

export type AreaId =
  | 'square'
  | 'canal'
  | 'mill'
  | 'bridge'
  | 'yard'
  | 'tram'
  | 'lift'
  | 'market'
  | 'wheel'
  | 'hill'
  | 'u1';

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
  /** The room whose restart opens it, or what in the hunt does. */
  opensWith: RoomId | HuntMark;
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
  /** Shown once this room is done, or this mark of the hunt reached; always when null. */
  after: RoomId | HuntMark | null;
  /** The room or mark that changes what the person says. */
  changesWith: RoomId | HuntMark;
  /** Gone once this room is done (they have moved on to another street). */
  until?: RoomId | HuntMark;
  /** Lines of their own for this street (hr.town.scenes), in place of their usual ones. */
  scene?: SceneId;
}

/** A person's lines in one street, before and after its room. */
export type SceneId =
  | 'canalNikola'
  | 'millNikola'
  | 'yardFaust'
  | 'tramPenkala'
  | 'marketPenkala'
  | 'hillNikola'
  | 'canalMilka'
  | 'millMilka'
  | 'bridgeVucetic'
  | 'liftZagorka'
  | 'wheelZagorka'
  | 'u1Vucetic';

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
  /**
   * Where the picture itself shows the automaton, standing still: a tap area and where he
   * stands to face it, in place of a figure on a round.
   */
  lairSpot?: { area: Rect; stand: Point };
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
    // Penkala keeps to the square until the tram needs its conductor (room 7 on).
    {
      id: 'penkala',
      at: { x: 420, y: 600 },
      facing: 1,
      after: null,
      changesWith: 'r01',
      until: 'r07',
    },
    // Nikola waits by the lamps, then follows the repairs down the canal.
    {
      id: 'nikola',
      at: { x: 1060, y: 450 },
      facing: 1,
      after: 'r01',
      changesWith: 'r02',
      until: 'r03',
    },
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
    {
      // Along the quay to the left, to the steam lift, once the chain is his (room 7).
      to: 'lift',
      opensWith: 'r07',
      stand: { x: 60, y: 520 },
      area: { x: 0, y: 430, w: 120, h: 180 },
      arrive: { x: 330, y: 740 },
      marker: { x: 60, y: 420 },
    },
  ],
  people: [
    // Milka asks for the sluice: her mill stands without water.
    {
      id: 'milka',
      at: { x: 650, y: 770 },
      facing: -1,
      after: 'r02',
      changesWith: 'r03',
      until: 'r03',
      scene: 'canalMilka',
    },
    {
      id: 'nikola',
      at: { x: 650, y: 770 },
      facing: -1,
      after: 'r03',
      changesWith: 'r03',
      until: 'r04',
      scene: 'canalNikola',
    },
  ],
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
  people: [
    // Then she waits at the mill for its wheel, and stays to grind.
    {
      id: 'milka',
      at: { x: 560, y: 760 },
      facing: 1,
      after: 'r03',
      changesWith: 'r04',
      scene: 'millMilka',
    },
    {
      id: 'nikola',
      at: { x: 800, y: 700 },
      facing: -1,
      after: 'r04',
      changesWith: 'r04',
      until: 'r12',
      scene: 'millNikola',
    },
  ],
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
  people: [
    // The bridge guard asks for the tangled counterweights once Balance (room 3) opens the
    // bridge, and notes everything down.
    {
      id: 'vucetic',
      at: { x: 450, y: 720 },
      facing: 1,
      after: 'r03',
      changesWith: 'r05',
      // Part 2: he has gone up to the foundry's door.
      until: 'gate',
      scene: 'bridgeVucetic',
    },
  ],
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
      // The foundry's great doors at the back of the yard, sealed with the First
      // Automaton's mark: where the clock tower's line points (the district's last beat).
      node: 'foundry',
      stand: { x: 700, y: 480 },
      area: { x: 600, y: 0, w: 260, h: 250 },
      marker: { x: 730, y: 20 },
      bloom: { x: 730, y: 130, r: 200 },
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
      // Through the foundry's great doors, once he has opened them (part 2).
      to: 'u1',
      opensWith: 'gate',
      stand: { x: 700, y: 480 },
      area: { x: 600, y: 0, w: 260, h: 250 },
      arrive: { x: 200, y: 790 },
      marker: { x: 730, y: 20 },
    },
    {
      to: 'mill',
      opensWith: 'r04',
      stand: { x: 200, y: 770 },
      area: { x: 0, y: 700, w: 300, h: 160 },
      arrive: { x: 1400, y: 720 },
      marker: { x: 150, y: 690 },
    },
    {
      // Past the warehouses to the tram depot, once the chain is his (room 7).
      to: 'tram',
      opensWith: 'r07',
      stand: { x: 1500, y: 300 },
      area: { x: 1450, y: 180, w: 150, h: 180 },
      arrive: { x: 200, y: 860 },
      marker: { x: 1520, y: 170 },
    },
  ],
  people: [
    {
      id: 'faust',
      at: { x: 600, y: 720 },
      facing: 1,
      after: 'r04',
      changesWith: 'r06',
      until: 'r06',
      scene: 'yardFaust',
    },
  ],
  lair: null,
  patrol: [],
  lamps: [],
};

const tram: TownArea = {
  id: 'tram',
  ground: ground(
    [
      { x: 0, y: 660 },
      { x: 560, y: 470 },
      { x: 1100, y: 300 },
      { x: 1240, y: 260 },
      { x: 1600, y: 420 },
      { x: 1600, y: 1000 },
      { x: 0, y: 1000 },
    ],
    [
      { x: 930, y: 610, rx: 210, ry: 150 },
      { x: 60, y: 930, rx: 90, ry: 70 },
    ],
  ),
  arrive: { x: 200, y: 860 },
  places: [
    {
      node: 'r08',
      stand: { x: 640, y: 720 },
      area: { x: 740, y: 400, w: 400, h: 380 },
      marker: { x: 930, y: 400 },
      bloom: { x: 900, y: 450, r: 460 },
    },
  ],
  exits: [
    {
      to: 'yard',
      opensWith: 'r07',
      stand: { x: 150, y: 880 },
      area: { x: 0, y: 760, w: 260, h: 240 },
      arrive: { x: 1480, y: 300 },
      marker: { x: 120, y: 750 },
    },
    {
      to: 'market',
      opensWith: 'r08',
      stand: { x: 1540, y: 700 },
      area: { x: 1480, y: 560, w: 120, h: 260 },
      arrive: { x: 300, y: 860 },
      marker: { x: 1540, y: 550 },
    },
  ],
  people: [
    {
      id: 'penkala',
      at: { x: 450, y: 620 },
      facing: 1,
      after: 'r07',
      changesWith: 'r08',
      until: 'r08',
      scene: 'tramPenkala',
    },
  ],
  // The armour-45 automaton picks through the scrap behind the shed.
  lair: 'lair-45',
  patrol: [
    { x: 1380, y: 330 },
    { x: 1500, y: 380 },
    { x: 1440, y: 410 },
  ],
  lamps: [],
};

const lift: TownArea = {
  id: 'lift',
  // The pier at the foot of the cliff.
  ground: ground(
    [
      { x: 240, y: 690 },
      { x: 560, y: 560 },
      { x: 880, y: 330 },
      { x: 1050, y: 330 },
      { x: 1545, y: 600 },
      { x: 1530, y: 660 },
      { x: 800, y: 960 },
      { x: 560, y: 820 },
      { x: 300, y: 760 },
    ],
    [
      { x: 1130, y: 590, rx: 45, ry: 30 },
      { x: 1195, y: 705, rx: 45, ry: 30 },
      { x: 915, y: 760, rx: 45, ry: 30 },
      { x: 1010, y: 810, rx: 45, ry: 30 },
    ],
  ),
  arrive: { x: 330, y: 740 },
  places: [
    {
      node: 'r09',
      stand: { x: 800, y: 690 },
      area: { x: 430, y: 90, w: 440, h: 580 },
      marker: { x: 580, y: 110 },
      bloom: { x: 600, y: 400, r: 460 },
    },
  ],
  exits: [
    {
      // Down the steps and back along the canal.
      to: 'canal',
      opensWith: 'r07',
      stand: { x: 300, y: 745 },
      area: { x: 0, y: 700, w: 330, h: 300 },
      arrive: { x: 60, y: 520 },
      marker: { x: 170, y: 690 },
    },
  ],
  people: [
    // Zagorka wants her story about the steam lift; then she follows the next one.
    {
      id: 'zagorka',
      at: { x: 560, y: 760 },
      facing: 1,
      after: 'r07',
      changesWith: 'r09',
      until: 'r10',
      scene: 'liftZagorka',
    },
  ],
  lair: null,
  patrol: [],
  lamps: [],
};

const market: TownArea = {
  id: 'market',
  // Getaldicev trg: round the big scale, the stalls and the baskets.
  ground: ground(
    [
      { x: 220, y: 800 },
      { x: 440, y: 700 },
      { x: 560, y: 520 },
      { x: 700, y: 460 },
      { x: 930, y: 470 },
      { x: 1150, y: 560 },
      { x: 1260, y: 520 },
      { x: 1600, y: 600 },
      { x: 1600, y: 700 },
      { x: 1360, y: 760 },
      { x: 1100, y: 1000 },
      { x: 560, y: 1000 },
      { x: 470, y: 920 },
    ],
    [
      { x: 800, y: 640, rx: 110, ry: 55 },
      { x: 1130, y: 500, rx: 110, ry: 60 },
    ],
  ),
  arrive: { x: 300, y: 860 },
  places: [
    {
      node: 'r10',
      stand: { x: 700, y: 730 },
      area: { x: 690, y: 150, w: 220, h: 500 },
      marker: { x: 790, y: 140 },
      bloom: { x: 800, y: 450, r: 460 },
    },
  ],
  exits: [
    {
      to: 'tram',
      opensWith: 'r08',
      stand: { x: 300, y: 880 },
      area: { x: 200, y: 820, w: 260, h: 180 },
      arrive: { x: 1500, y: 700 },
      marker: { x: 320, y: 810 },
    },
    {
      // On along the street to the river and the great wheel.
      to: 'wheel',
      opensWith: 'r10',
      stand: { x: 1550, y: 650 },
      area: { x: 1480, y: 560, w: 120, h: 160 },
      arrive: { x: 200, y: 860 },
      marker: { x: 1540, y: 550 },
    },
  ],
  people: [
    // His room 10 beat: he settles up, grudgingly (narrative design).
    {
      id: 'penkala',
      at: { x: 560, y: 760 },
      facing: 1,
      after: 'r08',
      changesWith: 'r10',
      scene: 'marketPenkala',
    },
  ],
  lair: null,
  patrol: [],
  lamps: [],
};

const wheel: TownArea = {
  id: 'wheel',
  // The street and the railed terrace before the great wheel.
  ground: ground([
    { x: 0, y: 700 },
    { x: 300, y: 660 },
    { x: 1020, y: 400 },
    { x: 1480, y: 600 },
    { x: 780, y: 940 },
    { x: 500, y: 1000 },
    { x: 0, y: 1000 },
  ]),
  arrive: { x: 200, y: 860 },
  places: [
    {
      node: 'r11',
      stand: { x: 760, y: 560 },
      area: { x: 420, y: 20, w: 540, h: 560 },
      marker: { x: 690, y: 40 },
      bloom: { x: 680, y: 350, r: 460 },
    },
  ],
  exits: [
    {
      to: 'market',
      opensWith: 'r10',
      stand: { x: 150, y: 900 },
      area: { x: 0, y: 820, w: 260, h: 180 },
      arrive: { x: 1500, y: 650 },
      marker: { x: 120, y: 810 },
    },
    {
      // Up the steps under the arch to the hilltop, once the great wheel turns.
      to: 'hill',
      opensWith: 'r11',
      stand: { x: 250, y: 660 },
      area: { x: 120, y: 380, w: 170, h: 200 },
      arrive: { x: 260, y: 860 },
      marker: { x: 200, y: 370 },
    },
  ],
  people: [
    {
      id: 'zagorka',
      at: { x: 450, y: 760 },
      facing: 1,
      after: 'r10',
      changesWith: 'r11',
      scene: 'wheelZagorka',
    },
  ],
  lair: null,
  patrol: [],
  lamps: [],
};

const hill: TownArea = {
  id: 'hill',
  // The hilltop between the linked machines and the clock tower.
  ground: ground(
    [
      { x: 120, y: 760 },
      { x: 560, y: 690 },
      { x: 860, y: 520 },
      { x: 1180, y: 600 },
      { x: 1600, y: 780 },
      { x: 1600, y: 880 },
      { x: 1100, y: 930 },
      { x: 600, y: 900 },
      { x: 300, y: 880 },
    ],
    [{ x: 1360, y: 640, rx: 190, ry: 100 }],
  ),
  arrive: { x: 260, y: 860 },
  places: [
    {
      node: 'r12',
      stand: { x: 640, y: 720 },
      area: { x: 180, y: 60, w: 600, h: 560 },
      marker: { x: 450, y: 80 },
      bloom: { x: 450, y: 350, r: 460 },
    },
    {
      node: 'r13',
      stand: { x: 1100, y: 640 },
      area: { x: 1000, y: 0, w: 350, h: 600 },
      marker: { x: 1150, y: 40 },
      bloom: { x: 1250, y: 350, r: 460 },
    },
  ],
  exits: [
    {
      to: 'wheel',
      opensWith: 'r11',
      stand: { x: 230, y: 850 },
      area: { x: 100, y: 780, w: 250, h: 220 },
      arrive: { x: 250, y: 660 },
      marker: { x: 200, y: 770 },
    },
  ],
  people: [
    {
      id: 'nikola',
      at: { x: 900, y: 720 },
      facing: -1,
      after: 'r12',
      changesWith: 'r13',
      scene: 'hillNikola',
    },
  ],
  // The huge armour-60 automaton guards the scrap behind the tower.
  lair: 'lair-60',
  patrol: [
    { x: 1470, y: 720 },
    { x: 1560, y: 770 },
    { x: 1400, y: 760 },
  ],
  lamps: [],
};

// The first street of the upper district, behind the foundry (part 2, story 7.5). The cobbles
// lie below the terrace that crosses the picture; the fountain, the lift tower, the lamps and
// the stone post stand on them.
const u1: TownArea = {
  id: 'u1',
  ground: ground(
    [
      { x: 0, y: 810 },
      { x: 280, y: 665 },
      { x: 430, y: 590 },
      { x: 640, y: 490 },
      { x: 860, y: 400 },
      { x: 1040, y: 310 },
      { x: 1180, y: 250 },
      { x: 1400, y: 170 },
      { x: 1600, y: 280 },
      { x: 1600, y: 1000 },
      { x: 0, y: 1000 },
    ],
    [
      { x: 775, y: 690, rx: 150, ry: 90 },
      { x: 1480, y: 680, rx: 110, ry: 60 },
      { x: 1178, y: 400, rx: 40, ry: 24 },
      { x: 1315, y: 330, rx: 40, ry: 24 },
      { x: 250, y: 915, rx: 70, ry: 40 },
    ],
  ),
  arrive: { x: 200, y: 790 },
  places: [],
  exits: [
    {
      // Back through the foundry, to the yard.
      to: 'yard',
      opensWith: 'gate',
      stand: { x: 90, y: 860 },
      area: { x: 0, y: 830, w: 170, h: 170 },
      arrive: { x: 700, y: 480 },
      marker: { x: 110, y: 830 },
    },
  ],
  people: [
    // He arrives at the foundry's door, as thorough as ever, and hands over the map.
    {
      id: 'vucetic',
      at: { x: 480, y: 720 },
      facing: -1,
      after: 'gate',
      changesWith: 'map',
      scene: 'u1Vucetic',
    },
  ],
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
  areas: { square, canal, mill, bridge, yard, tram, lift, market, wheel, hill, u1 } as Record<
    AreaId,
    TownArea
  >,
};

/** The area that holds a room, so he comes out where he went in. */
/** Whether every machine in a street runs (a place that isn't a room, like the workshop, doesn't count). */
export function streetRestored(area: AreaId, done: readonly string[]): boolean {
  const machines = town.areas[area].places.filter((place) => /^r\d\d$/.test(place.node));
  return machines.length > 0 && machines.every((place) => done.includes(place.node));
}

export function areaOf(node: string | null): AreaId | null {
  if (!node) return null;
  for (const area of Object.values(town.areas)) {
    if (area.places.some((place) => place.node === node)) return area.id;
  }
  return null;
}
