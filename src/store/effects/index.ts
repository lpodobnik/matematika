// The effects registry (architecture, Pattern 4). Saving (epic 2), audio (epic 6) and the
// play log (epic 2) join as modules in this folder and listen to domain events; components
// never call them. Epic 1 has none yet.

import type { DomainEvent } from '@/store/events';
import type { GameState } from '@/store/types';

/** Reacts to one domain event, with the state the reducer just produced. */
export type Effect = (event: DomainEvent, state: GameState) => void;

export const effects: readonly Effect[] = [];

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
