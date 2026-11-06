// Saving (story 2.1; architecture, Pattern 4): after the events that change what is kept,
// the game's state goes on the device, synchronously. Exploratory moves (a dial notch, a
// piece moved, a pin dragged, a key typed) fire none of them, so they aren't written.

import type { SaveStorage } from '@/save/storage';
import type { Effect } from '@/store/effects/types';
import type { DomainEventType } from '@/store/events';
import { toSaveV1 } from '@/store/persist';
import type { GameState } from '@/store/types';

/**
 * What writes the save: a committed line, typed or written by Balance; a stage arriving,
 * locking or reset; a pin confirmed (whether or not the prediction pays); a restart; a room
 * left for the map; and
 * any other change to the saved slice (`SaveChanged`: a tool, a first use, the economy, a
 * setting, a new game).
 */
export const SAVE_TRIGGERS: ReadonlySet<DomainEventType> = new Set<DomainEventType>([
  'StageArrived',
  'LineAccepted',
  'StageLocked',
  'StageReset',
  'PredictionMade',
  'RoomRestarted',
  'RoomLeft',
  'SaveChanged',
]);

/**
 * The effect that writes the save to `storage`. Several triggers in one action write once,
 * since they come with the same state. `now` dates a save written before the game has
 * stamped its start, which never happens in play.
 */
export function createSaveEffect(
  storage: Pick<SaveStorage, 'write'>,
  now: () => string = () => new Date().toISOString(),
): Effect {
  let written: GameState | null = null;
  return (event, state) => {
    if (!SAVE_TRIGGERS.has(event.type) || state.ui.screen === 'loading') return;
    if (state === written) return;
    written = state;
    storage.write(toSaveV1(state, now()));
  };
}
