// Where he can go on the map (story 2.2; GDD, Level Structure). Pure: the map and the rooms
// that exist come in from content. Room 1 is always open; a finished room stays open, so
// he can play it again; and a room joined by a road to a finished room opens, if it is
// authored. Story 2.3 adds the gates (Balance, the workshop, the gear chain) and the places
// he can see but not open; lairs, the workshop and the gate don't take him anywhere yet.

import type { MapSpec, NodeId, NodeKind } from '@/city/types';

/** The rooms that exist so far, in play order (content/rooms). */
export type Authored = readonly string[];

function neighbours(map: MapSpec, id: string): string[] {
  return map.edges.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));
}

/** Whether he can travel to a node now: room 1, a finished room, or a room beside a finished one. */
export function roomOpen(
  map: MapSpec,
  id: string,
  done: readonly string[],
  authored: Authored,
): boolean {
  if (!authored.includes(id)) return false;
  if (id === authored[0] || done.includes(id)) return true;
  return neighbours(map, id).some((near) => done.includes(near));
}

/**
 * The room to play next: the first authored room, in play order, that is open and not
 * finished. Null when every open room is finished.
 */
export function nextRoomOnMap(
  map: MapSpec,
  done: readonly string[],
  authored: Authored,
): string | null {
  return authored.find((id) => !done.includes(id) && roomOpen(map, id, done, authored)) ?? null;
}

/**
 * How a node shows: `restored`, a room he has finished, its map change in colour; `open`, a
 * room he can travel to; `closed`, everything else, grey and still (NFR12).
 */
export type NodeState = 'restored' | 'open' | 'closed';

export interface NodeView {
  id: NodeId;
  kind: NodeKind;
  x: number;
  y: number;
  state: NodeState;
  /** The room to play next, which pulses (once he has finished room 1). */
  next: boolean;
  /** A room he left halfway: its lines wait for him. */
  started: boolean;
  /** The room he has just restored, whose change plays as the map shows. */
  fresh: boolean;
}

export interface RoadView {
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Both ends are rooms he can reach or has restored: the road is drawn in full ink. */
  travelled: boolean;
}

export interface MapView {
  nodes: NodeView[];
  roads: RoadView[];
  /** Every authored room is finished: the district goes on in the next stories. */
  allDone: boolean;
}

export interface MapProgress {
  roomsDone: readonly string[];
  /** Rooms he left halfway (`progress.started`). */
  started: readonly string[];
  /** The room just restored, or null. */
  fresh: string | null;
}

/** What the map shows. */
export function mapView(map: MapSpec, progress: MapProgress, authored: Authored): MapView {
  const { roomsDone: done, started, fresh } = progress;
  const next = done.length > 0 ? nextRoomOnMap(map, done, authored) : null;
  const stateOf = (id: NodeId): NodeState => {
    if (done.includes(id)) return 'restored';
    return roomOpen(map, id, done, authored) ? 'open' : 'closed';
  };
  const nodes = map.nodes.map(
    (node): NodeView => ({
      id: node.id,
      kind: node.kind,
      x: node.at.x,
      y: node.at.y,
      state: stateOf(node.id),
      next: node.id === next,
      started: started.includes(node.id),
      fresh: node.id === fresh,
    }),
  );
  const at = new Map(nodes.map((node) => [node.id, node]));
  const roads = map.edges.flatMap(([a, b]) => {
    const from = at.get(a);
    const to = at.get(b);
    if (!from || !to) return [];
    const travelled = from.state !== 'closed' && to.state !== 'closed';
    return [{ from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y }, travelled }];
  });
  return { nodes, roads, allDone: authored.every((id) => done.includes(id)) };
}
