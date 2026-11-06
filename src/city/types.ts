// The city map's shapes (story 2.2; architecture, Data Architecture: `NodeSpec`). The map
// is data in content/map.ts; city/ decides what he can reach and what each node shows.

import type { LairId } from '@/fight/types';
import type { RoomId } from '@/room/types';

/** A node on the map: a room, an automaton's lair, the workshop, or the foundry gate. */
export type NodeId = RoomId | LairId | 'workshop' | 'foundry';

export type NodeKind = 'room' | 'lair' | 'workshop' | 'gate';

export interface NodeSpec {
  id: NodeId;
  kind: NodeKind;
  /** Its centre on the map, in map units (1600 × 1000, as the scene). */
  at: { x: number; y: number };
}

export interface MapSpec {
  nodes: readonly NodeSpec[];
  /** Roads between nodes, each once, in either direction. */
  edges: readonly (readonly [NodeId, NodeId])[];
}
