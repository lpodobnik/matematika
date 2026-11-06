// Story 2.1: a reload resumes at the last written line. Each case plays rooms 1–4 through
// the real store to a point, puts the game on the device and reads it back as a launch does
// (JSON, the decoder, `boot/start`), and checks the room comes back as it was after the
// last committed line: the stage, the lines, the blanks, the pans, the machine's progress,
// the pin and the tools the stage offers. What he was only trying is not kept.

import { describe, expect, it } from 'vitest';
import { formatEquation, formatTokens } from '@/math/format';
import { tokenFromChar } from '@/math/tokens';
import { lineProgress } from '@/room/notebook';
import { splitterOffered } from '@/room/splitter';
import { trayOffered } from '@/room/tray';
import type { RoomState, ToolId } from '@/room/types';
import { decodeSave } from '@/save/decode';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { fromSaveV1, newSave, toSaveV1 } from '@/store/persist';
import { initialGameState } from '@/store/reducer';
import { createGameStore } from '@/store/store';
import type { GameState } from '@/store/types';

const at = '2026-11-06T10:00:00.000Z';

function game(tools: ToolId[] = []) {
  const clock = { now: 1_000 };
  const initial = initialGameState();
  const store = createGameStore({
    makeCtx: () => ({ now: clock.now, rng: { next: () => 0.5 } }),
    effects: [],
    initialState: {
      ...initial,
      save: {
        ...newSave(at),
        character: { name: 'Ivo', look: 'look-1' as const },
        progress: { ...newSave().progress, tools },
      },
    },
  });
  const act = (action: Action) => {
    clock.now += 500;
    store.getState().dispatch(action);
  };
  const write = (line: string) => {
    for (const char of line) {
      const token = tokenFromChar(char);
      if (!token) throw new Error(`no pad key for ${char}`);
      act({ type: 'notebook/type', token });
    }
    act({ type: 'notebook/enter' });
  };
  const presented = () => {
    const room = store.getState().room as RoomState;
    const { phase } = room.stage;
    if (phase !== 'locked' && phase !== 'restart') throw new Error(`nothing plays in ${phase}`);
    act({ type: 'presentation/done', roomId: room.spec.id, stage: room.stageIndex, phase });
  };
  return { store, act, write, presented };
}

type Game = ReturnType<typeof game>;

/** The game read back from the device as a launch reads it: JSON, decoded, `boot/start`. */
function reload(state: GameState) {
  const json: unknown = JSON.parse(JSON.stringify(toSaveV1(state, at)));
  const decoded = decodeSave(json, at);
  if (!decoded) throw new Error('the save did not decode');
  const { save, room } = fromSaveV1(decoded);
  const events: DomainEvent[] = [];
  const store = createGameStore({
    makeCtx: () => ({ now: 99_000, rng: { next: () => 0.5 } }),
    effects: [(event) => events.push(event)],
  });
  store.getState().dispatch({ type: 'boot/start', save, room });
  return { state: store.getState(), events };
}

/** What a reload must bring back of the room in play. */
function snapshot(state: GameState) {
  const room = state.room as RoomState;
  const { stage } = room;
  const { tools } = state.save.progress;
  return {
    room: `${room.spec.id}.${room.stageIndex}`,
    phase: stage.phase,
    lines: stage.lines.map(
      (line) =>
        `${formatTokens(line.tokens)} | ${line.source} | ${line.verdict.kind} | ${lineProgress(line.verdict)}`,
    ),
    templates: stage.templates.map((line) => line.join(' ')),
    pans: formatEquation(stage.pans),
    machineProgress: stage.machineProgress,
    pin: stage.pin,
    dialOpen: stage.dialOpen,
    tray: trayOffered(room, tools),
    splitter: splitterOffered(room, tools),
  };
}

function expectResumed(g: Game) {
  const before = g.store.getState();
  const { state, events } = reload(before);
  expect(snapshot(state)).toEqual(snapshot(before));
  expect(state.save.progress).toEqual(before.save.progress);
  expect(state.save.economy).toEqual(before.save.economy);
  // Resuming replays his lines without firing them again: no prediction is paid twice.
  expect(events).toEqual([{ type: 'SaveChanged' }]);
  return state;
}

describe('a reload resumes at the last written line (story 2.1)', () => {
  it('room 1 before any line: the stage arrives fresh, the dial not kept', () => {
    const g = game();
    g.act({ type: 'room/enter', roomId: 'r01' });
    g.act({ type: 'machine/touch' });
    for (const x of [1, 2, 3]) g.act({ type: 'dial/set', x });
    const { state } = reload(g.store.getState());
    expect(state.room?.spec.id).toBe('r01');
    expect(state.room?.stage.phase).toBe('arrive');
    expect(state.room?.stage.dialX).toBe(0);
    expect(state.ui.screen).toBe('room');
  });

  it('room 1 after the answer: the check line’s blank is next', () => {
    const g = game();
    g.act({ type: 'room/enter', roomId: 'r01' });
    g.act({ type: 'machine/touch' });
    g.write('5');
    const state = expectResumed(g);
    expect(state.room?.stage.templates).toHaveLength(1);
  });

  it('room 2, stage 2, after the answer', () => {
    const g = game();
    g.act({ type: 'room/enter', roomId: 'r02', stage: 1 });
    g.act({ type: 'machine/touch' });
    g.write('15');
    expect(expectResumed(g).room?.stageIndex).toBe(1);
  });

  it('room 3 after the pin is confirmed: the pin is back, resolved, and not paid again', () => {
    const g = game();
    g.act({ type: 'room/enter', roomId: 'r03' });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'pin/set', value: { kind: 'x', x: 14 } });
    g.act({ type: 'pin/confirm' });
    expect(g.store.getState().save.economy.parts).toBe(2);
    const state = expectResumed(g);
    expect(state.room?.stage.pin).toEqual({
      value: { kind: 'x', x: 14 },
      locked: true,
      resolved: true,
    });
    expect(state.save.economy.parts).toBe(2);
  });

  it('room 3 with a pin placed but not confirmed: the stage starts fresh', () => {
    const g = game();
    g.act({ type: 'room/enter', roomId: 'r03' });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'pin/set', value: { kind: 'x', x: 12 } });
    const { state } = reload(g.store.getState());
    expect(state.room?.stage.phase).toBe('arrive');
    expect(state.room?.stage.pin).toBeNull();
  });

  it('room 3, stage 2: the direction pin and the answer', () => {
    const g = game();
    g.act({ type: 'room/enter', roomId: 'r03', stage: 1 });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'pin/set', value: { kind: 'choice', index: 1 } });
    g.act({ type: 'pin/confirm' });
    g.write('14');
    expectResumed(g);
  });

  it('room 4 after a float of 5: both Balance lines, 2x = 18 on the pans, the splitter offered', () => {
    const g = game(['balance']);
    g.act({ type: 'room/enter', roomId: 'r04' });
    g.act({ type: 'machine/touch' });
    for (let i = 0; i < 4; i += 1) g.act({ type: 'tray/step', kind: 'float', by: 1 });
    g.act({ type: 'tray/drop', kind: 'float' });
    const state = expectResumed(g);
    expect(formatEquation((state.room as RoomState).stage.pans)).toBe('2x = 18');
    expect(splitterOffered(state.room as RoomState, ['balance'])).toBe(true);
  });

  it('room 4 after the split: x alone on the pans, and both blanks waiting', () => {
    const g = game(['balance']);
    g.act({ type: 'room/enter', roomId: 'r04' });
    g.act({ type: 'machine/touch' });
    for (let i = 0; i < 4; i += 1) g.act({ type: 'tray/step', kind: 'float', by: 1 });
    g.act({ type: 'tray/drop', kind: 'float' });
    g.act({ type: 'splitter/split' });
    const state = expectResumed(g);
    expect(formatEquation((state.room as RoomState).stage.pans)).toBe('x = 9');
    expect(state.room?.stage.templates).toHaveLength(2);
  });

  it('room 4 after the answer, and after the check line, which locks it again', () => {
    const g = game(['balance']);
    g.act({ type: 'room/enter', roomId: 'r04' });
    g.act({ type: 'machine/touch' });
    for (let i = 0; i < 4; i += 1) g.act({ type: 'tray/step', kind: 'float', by: 1 });
    g.act({ type: 'tray/drop', kind: 'float' });
    g.act({ type: 'splitter/split' });
    g.write('9');
    expectResumed(g);
    g.write('9');
    const { state } = reload(g.store.getState());
    expect(snapshot(state)).toEqual(snapshot(g.store.getState()));
    expect(state.room?.stage.phase).toBe('locked');
  });

  it('room 4 simplified by typed lines: the answer he typed comes back', () => {
    const g = game(['balance']);
    g.act({ type: 'room/enter', roomId: 'r04' });
    g.act({ type: 'machine/touch' });
    g.write('2x=18');
    g.write('x=9');
    expectResumed(g);
  });

  it('room 4 after many Balance moves: every line comes back (story 2.1 review)', () => {
    const g = game(['balance']);
    g.act({ type: 'room/enter', roomId: 'r04' });
    g.act({ type: 'machine/touch' });
    for (let i = 0; i < 31; i += 1) {
      g.act({ type: 'tray/drop', kind: 'weight' });
      g.act({ type: 'tray/drop', kind: 'float' });
    }
    expect((g.store.getState().room as RoomState).stage.lines.length).toBeGreaterThan(100);
    expectResumed(g);
  });

  it('room 4 after a reset: the splitter it offered stays offered (story 2.1 review)', () => {
    const g = game(['balance']);
    g.act({ type: 'room/enter', roomId: 'r04' });
    g.act({ type: 'machine/touch' });
    for (let i = 0; i < 4; i += 1) g.act({ type: 'tray/step', kind: 'float', by: 1 });
    g.act({ type: 'tray/drop', kind: 'float' });
    g.act({ type: 'stage/reset' });
    expect(splitterOffered(g.store.getState().room as RoomState, ['balance'])).toBe(true);
    const { state } = reload(g.store.getState());
    const store = createGameStore({ effects: [], initialState: state });
    store.getState().dispatch({ type: 'machine/touch' });
    expect(splitterOffered(store.getState().room as RoomState, ['balance'])).toBe(true);
  });

  it('a reload in a restart goes on to the next room (story 2.2)', () => {
    const g = game();
    g.act({ type: 'room/enter', roomId: 'r01' });
    g.act({ type: 'machine/touch' });
    g.write('5');
    g.write('5');
    g.presented();
    expect(g.store.getState().room?.stage.phase).toBe('restart');
    expect(g.store.getState().save.progress.roomsDone).toEqual(['r01']);
    const { state } = reload(g.store.getState());
    expect(state.ui.screen).toBe('room');
    expect(state.room?.spec.id).toBe('r02');
  });

  it('with every room done, the map shows', () => {
    const save = {
      ...newSave(at),
      character: { name: 'Ivo', look: 'look-1' as const },
      progress: { ...newSave().progress, roomsDone: ['r01', 'r02', 'r03', 'r04'] as const },
    };
    const store = createGameStore({ effects: [] });
    store.getState().dispatch({
      type: 'boot/start',
      save: { ...save, progress: { ...save.progress, roomsDone: [...save.progress.roomsDone] } },
      room: null,
    });
    expect(store.getState().ui.screen).toBe('map');
    expect(store.getState().room).toBeNull();
  });

  it('a saved line that no longer commits starts that stage fresh', () => {
    const store = createGameStore({ effects: [] });
    store.getState().dispatch({
      type: 'boot/start',
      save: newSave(at),
      room: {
        id: 'r02',
        stage: 1,
        lines: [{ text: 'x=16', source: 'typed', progress: true }],
        splitterSeen: false,
        pin: null,
      },
    });
    expect(store.getState().room?.stageIndex).toBe(1);
    expect(store.getState().room?.stage.lines).toHaveLength(1);
    expect(store.getState().room?.stage.phase).toBe('arrive');
  });

  it('a stage that no longer exists starts the room fresh', () => {
    const store = createGameStore({ effects: [] });
    store.getState().dispatch({
      type: 'boot/start',
      save: newSave(at),
      room: { id: 'r01', stage: 5, lines: [], pin: null, splitterSeen: false },
    });
    expect(store.getState().room?.spec.id).toBe('r01');
    expect(store.getState().room?.stageIndex).toBe(0);
  });

  it('a pin for a stage without one starts the stage fresh', () => {
    const store = createGameStore({ effects: [] });
    store.getState().dispatch({
      type: 'boot/start',
      save: newSave(at),
      room: { id: 'r01', stage: 0, lines: [], pin: { kind: 'x', x: 5 }, splitterSeen: false },
    });
    expect(store.getState().room?.stage.phase).toBe('arrive');
    expect(store.getState().room?.stage.pin).toBeNull();
  });
});
