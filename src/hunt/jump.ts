// The dev panel's jumps into part 2 (architecture, The gate and the switch): a save as it would be
// had he played up to there, for Luka to look at any lead without playing the ones before it.

import type { BeatId, KnotId, LeadId, RuleGuardId } from '@/hunt/ids';
import { acts, type TrailId } from '@/hunt/trail';
import type { CompanionSave, HuntSave } from '@/hunt/types';

export type JumpPlace = 'gate' | 'street' | TrailId;

/** Everything on the trail, in the order he'd meet it. */
export const trailOrder: readonly TrailId[] = acts.flatMap((act) => [
  ...(act.first ? [act.first] : []),
  ...act.leads,
  ...(act.last ? [act.last] : []),
  ...(act.knot ? [act.knot] : []),
]);

/** Where the dev panel can jump to. */
export const jumpPlaces: readonly JumpPlace[] = ['gate', 'street', ...trailOrder];

/** The hunt as it stands on arriving there: everything before it done. */
export function huntAt(
  hunt: HuntSave,
  companion: CompanionSave | null,
  place: JumpPlace,
  /** What finishing each thing on the trail marks and beats. */
  facts: {
    beatsOf(id: TrailId): readonly BeatId[];
    guardOf(id: TrailId): RuleGuardId | null;
  },
): { hunt: HuntSave; companion: CompanionSave | null } {
  if (place === 'gate') return { hunt: { ...hunt, gateOpened: false, scene: null }, companion };
  const before = place === 'street' ? [] : trailOrder.slice(0, trailOrder.indexOf(place));
  const isLead = (id: TrailId): id is LeadId => id.startsWith('l');
  const leadsDone = before.filter(isLead);
  const knotsDone = before.filter((id): id is KnotId => !isLead(id));
  const hooked = knotsDone.includes('k1');
  return {
    hunt: {
      ...hunt,
      gateOpened: true,
      leadsStarted: leadsDone,
      leadsDone,
      knotsDone,
      sealed: [],
      thread: { target: null, finishedSince: 0 },
      guards: before.flatMap((id) => {
        const guard = facts.guardOf(id);
        return guard ? [guard] : [];
      }),
      beats: ['foundry', 'named', 'map-given', ...before.flatMap((id) => facts.beatsOf(id))],
      scene: null,
    },
    companion: {
      name: companion?.name ?? 'Bip',
      looks: companion?.looks ?? [],
      wearing: companion?.wearing ?? [],
      gear: hooked ? ['hook'] : [],
      taught: companion?.taught ?? [],
    },
  };
}
