// The pure root reducer (architecture, State Management). It never touches React, the
// DOM, storage, audio or the clock: time and randomness come in through ctx, and what
// happened goes out as domain events.

import { castDraft, produce } from 'immer';
import { rooms } from '@/content/rooms';
import { assert } from '@/lib/assert';
import { setDial } from '@/room/dial';
import { deleteToken, enterLine, typeToken } from '@/room/notebook';
import { finishPresentation, nextRoom, resetStage, tickClock, touchMachine } from '@/room/phases';
import { enterRoom, type RoomStep } from '@/room/room';
import type { RoomSpec } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import type { GameState, Reduce } from '@/store/types';

export function initialGameState(): GameState {
  return { room: null, ui: { screen: 'room', notebookAside: false } };
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
 * room, in a phase where the action does nothing, or for an action outside the room.
 */
function roomStep(
  state: GameState,
  action: Action,
  now: number,
  roomList: readonly RoomSpec[],
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
    case 'notebook/type':
      return typeToken(room, action.token);
    case 'notebook/delete':
      return deleteToken(room);
    case 'notebook/enter':
      return enterLine(room, now);
    case 'notebook/slide':
      return null;
  }
}

/** The root reducer, over a given list of rooms so tests can bring their own. */
export function createReducer(roomList: readonly RoomSpec[] = rooms): Reduce {
  return (state, action, ctx) => {
    const step = roomStep(state, action, ctx.now, roomList);
    const events: DomainEvent[] = step ? [...step.events] : [];
    const next = produce(state, (draft) => {
      if (step) draft.room = castDraft(step.room);
      if (action.type === 'room/enter') draft.ui.screen = 'room';
      if (action.type === 'notebook/slide') draft.ui.notebookAside = action.aside;
    });
    return { state: next, events };
  };
}

export const reduce: Reduce = createReducer();
