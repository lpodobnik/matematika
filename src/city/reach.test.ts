import { describe, expect, it } from 'vitest';
import { mapView, nextRoomOnMap, type Reach, roomOpen } from '@/city/reach';
import { districtMap } from '@/content/map';
import { rooms } from '@/content/rooms';
import { roomIds } from '@/room/types';

const authored = rooms.map((room) => room.id);

describe('the district map (content/map.ts; GDD, Level Structure)', () => {
  it('has the 19 nodes: 13 rooms, 4 lairs, the workshop and the foundry gate', () => {
    const { nodes } = districtMap;
    expect(nodes).toHaveLength(19);
    expect(new Set(nodes.map((node) => node.id)).size).toBe(19);
    expect(nodes.filter((node) => node.kind === 'room').map((node) => node.id)).toEqual([
      ...roomIds,
    ]);
    expect(nodes.filter((node) => node.kind === 'lair')).toHaveLength(4);
    expect(nodes.filter((node) => node.kind === 'workshop')).toHaveLength(1);
    expect(nodes.filter((node) => node.kind === 'gate')).toHaveLength(1);
  });

  it('has the GDD’s roads between rooms, and each lair, the workshop and the gate on its room', () => {
    const roads = districtMap.edges.map(([a, b]) => `${a}–${b}`);
    expect(roads).toEqual([
      'r01–r02',
      'r02–r03',
      'r03–r04',
      'r02–r05',
      'r04–r06',
      'r05–r07',
      'r06–r07',
      'r07–r08',
      'r03–r09',
      'r08–r10',
      'r09–r11',
      'r10–r11',
      'r11–r12',
      'r12–r13',
      'r02–lair-20',
      'r05–lair-30',
      'r08–lair-45',
      'r12–lair-60',
      'r06–workshop',
      'r06–foundry',
    ]);
  });

  it('places every node on the map, with room for its button and name', () => {
    for (const { id, at } of districtMap.nodes) {
      expect(at.x, id).toBeGreaterThanOrEqual(100);
      expect(at.x, id).toBeLessThanOrEqual(1500);
      expect(at.y, id).toBeGreaterThanOrEqual(100);
      expect(at.y, id).toBeLessThanOrEqual(880);
    }
  });

  it('keeps nodes far enough apart for two buttons and their names', () => {
    const { nodes } = districtMap;
    for (const [i, a] of nodes.entries()) {
      for (const b of nodes.slice(i + 1)) {
        const distance = Math.hypot(a.at.x - b.at.x, a.at.y - b.at.y);
        expect(distance, `${a.id} and ${b.id}`).toBeGreaterThanOrEqual(150);
      }
    }
  });

  it('puts every authored room on the map', () => {
    const onMap = new Set(districtMap.nodes.map((node) => node.id));
    for (const id of authored) expect(onMap.has(id as never), id).toBe(true);
  });
});

describe('the gates on the map (content/map.ts, story 2.3)', () => {
  const gateOf = (id: string) => districtMap.nodes.find((node) => node.id === id)?.gate;

  it('follows the GDD’s table: Balance, the workshop, the gear chain, the drum', () => {
    expect(gateOf('r04')).toEqual({ tools: ['balance'] });
    expect(gateOf('r05')).toEqual({ tools: ['balance'] });
    expect(gateOf('workshop')).toEqual({ tools: ['workshop'] });
    expect(gateOf('r08')).toEqual({ tools: ['chain'] });
    expect(gateOf('r09')).toEqual({ tools: ['chain'] });
    expect(gateOf('r13')).toEqual({ tools: ['drum'] });
    expect(gateOf('foundry')).toEqual({ sealed: true });
  });

  it('has a lock only where it shows what opens the gate', () => {
    const opens = { weights: 'balance', chain: 'chain', drum: 'drum' } as const;
    for (const node of districtMap.nodes) {
      if (!node.lock) continue;
      if (node.lock === 'plate') {
        expect(node.gate?.sealed, node.id).toBe(true);
        expect(node.plate, node.id).toBe('5 · x = 40');
      } else {
        expect(node.gate?.tools, node.id).toContain(opens[node.lock]);
      }
    }
  });

  it('opens nothing for parts: gates name only tools and rooms (FR32)', () => {
    for (const node of districtMap.nodes) {
      for (const key of Object.keys(node.gate ?? {})) {
        expect(['tools', 'rooms', 'sealed'], node.id).toContain(key);
      }
    }
  });
});

// Reach as if every room were authored, to check the gates beyond the rooms built so far.
const all = roomIds as readonly string[];
const reach = (done: string[], tools: string[] = [], authoredRooms = all): Reach => ({
  done,
  tools,
  authored: authoredRooms,
});

describe('where he can go (city/reach.ts, stories 2.2 and 2.3)', () => {
  it('opens room 1 at the start, and nothing else', () => {
    const open = districtMap.nodes.filter((node) => roomOpen(districtMap, node.id, reach([])));
    expect(open.map((node) => node.id)).toEqual(['r01']);
  });

  it('opens a room beside a finished one, and keeps finished rooms open to play again', () => {
    expect(roomOpen(districtMap, 'r02', reach(['r01']))).toBe(true);
    expect(roomOpen(districtMap, 'r01', reach(['r01']))).toBe(true);
    expect(roomOpen(districtMap, 'r03', reach(['r01']))).toBe(false);
  });

  it('keeps the bridge shut until Balance, then opens it', () => {
    expect(roomOpen(districtMap, 'r05', reach(['r01', 'r02']))).toBe(false);
    expect(roomOpen(districtMap, 'r05', reach(['r01', 'r02', 'r03'], ['balance']))).toBe(true);
    // Room 4 likewise: beside room 3, and Balance comes with it.
    expect(roomOpen(districtMap, 'r04', reach(['r01', 'r02', 'r03']))).toBe(false);
    expect(roomOpen(districtMap, 'r04', reach(['r01', 'r02', 'r03'], ['balance']))).toBe(true);
  });

  it('plays rooms 5 and 6 in either order, and room 7 once both are finished', () => {
    const before = ['r01', 'r02', 'r03', 'r04'];
    const tools = ['balance'];
    expect(roomOpen(districtMap, 'r05', reach(before, tools))).toBe(true);
    expect(roomOpen(districtMap, 'r06', reach(before, tools))).toBe(true);
    expect(roomOpen(districtMap, 'r07', reach([...before, 'r05'], tools))).toBe(false);
    expect(roomOpen(districtMap, 'r07', reach([...before, 'r06'], tools))).toBe(false);
    expect(roomOpen(districtMap, 'r07', reach([...before, 'r05', 'r06'], tools))).toBe(true);
  });

  it('opens rooms 8 and 9 with the gear chain, and 11 once 9 and 10 are finished', () => {
    const to7 = ['r01', 'r02', 'r03', 'r04', 'r05', 'r06', 'r07'];
    const tools = ['balance', 'workshop'];
    expect(roomOpen(districtMap, 'r08', reach(to7, tools))).toBe(false);
    expect(roomOpen(districtMap, 'r09', reach(to7, tools))).toBe(false);
    const chained = [...tools, 'chain'];
    expect(roomOpen(districtMap, 'r08', reach(to7, chained))).toBe(true);
    expect(roomOpen(districtMap, 'r09', reach(to7, chained))).toBe(true);
    const to10 = [...to7, 'r08', 'r10'];
    expect(roomOpen(districtMap, 'r11', reach(to10, chained))).toBe(false);
    expect(roomOpen(districtMap, 'r11', reach([...to10, 'r09'], chained))).toBe(true);
  });

  it('opens room 13 with the drum, and never the foundry gate', () => {
    const to12 = roomIds.slice(0, 12) as string[];
    const tools = ['balance', 'workshop', 'chain'];
    expect(roomOpen(districtMap, 'r13', reach(to12, tools))).toBe(false);
    expect(roomOpen(districtMap, 'r13', reach(to12, [...tools, 'drum']))).toBe(true);
    expect(roomOpen(districtMap, 'foundry', reach([...all], [...tools, 'drum']))).toBe(false);
  });

  it('never opens a room whose story hasn’t been built, a lair or the workshop', () => {
    const done = ['r01', 'r02', 'r03', 'r04'];
    for (const id of ['r08', 'r09', 'lair-20', 'workshop', 'foundry']) {
      expect(roomOpen(districtMap, id, reach(done, ['balance'], authored)), id).toBe(false);
    }
  });

  it('names the next room: the first open one he hasn’t finished', () => {
    expect(nextRoomOnMap(districtMap, reach([], [], authored))).toBe('r01');
    expect(nextRoomOnMap(districtMap, reach(['r01'], [], authored))).toBe('r02');
    const done = ['r01', 'r02', 'r03', 'r04'];
    // Room 5, the bridge, once Balance is earned (story 2.8); then nothing yet.
    expect(nextRoomOnMap(districtMap, reach(done, ['balance'], authored))).toBe('r05');
    // Then room 6 (story 2.9), which earns the workshop; then nothing yet.
    const toFive = [...done, 'r05'];
    expect(nextRoomOnMap(districtMap, reach(toFive, ['balance'], authored))).toBe('r06');
    // Then room 7, once rooms 5 and 6 are both done (story 2.10); then nothing yet.
    const toSix = [...toFive, 'r06'];
    expect(nextRoomOnMap(districtMap, reach(toSix, ['balance', 'workshop'], authored))).toBe('r07');
    const toSeven = [...toSix, 'r07'];
    const chained = ['balance', 'workshop', 'chain'];
    expect(nextRoomOnMap(districtMap, reach(toSeven, chained, authored))).toBeNull();
  });
});

describe('what the map shows (mapView)', () => {
  const toolsAfter = (done: string[]) => (done.includes('r03') ? ['balance'] : []);
  const view = (done: string[], started: string[] = [], fresh: string | null = null) =>
    mapView(districtMap, { roomsDone: done, tools: toolsAfter(done), started, fresh }, authored);
  const node = (v: ReturnType<typeof view>, id: string) => v.nodes.find((n) => n.id === id);

  it('shows finished rooms restored, the rooms he can reach open, and the unseen closed', () => {
    const v = view(['r01']);
    expect(node(v, 'r01')?.state).toBe('restored');
    expect(node(v, 'r02')?.state).toBe('open');
    expect(node(v, 'r03')?.state).toBe('closed');
    expect(node(v, 'r05')?.state).toBe('closed');
    expect(node(v, 'lair-20')?.state).toBe('closed');
  });

  it('after room 2: the bridge shows locked with Balance’s weights, and the lair opens (FR29, FR31; story 3.1)', () => {
    const v = view(['r01', 'r02']);
    expect(node(v, 'r03')?.state).toBe('open');
    expect(node(v, 'r05')).toMatchObject({ state: 'locked', lock: 'weights' });
    expect(node(v, 'lair-20')).toMatchObject({ state: 'open', lock: null });
    expect(node(v, 'lair-30')?.state).toBe('closed');
  });

  it('after room 3: the steam lift shows locked with the gear chain, and the bridge opens', () => {
    const v = view(['r01', 'r02', 'r03']);
    expect(node(v, 'r09')).toMatchObject({ state: 'locked', lock: 'chain' });
    // Story 2.8: room 5 is built, and Balance opens it.
    expect(node(v, 'r05')).toMatchObject({ state: 'open', lock: null });
  });

  it('after room 4: room 6 shows; the foundry gate shows from room 6 with its plate (FR30)', () => {
    expect(node(view(['r01', 'r02', 'r03', 'r04']), 'r06')?.state).toBe('open');
    expect(node(view(['r01', 'r02', 'r03', 'r04']), 'foundry')?.state).toBe('closed');
    const fromSix = mapView(
      districtMap,
      { roomsDone: ['r06'], tools: [], started: [], fresh: null },
      authored,
    );
    expect(node(fromSix, 'foundry')).toMatchObject({
      state: 'locked',
      lock: 'plate',
      plate: '5 · x = 40',
    });
  });

  it('pulses the next room once he has finished room 1, not before', () => {
    expect(view([]).nodes.some((n) => n.next)).toBe(false);
    expect(
      view(['r01'])
        .nodes.filter((n) => n.next)
        .map((n) => n.id),
    ).toEqual(['r02']);
  });

  it('marks a room he left halfway, and the room just restored', () => {
    const v = view(['r01'], ['r02'], 'r01');
    expect(node(v, 'r02')?.started).toBe(true);
    expect(node(v, 'r01')?.fresh).toBe(true);
    expect(node(v, 'r02')?.fresh).toBe(false);
  });

  it('draws a road in full only between places he can travel to', () => {
    const v = view(['r01', 'r02']);
    const travelled = v.roads.filter((road) => road.travelled);
    // Rooms 1–2, rooms 2–3 and the road to the lair beside room 2 (story 3.1).
    expect(travelled).toHaveLength(3);
    expect(travelled[0]?.from).toEqual({ x: 150, y: 830 });
  });

  it('says when every room so far is restored', () => {
    expect(view(['r01', 'r02', 'r03']).allDone).toBe(false);
    expect(view(['r01', 'r02', 'r03', 'r04']).allDone).toBe(false);
    expect(view(['r01', 'r02', 'r03', 'r04', 'r05']).allDone).toBe(false);
    expect(view(['r01', 'r02', 'r03', 'r04', 'r05', 'r06']).allDone).toBe(false);
    expect(view(['r01', 'r02', 'r03', 'r04', 'r05', 'r06', 'r07']).allDone).toBe(true);
  });
});

describe('no softlock (architecture, Testing: map reachability)', () => {
  // What each room earns, from the GDD's table; with every room authored.
  const earns: Record<string, string> = {
    r03: 'balance',
    r06: 'workshop',
    r07: 'chain',
    r12: 'drum',
  };

  it('finishes all 13 rooms in every order the gates allow', () => {
    let orders = 0;
    const play = (done: string[], tools: string[]) => {
      const open = all.filter(
        (id) => !done.includes(id) && roomOpen(districtMap, id, reach(done, tools)),
      );
      if (open.length === 0) {
        expect(done, 'stuck before the last room').toHaveLength(13);
        orders += 1;
        return;
      }
      for (const id of open) {
        const tool = earns[id];
        play([...done, id], tool ? [...tools, tool] : tools);
      }
    };
    play([], []);
    // 4, 5 and 6 with 6 after 4 (3 orders: Balance opens the bridge too), times 8, 9 and
    // 10 with 10 after 8 (3).
    expect(orders).toBe(9);
  });
});

describe('lairs on the map (story 3.3)', () => {
  const progress = { roomsDone: ['r01', 'r02'], tools: [], started: [], fresh: null };
  const lair = (v: ReturnType<typeof mapView>) => v.nodes.find((n) => n.id === 'lair-20');

  it('shows a lair winding down after a win, which takes no tap until it rewinds', () => {
    const v = mapView(districtMap, { ...progress, asleep: ['lair-20'] }, authored);
    expect(lair(v)?.state).toBe('winding');
    expect(lair(mapView(districtMap, progress, authored))?.state).toBe('open');
  });

  it('shows the pile he left at a lair, once the lair is seen', () => {
    const piles = { 'lair-20': 4, 'lair-30': 2 };
    const v = mapView(districtMap, { ...progress, piles }, authored);
    expect(lair(v)?.pile).toBe(4);
    // Not seen yet: no pile shows.
    expect(v.nodes.find((n) => n.id === 'lair-30')?.pile).toBe(0);
    expect(v.nodes.find((n) => n.id === 'r02')?.pile).toBe(0);
  });
});
