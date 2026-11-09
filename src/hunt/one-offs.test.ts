import { describe, expect, it } from 'vitest';
import {
  type CartsSpec,
  cartsDismiss,
  cartsEnter,
  cartsGo,
  cartsGround,
  cartsLoad,
  cartsUnload,
  type LevelSpec,
  type LocksSpec,
  type LoopSpec,
  levelDismiss,
  levelEnter,
  levelTap,
  levelTilt,
  locksDismiss,
  locksTap,
  loopDismiss,
  loopEnter,
  loopStart,
  newCarts,
  newLevel,
  newLocks,
  newLoop,
  newWindows,
  oneOffEarns,
  oneOffHint,
  oneOffType,
  proveCarts,
  proveLevel,
  proveLocks,
  proveLoop,
  proveWindows,
  sumResult,
  type WindowsSpec,
  windowNumber,
  windowsDismiss,
  windowsThrow,
  windowsTurn,
  withBrackets,
} from '@/hunt/one-offs';
import {
  type GuardSpec,
  guardDismiss,
  guardEarns,
  guardEnter,
  guardPick,
  guardType,
  newGuard,
  proveGuard,
} from '@/hunt/rule-guard';
import type { SToken } from '@/math/statement-tokens';

const type = <T extends Parameters<typeof oneOffType>[0]>(state: T, keys: string[]): T =>
  keys.reduce((s, key) => oneOffType(s, key as SToken), state);

const guard: GuardSpec = {
  kind: 'guard',
  id: 'rule-3',
  rule: 'ALWAYS FROM THE LEFT',
  intro: '',
  tiles: [
    { id: 'a', face: '2 + 3', breaks: false, thanks: 'thank you' },
    { id: 'b', face: '2 + 3 · 4', breaks: true, thanks: '' },
    { id: 'c', face: '5 · 2', breaks: false, thanks: 'thank you' },
    { id: 'd', face: '6 − 1', breaks: false, thanks: 'thank you' },
    { id: 'e', face: '1 + 1', breaks: false, thanks: 'thank you' },
    { id: 'f', face: '9 : 3', breaks: false, thanks: 'thank you' },
  ],
  write: { say: '', start: '2 + 3 · 4 =', accepts: ['2 + 3 · 4 = 14'], keys: [] },
  jammed: '',
  example: [],
  hint: { step: '', move: '' },
};

describe('a rule guard', () => {
  it('a wrong pick makes it thank him, at no cost but the first-try parts', () => {
    const wrong = guardPick(guard, newGuard(), 'a');
    expect(wrong.said).toBe('thank you');
    expect(wrong.phase).toBe('pick');
    expect(guardPick(guard, wrong, 'b')).toBe(wrong);
    const on = guardPick(guard, guardDismiss(wrong), 'b');
    expect(on.phase).toBe('write');
    const done = guardEnter(
      guard,
      ['1', '4'].reduce((s, k) => guardType(s, k as SToken), on),
    );
    expect(done.opened).toBe(true);
    expect(guardEarns(done)).toBe(false);
  });

  it('the right tile on the first pick, then the true line, jams it for the parts', () => {
    const on = guardPick(guard, newGuard(), 'b');
    const done = guardEnter(
      guard,
      ['1', '4'].reduce((s, k) => guardType(s, k as SToken), on),
    );
    expect(done.opened).toBe(true);
    expect(guardEarns(done)).toBe(true);
  });

  it('the moment before: picking the tile isn’t enough', () => {
    const on = guardPick(guard, newGuard(), 'b');
    expect(on.opened).toBe(false);
    const wrongLine = guardEnter(
      guard,
      ['2', '0'].reduce((s, k) => guardType(s, k as SToken), on),
    );
    expect(wrongLine.opened).toBe(false);
    expect(wrongLine.bounced).toBe(true);
  });

  it('proves out', () => {
    expect(proveGuard(guard)).toEqual([]);
    expect(proveGuard({ ...guard, tiles: guard.tiles.slice(0, 5) }).length).toBe(1);
    const noBreak = guard.tiles.map((tile) => ({ ...tile, breaks: false, thanks: 'x' }));
    expect(proveGuard({ ...guard, tiles: noBreak }).length).toBe(1);
  });
});

const line = (start: string, accepts: string) => ({
  say: '',
  start,
  accepts: [accepts],
  keys: [] as SToken[],
});

const carts: CartsSpec = {
  kind: 'carts',
  intro: '',
  rounds: [
    {
      kind: 'share',
      crates: 120,
      carts: 6,
      bundle: 20,
      say: '',
      line: line('120 : 6 =', '120 : 6 = 20'),
    },
    {
      kind: 'loads',
      crates: 120,
      per: 20,
      bundle: 20,
      say: '',
      line: line('120 : 20 =', '120 : 20 = 6'),
    },
    { kind: 'no-carts', crates: 120, result: 'still on the ground', say: '' },
    { kind: 'no-crates', carts: 3, say: '', line: line('0 : 3 =', '0 : 3 = 0') },
  ],
  tipped: 'tipped',
  left: 'left',
  opened: '',
  example: [],
  hint: { step: '', move: '' },
};

describe('Load the carts', () => {
  const round = carts.rounds[0];

  it('moves bundles from the ground onto a cart, and back', () => {
    const one = cartsLoad(carts, newCarts(carts), 0);
    expect(one.loads[0]).toBe(20);
    expect(cartsGround(round, one.loads)).toBe(100);
    expect(cartsUnload(carts, one, 0).loads[0]).toBe(0);
  });

  it('won’t load more than is on the ground', () => {
    let state = newCarts(carts);
    for (let i = 0; i < 6; i++) state = cartsLoad(carts, state, i);
    expect(cartsGround(round, state.loads)).toBe(0);
    expect(cartsLoad(carts, state, 0)).toBe(state);
  });

  it('the moment before: uneven carts tip, and crates left stay', () => {
    const left = cartsGo(carts, cartsLoad(carts, newCarts(carts), 0));
    expect(left.notice).toBe('left');
    expect(left.phase).toBe('load');
    let uneven = newCarts(carts);
    for (const cart of [0, 0, 1, 2, 3, 4]) uneven = cartsLoad(carts, uneven, cart);
    expect(cartsGo(carts, uneven).notice).toBe('tipped');
    expect(oneOffEarns({ ...cartsGo(carts, uneven), opened: true })).toBe(false);
  });

  it('goes through its rounds: share, loads, none, and zero crates', () => {
    let state = newCarts(carts);
    for (let i = 0; i < 6; i++) state = cartsLoad(carts, state, i);
    state = cartsGo(carts, state);
    expect(state.phase).toBe('write');
    state = cartsEnter(carts, type(state, ['2', '0']));
    expect(state.round).toBe(1);
    expect(state.loads).toEqual([0]);

    // In loads, a full cart gets another behind it.
    for (let i = 0; i < 6; i++) state = cartsLoad(carts, state, i);
    expect(state.loads).toEqual([20, 20, 20, 20, 20, 20]);
    state = cartsGo(carts, state);
    state = cartsEnter(carts, type(state, ['6']));
    expect(state.round).toBe(2);

    // Among no carts, the crates stay on the ground, for good.
    expect(state.loads).toEqual([]);
    state = cartsGo(carts, state);
    expect(state.notice).toBe('still on the ground');
    state = cartsDismiss(carts, state);
    expect(state.round).toBe(3);

    // No crates among 3 carts works fine.
    state = cartsGo(carts, state);
    state = cartsEnter(carts, type(state, ['0']));
    expect(state.opened).toBe(true);
    expect(oneOffEarns(state)).toBe(true);
  });

  it('a false line bounces', () => {
    let state = newCarts(carts);
    for (let i = 0; i < 6; i++) state = cartsLoad(carts, state, i);
    state = cartsEnter(carts, type(cartsGo(carts, state), ['3', '0']));
    expect(state.bounced).toBe(true);
    expect(state.round).toBe(0);
  });

  it('proves out', () => {
    expect(proveCarts(carts)).toEqual([]);
    expect(proveCarts({ ...carts, rounds: carts.rounds.slice(0, 2) }).length).toBe(1);
  });
});

const level: LevelSpec = {
  kind: 'level',
  intro: '',
  rounds: [
    { stacks: [6, 14], line: line('x̄ = (6 + 14) : 2 =', 'x̄ = (6 + 14) : 2 = 10') },
    { stacks: [2, 4, 6], line: line('x̄ = (2 + 4 + 6) : 3 =', 'x̄ = (2 + 4 + 6) : 3 = 4') },
  ],
  level: 'level',
  opened: '',
  example: [],
  hint: { step: '', move: '' },
};

describe('Level the load', () => {
  const move = (state: ReturnType<typeof newLevel>, from: number, to: number) =>
    levelTap(level, levelTap(level, state, from), to);

  it('the bar tilts to the heavier side, and the total never changes', () => {
    expect(levelTilt([6, 14])).toBeGreaterThan(0);
    expect(levelTilt([10, 10])).toBe(0);
    const moved = move(newLevel(level), 1, 0);
    expect(moved.stacks).toEqual([7, 13]);
    expect(moved.stacks.reduce((a, b) => a + b)).toBe(20);
  });

  it('tapping the same stack puts the crate back', () => {
    const held = levelTap(level, newLevel(level), 0);
    expect(held.held).toBe(0);
    expect(levelTap(level, held, 0).held).toBeNull();
  });

  it('the moment before: nothing to write until it’s level', () => {
    let state = newLevel(level);
    for (let i = 0; i < 3; i++) state = move(state, 1, 0);
    expect(state.phase).toBe('level');
    expect(levelEnter(level, state)).toBe(state);
    state = move(state, 1, 0);
    expect(state.stacks).toEqual([10, 10]);
    expect(state.phase).toBe('write');
    expect(state.notice).toBe('level');
  });

  it('then the next round, and the last ends the scene', () => {
    let state = newLevel(level);
    for (let i = 0; i < 4; i++) state = move(state, 1, 0);
    state = levelEnter(level, type(levelDismiss(state), ['1', '0']));
    expect(state.round).toBe(1);
    expect(state.stacks).toEqual([2, 4, 6]);
    state = move(move(state, 2, 0), 2, 0);
    expect(state.phase).toBe('write');
    state = levelEnter(level, type(levelDismiss(state), ['4']));
    expect(state.opened).toBe(true);
  });

  it('proves out', () => {
    expect(proveLevel(level)).toEqual([]);
    const odd = { ...level, rounds: [{ ...level.rounds[0], stacks: [1, 2] }] } as LevelSpec;
    expect(proveLevel(odd).length).toBe(1);
  });
});

const locks: LocksSpec = {
  kind: 'locks',
  intro: '',
  locks: [
    { strip: '3 + 4 · 3 + 3', target: 24 },
    { strip: '2 · 3 + 4', target: 14 },
  ],
  shut: (result) => `shut at ${result}`,
  opened: '',
  example: [],
  hint: { step: '', move: '' },
};

describe('Bracket locks', () => {
  it('reads a strip with brackets', () => {
    expect(withBrackets('3 + 4 · 3 + 3', 0, 1)).toBe('(3 + 4) · 3 + 3');
    expect(sumResult('(3 + 4) · 3 + 3')).toBe('24');
    expect(sumResult('3 + 4 · 3 + 3')).toBe('18');
  });

  it('a wrong placement shows the different result, and the lock stays shut', () => {
    const open = locksTap(locks, newLocks(), 1);
    expect(open.from).toBe(1);
    const shut = locksTap(locks, open, 3);
    expect(shut.lock).toBe(0);
    // 3 + (4 · 3 + 3) is still 18.
    expect(shut.notice).toBe('shut at 18');
  });

  it('the right placement opens it, and the last ends the scene', () => {
    const first = locksTap(locks, locksTap(locks, newLocks(), 0), 1);
    expect(first.lock).toBe(1);
    const second = locksTap(locks, locksTap(locks, first, 1), 2);
    expect(second.opened).toBe(true);
    expect(oneOffEarns(second)).toBe(true);
  });

  it('tapping the same number takes the bracket back', () => {
    const open = locksTap(locks, newLocks(), 1);
    expect(locksTap(locks, open, 1).from).toBeNull();
  });

  it('a wrong try takes the parts', () => {
    const shut = locksDismiss(locksTap(locks, locksTap(locks, newLocks(), 2), 3));
    expect(shut.slips).toBe(1);
    expect(oneOffEarns({ ...shut, opened: true })).toBe(false);
  });

  it('proves out, and catches a lock that needs no brackets', () => {
    expect(proveLocks(locks)).toEqual([]);
    expect(proveLocks({ ...locks, locks: [{ strip: '2 + 3', target: 5 }] }).length).toBeGreaterThan(
      0,
    );
  });
});

const windows: WindowsSpec = {
  kind: 'windows',
  intro: '',
  rounds: [
    { rows: 6, columns: 7, target: 42, say: '' },
    { rows: 2, columns: 3, target: 5, say: '' },
  ],
  sleepy: ['snore'],
  reached: 'reached',
  opened: '',
  example: [],
  hint: { step: '', move: '' },
};

describe('the facade’s windows', () => {
  const round = windows.rounds[0] as (typeof windows.rounds)[number];

  it('are numbered along the rows, and the last of 6 rows of 7 is 42', () => {
    expect(windowNumber(round, false, 0, 0)).toBe(1);
    expect(windowNumber(round, false, 5, 6)).toBe(42);
  });

  it('read the other way from the other side', () => {
    expect(windowNumber(round, true, 6, 5)).toBe(42);
    expect(windowNumber(round, true, 1, 0)).toBe(7);
    expect(windowsTurn(newWindows()).turned).toBe(true);
  });

  it('a wrong window shows its number and a sleepy resident', () => {
    const wrong = windowsThrow(windows, newWindows(), 7);
    expect(wrong.shown).toBe(7);
    expect(wrong.notice).toBe('snore');
    const back = windowsDismiss(windows, wrong);
    expect(back.shown).toBeNull();
    expect(back.round).toBe(0);
    expect(oneOffEarns({ ...back, opened: true })).toBe(false);
  });

  it('the right one moves on, and the last ends the scene', () => {
    const one = windowsDismiss(windows, windowsThrow(windows, newWindows(), 42));
    expect(one.round).toBe(1);
    const two = windowsDismiss(windows, windowsThrow(windows, one, 5));
    expect(two.opened).toBe(true);
    expect(oneOffEarns(two)).toBe(true);
  });

  it('proves out', () => {
    expect(proveWindows(windows)).toEqual([]);
    const off = { ...windows, rounds: [{ ...round, target: 99 }] };
    expect(proveWindows(off).length).toBe(1);
  });
});

const loop: LoopSpec = {
  kind: 'loop',
  intro: '',
  boards: [
    { lamps: 5, bells: [7, 9] },
    { lamps: 7, bells: [100, 20] },
  ],
  taken: 'taken',
  missed: (lamp) => `missed at ${lamp}`,
  keys: ['ost.'],
  opened: '',
  example: [],
  hint: { step: '', move: '' },
};

describe('the loop’s lamps', () => {
  it('starts each line with the bell’s division', () => {
    expect(loopStart(loop.boards[0] as never, newLoop())).toBe('7 : 5 =');
  });

  it('his division pins the lamp, and the key comes when it’s right', () => {
    const done = loopEnter(loop, type(newLoop(), ['1', 'ost.', '2']));
    expect(done.pinned).toBe(2);
    expect(done.stopped).toBe(2);
    expect(done.got).toBe(true);
    expect(done.notice).toBe('taken');
    const next = loopDismiss(loop, done);
    expect(next.board).toBe(1);
    expect(loopStart(loop.boards[1] as never, next)).toBe('100 : 7 =');
  });

  it('if he’s wrong he sees where it really stops, and the next try has a new bell', () => {
    const wrong = loopEnter(loop, type(newLoop(), ['1', 'ost.', '3']));
    expect(wrong.got).toBe(false);
    expect(wrong.notice).toBe('missed at 2');
    const next = loopDismiss(loop, wrong);
    expect(next.board).toBe(0);
    expect(next.bell).toBe(1);
    expect(loopStart(loop.boards[0] as never, next)).toBe('9 : 5 =');
    expect(oneOffEarns({ ...next, opened: true })).toBe(false);
  });

  it('a false division on the right lamp bounces, and doesn’t say the lamp was wrong', () => {
    const lie = loopEnter(loop, type(newLoop(), ['2', 'ost.', '2']));
    expect(lie.got).toBe(false);
    expect(lie.notice).toBeNull();
    expect(lie.bounced).toBe(true);
    expect(lie.bell).toBe(0);
  });

  it('a remainder too big bounces: that makes another group', () => {
    const big = loopEnter(loop, type(newLoop(), ['0', 'ost.', '7']));
    expect(big.bounced).toBe(true);
    expect(big.pinned).toBeNull();
  });

  it('something else gets a wiggle', () => {
    expect(loopEnter(loop, type(newLoop(), ['1'])).refused).toBe(true);
  });

  it('the last board ends the scene', () => {
    let state = loopDismiss(loop, loopEnter(loop, type(newLoop(), ['1', 'ost.', '2'])));
    state = loopDismiss(loop, loopEnter(loop, type(state, ['1', '4', 'ost.', '2'])));
    expect(state.opened).toBe(true);
    expect(oneOffEarns(state)).toBe(true);
  });

  it('proves out, and catches two bells that stop at one lamp', () => {
    expect(proveLoop(loop)).toEqual([]);
    const same = { ...loop, boards: [{ lamps: 5, bells: [7, 12] }] };
    expect(proveLoop(same).length).toBe(1);
  });
});

describe('the exact move from ?', () => {
  it('takes the first-try parts in a one-off', () => {
    const hinted = oneOffHint(oneOffHint(newLocks()));
    expect(oneOffEarns({ ...hinted, opened: true })).toBe(false);
  });
});
