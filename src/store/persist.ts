// Between the store and the save on the device (story 2.1): the game's state as `SaveV1`,
// and a read save as the store's `save` slice and the room to resume. The room in progress
// is read off `room` as it is written (room/resume.ts), never kept twice in the store.

import { createEconomy } from '@/economy/parts';
import { fightInProgress } from '@/fight/fight';
import type { FightState } from '@/fight/types';
import { newHunt } from '@/hunt/types';
import { type SavedRoom, savedRoomOf } from '@/room/resume';
import { currentVersion, type SaveV1 } from '@/save/schema';
import type { GameState, SaveState } from '@/store/types';

/** The saved slice of a new game. `createdAt` is set as the game starts. */
export function newSave(createdAt: string | null = null): SaveState {
  return {
    createdAt,
    character: { name: null, look: null },
    progress: {
      roomsDone: [],
      tools: [],
      firstUse: [],
      started: [],
      onMap: false,
      told: [],
      ideasSeen: [],
      tornPages: [],
      introSeen: false,
    },
    economy: createEconomy(),
    settings: { muted: false, quality: null },
    workshop: { rooms: [] },
    hunt: newHunt(),
    companion: null,
  };
}

/** The game's state as it goes on the device. `now` (ISO 8601) stands in for a missing `createdAt`. */
export function toSaveV1(state: GameState, now: string): SaveV1 {
  const { save } = state;
  return {
    v: currentVersion,
    createdAt: save.createdAt ?? now,
    character: save.character,
    progress: { ...save.progress, room: savedRoomOf(state.room) },
    economy: save.economy,
    // A fight that has ended is settled in the same step, so it is never saved (ADR-8).
    fight: fightInProgress(state.fight) ? state.fight : null,
    settings: save.settings,
    workshop: save.workshop,
    hunt: save.hunt,
    companion: save.companion,
  };
}

/** A save read from the device, as the store's slice and the room and fight to resume. */
export function fromSaveV1(save: SaveV1): {
  save: SaveState;
  room: SavedRoom | null;
  fight: FightState | null;
} {
  const { room, ...progress } = save.progress;
  return {
    save: {
      createdAt: save.createdAt,
      character: save.character,
      progress,
      economy: save.economy,
      settings: save.settings,
      workshop: save.workshop,
      hunt: save.hunt,
      companion: save.companion,
    },
    room,
    fight: save.fight,
  };
}
