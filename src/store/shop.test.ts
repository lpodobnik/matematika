// Story 3.5: the old mechanic's counter through the real store. The workshop node opens it
// once room 6 has earned the workshop; upgrades are paid from unspent parts, once each,
// saved, and the next fight starts with their limits.

import { describe, expect, it } from 'vitest';
import type { DomainEvent } from '@/store/events';
import { newSave } from '@/store/persist';
import { createGameStore } from '@/store/store';
import type { GameState } from '@/store/types';

const at = '2026-11-07T10:00:00.000Z';
type RoomsDone = GameState['save']['progress']['roomsDone'];
const toSix: RoomsDone = ['r01', 'r02', 'r03', 'r04', 'r05', 'r06'];

function game(roomsDone: RoomsDone = toSix, parts = 0, tools = ['balance', 'workshop'] as const) {
  const seen: DomainEvent[] = [];
  const store = createGameStore({
    makeCtx: () => ({ now: Date.parse(at), rng: { next: () => 0.5 } }),
    effects: [(event) => seen.push(event)],
  });
  const save = newSave(at);
  store.getState().dispatch({
    type: 'boot/start',
    save: {
      ...save,
      character: { name: 'Ivo', look: 'look-1' as const },
      progress: {
        ...save.progress,
        introSeen: true,
        // Past the guided first fight (fight/guide.ts), which has its own tests.
        firstUse: ['fight-guide'],
        roomsDone,
        tools: [...tools],
        onMap: true,
        told: [...roomsDone],
      },
      economy: { ...save.economy, parts },
    },
    room: null,
  });
  return { store, seen, state: () => store.getState() as GameState };
}

describe('the old mechanic’s counter (story 3.5)', () => {
  it('opens from the workshop node once room 6 has earned the workshop, and back to the map', () => {
    const g = game();
    g.store.getState().dispatch({ type: 'map/travel', node: 'workshop' });
    expect(g.state().ui.screen).toBe('shop');
    expect(g.state().save.progress.onMap).toBe(true);
    g.store.getState().dispatch({ type: 'shop/close' });
    expect(g.state().ui.screen).toBe('map');
  });

  it('stays shut before room 6', () => {
    const g = game(['r01', 'r02', 'r03', 'r04', 'r05'], 0, ['balance'] as never);
    g.store.getState().dispatch({ type: 'map/travel', node: 'workshop' });
    expect(g.state().ui.screen).toBe('map');
  });

  it('buys an upgrade he can afford, once, saved, and the next fight has its limits', () => {
    const g = game(toSix, 35);
    const { dispatch } = g.store.getState();
    dispatch({ type: 'map/travel', node: 'workshop' });
    dispatch({ type: 'shop/buy', upgrade: 'fourth-die' });
    expect(g.state().save.economy.parts).toBe(5);
    expect(g.state().save.economy.upgrades).toEqual(['fourth-die']);
    expect(g.seen.map((e) => e.type)).toContain('UpgradeBought');
    // Not twice, and not without the parts.
    dispatch({ type: 'shop/buy', upgrade: 'fourth-die' });
    dispatch({ type: 'shop/buy', upgrade: 'steam' });
    expect(g.state().save.economy).toMatchObject({ parts: 5, upgrades: ['fourth-die'] });
    dispatch({ type: 'shop/close' });
    dispatch({ type: 'map/travel', node: 'lair-20' });
    expect(g.state().fight?.limits).toEqual({ dice: 4, hull: 3, steam: 10 });
    dispatch({ type: 'fight/roll' });
    expect(g.state().fight?.dice).toHaveLength(4);
    // Three go into the slots; the fourth stays out, and the strike uses only the three.
    dispatch({ type: 'fight/place', die: 0, slot: 'blade' });
    dispatch({ type: 'fight/place', die: 1, slot: 'charge' });
    dispatch({ type: 'fight/place', die: 2, slot: 'reach' });
    expect(g.state().fight?.phase).toBe('set');
    dispatch({ type: 'fight/strike' });
    const dice = g.state().fight?.dice ?? [];
    const struck = g.state().fight?.lastStrike;
    expect(struck).toMatchObject({ blade: dice[0], charge: dice[1], blows: 1 });
    expect(struck?.damage).toBe((dice[0] ?? 0) + (dice[1] ?? 0));
  });

  it('takes no purchase off the counter', () => {
    const g = game(toSix, 90);
    g.store.getState().dispatch({ type: 'shop/buy', upgrade: 'hull' });
    expect(g.state().save.economy.upgrades).toEqual([]);
  });
});
