// Story 1.13: rooms 1–4 back to back, from a fresh start without the dev panel, through
// the real store, reducer and content, each room from arrival to restart, then the
// map (story 2.2: each restart hands over to the next room, as before; after room 4, the
// map with its "to be continued" note). He plays as he would on the tablet: he touches the
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
import type { RoomId, RoomState, TrayKind } from '@/room/types';
import type { Action } from '@/store/actions';
import { type DomainEvent, isRoomEvent } from '@/store/events';
import { createGameStore } from '@/store/store';

/** A fresh game, as main.tsx starts it, walked into room 1, with a clock and every event recorded. */
function freshGame() {
  const clock = { now: 0 };
  const seen: DomainEvent[] = [];
  const store = createGameStore({
    makeCtx: () => ({ now: clock.now, rng: { next: () => 0.5 } }),
    effects: [(event) => isRoomEvent(event) && seen.push(event)],
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
  // Story 5.0: a new game opens on the opening, then the naming, then the town, where he
  // walks to room 1's gate.
  act({ type: 'boot/start', save: null, room: null });
  act({ type: 'opening/done' });
  act({ type: 'character/set', name: 'Ivo', look: 'look-3' });
  act({ type: 'map/travel', node: 'r01' });
  return { store, seen, phases, act, write, presented, stage };
}

type Game = ReturnType<typeof freshGame>;

/** From the map, a tap on a room (story 2.2); in a room already (a test that went there), nothing. */
function travel(game: Game, node: RoomId) {
  if (game.store.getState().ui.screen === 'map') game.act({ type: 'map/travel', node });
}

/** Room 1, the door lift: he finds 5 on the dial and fills both blanks. */
function playRoomOne(game: Game) {
  game.act({ type: 'machine/touch' });
  for (const x of [1, 2, 3, 4, 5]) game.act({ type: 'dial/set', x });
  game.write('5');
  game.write('5');
  game.presented();
  game.presented();
  // Story 2.5: the room's lines; story 2.4: Penkala asks who he is.
  game.act({ type: 'story/next' });
}

/** Room 2, the street lamps: 3x = 12, then x : 3 = 5 on a dial in 3s. */
function playRoomTwo(game: Game) {
  travel(game, 'r02');
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
  // Story 2.5: the room's lines, then on.
  game.act({ type: 'story/next' });
}

/**
 * Room 3, the sluice gate: he pokes, pins where it levels and pokes again while the pin
 * waits, confirms (the machine turns the dial to 14 itself), then pins a direction (the
 * machine turns the dial to its maximum, 20) and explores from there.
 */
function playRoomThree(game: Game) {
  travel(game, 'r03');
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
  // Story 2.5: the room's lines, then on.
  game.act({ type: 'story/next' });
}

/** The tray's number for a kind, stepped there as he would. */
function setTray(game: Game, kind: TrayKind, value: number) {
  while (game.stage().tray[kind] !== value) {
    game.act({ type: 'tray/step', kind, by: game.stage().tray[kind] < value ? 1 : -1 });
  }
}

/** A piece of this number from the tray, dropped over the scale. */
function dropPiece(game: Game, kind: TrayKind, value: number) {
  setTray(game, kind, value);
  game.act({ type: 'tray/drop', kind });
}

/** The splitter set to `parts`, then dropped over the scale. */
function splitInto(game: Game, parts: number) {
  while (game.stage().splitter !== parts) {
    game.act({ type: 'splitter/step', by: game.stage().splitter < parts ? 1 : -1 });
  }
  game.act({ type: 'splitter/split' });
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
  travel(game, 'r04');
  game.act({ type: 'machine/touch' });
  dialUpTo(game, 9);
  game.write('x=9');
  for (let i = 0; i < 3; i += 1) game.act({ type: 'notebook/delete' });
  balanceRoomFour(game);
  game.write('9');
  game.write('9');
  game.presented();
  game.presented();
  // Story 2.5: the room's lines, then on.
  game.act({ type: 'story/next' });
}

/**
 * Room 5, the bridge (story 2.8), the slider's room: a poke window of 0–3, the pin at 6 (the
 * machine turns the slider there, so the pans level and `x = ☐` comes up), and 6 into both
 * blanks; then the change, 22 to 25, the pin at 7 before the slider opens, and 7 twice.
 */
function playRoomFive(game: Game) {
  travel(game, 'r05');
  game.act({ type: 'machine/touch' });
  for (const x of [1, 2, 3]) game.act({ type: 'dial/set', x });
  game.act({ type: 'pin/set', value: { kind: 'x', x: 6 } });
  game.act({ type: 'pin/confirm' });
  game.write('6');
  game.write('6');
  game.presented();
  game.act({ type: 'machine/touch' });
  game.act({ type: 'pin/set', value: { kind: 'x', x: 7 } });
  game.act({ type: 'pin/confirm' });
  game.write('7');
  game.write('7');
  game.presented();
  game.presented();
  game.act({ type: 'story/next' });
}

/**
 * Room 6, the weighing yard (story 2.9): the readouts hidden, he pins 29 before anything
 * moves (the machine turns the slider there), and fills 29 into both blanks.
 */
function playRoomSix(game: Game) {
  travel(game, 'r06');
  game.act({ type: 'machine/touch' });
  game.act({ type: 'pin/set', value: { kind: 'x', x: 29 } });
  game.act({ type: 'pin/confirm' });
  game.write('29');
  game.write('29');
  game.presented();
  game.presented();
  game.act({ type: 'story/next' });
}

/**
 * Room 7, the old logbook (story 2.10): he slides to 6, taps the logbook's lines onto the
 * scale (3x = 18 stays level, x = 15 tips), pins x = 15 as the mistake, and rewrites it: 6
 * into x = ☐, then into the check line.
 */
function playRoomSeven(game: Game) {
  travel(game, 'r07');
  game.act({ type: 'machine/touch' });
  for (const x of [2, 3, 4, 5, 6]) game.act({ type: 'dial/set', x });
  game.act({ type: 'notebook/show-line', line: 1 });
  game.act({ type: 'notebook/show-line', line: 2 });
  game.act({ type: 'pin/set', value: { kind: 'line', index: 2 } });
  game.act({ type: 'pin/confirm' });
  game.write('6');
  game.write('6');
  game.presented();
  game.presented();
  game.act({ type: 'story/next' });
}

/**
 * Room 8, the tram (story 4.3): no pin. He goes the way back, `− 9` and `: 4`, which writes
 * the moves and their results for him, and fills the last two blanks.
 */
function playRoomEight(game: Game) {
  travel(game, 'r08');
  game.act({ type: 'machine/touch' });
  game.act({ type: 'chain/run', op: 'sub', n: 9 });
  game.act({ type: 'chain/run', op: 'div', n: 4 });
  game.write('8');
  game.write('8');
  game.presented();
  game.presented();
  game.act({ type: 'story/next' });
}

/**
 * Room 9, the steam lift (story 4.4), the tray from the start: the gear set to 5 and dropped
 * (`135 = 5x + 100`, written for him), the 100 dragged off, a split by 5, and his two blanks.
 */
function playRoomNine(game: Game) {
  travel(game, 'r09');
  game.act({ type: 'machine/touch' });
  dropPiece(game, 'gear', 5);
  game.act({ type: 'tray/take', side: 'right', key: 'right-weight-0' });
  splitInto(game, 5);
  game.write('7');
  game.write('7');
  game.presented();
  game.presented();
  game.act({ type: 'story/next' });
}

/**
 * Room 10, the market scales (story 4.5): he writes the story as its equation, takes the 60
 * off with a balloon and splits by 3, then fills both blanks; then he flags the story that
 * fits the second pans, and does the same with a balloon of 5 and a split by 2.
 */
function playRoomTen(game: Game) {
  travel(game, 'r10');
  game.act({ type: 'machine/touch' });
  game.write('60+3x=90');
  dropPiece(game, 'float', 60);
  splitInto(game, 3);
  game.write('10');
  game.write('10');
  game.presented();
  game.act({ type: 'machine/touch' });
  game.act({ type: 'pin/set', value: { kind: 'choice', index: 1 } });
  game.act({ type: 'pin/confirm' });
  dropPiece(game, 'float', 5);
  splitInto(game, 2);
  game.write('7');
  game.write('7');
  game.presented();
  game.presented();
  game.act({ type: 'story/next' });
}

/**
 * Room 11, the great wheel (story 4.6): no pin. He goes the way back, `− 316` and `: 27`,
 * which writes the moves and their results for him, steps the slider to 207 one by one from
 * 210 as his check, and fills both blanks.
 */
function playRoomEleven(game: Game) {
  travel(game, 'r11');
  game.act({ type: 'machine/touch' });
  game.act({ type: 'chain/run', op: 'sub', n: 316 });
  game.act({ type: 'chain/run', op: 'div', n: 27 });
  game.act({ type: 'dial/set', x: 210 });
  for (let i = 0; i < 3; i += 1) game.act({ type: 'dial/nudge', by: -1 });
  game.write('207');
  game.write('207');
  game.presented();
  game.presented();
  game.act({ type: 'story/next' });
}

/**
 * Room 12, the junction (story 4.7): two linked machines, no pins. `2x − 1 = 7`: a weight of
 * 1, a split by 2, and 4 twice; the second machine arrives with that 4 as its weight:
 * `3x + 4 = 19`, a balloon of 4, a split by 3, and 5 twice.
 */
function playRoomTwelve(game: Game) {
  travel(game, 'r12');
  game.act({ type: 'machine/touch' });
  dropPiece(game, 'weight', 1);
  splitInto(game, 2);
  game.write('4');
  game.write('4');
  game.presented();
  game.act({ type: 'machine/touch' });
  dropPiece(game, 'float', 4);
  splitInto(game, 3);
  game.write('5');
  game.write('5');
  game.presented();
  game.presented();
  game.act({ type: 'story/next' });
}

/**
 * Room 13, the clock tower (story 4.8): in each machine he pokes 0, 1, 2 (the drum draws
 * their dots), pins the next dot, confirms (the machine turns the slider to 3, so its dot
 * shows), then finds the answer on the dial, which brings up the blanks, and fills both.
 */
function playRoomThirteen(game: Game) {
  // Each right pin pays (story 4.8 review: the store records the dots and pays the drum pin).
  travel(game, 'r13');
  for (const [x, right] of [
    [5, 0],
    [4, 2],
  ] as const) {
    game.act({ type: 'machine/touch' });
    for (const notch of [1, 2]) game.act({ type: 'dial/set', x: notch });
    game.act({ type: 'pin/set', value: { kind: 'choice', index: right } });
    game.act({ type: 'pin/confirm' });
    game.act({ type: 'dial/set', x });
    game.write(`${x}`);
    game.write(`${x}`);
    game.presented();
  }
  game.presented();
  game.act({ type: 'story/next' });
}

describe('rooms 1–4 back to back (story 1.13)', () => {
  it('runs all 13 rooms in order, each from arrival to restart', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    playRoomFour(game);
    playRoomFive(game);
    playRoomSix(game);
    playRoomSeven(game);
    playRoomEight(game);
    playRoomNine(game);
    playRoomTen(game);
    playRoomEleven(game);
    playRoomTwelve(game);
    playRoomThirteen(game);
    expect(game.phases).toEqual([
      // Story 5.0: the opening, the naming and the town, with no room.
      'none',
      'r01.0:arrive',
      'r01.0:open',
      'r01.0:locked',
      'r01.0:restart',
      // Room 1's lines, then the town (story 5.0), with no room.
      'none',
      'r02.0:arrive',
      'r02.0:open',
      'r02.0:locked',
      'r02.1:arrive',
      'r02.1:open',
      'r02.1:locked',
      'r02.1:restart',
      // Story 2.5: each room's lines, with no room.
      'none',
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
      'none',
      // Story 1.16: no pin in room 4, so no poke or pin phase.
      'r04.0:arrive',
      'r04.0:open',
      'r04.0:locked',
      'r04.0:restart',
      // Room 4's story card, with no room.
      'none',
      // Story 2.8: room 5, a poke window, the pin, then the change and its pin.
      'r05.0:arrive',
      'r05.0:poke',
      'r05.0:pin',
      'r05.0:open',
      'r05.0:locked',
      'r05.1:arrive',
      'r05.1:pin',
      'r05.1:open',
      'r05.1:locked',
      'r05.1:restart',
      'none',
      // Story 2.9: room 6, the pin before anything moves, with the readouts hidden.
      'r06.0:arrive',
      'r06.0:pin',
      'r06.0:open',
      'r06.0:locked',
      'r06.0:restart',
      'none',
      // Story 2.10: room 7, the slider open from the start, the mistake pin, the rewrite.
      'r07.0:arrive',
      'r07.0:poke',
      'r07.0:pin',
      'r07.0:open',
      'r07.0:locked',
      'r07.0:restart',
      'none',
      // Story 4.3: room 8, the way back from the start.
      'r08.0:arrive',
      'r08.0:open',
      'r08.0:locked',
      'r08.0:restart',
      'none',
      // Story 4.4: room 9, the tray from the start.
      'r09.0:arrive',
      'r09.0:open',
      'r09.0:locked',
      'r09.0:restart',
      'none',
      // Story 4.5: room 10, the story written before the dial moves, then the story pin.
      'r10.0:arrive',
      'r10.0:open',
      'r10.0:locked',
      'r10.1:arrive',
      'r10.1:pin',
      'r10.1:open',
      'r10.1:locked',
      'r10.1:restart',
      'none',
      // Story 4.6: room 11, the way back from the start, with the coarse dial to check.
      'r11.0:arrive',
      'r11.0:open',
      'r11.0:locked',
      'r11.0:restart',
      'none',
      // Story 4.7: room 12, two linked machines, the tray from the start in each.
      'r12.0:arrive',
      'r12.0:open',
      'r12.0:locked',
      'r12.1:arrive',
      'r12.1:open',
      'r12.1:locked',
      'r12.1:restart',
      'none',
      // Story 4.8: room 13, the drum's dots, the next-dot pin, twice: the line reveal.
      'r13.0:arrive',
      'r13.0:poke',
      'r13.0:pin',
      'r13.0:open',
      'r13.0:locked',
      'r13.1:arrive',
      'r13.1:poke',
      'r13.1:pin',
      'r13.1:open',
      'r13.1:locked',
      'r13.1:restart',
      // No room left to play: the story card, then the map.
      'none',
    ]);
  });

  it('arrives at every stage, locks it and restarts every machine, in play order', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    playRoomFour(game);
    playRoomFive(game);
    playRoomSix(game);
    playRoomSeven(game);
    playRoomEight(game);
    playRoomNine(game);
    playRoomTen(game);
    playRoomEleven(game);
    playRoomTwelve(game);
    playRoomThirteen(game);
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
      'arrive r05.0',
      'lock r05.0',
      'arrive r05.1',
      'lock r05.1',
      'restart r05',
      'arrive r06.0',
      'lock r06.0',
      'restart r06',
      'arrive r07.0',
      'lock r07.0',
      'restart r07',
      'arrive r08.0',
      'lock r08.0',
      'restart r08',
      'arrive r09.0',
      'lock r09.0',
      'restart r09',
      'arrive r10.0',
      'lock r10.0',
      'arrive r10.1',
      'lock r10.1',
      'restart r10',
      'arrive r11.0',
      'lock r11.0',
      'restart r11',
      'arrive r12.0',
      'lock r12.0',
      'arrive r12.1',
      'lock r12.1',
      'restart r12',
      'arrive r13.0',
      'lock r13.0',
      'arrive r13.1',
      'lock r13.1',
      'restart r13',
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
    // The map takes the room's place once its restart ends (story 2.2): keep its last state.
    let last: RoomState | null = null;
    const unsubscribe = game.store.subscribe((state) => {
      if (state.room?.spec.id === 'r04') last = state.room;
    });
    playRoomFour(game);
    unsubscribe();
    const lines = (last as RoomState | null)?.stage.lines ?? [];
    expect(lines.map((line) => [formatTokens(line.tokens), line.source])).toEqual([
      ['2x + 5 = 23', 'given'],
      ['2x + 5 − 5 = 23 − 5', 'balance'],
      ['2x = 18', 'balance'],
      ['2x : 2 = 18 : 2', 'balance'],
      ['x = 9', 'typed'],
      ['2 · 9 + 5 = 23', 'typed'],
    ]);
  });

  it('writes room 8 the Undo way: each move and its result, then his two lines (story 4.3)', () => {
    const game = freshGame();
    for (const play of [
      playRoomOne,
      playRoomTwo,
      playRoomThree,
      playRoomFour,
      playRoomFive,
      playRoomSix,
      playRoomSeven,
    ]) {
      play(game);
    }
    let last: RoomState | null = null;
    const unsubscribe = game.store.subscribe((state) => {
      if (state.room?.spec.id === 'r08') last = state.room;
    });
    playRoomEight(game);
    playRoomNine(game);
    playRoomTen(game);
    playRoomEleven(game);
    playRoomTwelve(game);
    playRoomThirteen(game);
    unsubscribe();
    const lines = (last as RoomState | null)?.stage.lines ?? [];
    expect(lines.map((line) => [formatTokens(line.tokens), line.source])).toEqual([
      ['4x + 9 = 41', 'given'],
      ['4x = 41 − 9', 'undo'],
      ['4x = 32', 'undo'],
      ['x = 32 : 4', 'undo'],
      ['x = 8', 'typed'],
      ['4 · 8 + 9 = 41', 'typed'],
    ]);
    const used = game.seen.filter((event) => event.type === 'WayUsed' && event.roomId === 'r08');
    expect(used).toHaveLength(2);
    expect(game.seen.filter((event) => event.type === 'MachineJammed')).toEqual([]);
  });

  it('writes room 9 the Balance way: the gear’s move and its result, then his two lines (story 4.4)', () => {
    const game = freshGame();
    for (const play of [
      playRoomOne,
      playRoomTwo,
      playRoomThree,
      playRoomFour,
      playRoomFive,
      playRoomSix,
      playRoomSeven,
      playRoomEight,
    ]) {
      play(game);
    }
    let last: RoomState | null = null;
    const unsubscribe = game.store.subscribe((state) => {
      if (state.room?.spec.id === 'r09') last = state.room;
    });
    playRoomNine(game);
    playRoomTen(game);
    playRoomEleven(game);
    playRoomTwelve(game);
    playRoomThirteen(game);
    unsubscribe();
    const lines = (last as RoomState | null)?.stage.lines ?? [];
    expect(lines.map((line) => [formatTokens(line.tokens), line.source])).toEqual([
      ['135 − 5x = 100', 'given'],
      ['135 − 5x + 5x = 100 + 5x', 'balance'],
      ['135 = 5x + 100', 'balance'],
      ['x = 7', 'typed'],
      ['135 − 5 · 7 = 100', 'typed'],
    ]);
  });

  it('records room 13’s dots in the store and pays its right next-dot pins (story 4.8)', () => {
    const game = freshGame();
    for (const play of [
      playRoomOne,
      playRoomTwo,
      playRoomThree,
      playRoomFour,
      playRoomFive,
      playRoomSix,
      playRoomSeven,
      playRoomEight,
      playRoomNine,
      playRoomTen,
      playRoomEleven,
      playRoomTwelve,
    ]) {
      play(game);
    }
    travel(game, 'r13');
    game.act({ type: 'machine/touch' });
    for (const x of [1, 2]) game.act({ type: 'dial/set', x });
    game.act({ type: 'pin/set', value: { kind: 'choice', index: 0 } });
    game.act({ type: 'pin/confirm' });
    expect(game.stage().tried).toEqual([0, 1, 2, 3]);
    const paid = game.seen.filter(
      (event) => event.type === 'PredictionMade' && event.roomId === 'r13',
    );
    expect(paid).toEqual([{ type: 'PredictionMade', roomId: 'r13', stage: 0, right: true }]);
  });

  // Story 1.16, AC 8: the refused early answer. Since Luka ran room 4's dial to 0–12, the
  // slider at 9 levels the scale first: it is his check, not a way to finish.
  it('refuses his early x = 9 in room 4 like an incomplete line, with its tag, until he simplifies', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    travel(game, 'r04');
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
    travel(game, 'r04');
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
    travel(game, 'r04');
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
    // The check line's tag is met from room 1: the "what now" line says it from here.
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
    travel(game, 'r04');
    const offered: string[] = [];
    const act = game.act;
    game.act = (action) => {
      act(action);
      const state = game.store.getState();
      // Room 4's story card has no room, and room 5 follows: room 4's tools only.
      if (state.room?.spec.id !== 'r04') return;
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
    // The restart ended: its lines, then the town (story 5.0), with no room.
    expect(game.store.getState().room).toBeNull();
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
    travel(game, 'r04');
    expect(game.store.getState().room?.spec.id).toBe('r04');
  });

  it('goes from the opening and the naming to the town, and back to it after every room', () => {
    const game = freshGame();
    const screens: string[] = [];
    const unsubscribe = game.store.subscribe((state) => {
      if (screens.at(-1) !== state.ui.screen) screens.push(state.ui.screen);
    });
    playRoomOne(game);
    expect(game.store.getState().ui.screen).toBe('map');
    travel(game, 'r02');
    expect(game.store.getState().room?.spec.id).toBe('r02');
    playRoomTwo(game);
    playRoomThree(game);
    playRoomFour(game);
    playRoomFive(game);
    playRoomSix(game);
    playRoomSeven(game);
    playRoomEight(game);
    playRoomNine(game);
    playRoomTen(game);
    playRoomEleven(game);
    playRoomTwelve(game);
    playRoomThirteen(game);
    unsubscribe();
    // Story 5.0: each room's lines, then the town, where he walks to the next machine.
    expect(screens).toEqual([
      'room',
      'story',
      'map',
      'room',
      'story',
      'map',
      'room',
      'story',
      'map',
      'room',
      'story',
      'map',
      'room',
      'story',
      'map',
      'room',
      'story',
      'map',
      'room',
      'story',
      'map',
      'room',
      'story',
      'map',
      'room',
      'story',
      'map',
      'room',
      'story',
      'map',
      'room',
      'story',
      'map',
      'room',
      'story',
      'map',
      'room',
      'story',
      'map',
    ]);
    const state = game.store.getState();
    expect(state.ui).toMatchObject({ screen: 'map', fresh: 'r13' });
    expect(state.room).toBeNull();
    expect(state.save.progress.roomsDone).toEqual([
      'r01',
      'r02',
      'r03',
      'r04',
      'r05',
      'r06',
      'r07',
      'r08',
      'r09',
      'r10',
      'r11',
      'r12',
      'r13',
    ]);
    // Room 7 earns the gear chain (story 2.3's gates); room 12 the recording drum (story 4.7).
    expect(state.save.progress.tools).toContain('chain');
    expect(state.save.progress.tools).toContain('drum');
  });

  it('keeps the map on the clock, and a dev jump leaves it for a room', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    playRoomFour(game);
    playRoomFive(game);
    playRoomSix(game);
    playRoomSeven(game);
    playRoomEight(game);
    playRoomNine(game);
    playRoomTen(game);
    playRoomEleven(game);
    playRoomTwelve(game);
    playRoomThirteen(game);
    const done = game.store.getState();
    game.act({ type: 'clock/tick' });
    game.act({ type: 'machine/touch' });
    expect(game.store.getState().ui).toBe(done.ui);
    expect(game.store.getState().room).toBe(done.room);
    game.act({ type: 'room/enter', roomId: 'r02', stage: 1 });
    expect(game.store.getState().ui.screen).toBe('room');
    expect(game.stage().phase).toBe('arrive');
  });

  it('gets to room 4’s story, then the town, on the clock too, if the machine never reports its restart', () => {
    const game = freshGame();
    playRoomOne(game);
    playRoomTwo(game);
    playRoomThree(game);
    travel(game, 'r04');
    // Story 1.16: no pin, and x = 9 waits for Balance (it pinned, then typed both lines).
    game.act({ type: 'machine/touch' });
    balanceRoomFour(game);
    game.write('9');
    game.write('9');
    for (let i = 0; i < 40; i += 1) game.act({ type: 'clock/tick' });
    expect(game.store.getState().ui.screen).toBe('story');
    game.act({ type: 'story/next' });
    expect(game.store.getState().ui.screen).toBe('map');
    travel(game, 'r05');
    expect(game.store.getState().room?.spec.id).toBe('r05');
  });
});
