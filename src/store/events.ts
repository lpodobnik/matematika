// The one union of domain events (architecture, Pattern 4). Each pure folder defines the
// events its reducers return, since it can't import the store; this file joins them.
// Effects (saving, audio, the play log) listen to these and never to raw state changes.

import type { RoomEvent } from '@/room/events';

export type DomainEvent = RoomEvent;
export type DomainEventType = DomainEvent['type'];
