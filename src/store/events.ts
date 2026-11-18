// The one union of domain events (architecture, Pattern 4). Each pure folder defines the
// events its reducers return, since it can't import the store; this file joins them.
// Effects (saving, audio, the play log) listen to these and never to raw state changes.

import type { AreaId } from '@/content/town';
import type { UpgradeEvent } from '@/economy/upgrades';
import type { FightEvent } from '@/fight/types';
import type { GearId, LeadId, LookPieceId, PlayId, SecretId } from '@/hunt/ids';
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
  | { type: 'LineWritten'; lead: PlayId; line: string }
  | { type: 'DoorKnocked'; lead: PlayId; door: number; right: boolean }
  | { type: 'LeadFinished'; lead: PlayId; firstTry: boolean }
  /** He started the lead or knot in play again from its first step. */
  | { type: 'LeadRestarted'; lead: PlayId }
  /** Part 2's moments that only sound: a line in ink, a scene open, the cap off, a trap, caught. */
  | { type: 'LineInked'; lead: PlayId }
  | { type: 'SceneOpened'; lead: PlayId }
  | { type: 'Unmasked'; lead: PlayId }
  | { type: 'TrapSprung'; lead: PlayId }
  | { type: 'Caught'; lead: PlayId }
  /** Part 2's growth: gear and looks bought at Faust's, a cache found with bought gear. */
  | { type: 'GearBought'; gear: GearId; cost: number }
  | { type: 'LookBought'; look: LookPieceId; cost: number }
  | { type: 'SecretFound'; secret: SecretId; parts: number };

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
  'LeadRestarted',
  'LineInked',
  'SceneOpened',
  'Unmasked',
  'TrapSprung',
  'Caught',
  'GearBought',
  'LookBought',
  'SecretFound',
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
