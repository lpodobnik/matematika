// The old mechanic's counter (story 3.5; GDD, Automaton fights: upgrades; narrative design,
// the old mechanic, who sells upgrades for parts). A layer like the fights': a tap on the
// workshop node, once room 6 has earned it, opens the counter; he buys upgrades with his
// unspent parts (economy/upgrades.ts), and goes back to the map. Room building joins the
// workshop in epic 5.

import { castDraft, produce } from 'immer';
import { nodeState } from '@/city/reach';
import { districtMap } from '@/content/map';
import { buyUpgrade } from '@/economy/upgrades';
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
        const bought = buyUpgrade(state.save.economy, action.upgrade);
        if (!bought.ok) return unchanged(state);
        const next = produce(state, (draft) => {
          draft.save.economy = castDraft(bought.economy);
        });
        return { state: next, events: [...bought.events, { type: 'SaveChanged' }] };
      }
    }
    return inner(state, action, ctx);
  };
}
