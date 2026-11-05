// What a finished fight does to his parts, the piles, the lairs and the torn pages
// (GDD, Automaton fights and Level Structure; ADR-13). The store calls `settleFight` once,
// in the same step that clears `SaveV1.fight`, so a reload can never settle a fight twice.

import { tuning } from '@/config/tuning';
import { earnParts } from '@/economy/parts';
import type { Economy } from '@/economy/types';
import type { FightEvent, FightState, LairId, LairSpec, PageId } from './types';

/** What a fight can change in the save. */
export interface FightLedger {
  economy: Economy;
  /** `SaveV1.progress.tornPages`. */
  tornPages: PageId[];
}

export interface Settlement {
  ledger: FightLedger;
  events: FightEvent[];
  /** Parts the win paid, before the pile. */
  reward: number;
  /** Parts recovered from the pile by the win. */
  recovered: number;
  /** Parts the loss dropped in the pile. */
  dropped: number;
  /** The torn page returned by this win, if it was the first. */
  page: PageId | null;
}

const minute = 60_000;

/** Parts a loss drops in the pile: a quarter of his unspent parts, rounded down. */
export function droppedParts(unspentParts: number): number {
  return Math.floor(unspentParts / tuning.fight.pileDivisor);
}

/** When an automaton beaten at `now` (ms since the epoch) rewinds, as ISO 8601. */
export function rewindsAt(now: number): string {
  return new Date(now + tuning.fight.lairRewindMinutes * minute).toISOString();
}

/**
 * A lair can be fought unless its automaton is still winding down after a win. An
 * unreadable time counts as rewound, so a damaged save can never lock a lair for good.
 */
export function lairAwake(economy: Economy, lairId: LairId, now: number): boolean {
  const lair = economy.lairs[lairId];
  return lair === undefined || !(Date.parse(lair.rewindsAt) > now);
}

export function settleFight(
  ledger: FightLedger,
  fight: FightState,
  lair: LairSpec,
  now: number,
): Settlement {
  const outcome = fight.outcome;
  if (!outcome || (fight.phase !== 'won' && fight.phase !== 'lost')) {
    throw new Error(`Only a finished fight can be settled, not one in phase ${fight.phase}`);
  }
  if (lair.id !== fight.lairId) {
    throw new Error(`Fight at ${fight.lairId} settled with lair ${lair.id}`);
  }
  const { economy } = ledger;
  const pile = economy.piles[lair.id] ?? 0;

  if (outcome.won) {
    const piles = { ...economy.piles };
    delete piles[lair.id];
    const next: Economy = {
      ...earnParts(economy, outcome.reward + pile),
      piles,
      lairs: { ...economy.lairs, [lair.id]: { rewindsAt: rewindsAt(now) } },
    };
    const page = lair.page !== null && !ledger.tornPages.includes(lair.page) ? lair.page : null;
    const events: FightEvent[] = [
      { type: 'FightEnded', lairId: lair.id, won: true, parts: outcome.reward + pile },
    ];
    if (page) events.push({ type: 'TornPageReturned', lairId: lair.id, page });
    return {
      ledger: { economy: next, tornPages: page ? [...ledger.tornPages, page] : ledger.tornPages },
      events,
      reward: outcome.reward,
      recovered: pile,
      dropped: 0,
      page,
    };
  }

  const dropped = droppedParts(economy.parts);
  const next: Economy =
    dropped === 0
      ? economy
      : {
          ...economy,
          parts: economy.parts - dropped,
          piles: { ...economy.piles, [lair.id]: pile + dropped },
        };
  return {
    ledger: { economy: next, tornPages: ledger.tornPages },
    events: [{ type: 'FightEnded', lairId: lair.id, won: false, parts: -dropped }],
    reward: 0,
    recovered: 0,
    dropped,
    page: null,
  };
}
