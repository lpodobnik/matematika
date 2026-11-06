// Where he can go on the map, and what each node shows (stories 2.2 and 2.3; GDD, Level
// Structure). Pure: the map, what he has finished and earned, and the rooms that exist come
// in. A node shows once a room beside it is finished (room 1 from the start). It opens when
// its gate is met (tools and finished rooms, never parts: FR32) and it is a room that is
// authored. A lair opens once seen and takes him into a fight (story 3.1); the workshop
// shows but takes him nowhere until its story.

import type { LockKind, MapSpec, NodeId, NodeKind, NodeSpec } from '@/city/types';

/** The rooms that exist so far, in play order (content/rooms). */
export type Authored = readonly string[];

/** What decides the way forward: rooms finished, tools earned, rooms authored. */
export interface Reach {
  done: readonly string[];
  tools: readonly string[];
  authored: Authored;
  /** Lairs whose automaton is winding down after a win (story 3.3, ADR-13). */
  asleep?: readonly string[];
}

function neighbours(map: MapSpec, id: string): string[] {
  return map.edges.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));
}

const nodeOf = (map: MapSpec, id: string): NodeSpec | undefined =>
  map.nodes.find((node) => node.id === id);

/** Whether he can see a node: room 1, a finished room, or a node beside a finished room. */
export function nodeSeen(map: MapSpec, id: string, reach: Reach): boolean {
  if (id === reach.authored[0] || reach.done.includes(id)) return true;
  return neighbours(map, id).some((near) => reach.done.includes(near));
}

/** Whether a node's gate is met: every tool earned and every room finished; never if sealed. */
export function gateMet(node: NodeSpec, reach: Reach): boolean {
  const { gate } = node;
  if (!gate) return true;
  if (gate.sealed) return false;
  const tools = gate.tools ?? [];
  const rooms = gate.rooms ?? [];
  return (
    tools.every((tool) => reach.tools.includes(tool)) &&
    rooms.every((room) => reach.done.includes(room))
  );
}

/**
 * Whether he can travel to a node now: an authored room that is room 1, finished, or seen
 * with its gate met.
 */
export function roomOpen(map: MapSpec, id: string, reach: Reach): boolean {
  if (!reach.authored.includes(id)) return false;
  if (id === reach.authored[0] || reach.done.includes(id)) return true;
  const node = nodeOf(map, id);
  return node !== undefined && nodeSeen(map, id, reach) && gateMet(node, reach);
}

/**
 * The room to play next: the first authored room, in play order, that is open and not
 * finished. Null when every open room is finished.
 */
export function nextRoomOnMap(map: MapSpec, reach: Reach): string | null {
  return reach.authored.find((id) => !reach.done.includes(id) && roomOpen(map, id, reach)) ?? null;
}

/**
 * How a node shows:
 * - `restored`, a room he has finished, its change in colour;
 * - `open`, a room he can travel to;
 * - `locked`, seen with its gate shut, its lock showing what opens it;
 * - `seen`, seen with its gate met but taking him nowhere yet (a lair, the workshop, a room
 *   whose story comes later);
 * - `winding`, a lair whose automaton is winding down after a win, until it rewinds (story 3.3);
 * - `closed`, not seen yet: grey and still (NFR12).
 */
export type NodeState = 'restored' | 'open' | 'locked' | 'seen' | 'winding' | 'closed';

export function nodeState(map: MapSpec, node: NodeSpec, reach: Reach): NodeState {
  if (reach.done.includes(node.id)) return 'restored';
  if (roomOpen(map, node.id, reach)) return 'open';
  if (!nodeSeen(map, node.id, reach)) return 'closed';
  // A lair is open once seen (GDD, Level Structure); fights never need a tool (story 3.1).
  if (node.kind === 'lair') return reach.asleep?.includes(node.id) ? 'winding' : 'open';
  return gateMet(node, reach) ? 'seen' : 'locked';
}

export interface NodeView {
  id: NodeId;
  kind: NodeKind;
  x: number;
  y: number;
  state: NodeState;
  /** While locked: what its lock shows (a padlock when null). */
  lock: LockKind | null;
  /** While locked or seen: the plate a sealed gate shows. */
  plate: string | null;
  /** The room to play next, which pulses (once he has finished room 1). */
  next: boolean;
  /** A room he left halfway: its lines wait for him. */
  started: boolean;
  /** The room he has just restored, whose change plays as the map shows. */
  fresh: boolean;
  /** At a lair: the parts he dropped there by losing, to win back (story 3.3); else 0. */
  pile: number;
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
  /** Tools earned (`progress.tools`). */
  tools: readonly string[];
  /** Rooms he left halfway (`progress.started`). */
  started: readonly string[];
  /** The room just restored, or null. */
  fresh: string | null;
  /** Lairs winding down after a win (story 3.3). */
  asleep?: readonly string[];
  /** Parts dropped at each lair by losing there (story 3.3). */
  piles?: Readonly<Partial<Record<string, number>>>;
}

const travels = (state: NodeState) => state === 'open' || state === 'restored';

/** What the map shows. */
export function mapView(map: MapSpec, progress: MapProgress, authored: Authored): MapView {
  const { roomsDone: done, tools, started, fresh, asleep = [], piles = {} } = progress;
  const reach: Reach = { done, tools, authored, asleep };
  const next = done.length > 0 ? nextRoomOnMap(map, reach) : null;
  const nodes = map.nodes.map((node): NodeView => {
    const state = nodeState(map, node, reach);
    return {
      id: node.id,
      kind: node.kind,
      x: node.at.x,
      y: node.at.y,
      state,
      lock: state === 'locked' ? (node.lock ?? null) : null,
      plate: state === 'locked' || state === 'seen' ? (node.plate ?? null) : null,
      next: node.id === next,
      started: started.includes(node.id),
      fresh: node.id === fresh,
      pile: node.kind === 'lair' && state !== 'closed' ? (piles[node.id] ?? 0) : 0,
    };
  });
  const at = new Map(nodes.map((node) => [node.id, node]));
  const roads = map.edges.flatMap(([a, b]) => {
    const from = at.get(a);
    const to = at.get(b);
    if (!from || !to) return [];
    const travelled = travels(from.state) && travels(to.state);
    return [{ from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y }, travelled }];
  });
  return { nodes, roads, allDone: authored.every((id) => done.includes(id)) };
}
