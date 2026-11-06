// Reading a saved fight back (story 3.1; ADR-8). A fight in progress is saved after it
// starts, after each roll and after each strike, and resumed on reload. The save is read as
// untrusted JSON, so every field is checked, and a fight that doesn't hang together (a die
// that isn't 1–6, a slot pointing past the dice, a phase its slots don't fit) is dropped
// whole rather than half-read: he is then on the map, as before he walked into the lair.
// Nothing here throws.

import { LAIR_ORDER } from '@/content/lairs';
import { blowsAffordable, SLOTS } from '@/fight/fight';
import type { FightPhase, FightState, LairId, Slot, StrikeRecord } from '@/fight/types';

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A whole number from `min` to `max`. */
function whole(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

/** Far past anything a fight reaches: 4 dice, 13 steam, 4 hull, armour 60. */
const limitCap = 99;
const armourCap = 999;
const roundCap = 999;

/** Phases a fight can be saved in: a finished fight is settled and never saved (ADR-8). */
const savedPhases: readonly FightPhase[] = ['roll', 'place', 'set', 'strike'];

function decodeStrike(value: unknown): StrikeRecord | null {
  if (!isObject(value)) return null;
  const { round, blade, charge, blows, damage, armourBefore, armourAfter, clean, dented } = value;
  if (!whole(round, 1, roundCap) || !whole(blade, 1, 6) || !whole(charge, 1, 6)) return null;
  if (!whole(blows, 1, 6) || damage !== blade * blows + charge) return null;
  if (!whole(armourBefore, 1, armourCap) || armourAfter !== Math.max(0, armourBefore - damage)) {
    return null;
  }
  if (clean !== (armourBefore === damage) || dented !== armourAfter > 0) return null;
  return {
    round,
    blade,
    charge,
    blows,
    damage,
    armourBefore,
    armourAfter,
    clean,
    dented,
  };
}

function decodeSlots(value: unknown, dice: number): Record<Slot, number | null> | null {
  if (!isObject(value)) return null;
  const slots: Record<Slot, number | null> = { blade: null, charge: null, reach: null };
  for (const slot of SLOTS) {
    const index = value[slot];
    if (index === null || index === undefined) continue;
    if (!whole(index, 0, dice - 1)) return null;
    slots[slot] = index;
  }
  const used = SLOTS.flatMap((slot) => (slots[slot] === null ? [] : [slots[slot]]));
  return new Set(used).size === used.length ? slots : null;
}

/** The fight in progress, or null when there is none or it doesn't hang together. */
export function decodeFight(value: unknown): FightState | null {
  if (!isObject(value)) return null;
  const { lairId, baseParts, phase, limits, armour, hull, steam, round, rng, dice } = value;
  if (typeof lairId !== 'string' || !LAIR_ORDER.includes(lairId as LairId)) return null;
  if (typeof phase !== 'string' || !savedPhases.includes(phase as FightPhase)) return null;
  if (!isObject(limits)) return null;
  const { dice: diceLimit, hull: hullLimit, steam: steamLimit } = limits;
  if (!whole(diceLimit, 3, 4) || !whole(hullLimit, 1, limitCap)) return null;
  if (!whole(steamLimit, 1, limitCap) || !whole(baseParts, 0, limitCap)) return null;
  if (!whole(armour, 1, armourCap) || !whole(hull, 1, hullLimit)) return null;
  if (!whole(steam, 1, steamLimit) || !whole(round, 0, roundCap) || !whole(rng, 0, 0xffffffff)) {
    return null;
  }
  if (!Array.isArray(dice) || !dice.every((die) => whole(die, 1, 6))) return null;
  if (phase === 'roll' ? dice.length !== 0 || round !== 0 : dice.length !== diceLimit) return null;
  if (phase !== 'roll' && round < 1) return null;
  const slots = decodeSlots(value.slots, dice.length);
  if (!slots) return null;
  const filled = SLOTS.every((slot) => slots[slot] !== null);
  if ((phase === 'set') !== filled && phase !== 'strike') return null;
  const strikes = value.strikes;
  if (!whole(strikes, 0, roundCap) || strikes > round) return null;
  const lastStrike = value.lastStrike === null ? null : decodeStrike(value.lastStrike);
  if (value.lastStrike !== null && lastStrike === null) return null;
  if ((strikes === 0) !== (lastStrike === null)) return null;
  // Every strike of an unfinished fight left armour, so each dented him.
  if (hull !== hullLimit - strikes) return null;
  // After a strike, the round in play is that strike's (`strike`) or the next (`place`, `set`).
  if (lastStrike && phase !== 'strike' && lastStrike.round !== round - 1) return null;
  if (lastStrike && lastStrike.armourAfter !== armour) return null;
  // Phase `strike` is the pause after a strike that left armour: its slots are last round's.
  if (phase === 'strike' && (lastStrike === null || lastStrike.round !== round)) return null;
  let blows = 0;
  if (phase === 'set') {
    const reach = dice[slots.reach as number] as number;
    if (!whole(value.blows, 1, Math.min(reach, blowsAffordable(steam)))) return null;
    blows = value.blows;
  } else if (!whole(value.blows, 0, 6)) {
    return null;
  } else {
    blows = value.blows;
  }
  return {
    lairId: lairId as LairId,
    baseParts,
    phase: phase as FightPhase,
    limits: { dice: diceLimit, hull: hullLimit, steam: steamLimit },
    armour,
    hull,
    steam,
    round,
    rng,
    dice: [...dice],
    slots,
    blows,
    strikes,
    lastStrike,
    outcome: null,
  };
}
