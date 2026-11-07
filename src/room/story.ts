// The story room (story 4.5; GDD, Room types: Story; room 10, the market scales). Pure.
// Moving between a story and the maths, both ways:
//
//   build    the stage opens with a story and empty pans. He writes the story as an
//            equation, the notebook's first line; the pans fill from it. The line counts
//            when it is the stage's equation as the story tells it, up to commuted terms and
//            swapped sides (`60 + 3x = 90`, `3x + 60 = 90`, `90 = 60 + 3x`), or one side
//            written out (`60 + x + x + x = 90`). An equivalent
//            line that is already a step (`3x = 30`) or the answer is refused with a tag: the
//            story first. A wrong one jams and the pans act it out, as any wrong line does.
//            Until the story is written the dial, the tray, the splitter and the chain wait.
//            The stage's own line 0 stays hidden: his line is the equation
//   choose   the stage opens with the pans, and a `story-choice` pin among a few stories,
//            each with the equation it tells. He flags the one that fits the pans and
//            confirms it; then he solves the stage
//
// The story texts are in hr.ts (`hr.stories`); their equations are in the room's data, so
// content tests check that exactly one option fits, and that the built story is the stage.

import { assert } from '@/lib/assert';
import type { Verdict } from '@/math/check';
import { type Equation, num, sameEquation } from '@/math/expr';
import { parse } from '@/math/parse';
import { currentStageSpec, machineEquation } from '@/room/room';
import type { RoomState, StageSpec, StageState, StoryKey } from '@/room/types';

/** A stage that opens with a story for him to write as its equation. */
export function buildsFromStory(spec: StageSpec): boolean {
  return spec.story?.build !== undefined;
}

/** The pans before the story is written: nothing on either. */
export const emptyPans: Equation = { left: num(0), right: num(0) };

/** Whether the stage's story is written (always, for a stage that doesn't build one). */
export function storyWritten(spec: StageSpec, stage: Pick<StageState, 'lines'>): boolean {
  return !buildsFromStory(spec) || stage.lines.length > 1;
}

/** Whether the stage in play still waits for its story to be written. */
export function storyWaits(room: RoomState): boolean {
  return !storyWritten(currentStageSpec(room), room.stage);
}

/**
 * Whether a line he entered writes the story, while it waits: the checker found it valid
 * without a move, or with the sides swapped, so it is the stage's equation as told.
 */
export function writesStory(verdict: Verdict): boolean {
  if (verdict.kind !== 'valid') return false;
  // Story 4.5 review: `60 + x + x + x = 90` is the story too, its cogs written one by one
  // (the checker calls it one side evaluated).
  return ['none', 'swap', 'evaluate'].includes(verdict.move.kind);
}

/** The story options' equations, parsed. */
function optionEquations(spec: StageSpec): Equation[] {
  return (spec.story?.options ?? []).map((option) => {
    const parsed = parse(option.equation);
    assert(parsed.ok, `a story option's equation doesn't parse: ${option.equation}`);
    return parsed.equation;
  });
}

/** The option that fits the stage's pans: the one whose equation is the stage's. */
export function rightStory(spec: StageSpec): number {
  const stage = machineEquation(spec, 0);
  return optionEquations(spec).findIndex((equation) => sameEquation(equation, stage));
}

/** What the notebook shows of a story stage. Flat, for selectors. */
export interface StoryView {
  /** The story to write (`build`), or null in a choosing stage. */
  build: StoryKey | null;
  /** Whether the built story is written. */
  written: boolean;
  /** The stories to choose from, or none in a building stage. */
  options: StoryKey[];
  /** The story-choice pin: offered now, the option it is on, and whether confirming does something. */
  asks: boolean;
  at: number | null;
  confirmable: boolean;
  /** Once the pin is tested: the option that fits. */
  right: number | null;
}

/** The story as the notebook shows it, or null outside a story stage. */
export function storyView(room: RoomState | null): StoryView | null {
  if (!room) return null;
  const spec = currentStageSpec(room);
  if (!spec.story) return null;
  const { stage } = room;
  const offered =
    (stage.phase === 'poke' || stage.phase === 'pin') && !(stage.pin?.locked ?? false);
  const choosing = spec.pin?.kind === 'story-choice';
  const at = stage.pin?.value.kind === 'choice' ? stage.pin.value.index : null;
  return {
    build: spec.story.build ?? null,
    written: storyWritten(spec, stage),
    options: (spec.story.options ?? []).map((option) => option.key),
    asks: choosing && offered,
    at,
    confirmable: choosing && offered && stage.phase === 'pin' && at !== null,
    right: choosing && stage.pin?.locked ? rightStory(spec) : null,
  };
}
