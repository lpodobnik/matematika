// Story 1.13: rooms 1–4 back to back, from a fresh start without the dev panel, through
// the real store, reducer and content, each room from arrival to restart, then the
// placeholder "to be continued" screen. He plays as he would on the tablet: he touches the
// machine, pokes the dial, pins, writes his lines and, in room 4, moves weights and splits.
// Story 1.14's pin flow: the dial keeps turning in its poke window while he pins, the
// machine tests each pin as he confirms it, and each right pin pays 2 parts.

import { describe, expect, it } from 'vitest';
import { tokenFromChar } from '@/math/tokens';
import type { RoomState } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { createGameStore } from '@/store/store';

/** A fresh game, as main.tsx starts it (room 1), with a clock and every event recorded. */
function freshGame() {
  const clock = { now: 0 };
  const seen: DomainEvent[] = [];
  const store = createGameStore({
    makeCtx: () => ({ now: clock.now, rng: { next: () => 0.5 } }),
    effects: [(event) => seen.push(event)],
  });
  /** Every phase the game passes through, as `r02.1:open`, without repeats. */
  const phases: string[] = [];
  const act = (action: Action) => {
    clock.now += 500;
    store.getState().dispatch(action);
    const room = store.getState().room;
    const phase = room ? `${room.spec.id}.${room.stageIndex}:${room.stage.phase}` : 'none';
    if (phases[phases.length - 1] !== phase) phases.push(phase);
  };
  /** Types a line on the pad, a key at a time, and presses enter. */
  const write = (line: string) => {
    for (const char of line) {
      const token = tokenFromChar(char);
      if (!token) throw new Error(`no pad key for ${char}`);
      act({ type: 'notebook/type', token });
    }
    act({ type: 'notebook/enter' });
  };
  /** The machine finishes presenting the lock or the restart playing now. */
  const presented = () => {
    const room = store.getState().room as RoomState;
    const { phase } = room.stage;
    if (phase !== 'locked' && phase !== 'restart') throw new Error(`nothing plays in ${phase}`);
    act({ type: 'presentation/done', roomId: room.spec.id, stage: room.stageIndex, phase });
  };
  const stage = () => (store.getState().room as RoomState).stage;
  act({ type: 'room/enter', roomId: 'r01' });
  return { store, seen, phases, act, write, presented, stage };
}

type Game = ReturnType<typeof freshGame>;

/** Room 1, the door lift: he finds 5 on the dial and fills both blanks. */
function playRoomOne(game: Game) {
  game.act({ type: 'machine/touch' });
  for (const x of [1, 2, 3, 4, 5]) game.act({ type: 'dial/set', x });
  game.write('5');
  game.write('5');
  game.presented();
  game.presented();
}

/** Room 2, the street lamps: 3x = 12, then x : 3 = 5 on a dial in 3s. */
function playRoomTwo(game: Game) {
  game.act({ type: 'machine/touch' });
  game.act({ type: 'dial/set', x: 4 });
  game.write('4');
  game.write('4');
  game.presented();
  game.act({ type: 'machine/touch' });
  for (const x of [3, 6, 9, 12, 15]) game.act({ type: 'dial/set', x });
  game.write('15');
  game.write('15');
  game.presented();
  game.presented();
}

/**
 * Room 3, the sluice gate: he pokes, pins where it levels and pokes again while the pin
 * waits, confirms (the machine turns the dial to 14 itself), then pins a direction (the
 * machine turns the dial up 3 notches) and explores from there.
 */
function playRoomThree(game: Game) {
  game.act({ type: 'machine/touch' });
  for (const x of [7, 8, 9]) game.act({ type: 'dial/set', x });
  game.act({ type: 'pin/set', value: { kind: 'x', x: 14 } });
  for (const x of [8, 9]) game.act({ type: 'dial/set', x });
  game.act({ type: 'pin/confirm' });
  game.write('14');
  game.write('14');
  game.presented();
  game.act({ type: 'machine/touch' });
  game.act({ type: 'pin/set', value: { kind: 'choice', index: 1 } });
  game.act({ type: 'pin/confirm' });
  for (const x of [5, 10, 14]) game.act({ type: 'dial/set', x });
  game.write('14');
  game.write('14');
  game.presented();
  game.presented();
}

/**
 * Room 4, the water wheel: the dial stops at 6, so he pins beyond it (the pans weigh 9 for
 * a moment, and the dial stays where it is), takes 5 off both pans with floats (2x = 18 is
 * written for him), splits by 2 and writes the last two lines.
 */
function playRoomFour(game: Game) {
  game.act({ type: 'machine/touch' });
  for (const x of [1, 2, 3]) game.act({ type: 'dial/set', x });
  game.act({ type: 'pin/set', value: { kind: 'x', x: 9 } });
  game.act({ type: 'dial/set', x: 2 });
  game.act({ type: 'pin/confirm' });
  for (const x of [4, 5, 6]) game.act({ type: 'dial/set', x });
  for (let i = 0; i < 4; i += 1) game.act({ type: 'tray/step', kind: 'float', by: 1 });
  game.act({ type: 'tray/drop', side: 'left', kind: 'float' });
  game.act({ type: 'tray/drop', side: 'right', kind: 'float' });
  game.act({ type: 'splitter/split' });
  game.write('x=9');
  game.write('2·9+5=23');
  game.presented();
  game.presented();
}

describe('rooms 1–4 back to back (story 1.13)', () => {
  it('runs rooms 1, 2, 3 and 4 in order, each from arrival to restart', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    playRoomFour(game);
    expect(game.phases).toEqual([
      'r01.0:arrive',
      'r01.0:open',
      'r01.0:locked',
      'r01.0:restart',
      'r02.0:arrive',
      'r02.0:open',
      'r02.0:locked',
      'r02.1:arrive',
      'r02.1:open',
      'r02.1:locked',
      'r02.1:restart',
      'r03.0:arrive',
      'r03.0:poke',
      'r03.0:pin',
      'r03.0:open',
      'r03.0:locked',
      'r03.1:arrive',
      'r03.1:pin',
      'r03.1:open',
      'r03.1:locked',
      'r03.1:restart',
      'r04.0:arrive',
      'r04.0:poke',
      'r04.0:pin',
      'r04.0:open',
      'r04.0:locked',
      'r04.0:restart',
      'r04.0:done',
    ]);
  });

  it('arrives at every stage, locks it and restarts every machine, in play order', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    playRoomFour(game);
    const milestones = game.seen.flatMap((event) => {
      if (event.type === 'StageArrived') return [`arrive ${event.roomId}.${event.stage}`];
      if (event.type === 'StageLocked') return [`lock ${event.roomId}.${event.stage}`];
      if (event.type === 'RoomRestarted') return [`restart ${event.roomId}`];
      return [];
    });
    expect(milestones).toEqual([
      'arrive r01.0',
      'lock r01.0',
      'restart r01',
      'arrive r02.0',
      'lock r02.0',
      'arrive r02.1',
      'lock r02.1',
      'restart r02',
      'arrive r03.0',
      'lock r03.0',
      'arrive r03.1',
      'lock r03.1',
      'restart r03',
      'arrive r04.0',
      'lock r04.0',
      'restart r04',
    ]);
  });

  it('pays off his pins, writes 2x = 18 for him in room 4, and never jams on the way', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    playRoomFour(game);
    const of = (type: DomainEvent['type']) => game.seen.filter((event) => event.type === type);
    expect(of('PredictionMade')).toEqual([
      { type: 'PredictionMade', roomId: 'r03', stage: 0, right: true },
      { type: 'PredictionMade', roomId: 'r03', stage: 1, right: true },
      { type: 'PredictionMade', roomId: 'r04', stage: 0, right: true },
    ]);
    expect(of('WayUsed')).toEqual([
      { type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' },
      { type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' },
    ]);
    const accepted = of('LineAccepted');
    expect(accepted.filter((event) => 'roomId' in event && event.roomId === 'r04')).toEqual([
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: true },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'typed', progress: true },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'typed', progress: true },
    ]);
    expect(of('MachineJammed')).toEqual([]);
    expect(of('LineWrong')).toEqual([]);
  });

  it('tests each pin as he confirms it: the machine turns the dial, firing no dial events', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    const confirms: { dialX: number; events: string[] }[] = [];
    const confirming = (play: (game: Game) => void) => {
      const act = game.act;
      game.act = (action) => {
        const from = game.seen.length;
        act(action);
        if (action.type !== 'pin/confirm') return;
        const events = game.seen.slice(from).map((event) => event.type);
        confirms.push({ dialX: game.stage().dialX, events });
      };
      play(game);
      game.act = act;
    };
    confirming(playRoomThree);
    confirming(playRoomFour);
    expect(confirms).toEqual([
      { dialX: 14, events: ['PredictionMade'] },
      { dialX: 3, events: ['PredictionMade'] },
      { dialX: 2, events: ['PredictionMade'] },
    ]);
  });

  it('pays 2 parts for each right pin, once per stage, into the save', () => {
    const game = freshGame();
    const parts = () => game.store.getState().save.economy;
    playRoomOne(game);
    playRoomTwo(game);
    expect(parts()).toMatchObject({ parts: 0, paidPredictions: [] });
    playRoomThree(game);
    expect(parts()).toMatchObject({ parts: 4, paidPredictions: ['r03:0', 'r03:1'] });
    playRoomFour(game);
    expect(parts()).toMatchObject({ parts: 6, paidPredictions: ['r03:0', 'r03:1', 'r04:0'] });
  });

  it('earns Balance only when room 3 restarts, so the tray and splitter wait for room 4', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    expect(game.store.getState().save.progress.tools).toEqual([]);
    playRoomThree(game);
    expect(game.store.getState().save.progress.tools).toEqual(['balance']);
    expect(game.store.getState().room?.spec.id).toBe('r04');
  });

  it('stays on the room screen until room 4’s restart ends, then shows "to be continued"', () => {
    const game = freshGame();
    const screens = new Set<string>();
    const unsubscribe = game.store.subscribe((state) => {
      if (state.room?.stage.phase !== 'done') screens.add(state.ui.screen);
    });
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    playRoomFour(game);
    unsubscribe();
    expect([...screens]).toEqual(['room']);
    const state = game.store.getState();
    expect(state.ui.screen).toBe('continued');
    expect(state.room?.spec.id).toBe('r04');
    expect(state.room?.stage.phase).toBe('done');
  });

  it('keeps the "to be continued" screen on the clock, and a dev jump leaves it for a room', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    playRoomFour(game);
    const done = game.store.getState();
    game.act({ type: 'clock/tick' });
    game.act({ type: 'machine/touch' });
    expect(game.store.getState().ui).toBe(done.ui);
    expect(game.store.getState().room).toBe(done.room);
    game.act({ type: 'room/enter', roomId: 'r02', stage: 1 });
    expect(game.store.getState().ui.screen).toBe('room');
    expect(game.stage().phase).toBe('arrive');
  });

  it('gets to "to be continued" on the clock too, if the machine never reports its restart', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    game.act({ type: 'machine/touch' });
    game.act({ type: 'pin/set', value: { kind: 'x', x: 9 } });
    game.act({ type: 'pin/confirm' });
    game.write('x=9');
    game.write('2·9+5=23');
    for (let i = 0; i < 40; i += 1) game.act({ type: 'clock/tick' });
    expect(game.store.getState().ui.screen).toBe('continued');
  });
});
