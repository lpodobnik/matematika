// The city map's shapes (story 2.2; architecture, Data Architecture: `NodeSpec`). The map
// is data in content/map.ts; city/ decides what he can reach and what each node shows.

import type { LairId } from '@/fight/types';
import type { RoomId, ToolId } from '@/room/types';

/** A node on the map: a room, an automaton's lair, the workshop, or the foundry gate. */
export type NodeId = RoomId | LairId | 'workshop' | 'foundry';

export type NodeKind = 'room' | 'lair' | 'workshop' | 'gate';

/**
 * What opens a node (story 2.3; GDD, Level Structure): tools earned and rooms finished,
 * never parts (FR32). A sealed node never opens in the MVP (the foundry gate, FR30).
 */
export interface Gate {
  tools?: readonly ToolId[];
  rooms?: readonly RoomId[];
  sealed?: boolean;
}

/**
 * What a locked node shows it is waiting for: Balance's weights, the gear chain, the
 * recording drum, or the foundry's plate.
 */
export type LockKind = 'weights' | 'chain' | 'drum' | 'plate';

export interface NodeSpec {
  id: NodeId;
  kind: NodeKind;
  /** Its centre on the map, in map units (1600 × 1000, as the scene). */
  at: { x: number; y: number };
  /** What opens it; none means a road to a finished room is enough. */
  gate?: Gate;
  /** What its lock shows while the gate is shut; a plain padlock when none. */
  lock?: LockKind;
  /** The plate a sealed gate shows (the foundry: `5 · x = 40`). */
  plate?: string;
}

export interface MapSpec {
  nodes: readonly NodeSpec[];
  /** Roads between nodes, each once, in either direction. */
  edges: readonly (readonly [NodeId, NodeId])[];
}
