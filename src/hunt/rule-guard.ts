// Rule guards (GDD, Scene types): each runs a misconception printed on its tape. He picks numbers
// from 6 tiles, because pupils this age struggle to find counterexamples, then writes the true
// line that breaks the rule. A wrong pick makes the guard thank him, at no cost.

import type { RuleGuardId } from '@/hunt/ids';
import { flagsOf, judgeLine } from '@/hunt/line-judge';
import { parseStatement } from '@/math/statement';
import { isSToken, readTokens, type SToken } from '@/math/statement-tokens';
import { isTrue } from '@/math/truth';

export interface GuardTile {
  id: string;
  /** What's on it. */
  face: string;
  /** Whether it breaks the rule. */
  breaks: boolean;
  /** What the guard says about a tile that doesn't: it's politely thankful. */
  thanks: string;
}

export interface GuardSpec {
  kind: 'guard';
  id: RuleGuardId;
  /** The rule on its tape. */
  rule: string;
  intro: string;
  tiles: readonly GuardTile[];
  /** The true line that breaks the rule, once he has the tile. */
  write: { say: string; start: string; accepts: readonly string[]; keys: readonly SToken[] };
  /** What happens when it jams. */
  jammed: string;
  example: readonly string[];
  hint: { step: string; move: string };
}

export interface GuardState {
  phase: 'pick' | 'write';
  picked: string[];
  /** What the guard has just said. */
  said: string | null;
  draft: SToken[];
  bounced: boolean;
  refused: boolean | 'off';
  help: number;
  hintLevel: number;
  exactTaken: boolean;
  guide: 'intro' | 'on' | null;
  opened: boolean;
}

export function newGuard(guided = false): GuardState {
  return {
    phase: 'pick',
    picked: [],
    said: null,
    draft: [],
    bounced: false,
    refused: false,
    help: 0,
    hintLevel: 0,
    exactTaken: false,
    guide: guided ? 'intro' : null,
    opened: false,
  };
}

export function guardPick(spec: GuardSpec, state: GuardState, tile: string): GuardState {
  if (state.phase !== 'pick' || state.opened || state.said) return state;
  const picked = spec.tiles.find((candidate) => candidate.id === tile);
  if (!picked || state.picked.includes(tile)) return state;
  const next = { ...state, picked: [...state.picked, tile] };
  if (picked.breaks) return { ...next, phase: 'write' };
  return { ...next, said: picked.thanks, help: Math.min(3, state.help + 1) };
}

export function guardDismiss(state: GuardState): GuardState {
  return state.said ? { ...state, said: null } : state;
}

export function guardType(state: GuardState, token: SToken): GuardState {
  if (state.phase !== 'write' || state.opened || state.draft.length >= 40) return state;
  return { ...state, draft: [...state.draft, token], bounced: false, refused: false };
}

export function guardDelete(state: GuardState): GuardState {
  if (state.phase !== 'write' || state.draft.length === 0) return state;
  return { ...state, draft: state.draft.slice(0, -1), bounced: false, refused: false };
}

/** The line that breaks the rule jams it. A false one bounces. */
export function guardEnter(spec: GuardSpec, state: GuardState): GuardState {
  if (state.phase !== 'write' || state.opened) return state;
  const { verdict } = judgeLine(spec.write.start, spec.write.accepts, state.draft);
  if (verdict === 'right') {
    return { ...state, opened: true, draft: [], bounced: false, refused: false, guide: null };
  }
  return { ...state, ...flagsOf(verdict) };
}

export function guardIdle(state: GuardState): GuardState {
  return state.opened || state.help >= 3 ? state : { ...state, help: state.help + 1 };
}

export function guardHint(state: GuardState): GuardState {
  if (state.opened) return state;
  const hintLevel = Math.min(2, state.hintLevel + 1);
  return { ...state, hintLevel, exactTaken: state.exactTaken || hintLevel === 2 };
}

/** A right tile on the first pick jams it for 5 parts. */
export function guardEarns(state: GuardState): boolean {
  return state.opened && state.picked.length === 1 && !state.exactTaken;
}

/** The problems with a guard: 6 tiles, and those that break the rule write a true line. */
export function proveGuard(spec: GuardSpec): string[] {
  const problems: string[] = [];
  if (spec.tiles.length !== 6) problems.push('a guard has 6 tiles');
  if (!spec.tiles.some((tile) => tile.breaks)) problems.push('no tile breaks the rule');
  if (spec.tiles.some((tile) => !tile.breaks && tile.thanks === '')) {
    problems.push('a wrong tile has no thanks');
  }
  for (const line of spec.write.accepts) {
    const tokens = readTokens(line);
    const parsed = tokens && parseStatement(tokens);
    if (!parsed?.ok || !isTrue(parsed.statement)) problems.push(`"${line}" isn't true`);
  }
  return problems;
}

export function guardFrom(spec: GuardSpec, value: unknown): GuardState | null {
  if (typeof value !== 'object' || value === null) return null;
  const saved = value as Partial<GuardState>;
  if (saved.phase !== 'pick' && saved.phase !== 'write') return null;
  if (!Array.isArray(saved.draft) || !saved.draft.every(isSToken)) return null;
  const tiles = new Set(spec.tiles.map((tile) => tile.id));
  return {
    ...newGuard(),
    phase: saved.phase,
    picked: Array.isArray(saved.picked) ? saved.picked.filter((tile) => tiles.has(tile)) : [],
    draft: saved.draft,
    hintLevel: typeof saved.hintLevel === 'number' ? saved.hintLevel : 0,
    exactTaken: saved.exactTaken === true,
    guide: saved.guide === 'intro' || saved.guide === 'on' ? saved.guide : null,
    opened: saved.opened === true,
  };
}
