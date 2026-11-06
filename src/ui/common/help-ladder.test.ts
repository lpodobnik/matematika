// Story 2.7 through the real store: help climbs a level after each minute without his
// acting, and every 3 jams in a row; a line that moves him on takes it back to none. It is
// free and never recorded: no event, nothing saved.

import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { formatEquation } from '@/math/format';
import { tokenFromChar } from '@/math/tokens';
import { workedExample } from '@/room/help';
import { hintView } from '@/room/hint';
import type { RoomState, ToolId } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { toSaveV1 } from '@/store/persist';
import { initialGameState } from '@/store/reducer';
import { createGameStore } from '@/store/store';
import { helpExample, helpStructure } from '@/ui/common/hint-text';

function playing(tools: ToolId[] = []) {
  const clock = { now: 1000 };
  const events: DomainEvent[] = [];
  const initial = initialGameState();
  const store = createGameStore({
    makeCtx: () => ({ now: clock.now, rng: { next: () => 0.5 } }),
    effects: [(event) => events.push(event)],
    initialState: {
      ...initial,
      save: { ...initial.save, progress: { ...initial.save.progress, tools } },
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
  /** He does nothing for `ms`, with the clock ticking each second. */
  const wait = (ms: number) => {
    for (let t = 0; t < ms; t += 1000) {
      clock.now += 1000;
      act({ type: 'clock/tick' });
    }
  };
  const room = () => store.getState().room as RoomState;
  const shown = () => {
    const state = store.getState();
    return hintView(state.room, state.save.progress.tools, state.ui.hint);
  };
  return { store, clock, events, act, write, wait, room, shown };
}

describe('the help ladder (story 2.7)', () => {
  it('climbs a level each minute without his acting, to 4, showing the move from 2', () => {
    const g = playing();
    g.act({ type: 'room/enter', roomId: 'r01' });
    g.act({ type: 'machine/touch' });
    expect(g.room().stage.help).toBe(0);
    g.wait(tuning.hintIdleMs);
    expect(g.room().stage.help).toBe(1);
    expect(g.shown()).toMatchObject({ level: 1, move: null });
    g.wait(tuning.hintIdleMs);
    expect(g.shown()).toMatchObject({ level: 2, move: { kind: 'slide', direction: 1 } });
    g.wait(tuning.hintIdleMs * 3);
    expect(g.room().stage.help).toBe(4);
  });

  it('climbs a level every 3 jams in a row', () => {
    const g = playing();
    g.act({ type: 'room/enter', roomId: 'r01' });
    g.act({ type: 'machine/touch' });
    for (let jam = 1; jam <= 3; jam += 1) {
      g.write('7');
      expect(g.room().stage.jam).not.toBeNull();
      g.act({ type: 'notebook/delete' });
    }
    expect(g.room().stage.help).toBe(1);
  });

  it('goes back to none when a line moves him on, and starts over on the next stage', () => {
    const g = playing();
    g.act({ type: 'room/enter', roomId: 'r01' });
    g.act({ type: 'machine/touch' });
    g.wait(tuning.hintIdleMs * 2);
    expect(g.room().stage.help).toBe(2);
    for (const x of [1, 2, 3, 4, 5]) g.act({ type: 'dial/set', x });
    g.write('5');
    expect(g.room().stage.help).toBe(0);
  });

  it('stays through a valid line that doesn’t move him on: a weight of 1 on both sides', () => {
    const g = playing(['balance']);
    g.act({ type: 'room/enter', roomId: 'r04' });
    g.act({ type: 'machine/touch' });
    for (let x = 1; x <= 9; x += 1) g.act({ type: 'dial/set', x });
    g.wait(tuning.hintIdleMs * 2);
    expect(g.room().stage.help).toBe(2);
    const lines = g.room().stage.lines.length;
    g.act({ type: 'tray/drop', kind: 'weight' });
    expect(g.room().stage.lines.length).toBeGreaterThan(lines);
    expect(g.room().stage.help).toBe(2);
  });

  it('brackets a side of several terms in level 3’s split line, as the machine writes it', () => {
    const g = playing(['balance']);
    g.act({ type: 'room/enter', roomId: 'r04' });
    g.act({ type: 'machine/touch' });
    for (let x = 1; x <= 9; x += 1) g.act({ type: 'dial/set', x });
    g.write('2x+5-5=23-5');
    g.wait(tuning.hintIdleMs * 3);
    expect(g.shown()).toMatchObject({ level: 3, move: { kind: 'split', parts: 2 } });
    expect(helpStructure(g.store.getState())).toBe('(2x + 5 − 5) : □ = (23 − 5) : □');
  });

  it('stays through a reset, which doesn’t move him on', () => {
    const g = playing();
    g.act({ type: 'room/enter', roomId: 'r01' });
    g.act({ type: 'machine/touch' });
    g.wait(tuning.hintIdleMs);
    g.act({ type: 'stage/reset' });
    expect(g.room().stage.help).toBe(1);
  });

  it('is free and never recorded: no event, and nothing about it in the save', () => {
    const g = playing();
    g.act({ type: 'room/enter', roomId: 'r01' });
    g.act({ type: 'machine/touch' });
    g.events.length = 0;
    g.wait(tuning.hintIdleMs * 4);
    expect(g.events).toEqual([]);
    expect(JSON.stringify(toSaveV1(g.store.getState(), '2026-11-06T10:00:00.000Z'))).not.toMatch(
      /help/,
    );
  });

  it('at level 3, shows the line a move on the machine writes, with blanks (room 4)', () => {
    const g = playing(['balance']);
    g.act({ type: 'room/enter', roomId: 'r04' });
    g.act({ type: 'machine/touch' });
    // Room 4's tray comes once the slider has stood at its end.
    for (let x = 1; x <= 9; x += 1) g.act({ type: 'dial/set', x });
    g.wait(tuning.hintIdleMs * 3);
    const state = g.store.getState();
    expect(g.shown()).toMatchObject({
      level: 3,
      move: { kind: 'tray', piece: 'float', amount: 5 },
    });
    expect(helpStructure(state)).toBe('2x + 5 − □ = 23 − □');
  });

  it('at level 4 in room 6, compares, as the room asks, never adding up the right side', () => {
    const g = playing(['balance']);
    g.act({ type: 'room/enter', roomId: 'r06' });
    const lines = (workedExample(g.room(), ['balance']) ?? []).map(formatEquation);
    expect(lines).toEqual(['x + 36 = 38 + 17', 'x = 17 + 2', 'x = 19', '19 + 36 = 38 + 17']);
  });

  it('at level 4, solves the same kind of equation with other numbers, for rooms 1–4', () => {
    const g = playing(['balance']);
    for (const roomId of ['r01', 'r02', 'r03', 'r04'] as const) {
      g.act({ type: 'room/enter', roomId });
      const example = workedExample(g.room(), ['balance']);
      expect(example, roomId).not.toBeNull();
      const [first, ...rest] = example ?? [];
      // Another equation than the room's own, ending on its check line.
      const own = g.room().stage.lines[0]?.tokens.join('');
      expect(formatEquation(first as never).replaceAll(' ', ''), roomId).not.toBe(own);
      expect(rest.length, roomId).toBeGreaterThanOrEqual(2);
    }
    g.act({ type: 'room/enter', roomId: 'r01' });
    g.act({ type: 'machine/touch' });
    g.wait(tuning.hintIdleMs * 4);
    expect(helpExample(g.store.getState())).toBe('x + 4 = 7\nx = 3\n3 + 4 = 7');
  });
});
