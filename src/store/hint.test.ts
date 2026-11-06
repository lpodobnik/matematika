// Story 1.16 through the real store: the hint button's presses live in `ui.hint`, change
// nothing in the room or the save, fire no event, and an action of his ends them.

import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { tokenFromChar } from '@/math/tokens';
import { hintView } from '@/room/hint';
import { refusalView } from '@/room/notebook';
import type { RoomState, ToolId } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { initialGameState } from '@/store/reducer';
import { createGameStore } from '@/store/store';

function playing(tools: ToolId[] = []) {
  const clock = { now: 1000 };
  const events: DomainEvent[] = [];
  const initial = initialGameState();
  const store = createGameStore({
    makeCtx: () => ({ now: clock.now, rng: { next: () => 0.5 } }),
    effects: [(event) => events.push(event)],
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
          firstUse: [],
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
  const hint = () => store.getState().ui.hint;
  const shown = () => {
    const state = store.getState();
    return hintView(state.room, state.save.progress.tools, state.ui.hint);
  };
  return { store, clock, events, act, write, room, hint, shown };
}

describe('the hint button through the store (story 1.16)', () => {
  it('starts with no hint', () => {
    expect(initialGameState().ui.hint).toBeNull();
  });

  it('shows the step, then the move, and changes nothing else: free, never recorded', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r01' });
    game.act({ type: 'machine/touch' });
    const room = game.room();
    const save = game.store.getState().save;
    game.events.length = 0;
    game.act({ type: 'hint/press' });
    expect(game.hint()).toEqual({ level: 1, presses: 1 });
    expect(game.shown()).toMatchObject({ level: 1, step: 'dial', move: null });
    game.act({ type: 'hint/press' });
    expect(game.shown()).toMatchObject({ level: 2, move: { kind: 'slide', direction: 1 } });
    game.act({ type: 'hint/press' });
    expect(game.hint()).toEqual({ level: 2, presses: 3 });
    expect(game.room()).toBe(room);
    expect(game.store.getState().save).toBe(save);
    expect(game.events).toEqual([]);
  });

  it('ends with an action of his that does something', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r01' });
    game.act({ type: 'machine/touch' });
    game.act({ type: 'hint/press' });
    // A touch that does nothing is no action: the hint stays.
    game.act({ type: 'machine/touch' });
    expect(game.hint()).not.toBeNull();
    game.act({ type: 'dial/set', x: 1 });
    expect(game.hint()).toBeNull();
    game.act({ type: 'hint/press' });
    game.act({ type: 'stage/reset' });
    expect(game.hint()).toBeNull();
    game.act({ type: 'hint/press' });
    game.act({ type: 'room/enter', roomId: 'r02' });
    expect(game.hint()).toBeNull();
  });

  it('stays through the clock, the phone’s notebook slide and the tools’ steppers', () => {
    const game = playing(['balance']);
    game.act({ type: 'room/enter', roomId: 'r01' });
    game.act({ type: 'machine/touch' });
    for (const x of [1, 2, 3, 4, 5]) game.act({ type: 'dial/set', x });
    game.act({ type: 'hint/press' });
    game.act({ type: 'hint/press' });
    const pressed = game.hint();
    for (let t = 0; t < tuning.hintIdleMs + 2000; t += 1000) {
      game.clock.now += 1000;
      game.act({ type: 'clock/tick' });
    }
    game.act({ type: 'notebook/slide', aside: true });
    expect(game.hint()).toBe(pressed);
    expect(game.shown()).toMatchObject({ level: 2, move: { kind: 'answer', x: 5 } });
    game.write('5');
    expect(game.hint()).toBeNull();
  });

  it('keeps the hint while he sets the tray’s number the move names', () => {
    const game = playing(['balance']);
    game.act({ type: 'room/enter', roomId: 'r04' });
    game.act({ type: 'machine/touch' });
    const stage = game.room().stage;
    // Room 4 with or without its pin (story 1.16 lane A takes it away).
    if (stage.phase === 'poke') {
      game.act({ type: 'pin/set', value: { kind: 'x', x: 9 } });
      game.act({ type: 'pin/confirm' });
    }
    for (let x = game.room().stage.dialX + 1; x <= 6; x += 1) game.act({ type: 'dial/set', x });
    game.act({ type: 'hint/press' });
    game.act({ type: 'hint/press' });
    expect(game.shown()?.move).toEqual({ kind: 'tray', piece: 'float', amount: 5 });
    const pressed = game.hint();
    game.act({ type: 'tray/step', kind: 'float', by: 1 });
    expect(game.hint()).toBe(pressed);
    game.act({ type: 'tray/drop', kind: 'float' });
    expect(game.hint()).toBeNull();
  });

  // Story 1.16 review: the refusal's tag at the notebook and a tag in the scene showed at
  // once. The refusal now stays up only until his next action (ui/common/hint-text.ts
  // hangs the scene's tags again then).
  it('takes the refusal down on his next action that does something, not on the clock', () => {
    const game = playing(['balance']);
    game.act({ type: 'room/enter', roomId: 'r04' });
    game.act({ type: 'machine/touch' });
    for (let x = 1; x <= 6; x += 1) game.act({ type: 'dial/set', x });
    game.write('x=9');
    expect(refusalView(game.room())).toBe('simplify');
    // The clock is not his action, and a press of the hint button changes nothing in the room.
    game.clock.now += tuning.hintIdleMs + 1000;
    game.act({ type: 'clock/tick' });
    const room = game.room();
    game.act({ type: 'hint/press' });
    expect(game.room()).toBe(room);
    expect(game.room().stage.refusal).toBe('simplify');
    // A dial notch takes it down.
    game.act({ type: 'dial/set', x: 5 });
    expect(game.room().stage.refusal).toBeNull();
    // Refused again, then a tray stepper (a setting, but his action): it goes too.
    for (let i = 0; i < 3; i += 1) game.act({ type: 'notebook/delete' });
    game.write('x=9');
    expect(game.room().stage.refusal).toBe('simplify');
    game.act({ type: 'tray/step', kind: 'float', by: 1 });
    expect(game.room().stage.refusal).toBeNull();
    // An action that does nothing leaves it: a tray step past the tray's end.
    for (let i = 0; i < 3; i += 1) game.act({ type: 'notebook/delete' });
    game.write('x=9');
    expect(game.room().stage.refusal).toBe('simplify');
    game.act({ type: 'tray/step', kind: 'weight', by: -1 });
    expect(game.room().stage.refusal).toBe('simplify');
  });

  it('does nothing once the stage locks', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r01' });
    game.act({ type: 'machine/touch' });
    for (const x of [1, 2, 3, 4, 5]) game.act({ type: 'dial/set', x });
    game.write('5');
    game.act({ type: 'hint/press' });
    game.write('5');
    expect(game.room().stage.phase).toBe('locked');
    expect(game.hint()).toBeNull();
    game.act({ type: 'hint/press' });
    expect(game.hint()).toBeNull();
  });
});
