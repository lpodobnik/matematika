// Story 1.15 through the real store: the handover tags' steps are met as he takes them,
// and the clock shows the current step again after a minute without his acting.

import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { tokenFromChar } from '@/math/tokens';
import { handoverView } from '@/room/handover';
import type { FirstUseId, RoomState, ToolId } from '@/room/types';
import type { Action } from '@/store/actions';
import { initialGameState } from '@/store/reducer';
import { createGameStore } from '@/store/store';

function playing(firstUse: FirstUseId[] = [], tools: ToolId[] = []) {
  const clock = { now: 1000 };
  const initial = initialGameState();
  const store = createGameStore({
    makeCtx: () => ({ now: clock.now, rng: { next: () => 0.5 } }),
    effects: [],
    initialState: {
      ...initial,
      save: {
        ...initial.save,
        progress: {
          roomsDone: [],
          started: [],
          onMap: false,
          told: [],
          ideasSeen: [],
          tornPages: [],
          tools,
          firstUse,
        },
      },
    },
  });
  const act = (action: Action) => store.getState().dispatch(action);
  const write = (text: string) => {
    for (const char of text) {
      const token = tokenFromChar(char);
      if (token) act({ type: 'notebook/type', token });
    }
    act({ type: 'notebook/enter' });
  };
  const room = () => store.getState().room as RoomState;
  const met = () => store.getState().save.progress.firstUse;
  const shown = () => {
    const state = store.getState();
    return handoverView(state.room, state.save.progress.firstUse, state.save.progress.tools);
  };
  /** The clock ticks once a second for `ms`. */
  const wait = (ms: number) => {
    for (let t = 0; t < ms; t += 1000) {
      clock.now += 1000;
      act({ type: 'clock/tick' });
    }
  };
  return { store, clock, act, write, room, met, shown, wait };
}

describe('the handover tags through the store (story 1.15)', () => {
  it('walks room 1: dial, then write once the pans level, then check, each met as he takes it', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r01' });
    expect(game.shown()).toBe('dial');
    game.act({ type: 'machine/touch' });
    expect(game.shown()).toBe('dial');
    game.act({ type: 'dial/set', x: 1 });
    expect(game.met()).toEqual(['handover-dial']);
    expect(game.shown()).toBeNull();
    for (const x of [2, 3, 4, 5]) game.act({ type: 'dial/set', x });
    expect(game.shown()).toBe('write');
    game.write('5');
    expect(game.met()).toEqual(['handover-dial', 'handover-write']);
    expect(game.shown()).toBe('check');
    game.write('5');
    expect(game.met()).toEqual(['handover-dial', 'handover-write', 'handover-check']);
    expect(game.room().stage.phase).toBe('locked');
    expect(game.shown()).toBeNull();
  });

  it('stamps the idle clock as a stage arrives and on each action of his that does something', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r01' });
    expect(game.room().stage.lastActionAt).toBe(1000);
    game.clock.now = 4000;
    game.act({ type: 'machine/touch' });
    expect(game.room().stage.lastActionAt).toBe(4000);
    // A touch that does nothing is no action: the state stays as it was.
    const before = game.room();
    game.clock.now = 5000;
    game.act({ type: 'machine/touch' });
    game.act({ type: 'pin/confirm' });
    expect(game.room()).toBe(before);
    game.act({ type: 'dial/set', x: 3 });
    expect(game.room().stage.lastActionAt).toBe(5000);
  });

  it('shows the current step again after a minute without his acting, met or not, until he acts', () => {
    const game = playing(['handover-dial']);
    game.act({ type: 'room/enter', roomId: 'r01' });
    game.act({ type: 'machine/touch' });
    expect(game.shown()).toBeNull();
    game.wait(tuning.hintIdleMs - 1000);
    expect(game.room().stage.idle).toBe(false);
    expect(game.shown()).toBeNull();
    game.wait(1000);
    expect(game.room().stage.idle).toBe(true);
    expect(game.shown()).toBe('dial');
    // Ticks while idle change nothing more.
    const idle = game.room();
    game.wait(5000);
    expect(game.room()).toBe(idle);
    game.act({ type: 'dial/set', x: 2 });
    expect(game.room().stage.idle).toBe(false);
    expect(game.shown()).toBeNull();
  });

  it('starts the clock over in each stage as it arrives', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r02' });
    game.act({ type: 'machine/touch' });
    game.act({ type: 'dial/set', x: 4 });
    game.write('4');
    game.write('4');
    game.clock.now = 90_000;
    game.act({ type: 'presentation/done', roomId: 'r02', stage: 0, phase: 'locked' });
    expect(game.room().stageIndex).toBe(1);
    expect(game.room().stage).toMatchObject({ phase: 'arrive', lastActionAt: 90_000, idle: false });
  });

  it('meets the tray with his first drop in room 4, and never touches the first-use wiggles', () => {
    const game = playing(['pin', 'handover-dial'], ['balance']);
    game.act({ type: 'room/enter', roomId: 'r04' });
    game.act({ type: 'machine/touch' });
    game.act({ type: 'pin/set', value: { kind: 'x', x: 9 } });
    game.act({ type: 'pin/confirm' });
    if (game.room().stage.dialX !== 6) game.act({ type: 'dial/set', x: 6 });
    expect(game.shown()).toBe('tray');
    game.act({ type: 'tray/drop', kind: 'weight' });
    expect(game.met()).toContain('handover-tray');
    // Story 1.15 lane B: the splitter is offered only once a side holds only x, so a first
    // drop that leaves numbers on both sides doesn't offer (or wiggle) it yet.
    expect(game.met().filter((id) => !id.startsWith('handover-'))).toEqual(['pin', 'tray']);
  });
});
