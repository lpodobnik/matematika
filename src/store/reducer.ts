// The pure root reducer (architecture, State Management). It never touches React, the
// DOM, storage, audio or the clock: time and randomness come in through ctx, and what
// happened goes out as domain events.

import { castDraft, produce } from 'immer';
import { rooms } from '@/content/rooms';
import { assert } from '@/lib/assert';
import { enterRoom } from '@/room/room';
import type { RoomSpec } from '@/room/types';
import type { DomainEvent } from '@/store/events';
import type { GameState, Reduce } from '@/store/types';

export function initialGameState(): GameState {
  return { room: null, ui: { screen: 'room' } };
}

function findRoom(id: RoomSpec['id'], list: readonly RoomSpec[]): RoomSpec {
  const spec = list.find((room) => room.id === id);
  assert(spec, `no room ${id} in content`);
  return spec;
}

/** The root reducer, over a given list of rooms so tests can bring their own. */
export function createReducer(roomList: readonly RoomSpec[] = rooms): Reduce {
  return (state, action, _ctx) => {
    const events: DomainEvent[] = [];
    const next = produce(state, (draft) => {
      switch (action.type) {
        case 'room/enter': {
          const step = enterRoom(findRoom(action.roomId, roomList));
          draft.room = castDraft(step.room);
          draft.ui.screen = 'room';
          events.push(...step.events);
          break;
        }
      }
    });
    return { state: next, events };
  };
}

export const reduce: Reduce = createReducer();
