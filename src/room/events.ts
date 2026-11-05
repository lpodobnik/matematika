// The domain events room reducers return (architecture, Pattern 4). They are defined here,
// beside the code that emits them, because pure folders can't import the store; the one
// DomainEvent union in src/store/events.ts is made of these.

import type { RoomSpec } from '@/room/types';

export type RoomEvent =
  | { type: 'StageArrived'; roomId: RoomSpec['id']; stage: number }
  /** The dial landed on a new notch (audio: a tick). */
  | { type: 'DialNotch'; x: number }
  /** The dial levelled the pans (audio: a thunk). Never fired by acting out a line. */
  | { type: 'PansLevel'; roomId: RoomSpec['id']; stage: number; x: number };
