// The old mechanic's counter (story 3.5; GDD, Automaton fights: upgrades; narrative design,
// the old mechanic, who sells upgrades for parts). A layer like the fights': a tap on the
// workshop node, once room 6 has earned it, opens the counter; he buys upgrades with his
// unspent parts (economy/upgrades.ts), and goes back to the map. Room building joins the
// workshop in epic 5.

import { castDraft, produce } from 'immer';
import { nodeState } from '@/city/reach';
import { districtMap } from '@/content/map';
import { buyUpgrade } from '@/economy/upgrades';
import { type Bought, bracketsOnSale, buyGear, buyLook, toggleLook } from '@/hunt/gear';
import { partTwoOn } from '@/hunt/switch';
import type { RoomSpec } from '@/room/types';
import type { DomainEvent } from '@/store/events';
import type { GameState, Reduce } from '@/store/types';

type Step = { state: GameState; events: DomainEvent[] };

const unchanged = (state: GameState): Step => ({ state, events: [] });

/** Whether the workshop node takes him to the counter now: open on the map, from the map. */
export function counterOpen(state: GameState, authored: readonly string[]): boolean {
  if (state.ui.screen !== 'map') return false;
  const node = districtMap.nodes.find((n) => n.id === 'workshop');
  if (!node) return false;
  const reach = {
    done: state.save.progress.roomsDone,
    tools: state.save.progress.tools,
    authored,
  };
  return nodeState(districtMap, node, reach) === 'open';
}

function toScreen(state: GameState, screen: 'shop' | 'map'): GameState {
  return produce(state, (draft) => {
    draft.ui.screen = screen;
    draft.ui.fresh = null;
  });
}

/** Part 2's half of the counter is there: part 2 is on and he has the little one. */
function littleOneShop(state: GameState): boolean {
  return state.ui.screen === 'shop' && partTwoOn(state.ui.preview) && state.save.companion !== null;
}

/** Gear or a look bought: parts spent, the little one changed, and the save written. */
function bought(state: GameState, result: Bought, event: DomainEvent): Step {
  if (!result.ok) return unchanged(state);
  const next = produce(state, (draft) => {
    draft.save.economy = castDraft(result.economy);
    draft.save.companion = castDraft(result.companion);
  });
  return { state: next, events: [event, { type: 'SaveChanged' }] };
}

/** The room reducer (with fights) with the counter over it. */
export function withShop(inner: Reduce, roomList: readonly RoomSpec[]): Reduce {
  const authored = roomList.map((room) => room.id);
  return (state, action, ctx) => {
    switch (action.type) {
      case 'map/travel':
        if (action.node !== 'workshop') break;
        return counterOpen(state, authored)
          ? { state: toScreen(state, 'shop'), events: [] }
          : unchanged(state);
      case 'shop/close':
        return state.ui.screen === 'shop'
          ? { state: toScreen(state, 'map'), events: [] }
          : unchanged(state);
      case 'shop/buy': {
        if (state.ui.screen !== 'shop') return unchanged(state);
        // Brackets are part 2's, on sale only after the coat.
        if (
          action.upgrade === 'brackets' &&
          !(partTwoOn(state.ui.preview) && bracketsOnSale(state.save.hunt.leadsDone))
        ) {
          return unchanged(state);
        }
        const bought = buyUpgrade(state.save.economy, action.upgrade);
        if (!bought.ok) return unchanged(state);
        const next = produce(state, (draft) => {
          draft.save.economy = castDraft(bought.economy);
        });
        return { state: next, events: [...bought.events, { type: 'SaveChanged' }] };
      }
      case 'shop/buy-gear': {
        const companion = state.save.companion;
        if (!littleOneShop(state) || !companion) return unchanged(state);
        const result = buyGear(state.save.economy, companion, action.gear);
        const cost = result.ok ? result.cost : 0;
        return bought(state, result, { type: 'GearBought', gear: action.gear, cost });
      }
      case 'shop/buy-look': {
        const companion = state.save.companion;
        if (!littleOneShop(state) || !companion) return unchanged(state);
        const result = buyLook(state.save.economy, companion, action.look);
        const cost = result.ok ? result.cost : 0;
        return bought(state, result, { type: 'LookBought', look: action.look, cost });
      }
      case 'shop/wear': {
        const companion = state.save.companion;
        if (!littleOneShop(state) || !companion) return unchanged(state);
        const next = toggleLook(companion, action.look);
        if (next === companion) return unchanged(state);
        return {
          state: produce(state, (draft) => {
            draft.save.companion = castDraft(next);
          }),
          events: [{ type: 'SaveChanged' }],
        };
      }
    }
    return inner(state, action, ctx);
  };
}
