// The store's shapes (architecture, State Management). One store holds the whole game;
// every change goes through dispatch, which calls the pure root reducer with ctx.

import type { Economy } from '@/economy/types';
import type { GuideStep } from '@/fight/guide';
import type { FightState, PageId } from '@/fight/types';
import type { RoomGuideState } from '@/room/guide';
import type { HintState } from '@/room/hint';
import type { SavedRoom } from '@/room/resume';
import type { FirstUseId, IdeaId, RoomId, RoomState, ToolId } from '@/room/types';
import type { Character, Settings, WorkshopSave } from '@/save/schema';

/** A room he sent, as the wall shows it (`SaveV1.workshop`). */
export type SentRoom = WorkshopSave['rooms'][number];

import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import type { FightEnd } from '@/store/fight-end';
import type { QualityState } from '@/store/quality';
import type { RoomDesign, RoomPayload, Solution } from '@/workshop/design';

/** A source of uniform numbers in [0, 1). */
export interface Rng {
  next(): number;
}

/** Time and randomness, handed to reducers so they stay pure. */
export interface Ctx {
  now: number;
  rng: Rng;
}

/**
 * Screens are a field in the store, with no router. `loading` shows from launch until the
 * save is read and the assets are loaded (story 2.1). `map` is the city map (story 2.2),
 * where he goes after every restart and whenever he leaves a room; it replaced story 1.13's
 * "to be continued" screen. `naming` comes once, after room 1's restart (story 2.4).
 * `story` tells a room's lines the first time its restart ends (story 2.5). `fight` is an
 * automaton fight, entered from a lair on the map and left back to it (story 3.1). `shop` is
 * the old mechanic's counter at the workshop, for upgrades (story 3.5). `opening` is the
 * illustrated opening a new game starts with (story 5.0); `map` now shows the town (story
 * 5.0), with the district map a tap away.
 */
export type Screen =
  | 'loading'
  | 'opening'
  | 'room'
  | 'map'
  | 'naming'
  | 'story'
  | 'fight'
  | 'shop'
  | 'workshop'
  | 'friend';

/**
 * Epic 5: where building a room for a friend stands (store/workshop-reducer.ts), in memory
 * only. `design`: he sets up the machine (`workshop` screen); `solve`: he plays it himself in
 * the room screen, his lines kept per machine as each locks; `finish`: solved, he plants a
 * line if he chose to, picks a title and sends it; `sent`: the link is ready; `reply`: a
 * reply link has just stamped a room on the wall (the counter shows it).
 */
export type WorkshopFlow =
  | { step: 'design'; design: RoomDesign | null }
  | { step: 'solve'; design: RoomDesign; solution: Solution }
  | { step: 'finish'; design: RoomDesign; solution: Solution }
  | { step: 'sent'; id: string }
  | { step: 'reply'; id: string };

/**
 * Epic 5: a friend's room opened from a link (`friend` screen, and the room screen while
 * playing). `welcome`, then the intro machine if new (`intro`, then `ready`), then the room
 * (`play`), ending `cracked` or `gave-up`; `broken` for a link that doesn't read. Nothing a
 * friend does is saved.
 */
export interface FriendFlow {
  step: 'welcome' | 'intro' | 'ready' | 'play' | 'cracked' | 'gave-up' | 'broken';
  /** The room, or null for a broken link. */
  room: RoomPayload | null;
  /** The room's id, for the reply link. */
  id: string;
  newToGame: boolean;
}

/**
 * How many copies of the scene the scene area draws side by side: 3 only for the tablet
 * profile, which the dev panel sets up (story 1.13; NFR1's three-machine room).
 */
export type SceneCopies = 1 | 3;

export interface UiState {
  screen: Screen;
  /** While loading: how much of the assets has loaded, 0–1 (story 2.1). */
  loaded: number;
  /**
   * The room whose restart has just ended, so its change plays on the map (story 2.2); null
   * once he travels on.
   */
  fresh: RoomId | null;
  /** On a phone, whether the notebook is pushed aside off the scale. The tablet ignores it. */
  notebookAside: boolean;
  /**
   * The quality setting. The test's pick is saved in `save.settings.quality` (story 2.1), and
   * a launch with a saved pick starts with it and doesn't run the test again. A forced
   * setting never persists.
   */
  quality: QualityState;
  /** The dev panel only: 3 draws the scene three times side by side, for the tablet profile. */
  copies: SceneCopies;
  /**
   * Story 1.16: the hint button's presses in the stage in play, or null; an action of his
   * ends them (room/hint.ts). In memory only: hints are never recorded.
   */
  hint: HintState | null;
  /** How the fight on screen ended and what it paid or cost (store/fight-end.ts), or null. */
  fightEnd: FightEnd | null;
  /**
   * The guided first fight's step (fight/guide.ts), or null when no guide shows. In memory
   * only: a fight resumed on launch picks the guide up again from the fight.
   */
  fightGuide: GuideStep | null;
  /**
   * Story 6.1: where he is in the room guide that shows (room/guide.ts), or null at a
   * topic's first step. In memory only: the topics he has read through are saved, in
   * `save.progress.firstUse`.
   */
  roomGuide: RoomGuideState | null;
  /** The dev panel only: the seed every new fight's dice start from, or null for random. */
  fightSeed: number | null;
  /** Epic 5: building a room in the workshop, or null. */
  workshop: WorkshopFlow | null;
  /** Epic 5: a friend's room from a link, or null in his own game. */
  friend: FriendFlow | null;
}

/**
 * The architecture's `save` slice: everything kept on the device (story 2.1; save/schema.ts,
 * `SaveV1`). The room in progress is kept too, read off `room` as it is written
 * (store/persist.ts). Every change to this slice is written (`SaveChanged`).
 */
export interface SaveState {
  /** ISO 8601: the first launch, set as the game starts; null before. */
  createdAt: string | null;
  /** His apprentice's name and look (story 2.4); empty until then. */
  character: Character;
  progress: {
    /** Rooms whose restart has begun, in the order he finished them. */
    roomsDone: RoomId[];
    /** Tools earned at the end of rooms (room 3 earns Balance). */
    tools: ToolId[];
    /** Controls he has met, so each wiggles only the first time (Pattern 2, First use). */
    firstUse: FirstUseId[];
    /**
     * Rooms he left halfway for the map (story 2.2, FR26): their committed lines, resumed
     * when he comes back. The room in play is never here.
     */
    started: SavedRoom[];
    /** He is on the map (story 2.2): a launch opens the map, not the next room. */
    onMap: boolean;
    /** Rooms whose story lines he has seen, in order: the city's log (story 2.5). */
    told: RoomId[];
    /** Ideas whose explanation card he has seen, in order (story 2.6). */
    ideasSeen: IdeaId[];
    /** Torn logbook pages returned by fights, in the order he won them (story 3.4). */
    tornPages: PageId[];
    /** He has seen the opening (story 5.0; `SaveV1.progress.introSeen`). */
    introSeen: boolean;
  };
  /**
   * Parts, upgrades and piles (`createEconomy()`). From story 1.14 a right prediction pays
   * into it, once per stage (economy/predictions.ts); fights spend it from epic 3.
   */
  economy: Economy;
  /** Muted (audio comes in epic 6), and the frame-time test's quality pick. */
  settings: Settings;
  /** Epic 5: the rooms he sent, with their stamps (`SaveV1.workshop`). */
  workshop: WorkshopSave;
}

/** The game's state: the architecture's four slices, `save`, `room`, `fight` and `ui`. */
export interface GameState {
  save: SaveState;
  room: RoomState | null;
  /**
   * The fight in play (story 3.1), or null. Saved while in progress (`SaveV1.fight`); once it
   * ends it is settled at once and stays here only to show how it ended.
   */
  fight: FightState | null;
  ui: UiState;
}

export type Reduce = (
  state: GameState,
  action: Action,
  ctx: Ctx,
) => { state: GameState; events: DomainEvent[] };
