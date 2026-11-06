// Story 1.13: rooms 1–4 back to back, from a fresh start without the dev panel, through
// the real store, reducer and content, each room from arrival to restart, then the
// placeholder "to be continued" screen. He plays as he would on the tablet: he touches the
// machine, pokes the dial, pins, writes his lines and, in room 4, moves weights and splits.
// Story 1.14's pin flow: the dial keeps turning in its poke window while he pins, the
// machine tests each pin as he confirms it, and each right pin pays 2 parts. Story 1.15's
// Balance: in room 4 the tray appears once his dial reaches 6 without levelling the pans,
// every move acts on both sides and writes its lines straight away, and the splitter
// appears once a side holds only x pieces. Story 1.16: room 4 has no pin; the pans stay at
// the slider's x through every move; an early `x = 9` is refused until the pans are
// simplified; and once x is alone he fills `x = ☐` and the check line's blank. After story
// 1.16 Luka ran room 4's dial to 0–12, past the answer, with the tray from the start: the
// slider at 9 levels the scale, his check, but `x = 9` still waits for simplifying.

import { describe, expect, it } from 'vitest';
import { formatLine, formatTokens } from '@/math/format';
import { tokenFromChar } from '@/math/tokens';
import { handoverView } from '@/room/handover';
import { refusalView } from '@/room/notebook';
import { scaleView } from '@/room/scale';
import { splitterOffered } from '@/room/splitter';
import { trayOffered } from '@/room/tray';
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
 * machine turns the dial to its maximum, 20) and explores from there.
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

/** The dial turned notch by notch from where it stands up to `to`. */
function dialUpTo(game: Game, to: number) {
  for (let x = game.stage().dialX + 1; x <= to; x += 1) game.act({ type: 'dial/set', x });
}

/** Room 4 up to x alone: a float of 5 over the scale, then a split by 2. */
function balanceRoomFour(game: Game) {
  for (let i = 0; i < 4; i += 1) game.act({ type: 'tray/step', kind: 'float', by: 1 });
  game.act({ type: 'tray/drop', kind: 'float' });
  game.act({ type: 'splitter/split' });
}

/**
 * Room 4, the water wheel (story 1.16: no pin, one new idea, Balance), with the tray from
 * the start. He turns the slider to 9, where the scale levels, and tries `x = 9`: it is
 * refused until the pans are simplified, so he deletes it. A float of 5 over the scale takes
 * 5 off both sides (`2x + 5 − 5 = 23 − 5`, then `2x = 18`, written for him); the splitter
 * appears and splits by 2 (`2x : 2 = 18 : 2`), leaving x alone. He fills 9 into `x = ☐`,
 * then into the check line, `2 · ☐ + 5 = 23`.
 */
function playRoomFour(game: Game) {
  game.act({ type: 'machine/touch' });
  dialUpTo(game, 9);
  game.write('x=9');
  for (let i = 0; i < 3; i += 1) game.act({ type: 'notebook/delete' });
  balanceRoomFour(game);
  game.write('9');
  game.write('9');
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
      // Story 1.16: no pin in room 4, so no poke or pin phase.
      'r04.0:arrive',
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

  it('pays off his pins, writes the Balance lines for him in room 4, and never jams on the way', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    playRoomFour(game);
    const of = (type: DomainEvent['type']) => game.seen.filter((event) => event.type === type);
    expect(of('PredictionMade')).toEqual([
      { type: 'PredictionMade', roomId: 'r03', stage: 0, right: true },
      { type: 'PredictionMade', roomId: 'r03', stage: 1, right: true },
    ]);
    expect(of('WayUsed')).toEqual([
      { type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' },
      { type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' },
    ]);
    const accepted = of('LineAccepted');
    expect(accepted.filter((event) => 'roomId' in event && event.roomId === 'r04')).toEqual([
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: false },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: true },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: true },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'typed', progress: true },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'typed', progress: true },
    ]);
    expect(of('MachineJammed')).toEqual([]);
    expect(of('LineWrong')).toEqual([]);
  });

  it('writes room 4 the Balance way: the move, its result, the split, then his two lines', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    playRoomFour(game);
    expect(game.stage().lines.map((line) => [formatTokens(line.tokens), line.source])).toEqual([
      ['2x + 5 = 23', 'given'],
      ['2x + 5 − 5 = 23 − 5', 'balance'],
      ['2x = 18', 'balance'],
      ['2x : 2 = 18 : 2', 'balance'],
      ['x = 9', 'typed'],
      ['2 · 9 + 5 = 23', 'typed'],
    ]);
  });

  // Story 1.16, AC 8: the refused early answer. Since Luka ran room 4's dial to 0–12, the
  // slider at 9 levels the scale first: it is his check, not a way to finish.
  it('refuses his early x = 9 in room 4 like an incomplete line, with its tag, until he simplifies', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    game.act({ type: 'machine/touch' });
    dialUpTo(game, 9);
    expect(scaleView(game.store.getState().room as RoomState)).toMatchObject({
      x: 9,
      level: true,
      readouts: { left: '23', right: '23' },
    });
    const from = game.seen.length;
    game.write('x=9');
    const room = game.store.getState().room as RoomState;
    expect(room.stage.lines.map((line) => formatTokens(line.tokens))).toEqual(['2x + 5 = 23']);
    expect(formatTokens(room.stage.draft)).toBe('x = 9');
    expect(room.stage).toMatchObject({ refused: 1, jam: null, machineProgress: [0] });
    expect(refusalView(room)).toBe('simplify');
    expect(game.seen.slice(from)).toEqual([]);
    // Once Balance simplifies the pans the tag goes, and the same line is taken.
    balanceRoomFour(game);
    const alone = game.store.getState().room as RoomState;
    expect(refusalView(alone)).toBeNull();
    // The slider still stands at 9, and x alone weighs level there too.
    expect(scaleView(alone)).toMatchObject({
      x: 9,
      level: true,
      readouts: { left: '9', right: '9' },
    });
    // The blank starts empty: he fills 9 himself. (Story 1.16 review: 1.16 carried the
    // refused x = 9 into the blank, so enter was enough.)
    expect(alone.stage.draft).toEqual([]);
    game.write('9');
    expect(formatTokens(game.stage().lines.at(-1)?.tokens ?? [])).toBe('x = 9');
  });

  // Story 1.16, AC 1: the slider is the only x, so the scale stays out of balance at 6.
  it('weighs room 4 at the slider’s 6 through every move: 17 vs 23, 12 vs 18, then 6 vs 9', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    game.act({ type: 'machine/touch' });
    const readouts: string[] = [];
    const act = game.act;
    game.act = (action) => {
      act(action);
      const room = game.store.getState().room as RoomState;
      if (
        action.type !== 'dial/set' &&
        action.type !== 'tray/drop' &&
        action.type !== 'splitter/split'
      ) {
        return;
      }
      const view = scaleView(room);
      readouts.push(`${view.x}: ${view.readouts?.left} vs ${view.readouts?.right} ${view.level}`);
    };
    dialUpTo(game, 6);
    balanceRoomFour(game);
    game.act = act;
    expect(readouts.slice(-3)).toEqual([
      '6: 17 vs 23 false',
      '6: 12 vs 18 false',
      '6: 6 vs 9 false',
    ]);
  });

  // Story 1.16, AC 3 and 4: once x is alone, x = ☐ pulses with its tag; then the check line.
  it('gives room 4 the last two lines as blanks once x is alone, and the answer tag', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    game.act({ type: 'machine/touch' });
    const blanks = () =>
      game.stage().templates.map((line) =>
        formatLine(line)
          .map((segment) => (segment.kind === 'blank' ? '☐' : segment.text))
          .join(''),
      );
    const tag = () => {
      const { room, save } = game.store.getState();
      return handoverView(room, save.progress.firstUse, save.progress.tools);
    };
    for (const x of [1, 2, 3, 4, 5, 6]) game.act({ type: 'dial/set', x });
    for (let i = 0; i < 4; i += 1) game.act({ type: 'tray/step', kind: 'float', by: 1 });
    game.act({ type: 'tray/drop', kind: 'float' });
    expect(blanks()).toEqual([]);
    game.act({ type: 'splitter/split' });
    expect(blanks()).toEqual(['x = ☐', '2 · ☐ + 5 = 23']);
    expect(tag()).toBe('answer');
    game.write('9');
    expect(blanks()).toEqual(['2 · ☐ + 5 = 23']);
    // Met once per game: answer now, and check back in room 1.
    expect(tag()).toBeNull();
    expect(game.store.getState().save.progress.firstUse).toEqual(
      expect.arrayContaining(['handover-answer', 'handover-check']),
    );
  });

  // Story 1.16: Try values can't finish room 4, so the tray is there from his first touch.
  it('offers room 4’s tools one at a time: the tray from the start, then the splitter', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    const offered: string[] = [];
    const act = game.act;
    game.act = (action) => {
      act(action);
      const state = game.store.getState();
      const room = state.room as RoomState;
      const tools = [
        trayOffered(room, state.save.progress.tools) ? 'tray' : null,
        splitterOffered(room, state.save.progress.tools) ? 'splitter' : null,
      ].filter((tool) => tool !== null);
      const now = `${action.type}${action.type === 'dial/set' ? ` ${action.x}` : ''}: ${tools.join(' ')}`;
      if (offered.at(-1)?.split(': ')[1] !== now.split(': ')[1]) offered.push(now);
    };
    playRoomFour(game);
    game.act = act;
    // Typing and the presentations go round `game.act`, so only his moves on the machine show.
    expect(offered).toEqual(['machine/touch: tray', 'tray/drop: tray splitter']);
    const done = game.store.getState();
    expect(trayOffered(done.room as RoomState, done.save.progress.tools)).toBe(false);
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
    // Story 1.16: room 4 has no pin to confirm (it was the third, at 2).
    expect(confirms).toEqual([
      { dialX: 14, events: ['PredictionMade'] },
      { dialX: 20, events: ['PredictionMade'] },
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
    // Story 1.16: room 4 has no pin any more, so nothing more is paid there (it paid 2).
    playRoomFour(game);
    expect(parts()).toMatchObject({ parts: 4, paidPredictions: ['r03:0', 'r03:1'] });
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
    // Story 1.16: no pin, and x = 9 waits for Balance (it pinned, then typed both lines).
    game.act({ type: 'machine/touch' });
    balanceRoomFour(game);
    game.write('9');
    game.write('9');
    for (let i = 0; i < 40; i += 1) game.act({ type: 'clock/tick' });
    expect(game.store.getState().ui.screen).toBe('continued');
  });
});
