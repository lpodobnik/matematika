import { describe, expect, it } from 'vitest';
import type { JumpPlace } from '@/hunt/jump';
import { newSave } from '@/store/persist';
import { createGameStore } from '@/store/store';

// Part 2's growth (epic 11) through the store, from the dev panel's jumps, which build the save
// through the real path: gear and looks at Faust's, Kristijan's caches, brackets after the coat,
// and the three new automatons, each tested the moment before it opens as well as after.

function at(place: JumpPlace, { preview = true, parts = 0 } = {}) {
  const store = createGameStore();
  const save = newSave('2026-11-16T10:00:00.000Z');
  store.getState().dispatch({ type: 'boot/start', save, room: null });
  store.getState().dispatch({ type: 'dev/preview' });
  store.getState().dispatch({ type: 'dev/hunt-jump', to: place });
  store.getState().dispatch({ type: 'dev/set-parts', parts });
  if (!preview) {
    // The same save, opened without ?dev: part 2 is off.
    const off = createGameStore();
    off.getState().dispatch({ type: 'boot/start', save: store.getState().save, room: null });
    return off;
  }
  return store;
}

type Store = ReturnType<typeof at>;
type Action = Parameters<ReturnType<Store['getState']>['dispatch']>[0];
const dispatch = (store: Store, ...actions: Action[]) => {
  for (const action of actions) store.getState().dispatch(action);
};

describe("Faust's counter in part 2", () => {
  it('sells the little one gear for parts, once', () => {
    const store = at('l01', { parts: 40 });
    dispatch(store, { type: 'map/travel', node: 'workshop' });
    expect(store.getState().ui.screen).toBe('shop');
    dispatch(store, { type: 'shop/buy-gear', gear: 'lamp' });
    expect(store.getState().save.companion?.gear).toContain('lamp');
    expect(store.getState().save.economy.parts).toBe(25);
    dispatch(store, { type: 'shop/buy-gear', gear: 'lamp' });
    expect(store.getState().save.economy.parts).toBe(25);
  });

  it('sells looks, and he can put them on and take them off', () => {
    const store = at('l01', { parts: 20 });
    dispatch(
      store,
      { type: 'map/travel', node: 'workshop' },
      { type: 'shop/buy-look', look: 'hat-top' },
    );
    expect(store.getState().save.companion?.wearing).toEqual(['hat-top']);
    dispatch(store, { type: 'shop/wear', look: 'hat-top' });
    expect(store.getState().save.companion?.wearing).toEqual([]);
    expect(store.getState().save.companion?.looks).toEqual(['hat-top']);
  });

  it('sells nothing for the little one with part 2 off', () => {
    const store = at('l01', { parts: 40, preview: false });
    dispatch(
      store,
      { type: 'map/travel', node: 'workshop' },
      { type: 'shop/buy-gear', gear: 'lamp' },
    );
    expect(store.getState().save.companion?.gear).not.toContain('lamp');
  });

  it('keeps brackets off the counter until the coat is done', () => {
    const before = at('l11', { parts: 40 });
    dispatch(
      before,
      { type: 'map/travel', node: 'workshop' },
      { type: 'shop/buy', upgrade: 'brackets' },
    );
    expect(before.getState().save.economy.upgrades).not.toContain('brackets');
    const after = at('k3', { parts: 40 });
    dispatch(
      after,
      { type: 'map/travel', node: 'workshop' },
      { type: 'shop/buy', upgrade: 'brackets' },
    );
    expect(after.getState().save.economy.upgrades).toContain('brackets');
  });
});

describe("Kristijan's caches", () => {
  it('need the gear: without the lamp the little one brings nothing', () => {
    const store = at('l01');
    dispatch(store, { type: 'hunt/secret', secret: 'secret-1' });
    expect(store.getState().save.hunt.secrets).toEqual([]);
  });

  it('pay 5 parts and a paper once, with the gear', () => {
    const store = at('l01', { parts: 15 });
    dispatch(
      store,
      { type: 'map/travel', node: 'workshop' },
      { type: 'shop/buy-gear', gear: 'lamp' },
      { type: 'shop/close' },
      { type: 'hunt/secret', secret: 'secret-1' },
    );
    expect(store.getState().save.hunt.secrets).toEqual(['secret-1']);
    expect(store.getState().save.economy.parts).toBe(5);
    dispatch(store, { type: 'hunt/secret', secret: 'secret-1' });
    expect(store.getState().save.economy.parts).toBe(5);
  });

  it("stay shut while their street isn't open: Ulica brava's waits for Knot 3", () => {
    const before = at('k3', { parts: 25 });
    dispatch(
      before,
      { type: 'map/travel', node: 'workshop' },
      { type: 'shop/buy-gear', gear: 'magnet' },
      { type: 'shop/close' },
      { type: 'hunt/secret', secret: 'secret-5' },
    );
    expect(before.getState().save.hunt.secrets).toEqual([]);
    const after = at('l12', { parts: 25 });
    dispatch(
      after,
      { type: 'map/travel', node: 'workshop' },
      { type: 'shop/buy-gear', gear: 'magnet' },
      { type: 'shop/close' },
      { type: 'hunt/secret', secret: 'secret-5' },
    );
    expect(after.getState().save.hunt.secrets).toEqual(['secret-5']);
  });
});

describe("part 2's automatons", () => {
  it('Automat 70 waits for the little one and the map, then takes a fight', () => {
    const before = at('gate');
    dispatch(before, { type: 'map/travel', node: 'lair-70' });
    expect(before.getState().ui.screen).not.toBe('fight');
    const after = at('l01');
    dispatch(after, { type: 'map/travel', node: 'lair-70' });
    expect(after.getState().ui.screen).toBe('fight');
    expect(after.getState().fight?.armour).toBe(70);
  });

  it('Automat 120 waits for Knot 3, and brackets come with the fight once bought', () => {
    const before = at('k3');
    dispatch(before, { type: 'map/travel', node: 'lair-120' });
    expect(before.getState().ui.screen).not.toBe('fight');
    const after = at('l12', { parts: 30 });
    dispatch(
      after,
      { type: 'map/travel', node: 'workshop' },
      { type: 'shop/buy', upgrade: 'brackets' },
      { type: 'shop/close' },
      { type: 'map/travel', node: 'lair-120' },
    );
    expect(after.getState().ui.screen).toBe('fight');
    expect(after.getState().fight?.form).toBe('plain');
  });

  it('Automat 140 waits for Pusta ulica, which the locks open', () => {
    const before = at('l12');
    dispatch(before, { type: 'map/travel', node: 'lair-140' });
    expect(before.getState().ui.screen).not.toBe('fight');
    const after = at('l13');
    dispatch(after, { type: 'map/travel', node: 'lair-140' });
    expect(after.getState().ui.screen).toBe('fight');
  });

  it('take no fight with part 2 off', () => {
    const store = at('l13', { preview: false });
    dispatch(store, { type: 'map/travel', node: 'lair-70' });
    expect(store.getState().ui.screen).not.toBe('fight');
  });
});
