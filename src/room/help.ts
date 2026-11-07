// The help ladder (story 2.7, FR33; GDD, Player Assistance; architecture Pattern 2, Hints).
// Pure: help climbs one level each time `tuning.hintIdleMs` passes without an action of his,
// and each time the machine jams `tuning.helpJams` times in a row; a line that moves him on
// (or a new stage) takes it back to none. It is free and never recorded: it lives in the
// stage, fires no event and is not saved.
//
//   1  the current step's tag (stories 1.15, 1.16), with the wiggles those stories give
//   2  the next move, as the hint button's second press shows it
//   3  for a move on the machine (the tray, the splitter), the line it writes, with blanks
//   4  the same kind of equation with other numbers, solved line by line

import { tuning } from '@/config/tuning';
import { stageSolution } from '@/math/check';
import { add, type Equation, hasX, num, xVar } from '@/math/expr';
import { toLinear, valueAt } from '@/math/linear';
import * as q from '@/math/rational';
import { canonicalSolution } from '@/math/steps';
import { wayOf } from '@/room/hint';
import { lineProgress } from '@/room/notebook';
import { currentStageSpec, machineEquation } from '@/room/room';
import { trayHasGear } from '@/room/tray';
import type { HintLevel, RoomState, ToolId } from '@/room/types';

/** Help one level up, to 4 at most. */
function climb(room: RoomState, now: number): RoomState {
  const { stage } = room;
  const help = Math.min(4, stage.help + 1) as HintLevel;
  return { ...room, stage: { ...stage, help, helpAt: now } };
}

/**
 * The help after an action. `canHelp` says whether there is a step to show now (the hint
 * button works): help climbs only then, as nothing would show otherwise.
 */
export function withHelp(
  before: RoomState | null,
  room: RoomState,
  tick: boolean,
  now: number,
  canHelp: boolean,
): RoomState {
  const { stage } = room;
  const sameStage =
    before !== null && before.spec.id === room.spec.id && before.stageIndex === room.stageIndex;
  if (!sameStage) return room;
  // A line that moves him on: help goes back to none. A valid line that doesn't (a tray
  // move that adds and takes the same) leaves it, so poking about while stuck keeps it.
  const added = stage.lines.slice(before.stage.lines.length);
  if (added.some((line) => lineProgress(line.verdict))) {
    if (stage.help === 0 && stage.helpAt === null) return room;
    return { ...room, stage: { ...stage, help: 0, helpAt: null } };
  }
  if (!canHelp) return room;
  const jammedAgain = stage.jamsInARow > before.stage.jamsInARow;
  if (jammedAgain && stage.jamsInARow % tuning.helpJams === 0) return climb(room, now);
  if (!tick || stage.lastActionAt === null) return room;
  const since = Math.max(stage.lastActionAt, stage.helpAt ?? Number.NEGATIVE_INFINITY);
  return now - since >= tuning.hintIdleMs ? climb(room, now) : room;
}

/**
 * A compare stage's example (room 6, story 2.9 review): `x + a = b + c` with smaller
 * numbers, solved by comparing, as the room asks: b is (b − a) more than a, so x is c plus
 * that (`x + 36 = 38 + 17`, `x = 17 + 2`, `x = 19`, then the check line). Null for any
 * other shape.
 */
function comparedExample(stage: Equation): Equation[] | null {
  const { left, right } = stage;
  if (left.k !== 'add' || left.l.k !== 'x' || left.r.k !== 'num') return null;
  if (right.k !== 'add' || right.l.k !== 'num' || right.r.k !== 'num') return null;
  const [a, b, c] = [left.r.v - 20, right.l.v - 20, right.r.v - 10];
  if (a <= 0 || b <= 0 || c <= 0 || b <= a) return null;
  const example: Equation = { left: add(xVar(), num(a)), right: add(num(b), num(c)) };
  const x = c + (b - a);
  return [
    example,
    { left: xVar(), right: add(num(c), num(b - a)) },
    { left: xVar(), right: num(x) },
    { left: add(num(x), num(a)), right: add(num(b), num(c)) },
  ];
}

/** The solutions a worked example may take: small, and never the stage's own. */
const exampleSolutions = [3, 4, 2, 5, 6, 7, 8, 9, 10, 12, 15, 20];

/**
 * Level 4: the stage's kind of equation with other numbers, solved the way the stage is,
 * line by line from the equation to the check line. The left side keeps its shape, and the
 * right side takes the left's value at a new, small solution. Null for a stage with x on
 * the right, or where no small whole-number example exists.
 */
export function workedExample(room: RoomState, tools: readonly ToolId[]): Equation[] | null {
  const spec = currentStageSpec(room);
  const stage = machineEquation(spec, room.stage.machine);
  if (spec.type === 'compare') return comparedExample(stage);
  if (hasX(stage.right) || !hasX(stage.left)) return null;
  const left = toLinear(stage.left);
  if (left.kind !== 'linear') return null;
  const own = stageSolution(stage);
  const way = wayOf(room, tools, own) ?? 'try';
  for (const x of exampleSolutions) {
    if (x === own) continue;
    const value = valueAt(left, q.rational(x));
    if (!q.isInteger(value) || value.n <= 0n || value.n > 99n) continue;
    const example: Equation = { left: stage.left, right: num(Number(value.n)) };
    const lines = canonicalSolution(example, way, { trayGear: trayHasGear(spec) });
    if (lines) return [example, ...lines];
  }
  return null;
}
