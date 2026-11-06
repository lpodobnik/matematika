// What the dev panel shows and offers (architecture, Debug Tools): a jump to any room and
// stage, the checker's verdict and progress tuple for the last committed line and for the
// draft as enter would judge it now, and the quality setting with a way to force one.
// Development builds only; the panel's text is for Luka, in English, and never reaches the
// game's Croatian text.

import { tuning } from '@/config/tuning';
import { check, type Verdict } from '@/math/check';
import { formatTokens } from '@/math/format';
import { complexity, type ProgressTuple } from '@/math/moves';
import { parse } from '@/math/parse';
import type { Token } from '@/math/tokens';
import { committedEquations, lineTokens } from '@/room/notebook';
import type { RoomId, RoomSpec, RoomState } from '@/room/types';
import { type Quality, type QualityState, qualityInUse } from '@/store/quality';

/** A place the panel can jump to: an authored room at one of its stages. */
export interface JumpTarget {
  roomId: RoomId;
  stage: number;
  label: string;
}

function isAuthored(id: RoomSpec['id']): id is RoomId {
  return /^r\d\d$/.test(id);
}

/** Every stage of every authored room, in play order: `r02 · 2` is room 2's second stage. */
export function jumpTargets(list: readonly RoomSpec[]): JumpTarget[] {
  return list.flatMap((room) => {
    const { id } = room;
    if (!isAuthored(id)) return [];
    return room.stages.map((_, stage) => ({ roomId: id, stage, label: `${id} · ${stage + 1}` }));
  });
}

export function verdictText(verdict: Verdict): string {
  if (verdict.kind !== 'valid') return verdict.kind;
  return `valid, ${verdict.move.kind}, ${verdict.progress ? 'progress' : 'no progress'}`;
}

export function tupleText(tuple: ProgressTuple): string {
  return `(${tuple.join(', ')})`;
}

/** One line as the checker sees it: its text, its verdict and its tuple (if it parses). */
export interface LineReadout {
  text: string;
  verdict: string;
  tuple: string | null;
}

function lineReadout(tokens: readonly Token[], verdict: Verdict): LineReadout {
  const parsed = parse(tokens);
  return {
    text: formatTokens(tokens),
    verdict: verdictText(verdict),
    tuple: parsed.ok ? tupleText(complexity(parsed.equation)) : null,
  };
}

export interface DevReadout {
  /** `r02 · stage 2 of 2 · open`. */
  place: string;
  /** The stage's machines' progress, 0–1 each. */
  progress: string;
  jam: string;
  /** The last committed line, with the verdict it was committed with (line 0 is given). */
  last: LineReadout;
  /**
   * The draft as enter would judge it now, or null when nothing is typed. After enter
   * refuses a line or jams on it, the line stays in the draft, so this is its verdict.
   */
  draft: LineReadout | null;
}

export function devReadout(room: RoomState): DevReadout {
  const { stage } = room;
  const lastLine = stage.lines[stage.lines.length - 1];
  const tokens = lineTokens(stage);
  return {
    place: `${room.spec.id} · stage ${room.stageIndex + 1} of ${room.spec.stages.length} · ${stage.phase}`,
    progress: stage.machineProgress.join(', '),
    jam: stage.jam ? stage.jam.kind : 'none',
    last: lastLine
      ? lineReadout(lastLine.tokens, lastLine.verdict)
      : { text: '', verdict: 'none', tuple: null },
    draft:
      stage.draft.length === 0
        ? null
        : lineReadout(tokens, check(committedEquations(stage.lines), tokens)),
  };
}

/** The quality setting as the panel shows it. */
export interface QualityReadout {
  /** The setting in use and why: `high · test running`, `low · forced`, `medium · from the test`. */
  inUse: string;
  /** The frame-time test: `running`, or `p95 21.4 ms → medium`. */
  test: string;
  /** The forced setting, or null when the test's pick is in use (the panel's `auto`). */
  forced: Quality | null;
}

function qualityReason(state: QualityState): string {
  if (state.measured === null) {
    return state.forced ? `test running, then ${state.forced} (forced)` : 'test running';
  }
  return state.forced ? 'forced' : 'from the test';
}

export function qualityReadout(state: QualityState): QualityReadout {
  const test =
    state.measured === null || state.measuredMs === null
      ? 'running'
      : `p${tuning.qualityPercentile} ${state.measuredMs.toFixed(1)} ms → ${state.measured}`;
  return { inUse: `${qualityInUse(state)} · ${qualityReason(state)}`, test, forced: state.forced };
}

/** The parts of a KeyboardEvent the toggle reads. */
export interface ToggleKey {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

/**
 * The backtick toggles the panel: the character itself, however a layout types it (AltGr+7
 * on a Croatian keyboard), or the key left of 1, which types ¸ on that layout.
 */
export function isToggleKey(event: ToggleKey): boolean {
  if (event.key === '`') return true;
  return event.code === 'Backquote' && !event.ctrlKey && !event.metaKey && !event.altKey;
}

/** `?dev` in the address opens the panel when the game loads. */
export function opensOnLoad(search: string): boolean {
  return new URLSearchParams(search).has('dev');
}
