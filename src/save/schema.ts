// The save's shape on the device (story 2.1; architecture, Data Persistence and `SaveV1`).
// One JSON value under `matematika:save`, carrying its version `v`. Fields join the save
// as their stories need them (the map's node, the city log, fights, the workshop); a field
// a save lacks takes its default on load (save/decode.ts), so adding one needs no new
// version. A new version, with a migration, is only for a change an old save can't read.

import type { LookId } from '@/city/character';
import type { Economy } from '@/economy/types';
import type { FightState, PageId } from '@/fight/types';
import { firstPlayer, playerKeys } from '@/lib/player';
import type { SavedRoom } from '@/room/resume';
import type { FirstUseId, IdeaId, RoomId, ToolId } from '@/room/types';

/** A reply link's stamp on a room he sent (epic 5): the friend cracked it, or gave up. */
export type Stamp = 'cracked' | 'uncracked';

/** A room he sent (epic 5; architecture, `SaveV1.workshop`): it hangs on the workshop wall. */
export interface SentRoom {
  /** The room's id: the hash of its link's bytes (links/room-link.ts, `roomIdOf`). */
  id: string;
  /** The link's data, `<data>` in `#s=<data>`, so the wall can show the link again. */
  payload: string;
  /** Its name: his own words, or (older rooms) an index in `hr.workshop.titles`. */
  title: number | string;
  /** The last reply's stamp, or null before any reply. */
  stamp: Stamp | null;
}

/** The most rooms the wall keeps: the oldest go first. */
export const maxSentRooms = 40;

/** The workshop's part of the save (epic 5): the rooms he sent, oldest first. */
export interface WorkshopSave {
  rooms: SentRoom[];
}

/** The first player's save; each other player has their own (lib/player.ts). */
export const saveKey = playerKeys(firstPlayer).save;

/** The first player's prefix for a save that can't be read, kept for Luka to recover. */
export const corruptKeyPrefix = playerKeys(firstPlayer).corruptPrefix;

export const currentVersion = 1;

/** The frame-time test's pick (store/quality.ts). A setting forced from the dev panel is never saved. */
export type QualityPick = 'high' | 'medium' | 'low';

export const qualityPicks: readonly QualityPick[] = ['high', 'medium', 'low'];

/** His apprentice (story 2.4): empty until he names it and picks a look. */
export interface Character {
  name: string | null;
  look: LookId | null;
}

export interface Settings {
  muted: boolean;
  quality: QualityPick | null;
}

export interface SaveProgress {
  /** Rooms whose restart has begun, in the order he finished them. */
  roomsDone: RoomId[];
  /** Tools earned at the end of rooms (room 3 earns Balance). */
  tools: ToolId[];
  /** Controls and handover steps he has met, so each shows only the first time. */
  firstUse: FirstUseId[];
  /** The room he is in, with its committed lines; null when he is on the map. */
  room: SavedRoom | null;
  /** Rooms he left halfway for the map, with their committed lines (story 2.2). */
  started: SavedRoom[];
  /**
   * He is on the map (story 2.2). With no room in progress and this false, he was between
   * rooms, in a restart: a launch goes on to the next room.
   */
  onMap: boolean;
  /**
   * Rooms whose story lines he has seen, in that order: the city's log (story 2.5). A room
   * finished but not yet here tells its lines before anything else.
   */
  told: RoomId[];
  /** Ideas whose explanation card he has seen, in that order (story 2.6). */
  ideasSeen: IdeaId[];
  /** Torn logbook pages returned by fights, in the order he won them (story 3.4). */
  tornPages: PageId[];
  /**
   * He has seen the opening (story 5.0). A save from before it hasn't, so it shows once.
   */
  introSeen: boolean;
}

export interface SaveV1 {
  v: 1;
  /** ISO 8601: the first launch that wrote it. */
  createdAt: string;
  character: Character;
  progress: SaveProgress;
  economy: Economy;
  /**
   * The fight in progress (story 3.1; ADR-8): saved as it starts, after each roll and after
   * each strike, and resumed on reload. Null on the map, in a room, and once a fight ends.
   */
  fight: FightState | null;
  settings: Settings;
  /** Epic 5: the rooms he sent, with their stamps. A save from before has none. */
  workshop: WorkshopSave;
}
