// A lead's steps (architecture, Pattern 7): show → try → fix → play → write → thread → done. Pure:
// legal moves per step, everything else ignored, no timers. What it changes outside the lead comes
// back as an `outcome`, which the store's layer applies.

import type { AloneState } from '@/hunt/alone';
import type { RuleGuardId } from '@/hunt/ids';
import type { KnockState } from '@/hunt/knock';
import { flagsOf, judgeLine } from '@/hunt/line-judge';
import { applyMove, goalMet, type ObjectMove, type ObjectState } from '@/hunt/objects';
import type { CartsState, LevelState, LocksState, LoopState, WindowsState } from '@/hunt/one-offs';
import type { GuardState } from '@/hunt/rule-guard';
import {
  allGuidesTold,
  freshScene,
  guideTold,
  type SceneAction,
  type SceneSpec,
  type SceneState,
  sceneAct,
  sceneEarns,
  sceneFrom,
  sceneGuide,
  scenePartsFor,
} from '@/hunt/scene';
import type { SneakState } from '@/hunt/sneak';
import type { LeadSpec, LineTask } from '@/hunt/spec';
import type { UnmaskState } from '@/hunt/unmask';
import { formatStatementLine } from '@/math/format';
import { isSToken, type SToken } from '@/math/statement-tokens';

export type LeadStep = 'show' | 'try' | 'fix' | 'play' | 'write' | 'thread';
export type FixPhase = 'spot' | 'show' | 'write' | 'thanks';

export interface LeadPlay {
  step: LeadStep;
  /** Which lesson step, task, scene or line: what `step` counts. */
  at: number;
  object: ObjectState | null;
  draft: SToken[];
  /** A line he has finished in this step, in ink. */
  written: string[];
  /** The task in front of him is done, and "Dalje" moves on. */
  solved: boolean;
  /** A false line, back in the draft with a wobble. */
  bounced: boolean;
  /** A line that doesn't read; `off` is one that's true, but isn't what's asked. */
  refused: boolean | 'off';
  fix: FixPhase;
  /** A tap on a line of the little one's that was right. */
  nudged: boolean;
  /** The scene in play: one of these, by the scene's kind. */
  knock: KnockState | null;
  sneak: SneakState | null;
  unmask: UnmaskState | null;
  alone: AloneState | null;
  guard: GuardState | null;
  carts: CartsState | null;
  level: LevelState | null;
  locks: LocksState | null;
  windows: WindowsState | null;
  loop: LoopState | null;
  /** Whether every door so far went without a struck line or an exact move. */
  clean: boolean;
}

/** What a step changes outside the lead. */
export interface LeadOutcome {
  /** The first-try parts for this door. Reloading can't earn them twice: `key` goes in `paid`. */
  earned?: { key: string; parts: number };
  taught?: { mistake: string; line: string };
  /** He has seen the showing to its end. */
  lessonSeen?: boolean;
  doorKnocked?: { door: number; right: boolean };
  lineWritten?: string;
  /** What he did with the forged clue. */
  forged?: 'struck' | 'followed';
  /** A rule guard has jammed. */
  guardBeaten?: RuleGuardId;
  /** Something he has now been told, for good. */
  told?: string;
  /** The lead is done. His written lines go on its notebook page. */
  finished?: { lines: readonly string[]; firstTry: boolean };
}

export type LeadAction =
  | { kind: 'next' }
  | { kind: 'move'; move: ObjectMove }
  | { kind: 'fix-tap'; line: number }
  | SceneAction;

export interface LeadResult {
  play: LeadPlay;
  outcome: LeadOutcome;
}

/** What the save already knows that changes how a lead goes. */
export interface LeadFacts {
  /** The mistakes the little one has learnt. */
  taught: readonly string[];
  told: readonly string[];
}

export const knockGuideTold = guideTold('knock');
const maxTokens = 40;

const blank = {
  object: null,
  draft: [],
  written: [],
  solved: false,
  bounced: false,
  refused: false,
  fix: 'spot' as FixPhase,
  nudged: false,
  knock: null,
  sneak: null,
  unmask: null,
  alone: null,
  guard: null,
  carts: null,
  level: null,
  locks: null,
  windows: null,
  loop: null,
  clean: true,
};

/** The scene in play, whichever kind it is. */
export function playedScene(play: LeadPlay): SceneState | null {
  return (
    play.knock ??
    play.sneak ??
    play.unmask ??
    play.alone ??
    play.guard ??
    play.carts ??
    play.level ??
    play.locks ??
    play.windows ??
    play.loop
  );
}

/** The play with this scene's state put back. */
function withScene(play: LeadPlay, spec: SceneSpec, state: SceneState): LeadPlay {
  return { ...play, [spec.kind]: state };
}

/** The lead from its first step: a knot has no showing, try or fix. */
export function newLeadPlay(spec?: LeadSpec, facts?: LeadFacts): LeadPlay {
  const fresh: LeadPlay = { ...blank, step: 'show', at: 0 };
  if (!spec || !facts || spec.lesson.steps.length > 0) return fresh;
  return spec.tries.length > 0 ? startTry(spec, 0, fresh) : startFix(spec, fresh, facts);
}

function startTry(spec: LeadSpec, at: number, base: LeadPlay): LeadPlay {
  const task = spec.tries[at];
  return {
    ...base,
    ...blank,
    clean: base.clean,
    written: at === 0 ? [] : base.written,
    step: 'try',
    at,
    object: task?.kind === 'object' ? task.object : null,
  };
}

function startPlay(spec: LeadSpec, at: number, base: LeadPlay, facts: LeadFacts): LeadPlay {
  const scene = spec.scenes[at] as SceneSpec;
  const guided = !facts.told.includes(guideTold(scene.kind));
  return withScene(
    { ...base, ...blank, clean: base.clean, step: 'play', at },
    scene,
    freshScene(scene, guided),
  );
}

function startFix(spec: LeadSpec, base: LeadPlay, facts: LeadFacts): LeadPlay {
  if (!spec.mistake || facts.taught.includes(spec.mistake.id)) {
    return spec.scenes.length > 0 ? startPlay(spec, 0, base, facts) : startWrite(spec, base);
  }
  return { ...base, ...blank, clean: base.clean, step: 'fix', at: 0, fix: 'spot' };
}

/** The school form, if the lead has one; otherwise on to the thread. */
function startWrite(spec: LeadSpec, base: LeadPlay): LeadPlay {
  const step = spec.writeUp.length > 0 ? 'write' : 'thread';
  return { ...base, ...blank, clean: base.clean, step, at: 0, written: [] };
}

const textOf = (tokens: readonly SToken[]) =>
  formatStatementLine(tokens)
    .map((segment) => segment.text)
    .join('');

/** His line goes in. What's asked is ink; false bounces; anything else says why it isn't. */
function enterLine(task: LineTask, play: LeadPlay): { play: LeadPlay; line: string | null } {
  if (play.draft.length === 0) {
    return { play: { ...play, refused: true, bounced: false }, line: null };
  }
  const { verdict, tokens } = judgeLine(task.start, task.accepts, play.draft, task.context);
  if (verdict !== 'right') return { play: { ...play, ...flagsOf(verdict) }, line: null };
  const line = textOf(tokens);
  return {
    play: { ...play, draft: [], written: [...play.written, line], bounced: false, refused: false },
    line,
  };
}

/** A move in the scene, with what it changes outside the lead. */
function inScene(spec: LeadSpec, play: LeadPlay, action: SceneAction): LeadResult {
  const scene = spec.scenes[play.at];
  const before = playedScene(play);
  if (play.step !== 'play' || !before || !scene) return { play, outcome: {} };
  const after = sceneAct(scene, before, action);
  if (after === before) return { play, outcome: {} };
  const outcome: LeadOutcome = {};
  if (scene.kind === 'knock') {
    const shown = (after as KnockState).shown;
    if (shown && !(before as KnockState).shown) {
      outcome.doorKnocked = { door: shown.door, right: false };
      const trap = scene.wrongDoors.some((wrong) => wrong.door === shown.door);
      if (scene.forged && trap) outcome.forged = 'followed';
    }
    if (after.opened && !before.opened && scene.forged) outcome.forged = 'struck';
    if (after.opened && !before.opened) outcome.doorKnocked = { door: scene.door, right: true };
  }
  // The guide is over, whenever that is: it isn't said twice.
  if (before.guide !== null && after.guide === null) outcome.told = guideTold(scene.kind);
  const earns = sceneEarns(scene, after);
  if (after.opened && !before.opened) {
    if (earns) outcome.earned = { key: `${spec.id}:${play.at}`, parts: scenePartsFor(scene) };
    if (scene.kind === 'guard') outcome.guardBeaten = scene.id;
  }
  const clean = play.clean && !(after.opened && !earns);
  return { play: { ...withScene(play, scene, after), clean }, outcome };
}

/** The "Dalje" of whatever step he's on. */
function next(spec: LeadSpec, play: LeadPlay, facts: LeadFacts): LeadResult {
  switch (play.step) {
    case 'show':
      if (play.at + 1 < spec.lesson.steps.length) {
        return { play: { ...play, at: play.at + 1 }, outcome: {} };
      }
      return { play: startTry(spec, 0, play), outcome: { lessonSeen: true } };
    case 'try': {
      if (!play.solved) return { play, outcome: {} };
      if (play.at + 1 < spec.tries.length) {
        return { play: startTry(spec, play.at + 1, play), outcome: {} };
      }
      return { play: startFix(spec, play, facts), outcome: {} };
    }
    case 'fix':
      if (play.fix !== 'thanks') return { play, outcome: {} };
      return { play: startPlay(spec, 0, play, facts), outcome: {} };
    case 'play': {
      const state = playedScene(play);
      const scene = spec.scenes[play.at];
      if (!state || !scene) return { play, outcome: {} };
      if (state.guide === 'intro') {
        return { play: withScene(play, scene, { ...state, guide: 'on' }), outcome: {} };
      }
      if (!state.opened) return { play, outcome: {} };
      if (play.at + 1 < spec.scenes.length) {
        return { play: startPlay(spec, play.at + 1, play, facts), outcome: {} };
      }
      return { play: startWrite(spec, play), outcome: {} };
    }
    case 'write':
      return { play, outcome: {} };
    case 'thread':
      if (play.at === 0) return { play: { ...play, at: 1 }, outcome: {} };
      return {
        play,
        outcome: { finished: { lines: play.written, firstTry: play.clean } },
      };
  }
}

function enter(spec: LeadSpec, play: LeadPlay): LeadResult {
  if (play.step === 'try') {
    const task = spec.tries[play.at];
    if (task?.kind !== 'line' || play.solved) return { play, outcome: {} };
    const result = enterLine(task, play);
    return {
      play: result.line ? { ...result.play, solved: true } : result.play,
      outcome: {},
    };
  }
  if (play.step === 'fix' && play.fix === 'write' && spec.mistake) {
    const result = enterLine(spec.mistake.write, play);
    if (!result.line) return { play: result.play, outcome: {} };
    return {
      play: { ...result.play, fix: 'thanks' },
      outcome: { taught: { mistake: spec.mistake.id, line: result.line } },
    };
  }
  if (play.step === 'write') {
    const task = spec.writeUp[play.at];
    if (!task) return { play, outcome: {} };
    const result = enterLine(task, play);
    if (!result.line) return { play: result.play, outcome: {} };
    const done = play.at + 1 >= spec.writeUp.length;
    return {
      play: done ? { ...result.play, step: 'thread', at: 0 } : { ...result.play, at: play.at + 1 },
      outcome: { lineWritten: result.line },
    };
  }
  return inScene(spec, play, { kind: 'enter' });
}

/** While the guide asks for a move, only that move passes (GDD, Scene types). */
function guideLets(spec: LeadSpec, play: LeadPlay, action: LeadAction): boolean {
  const scene = spec.scenes[play.at];
  const state = playedScene(play);
  const guide = play.step === 'play' && state && scene ? sceneGuide(scene, state) : null;
  if (!guide || action.kind === 'idle' || action.kind === 'hint') return true;
  if (guide.allows === 'read') return action.kind === 'next';
  return (guide.allows as readonly string[]).includes(action.kind);
}

/** One move in a lead. Whatever isn't legal in this step does nothing. */
export function leadStep(
  spec: LeadSpec,
  play: LeadPlay,
  action: LeadAction,
  facts: LeadFacts,
): LeadResult {
  const same: LeadResult = { play, outcome: {} };
  if (!guideLets(spec, play, action)) return same;
  switch (action.kind) {
    case 'next':
      return next(spec, play, facts);
    case 'move': {
      if (!play.object) return same;
      const object = applyMove(play.object, action.move);
      if (object === play.object) return same;
      if (play.step === 'try') {
        const task = spec.tries[play.at];
        const solved = task?.kind === 'object' && goalMet(object, task.goal);
        return { play: { ...play, object, solved }, outcome: {} };
      }
      if (play.step === 'fix' && play.fix === 'show' && spec.mistake) {
        return goalMet(object, spec.mistake.show.goal)
          ? { play: { ...play, object, fix: 'write' }, outcome: {} }
          : { play: { ...play, object }, outcome: {} };
      }
      return same;
    }
    case 'type': {
      if (play.step === 'play') return inScene(spec, play, action);
      const typing =
        (play.step === 'try' && spec.tries[play.at]?.kind === 'line' && !play.solved) ||
        (play.step === 'fix' && play.fix === 'write') ||
        play.step === 'write';
      if (!typing || play.draft.length >= maxTokens) return same;
      return {
        play: { ...play, draft: [...play.draft, action.token], bounced: false, refused: false },
        outcome: {},
      };
    }
    case 'delete': {
      if (play.step === 'play') return inScene(spec, play, action);
      if (play.draft.length === 0) return same;
      return {
        play: { ...play, draft: play.draft.slice(0, -1), bounced: false, refused: false },
        outcome: {},
      };
    }
    case 'enter':
      return enter(spec, play);
    case 'fix-tap':
      if (play.step !== 'fix' || play.fix !== 'spot' || !spec.mistake) return same;
      if (action.line !== spec.mistake.wrong) {
        return { play: { ...play, nudged: true }, outcome: {} };
      }
      return {
        play: { ...play, fix: 'show', nudged: false, object: spec.mistake.show.object },
        outcome: {},
      };
    default:
      return inScene(spec, play, action);
  }
}

const steps: readonly LeadStep[] = ['show', 'try', 'fix', 'play', 'write', 'thread'];
const phases: readonly FixPhase[] = ['spot', 'show', 'write', 'thanks'];

/**
 * A saved lead back from the save. What no longer fits its spec restarts that scene, and the lead
 * stays: a null here means start the lead's scene again (architecture, Save).
 */
export function leadPlayFrom(spec: LeadSpec, value: unknown): LeadPlay | null {
  if (typeof value !== 'object' || value === null) return null;
  const saved = value as Partial<LeadPlay>;
  const step = saved.step;
  if (!step || !steps.includes(step) || typeof saved.at !== 'number' || saved.at < 0) return null;
  const counts: Record<LeadStep, number> = {
    show: spec.lesson.steps.length,
    try: spec.tries.length,
    fix: 1,
    play: spec.scenes.length,
    write: spec.writeUp.length,
    thread: 2,
  };
  if (saved.at >= counts[step]) return null;
  if (!Array.isArray(saved.draft) || !saved.draft.every(isSToken)) return null;
  const scene = step === 'play' ? spec.scenes[saved.at] : undefined;
  const state = scene ? sceneFrom(scene, saved[scene.kind]) : null;
  if (scene && !state) {
    return startPlay(spec, saved.at, newLeadPlay(), { taught: [], told: allGuidesTold });
  }
  const base: LeadPlay = {
    step,
    at: saved.at,
    object: (saved.object as ObjectState | null | undefined) ?? null,
    draft: saved.draft,
    written: Array.isArray(saved.written) ? saved.written.filter((l) => typeof l === 'string') : [],
    solved: saved.solved === true,
    bounced: false,
    refused: false,
    fix: saved.fix && phases.includes(saved.fix) ? saved.fix : 'spot',
    nudged: false,
    knock: null,
    sneak: null,
    unmask: null,
    alone: null,
    guard: null,
    carts: null,
    level: null,
    locks: null,
    windows: null,
    loop: null,
    clean: saved.clean !== false,
  };
  return scene && state ? withScene(base, scene, state) : base;
}
