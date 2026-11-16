// What Faust sells for the little one (GDD, The little one: gear; Economy in part 2), bought
// with parts like the fight upgrades. Bought gear opens only Kristijan's caches, never a lead:
// parts never open the way forward (content test in content/secrets.test.ts). Looks are only
// for looking good: one paint and one hat at a time.

import { tuning } from '@/config/tuning';
import { spendParts } from '@/economy/parts';
import type { Economy } from '@/economy/types';
import type { GearId, LookPieceId } from '@/hunt/ids';
import type { CompanionSave } from '@/hunt/types';

/** The gear Faust sells: the grappling hook comes free, from Knot 1. */
export type ShopGearId = Exclude<GearId, 'hook'>;

export const shopGear: readonly ShopGearId[] = ['lamp', 'magnet', 'long-hook'];

export function gearCost(id: ShopGearId): number {
  return tuning.gear[id];
}

export function lookCost(id: LookPieceId): number {
  return tuning.looks[id];
}

/** Where a look goes: paint on its boiler, or a hat on top. One of each at a time. */
export function lookSlot(id: LookPieceId): 'paint' | 'hat' {
  return id.startsWith('paint') ? 'paint' : 'hat';
}

export type Bought =
  | { ok: true; economy: Economy; companion: CompanionSave; cost: number }
  | { ok: false; reason: 'owned' | 'parts' };

/** Buys a piece of gear once, from his unspent parts. */
export function buyGear(economy: Economy, companion: CompanionSave, id: ShopGearId): Bought {
  if (companion.gear.includes(id)) return { ok: false, reason: 'owned' };
  const cost = gearCost(id);
  const spent = spendParts(economy, cost);
  if (!spent.ok) return spent;
  return {
    ok: true,
    economy: spent.economy,
    companion: { ...companion, gear: [...companion.gear, id] },
    cost,
  };
}

/** Buys a look once, and puts it on at once in place of whatever was in its slot. */
export function buyLook(economy: Economy, companion: CompanionSave, id: LookPieceId): Bought {
  if (companion.looks.includes(id)) return { ok: false, reason: 'owned' };
  const cost = lookCost(id);
  const spent = spendParts(economy, cost);
  if (!spent.ok) return spent;
  const owned = { ...companion, looks: [...companion.looks, id] };
  return { ok: true, economy: spent.economy, companion: putOn(owned, id), cost };
}

function putOn(companion: CompanionSave, id: LookPieceId): CompanionSave {
  const slot = lookSlot(id);
  return {
    ...companion,
    wearing: [...companion.wearing.filter((look) => lookSlot(look) !== slot), id],
  };
}

/** A look he owns goes on, or comes off if it's on. One he doesn't own changes nothing. */
export function toggleLook(companion: CompanionSave, id: LookPieceId): CompanionSave {
  if (!companion.looks.includes(id)) return companion;
  if (companion.wearing.includes(id)) {
    return { ...companion, wearing: companion.wearing.filter((look) => look !== id) };
  }
  return putOn(companion, id);
}

/**
 * Whether the counter has anything he can buy now: an upgrade on sale, or with the little one,
 * its gear and looks. The town marks the workshop when it does.
 */
export function anythingToBuy(
  parts: number,
  owned: readonly string[],
  onSale: readonly (keyof typeof tuning.upgrades)[],
  companion: CompanionSave | null,
): boolean {
  if (onSale.some((id) => !owned.includes(id) && parts >= tuning.upgrades[id].cost)) return true;
  if (!companion) return false;
  return (
    shopGear.some((id) => !companion.gear.includes(id) && parts >= gearCost(id)) ||
    (Object.keys(tuning.looks) as LookPieceId[]).some(
      (id) => !companion.looks.includes(id) && parts >= lookCost(id),
    )
  );
}

/** Brackets go on sale once the coat is done (GDD, Fights in part 2). */
export function bracketsOnSale(leadsDone: readonly string[]): boolean {
  return leadsDone.includes('l11');
}
