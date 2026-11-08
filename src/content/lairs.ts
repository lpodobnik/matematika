import type { LairId, LairSpec } from '@/fight/types';

/**
 * The four automaton lairs (GDD, Automaton fights and Level Structure). Their map nodes
 * hang off rooms 2, 5, 8 and 12, which the map content adds in epic 2. The armour 30, 45
 * and 60 automatons each carry one torn logbook page.
 */
export const lairs: Readonly<Record<LairId, LairSpec>> = {
  'lair-20': { id: 'lair-20', armour: 20, baseParts: 3, page: null },
  'lair-30': { id: 'lair-30', armour: 30, baseParts: 4, page: 'page-1' },
  'lair-45': { id: 'lair-45', armour: 40, baseParts: 5, page: 'page-2' },
  'lair-60': { id: 'lair-60', armour: 60, baseParts: 6, page: 'page-3' },
};

/** Lairs from the weakest automaton to the strongest. */
export const LAIR_ORDER: readonly LairId[] = ['lair-20', 'lair-30', 'lair-45', 'lair-60'];
