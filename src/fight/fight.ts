// The fight's rules as a state machine (GDD, Automaton fights; architecture, State
// Transitions). Each action is handled only in the phases where it is legal; anywhere else
// it is ignored and the same state comes back with no events.
//
//   roll ──roll──▶ place ──all three slots filled──▶ set ──strike──▶ strike | won | lost
//   strike ──roll──▶ place (next round)
//   leave: before the first strike the fight is dropped (null); after it, lost ('left').

import { tuning } from '@/config/tuning';
import { fightReward } from '@/economy/rewards';
import type { UpgradeId } from '@/economy/types';
import { rollDice } from './dice';
import { fightLimits } from './limits';
import { toRngState } from './rng';
import type {
  FightAction,
  FightEvent,
  FightState,
  LairSpec,
  LossReason,
  Slot,
  StrikeRecord,
} from './types';

export const SLOTS: readonly Slot[] = ['blade', 'charge', 'reach'];

export interface FightStep {
  /** The fight after the action; null when he left before his first strike. */
  state: FightState | null;
  events: FightEvent[];
}

const emptySlots = (): Record<Slot, number | null> => ({ blade: null, charge: null, reach: null });

/**
 * A new fight at a lair, waiting for the first roll. `seed` starts the fight's own
 * generator; the store draws it from `ctx.rng` with `seedFrom`.
 */
export function startFight(
  lair: LairSpec,
  upgrades: readonly UpgradeId[],
  seed: number,
): FightState {
  const limits = fightLimits(upgrades);
  return {
    lairId: lair.id,
    baseParts: lair.baseParts,
    phase: 'roll',
    limits,
    armour: lair.armour,
    hull: limits.hull,
    steam: limits.steam,
    round: 0,
    rng: toRngState(seed),
    dice: [],
    slots: emptySlots(),
    blows: 0,
    strikes: 0,
    lastStrike: null,
    outcome: null,
  };
}

/** `a · x + b`: blade times blows plus charge. */
export function strikeDamage(blade: number, blows: number, charge: number): number {
  return blade * blows + charge;
}

/** The most blows steam can pay for. */
export function blowsAffordable(steam: number): number {
  return Math.floor(steam / tuning.fight.steamPerBlow);
}

/** The values in the three slots, or null for an empty slot. */
export function placedValues(state: FightState): Record<Slot, number | null> {
  const value = (slot: Slot) => {
    const index = state.slots[slot];
    return index === null ? null : (state.dice[index] ?? null);
  };
  return { blade: value('blade'), charge: value('charge'), reach: value('reach') };
}

/**
 * The dial's range for blows: from 1 to the reach die, and never more than the steam left
 * pays for. Null until a die is on reach.
 */
export function blowRange(state: FightState): { min: number; max: number } | null {
  const reach = placedValues(state).reach;
  if (reach === null) return null;
  return { min: 1, max: Math.min(reach, blowsAffordable(state.steam)) };
}

const unchanged = (state: FightState): FightStep => ({ state, events: [] });

export function reduceFight(state: FightState, action: FightAction): FightStep {
  switch (action.type) {
    case 'fight/roll':
      return state.phase === 'roll' || state.phase === 'strike' ? roll(state) : unchanged(state);
    case 'fight/place':
      return state.phase === 'place' || state.phase === 'set'
        ? place(state, action.die, action.slot)
        : unchanged(state);
    case 'fight/unplace':
      return state.phase === 'place' || state.phase === 'set'
        ? unplace(state, action.slot)
        : unchanged(state);
    case 'fight/blows':
      return state.phase === 'set' ? setBlows(state, action.x) : unchanged(state);
    case 'fight/strike':
      return state.phase === 'set' ? strike(state) : unchanged(state);
    case 'fight/leave':
      return leave(state);
  }
}

function roll(state: FightState): FightStep {
  const { dice, rng } = rollDice(state.rng, state.limits.dice);
  const next: FightState = {
    ...state,
    phase: 'place',
    round: state.round + 1,
    rng,
    dice,
    slots: emptySlots(),
    blows: 0,
  };
  return { state: next, events: [{ type: 'DiceRolled', lairId: state.lairId, dice: [...dice] }] };
}

/** Puts a die in a slot. A die already in another slot moves; a die it replaces goes back. */
function place(state: FightState, die: number, slot: Slot): FightStep {
  if (!Number.isInteger(die) || die < 0 || die >= state.dice.length) return unchanged(state);
  if (!SLOTS.includes(slot) || state.slots[slot] === die) return unchanged(state);
  const slots = { ...state.slots };
  for (const other of SLOTS) if (slots[other] === die) slots[other] = null;
  slots[slot] = die;
  return { state: withSlots(state, slots), events: [] };
}

function unplace(state: FightState, slot: Slot): FightStep {
  if (!SLOTS.includes(slot) || state.slots[slot] === null) return unchanged(state);
  return { state: withSlots(state, { ...state.slots, [slot]: null }), events: [] };
}

/** With all three slots filled the dial opens at 1; a new reach die clamps the blows. */
function withSlots(state: FightState, slots: Record<Slot, number | null>): FightState {
  const filled = SLOTS.every((slot) => slots[slot] !== null);
  const next: FightState = { ...state, slots, phase: filled ? 'set' : 'place' };
  const range = filled ? blowRange(next) : null;
  next.blows = range ? Math.min(Math.max(state.blows, range.min), range.max) : 0;
  return next;
}

function setBlows(state: FightState, x: number): FightStep {
  const range = blowRange(state);
  if (!range || !Number.isInteger(x) || x < range.min || x > range.max) return unchanged(state);
  return x === state.blows ? unchanged(state) : { state: { ...state, blows: x }, events: [] };
}

/**
 * Resolves a strike. Armour is checked first, so a strike that spends the last steam and
 * brings armour to 0 wins. Otherwise the automaton dents him, and he loses when the hull
 * is empty or no steam is left for a blow.
 */
function strike(state: FightState): FightStep {
  const { blade, charge } = placedValues(state);
  const range = blowRange(state);
  if (blade === null || charge === null || !range) return unchanged(state);
  const blows = state.blows;
  if (blows < range.min || blows > range.max) return unchanged(state);

  const damage = strikeDamage(blade, blows, charge);
  const steam = state.steam - blows * tuning.fight.steamPerBlow;
  const armourBefore = state.armour;
  const armour = Math.max(0, armourBefore - damage);
  const clean = armourBefore - damage === 0;
  const dented = armour > 0;
  const hull = dented ? state.hull - 1 : state.hull;
  const record: StrikeRecord = {
    round: state.round,
    blade,
    charge,
    blows,
    damage,
    armourBefore,
    armourAfter: armour,
    clean,
    dented,
  };

  const next: FightState = {
    ...state,
    armour,
    steam,
    hull,
    strikes: state.strikes + 1,
    lastStrike: record,
  };
  if (!dented) {
    next.phase = 'won';
    next.outcome = { won: true, clean, reward: fightReward(state.baseParts, steam, clean) };
  } else {
    const reason: LossReason | null =
      hull <= 0 ? 'hull' : blowsAffordable(steam) < 1 ? 'steam' : null;
    next.phase = reason ? 'lost' : 'strike';
    if (reason) next.outcome = { won: false, reason };
  }
  return { state: next, events: [{ type: 'StrikeLanded', lairId: state.lairId, strike: record }] };
}

/** Leaving is free before his first strike and counts as losing after it. */
function leave(state: FightState): FightStep {
  if (state.phase === 'won' || state.phase === 'lost') return unchanged(state);
  if (state.strikes === 0) return { state: null, events: [] };
  return {
    state: { ...state, phase: 'lost', outcome: { won: false, reason: 'left' } },
    events: [],
  };
}
