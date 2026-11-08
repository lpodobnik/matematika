// The gear chain on the machine (story 4.1; GDD, Three ways to solve: Undo; architecture,
// The gear chain). Pure: when the chain works, what it shows, and what running a link
// backward does to the stage. The chain is a view of the pans (`math/chain.ts`): it shows
// whenever x is there once, on one side, against a number.
//
//   offered   in an open stage whose ways list Undo, once the gear chain is earned (room 7)
//   works     offered, not jammed, with no line half-written and no blank waiting, and a
//             link left to undo
//   a run     he picks an operation and a number for the last link. The right one is its
//             inverse: the pans take the result, still weighed at the slider's x, and the
//             link goes dark (`undoneLinks`). With Undo `auto` the move is written, then its
//             result, both from `undo` (`4x = 41 − 9`, `4x = 32`); a result `x = n` is left
//             for him, and once x is alone he gets `x = ☐` and the check line as blanks. With
//             `blanks` the move is written and the result comes as a blank (`4x = ☐`), and
//             after `x = ☐` the check line. With `blank` the pans move and nothing is written
//   wrong     a wrong choice is written into the draft as its move (`4x = 41 + 9`), acted out
//             on the pans, tipped, and the machine jams, exactly like a wrong line: he takes
//             it back with delete (architecture: "it jams exactly like a wrong line")

import { type Chain, chainOf, type Link, lastLink, undoLast, undoneLinks } from '@/math/chain';
import { isAnswerLine, stageSolution } from '@/math/check';
import type { Equation, Expr } from '@/math/expr';
import { formatEquation, formatExpr } from '@/math/format';
import { solve } from '@/math/linear';
import { BLANK, type LineToken, tokenize } from '@/math/tokens';
import type { RoomEvent } from '@/room/events';
import { answerTemplate, checkTemplate, offeredByLevel, withLastLines } from '@/room/fading';
import { writeWayLine } from '@/room/notebook';
import { currentStageSpec, machineEquation, type RoomStep } from '@/room/room';
import { storyWaits } from '@/room/story';
import type { FadingMode, RoomState, StageSpec, StageState, ToolId } from '@/room/types';

/** The stage's Undo line mode; a stage that lists none writes nothing for Undo. */
export function undoFading(stage: StageSpec): FadingMode {
  return stage.fading.undo ?? 'blank';
}

/** Whether the chain shows: an open stage whose ways list Undo, with the chain earned. */
export function chainOffered(room: RoomState, tools: readonly ToolId[]): boolean {
  return (
    tools.includes('chain') &&
    room.stage.phase === 'open' &&
    currentStageSpec(room).ways.includes('undo') &&
    !storyWaits(room)
  );
}

/** The pans as a chain, or null when they aren't one (x on both sides, or a sum left). */
export function pansChain(room: RoomState): Chain | null {
  return chainOf(room.stage.pans);
}

/**
 * Whether a run does anything now: the chain is offered, the machine isn't jammed, no line
 * is half-written or waiting for a blank, nothing tapped is on the scale, the check line
 * isn't written, and the pans' chain has a link left.
 */
export function chainWorks(room: RoomState, tools: readonly ToolId[]): boolean {
  if (!chainOffered(room, tools)) return false;
  const { stage } = room;
  if (stage.jam !== null || stage.draft.length > 0) return false;
  if (stage.templates.length > 0 && !offeredByLevel(stage)) return false;
  if (stage.shownLine !== null) return false;
  if (stage.lines.some((line) => line.verdict.kind === 'check')) return false;
  const chain = pansChain(room);
  return chain !== null && lastLink(chain) !== null;
}

function withStage(room: RoomState, stage: StageState): RoomState {
  return { ...room, stage };
}

function tokensOf(line: Equation) {
  const tokenized = tokenize(formatEquation(line));
  if (!tokenized.ok) throw new Error(`not in pad tokens: ${formatEquation(line)}`);
  return tokenized.tokens;
}

/** `4x = ☐`: the result's x side, with its number left blank, on the side it is on. */
function resultTemplate(result: Equation, xOnLeft: boolean): LineToken[] {
  const xSide: Expr = xOnLeft ? result.left : result.right;
  const tokenized = tokenize(formatExpr(xSide));
  if (!tokenized.ok) throw new Error(`not in pad tokens: ${formatExpr(xSide)}`);
  return xOnLeft ? [...tokenized.tokens, '=', BLANK] : [BLANK, '=', ...tokenized.tokens];
}

/**
 * The stage after a right run, by the stage's Undo line mode (see the head of this file).
 * Each written line goes through the checker like any line, against the lines before the
 * run, so the move and its result are one step.
 */
function ranRight(
  room: RoomState,
  line: Equation,
  result: Equation,
  xOnLeft: boolean,
  events: RoomEvent[],
): StageState {
  const { stage } = room;
  const spec = currentStageSpec(room);
  const at = { roomId: room.spec.id, stage: room.stageIndex };
  const mode = undoFading(spec);
  const n = stageSolution(machineEquation(spec, stage.machine));
  let next: StageState = stage;
  const write = (lines: Equation[]) => {
    for (const each of lines) {
      const written = writeWayLine(next, each, 'undo', stage.lines);
      if (!written) break;
      next = written.stage;
      events.push({ type: 'LineAccepted', ...at, source: 'undo', progress: written.progress });
    }
  };
  if (mode === 'auto') {
    write(isAnswerLine(result, n) ? [line] : [line, result]);
    return withLastLines(spec, { ...next, pans: result });
  }
  if (mode === 'blanks') {
    write([line]);
    const templates = isAnswerLine(result, n)
      ? [[...answerTemplate], checkTemplate(spec, stage.machine)]
      : [resultTemplate(result, xOnLeft)];
    return { ...next, pans: result, templates, draft: [] };
  }
  return withLastLines(spec, { ...next, pans: result, shownLine: null });
}

/**
 * Runs the last link of the pans' chain backward with his choice (`chain/run`). A right
 * choice moves the stage on (`ranRight`) and fires `WayUsed`; a wrong one, or a right one
 * whose result isn't a whole number a line may hold, is written into the draft and jams
 * like a wrong line (`LineWrong`, `MachineJammed`). Null, so nothing happens, when the
 * chain doesn't work now (`chainWorks`) or the choice can't be written.
 */
export function runLink(room: RoomState, tools: readonly ToolId[], choice: Link): RoomStep | null {
  if (!chainWorks(room, tools)) return null;
  const chain = pansChain(room);
  const undo = chain ? undoLast(room.stage.pans, choice) : null;
  if (!chain || !undo) return null;
  const at = { roomId: room.spec.id, stage: room.stageIndex };
  if (undo.right && undo.result) {
    const events: RoomEvent[] = [{ type: 'WayUsed', ...at, way: 'undo' }];
    const stage = ranRight(room, undo.line, undo.result, chain.xOnLeft, events);
    return { room: withStage(room, stage), events };
  }
  // A move that divides by zero isn't a line he could write: refused, as enter refuses it.
  if (solve(undo.line).kind === 'division-by-zero') return null;
  const tokens = tokensOf(undo.line);
  const jammed: StageState = {
    ...room.stage,
    draft: tokens,
    jam: { kind: 'line', back: room.stage.pans },
    jamsInARow: room.stage.jamsInARow + 1,
    refusal: null,
  };
  const events: RoomEvent[] = [
    { type: 'LineWrong', ...at, line: formatEquation(undo.line) },
    { type: 'MachineJammed', roomId: room.spec.id, kind: 'line' },
  ];
  return { room: withStage(room, jammed), events };
}

/**
 * The blanks a chain run leaves with Undo `blanks` (`ranRight`), worked out again from the
 * lines and the pans, for a room resumed after a reload (story 4.1 review): after a run's
 * move, its result as a blank, or `x = ☐` and the check line once x is alone; after his
 * answer that followed a run, the check line. The same stage otherwise.
 */
export function undoBlanksAfter(spec: StageSpec, stage: StageState): StageState {
  if (undoFading(spec) !== 'blanks' || stage.templates.length > 0) return stage;
  const [before, last] = stage.lines.slice(-2);
  if (!last) return stage;
  const n = stageSolution(machineEquation(spec, stage.machine));
  if (last.source === 'undo') {
    const chain = chainOf(stage.pans);
    if (!chain) return stage;
    const templates = isAnswerLine(stage.pans, n)
      ? [[...answerTemplate], checkTemplate(spec, stage.machine)]
      : [resultTemplate(stage.pans, chain.xOnLeft)];
    return { ...stage, templates, draft: [] };
  }
  if (last.verdict.kind === 'answer' && before?.source === 'undo') {
    return { ...stage, templates: [checkTemplate(spec, stage.machine)], draft: [] };
  }
  return stage;
}

/**
 * A chain run's result waits as a blank (Undo `blanks`, `4x = ☐`; story 4.1 review): the
 * hint points at it, and the tray and splitter wait for it (story 4.2 review).
 */
export function chainBlankWaits(room: RoomState): boolean {
  const { stage } = room;
  if (stage.templates.length === 0) return false;
  if (undoFading(currentStageSpec(room)) !== 'blanks') return false;
  return stage.lines[stage.lines.length - 1]?.source === 'undo';
}

/**
 * The room with its last lines' blanks up to date after any step, so a slider that levels
 * the pans offers `x = ☐` at once, and takes it back when it moves on. Not over what he is
 * typing, a jam, the logbook's own lines or a blank a chain run left.
 */
export function withBlanksUpToDate(room: RoomState): RoomState {
  const { stage } = room;
  if (stage.jam !== null || stage.draft.length > 0 || stage.planted !== null) return room;
  if (chainBlankWaits(room) || storyWaits(room)) return room;
  const next = withLastLines(currentStageSpec(room), stage);
  return next === stage ? room : { ...room, stage: next };
}

/** One link as the strip draws it. */
export interface LinkView extends Link {
  /** Undone in this stage: dark. */
  dark: boolean;
}

/** What the chain strip shows. Flat, for selectors. */
export interface ChainView {
  /** The links from x outward, the live ones first, then the dark ones; null when the pans aren't a chain. */
  links: LinkView[] | null;
  /** The number the live links reach. */
  output: number | null;
  /** Which link he can tap now (the last live one), or null. */
  tappable: number | null;
}

/**
 * The strip, or null when the chain isn't offered. The live links are the pans' chain; the
 * dark ones are the stage's links already undone, so `x → ·2 → +7 → 25` reads
 * `x → ·2 → (+7) → 18` after one run.
 */
export function chainView(room: RoomState | null, tools: readonly ToolId[]): ChainView | null {
  if (!room || !chainOffered(room, tools)) return null;
  const chain = pansChain(room);
  if (!chain) return { links: null, output: null, tappable: null };
  const stageEquation = machineEquation(currentStageSpec(room), room.stage.machine);
  const dark = undoneLinks(stageEquation, room.stage.pans);
  const links: LinkView[] = [
    ...chain.links.map((link) => ({ ...link, dark: false })),
    ...dark.map((link) => ({ ...link, dark: true })),
  ];
  const tappable = chainWorks(room, tools) ? chain.links.length - 1 : null;
  return { links, output: chain.output, tappable };
}
