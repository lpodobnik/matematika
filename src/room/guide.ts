// The rooms' first-time guides (story 6.1; after Luka: "nothing in the game explains
// itself", and his son needed help at every step of the first playtest). The first time a
// room needs a tool, Nikola, the lamplighter's kid, says what it does, one short line at a
// time, with the control for the line ringed and the rest dimmed (the guided first fight,
// fight/guide.ts, does the same for fights). A line tells him what a control does, never
// the answer: he still finds it himself.
//
// Pure. A topic is a tool or an idea a room brings (`GuideTopic`, room/types.ts): it applies
// while the stage needs it (`applies`), and shows until he has gone through its last step.
// Most steps he reads and closes with "Dalje" (talking steps); some wait for the move they
// ask for (`waits`): moving the slider, dropping a weight, entering a line. Unlike the
// fight's guide it never holds a move back: the room stays his, and a step that waits
// moves on when he makes the move. A step whose move is already made is skipped (`skip`).
//
// One topic shows at a time: the earliest in `guideOrder` that applies and that he hasn't
// met (`guide-<topic>` in `save.progress.firstUse`). A topic whose room he has already
// finished counts as met too, so a save from before the guides doesn't get room 1's guide
// in room 8. Where he is in a topic is kept in memory only (`ui.roomGuide`); a topic he
// leaves halfway starts again the next time it applies in another room. The root reducer
// moves it on (store/room-guide.ts); the text is in hr.ts (`hr.roomGuide`).

import { chainBlankWaits, chainWorks } from '@/room/chain';
import { dialTurnsNow } from '@/room/dial';
import { drumView } from '@/room/drum';
import { handoverApplies } from '@/room/handover';
import { linkedView } from '@/room/linked';
import { notebookWrites } from '@/room/notebook';
import { pinOffered } from '@/room/pin';
import { rangeView } from '@/room/range';
import { currentStageSpec, pokeNotches } from '@/room/room';
import { splitterOffered } from '@/room/splitter';
import { storyView, storyWaits } from '@/room/story';
import { balanceFading, trayHasGear, trayOffered } from '@/room/tray';
import type { FirstUseId, GuideTopic, Phase, RoomId, RoomState, ToolId } from '@/room/types';

/**
 * What a step rings, so the rest dims while it shows. In the scene: the slider, the scale
 * (its pans, pieces and readouts), the prediction flag, the tray, the splitter, the flag's
 * confirm control, the goal banner and the hint button. In the notebook: the page, the line
 * to write, the pad, its enter key, the logbook's lines, the gear chain, the story, the
 * range pin, the slider's single steps, the linked machines and the drum.
 */
export type GuideTarget =
  | 'dial'
  | 'scale'
  | 'pin'
  | 'tray'
  | 'splitter'
  | 'confirm'
  | 'goal'
  | 'hint'
  | 'notebook'
  | 'draft'
  | 'pad'
  | 'enter'
  | 'logbook'
  | 'chain'
  | 'story'
  | 'range'
  | 'fine-dial'
  | 'linked'
  | 'drum';

const sceneTargets: ReadonlySet<GuideTarget> = new Set<GuideTarget>([
  'dial',
  'scale',
  'pin',
  'tray',
  'splitter',
  'confirm',
  'goal',
  'hint',
]);

/** Where a target is: on the scene, or in the notebook (on a phone it slides over the scene). */
export function guideTargetPlace(target: GuideTarget): 'scene' | 'notebook' {
  return sceneTargets.has(target) ? 'scene' : 'notebook';
}

/** The moves a step can wait for, as the root reducer names his actions. */
export type GuideMove =
  | 'dial'
  | 'pin-set'
  | 'pin-confirm'
  | 'tray'
  | 'split'
  | 'chain'
  | 'enter'
  | 'show-line';

/** Every step's id: the key of its line in `hr.roomGuide.steps`. */
export type GuideStepId =
  | 'dial'
  | 'dial-x'
  | 'readouts'
  | 'level'
  | 'hint'
  | 'notebook'
  | 'blanks'
  | 'free'
  | 'enter'
  | 'check-blank'
  | 'check-free'
  | 'pin'
  | 'poke'
  | 'pin-drag'
  | 'pin-confirm'
  | 'tilt'
  | 'tilt-drag'
  | 'tray'
  | 'tray-kinds'
  | 'tray-drop'
  | 'auto'
  | 'goal'
  | 'splitter'
  | 'split'
  | 'logbook'
  | 'logbook-tap'
  | 'logbook-flag'
  | 'chain'
  | 'chain-undo'
  | 'chain-run'
  | 'gear'
  | 'gear-why'
  | 'story'
  | 'story-x'
  | 'story-write'
  | 'story-choice'
  | 'story-flag'
  | 'coarse'
  | 'fine'
  | 'range'
  | 'range-flag'
  | 'linked'
  | 'linked-slot'
  | 'linked-fed'
  | 'drum'
  | 'drum-dot'
  | 'drum-try'
  | 'drum-pin';

export interface GuideStepSpec {
  id: GuideStepId;
  targets: readonly GuideTarget[];
  /** The move that takes him on; none for a step he reads and closes with "Dalje". */
  waits?: GuideMove;
  /** Left out where it doesn't fit the stage, or its move is already made. */
  skip?(room: RoomState, tools: readonly ToolId[]): boolean;
}

interface TopicSpec {
  /** The room that brings it: once that room is finished, the topic counts as met. */
  home: RoomId;
  applies(room: RoomState, tools: readonly ToolId[]): boolean;
  steps: readonly GuideStepSpec[];
}

function hasLine(room: RoomState, kind: 'answer' | 'check'): boolean {
  return room.stage.lines.some((line) => line.verdict.kind === kind);
}

const answered = (room: RoomState) => hasLine(room, 'answer');
const open = (room: RoomState) => room.stage.phase === 'open';
const blanks = (room: RoomState) => room.stage.templates.length > 0;
const pinKind = (room: RoomState) => currentStageSpec(room).pin?.kind ?? null;
const pinPlaced = (room: RoomState) => room.stage.pin !== null;
const drumAsks = (room: RoomState) => drumView(room)?.pin?.asks === true;

const topics: Readonly<Record<GuideTopic, TopicSpec>> = {
  dial: {
    home: 'r01',
    applies: (room) => dialTurnsNow(room),
    steps: [
      { id: 'dial', targets: ['dial'], waits: 'dial' },
      { id: 'dial-x', targets: ['dial', 'scale'] },
      { id: 'readouts', targets: ['scale'], skip: (room) => !currentStageSpec(room).readouts },
      { id: 'level', targets: ['scale'] },
      { id: 'hint', targets: ['hint'] },
    ],
  },
  notebook: {
    home: 'r01',
    applies: (room, tools) =>
      notebookWrites(room.stage) &&
      !answered(room) &&
      (handoverApplies('write', room, tools) || handoverApplies('answer', room, tools)),
    steps: [
      { id: 'notebook', targets: ['notebook'] },
      { id: 'blanks', targets: ['draft', 'pad'], skip: (room) => !blanks(room) },
      { id: 'free', targets: ['draft', 'pad'], skip: blanks },
      { id: 'enter', targets: ['enter'], waits: 'enter' },
    ],
  },
  check: {
    home: 'r01',
    applies: (room, tools) => handoverApplies('check', room, tools),
    steps: [
      { id: 'check-blank', targets: ['draft'], skip: (room) => !blanks(room) },
      { id: 'check-free', targets: ['draft', 'pad'], skip: blanks },
    ],
  },
  pin: {
    home: 'r03',
    applies: (room) => pinOffered(room) && pinKind(room) === 'level-x',
    steps: [
      { id: 'pin', targets: ['pin'] },
      {
        id: 'poke',
        targets: ['dial'],
        skip: (room) => pokeNotches(currentStageSpec(room)) === null,
      },
      { id: 'pin-drag', targets: ['pin', 'dial'], waits: 'pin-set', skip: pinPlaced },
      { id: 'pin-confirm', targets: ['confirm'], waits: 'pin-confirm' },
    ],
  },
  tilt: {
    home: 'r03',
    applies: (room) => pinOffered(room) && pinKind(room) === 'effect',
    steps: [
      { id: 'tilt', targets: ['pin'] },
      { id: 'tilt-drag', targets: ['pin'], waits: 'pin-set', skip: pinPlaced },
      { id: 'pin-confirm', targets: ['confirm'], waits: 'pin-confirm' },
    ],
  },
  tray: {
    home: 'r04',
    applies: (room, tools) =>
      open(room) &&
      trayOffered(room, tools) &&
      !answered(room) &&
      room.stage.jam === null &&
      !chainBlankWaits(room),
    steps: [
      { id: 'tray', targets: ['tray'] },
      { id: 'tray-kinds', targets: ['tray'] },
      { id: 'tray-drop', targets: ['tray', 'scale'], waits: 'tray' },
      {
        id: 'auto',
        targets: ['notebook'],
        skip: (room) => balanceFading(currentStageSpec(room)) !== 'auto',
      },
      { id: 'goal', targets: ['goal'] },
    ],
  },
  splitter: {
    home: 'r04',
    applies: (room, tools) =>
      open(room) && splitterOffered(room, tools) && !answered(room) && room.stage.jam === null,
    steps: [
      { id: 'splitter', targets: ['splitter'] },
      { id: 'split', targets: ['splitter', 'scale'], waits: 'split' },
    ],
  },
  logbook: {
    home: 'r07',
    applies: (room) => room.stage.planted !== null && !room.stage.planted.found && pinOffered(room),
    steps: [
      { id: 'logbook', targets: ['logbook'] },
      {
        id: 'logbook-tap',
        targets: ['logbook'],
        waits: 'show-line',
        skip: (room) => room.stage.linesTapped,
      },
      { id: 'logbook-flag', targets: ['logbook'], waits: 'pin-confirm' },
    ],
  },
  chain: {
    home: 'r08',
    applies: (room, tools) => chainWorks(room, tools) && !answered(room),
    steps: [
      { id: 'chain', targets: ['chain'] },
      { id: 'chain-undo', targets: ['chain'] },
      { id: 'chain-run', targets: ['chain', 'pad'], waits: 'chain' },
    ],
  },
  gear: {
    home: 'r09',
    applies: (room, tools) =>
      open(room) &&
      trayOffered(room, tools) &&
      trayHasGear(currentStageSpec(room)) &&
      !answered(room) &&
      room.stage.jam === null,
    steps: [
      { id: 'gear', targets: ['tray'] },
      { id: 'gear-why', targets: ['scale'] },
    ],
  },
  story: {
    home: 'r10',
    applies: (room) => open(room) && storyWaits(room),
    steps: [
      { id: 'story', targets: ['story'] },
      { id: 'story-x', targets: ['story'] },
      { id: 'story-write', targets: ['draft', 'pad'], waits: 'enter' },
    ],
  },
  'story-choice': {
    home: 'r10',
    applies: (room) => storyView(room)?.asks === true,
    steps: [
      { id: 'story-choice', targets: ['story'] },
      { id: 'story-flag', targets: ['story'], waits: 'pin-confirm' },
    ],
  },
  coarse: {
    home: 'r11',
    applies: (room) => {
      const { dial } = currentStageSpec(room);
      return dial !== 'locked' && dial.coarse !== undefined && dialTurnsNow(room);
    },
    steps: [
      { id: 'coarse', targets: ['dial'] },
      { id: 'fine', targets: ['fine-dial'] },
    ],
  },
  range: {
    home: 'r11',
    applies: (room) => rangeView(room)?.asks === true,
    steps: [
      { id: 'range', targets: ['range'] },
      { id: 'range-flag', targets: ['range'], waits: 'pin-confirm' },
    ],
  },
  linked: {
    home: 'r12',
    applies: (room) => linkedView(room)?.role === 'feeds',
    steps: [
      { id: 'linked', targets: ['linked'] },
      { id: 'linked-slot', targets: ['linked'] },
    ],
  },
  'linked-fed': {
    home: 'r12',
    applies: (room) => linkedView(room)?.role === 'fed',
    steps: [{ id: 'linked-fed', targets: ['linked'] }],
  },
  drum: {
    home: 'r13',
    applies: (room) => drumView(room) !== null,
    steps: [
      { id: 'drum', targets: ['drum'] },
      { id: 'drum-dot', targets: ['drum'] },
      { id: 'drum-try', targets: ['dial'], waits: 'dial', skip: (room) => !drumAsks(room) },
      { id: 'drum-pin', targets: ['drum'], waits: 'pin-confirm', skip: (room) => !drumAsks(room) },
    ],
  },
};

/**
 * The order topics take when more than one applies: what the stage needs first comes first
 * (a story before anything moves, the slider before the flag, a stage's own new idea before
 * the tools he already has), and the notebook after the scale that tells him what to write.
 * Room 11's range pin comes before its coarse slider: while the pin asks, a phone's notebook
 * hides the slider's single steps (notebook.css, `data-choosing`), which the slider's guide
 * points at.
 */
export const guideOrder: readonly GuideTopic[] = [
  'story',
  'dial',
  'range',
  'coarse',
  'pin',
  'tilt',
  'logbook',
  'story-choice',
  'drum',
  'linked',
  'linked-fed',
  'notebook',
  'check',
  'chain',
  'tray',
  'gear',
  'splitter',
];

/** A topic's steps, in order. */
export function guideSteps(topic: GuideTopic): readonly GuideStepSpec[] {
  return topics[topic].steps;
}

/** The room that brings a topic. */
export function guideHome(topic: GuideTopic): RoomId {
  return topics[topic].home;
}

/** The id that marks a topic met, in `save.progress.firstUse`. */
export function guideMet(topic: GuideTopic): FirstUseId {
  return `guide-${topic}`;
}

/** Where he is in a topic, in memory only (`ui.roomGuide`). */
export interface RoomGuideState {
  topic: GuideTopic;
  /** Index into the topic's steps. */
  step: number;
}

/** What he has done, as far as the guides care (from `save.progress`). */
export interface GuideProgress {
  firstUse: readonly FirstUseId[];
  roomsDone: readonly RoomId[];
  tools: readonly ToolId[];
}

/** Phases a guide can show in: from arrival until the stage locks (as the hint button). */
const guidePhases: ReadonlySet<Phase> = new Set<Phase>(['arrive', 'poke', 'pin', 'open']);

/** Whether a topic applies to the stage now, met or not. */
export function guideApplies(
  topic: GuideTopic,
  room: RoomState,
  tools: readonly ToolId[],
): boolean {
  if (!guidePhases.has(room.stage.phase) || room.stage.jam !== null) return false;
  return topics[topic].applies(room, tools);
}

function metAlready(topic: GuideTopic, progress: GuideProgress): boolean {
  return (
    progress.firstUse.includes(guideMet(topic)) || progress.roomsDone.includes(topics[topic].home)
  );
}

/** The topic that shows now: the earliest that applies and that he hasn't met; or null. */
export function guideTopicNow(room: RoomState | null, progress: GuideProgress): GuideTopic | null {
  if (!room) return null;
  return (
    guideOrder.find(
      (topic) => !metAlready(topic, progress) && guideApplies(topic, room, progress.tools),
    ) ?? null
  );
}

/** The first step from `from` on that the stage doesn't skip, or null for none. */
function shownFrom(
  topic: GuideTopic,
  from: number,
  room: RoomState,
  tools: readonly ToolId[],
): number | null {
  const steps = topics[topic].steps;
  for (let index = from; index < steps.length; index += 1) {
    const step = steps[index];
    if (step && !step.skip?.(room, tools)) return index;
  }
  return null;
}

/** What the guide shows now. Built fresh on each call: select its `guideKey` instead. */
export interface GuideView {
  topic: GuideTopic;
  /** Index into the topic's steps. */
  step: number;
  id: GuideStepId;
  targets: readonly GuideTarget[];
  /** The move that takes him on, or null for a step closed with "Dalje". */
  waits: GuideMove | null;
  /** No step comes after it in the stage as it is. */
  last: boolean;
}

/**
 * The step the guide shows now, or null: the topic that shows (`guideTopicNow`), at the step
 * he has reached in it (`state`, when it is that topic) or its first, skipping the steps the
 * stage skips.
 */
export function roomGuideView(
  room: RoomState | null,
  progress: GuideProgress,
  state: RoomGuideState | null,
): GuideView | null {
  if (!room) return null;
  const topic = guideTopicNow(room, progress);
  if (!topic) return null;
  const from = state?.topic === topic ? state.step : 0;
  const step = shownFrom(topic, from, room, progress.tools);
  const spec = step === null ? undefined : topics[topic].steps[step];
  if (step === null || !spec) return null;
  return {
    topic,
    step,
    id: spec.id,
    targets: spec.targets,
    waits: spec.waits ?? null,
    last: shownFrom(topic, step + 1, room, progress.tools) === null,
  };
}

/**
 * Whether the topic that applies has no step left to show (each was skipped since he
 * reached it): it is then met, as if he had read its last step.
 */
export function guideSpent(
  room: RoomState | null,
  progress: GuideProgress,
  state: RoomGuideState | null,
): GuideTopic | null {
  if (!room) return null;
  const topic = guideTopicNow(room, progress);
  if (!topic || state?.topic !== topic) return null;
  return shownFrom(topic, state.step, room, progress.tools) === null ? topic : null;
}

/**
 * The step after `view`, in the stage `room` as it is now (after the move that took him on,
 * for a step that waits): where he is next, or null when the topic is over and met.
 */
export function guideAdvance(
  view: GuideView,
  room: RoomState,
  tools: readonly ToolId[],
): RoomGuideState | null {
  const step = shownFrom(view.topic, view.step + 1, room, tools);
  return step === null ? null : { topic: view.topic, step };
}

/** A step and its place, as one primitive for selectors: `pin:2`. */
export function guideKey(view: GuideView | null): string | null {
  return view ? `${view.topic}:${view.step}` : null;
}

/** The topic and step a `guideKey` names, or null. */
export function guideOfKey(key: string | null): { topic: GuideTopic; step: GuideStepSpec } | null {
  if (key === null) return null;
  const at = key.lastIndexOf(':');
  const topic = key.slice(0, at) as GuideTopic;
  const step = topics[topic]?.steps[Number(key.slice(at + 1))];
  return step ? { topic, step } : null;
}
