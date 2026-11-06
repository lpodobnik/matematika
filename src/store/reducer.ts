// The pure root reducer (architecture, State Management). It never touches React, the
// DOM, storage, audio or the clock: time and randomness come in through ctx, and what
// happened goes out as domain events.

import { castDraft, produce } from 'immer';
import { rooms } from '@/content/rooms';
import { createEconomy } from '@/economy/parts';
import { payPrediction, predictionKey } from '@/economy/predictions';
import { assert } from '@/lib/assert';
import { setDial } from '@/room/dial';
import { meetControls } from '@/room/first-use';
import { actedAt, type HandoverMove, meetHandovers, stampArrival, tickIdle } from '@/room/handover';
import { type HintAction, hintAfter } from '@/room/hint';
import { deleteToken, enterLine, typeToken } from '@/room/notebook';
import {
  finishPresentation,
  nextRoom,
  playedThrough,
  resetStage,
  tickClock,
  toolEarned,
  touchMachine,
} from '@/room/phases';
import { confirmPin, setPin } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import { rememberSplitter, splitBothPans, stepSplitter } from '@/room/splitter';
import { dropOnScale, rememberTray, stepTray, takeOffPan } from '@/room/tray';
import type { RoomSpec, RoomState, ToolId } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { initialQuality, reduceQuality } from '@/store/quality';
import type { GameState, Reduce, SaveState } from '@/store/types';

export function initialGameState(): GameState {
  return {
    save: { progress: { tools: [], firstUse: [] }, economy: createEconomy() },
    room: null,
    ui: { screen: 'room', notebookAside: false, quality: initialQuality, copies: 1, hint: null },
  };
}

function findRoom(id: RoomSpec['id'], list: readonly RoomSpec[]): RoomSpec {
  const spec = list.find((room) => room.id === id);
  assert(spec, `no room ${id} in content`);
  return spec;
}

/**
 * A room that is done hands over to the next room in content (Pattern 2: "the next room
 * loads"), which arrives at its first stage. The last room stays done, and the root reducer
 * shows the "to be continued" screen (`playedThrough`).
 */
function moveOn(step: RoomStep | null, roomList: readonly RoomSpec[]): RoomStep | null {
  if (step?.room.stage.phase !== 'done') return step;
  const next = nextRoom(roomList, step.room.spec.id);
  if (!next) return step;
  const entered = enterRoom(next);
  return { room: entered.room, events: [...step.events, ...entered.events] };
}

/**
 * What an action does to the room in play, or null when it leaves the room alone: with no
 * room, in a phase where the action does nothing, or for an action outside the room. The
 * tray and the splitter take the tools he has earned, since they need Balance.
 */
function roomStep(
  state: GameState,
  action: Action,
  now: number,
  roomList: readonly RoomSpec[],
  tools: readonly ToolId[],
): RoomStep | null {
  if (action.type === 'room/enter') {
    return enterRoom(findRoom(action.roomId, roomList), action.stage ?? 0);
  }
  const { room } = state;
  if (!room) return null;
  switch (action.type) {
    case 'machine/touch':
      return touchMachine(room);
    case 'stage/reset':
      return resetStage(room);
    case 'presentation/done':
      return moveOn(finishPresentation(room, action, now), roomList);
    case 'clock/tick':
      return moveOn(tickClock(room, now), roomList);
    case 'dial/set':
      return setDial(room, action.x);
    case 'pin/set':
      return setPin(room, action.value);
    case 'pin/confirm':
      return confirmPin(room);
    case 'tray/step':
      return stepTray(room, tools, action.kind, action.by);
    case 'tray/drop':
      return dropOnScale(room, tools, action.kind);
    case 'tray/take':
      return takeOffPan(room, tools, action.side, action.key);
    case 'splitter/step':
      return stepSplitter(room, tools, action.by);
    case 'splitter/split':
      return splitBothPans(room, tools);
    case 'notebook/type':
      return typeToken(room, action.token);
    case 'notebook/delete':
      return deleteToken(room);
    case 'notebook/enter':
      return enterLine(room, now);
    case 'notebook/slide':
    case 'hint/press':
    case 'quality/measured':
    case 'quality/force':
    case 'dev/set-copies':
      return null;
    case 'dev/set-tools':
      // The room is unchanged, but what it offers may not be (the tray and the splitter), so
      // first use runs.
      return { room, events: [] };
  }
}

/**
 * Story 1.15: a stage knows he met the tray in an earlier stage, so it offers the tray at
 * once (room/tray.ts); and once it offers the splitter, it keeps offering it for the rest
 * of the stage, a reset included (room/splitter.ts). The same step when nothing changes.
 */
function withToolMemory(step: RoomStep | null, save: SaveState): RoomStep | null {
  if (!step) return step;
  const { firstUse, tools } = save.progress;
  const room = rememberSplitter(rememberTray(step.room, firstUse), tools);
  return room === step.room ? step : { ...step, room };
}

/** A room step, then what it means for his progress (held in `save`). */
interface Progressed {
  step: RoomStep | null;
  save: SaveState;
}

/**
 * What a room step means beyond the room: a room that restarts earns its tool (room 3:
 * Balance), held in memory until saving arrives in epic 2; and the first time the stage
 * offers a control he hasn't met, it wiggles once and counts as met (room/first-use.ts).
 */
function progress(step: RoomStep | null, save: SaveState): Progressed {
  if (!step) return { step, save };
  const { tools, firstUse } = save.progress;
  const tool = toolEarned(step);
  const earned = tool !== null && !tools.includes(tool);
  const toolsNow = earned ? [...tools, tool] : tools;
  const met = meetControls(step.room, firstUse, toolsNow);
  if (!met && !earned) return { step, save };
  return {
    step: met ? { ...step, room: met.room } : step,
    save: {
      ...save,
      progress: { ...save.progress, tools: toolsNow, firstUse: met ? met.met : firstUse },
    },
  };
}

/**
 * The actions that aren't his: the game's own, the clock's and the dev panel's. Any other
 * that does something to the room restarts the stage's idle clock.
 */
const notHis: ReadonlySet<Action['type']> = new Set<Action['type']>([
  'room/enter',
  'presentation/done',
  'clock/tick',
  'dev/set-tools',
  'dev/set-copies',
  'quality/measured',
  'quality/force',
]);

/**
 * Story 1.16: the tray's and the splitter's steppers set the number a move uses rather than
 * make one, so the hint stays while he sets the number it names.
 */
const toolSettings: ReadonlySet<Action['type']> = new Set<Action['type']>([
  'tray/step',
  'splitter/step',
]);

/**
 * What an action means for the hint button (room/hint.ts): its press; one that ends the
 * hint, an action of his that did something to the room (`changed`), or a room entered; or
 * any other, which leaves it.
 */
function hintAction(action: Action, changed: boolean): HintAction {
  if (action.type === 'hint/press') return 'press';
  if (action.type === 'room/enter') return 'ends';
  const his =
    !notHis.has(action.type) && action.type !== 'notebook/slide' && !toolSettings.has(action.type);
  return his && changed ? 'ends' : 'other';
}

/** His action as the handovers name it (room/handover.ts). */
function handoverMove(action: Action): HandoverMove {
  switch (action.type) {
    case 'dial/set':
      return 'dial';
    case 'tray/drop':
    case 'tray/take':
      return 'tray';
    case 'splitter/split':
      return 'split';
    default:
      return 'other';
  }
}

/**
 * The handover tags' part of an action (story 1.15; room/handover.ts): a stage that has
 * just arrived starts its idle clock at `now`; an action of his that did something
 * restarts it and ends idle, and marks the handover steps it took as met; the clock makes
 * a stage idle after `tuning.hintIdleMs`. `previous` is the room before the action.
 */
function handOver(
  previous: RoomState | null,
  action: Action,
  now: number,
  { step, save }: Progressed,
): Progressed {
  let room = step?.room ?? previous;
  if (!room) return { step, save };
  if (step) room = stampArrival(room, now) ?? room;
  if (step && !notHis.has(action.type)) room = actedAt(room, now);
  if (action.type === 'clock/tick') room = tickIdle(room, now) ?? room;
  const { firstUse, tools } = save.progress;
  const met = step ? meetHandovers(previous, room, handoverMove(action), firstUse, tools) : null;
  const nextSave = met ? { ...save, progress: { ...save.progress, firstUse: met } } : save;
  if (room === (step?.room ?? previous)) return { step, save: nextSave };
  return { step: { room, events: step?.events ?? [] }, save: nextSave };
}

/**
 * A right prediction pays parts into `save.economy`, once per stage (GDD, Prediction; story
 * 1.14). It is read off the room's `PredictionMade` events, so the room reducers know
 * nothing of the economy.
 */
function payPredictions(events: readonly DomainEvent[], save: SaveState): SaveState {
  let { economy } = save;
  for (const event of events) {
    if (event.type !== 'PredictionMade') continue;
    economy = payPrediction(economy, predictionKey(event.roomId, event.stage), event.right);
  }
  return economy === save.economy ? save : { ...save, economy };
}

/** The dev panel sets the tools he has earned (architecture, Debug Tools). */
function withTools(save: SaveState, tools: readonly ToolId[]): SaveState {
  return { ...save, progress: { ...save.progress, tools: [...new Set(tools)] } };
}

/** The root reducer, over a given list of rooms so tests can bring their own. */
export function createReducer(roomList: readonly RoomSpec[] = rooms): Reduce {
  return (state, action, ctx) => {
    const before =
      action.type === 'dev/set-tools' ? withTools(state.save, action.tools) : state.save;
    const change = withToolMemory(
      roomStep(state, action, ctx.now, roomList, before.progress.tools),
      before,
    );
    const progressed = handOver(state.room, action, ctx.now, progress(change, before));
    const { step } = progressed;
    const events: DomainEvent[] = step ? [...step.events] : [];
    const save = payPredictions(events, progressed.save);
    const roomNow = step?.room ?? state.room;
    const hint = hintAfter(
      state.ui.hint,
      hintAction(action, roomNow !== state.room),
      state.room,
      roomNow,
      save.progress.tools,
    );
    const next = produce(state, (draft) => {
      if (step && step.room !== state.room) draft.room = castDraft(step.room);
      if (save !== state.save) draft.save = castDraft(save);
      if (action.type === 'room/enter') draft.ui.screen = 'room';
      // After the last room's restart: the placeholder "to be continued" screen (story 1.13).
      if (step && step.room !== state.room && playedThrough(roomList, step.room)) {
        draft.ui.screen = 'continued';
      }
      if (action.type === 'dev/set-copies') draft.ui.copies = action.copies;
      if (action.type === 'notebook/slide') draft.ui.notebookAside = action.aside;
      if (hint !== state.ui.hint) draft.ui.hint = hint;
      if (action.type === 'quality/measured' || action.type === 'quality/force') {
        draft.ui.quality = reduceQuality(state.ui.quality, action);
      }
    });
    return { state: next, events };
  };
}

export const reduce: Reduce = createReducer();
