// The notebook (architecture Pattern 1, two layers; Pattern 2, jams). Pure: what the pad's
// keys do to the draft line, and what enter does with it. `lines` holds committed lines
// only, with the stage equation as line 0; a wrong line is never in `lines`. Its tokens stay
// in the draft, marked as jammed, and any edit clears the jam. There is no caret: delete
// takes the last token.

import { tuning } from '@/config/tuning';
import { assert } from '@/lib/assert';
import { check, type Verdict } from '@/math/check';
import type { Equation } from '@/math/expr';
import { formatTokens } from '@/math/format';
import { parse } from '@/math/parse';
import type { Token } from '@/math/tokens';
import type { RoomEvent } from '@/room/events';
import type { NotebookLine, Phase, RoomState, StageState } from '@/room/types';

/** A key on the number pad, or its stand-in on a computer keyboard. */
export type NotebookKey = Token | 'delete' | 'enter';

/**
 * Phases in which he writes (Pattern 2). The notebook is off in `poke` and `pin` (story
 * 1.9) and once the stage locks. `arrive` is here until story 1.8 ends it on his first
 * touch on the machine, as the dial does.
 */
const writingPhases: ReadonlySet<Phase> = new Set<Phase>(['arrive', 'open']);

/** The check line is always the last line (Pattern 1, checker rule 4). */
function endsWithCheck(stage: StageState): boolean {
  return stage.lines[stage.lines.length - 1]?.verdict.kind === 'check';
}

/** Whether the notebook takes keys now: a writing phase, before the check line. */
export function notebookWrites(stage: StageState): boolean {
  return writingPhases.has(stage.phase) && !endsWithCheck(stage);
}

/** Lines the checker refuses with a wiggle, not a jam: they stay in the draft unmarked. */
export function isRefused(verdict: Verdict): boolean {
  return verdict.kind === 'incomplete' || verdict.kind === 'nonlinear' || verdict.kind === 'aside';
}

/** Lines that are committed to `lines`, read-only. */
export function isCommitted(verdict: Verdict): boolean {
  return verdict.kind === 'valid' || verdict.kind === 'answer' || verdict.kind === 'check';
}

/** The committed lines as equations, for the checker. Every one parsed when it was committed. */
export function committedEquations(lines: readonly NotebookLine[]): Equation[] {
  return lines.map((line) => {
    const parsed = parse(line.tokens);
    assert(parsed.ok, `a committed line doesn't parse: ${formatTokens(line.tokens)}`);
    return parsed.equation;
  });
}

export interface NotebookStep {
  room: RoomState;
  events: RoomEvent[];
}

export interface EnterStep extends NotebookStep {
  verdict: Verdict;
}

function withStage(room: RoomState, stage: StageState): RoomState {
  return { ...room, stage };
}

/**
 * Types one pad token at the end of the draft (`notebook/type`). Any edit clears a line
 * jam. Null, so the action is ignored, when the notebook is off or the draft is full.
 */
export function typeToken(room: RoomState, token: Token): NotebookStep | null {
  const { stage } = room;
  if (!notebookWrites(stage) || stage.draft.length >= tuning.draftMaxTokens) return null;
  const jam = stage.jam?.kind === 'line' ? null : stage.jam;
  return { room: withStage(room, { ...stage, draft: [...stage.draft, token], jam }), events: [] };
}

/**
 * Deletes the draft's last token (`notebook/delete`), never a committed line. Any edit
 * clears a line jam. Null when the notebook is off or the draft is empty.
 */
export function deleteToken(room: RoomState): NotebookStep | null {
  const { stage } = room;
  if (!notebookWrites(stage) || stage.draft.length === 0) return null;
  const jam = stage.jam?.kind === 'line' ? null : stage.jam;
  return { room: withStage(room, { ...stage, draft: stage.draft.slice(0, -1), jam }), events: [] };
}

/**
 * Judges the draft (`notebook/enter`, story 1.3's checker):
 * - `incomplete`, `nonlinear`, `aside`: refused; the draft stays and `refused` counts up,
 *   so the notebook wiggles.
 * - `wrong`: the draft stays, marked as wrong by a line jam (story 1.7 acts it out).
 * - `valid`, `answer`, `check`: appended to `lines`, read-only, and the draft empties.
 * Null when the notebook is off, or while a line jam is set (only an edit clears it).
 */
export function enterLine(room: RoomState): EnterStep | null {
  const { stage } = room;
  if (!notebookWrites(stage) || stage.jam !== null) return null;
  const verdict = check(committedEquations(stage.lines), stage.draft);
  const at = { roomId: room.spec.id, stage: room.stageIndex };
  if (isRefused(verdict)) {
    return { room: withStage(room, { ...stage, refused: stage.refused + 1 }), events: [], verdict };
  }
  if (verdict.kind === 'wrong') {
    const events: RoomEvent[] = [{ type: 'LineWrong', ...at, line: formatTokens(stage.draft) }];
    return { room: withStage(room, { ...stage, jam: { kind: 'line' } }), events, verdict };
  }
  const line: NotebookLine = { tokens: stage.draft, source: 'typed', verdict };
  const progress = verdict.kind === 'valid' ? verdict.progress : true;
  const events: RoomEvent[] = [{ type: 'LineAccepted', ...at, source: 'typed', progress }];
  const next = { ...stage, lines: [...stage.lines, line], draft: [] };
  return { room: withStage(room, next), events, verdict };
}

/** A committed line ready to show: its number (0 is the stage equation) and its text. */
export interface LineDisplay {
  number: number;
  text: string;
  source: NotebookLine['source'];
}

/** The committed lines in school notation, line 0 first. */
export function lineDisplays(lines: readonly NotebookLine[]): LineDisplay[] {
  return lines.map((line, number) => ({
    number,
    text: formatTokens(line.tokens),
    source: line.source,
  }));
}
