// What part 2 keeps in the save (architecture, Part 2 Architecture, Save). `HuntSave` and
// `CompanionSave` have fixed keys, set to null or empty and never deleted: the storage layer
// merges each top-level object one level deep over the save as first read (`overKept`), so a
// deleted key would come back. Maps sit one level further down, where they're replaced whole.

import type {
  BeatId,
  GearId,
  HuntStreetId,
  KnotId,
  LeadId,
  LookPieceId,
  RuleGuardId,
  SecretId,
} from '@/hunt/ids';

/** One fix he made: what he showed the little one. Kept all year, for the finale. */
export interface TaughtEntry {
  lead: LeadId;
  /** Which of the lead's mistakes it was. */
  mistake: string;
  /** The right line he wrote. */
  line: string;
  /** ISO 8601. */
  at: string;
}

/** The little one (story 7.4), or null before he has met it. */
export interface CompanionSave {
  /** Stays on the device: never in a link or a backup. Null until he names it. */
  name: string | null;
  looks: LookPieceId[];
  wearing: LookPieceId[];
  gear: GearId[];
  taught: TaughtEntry[];
}

/** One line on a lead's notebook page. */
export interface PageLine {
  text: string;
  kind: 'clue' | 'his' | 'working';
  struck: boolean;
}

/** The search party on the trail map (hunt/thread.ts). */
export interface ThreadState {
  /** The lead it's heading for, shown on the map beforehand; null when it has none. */
  target: LeadId | null;
  /** Leads he has finished since it last moved, in this act. */
  finishedSince: number;
}

/** The scene in play, kept in the save so that resuming needs no replay. */
export interface SavedScene {
  /** The lead or knot it belongs to, or `gate`. */
  of: LeadId | KnotId | 'gate';
  /** Which of its scenes. */
  index: number;
  /** The scene's own state. Checked against its spec on load (hunt/lead.ts). */
  state: unknown;
}

export interface HuntSave {
  /** A ratchet: once open, the gate stays open, whatever happens to the lairs. */
  gateOpened: boolean;
  leadsStarted: LeadId[];
  leadsDone: LeadId[];
  knotsDone: KnotId[];
  sealed: LeadId[];
  thread: ThreadState;
  corrected: HuntStreetId[];
  secrets: SecretId[];
  guards: RuleGuardId[];
  /** First-try rewards already paid, so that a reload can't pay twice. */
  paid: string[];
  beats: BeatId[];
  forged: 'open' | 'struck' | 'followed';
  pages: Partial<Record<LeadId | KnotId, PageLine[]>>;
  /** Whether each lead's scene was finished on the first try, for Luka's view. */
  firstTries: Partial<Record<LeadId | KnotId, boolean>>;
  /** Part 2's story lines he has seen, in order: the city's log. */
  told: string[];
  scene: SavedScene | null;
  /** Leads he has left for another: each picks up where he left it. */
  parked: Partial<Record<LeadId | KnotId, SavedScene>>;
}

/** The hunt before it begins. */
export function newHunt(): HuntSave {
  return {
    gateOpened: false,
    leadsStarted: [],
    leadsDone: [],
    knotsDone: [],
    sealed: [],
    thread: { target: null, finishedSince: 0 },
    corrected: [],
    secrets: [],
    guards: [],
    paid: [],
    beats: [],
    forged: 'open',
    pages: {},
    firstTries: {},
    told: [],
    scene: null,
    parked: {},
  };
}
