// The notebook (architecture Pattern 1, two layers and fading; Pattern 2, jams). Pure: what
// the pad's keys do to the draft line, and what enter does with it. `lines` holds committed
// lines only, with the stage equation as line 0; a wrong line is never in `lines`. Its
// tokens stay in the draft, marked as jammed, and any edit clears the jam. There is no
// caret: delete takes the last token, or, while he fills a blank, clears the blank.
//
// Writing drives the machine (story 1.7): a committed line is acted out on the pans and
// moves the machine; a wrong one is acted out, tips the pans and jams the machine; the
// check line locks it. The pans are weighed at the slider's x throughout (story 1.16).
//
// Simplify first (story 1.16): in a stage Try values can't finish (room 4), the answer line
// `x = n`, and any line that would leave x alone (`x = 3 · 3`), is refused until the pans
// are simplified, by Balance or by lines he typed: one pan holding only x, the other a
// single number (`answerAllowed`; room/pieces.ts). The refusal is like an incomplete
// line's, with a tag (`refusal`), which his next action takes down.

import { tuning } from '@/config/tuning';
import { assert } from '@/lib/assert';
import { check, type Verdict } from '@/math/check';
import { type Equation, maxNumber } from '@/math/expr';
import { formatEquation, formatLine, formatTokens, type LineSegment } from '@/math/format';
import { parse } from '@/math/parse';
import { fillBlanks, isDigit, type Token, tokenize } from '@/math/tokens';
import type { RoomEvent } from '@/room/events';
import { withLastLines } from '@/room/fading';
import { progressAfter } from '@/room/machine';
import { simplified, xAlone } from '@/room/pieces';
import { resolvePin } from '@/room/pin';
import { currentStageSpec } from '@/room/room';
import type {
  NotebookLine,
  Phase,
  Refusal,
  RoomState,
  StageSpec,
  StageState,
  WayId,
} from '@/room/types';

/** A key on the number pad, or its stand-in on a computer keyboard. */
export type NotebookKey = Token | 'delete' | 'enter';

/**
 * Phases in which he writes (Pattern 2): only `open`. The notebook is off while the stage
 * waits in `arrive` for his first touch on the machine, in `poke` and `pin`, until he
 * confirms the pin, and once the stage locks.
 */
const writingPhases: ReadonlySet<Phase> = new Set<Phase>(['open']);

/** The check line is always the last line (Pattern 1, checker rule 4). */
function endsWithCheck(stage: StageState): boolean {
  return stage.lines[stage.lines.length - 1]?.verdict.kind === 'check';
}

/** Whether the notebook takes keys now: a writing phase, before the check line. */
export function notebookWrites(stage: StageState): boolean {
  return writingPhases.has(stage.phase) && !endsWithCheck(stage);
}

/** Whether the draft fills a blank (Fading, `blanks`) rather than being written freely. */
export function fillsBlank(stage: StageState): boolean {
  return stage.templates.length > 0;
}

/** A blank holds a number, at most as many digits as the largest number literal. */
export const blankMaxDigits = String(maxNumber).length;

/**
 * Whether a key does anything now: none while the notebook is off; while he fills a
 * blank, only digits, delete and enter ("pad input fills only the current blank").
 */
export function keyWorks(key: NotebookKey, writes: boolean, blank: boolean): boolean {
  if (!writes) return false;
  if (!blank || key === 'delete' || key === 'enter') return true;
  return isDigit(key);
}

/** Lines the checker refuses with a wiggle, not a jam: they stay in the draft unmarked. */
export function isRefused(verdict: Verdict): boolean {
  return verdict.kind === 'incomplete' || verdict.kind === 'nonlinear' || verdict.kind === 'aside';
}

/** Lines that are committed to `lines`, read-only. */
export function isCommitted(verdict: Verdict): boolean {
  return verdict.kind === 'valid' || verdict.kind === 'answer' || verdict.kind === 'check';
}

/**
 * Whether the answer line `x = n`, or any line that leaves x alone, may be written now,
 * typed or filled into a blank (story 1.16, simplify first): always in a stage Try values
 * can finish; otherwise only once the pans are simplified (room/pieces.ts, `simplified`),
 * where the last committed line or Balance's moves left them.
 */
export function answerAllowed(stage: StageSpec, pans: Equation): boolean {
  return stage.ways.includes('try') || simplified(pans);
}

/**
 * The refusal whose tag shows now, or null (story 1.16): the last enter's, while its reason
 * still holds, so `simplify` goes as soon as the pans are simplified, by a Balance move too.
 */
export function refusalView(room: RoomState | null): Refusal | null {
  if (!room || room.stage.refusal === null) return null;
  return answerAllowed(currentStageSpec(room), room.stage.pans) ? null : room.stage.refusal;
}

/**
 * The room with the refusal's tag taken down (story 1.16 review): it stays up only until
 * his next action, so only one tag shows (the scene's tags wait while it does). An edit
 * and enter set or clear it here; the root reducer calls this for any other action of his
 * that does something to the room. The same room when there is no refusal.
 */
export function withoutRefusal(room: RoomState): RoomState {
  if (room.stage.refusal === null) return room;
  return { ...room, stage: { ...room.stage, refusal: null } };
}

function equationOf(tokens: readonly Token[], what: string): Equation {
  const parsed = parse(tokens);
  assert(parsed.ok, `${what} doesn't parse: ${formatTokens(tokens)}`);
  return parsed.equation;
}

/** The committed lines as equations, for the checker. Every one parsed when it was committed. */
export function committedEquations(lines: readonly NotebookLine[]): Equation[] {
  return lines.map((line) => equationOf(line.tokens, 'a committed line'));
}

/** The last committed line (line 0, the stage equation, before he writes any). */
export function lastCommitted(stage: StageState): Equation {
  const line = stage.lines[stage.lines.length - 1];
  assert(line, 'a stage always has line 0');
  return equationOf(line.tokens, 'a committed line');
}

/** The whole line the draft stands for: its template with the blank filled, or the draft. */
export function lineTokens(stage: StageState): Token[] {
  const [template] = stage.templates;
  return template ? fillBlanks(template, stage.draft) : [...stage.draft];
}

/**
 * The wrong line the machine acts out while it is jammed on it, or null. The draft can't
 * change without clearing the jam, so it is still the line that was judged wrong.
 */
export function jammedLine(stage: StageState): Equation | null {
  if (stage.jam?.kind !== 'line') return null;
  return equationOf(lineTokens(stage), 'a jammed line');
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
 * The stage after an edit to the draft: any edit clears a line jam and returns the pans to
 * the last committed line (Pattern 1, two layers), and clears a refusal's tag (story 1.16).
 */
function edited(stage: StageState, draft: Token[]): StageState {
  if (stage.jam?.kind !== 'line') return { ...stage, draft, refusal: null };
  return { ...stage, draft, refusal: null, jam: null, pans: lastCommitted(stage) };
}

/**
 * Types one pad token at the end of the draft (`notebook/type`). While he fills a blank,
 * only digits go in, up to `blankMaxDigits`. Null, so the action is ignored, when the
 * notebook is off, the key does nothing here, or the draft is full.
 */
export function typeToken(room: RoomState, token: Token): NotebookStep | null {
  const { stage } = room;
  const blank = fillsBlank(stage);
  if (!keyWorks(token, notebookWrites(stage), blank)) return null;
  const limit = blank ? blankMaxDigits : tuning.draftMaxTokens;
  if (stage.draft.length >= limit) return null;
  return { room: withStage(room, edited(stage, [...stage.draft, token])), events: [] };
}

/**
 * Deletes the draft's last token (`notebook/delete`), never a committed line; while he
 * fills a blank, it clears the blank, never the template's own text. Null when the
 * notebook is off or there is nothing to delete.
 */
export function deleteToken(room: RoomState): NotebookStep | null {
  const { stage } = room;
  if (!notebookWrites(stage) || stage.draft.length === 0) return null;
  const draft = fillsBlank(stage) ? [] : stage.draft.slice(0, -1);
  return { room: withStage(room, edited(stage, draft)), events: [] };
}

function progressFor(stage: StageState, verdict: Verdict): number[] {
  return stage.machineProgress.map((progress, machine) =>
    machine === stage.machine ? progressAfter(progress, verdict) : progress,
  );
}

/**
 * The stage with a correct line committed, however it was written (typed, or by a way on
 * the machine): the line joins `lines`, read-only; the machine moves on by its verdict;
 * `jamsInARow` resets; and the pans take the line's layout. What else changes (the draft,
 * the blanks, the lock) is up to the caller.
 */
export function commitLine(
  stage: StageState,
  tokens: Token[],
  source: NotebookLine['source'],
  verdict: Verdict,
): StageState {
  assert(isCommitted(verdict), `a ${verdict.kind} line is never committed`);
  return {
    ...stage,
    lines: [...stage.lines, { tokens, source, verdict }],
    jamsInARow: 0,
    machineProgress: progressFor(stage, verdict),
    pans: equationOf(tokens, 'a committed line'),
    // A written line takes a tapped line off the scale (story 2.10).
    shownLine: null,
  };
}

/** Whether the progress a committed line reports moves the machine (`LineAccepted.progress`). */
export function lineProgress(verdict: Verdict): boolean {
  return verdict.kind === 'valid' ? verdict.progress : true;
}

/** A line a way on the machine wrote, and whether it moves the machine. */
export interface WayLine {
  stage: StageState;
  progress: boolean;
}

/**
 * A line a way on the machine writes for him (Balance `auto`; story 1.15 writes the move,
 * then its result): judged like a typed line, and committed only if it is valid, never as
 * the answer or check line, which he writes himself. It is judged against `judgedAgainst`,
 * the committed lines unless the caller says otherwise: a Balance move judges its result
 * against the lines before the move, so the move and its result count as one step. The
 * pans take its layout, as for any line. Null when the checker wouldn't commit it as a
 * valid line, so it is never written.
 */
export function writeWayLine(
  stage: StageState,
  line: Equation,
  source: WayId,
  judgedAgainst: readonly NotebookLine[] = stage.lines,
): WayLine | null {
  const tokenized = tokenize(formatEquation(line));
  assert(tokenized.ok, `the line isn't in pad tokens: ${formatEquation(line)}`);
  const verdict = check(committedEquations(judgedAgainst), tokenized.tokens);
  if (verdict.kind !== 'valid') return null;
  return {
    stage: commitLine(stage, tokenized.tokens, source, verdict),
    progress: verdict.progress,
  };
}

/**
 * A line that would leave x alone on the pans (room/pieces.ts, `xAlone`): the answer line,
 * or a valid line such as `x = 3 · 3`, `x = 18 : 2` or `x = 9 + 0` (story 1.16 review).
 */
function leavesXAlone(verdict: Verdict, tokens: readonly Token[]): boolean {
  if (verdict.kind === 'answer') return true;
  return verdict.kind === 'valid' && xAlone(equationOf(tokens, 'a valid line'));
}

/**
 * Whether the line is refused with a wiggle, not stored, and with which tag: none for what
 * the checker refuses (`isRefused`); `simplify` for a line that would leave x alone (the
 * answer line, or `x = 3 · 3`) before the pans are simplified, in a stage Try values can't
 * finish (story 1.16). Null when it isn't refused.
 */
function refusalOf(
  room: RoomState,
  verdict: Verdict,
  tokens: readonly Token[],
): { refusal: Refusal | null } | null {
  if (isRefused(verdict)) return { refusal: null };
  if (!leavesXAlone(verdict, tokens)) return null;
  return answerAllowed(currentStageSpec(room), room.stage.pans) ? null : { refusal: 'simplify' };
}

/**
 * Judges the line the draft stands for (`notebook/enter`, story 1.3's checker):
 * - `incomplete`, `nonlinear`, `aside`: refused; the draft stays and `refused` counts up,
 *   so the notebook wiggles. Nothing is acted out.
 * - `answer`, or a `valid` line that would leave x alone (`x = 3 · 3`), before the pans
 *   are simplified, in a stage Try values can't finish (story 1.16, `answerAllowed`):
 *   refused the same way, and `refusal` is set, so its tag shows. The returned verdict is
 *   still the checker's; nothing is stored.
 * - `wrong`: the draft stays, marked by a line jam. The machine shows it on the pans, at
 *   the dial's x, tipped, and jams (`MachineJammed`); `jamsInARow` counts up.
 * - `valid`, `answer`, `check`: appended to `lines`, read-only, and the draft empties (and,
 *   when he fills blanks, the next template comes up). The pans take the line's layout,
 *   still weighed at the dial's x (story 1.16); the machine moves on; `jamsInARow` resets.
 *   With Balance `auto`, the last two lines' blanks appear once x is alone on the pans
 *   (room/fading.ts, `withLastLines`). The check line locks the stage (`StageLocked`), and
 *   the machine starts presenting the lock at `now` (ctx.now; see room/phases.ts). A
 *   locked pin that is somehow still unresolved resolves then (`PredictionMade`);
 *   confirming it normally has (room/pin.ts).
 * A written line never fires `PansLevel`: only the dial does. Null when the notebook is
 * off, or while the machine is jammed (only an edit clears a line jam).
 */
export function enterLine(room: RoomState, now: number): EnterStep | null {
  const { stage } = room;
  if (!notebookWrites(stage) || stage.jam !== null) return null;
  const tokens = lineTokens(stage);
  const verdict = check(committedEquations(stage.lines), tokens);
  const at = { roomId: room.spec.id, stage: room.stageIndex };
  const refused = refusalOf(room, verdict, tokens);
  if (refused) {
    const next: StageState = { ...stage, refused: stage.refused + 1, refusal: refused.refusal };
    return { room: withStage(room, next), events: [], verdict };
  }
  if (verdict.kind === 'wrong') {
    const jammed: StageState = {
      ...stage,
      jam: { kind: 'line' },
      jamsInARow: stage.jamsInARow + 1,
      refusal: null,
    };
    const events: RoomEvent[] = [
      { type: 'LineWrong', ...at, line: formatTokens(tokens) },
      { type: 'MachineJammed', roomId: room.spec.id, kind: 'line' },
    ];
    return { room: withStage(room, jammed), events, verdict };
  }
  return { ...commitTypedLine(room, tokens, verdict, now), verdict };
}

/**
 * A line he typed, judged committed (`valid`, `answer` or `check`), as enter commits it:
 * appended to `lines`, the draft emptied and the current blank used up, the last two
 * lines' blanks brought up to date (`withLastLines`), and `LineAccepted`. The check line
 * locks the stage, presented from `now` (`StageLocked`), and resolves a pin still
 * unresolved. Enter calls it, and so does a saved room's replay (room/resume.ts).
 */
export function commitTypedLine(
  room: RoomState,
  tokens: Token[],
  verdict: Verdict,
  now: number,
): NotebookStep {
  const { stage } = room;
  const at = { roomId: room.spec.id, stage: room.stageIndex };
  const locks = verdict.kind === 'check';
  const next: StageState = withLastLines(currentStageSpec(room), {
    ...commitLine(stage, tokens, 'typed', verdict),
    phase: locks ? 'locked' : stage.phase,
    draft: [],
    templates: stage.templates.slice(1),
    refusal: null,
    presentedAt: locks ? now : stage.presentedAt,
  });
  const progress = lineProgress(verdict);
  const events: RoomEvent[] = [{ type: 'LineAccepted', ...at, source: 'typed', progress }];
  const committed = withStage(room, next);
  if (!locks) return { room: committed, events };
  events.push({ type: 'StageLocked', ...at });
  const resolved = resolvePin(committed);
  if (!resolved) return { room: committed, events };
  return { room: resolved.room, events: [...events, ...resolved.events] };
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

/** The draft line and the lines still to fill after it, ready to show. */
export interface DraftDisplay {
  /** The draft in school notation: free text, or its template with the blank filled so far. */
  draft: LineSegment[];
  /** Templates after the current one (the check line, while he fills `x = ☐`). */
  upcoming: LineSegment[][];
}

export function draftDisplay(stage: Pick<StageState, 'draft' | 'templates'>): DraftDisplay {
  const [template, ...rest] = stage.templates;
  return {
    draft: template ? formatLine(template, stage.draft) : formatLine(stage.draft),
    upcoming: rest.map((line) => formatLine(line)),
  };
}
