// Unmask (GDD, Scene types): one of them is lying. Each question card is a sum, and asking one
// shows everyone's working on it. Two can be wrong in different ways, so spotting the odd one out
// isn't enough, and tapping everyone can't finish it: the scene ends when he writes the guilty
// one's false line corrected, line by line, each judged true.

import { flagsOf, judgeLine } from '@/hunt/line-judge';
import { parseStatement } from '@/math/statement';
import { isSToken, readTokens, type SToken } from '@/math/statement-tokens';
import { isTrue } from '@/math/truth';

export interface UnmaskCard {
  id: string;
  /** What it asks. */
  ask: string;
  /** Each suspect's line on it, in their own working. */
  answers: Readonly<Record<string, string>>;
}

export interface UnmaskSuspect {
  id: string;
  name: string;
  /** What they say when he points at them, and they're not the one. */
  offended: string;
  /** Why they weren't lying, shown after that. */
  why: string;
}

export interface UnmaskSpec {
  kind: 'unmask';
  intro: string;
  suspects: readonly UnmaskSuspect[];
  cards: readonly UnmaskCard[];
  /** At least this many cards before he can point. */
  required: number;
  guilty: string;
  /** What happens when he points at the right one. */
  reveal: string;
  /** He writes the guilty one's false line corrected. */
  fix: { say: string; start: string; accepts: readonly string[]; keys: readonly SToken[] };
  opened: string;
  example: readonly string[];
  hint: { step: string; move: string };
}

export type UnmaskPhase = 'ask' | 'write' | 'done';

export interface UnmaskState {
  phase: UnmaskPhase;
  asked: string[];
  /** Everyone he has wrongly pointed at. */
  accused: string[];
  /** What the last wrong accusation showed, until he's read it. */
  shown: string | null;
  /** He has been told that he has to ask more first. */
  tooSoon: boolean;
  draft: SToken[];
  bounced: boolean;
  refused: boolean | 'off';
  help: number;
  hintLevel: number;
  exactTaken: boolean;
  guide: 'intro' | 'on' | null;
  opened: boolean;
}

export function newUnmask(guided = false): UnmaskState {
  return {
    phase: 'ask',
    asked: [],
    accused: [],
    shown: null,
    tooSoon: false,
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

/** Asking a card shows everyone's working on it. */
export function unmaskAsk(spec: UnmaskSpec, state: UnmaskState, card: string): UnmaskState {
  if (state.phase !== 'ask' || state.shown) return state;
  if (!spec.cards.some((candidate) => candidate.id === card)) return state;
  if (state.asked.includes(card)) return state;
  return { ...state, asked: [...state.asked, card], tooSoon: false };
}

/** He points at someone: legal only after enough cards. */
export function unmaskAccuse(spec: UnmaskSpec, state: UnmaskState, suspect: string): UnmaskState {
  if (state.phase !== 'ask' || state.shown) return state;
  if (state.asked.length < spec.required) return { ...state, tooSoon: true };
  if (suspect === spec.guilty) return { ...state, phase: 'write', tooSoon: false, shown: null };
  const who = spec.suspects.find((candidate) => candidate.id === suspect);
  if (!who) return state;
  return {
    ...state,
    accused: state.accused.includes(suspect) ? state.accused : [...state.accused, suspect],
    shown: `${who.offended} ${who.why}`,
    tooSoon: false,
    help: Math.max(state.help, Math.min(3, state.accused.length + 1)),
  };
}

export function unmaskDismiss(state: UnmaskState): UnmaskState {
  return state.shown ? { ...state, shown: null } : state;
}

export function unmaskType(state: UnmaskState, token: SToken): UnmaskState {
  if (state.phase !== 'write' || state.draft.length >= 40) return state;
  return { ...state, draft: [...state.draft, token], bounced: false, refused: false };
}

export function unmaskDelete(state: UnmaskState): UnmaskState {
  if (state.phase !== 'write' || state.draft.length === 0) return state;
  return { ...state, draft: state.draft.slice(0, -1), bounced: false, refused: false };
}

/** His corrected line: what's asked ends the scene; false bounces; anything else, a wiggle. */
export function unmaskEnter(spec: UnmaskSpec, state: UnmaskState): UnmaskState {
  if (state.phase !== 'write') return state;
  const { verdict } = judgeLine(spec.fix.start, spec.fix.accepts, state.draft);
  if (verdict === 'right') {
    return { ...state, phase: 'done', opened: true, draft: [], bounced: false, guide: null };
  }
  return { ...state, ...flagsOf(verdict) };
}

export function unmaskIdle(state: UnmaskState): UnmaskState {
  return state.opened || state.help >= 3 ? state : { ...state, help: state.help + 1 };
}

export function unmaskHint(state: UnmaskState): UnmaskState {
  if (state.opened) return state;
  const hintLevel = Math.min(2, state.hintLevel + 1);
  return { ...state, hintLevel, exactTaken: state.exactTaken || hintLevel === 2 };
}

/** The right one on his first accusation earns its parts. */
export function unmaskEarns(state: UnmaskState): boolean {
  return state.opened && state.accused.length === 0 && !state.exactTaken;
}

/**
 * The problems with a scene (architecture, Pattern 6): exactly one culprit; every answer reads;
 * and whichever cards he asks, the culprit stands out from anyone who merely slipped.
 */
export function proveUnmask(spec: UnmaskSpec): string[] {
  const problems: string[] = [];
  const wrongOn = (suspect: string, card: UnmaskCard) => {
    const line = card.answers[suspect];
    const tokens = line === undefined ? null : readTokens(line);
    const parsed = tokens ? parseStatement(tokens) : null;
    if (!parsed?.ok) {
      problems.push(`${suspect}'s line on ${card.id} doesn't read`);
      return false;
    }
    return !isTrue(parsed.statement);
  };
  const score = (suspect: string, cards: readonly UnmaskCard[]) =>
    cards.filter((card) => wrongOn(suspect, card)).length;
  const all = spec.cards;
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const pair = [all[i], all[j]] as UnmaskCard[];
      const guilty = score(spec.guilty, pair);
      if (guilty !== 2) problems.push(`the culprit is right on ${pair.map((c) => c.id).join('+')}`);
      for (const suspect of spec.suspects) {
        if (suspect.id !== spec.guilty && score(suspect.id, pair) >= guilty) {
          problems.push(`${suspect.id} looks as guilty on ${pair.map((c) => c.id).join('+')}`);
        }
      }
    }
  }
  if (all.length < spec.required) problems.push('fewer cards than he must ask');
  if (!spec.suspects.some((suspect) => suspect.id === spec.guilty)) problems.push('no culprit');
  return problems;
}

export function unmaskFrom(spec: UnmaskSpec, value: unknown): UnmaskState | null {
  if (typeof value !== 'object' || value === null) return null;
  const saved = value as Partial<UnmaskState>;
  if (saved.phase !== 'ask' && saved.phase !== 'write' && saved.phase !== 'done') return null;
  if (!Array.isArray(saved.draft) || !saved.draft.every(isSToken)) return null;
  const cards = new Set(spec.cards.map((card) => card.id));
  const people = new Set(spec.suspects.map((suspect) => suspect.id));
  return {
    ...newUnmask(),
    phase: saved.phase,
    asked: Array.isArray(saved.asked) ? saved.asked.filter((card) => cards.has(card)) : [],
    accused: Array.isArray(saved.accused) ? saved.accused.filter((who) => people.has(who)) : [],
    draft: saved.draft,
    hintLevel: typeof saved.hintLevel === 'number' ? saved.hintLevel : 0,
    exactTaken: saved.exactTaken === true,
    guide: saved.guide === 'intro' || saved.guide === 'on' ? saved.guide : null,
    opened: saved.opened === true,
  };
}
