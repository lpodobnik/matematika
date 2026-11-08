// Every scene type behind one door (architecture, Pattern 7), so that a lead doesn't care which it
// plays, and a new type joins here and nowhere else in the rules.

import {
  type AloneSpec,
  type AloneState,
  aloneDismiss,
  aloneEarns,
  aloneFrom,
  aloneHint,
  aloneIdle,
  alonePick,
  newAlone,
} from '@/hunt/alone';
import {
  type KnockSpec,
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
import {
  lineStartOf,
  newSneak,
  type SneakSpec,
  type SneakState,
  sneakDelete,
  sneakDismiss,
  sneakEarns,
  sneakEnter,
  sneakFrom,
  sneakHint,
  sneakIdle,
  sneakStep,
  sneakType,
} from '@/hunt/sneak';
import {
  newUnmask,
  type UnmaskSpec,
  type UnmaskState,
  unmaskAccuse,
  unmaskAsk,
  unmaskDelete,
  unmaskDismiss,
  unmaskEarns,
  unmaskEnter,
  unmaskFrom,
  unmaskHint,
  unmaskIdle,
  unmaskType,
} from '@/hunt/unmask';
import type { SToken } from '@/math/statement-tokens';

export type SceneSpec = KnockSpec | SneakSpec | UnmaskSpec | AloneSpec;
export type SceneKind = SceneSpec['kind'];
export type SceneState = KnockState | SneakState | UnmaskState | AloneState;

export type SceneAction =
  | { kind: 'type'; token: SToken }
  | { kind: 'delete' }
  | { kind: 'enter' }
  | { kind: 'strike'; line: number }
  | { kind: 'pick-clue'; clue: string }
  | { kind: 'cross' }
  | { kind: 'door'; door: number }
  | { kind: 'step'; by: -1 | 0 | 1 }
  | { kind: 'ask'; card: string }
  | { kind: 'accuse'; suspect: string }
  | { kind: 'pipe'; pipe: number }
  | { kind: 'dismiss' }
  | { kind: 'idle' }
  | { kind: 'hint' };

const maxTokens = 40;

export function freshScene(spec: SceneSpec, guided: boolean): SceneState {
  switch (spec.kind) {
    case 'knock':
      return newKnock(spec, guided);
    case 'sneak':
      return newSneak(guided);
    case 'unmask':
      return newUnmask(guided);
    case 'alone':
      return newAlone(guided);
  }
}

export function sceneFrom(spec: SceneSpec, value: unknown): SceneState | null {
  switch (spec.kind) {
    case 'knock':
      return knockFrom(spec, value);
    case 'sneak':
      return sneakFrom(spec, value);
    case 'unmask':
      return unmaskFrom(spec, value);
    case 'alone':
      return aloneFrom(spec, value);
  }
}

function knockAct(spec: KnockSpec, state: KnockState, action: SceneAction): KnockState {
  switch (action.kind) {
    case 'type':
      return knockType(state, action.token, maxTokens);
    case 'delete':
      return knockDelete(state);
    case 'enter':
      return knockEnter(spec, state);
    case 'strike':
      return knockStrike(spec, state, action.line);
    case 'pick-clue':
      return knockPickClue(spec, state, action.clue);
    case 'cross':
      return knockCross(spec, state);
    case 'door':
      return knockDoor(spec, state, action.door);
    case 'dismiss':
      return knockDismiss(state);
    case 'idle':
      return knockIdle(state);
    case 'hint':
      return knockHint(state);
    default:
      return state;
  }
}

function sneakAct(spec: SneakSpec, state: SneakState, action: SceneAction): SneakState {
  switch (action.kind) {
    case 'type':
      return sneakType(spec, state, action.token);
    case 'delete':
      return sneakDelete(state);
    case 'enter':
      return sneakEnter(spec, state);
    case 'step':
      return sneakStep(spec, state, action.by);
    case 'dismiss':
      return sneakDismiss(spec, state);
    case 'idle':
      return sneakIdle(state);
    case 'hint':
      return sneakHint(state);
    default:
      return state;
  }
}

function unmaskAct(spec: UnmaskSpec, state: UnmaskState, action: SceneAction): UnmaskState {
  switch (action.kind) {
    case 'type':
      return unmaskType(state, action.token);
    case 'delete':
      return unmaskDelete(state);
    case 'enter':
      return unmaskEnter(spec, state);
    case 'ask':
      return unmaskAsk(spec, state, action.card);
    case 'accuse':
      return unmaskAccuse(spec, state, action.suspect);
    case 'dismiss':
      return unmaskDismiss(state);
    case 'idle':
      return unmaskIdle(state);
    case 'hint':
      return unmaskHint(state);
    default:
      return state;
  }
}

function aloneAct(spec: AloneSpec, state: AloneState, action: SceneAction): AloneState {
  switch (action.kind) {
    case 'pipe':
      return alonePick(spec, state, action.pipe);
    case 'dismiss':
      return aloneDismiss(state);
    case 'idle':
      return aloneIdle(state);
    case 'hint':
      return aloneHint(state);
    default:
      return state;
  }
}

/** One move in the scene. What isn't legal comes back as the same state. */
export function sceneAct(spec: SceneSpec, state: SceneState, action: SceneAction): SceneState {
  switch (spec.kind) {
    case 'knock':
      return knockAct(spec, state as KnockState, action);
    case 'sneak':
      return sneakAct(spec, state as SneakState, action);
    case 'unmask':
      return unmaskAct(spec, state as UnmaskState, action);
    case 'alone':
      return aloneAct(spec, state as AloneState, action);
  }
}

/** Whether the door earns its first-try parts. */
export function sceneEarns(spec: SceneSpec, state: SceneState): boolean {
  switch (spec.kind) {
    case 'knock':
      return knockEarns(state as KnockState);
    case 'sneak':
      return sneakEarns(state as SneakState);
    case 'unmask':
      return unmaskEarns(state as UnmaskState);
    case 'alone':
      return aloneEarns(state as AloneState);
  }
}

export const guideTold = (kind: SceneKind) => `guide:${kind}`;
export const allGuidesTold: readonly string[] = (
  ['knock', 'sneak', 'unmask', 'alone'] as const
).map(guideTold);

/** What the first time's guide says now, and the one move it lets through. */
export interface SceneGuide {
  /** Which line of `hr.hunt.guide[kind]`. */
  say: string;
  allows: readonly SceneAction['kind'][] | 'read';
}

const writing: readonly SceneAction['kind'][] = ['type', 'delete', 'enter'];

/** The guide of the first time, derived from the scene's state, so it can't get out of step. */
export function sceneGuide(spec: SceneSpec, state: SceneState): SceneGuide | null {
  if (state.guide === null || state.opened) return null;
  if (state.guide === 'intro') return { say: 'intro', allows: 'read' };
  switch (spec.kind) {
    case 'knock': {
      const step = knockGuide(spec, state as KnockState);
      if (!step) return null;
      if (step.kind === 'cross') return { say: 'cross', allows: ['cross'] };
      if (step.kind === 'door') return { say: 'door', allows: ['door'] };
      if (step.kind === 'intro') return { say: 'intro', allows: 'read' };
      return { say: step.first ? 'line' : 'next', allows: writing };
    }
    case 'sneak': {
      const sneak = state as SneakState;
      const board = spec.boards[sneak.board];
      if (sneak.notice) return null;
      if (board?.line && sneak.lit === null && lineStartOf(board, sneak).length > 0) {
        return { say: 'line', allows: writing };
      }
      return { say: 'step', allows: ['step'] };
    }
    case 'unmask': {
      const unmask = state as UnmaskState;
      if (unmask.shown) return null;
      if (unmask.phase === 'write') return { say: 'write', allows: writing };
      if (unmask.asked.length < spec.required) return { say: 'ask', allows: ['ask'] };
      return { say: 'accuse', allows: ['ask', 'accuse'] };
    }
    case 'alone': {
      if ((state as AloneState).plate) return null;
      return { say: 'pipe', allows: ['pipe'] };
    }
  }
}
