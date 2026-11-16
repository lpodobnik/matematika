// Corrected streets (GDD, Exploration and the trail map): after the wandering-off and after Knot 2,
// one finished street with nothing open turns grey again, under the First Automaton's notice. He
// can win it back at any time with a Knock of two clues. Nothing else waits on it. Pure.

import { type CorrectionId, correctionIds, type HuntStreetId, type KnotId } from '@/hunt/ids';

interface Correction {
  street: HuntStreetId;
  /** The knot whose end greys it. */
  after: KnotId;
}

/**
 * The street each correction greys. When it happens, that street is always finished with nothing
 * open: one of Act 1's streets, once the trail has moved on.
 */
export const corrections: Readonly<Record<CorrectionId, Correction>> = {
  'fix-u2': { street: 'u2', after: 'w1' },
  'fix-u1': { street: 'u1', after: 'k2' },
};

/** The street the end of a knot corrects, if it corrects one. */
export function correctedBy(knot: KnotId): HuntStreetId | null {
  const id = correctionIds.find((each) => corrections[each].after === knot);
  return id ? corrections[id].street : null;
}

/** The corrections he can play now: their streets are grey. */
export function openCorrections(corrected: readonly HuntStreetId[]): CorrectionId[] {
  return correctionIds.filter((id) => corrected.includes(corrections[id].street));
}
