// The guided first fight through the real store: the first fight he ever starts, at any
// lair, is talked through by Nikola one step at a time; only the move a step asks for gets
// through; once the last line is read the guide is met (`fight-guide` in his first uses),
// saved, and never shows again. Leaving before the first strike brings it back next time.

import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import { GUIDE_STEPS, guideDice } from '@/fight/guide';
import type { LairId } from '@/fight/types';
import type { FirstUseId } from '@/room/types';
import { decodeSave } from '@/save/decode';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { fromSaveV1, newSave, toSaveV1 } from '@/store/persist';
import { createGameStore } from '@/store/store';
import type { GameState } from '@/store/types';

const at = '2026-11-07T10:00:00.000Z';

function game(firstUse: FirstUseId[] = [], seed = 21) {
  const seen: DomainEvent[] = [];
  const store = createGameStore({
    makeCtx: () => ({ now: Date.parse(at), rng: { next: () => 0.5 } }),
    effects: [(event) => seen.push(event)],
  });
  const save = newSave(at);
  const roomsDone: GameState['save']['progress']['roomsDone'] = [
    'r01',
    'r02',
    'r03',
    'r04',
    'r05',
    'r06',
  ];
  store.getState().dispatch({
    type: 'boot/start',
    save: {
      ...save,
      character: { name: 'Ivo', look: 'look-1' as const },
      progress: {
        ...save.progress,
        introSeen: true,
        roomsDone,
        onMap: true,
        told: [...roomsDone],
        tools: ['balance', 'workshop'],
        firstUse,
      },
    },
    room: null,
  });
  store.getState().dispatch({ type: 'dev/fight-seed', seed });
  const act = (action: Action) => store.getState().dispatch(action);
  const state = () => store.getState() as GameState;
  const fight = () => {
    const f = state().fight;
    if (!f) throw new Error('no fight');
    return f;
  };
  const step = () => state().ui.fightGuide;
  return { store, seen, act, state, fight, step };
}

type Game = ReturnType<typeof game>;

const enter = (g: Game, lair: LairId = 'lair-20') => g.act({ type: 'map/travel', node: lair });

/** The guided round's moves, as the guide asks for them, up to the banner. */
function playGuidedRound(g: Game) {
  g.act({ type: 'fight/guide-next' });
  g.act({ type: 'fight/guide-next' });
  g.act({ type: 'fight/roll' });
  for (const slot of ['blade', 'charge', 'reach'] as const) {
    expect(g.step()).toBe(slot);
    const die = guideDice(slot, g.fight())[0];
    if (die === undefined) throw new Error(`no die for ${slot}`);
    g.act({ type: 'fight/place', die, slot });
  }
  expect(g.step()).toBe('blows');
  g.act({ type: 'fight/blows', x: g.fight().blows });
  expect(g.step()).toBe('strike');
  g.act({ type: 'fight/strike' });
  expect(g.step()).toBe('banner');
}

describe('the guided first fight', () => {
  it('starts with the first fight, at any lair, at the armour', () => {
    for (const lair of ['lair-20', 'lair-30'] as const) {
      const g = game();
      enter(g, lair);
      expect(g.state().ui.screen).toBe('fight');
      expect(g.step()).toBe('armour');
    }
  });

  it('never starts once met', () => {
    const g = game(['fight-guide']);
    enter(g);
    expect(g.step()).toBeNull();
  });

  it('lets through only the move its step asks for', () => {
    const g = game();
    enter(g);
    // Talking: no roll until he has read the armour and the goal.
    g.act({ type: 'fight/roll' });
    expect(g.fight().phase).toBe('roll');
    g.act({ type: 'fight/guide-next' });
    expect(g.step()).toBe('goal');
    g.act({ type: 'fight/guide-next' });
    expect(g.step()).toBe('roll');
    // "Dalje" does nothing on a step that waits for a move.
    g.act({ type: 'fight/guide-next' });
    expect(g.step()).toBe('roll');
    g.act({ type: 'fight/roll' });
    expect(g.step()).toBe('blade');
    // Any die he picks, but only into the slot the step asks for.
    const dice = g.fight().dice;
    const smallest = dice.indexOf(Math.min(...dice));
    g.act({ type: 'fight/place', die: smallest, slot: 'reach' });
    expect(g.fight().slots).toEqual({ blade: null, charge: null, reach: null });
    g.act({ type: 'fight/place', die: smallest, slot: 'blade' });
    expect(g.fight().slots.blade).toBe(smallest);
    expect(g.step()).toBe('charge');
    // No taking it back during the guide.
    g.act({ type: 'fight/unplace', slot: 'blade' });
    expect(g.fight().slots.blade).toBe(smallest);
  });

  it('goes through a whole round to the clean cut, then is met and saved', () => {
    const g = game();
    enter(g);
    playGuidedRound(g);
    const dented = g.fight().lastStrike?.dented === true;
    g.act({ type: 'fight/guide-next' });
    if (dented) {
      expect(g.step()).toBe('dent');
      g.act({ type: 'fight/guide-next' });
    }
    expect(g.step()).toBe('steam');
    // No next roll while the guide is talking.
    g.act({ type: 'fight/roll' });
    expect(g.fight().round).toBe(1);
    g.act({ type: 'fight/guide-next' });
    expect(g.step()).toBe('clean');
    g.seen.length = 0;
    g.act({ type: 'fight/guide-next' });
    expect(g.step()).toBeNull();
    expect(g.state().save.progress.firstUse).toContain('fight-guide');
    expect(g.seen.map((e) => e.type)).toContain('SaveChanged');
    // Saved, and read back.
    const read = decodeSave(JSON.parse(JSON.stringify(toSaveV1(g.state(), at))), at);
    if (!read) throw new Error('save did not read');
    expect(fromSaveV1(read).save.progress.firstUse).toContain('fight-guide');
  });

  it('with seed 21 the first strike dents him, so the dent is explained', () => {
    const g = game([], 21);
    enter(g);
    playGuidedRound(g);
    expect(g.fight().lastStrike?.dented).toBe(true);
    g.act({ type: 'fight/guide-next' });
    expect(g.step()).toBe('dent');
  });

  it('keeps the way back shut while it still talks over a fight already won', () => {
    // Seed 11 rolls 4, 4, 4: four blows of 4 and a charge of 4 take armour 20 to 0.
    const g = game([], 11);
    enter(g);
    g.act({ type: 'fight/guide-next' });
    g.act({ type: 'fight/guide-next' });
    g.act({ type: 'fight/roll' });
    expect(g.fight().dice).toEqual([4, 4, 4]);
    for (const slot of ['blade', 'charge', 'reach'] as const) {
      g.act({ type: 'fight/place', die: guideDice(slot, g.fight())[0] ?? -1, slot });
    }
    g.act({ type: 'fight/blows', x: 4 });
    g.act({ type: 'fight/strike' });
    expect(g.fight().phase).toBe('won');
    expect(g.fight().lastStrike?.clean).toBe(true);
    expect(g.step()).toBe('banner');
    g.act({ type: 'fight/close' });
    expect(g.state().ui.screen).toBe('fight');
    g.act({ type: 'fight/guide-next' });
    expect(g.step()).toBe('steam');
    g.act({ type: 'fight/guide-next' });
    g.act({ type: 'fight/guide-next' });
    expect(g.step()).toBeNull();
    g.act({ type: 'fight/close' });
    expect(g.state().ui.screen).toBe('map');
  });

  it('comes back next fight if he leaves before the first strike', () => {
    const g = game();
    enter(g);
    g.act({ type: 'fight/leave' });
    expect(g.state().ui.screen).toBe('map');
    expect(g.step()).toBeNull();
    expect(g.state().save.progress.firstUse).not.toContain('fight-guide');
    enter(g);
    expect(g.step()).toBe('armour');
  });

  it('is met if he leaves after the first strike', () => {
    const g = game();
    enter(g);
    playGuidedRound(g);
    g.act({ type: 'fight/leave' });
    expect(g.fight().phase).toBe('lost');
    expect(g.step()).toBeNull();
    expect(g.state().save.progress.firstUse).toContain('fight-guide');
  });

  it('picks up again in a fight resumed on launch', () => {
    const g = game();
    enter(g);
    g.act({ type: 'fight/guide-next' });
    g.act({ type: 'fight/guide-next' });
    g.act({ type: 'fight/roll' });
    const read = decodeSave(JSON.parse(JSON.stringify(toSaveV1(g.state(), at))), at);
    if (!read) throw new Error('save did not read');
    const { save, room, fight } = fromSaveV1(read);
    const again = createGameStore({
      makeCtx: () => ({ now: Date.parse(at), rng: { next: () => 0.5 } }),
    });
    again.getState().dispatch({ type: 'boot/start', save, room, fight });
    expect(again.getState().ui.screen).toBe('fight');
    expect(again.getState().ui.fightGuide).toBe('blade');
  });

  it('has a line for every step, short, in plain words, with Nikola speaking', () => {
    expect(hr.story.speakers.nikola).toBe('Nikola');
    for (const step of GUIDE_STEPS) {
      const lines = hr.fightGuide.steps[step];
      expect(lines.length, step).toBeGreaterThan(0);
      for (const line of lines) {
        expect(line.length, line).toBeLessThanOrEqual(80);
        // Present tense and imperatives only: no "-o si", "-la si", "jesi li".
        expect(line, line).not.toMatch(/\b(jesi|si)\b|o si\b|la si\b/i);
      }
    }
  });
});
