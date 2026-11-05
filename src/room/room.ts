// Entering a room and opening its stages (architecture, Pattern 2). Pure: the store looks
// the RoomSpec up in content and hands it in.

import { assert } from '@/lib/assert';
import type { Equation } from '@/math/expr';
import { parse } from '@/math/parse';
import { tokenize } from '@/math/tokens';
import type { RoomEvent } from '@/room/events';
import { openingTemplates } from '@/room/fading';
import type { NotebookLine, RoomSpec, RoomState, StageSpec, StageState } from '@/room/types';

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

/**
 * Line 0 of the notebook: the machine's equation as pad tokens, read-only. Its verdict is
 * what the checker would say of the stage against itself: valid, with no move and no
 * progress (fixed here, so a stage arrives without being judged).
 */
export function givenLine(stage: StageSpec, machine: number): NotebookLine {
  const spec = stage.machines[machine];
  assert(spec, `the stage has no machine ${machine}`);
  const tokenized = tokenize(spec.equation);
  assert(
    tokenized.ok,
    `the machine's equation has a symbol that isn't on the pad: ${spec.equation}`,
  );
  return {
    tokens: tokenized.tokens,
    source: 'given',
    verdict: { kind: 'valid', move: { kind: 'none' }, progress: false },
  };
}

/**
 * A stage as it arrives: the first machine's equation on the pans and as the notebook's
 * line 0, an empty draft (or, with Try values `blanks`, the lines to fill), every machine
 * stopped, and the dial at its minimum, exploring.
 */
export function arriveAtStage(stage: StageSpec): StageState {
  // A locked dial (room 7) never moves; its x is decided with the find-the-mistake rules.
  const { dial } = stage;
  const dialX = dial === 'locked' ? 0 : dial.min;
  return {
    phase: 'arrive',
    machine: 0,
    lines: [givenLine(stage, 0)],
    draft: [],
    templates: openingTemplates(stage, 0),
    jam: null,
    refused: 0,
    jamsInARow: 0,
    machineProgress: stage.machines.map(() => 0),
    pans: machineEquation(stage, 0),
    actingOut: false,
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
