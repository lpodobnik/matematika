import { describe, expect, it } from 'vitest';
import { l01 } from '@/content/leads/l01-two-sides';
import type { LeadPlay } from '@/hunt/lead';
import { newSave } from '@/store/persist';
import { createGameStore } from '@/store/store';

// Starting a lead again, through the store, from the real path: the dev panel's jump to the first
// lead's street, then his own pick of it. His son lost a showing step to a stray tap; this is
// the way to see the whole lead again.

function inTheFirstLead() {
  const store = createGameStore();
  store
    .getState()
    .dispatch({ type: 'boot/start', save: newSave('2026-11-18T10:00:00.000Z'), room: null });
  // The dev panel's jump needs ?dev; the lead is then his to pick.
  store.getState().dispatch({ type: 'dev/preview' });
  store.getState().dispatch({ type: 'dev/hunt-jump', to: 'l01' });
  return store;
}

type Store = ReturnType<typeof inTheFirstLead>;
const lead = (store: Store) => store.getState().save.hunt.scene?.state as LeadPlay | undefined;

describe('starting a lead again, in the store', () => {
  it('does nothing the moment before: no lead in play', () => {
    const store = inTheFirstLead();
    expect(store.getState().ui.screen).not.toBe('hunt');
    const before = store.getState().save;
    store.getState().dispatch({ type: 'hunt/restart' });
    expect(store.getState().save).toBe(before);
  });

  it('takes him back to the first picture, keeps his parts, and is saved', () => {
    const store = inTheFirstLead();
    store.getState().dispatch({ type: 'hunt/lead-start', lead: 'l01' });
    expect(store.getState().ui.screen).toBe('hunt');
    for (const _ of l01.lesson.steps) {
      store.getState().dispatch({ type: 'hunt/lead', action: { kind: 'next' } });
    }
    expect(lead(store)?.step).toBe('try');
    const { parts } = store.getState().save.economy;
    const { told } = store.getState().save.hunt;

    store.getState().dispatch({ type: 'hunt/restart' });
    expect(lead(store)).toMatchObject({ step: 'show', at: 0, written: [] });
    expect(store.getState().save.hunt.scene?.of).toBe('l01');
    expect(store.getState().ui.screen).toBe('hunt');
    expect(store.getState().save.economy.parts).toBe(parts);
    // What he has been told stays told: the showing now has its skip.
    expect(store.getState().save.hunt.told).toEqual(told);
  });

  it('steps back through the showing with "Natrag"', () => {
    const store = inTheFirstLead();
    store.getState().dispatch({ type: 'hunt/lead-start', lead: 'l01' });
    store.getState().dispatch({ type: 'hunt/lead', action: { kind: 'next' } });
    expect(lead(store)).toMatchObject({ step: 'show', at: 1 });
    store.getState().dispatch({ type: 'hunt/lead', action: { kind: 'back' } });
    expect(lead(store)).toMatchObject({ step: 'show', at: 0 });
  });
});
