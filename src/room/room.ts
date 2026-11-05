// Entering a room and opening its stages (architecture, Pattern 2). Pure: the store looks
// the RoomSpec up in content and hands it in.

import { assert } from '@/lib/assert';
import type { Equation } from '@/math/expr';
import { parse } from '@/math/parse';
import type { RoomEvent } from '@/room/events';
import type { RoomSpec, RoomState, StageSpec, StageState } from '@/room/types';

export interface RoomStep {
  room: RoomState;
  events: RoomEvent[];
}

/** A machine's equation. Content tests check that every room's equations parse. */
export function machineEquation(stage: StageSpec, machine: number): Equation {
  const spec = stage.machines[machine];
  assert(spec, `the stage has no machine ${machine}`);
  const parsed = parse(spec.equation);
  assert(parsed.ok, `the machine's equation doesn't parse: ${spec.equation}`);
  return parsed.equation;
}

/** A stage as it arrives: the first machine's equation on the pans, the dial at its minimum. */
export function arriveAtStage(stage: StageSpec): StageState {
  // A locked dial (room 7) never moves; its x is decided with the find-the-mistake rules.
  const { dial } = stage;
  const dialX = dial === 'locked' ? 0 : dial.min;
  return {
    phase: 'arrive',
    machine: 0,
    pans: machineEquation(stage, 0),
    dialX,
    // The whole range for now; story 1.9 narrows it to the poke window.
    dialOpen: dial === 'locked' ? { min: dialX, max: dialX } : { min: dial.min, max: dial.max },
  };
}

/** Enters a room at its first stage. */
export function enterRoom(spec: RoomSpec): RoomStep {
  const first = spec.stages[0];
  assert(first, `room ${spec.id} has no stages`);
  return {
    room: { spec, stageIndex: 0, stage: arriveAtStage(first) },
    events: [{ type: 'StageArrived', roomId: spec.id, stage: 0 }],
  };
}

/** The spec of the stage in play. */
export function currentStageSpec(room: RoomState): StageSpec {
  const stage = room.spec.stages[room.stageIndex];
  assert(stage, `room ${room.spec.id} has no stage ${room.stageIndex}`);
  return stage;
}
