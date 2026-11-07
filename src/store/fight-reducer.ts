// Automaton fights in the store (story 3.1; architecture, State Transitions; ADR-8). A layer
// over the room reducer: it takes the fight's actions and a tap on a lair, and hands every
// other action on. The fight's rules are pure (fight/fight.ts, fight/settle.ts); this layer
// only starts a fight, keeps it in `state.fight`, settles it once in the same step that it
// ends (so the save, which never holds a finished fight, can't settle it twice), and moves
// between the map and the fight screen.

import { castDraft, produce } from 'immer';
import { nodeState, type Reach } from '@/city/reach';
import { LAIR_ORDER, lairs } from '@/content/lairs';
import { districtMap } from '@/content/map';
import { fightInProgress, reduceFight, startFight } from '@/fight/fight';
import { seedFrom } from '@/fight/rng';
import { asleepLairs, settleFight } from '@/fight/settle';
import type { FightAction, FightState, LairId } from '@/fight/types';
import type { RoomSpec } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { fightEndOf } from '@/store/fight-end';
import type { Ctx, GameState, Reduce } from '@/store/types';

type Step = { state: GameState; events: DomainEvent[] };

const isLair = (node: string): node is LairId => LAIR_ORDER.includes(node as LairId);

const fightActions: ReadonlySet<Action['type']> = new Set<Action['type']>([
  'fight/roll',
  'fight/place',
  'fight/unplace',
  'fight/blows',
  'fight/strike',
  'fight/leave',
]);

const isFightAction = (action: Action): action is FightAction => fightActions.has(action.type);

const unchanged = (state: GameState): Step => ({ state, events: [] });

/**
 * Whether he can walk into a lair now: from the map, with no fight on, a lair he has seen
 * (city/reach.ts shows it open) whose automaton is awake (ADR-13).
 */
export function lairEnterable(
  state: GameState,
  lairId: LairId,
  authored: readonly string[],
  now: number,
): boolean {
  if (state.ui.screen !== 'map' || fightInProgress(state.fight)) return false;
  const node = districtMap.nodes.find((n) => n.id === lairId);
  if (!node) return false;
  const reach: Reach = {
    done: state.save.progress.roomsDone,
    tools: state.save.progress.tools,
    authored,
    asleep: asleepLairs(state.save.economy, now),
  };
  return nodeState(districtMap, node, reach) === 'open';
}

/** A tap on a lair: a new fight there, with his upgrades, waiting for the first roll. */
function enterLair(state: GameState, lairId: LairId, authored: readonly string[], ctx: Ctx): Step {
  if (!lairEnterable(state, lairId, authored, ctx.now)) return unchanged(state);
  // A seed left by walking out before a strike comes back, so the dice do too.
  const seed = state.ui.fightSeed ?? state.save.economy.seeds[lairId] ?? seedFrom(ctx.rng);
  const fight = startFight(lairs[lairId], state.save.economy.upgrades, seed);
  const next = produce(state, (draft) => {
    draft.fight = castDraft(fight);
    draft.save.economy.seeds[lairId] = seed;
    draft.ui.fightEnd = null;
    draft.ui.fresh = null;
    draft.ui.screen = 'fight';
  });
  return { state: next, events: [{ type: 'FightStarted', lairId }, { type: 'SaveChanged' }] };
}

/** A fight action on the fight screen; a fight that ends is settled in the same step. */
function fightStep(state: GameState, action: FightAction, now: number): Step {
  const fight = state.fight;
  if (state.ui.screen !== 'fight' || !fightInProgress(fight)) return unchanged(state);
  const step = reduceFight(fight, action);
  if (step.state === fight) return unchanged(state);
  if (step.state === null) {
    // Left before the first strike: free, nothing changes but where he is.
    const next = produce(state, (draft) => {
      draft.fight = null;
      draft.ui.fightEnd = null;
      draft.ui.screen = 'map';
    });
    return { state: next, events: [...step.events, { type: 'FightLeft', lairId: fight.lairId }] };
  }
  const struck = step.events.some((event) => event.type === 'StrikeLanded');
  const base = struck ? withoutSeed(state, fight.lairId) : state;
  if (fightInProgress(step.state)) {
    const moved = step.state;
    return {
      state: produce(base, (draft) => {
        draft.fight = castDraft(moved);
      }),
      events: step.events,
    };
  }
  return settle(base, step.state, step.events, now);
}

/** The first strike uses up the seed a free leave would have kept. */
function withoutSeed(state: GameState, lairId: LairId): GameState {
  if (state.save.economy.seeds[lairId] === undefined) return state;
  return produce(state, (draft) => {
    delete draft.save.economy.seeds[lairId];
  });
}

/** A fight just won or lost: its parts, pile, rewind and page go into the save at once. */
function settle(
  state: GameState,
  ended: FightState,
  events: readonly DomainEvent[],
  now: number,
): Step {
  const { save } = state;
  const settlement = settleFight(
    { economy: save.economy, tornPages: save.progress.tornPages },
    ended,
    lairs[ended.lairId],
    now,
  );
  const { economy, tornPages } = settlement.ledger;
  const next = produce(state, (draft) => {
    draft.fight = castDraft(ended);
    draft.save.economy = castDraft(economy);
    draft.save.progress.tornPages = tornPages;
    draft.ui.fightEnd = fightEndOf(ended, settlement);
  });
  return {
    state: next,
    events: [...events, ...settlement.events, { type: 'SaveChanged' }],
  };
}

/** Off the end of a fight, back to the map. */
function closeFight(state: GameState): Step {
  if (state.ui.screen !== 'fight' || !state.fight || fightInProgress(state.fight)) {
    return unchanged(state);
  }
  const next = produce(state, (draft) => {
    draft.fight = null;
    draft.ui.fightEnd = null;
    draft.ui.screen = 'map';
  });
  return { state: next, events: [] };
}

/** At launch, a saved fight resumes where it was, once the game is on the map (ADR-8). */
function resumeFight(result: Step, fight: FightState | null): Step {
  const { state } = result;
  if (!fight || state.ui.screen !== 'map' || state.room) return result;
  const next = produce(state, (draft) => {
    draft.fight = castDraft(fight);
    draft.ui.fightEnd = null;
    draft.ui.screen = 'fight';
  });
  return { state: next, events: result.events };
}

/** The dev panel: his parts set outright (architecture, Debug Tools). */
function setParts(state: GameState, parts: number): Step {
  if (!Number.isInteger(parts) || parts < 0 || parts === state.save.economy.parts) {
    return unchanged(state);
  }
  const next = produce(state, (draft) => {
    draft.save.economy.parts = parts;
  });
  return { state: next, events: [{ type: 'SaveChanged' }] };
}

/** The room reducer with fights over it. `roomList` is the rooms that exist, for the map. */
export function withFights(inner: Reduce, roomList: readonly RoomSpec[]): Reduce {
  const authored = roomList.map((room) => room.id);
  return (state, action, ctx) => {
    if (isFightAction(action)) return fightStep(state, action, ctx.now);
    switch (action.type) {
      case 'fight/close':
        return closeFight(state);
      case 'map/travel':
        if (isLair(action.node)) return enterLair(state, action.node, authored, ctx);
        break;
      case 'dev/set-parts':
        return setParts(state, action.parts);
      case 'dev/wake-lairs':
        if (Object.keys(state.save.economy.lairs).length === 0) return unchanged(state);
        return {
          state: produce(state, (draft) => {
            draft.save.economy.lairs = {};
          }),
          events: [{ type: 'SaveChanged' }],
        };
      case 'dev/fight-seed':
        return {
          state: produce(state, (draft) => {
            draft.ui.fightSeed = action.seed;
          }),
          events: [],
        };
    }
    const result = inner(state, action, ctx);
    if (action.type === 'boot/start') return resumeFight(result, action.fight ?? null);
    const drops = action.type === 'dev/new-game' || action.type === 'room/enter';
    if (drops && (result.state.fight || result.state.ui.fightEnd)) {
      const next = produce(result.state, (draft) => {
        draft.fight = null;
        draft.ui.fightEnd = null;
      });
      return { state: next, events: result.events };
    }
    return result;
  };
}
