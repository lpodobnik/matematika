import type { LairId, LairSpec } from '@/fight/types';
import type { HuntMark } from '@/hunt/ids';

/**
 * The four automaton lairs (GDD, Automaton fights and Level Structure). Their map nodes
 * hang off rooms 2, 5, 8 and 12, which the map content adds in epic 2. The armour 30, 45
 * and 60 automatons each carry one torn logbook page.
 *
 * `levels` is each one's armour at levels 2 and 3, when its dice are squared and then cubed
 * (tuning.fight.levels). Set by `fight/balance.test.ts` so that each automaton is harder than
 * the one before, and each level harder than the last.
 */
export const lairs: Readonly<Record<LairId, LairSpec>> = {
  'lair-20': { id: 'lair-20', armour: 20, levels: [250, 1500], baseParts: 3, page: null },
  'lair-30': { id: 'lair-30', armour: 30, levels: [300, 1600], baseParts: 4, page: 'page-1' },
  'lair-45': { id: 'lair-45', armour: 40, levels: [320, 1800], baseParts: 5, page: 'page-2' },
  'lair-60': { id: 'lair-60', armour: 60, levels: [350, 2000], baseParts: 6, page: 'page-3' },
  // Part 2 (GDD, Fights in part 2): three in the upper district, with no lead and no page.
  'lair-70': { id: 'lair-70', armour: 70, levels: [1400, 30_000], baseParts: 7, page: null },
  'lair-120': { id: 'lair-120', armour: 120, levels: [1900, 45_000], baseParts: 8, page: null },
  'lair-140': { id: 'lair-140', armour: 140, levels: [2400, 60_000], baseParts: 9, page: null },
};

/** Part 1's lairs, from the weakest automaton to the strongest. */
export const PART_ONE_LAIRS: readonly LairId[] = ['lair-20', 'lair-30', 'lair-45', 'lair-60'];

/** Part 2's, in the order he meets them. */
export const PART_TWO_LAIRS: readonly LairId[] = ['lair-70', 'lair-120', 'lair-140'];

/**
 * What opens the street each of part 2's automatons prowls (content/town.ts): Arhivska ulica
 * with the map, before the coat; Ulica brava and Pusta ulica after it, when brackets are sold.
 */
export const partTwoLairOpens: Readonly<Partial<Record<LairId, HuntMark>>> = {
  'lair-70': 'map',
  'lair-120': 'k3',
  'lair-140': 'l12',
};

/** Every lair, from the weakest automaton to the strongest. */
export const LAIR_ORDER: readonly LairId[] = [...PART_ONE_LAIRS, ...PART_TWO_LAIRS];
