// Epic 5: rooms for friends through the real store. He builds a machine at the workshop,
// solves it himself in the room screen, sends it (paying its parts), and the link's room
// plays on a friend's page, intro first; a reply link stamps it on the wall.

import { describe, expect, it } from 'vitest';
import { decodeRoom, roomIdOf } from '@/links/room-link';
import type { Token } from '@/math/tokens';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { newSave } from '@/store/persist';
import { createGameStore } from '@/store/store';
import type { GameState } from '@/store/types';
import { newDesign, type RoomDesign } from '@/workshop/design';

const at = '2026-11-07T10:00:00.000Z';
type RoomsDone = GameState['save']['progress']['roomsDone'];
const toSeven: RoomsDone = ['r01', 'r02', 'r03', 'r04', 'r05', 'r06', 'r07'];

function store() {
  const seen: DomainEvent[] = [];
  let now = Date.parse(at);
  const s = createGameStore({
    makeCtx: () => {
      now += 10;
      return { now, rng: { next: () => 0.5 } };
    },
    effects: [(event) => seen.push(event)],
  });
  const dispatch = (action: Action) => s.getState().dispatch(action);
  return { s, seen, dispatch, state: () => s.getState() as GameState };
}

function builder(parts = 20, roomsDone: RoomsDone = toSeven) {
  const g = store();
  const save = newSave(at);
  g.dispatch({
    type: 'boot/start',
    save: {
      ...save,
      character: { name: 'Ivo', look: 'look-1' },
      progress: {
        ...save.progress,
        introSeen: true,
        firstUse: ['fight-guide'],
        roomsDone,
        tools: ['balance', 'workshop', 'chain'],
        onMap: true,
        told: [...roomsDone],
      },
      economy: { ...save.economy, parts },
    },
    room: null,
  });
  return g;
}

/** Types a line on the pad and enters it. */
function write(g: ReturnType<typeof store>, line: string) {
  for (const char of line.replace(/ /g, ''))
    g.dispatch({ type: 'notebook/type', token: char as Token });
  g.dispatch({ type: 'notebook/enter' });
}

/** Plays out the lock or the restart showing now, as the scene would report it. */
function present(g: ReturnType<typeof store>) {
  const room = g.state().room;
  if (!room) return;
  const phase = room.stage.phase;
  if (phase !== 'locked' && phase !== 'restart') return;
  g.dispatch({ type: 'presentation/done', roomId: room.spec.id, stage: room.stageIndex, phase });
}

/** Solves the machine in play with x and its check line, then plays out the restart. */
function solve(g: ReturnType<typeof store>, lines: string[]) {
  g.dispatch({ type: 'machine/touch' });
  for (const line of lines) write(g, line);
  present(g);
  present(g);
}

const machine: RoomDesign = {
  ...newDesign('ax+b'),
  machines: [{ form: 'ax+b', numbers: { a: 2, b: 5, c: 23, d: 0 } }],
};

function built(parts = 20) {
  const g = builder(parts);
  g.dispatch({ type: 'map/travel', node: 'workshop' });
  g.dispatch({ type: 'workshop/open' });
  return g;
}

describe('building a room (epic 5)', () => {
  it('opens from the counter and back', () => {
    const g = built();
    expect(g.state().ui.screen).toBe('workshop');
    expect(g.state().ui.workshop).toEqual({ step: 'design', design: null });
    g.dispatch({ type: 'workshop/close' });
    expect(g.state().ui.screen).toBe('shop');
  });

  it('plays only a machine that keeps the rules', () => {
    const g = built();
    const fraction: RoomDesign = {
      ...machine,
      machines: [{ form: 'ax+b', numbers: { a: 2, b: 5, c: 24, d: 0 } }],
    };
    g.dispatch({ type: 'workshop/solve', design: fraction });
    expect(g.state().ui.screen).toBe('workshop');
    const unmet: RoomDesign = {
      ...machine,
      machines: [{ form: 'b-ax', numbers: { a: 5, b: 135, c: 100, d: 0 } }],
    };
    g.dispatch({ type: 'workshop/solve', design: unmet });
    expect(g.state().ui.screen).toBe('workshop');
  });

  it('has him solve it himself, keeps his lines, and sends it for its parts (FR46, FR48)', () => {
    const g = built(20);
    g.dispatch({ type: 'workshop/solve', design: machine });
    expect(g.state().ui.screen).toBe('room');
    expect(g.state().room?.spec.id).toBe('built-draft');
    // No link before he solves it.
    g.dispatch({ type: 'workshop/send', title: 0, planted: null });
    expect(g.state().save.workshop.rooms).toEqual([]);
    solve(g, ['2x = 18', 'x = 9', '2 · 9 + 5 = 23']);
    expect(g.state().ui.screen).toBe('workshop');
    expect(g.state().ui.workshop).toMatchObject({
      step: 'finish',
      solution: [['2x=18', 'x=9', '2·9+5=23']],
    });
    // A built room is never one of his rooms done, nor saved as in progress.
    expect(g.state().save.progress.roomsDone).toEqual(toSeven);
    g.seen.length = 0;
    g.dispatch({ type: 'workshop/send', title: 2, planted: null });
    const rooms = g.state().save.workshop.rooms;
    expect(rooms).toHaveLength(1);
    expect(rooms[0]).toMatchObject({ title: 2, stamp: null });
    expect(g.state().save.economy.parts).toBe(20);
    expect(g.state().ui.workshop).toEqual({ step: 'sent', id: rooms[0]?.id });
    expect(g.seen.map((e) => e.type)).toContain('SaveChanged');
    // The link holds the room and his lines, and its id is its hash.
    const data = rooms[0]?.payload ?? '';
    expect(roomIdOf(data)).toBe(rooms[0]?.id);
    expect(decodeRoom(data)).toMatchObject({ title: 2, solution: [['2x=18', 'x=9', '2·9+5=23']] });
  });

  it('sends with no parts at all: making puzzles for friends is free', () => {
    const g = built(0);
    g.dispatch({ type: 'workshop/solve', design: machine });
    solve(g, ['x = 9', '2 · 9 + 5 = 23']);
    g.dispatch({ type: 'workshop/send', title: 0, planted: null });
    expect(g.state().save.workshop.rooms).toHaveLength(1);
    expect(g.state().save.economy.parts).toBe(0);
  });

  it('goes back to the design if he leaves the room before solving it', () => {
    const g = built();
    g.dispatch({ type: 'workshop/solve', design: machine });
    g.dispatch({ type: 'map/open' });
    expect(g.state().ui.screen).toBe('workshop');
    expect(g.state().ui.workshop).toEqual({ step: 'design', design: machine });
    expect(g.state().room).toBeNull();
  });

  it('sends a planted line only when it is wrong where it stands', () => {
    const g = built();
    const planted: RoomDesign = { ...machine, plant: true };
    g.dispatch({ type: 'workshop/solve', design: planted });
    solve(g, ['2x = 18', 'x = 9', '2 · 9 + 5 = 23']);
    g.dispatch({ type: 'workshop/send', title: 0, planted: null });
    g.dispatch({
      type: 'workshop/send',
      title: 0,
      planted: { stage: 0, line: 0, text: '2x=23−5' },
    });
    expect(g.state().save.workshop.rooms).toEqual([]);
    g.dispatch({ type: 'workshop/send', title: 0, planted: { stage: 0, line: 0, text: '2x=17' } });
    expect(g.state().save.workshop.rooms).toHaveLength(1);
    expect(g.state().save.economy.parts).toBe(20);
  });

  it('keeps each linked machine’s lines as it locks', () => {
    const g = builder(40, [...toSeven, 'r08', 'r09', 'r10', 'r11', 'r12']);
    g.dispatch({ type: 'map/travel', node: 'workshop' });
    g.dispatch({ type: 'workshop/open' });
    const linked: RoomDesign = {
      ...machine,
      machines: [
        { form: 'ax+b', numbers: { a: 2, b: 3, c: 11, d: 0 } },
        { form: 'ax+b', numbers: { a: 3, b: 0, c: 19, d: 0 } },
      ],
    };
    g.dispatch({ type: 'workshop/solve', design: linked });
    g.dispatch({ type: 'machine/touch' });
    write(g, 'x = 4');
    write(g, '2 · 4 + 3 = 11');
    present(g);
    expect(g.state().room?.stage.lines[0]?.tokens.join('')).toBe('3x+4=19');
    g.dispatch({ type: 'machine/touch' });
    write(g, 'x = 5');
    write(g, '3 · 5 + 4 = 19');
    present(g);
    present(g);
    expect(g.state().ui.workshop).toMatchObject({
      step: 'finish',
      solution: [
        ['x=4', '2·4+3=11'],
        ['x=5', '3·5+4=19'],
      ],
    });
    // Sent, the link carries the fed number as the first machine's answer, and reads back.
    g.dispatch({ type: 'workshop/send', title: 0, planted: null });
    expect(g.state().save.economy.parts).toBe(40);
    const data = g.state().save.workshop.rooms[0]?.payload ?? '';
    expect(decodeRoom(data)?.design.machines[1]?.numbers.b).toBe(4);
  });
});

describe('a friend’s link (epic 5)', () => {
  function sent() {
    const g = built();
    g.dispatch({ type: 'workshop/solve', design: machine });
    solve(g, ['2x = 18', 'x = 9', '2 · 9 + 5 = 23']);
    g.dispatch({ type: 'workshop/send', title: 5, planted: null });
    const room = g.state().save.workshop.rooms[0];
    if (!room) throw new Error('not sent');
    return { g, room };
  }

  it('starts a new friend on the intro machine, then the room, and cracking it ends there', () => {
    const { room } = sent();
    const f = store();
    f.dispatch({ type: 'friend/start', data: room.payload, newToGame: true });
    expect(f.state().ui.screen).toBe('friend');
    expect(f.state().ui.friend).toMatchObject({ step: 'welcome', id: room.id });
    f.dispatch({ type: 'friend/next' });
    expect(f.state().room?.spec.id).toBe('built-intro');
    // Room 1's blanks: x = ☐, then the check line.
    solve(f, ['3', '3']);
    expect(f.state().ui).toMatchObject({ screen: 'friend', friend: { step: 'ready' } });
    f.dispatch({ type: 'friend/next' });
    expect(f.state().room?.spec.id).toBe(`built-${room.id}`);
    expect(f.state().room?.spec.stages[0]?.ways).toEqual(['try', 'balance', 'undo']);
    // Giving the town a try does nothing: there is none on a friend's page.
    f.dispatch({ type: 'map/open' });
    expect(f.state().ui.screen).toBe('room');
    solve(f, ['x = 9', '2 · 9 + 5 = 23']);
    expect(f.state().ui).toMatchObject({ screen: 'friend', friend: { step: 'cracked' } });
  });

  it('gives the friend his planted line to find and rewrite, as room 7 does', () => {
    const g = built();
    g.dispatch({ type: 'workshop/solve', design: { ...machine, plant: true } });
    solve(g, ['2x = 18', 'x = 9', '2 · 9 + 5 = 23']);
    g.dispatch({ type: 'workshop/send', title: 1, planted: { stage: 0, line: 1, text: 'x=8' } });
    const room = g.state().save.workshop.rooms[0];
    if (!room) throw new Error('not sent');
    const f = store();
    f.dispatch({ type: 'friend/start', data: room.payload, newToGame: false });
    f.dispatch({ type: 'friend/next' });
    const stage = f.state().room?.stage;
    expect(stage?.lines.map((line) => line.tokens.join(''))).toEqual(['2x+5=23', '2x=18']);
    expect(stage?.planted).toMatchObject({ line: 2, found: false });
    f.dispatch({ type: 'machine/touch' });
    f.dispatch({ type: 'pin/set', value: { kind: 'line', index: 2 } });
    f.dispatch({ type: 'pin/confirm' });
    expect(f.state().room?.stage.planted?.found).toBe(true);
    write(f, '9');
    write(f, '9');
    present(f);
    present(f);
    expect(f.state().ui).toMatchObject({ screen: 'friend', friend: { step: 'cracked' } });
  });

  it('takes a friend who knows the game straight to the room', () => {
    const { room } = sent();
    const f = store();
    f.dispatch({ type: 'friend/start', data: room.payload, newToGame: false });
    f.dispatch({ type: 'friend/next' });
    expect(f.state().room?.spec.id).toBe(`built-${room.id}`);
  });

  it('lets a friend give up at any time (FR50)', () => {
    const { room } = sent();
    const f = store();
    f.dispatch({ type: 'friend/start', data: room.payload, newToGame: false });
    f.dispatch({ type: 'friend/next' });
    f.dispatch({ type: 'friend/give-up' });
    expect(f.state().room).toBeNull();
    expect(f.state().ui).toMatchObject({ screen: 'friend', friend: { step: 'gave-up' } });
  });

  it('saves nothing for a friend', () => {
    const { room } = sent();
    const f = store();
    f.dispatch({ type: 'friend/start', data: room.payload, newToGame: false });
    expect(f.state().save.workshop.rooms).toEqual([]);
    expect(f.state().save.progress.roomsDone).toEqual([]);
  });

  it('shows a broken link as a broken machine', () => {
    const f = store();
    f.dispatch({ type: 'friend/start', data: 'nonsense', newToGame: true });
    expect(f.state().ui).toMatchObject({ screen: 'friend', friend: { step: 'broken' } });
    f.dispatch({ type: 'friend/next' });
    expect(f.state().room).toBeNull();
  });

  it('stamps the room on his wall when the reply link comes back (FR51)', () => {
    const { g, room } = sent();
    g.dispatch({ type: 'workshop/close' });
    g.dispatch({ type: 'shop/close' });
    expect(g.state().ui.screen).toBe('map');
    g.dispatch({ type: 'workshop/reply', id: room.id, stamp: 'uncracked' });
    expect(g.state().save.workshop.rooms[0]?.stamp).toBe('uncracked');
    expect(g.state().ui).toMatchObject({
      screen: 'shop',
      workshop: { step: 'reply', id: room.id },
    });
    g.dispatch({ type: 'workshop/reply', id: room.id, stamp: 'cracked' });
    expect(g.state().save.workshop.rooms[0]?.stamp).toBe('cracked');
    // A reply for a room he never sent changes nothing.
    const before = g.state().save;
    g.dispatch({ type: 'workshop/reply', id: 'zzz', stamp: 'cracked' });
    expect(g.state().save).toBe(before);
  });
});
