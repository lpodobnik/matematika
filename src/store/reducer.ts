// The pure root reducer (architecture, State Management). It never touches React, the
// DOM, storage, audio or the clock: time and randomness come in through ctx, and what
// happened goes out as domain events.

import { castDraft, produce } from 'immer';
import { rooms } from '@/content/rooms';
import { assert } from '@/lib/assert';
import { setDial } from '@/room/dial';
import { meetControls } from '@/room/first-use';
import { deleteToken, enterLine, typeToken } from '@/room/notebook';
import {
  finishPresentation,
  nextRoom,
  resetStage,
  tickClock,
  toolEarned,
  touchMachine,
} from '@/room/phases';
import { confirmPin, setPin } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import { liftSplitter, splitBothPans, stepSplitter } from '@/room/splitter';
import { dropOnPan, stepTray, takeOffPan } from '@/room/tray';
import type { RoomSpec, ToolId } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { initialQuality, reduceQuality } from '@/store/quality';
import type { GameState, Reduce, SaveState } from '@/store/types';

export function initialGameState(): GameState {
  return {
    save: { progress: { tools: [], firstUse: [] } },
    room: null,
    ui: { screen: 'room', notebookAside: false, quality: initialQuality },
  };
}

function findRoom(id: RoomSpec['id'], list: readonly RoomSpec[]): RoomSpec {
  const spec = list.find((room) => room.id === id);
  assert(spec, `no room ${id} in content`);
  return spec;
}

/**
 * A room that is done hands over to the next room in content (Pattern 2: "the next room
 * loads"), which arrives at its first stage. The last room stays done.
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
      return dropOnPan(room, tools, action.side, action.kind);
    case 'tray/take':
      return takeOffPan(room, tools, action.side, action.key);
    case 'splitter/step':
      return stepSplitter(room, tools, action.by);
    case 'splitter/split':
      return splitBothPans(room, tools);
    case 'splitter/lift':
      return liftSplitter(room);
    case 'notebook/type':
      return typeToken(room, action.token);
    case 'notebook/delete':
      return deleteToken(room);
    case 'notebook/enter':
      return enterLine(room, now);
    case 'notebook/slide':
    case 'quality/measured':
    case 'quality/force':
      return null;
    case 'dev/set-tools':
      // The room is unchanged, but what it offers may not be (the tray and the splitter), so
      // first use runs.
      return { room, events: [] };
  }
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

/** The dev panel sets the tools he has earned (architecture, Debug Tools). */
function withTools(save: SaveState, tools: readonly ToolId[]): SaveState {
  return { ...save, progress: { ...save.progress, tools: [...new Set(tools)] } };
}

/** The root reducer, over a given list of rooms so tests can bring their own. */
export function createReducer(roomList: readonly RoomSpec[] = rooms): Reduce {
  return (state, action, ctx) => {
    const before =
      action.type === 'dev/set-tools' ? withTools(state.save, action.tools) : state.save;
    const change = roomStep(state, action, ctx.now, roomList, before.progress.tools);
    const { step, save } = progress(change, before);
    const events: DomainEvent[] = step ? [...step.events] : [];
    const next = produce(state, (draft) => {
      if (step && step.room !== state.room) draft.room = castDraft(step.room);
      if (save !== state.save) draft.save = castDraft(save);
      if (action.type === 'room/enter') draft.ui.screen = 'room';
      if (action.type === 'notebook/slide') draft.ui.notebookAside = action.aside;
      if (action.type === 'quality/measured' || action.type === 'quality/force') {
        draft.ui.quality = reduceQuality(state.ui.quality, action);
      }
    });
    return { state: next, events };
  };
}

export const reduce: Reduce = createReducer();
