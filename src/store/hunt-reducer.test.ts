import { describe, expect, it } from 'vitest';
import { gateScene } from '@/hunt/gate';
import type { Token } from '@/math/tokens';
import { newSave } from '@/store/persist';
import { createGameStore } from '@/store/store';
import type { SaveState } from '@/store/types';

function endOfPartOne(rooms: string[], bossBeaten: boolean): SaveState {
  const save = newSave('2026-11-08T10:00:00.000Z');
  save.character = { name: 'Ana', look: 'look-1' };
  save.progress.roomsDone = rooms as SaveState['progress']['roomsDone'];
  save.progress.onMap = true;
  if (bossBeaten) save.economy.lairs['lair-60'] = { beatenAt: 0 } as never;
  return save;
}

function started(save: SaveState, preview: boolean) {
  const store = createGameStore();
  store.getState().dispatch({ type: 'boot/start', save, room: null });
  if (preview) store.getState().dispatch({ type: 'dev/preview' });
  return store;
}

const write = (store: ReturnType<typeof started>, line: string) => {
  for (const token of line.split('')) {
    store.getState().dispatch({ type: 'hunt/type', token: token as Token });
  }
  store.getState().dispatch({ type: 'hunt/enter' });
};

describe('the foundry gate, in the store', () => {
  it('stays shut with part 2 off, whatever he has done', () => {
    const store = started(endOfPartOne(['r12', 'r13'], true), false);
    const before = store.getState();
    store.getState().dispatch({ type: 'hunt/gate-open' });
    expect(store.getState().save).toBe(before.save);
    expect(store.getState().ui.screen).toBe(before.ui.screen);
  });

  it('stays shut the moment before: the boss beaten, room 13 not done', () => {
    const store = started(endOfPartOne(['r12'], true), true);
    store.getState().dispatch({ type: 'hunt/gate-open' });
    expect(store.getState().save.hunt.scene).toBeNull();
    expect(store.getState().ui.screen).not.toBe('hunt');
  });

  it('stays shut the moment before: room 13 done, the boss not beaten', () => {
    const store = started(endOfPartOne(['r12', 'r13'], false), true);
    store.getState().dispatch({ type: 'hunt/gate-open' });
    expect(store.getState().save.hunt.scene).toBeNull();
  });

  it('opens, shows the empty foundry, and gives him the little one to name', () => {
    const store = started(endOfPartOne(['r12', 'r13'], true), true);
    store.getState().dispatch({ type: 'hunt/gate-open' });
    expect(store.getState().ui.screen).toBe('hunt');

    write(store, 'x=7');
    expect(store.getState().save.hunt.gateOpened).toBe(false);
    // The screen reads the scene through this, so the knock back has to come through it.
    expect(gateScene(store.getState().save.hunt.scene?.state)?.knockedBack).toBe(true);

    write(store, 'x=8');
    write(store, '5·8=40');
    expect(store.getState().save.hunt.gateOpened).toBe(true);
    expect(store.getState().save.hunt.beats).toContain('foundry');

    store.getState().dispatch({ type: 'hunt/foundry-done' });
    store.getState().dispatch({ type: 'hunt/name', name: '   ' });
    expect(store.getState().save.companion).toBeNull();

    store.getState().dispatch({ type: 'hunt/name', name: ' Bip ' });
    const { save, ui } = store.getState();
    expect(save.companion?.name).toBe('Bip');
    expect(save.hunt.scene).toBeNull();
    expect(save.hunt.beats).toContain('named');
    expect(ui.screen).toBe('map');
  });

  it('comes back to the scene he left, and only while part 2 is on', () => {
    const store = started(endOfPartOne(['r12', 'r13'], true), true);
    store.getState().dispatch({ type: 'hunt/gate-open' });
    write(store, 'x=8');
    const { save } = store.getState();

    const on = createGameStore();
    on.getState().dispatch({ type: 'dev/preview' });
    on.getState().dispatch({ type: 'boot/start', save, room: null });
    expect(on.getState().ui.screen).toBe('hunt');

    const off = createGameStore();
    off.getState().dispatch({ type: 'boot/start', save, room: null });
    expect(off.getState().ui.screen).not.toBe('hunt');
  });

  it('takes the map once, the first time Vučetić gives it', () => {
    const store = started(endOfPartOne(['r12', 'r13'], true), true);
    store.getState().dispatch({ type: 'hunt/map-given' });
    store.getState().dispatch({ type: 'hunt/map-given' });
    expect(store.getState().save.hunt.beats.filter((b) => b === 'map-given')).toHaveLength(1);
  });
});
