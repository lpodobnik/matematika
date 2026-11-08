// A lead's steps (architecture, Pattern 7): show → try → fix → play → write → thread → done. Pure:
// legal moves per step, everything else ignored, no timers. What it changes outside the lead comes
// back as an `outcome`, which the store's layer applies.

import {
  type KnockState,
  knockCross,
  knockDelete,
  knockDismiss,
  knockDoor,
  knockEarns,
  knockEnter,
  knockFrom,
  knockGuide,
  knockHint,
  knockIdle,
  knockPickClue,
  knockStrike,
  knockType,
  newKnock,
} from '@/hunt/knock';
import { applyMove, goalMet, type ObjectMove, type ObjectState } from '@/hunt/objects';
import type { LeadSpec, LineTask, SceneSpec } from '@/hunt/spec';
import { formatStatementLine } from '@/math/format';
import { parseStatement } from '@/math/statement';
import { fillLine, isSToken, readLine, readTokens, type SToken } from '@/math/statement-tokens';
import { isTrue } from '@/math/truth';

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
  /** A line that reads but isn't what's asked, or doesn't read. */
  refused: boolean;
  fix: FixPhase;
  /** A tap on a line of the little one's that was right. */
  nudged: boolean;
  knock: KnockState | null;
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
  /** Something he has now been told, for good. */
  told?: string;
  /** The lead is done. His written lines go on its notebook page. */
  finished?: { lines: readonly string[]; firstTry: boolean };
}

export type LeadAction =
  | { kind: 'next' }
  | { kind: 'move'; move: ObjectMove }
  | { kind: 'type'; token: SToken }
  | { kind: 'delete' }
  | { kind: 'enter' }
  | { kind: 'fix-tap'; line: number }
  | { kind: 'strike'; line: number }
  | { kind: 'pick-clue'; clue: string }
  | { kind: 'cross' }
  | { kind: 'door'; door: number }
  | { kind: 'dismiss' }
  | { kind: 'idle' }
  | { kind: 'hint' };

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

export const firstDoorParts = 2;
export const knockGuideTold = 'guide:knock';
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
  clean: true,
};

/** The lead from the start, or from past the fix when the little one has already learnt it. */
export function newLeadPlay(): LeadPlay {
  return { ...blank, step: 'show', at: 0 };
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
  const guided = at === 0 && !facts.told.includes(knockGuideTold);
  return {
    ...base,
    ...blank,
    clean: base.clean,
    step: 'play',
    at,
    knock: newKnock(scene, guided),
  };
}

function startFix(spec: LeadSpec, base: LeadPlay, facts: LeadFacts): LeadPlay {
  if (facts.taught.includes(spec.mistake.id)) return startPlay(spec, 0, base, facts);
  return { ...base, ...blank, clean: base.clean, step: 'fix', at: 0, fix: 'spot' };
}

/** The task's line as he has it so far. */
export function taskLine(task: LineTask, draft: readonly SToken[]): SToken[] {
  return fillLine(readLine(task.start) ?? [], draft);
}

const textOf = (tokens: readonly SToken[]) =>
  formatStatementLine(tokens)
    .map((segment) => segment.text)
    .join('');

/** Whether a line is what's asked: the same line, whatever way he spaced it. */
function isAccepted(task: LineTask, tokens: readonly SToken[]): boolean {
  return task.accepts.some((line) => {
    const accepted = readTokens(line);
    return (
      accepted !== null &&
      accepted.length === tokens.length &&
      accepted.every((token, i) => token === tokens[i])
    );
  });
}

/** His line goes in. True and asked for is ink; false bounces; anything else gets a wiggle. */
function enterLine(task: LineTask, play: LeadPlay): { play: LeadPlay; line: string | null } {
  if (play.draft.length === 0)
    return { play: { ...play, refused: true, bounced: false }, line: null };
  const tokens = taskLine(task, play.draft);
  if (isAccepted(task, tokens)) {
    const line = textOf(tokens);
    return {
      play: {
        ...play,
        draft: [],
        written: [...play.written, line],
        bounced: false,
        refused: false,
      },
      line,
    };
  }
  const parsed = parseStatement(tokens);
  const bounces = parsed.ok && !isTrue(parsed.statement);
  return { play: { ...play, bounced: bounces, refused: !bounces }, line: null };
}

function withKnock(
  spec: LeadSpec,
  play: LeadPlay,
  change: (knock: KnockState, scene: SceneSpec) => KnockState,
): LeadResult {
  const scene = spec.scenes[play.at];
  if (play.step !== 'play' || !play.knock || !scene) return { play, outcome: {} };
  const knock = change(play.knock, scene);
  if (knock === play.knock) return { play, outcome: {} };
  const outcome: LeadOutcome = {};
  if (knock.shown && !play.knock.shown) {
    outcome.doorKnocked = { door: knock.shown.door, right: false };
  }
  if (knock.opened && !play.knock.opened) {
    outcome.doorKnocked = { door: scene.door, right: true };
    if (play.knock.guide !== null) outcome.told = knockGuideTold;
    if (knockEarns(knock)) {
      outcome.earned = { key: `${spec.id}:${play.at}`, parts: firstDoorParts };
    }
  }
  const clean = play.clean && !(knock.opened && !knockEarns(knock));
  return { play: { ...play, knock, clean }, outcome };
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
      if (play.knock?.guide === 'intro') {
        return { play: { ...play, knock: { ...play.knock, guide: 'on' } }, outcome: {} };
      }
      if (!play.knock?.opened) return { play, outcome: {} };
      if (play.at + 1 < spec.scenes.length) {
        return { play: startPlay(spec, play.at + 1, play, facts), outcome: {} };
      }
      return {
        play: { ...play, ...blank, clean: play.clean, step: 'write', at: 0, written: [] },
        outcome: {},
      };
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
  if (play.step === 'fix' && play.fix === 'write') {
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
  return withKnock(spec, play, (knock, scene) => knockEnter(scene, knock));
}

/** While the guide asks for a move, only that move passes (GDD, Scene types). */
function guideLets(spec: LeadSpec, play: LeadPlay, action: LeadAction): boolean {
  const scene = spec.scenes[play.at];
  const guide = play.step === 'play' && play.knock && scene ? knockGuide(scene, play.knock) : null;
  if (!guide || action.kind === 'idle' || action.kind === 'hint') return true;
  switch (guide.kind) {
    case 'intro':
      return action.kind === 'next';
    case 'cross':
      return action.kind === 'cross';
    case 'line':
      return action.kind === 'type' || action.kind === 'delete' || action.kind === 'enter';
    case 'door':
      return action.kind === 'door';
  }
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
      if (play.step === 'fix' && play.fix === 'show') {
        return goalMet(object, spec.mistake.show.goal)
          ? { play: { ...play, object, fix: 'write' }, outcome: {} }
          : { play: { ...play, object }, outcome: {} };
      }
      return same;
    }
    case 'type': {
      if (play.step === 'play') {
        return withKnock(spec, play, (knock) => knockType(knock, action.token, maxTokens));
      }
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
      if (play.step === 'play') return withKnock(spec, play, knockDelete);
      if (play.draft.length === 0) return same;
      return {
        play: { ...play, draft: play.draft.slice(0, -1), bounced: false, refused: false },
        outcome: {},
      };
    }
    case 'enter':
      return enter(spec, play);
    case 'fix-tap':
      if (play.step !== 'fix' || play.fix !== 'spot') return same;
      if (action.line !== spec.mistake.wrong) {
        return { play: { ...play, nudged: true }, outcome: {} };
      }
      return {
        play: { ...play, fix: 'show', nudged: false, object: spec.mistake.show.object },
        outcome: {},
      };
    case 'strike':
      return withKnock(spec, play, (knock, scene) => knockStrike(scene, knock, action.line));
    case 'pick-clue':
      return withKnock(spec, play, (knock, scene) => knockPickClue(scene, knock, action.clue));
    case 'cross':
      return withKnock(spec, play, (knock, scene) => knockCross(scene, knock));
    case 'door':
      return withKnock(spec, play, (knock, scene) => knockDoor(scene, knock, action.door));
    case 'dismiss':
      return withKnock(spec, play, knockDismiss);
    case 'idle':
      return withKnock(spec, play, knockIdle);
    case 'hint':
      return withKnock(spec, play, knockHint);
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
  const knock = scene ? knockFrom(scene, saved.knock) : null;
  if (scene && !knock)
    return startPlay(spec, saved.at, newLeadPlay(), { taught: [], told: [knockGuideTold] });
  return {
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
    knock,
    clean: saved.clean !== false,
  };
}
