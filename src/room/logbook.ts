// Find the mistake (story 2.10; architecture, Find the mistake; GDD room 7, the old logbook).
// Pure. A stage with `presetLines` opens with someone else's lines already written: the
// right ones are committed as the logbook's (`source: 'logbook'`), judged like any line;
// the first wrong one is planted, shown after them but never committed, so the checker
// never sees it. He taps a written line to put it on the scale at the slider's x
// (`notebook/show-line`): the right lines stay level where the stage equation does, and the
// planted one tips. He pins the line he thinks is wrong (a `wrong-line` pin, room/pin.ts);
// once it is tested the planted line is found, struck through, and he rewrites it: the
// notebook gives him `x = ☐` and the check line as blanks, judged against the lines before.

import { assert } from '@/lib/assert';
import { check } from '@/math/check';
import type { Equation } from '@/math/expr';
import { formatTokens } from '@/math/format';
import { parse } from '@/math/parse';
import { type Token, tokenize } from '@/math/tokens';
import { answerTemplate, checkTemplate } from '@/room/fading';
import type { NotebookLine, PlantedLine, RoomState, StageSpec, StageState } from '@/room/types';

function equationOf(tokens: readonly Token[]): Equation {
  const parsed = parse(tokens);
  assert(parsed.ok, `a logbook line doesn't parse: ${tokens.join('')}`);
  return parsed.equation;
}

/**
 * The logbook's lines a stage opens with, after line 0: the right ones committed in turn,
 * and the first wrong one planted. Content tests keep the planted line last.
 */
export function logbookOpening(
  stage: StageSpec,
  given: NotebookLine,
): { lines: NotebookLine[]; planted: PlantedLine | null } {
  const lines: NotebookLine[] = [given];
  for (const text of stage.presetLines ?? []) {
    const tokenized = tokenize(text);
    assert(tokenized.ok, `a logbook line has a symbol that isn't on the pad: ${text}`);
    const { tokens } = tokenized;
    const verdict = check(
      lines.map((line) => equationOf(line.tokens)),
      tokens,
    );
    if (verdict.kind === 'wrong') {
      return { lines, planted: { tokens, line: lines.length, found: false } };
    }
    lines.push({ tokens, source: 'logbook', verdict });
  }
  return { lines, planted: null };
}

/** The planted line's number in a stage's notebook, from its spec, or null for none. */
export function plantedLineOf(stage: StageSpec, given: NotebookLine): number | null {
  return logbookOpening(stage, given).planted?.line ?? null;
}

/** How many written lines a stage opens with (after line 0): the pin's places. */
export function writtenLineCount(stage: StageSpec): number {
  return stage.presetLines?.length ?? 0;
}

/**
 * A logbook line's equation by its number: one of the logbook's committed lines, or the
 * planted one (whose number his rewrite takes later in `lines`, so the planted one wins).
 * Null for his own lines, which he doesn't tap.
 */
export function lineEquation(stage: StageState, line: number): Equation | null {
  if (stage.planted && stage.planted.line === line) return equationOf(stage.planted.tokens);
  const committed = stage.lines[line];
  if (committed?.source === 'logbook') return equationOf(committed.tokens);
  return null;
}

/** The phases he can tap a line in: while he explores, pins, or writes. */
const tapPhases: ReadonlySet<StageState['phase']> = new Set(['poke', 'pin', 'open']);

/**
 * He taps a written line (`notebook/show-line`): the pans show it, weighed at the slider's
 * x, until the dial moves, another line is tapped, or a line is written. Tapping the shown
 * line again takes it off. Null when nothing changes: no such line, or a phase he can't
 * act in, or a jam.
 */
export function showLine(room: RoomState, line: number): RoomState | null {
  const { stage } = room;
  if (!tapPhases.has(stage.phase) || stage.jam !== null) return null;
  if (lineEquation(stage, line) === null) return null;
  const shownLine = stage.shownLine === line ? null : line;
  return { ...room, stage: { ...stage, shownLine, linesTapped: true } };
}

/** The pans as the scale shows them: the shown line's, or the stage's own. */
export function shownPans(stage: StageState): Equation {
  return (stage.shownLine !== null ? lineEquation(stage, stage.shownLine) : null) ?? stage.pans;
}

/**
 * The mistake found (the `wrong-line` pin tested): the planted line is struck through, the
 * pans take the last right line, and he rewrites it, `x = ☐` then the check line as blanks.
 */
export function foundMistake(stage: StageState, spec: StageSpec): StageState {
  if (!stage.planted || stage.planted.found) return stage;
  // The pans take the line he goes on from, the last right line before the mistake.
  const last = stage.lines[stage.lines.length - 1];
  return {
    ...stage,
    planted: { ...stage.planted, found: true },
    // Off the scale with it: what stands there now is the line he goes on from.
    shownLine: null,
    templates: [[...answerTemplate], checkTemplate(spec, stage.machine)],
    pans: last ? equationOf(last.tokens) : stage.pans,
  };
}

/** What the notebook shows of a find-the-mistake stage. Flat, for selectors. */
export interface LogbookView {
  /** The written line on the scale, or null. */
  shown: number | null;
  /** The planted line's number, its text, and whether it is found (struck through). */
  plantedLine: number;
  plantedText: string;
  found: boolean;
  /** He has tapped a line onto the scale (the tap's tag goes). */
  tapped: boolean;
  /** The mistake pin: offered now, the line it is on, and whether confirming does something. */
  pinAsks: boolean;
  pinAt: number | null;
  pinConfirmable: boolean;
}

/** The logbook as the notebook shows it, or null outside a find-the-mistake stage. */
export function logbookView(room: RoomState | null): LogbookView | null {
  const planted = room?.stage.planted;
  if (!room || !planted) return null;
  const { stage } = room;
  const offered =
    (stage.phase === 'poke' || stage.phase === 'pin') && !(stage.pin?.locked ?? false);
  const at = stage.pin?.value.kind === 'line' ? stage.pin.value.index : null;
  return {
    shown: stage.shownLine,
    plantedLine: planted.line,
    plantedText: formatTokens(planted.tokens),
    found: planted.found,
    tapped: stage.linesTapped,
    pinAsks: offered,
    pinAt: at,
    pinConfirmable: offered && stage.phase === 'pin' && at !== null,
  };
}
