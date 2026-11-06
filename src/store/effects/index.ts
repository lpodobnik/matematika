// The effects registry (architecture, Pattern 4). Effects listen to domain events;
// components never call them. Saving joins in story 2.1; audio (epic 6) and the play log
// (story 2.11) join here as modules too.

import { saveStorage } from '@/save/storage';
import { createSaveEffect } from '@/store/effects/save';
import type { Effect } from '@/store/effects/types';
import type { DomainEvent } from '@/store/events';
import type { GameState } from '@/store/types';

export type { Effect } from '@/store/effects/types';

/**
 * The game's effects. The save storage writes nothing until main.tsx has read the save at
 * launch, so a store made in a test never writes to the device.
 */
export const effects: readonly Effect[] = [createSaveEffect(saveStorage)];

/** Hands each event, in order, to each effect, in order. */
export function runEffects(
  events: readonly DomainEvent[],
  state: GameState,
  registry: readonly Effect[] = effects,
): void {
  for (const event of events) {
    for (const effect of registry) effect(event, state);
  }
}
