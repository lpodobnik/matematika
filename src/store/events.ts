// The one union of domain events (architecture, Pattern 4). Each pure folder defines the
// events its reducers return, since it can't import the store; this file joins them.
// Effects (saving, audio, the play log) listen to these and never to raw state changes.

import type { AreaId } from '@/content/town';
import type { UpgradeEvent } from '@/economy/upgrades';
import type { FightEvent } from '@/fight/types';
import type { LeadId } from '@/hunt/ids';
import type { TrailId } from '@/hunt/trail';
import type { RoomEvent } from '@/room/events';
import type { RoomSpec } from '@/room/types';

/**
 * The root reducer's own events. `SaveChanged` (story 2.1): the saved slice changed (a tool,
 * a first use, the economy, a setting, a new game, a room left halfway), so the save is
 * written. `RoomLeft` (story 2.2): he left a room for the map before finishing it.
 * `TownAreaShown` (story 6.2): the town shows this street, or none (audio: its loops).
 */
export type StoreEvent =
  | { type: 'SaveChanged' }
  | { type: 'RoomLeft'; roomId: RoomSpec['id'] }
  | { type: 'TownAreaShown'; area: AreaId | null }
  | { type: 'GateOpened' }
  | { type: 'LittleOneNamed' }
  | { type: 'LeadPicked'; lead: LeadId }
  | { type: 'LessonSeen'; lead: LeadId }
  | { type: 'FixMade'; lead: LeadId }
  | { type: 'LineWritten'; lead: TrailId; line: string }
  | { type: 'DoorKnocked'; lead: TrailId; door: number; right: boolean }
  | { type: 'LeadFinished'; lead: TrailId; firstTry: boolean };

export type DomainEvent = RoomEvent | StoreEvent | FightEvent | UpgradeEvent;
export type DomainEventType = DomainEvent['type'];

/** Events that are not the room's own: the store's, the fights' and the upgrades'. */
const notRoom: ReadonlySet<DomainEventType> = new Set<DomainEventType>([
  'SaveChanged',
  'RoomLeft',
  'TownAreaShown',
  'GateOpened',
  'LittleOneNamed',
  'LeadPicked',
  'LessonSeen',
  'FixMade',
  'LineWritten',
  'DoorKnocked',
  'LeadFinished',
  'FightStarted',
  'FightLeft',
  'DiceRolled',
  'StrikeLanded',
  'FightEnded',
  'TornPageReturned',
  'UpgradeBought',
]);

/** Whether an event is the room's own rather than the store's, a fight's or an upgrade's. */
export function isRoomEvent(event: DomainEvent): event is RoomEvent {
  return !notRoom.has(event.type);
}
