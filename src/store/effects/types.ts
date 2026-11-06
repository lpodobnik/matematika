import type { DomainEvent } from '@/store/events';
import type { GameState } from '@/store/types';

/** Reacts to one domain event, with the state the reducer just produced. */
export type Effect = (event: DomainEvent, state: GameState) => void;
