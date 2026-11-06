// What the dev panel shows and offers (architecture, Debug Tools): a jump to any room and
// stage, the tools he has earned (Balance can be switched on to try room 4 by a jump), the
// pans, the tray and the splitter, the checker's verdict and progress tuple for the last
// committed line and for the draft as enter would judge it now, the quality setting with
// a way to force one, and the tablet profile's set-up (story 1.13). Development builds only;
// the panel's text is for Luka, in English, and never reaches the game's Croatian text.

import { tuning } from '@/config/tuning';
import { assert } from '@/lib/assert';
import { check, type Verdict } from '@/math/check';
import { formatEquation, formatTokens } from '@/math/format';
import { complexity, type ProgressTuple } from '@/math/moves';
import { parse } from '@/math/parse';
import type { Token } from '@/math/tokens';
import { committedEquations, lineTokens } from '@/room/notebook';
import { splitterView } from '@/room/splitter';
import { trayView } from '@/room/tray';
import type { PinState, RoomId, RoomSpec, RoomState, ToolId } from '@/room/types';
import type { Action } from '@/store/actions';
import { type Quality, type QualityState, qualityInUse } from '@/store/quality';
import type { SceneCopies } from '@/store/types';

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
  /** The prediction pin: where it is and its state, e.g. `x = 12, locked, resolved`. */
  pin: string;
  /** The pans' equation, exploratory moves included: `2x = 23`. */
  pans: string;
  /** The tray's numbers, or `off` when the game doesn't offer it: `weight 1, float 5`. */
  tray: string;
  /** The splitter's parts, or `off` when the game doesn't offer it: `2 parts`. */
  splitter: string;
  /** The last committed line, with the verdict it was committed with (line 0 is given). */
  last: LineReadout;
  /**
   * The draft as enter would judge it now, or null when nothing is typed. After enter
   * refuses a line or jams on it, the line stays in the draft, so this is its verdict.
   */
  draft: LineReadout | null;
}

export function pinText(pin: PinState | null): string {
  if (!pin) return 'none';
  const { value } = pin;
  const place = value.kind === 'x' ? `x = ${value.x}` : `${value.kind} ${value.index}`;
  const state = pin.resolved ? 'locked, resolved' : pin.locked ? 'locked' : 'moving';
  return `${place}, ${state}`;
}

/** The tray as the panel shows it. */
export function trayText(room: RoomState, tools: readonly ToolId[]): string {
  const view = trayView(room, tools);
  if (!view) return 'off';
  const numbers = `weight ${view.weight}, float ${view.float}`;
  return view.works ? numbers : `${numbers}, jammed`;
}

/** The splitter as the panel shows it. */
export function splitterText(room: RoomState, tools: readonly ToolId[]): string {
  const view = splitterView(room, tools);
  if (!view) return 'off';
  const parts = `${view.parts} parts`;
  return view.works ? parts : `${parts}, jammed`;
}

export function devReadout(room: RoomState, tools: readonly ToolId[] = []): DevReadout {
  const { stage } = room;
  const lastLine = stage.lines[stage.lines.length - 1];
  const tokens = lineTokens(stage);
  return {
    place: `${room.spec.id} · stage ${room.stageIndex + 1} of ${room.spec.stages.length} · ${stage.phase}`,
    progress: stage.machineProgress.join(', '),
    jam: stage.jam ? stage.jam.kind : 'none',
    pin: pinText(stage.pin),
    pans: formatEquation(stage.pans),
    tray: trayText(room, tools),
    splitter: splitterText(room, tools),
    last: lastLine
      ? lineReadout(lastLine.tokens, lastLine.verdict)
      : { text: '', verdict: 'none', tuple: null },
    draft:
      stage.draft.length === 0
        ? null
        : lineReadout(tokens, check(committedEquations(stage.lines), tokens)),
  };
}

/** The tools after the panel's Balance switch is pressed: Balance on or off, the rest kept. */
export function toggledBalance(tools: readonly ToolId[]): ToolId[] {
  return tools.includes('balance')
    ? tools.filter((tool) => tool !== 'balance')
    : [...tools, 'balance'];
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

/** The room the tablet profile runs in: room 4, the water wheel, Balance and all. */
export const profileRoomId: RoomId = 'r04';

/**
 * What the panel's profile button dispatches (story 1.13; NFR1: 60 FPS while dragging the
 * dial in a three-machine room). Room 4 with Balance, opened by a touch, so the dial's whole
 * range is open to drag at once (story 1.16 took room 4's pin and poke window away, which
 * this placed and confirmed until then); `high` forced, so the steam runs whatever the
 * frame-time test picked; then three copies of the scene side by side. Only existing
 * actions, so the game decides what each does, as when he plays.
 */
export function profileActions(list: readonly RoomSpec[], tools: readonly ToolId[]): Action[] {
  const room = list.find((spec) => spec.id === profileRoomId);
  assert(room, `no room ${profileRoomId} in content`);
  return [
    { type: 'dev/set-tools', tools: [...tools, 'balance'] },
    { type: 'room/enter', roomId: profileRoomId },
    { type: 'machine/touch' },
    { type: 'quality/force', quality: 'high' },
    { type: 'dev/set-copies', copies: 3 },
  ];
}

/**
 * Leaving the profile: one copy of the scene again. The room and the forced setting stay,
 * so one machine and three can be profiled one after the other with the steam on.
 */
export const leaveProfile: Action = { type: 'dev/set-copies', copies: 1 };

/** The profile button: sets the profile up, or with three copies showing, leaves it. */
export function profileToggle(
  copies: SceneCopies,
  list: readonly RoomSpec[],
  tools: readonly ToolId[],
): Action[] {
  return copies === 3 ? [leaveProfile] : profileActions(list, tools);
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
