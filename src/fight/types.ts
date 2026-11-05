// Types for automaton fights (GDD, Automaton fights; architecture, State Transitions).

/** Lair ids follow the architecture's naming: the armour of the automaton that lives there. */
export type LairId = 'lair-20' | 'lair-30' | 'lair-45' | 'lair-60';

/** The three torn logbook pages, in story order (narrative design, Found Documents). */
export type PageId = 'page-1' | 'page-2' | 'page-3';

/** One lair as content data (`src/content/lairs.ts`). */
export interface LairSpec {
  id: LairId;
  /** Armour the automaton starts with. */
  armour: number;
  /** Parts a win pays before unspent steam is added. */
  baseParts: number;
  /** The torn page this automaton carries, returned on the first win; null if none. */
  page: PageId | null;
}

/** The fight's state machine (architecture, State Transitions). */
export type FightPhase = 'roll' | 'place' | 'set' | 'strike' | 'won' | 'lost';

/** Where a die can go: blade `a`, charge `b`, reach (the most blows this round). */
export type Slot = 'blade' | 'charge' | 'reach';

/** A fight's limits at its start, after upgrades. */
export interface FightLimits {
  /** Dice rolled each round; three of them are placed, the rest are discarded. */
  dice: number;
  hull: number;
  steam: number;
}

/** One resolved strike, for the banner (`6 · 3 + 2 = 20`) and the play log. */
export interface StrikeRecord {
  round: number;
  /** Blade `a`. */
  blade: number;
  /** Charge `b`. */
  charge: number;
  /** Blows `x`. */
  blows: number;
  /** `a · x + b`. */
  damage: number;
  armourBefore: number;
  /** Never below 0. */
  armourAfter: number;
  /** Armour landed on exactly 0. */
  clean: boolean;
  /** Armour was left, so the automaton dented him. */
  dented: boolean;
}

export type LossReason = 'hull' | 'steam' | 'left';

export type FightOutcome =
  | { won: true; clean: boolean; reward: number }
  | { won: false; reason: LossReason };

/**
 * A fight in progress. Plain data, so it is saved as it is (`SaveV1.fight`) after every
 * strike and resumed on reload (ADR-8). The dice come from `rng`, the state of the fight's
 * own seeded generator, so a resumed fight rolls exactly what it would have rolled.
 */
export interface FightState {
  lairId: LairId;
  /** Copied from the lair at the start, so a saved fight needs no content to finish. */
  baseParts: number;
  phase: FightPhase;
  limits: FightLimits;
  /** Armour left. */
  armour: number;
  /** Dents he can still take. */
  hull: number;
  /** Steam left. */
  steam: number;
  /** The round in play, from 1; 0 before the first roll. */
  round: number;
  /** State of the fight's seeded generator (`fight/rng.ts`). */
  rng: number;
  /** This round's roll, each 1–6; empty before the first roll. */
  dice: number[];
  /** Index into `dice` of the die in each slot, or null. */
  slots: Record<Slot, number | null>;
  /** Blows set on the dial, `x`. */
  blows: number;
  /** Strikes made so far. Leaving is free only while this is 0. */
  strikes: number;
  lastStrike: StrikeRecord | null;
  /** Set when the phase is 'won' or 'lost'. */
  outcome: FightOutcome | null;
}

export type FightAction =
  | { type: 'fight/roll' }
  | { type: 'fight/place'; die: number; slot: Slot }
  | { type: 'fight/unplace'; slot: Slot }
  | { type: 'fight/blows'; x: number }
  | { type: 'fight/strike' }
  | { type: 'fight/leave' };

/**
 * Domain events from the fight (architecture, Pattern 4). `StrikeLanded` is the save
 * trigger for ADR-8; `FightEnded` comes from settling the fight, with `parts` the change
 * in his parts: reward plus recovered pile on a win, minus the dropped parts on a loss.
 */
export type FightEvent =
  | { type: 'DiceRolled'; lairId: LairId; dice: number[] }
  | { type: 'StrikeLanded'; lairId: LairId; strike: StrikeRecord }
  | { type: 'FightEnded'; lairId: LairId; won: boolean; parts: number }
  | { type: 'TornPageReturned'; lairId: LairId; page: PageId };
