import { describe, expect, it } from 'vitest';
import { mapView, nextRoomOnMap, roomOpen } from '@/city/reach';
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

describe('where he can go (city/reach.ts, story 2.2)', () => {
  it('opens room 1 at the start, and nothing else', () => {
    const open = districtMap.nodes.filter((node) => roomOpen(districtMap, node.id, [], authored));
    expect(open.map((node) => node.id)).toEqual(['r01']);
  });

  it('opens a room beside a finished one, and keeps finished rooms open to play again', () => {
    expect(roomOpen(districtMap, 'r02', ['r01'], authored)).toBe(true);
    expect(roomOpen(districtMap, 'r01', ['r01'], authored)).toBe(true);
    expect(roomOpen(districtMap, 'r03', ['r01'], authored)).toBe(false);
  });

  it('never opens a room whose story hasn’t been built, a lair, the workshop or the gate', () => {
    const done = ['r01', 'r02', 'r03', 'r04'];
    for (const id of ['r05', 'r06', 'r09', 'lair-20', 'workshop', 'foundry']) {
      expect(roomOpen(districtMap, id, done, authored), id).toBe(false);
    }
  });

  it('names the next room: the first open one he hasn’t finished', () => {
    expect(nextRoomOnMap(districtMap, [], authored)).toBe('r01');
    expect(nextRoomOnMap(districtMap, ['r01'], authored)).toBe('r02');
    expect(nextRoomOnMap(districtMap, ['r01', 'r02', 'r03', 'r04'], authored)).toBeNull();
  });
});

describe('what the map shows (mapView)', () => {
  const view = (done: string[], started: string[] = [], fresh: string | null = null) =>
    mapView(districtMap, { roomsDone: done, started, fresh }, authored);
  const node = (v: ReturnType<typeof view>, id: string) => v.nodes.find((n) => n.id === id);

  it('shows finished rooms restored, the rooms he can reach open, and the rest closed', () => {
    const v = view(['r01', 'r02']);
    expect(node(v, 'r01')?.state).toBe('restored');
    expect(node(v, 'r02')?.state).toBe('restored');
    expect(node(v, 'r03')?.state).toBe('open');
    expect(node(v, 'r05')?.state).toBe('closed');
    expect(node(v, 'lair-20')?.state).toBe('closed');
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

  it('draws a road in full once both its ends are reachable', () => {
    const v = view(['r01']);
    const travelled = v.roads.filter((road) => road.travelled);
    expect(travelled).toHaveLength(1);
    expect(travelled[0]?.from).toEqual({ x: 150, y: 830 });
  });

  it('says when every room so far is restored', () => {
    expect(view(['r01', 'r02', 'r03']).allDone).toBe(false);
    expect(view(['r01', 'r02', 'r03', 'r04']).allDone).toBe(true);
  });
});
