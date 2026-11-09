import { describe, expect, it } from 'vitest';
import { act4Leads, l12, l13, l14, l15, l16 } from '@/content/leads/act4';
import { act4Text } from '@/content/text/hunt-act4';
import {
  canonicalLine,
  cluesLeft,
  type KnockSpec,
  type KnockState,
  knockDismiss,
  knockDoor,
  knockEnter,
  knockType,
  lineStart,
  litDoors,
  newKnock,
} from '@/hunt/knock';
import {
  type LeadAction,
  type LeadOutcome,
  type LeadPlay,
  leadStep,
  newLeadPlay,
  playedScene,
} from '@/hunt/lead';
import {
  applyMove,
  goalMet,
  type ObjectGoal,
  type ObjectMove,
  type ObjectState,
} from '@/hunt/objects';
import {
  type LevelSpec,
  type LevelState,
  levelDismiss,
  levelEnter,
  levelTap,
  locksDismiss,
  locksTap,
  loopDismiss,
  loopEnter,
  loopStart,
  newLevel,
  newLocks,
  newLoop,
  oneOffEarns,
  oneOffType,
  stripNumbers,
  sumResult,
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
} from '@/hunt/rule-guard';
import { allGuidesTold, type SceneKind, type SceneSpec } from '@/hunt/scene';
import { proveLead } from '@/hunt/solve';
import type { LeadSpec } from '@/hunt/spec';
import {
  newUnmask,
  proveUnmask,
  unmaskAccuse,
  unmaskAsk,
  unmaskDismiss,
  unmaskEarns,
  unmaskEnter,
  unmaskType,
} from '@/hunt/unmask';
import { parseStatement } from '@/math/statement';
import { readLine, readTokens, type SToken } from '@/math/statement-tokens';
import { BLANK } from '@/math/tokens';
import { isTrue } from '@/math/truth';

const leads = Object.values(act4Leads);
const named = leads.map((lead) => [lead.id, lead] as const);

/** The keys he'd press for a line, given what the notebook has already started. */
function keysFor(start: string, accepted: string): SToken[] {
  const before = readLine(start) ?? [];
  const whole = readTokens(accepted) ?? [];
  const at = before.indexOf(BLANK);
  if (at < 0) return whole.slice(before.length);
  return whole.slice(at, whole.length - (before.length - at - 1));
}

const digits = (text: string) => readTokens(text) ?? [];

function scene<K extends SceneKind>(lead: LeadSpec, kind: K, at = 0) {
  const found = lead.scenes.filter((candidate) => candidate.kind === kind)[at];
  if (!found) throw new Error(`no ${kind} in ${lead.id}`);
  return found as Extract<SceneSpec, { kind: K }>;
}

/** What gets an object to its goal, one move at a time. */
function nextMove(object: ObjectState, goal: ObjectGoal): ObjectMove {
  if (goal.kind === 'line-mark') return { kind: 'line-mark', at: goal.at };
  if (object.kind === 'grid' && goal.kind === 'grid-size') {
    return object.rows !== goal.rows
      ? { kind: 'grid-rows', by: object.rows < goal.rows ? 1 : -1 }
      : { kind: 'grid-columns', by: object.columns < goal.columns ? 1 : -1 };
  }
  if (object.kind === 'packing' && goal.kind === 'packing-per') {
    return { kind: 'packing-per', by: object.per < goal.per ? 1 : -1 };
  }
  if (object.kind === 'stacks' && goal.kind === 'stacks-level') {
    if (object.held !== null) {
      return { kind: 'stacks-tap', stack: object.stacks.indexOf(Math.min(...object.stacks)) };
    }
    return { kind: 'stacks-tap', stack: object.stacks.indexOf(Math.max(...object.stacks)) };
  }
  throw new Error(`can't reach ${goal.kind} on ${object.kind}`);
}

/** The whole lead from its first step, as he plays it, with no wrong move. */
function walk(lead: LeadSpec, told: readonly string[]): LeadOutcome {
  const facts = { taught: [] as string[], told: [...told] };
  let play: LeadPlay = newLeadPlay(lead, facts);
  let last: LeadOutcome = {};
  const act = (action: LeadAction) => {
    const result = leadStep(lead, play, action, facts);
    play = result.play;
    last = result.outcome;
    if (last.told) facts.told.push(last.told);
    if (last.taught) facts.taught.push(last.taught.mistake);
  };
  const press = (keys: readonly SToken[]) => {
    for (const token of keys) act({ kind: 'type', token });
    act({ kind: 'enter' });
  };
  const write = (task: { start: string; accepts: readonly string[] }) =>
    press(keysFor(task.start, task.accepts[0] as string));
  const reach = (goal: ObjectGoal) => {
    for (let i = 0; i < 60 && play.object && !goalMet(play.object, goal); i++) {
      act({ kind: 'move', move: nextMove(play.object, goal) });
    }
  };

  while (play.step === 'show') act({ kind: 'next' });

  for (const task of lead.tries) {
    if (task.kind === 'object') reach(task.goal);
    else write(task);
    expect(play.solved, task.say).toBe(true);
    act({ kind: 'next' });
  }

  const mistake = lead.mistake;
  if (mistake) {
    expect(play.step).toBe('fix');
    act({ kind: 'fix-tap', line: mistake.wrong });
    reach(mistake.show.goal);
    expect(play.fix, mistake.show.say).toBe('write');
    write(mistake.write);
    expect(play.fix, mistake.write.say).toBe('thanks');
    act({ kind: 'next' });
  }

  for (const spec of lead.scenes) {
    expect(play.step).toBe('play');
    if (playedScene(play)?.guide === 'intro') act({ kind: 'next' });
    switch (spec.kind) {
      case 'knock':
        for (const _clue of spec.clues) {
          const state = play.knock as KnockState;
          const clue = spec.clues.find((candidate) => candidate.id === state.clue);
          if (!clue) throw new Error('no clue');
          press((canonicalLine(clue) ?? []).slice(lineStart(spec, state).length));
        }
        act({ kind: 'door', door: spec.door });
        break;
      case 'unmask':
        act({ kind: 'ask', card: spec.cards[0]?.id as string });
        act({ kind: 'ask', card: spec.cards[1]?.id as string });
        act({ kind: 'accuse', suspect: spec.guilty });
        write(spec.fix);
        break;
      case 'guard':
        act({ kind: 'tile', tile: spec.tiles.find((tile) => tile.breaks)?.id as string });
        write(spec.write);
        break;
      case 'locks':
        for (const lock of spec.locks) {
          const [from, to] = opening(lock.strip, lock.target)[0] as [number, number];
          act({ kind: 'number', number: from });
          act({ kind: 'number', number: to });
        }
        break;
      case 'loop':
        for (const board of spec.boards) {
          const steps = board.bells[0] as number;
          const whole = Math.floor(steps / board.lamps);
          press(digits(`${whole} ost. ${steps % board.lamps}`));
          act({ kind: 'dismiss' });
        }
        break;
      case 'level':
        for (const round of spec.rounds) {
          for (let i = 0; i < 60 && play.level?.phase === 'level'; i++) {
            const now = (play.level as LevelState).stacks;
            act({ kind: 'stack', stack: now.indexOf(Math.max(...now)) });
            act({ kind: 'stack', stack: now.indexOf(Math.min(...now)) });
          }
          act({ kind: 'dismiss' });
          write(round.line);
        }
        break;
      default:
        throw new Error(`act 4 doesn't play ${spec.kind}`);
    }
    expect(playedScene(play)?.opened, spec.kind).toBe(true);
    act({ kind: 'next' });
  }

  for (const task of lead.writeUp) write(task);
  expect(play.step).toBe('thread');
  act({ kind: 'next' });
  act({ kind: 'next' });
  return last;
}

/** Every pair of brackets that opens a lock. */
function opening(strip: string, target: number): [number, number][] {
  const count = stripNumbers(strip).length;
  const found: [number, number][] = [];
  for (let from = 0; from < count; from++) {
    for (let to = from + 1; to < count; to++) {
      if (sumResult(withBrackets(strip, from, to)) === String(target)) found.push([from, to]);
    }
  }
  return found;
}

const isFalse = (line: string) => {
  const parsed = parseStatement(readTokens(line) ?? []);
  return parsed.ok && !isTrue(parsed.statement);
};

describe('act 4 and the last lead', () => {
  it.each(named)('%s proves out', (_id, lead) => {
    expect(proveLead(lead)).toEqual([]);
  });

  it.each(named)('%s plays from its first step to its find', (_id, lead) => {
    expect(walk(lead, allGuidesTold).finished?.firstTry).toBe(true);
  });

  it.each(named)('%s plays the same with every first-time guide on', (_id, lead) => {
    expect(walk(lead, []).finished?.firstTry).toBe(true);
  });

  it.each(named)('%s has what every lead has', (_id, lead) => {
    expect(lead.street).toBe('u1');
    expect(lead.lesson.steps.length).toBeLessThanOrEqual(5);
    for (const step of lead.lesson.steps) expect(step.say.length).toBeLessThanOrEqual(2);
    expect(lead.tries.length).toBeGreaterThanOrEqual(2);
    expect(lead.tries.length).toBeLessThanOrEqual(3);
    expect(lead.tries[0]?.kind, 'tries go from the object to numbers').toBe('object');
    expect(lead.mistake?.id.startsWith(`${lead.id}-`)).toBe(true);
    expect(lead.writeUp[0]?.start, 'the write-up starts with a blank').toContain(BLANK);
    expect(lead.writeUp[lead.writeUp.length - 1]?.start, 'and ends with none').not.toContain(BLANK);
    expect(lead.find.card.length).toBeGreaterThan(0);
  });

  it.each(named)('%s has lines the notebook can write', (_id, lead) => {
    for (const task of lead.tries) {
      if (task.kind === 'line') expect(readLine(task.start), task.start).not.toBeNull();
    }
    for (const task of lead.writeUp) expect(readLine(task.start), task.start).not.toBeNull();
    expect(readLine(lead.mistake?.write.start ?? '')).not.toBeNull();
  });

  it('puts the locks in act 4 and the lamp oil last, with the moment that ends the part', () => {
    expect([l12.act, l13.act, l14.act, l15.act, l16.act]).toEqual([4, 4, 4, 4, 'last']);
    expect(l16.beats).toEqual(['near-miss']);
  });

  it('writes what the GDD says each lead writes', () => {
    const lines = (lead: LeadSpec) => lead.writeUp.flatMap((task) => task.accepts);
    expect(lines(l12)).toContain('(3 + 4) · 3 + 3 = 24');
    expect(lines(l13)).toContain('409 · 86 − 309 · 86 = (409 − 309) · 86 = 8 600');
    expect(lines(l14)).toContain('100 : 7 = 14 ost. 2');
    expect(lines(l14)).toContain('7 · 14 + 2 = 100');
    expect(lines(l15)).toContain('x̄ = (6 + 14) : 2 = 10');
    expect(lines(l15)).toContain('38 · 30 = 1 140');
    expect(lines(l16)).toContain('60 − 35 = 25');
  });
});

describe('The locks', () => {
  const spec = scene(l12, 'locks');
  const tap = (state: ReturnType<typeof newLocks>, from: number, to: number) =>
    locksTap(spec, locksTap(spec, state, from), to);

  it('have a line of each kind of bracket in the write-up', () => {
    const written = l12.writeUp.flatMap((task) => task.accepts).join(' ');
    for (const sign of ['(', '[', '{']) expect(written).toContain(sign);
  });

  it('open at exactly one place, and with one pair of brackets', () => {
    for (const lock of spec.locks) expect(opening(lock.strip, lock.target)).toHaveLength(1);
  });

  it('every wrong place shows a whole result, so there’s never a fraction on the lock', () => {
    for (const lock of spec.locks) {
      const count = stripNumbers(lock.strip).length;
      for (let from = 0; from < count; from++) {
        for (let to = from + 1; to < count; to++) {
          expect(sumResult(withBrackets(lock.strip, from, to))).toMatch(/^\d+$/);
        }
      }
    }
  });

  it('are shut before the brackets go in, with the result he’d get', () => {
    expect(sumResult('2 + 5 · 4')).not.toBe('28');
    const open = locksTap(spec, newLocks(), 0);
    expect(open.lock).toBe(0);
    expect(open.notice).toBeNull();
  });

  it('a wrong place shows the different result, and the lock stays shut', () => {
    const shut = tap(newLocks(), 1, 2);
    expect(shut.lock).toBe(0);
    expect(shut.notice).toBe(act4Text.l12.scene.shut('22'));
    expect(shut.tried).toBe('2 + (5 · 4)');
    const again = tap(locksDismiss(shut), 0, 1);
    expect(again.lock).toBe(1);
    expect(oneOffEarns({ ...again, opened: true })).toBe(false);
  });

  it('the minus before a bracket: from the left it’s 265, and the lock wants 183', () => {
    let state = tap(tap(newLocks(), 0, 1), 0, 1);
    expect(state.lock).toBe(2);
    state = tap(state, 0, 1);
    expect(state.notice).toBe(act4Text.l12.scene.shut('265'));
    state = tap(locksDismiss(state), 1, 2);
    expect(state.lock).toBe(3);
    expect(state.opened).toBe(false);
    state = tap(state, 2, 3);
    expect(state.opened).toBe(true);
  });

  it('the little one ignores brackets: its right line is right either way', () => {
    expect(sumResult('3 · 2 + 5')).toBe('11');
    expect(sumResult('3 + 2 · 5')).toBe('13');
    expect(l12.mistake?.lines).toEqual(['(3 · 2) + 5 = 11', '(3 + 2) · 5 = 13']);
  });
});

describe('Two witnesses', () => {
  const spec = scene(l13, 'unmask');
  const asked = ['a', 'b'].reduce((state, card) => unmaskAsk(spec, state, card), newUnmask());
  const press = (state: typeof asked, line: string) =>
    unmaskEnter(
      spec,
      keysFor(spec.fix.start, line).reduce((s, key) => unmaskType(s, key), state),
    );

  it('has one culprit, wrong on any two cards, and nobody else as wrong', () => {
    expect(proveUnmask(spec)).toEqual([]);
    for (const card of spec.cards) {
      expect(isFalse(card.answers.dimnjacar as string), card.id).toBe(true);
      expect(isFalse(card.answers.zvonar as string), card.id).toBe(false);
    }
    const slips = spec.cards.filter((card) => isFalse(card.answers.mlinar as string));
    expect(slips.map((card) => card.id)).toEqual(['b']);
  });

  it('the moment before: he has to ask two cards first', () => {
    const one = unmaskAsk(spec, newUnmask(), 'a');
    const early = unmaskAccuse(spec, one, 'dimnjacar');
    expect(early.tooSoon).toBe(true);
    expect(early.phase).toBe('ask');
  });

  it('pointing at the miller, the odd one out, offends him and shows he only slipped', () => {
    const wrong = unmaskAccuse(spec, asked, 'mlinar');
    expect(wrong.phase).toBe('ask');
    expect(wrong.shown).toContain(act4Text.l13.scene.offended.mlinar);
    expect(wrong.shown).toContain(act4Text.l13.scene.why.mlinar);
    const right = unmaskAccuse(spec, unmaskDismiss(wrong), 'dimnjacar');
    expect(right.phase).toBe('write');
    expect(unmaskEarns({ ...right, opened: true })).toBe(false);
  });

  it('the culprit’s own false line bounces, and only the corrected one ends it', () => {
    const writing = unmaskAccuse(spec, asked, 'dimnjacar');
    const same = press(writing, '5 · (3 + 4) = 5 · 3 + 4');
    expect(same.bounced).toBe(true);
    expect(same.opened).toBe(false);
    const done = press(writing, '5 · (3 + 4) = 5 · 3 + 5 · 4');
    expect(done.opened).toBe(true);
    expect(unmaskEarns(done)).toBe(true);
  });
});

describe('The loop', () => {
  const spec = scene(l14, 'loop');
  const type = (state: ReturnType<typeof newLoop>, line: string) =>
    digits(line).reduce((s, key) => oneOffType(s, key), state);
  const board = (at: number) => spec.boards[at] as (typeof spec.boards)[number];

  it('grows from 5 lamps and 7 steps to 7 lamps and 100', () => {
    expect(spec.boards.map(({ lamps, bells }) => [lamps, bells[0]])).toEqual([
      [5, 7],
      [7, 20],
      [7, 100],
    ]);
    expect(loopStart(board(2), { ...newLoop(), board: 2 })).toBe('100 : 7 =');
  });

  it('a wrong lamp shows where it really stops, and the next try has a new bell', () => {
    const wrong = loopEnter(spec, type(newLoop(), '1 ost. 3'));
    expect(wrong.got).toBe(false);
    expect(wrong.notice).toBe(act4Text.l14.scene.missed(2));
    const next = loopDismiss(spec, wrong);
    expect(next.board).toBe(0);
    expect(loopStart(board(0), next)).toBe('9 : 5 =');
    expect(oneOffEarns({ ...next, opened: true })).toBe(false);
  });

  it('a remainder as big as the lamps bounces, as the little one’s 55 : 9 does', () => {
    const big = loopEnter(spec, type(newLoop(), '0 ost. 7'));
    expect(big.bounced).toBe(true);
    expect(big.pinned).toBeNull();
    expect(isFalse('55 : 9 = 5 ost. 10')).toBe(true);
    expect(l14.mistake?.lines[l14.mistake.wrong]).toBe('55 : 9 = 5 ost. 10');
  });

  it('three right divisions take three keys, and the last ends it', () => {
    let state = newLoop();
    for (const line of ['1 ost. 2', '2 ost. 6', '14 ost. 2']) {
      expect(state.opened).toBe(false);
      state = loopEnter(spec, type(state, line));
      expect(state.notice).toBe(act4Text.l14.scene.taken);
      state = loopDismiss(spec, state);
    }
    expect(state.opened).toBe(true);
    expect(oneOffEarns(state)).toBe(true);
  });
});

describe('The hoist', () => {
  const spec = scene(l15, 'level') as LevelSpec;
  const move = (state: LevelState, from: number, to: number) =>
    levelTap(spec, levelTap(spec, state, from), to);
  const levelled = (state: LevelState) => {
    let now = state;
    for (let i = 0; i < 60 && now.phase === 'level'; i++) {
      now = move(
        now,
        now.stacks.indexOf(Math.max(...now.stacks)),
        now.stacks.indexOf(Math.min(...now.stacks)),
      );
    }
    return levelDismiss(now);
  };
  const type = (state: LevelState, line: string) =>
    digits(line).reduce((s, key) => oneOffType(s, key), state);

  it('has 2, 3 and 4 stacks, and a repeated value', () => {
    expect(spec.rounds.map((round) => round.stacks.length)).toEqual([2, 3, 4]);
    const repeats = spec.rounds.filter((round) => new Set(round.stacks).size < round.stacks.length);
    expect(repeats).toHaveLength(1);
  });

  it('fits the rig, which draws a crate at 6% of its height', () => {
    for (const round of spec.rounds) {
      for (const stack of round.stacks) expect(stack * 6).toBeLessThanOrEqual(100);
    }
  });

  it('the moment before: nothing to write until the bar is level', () => {
    let state = newLevel(spec);
    for (let i = 0; i < 3; i++) state = move(state, 1, 0);
    expect(state.phase).toBe('level');
    expect(levelEnter(spec, type(state, '10'))).toEqual(type(state, '10'));
    state = move(state, 1, 0);
    expect(state.stacks).toEqual([10, 10]);
    expect(state.notice).toBe(act4Text.l15.scene.level);
    expect(state.phase).toBe('write');
  });

  it('a wrong result bounces, and the next round brings the next stacks', () => {
    const writing = levelled(newLevel(spec));
    const wrong = levelEnter(spec, type(writing, '11'));
    expect(wrong.bounced).toBe(true);
    expect(wrong.round).toBe(0);
    const next = levelEnter(spec, type(writing, '10'));
    expect(next.round).toBe(1);
    expect(next.stacks).toEqual([3, 5, 10]);
    expect(next.phase).toBe('level');
  });

  it('every stack counts: counting the repeated value once is the little one’s mistake', () => {
    const mistake = l15.mistake;
    if (!mistake) throw new Error('no mistake');
    const parsed = parseStatement(readTokens(mistake.lines[mistake.wrong] as string) ?? []);
    expect(parsed.ok && isTrue(parsed.statement, mistake.context)).toBe(false);
    expect(parsed.ok && isTrue(parsed.statement), 'its sum alone comes out right').toBe(true);
    expect(mistake.show.object).toEqual({ kind: 'stacks', stacks: [5, 5, 5, 9], held: null });
    const level = (mistake.show.object.kind === 'stacks' &&
      mistake.show.object.stacks.reduce((a, b) => a + b) / 4) as number;
    expect(level).toBe(6);
  });

  it('the stacks try is won by levelling, not before', () => {
    const task = l15.tries[0];
    if (task?.kind !== 'object') throw new Error('no object try');
    expect(goalMet(task.object, task.goal)).toBe(false);
    let object = task.object;
    for (let i = 0; i < 12 && !goalMet(object, task.goal); i++) {
      object = applyMove(object, nextMove(object, task.goal));
    }
    expect(goalMet(object, task.goal)).toBe(true);
    expect(object).toMatchObject({ stacks: [5, 5] });
  });
});

describe('The lamp oil', () => {
  const guard = scene(l16, 'guard') as GuardSpec;
  const knocks = l16.scenes.filter((candidate): candidate is KnockSpec => {
    return candidate.kind === 'knock';
  });

  it('is the guard, then four Knocks', () => {
    expect(l16.scenes.map((candidate) => candidate.kind)).toEqual([
      'guard',
      'knock',
      'knock',
      'knock',
      'knock',
    ]);
  });

  describe('the guard', () => {
    it('breaks on one tile only: 0 : 7 is allowed, and 7 : 0 isn’t', () => {
      expect(guard.id).toBe('rule-4');
      expect(guard.tiles.filter((tile) => tile.breaks).map((tile) => tile.face)).toEqual(['7 : 0']);
      expect(guard.tiles.map((tile) => tile.face)).toContain('0 : 7');
    });

    it('a wrong pick makes it thank him', () => {
      const wrong = guardPick(guard, newGuard(), 'zero');
      expect(wrong.said).toBe(act4Text.l16.guard.thanks.zero);
      expect(wrong.phase).toBe('pick');
      const on = guardPick(guard, guardDismiss(wrong), 'by-zero');
      expect(on.phase).toBe('write');
      const done = guardEnter(
        guard,
        ['0'].reduce((s, key) => guardType(s, key as SToken), on),
      );
      expect(done.opened).toBe(true);
      expect(guardEarns(done)).toBe(false);
    });

    it('the moment before: the tile isn’t enough, and a false line bounces', () => {
      const on = guardPick(guard, newGuard(), 'by-zero');
      expect(on.opened).toBe(false);
      const wrong = guardEnter(
        guard,
        ['7'].reduce((s, key) => guardType(s, key as SToken), on),
      );
      expect(wrong.bounced).toBe(true);
      expect(wrong.opened).toBe(false);
    });
  });

  describe.each(knocks.map((knock, i) => [i + 1, knock] as const))('chart %i', (_at, knock) => {
    const picture = knock.picture;
    if (picture?.kind !== 'bars') throw new Error('no chart');
    const typeAll = (state: KnockState, keys: readonly SToken[]) =>
      keys.reduce((s, key) => knockType(s, key, 40), state);
    const limit = knock.clues[0];
    const sum = knock.clues[1];
    if (limit?.kind !== 'limit' || sum?.kind !== 'sum') throw new Error('limit, then sum');
    const read = (state: KnockState) => knockEnter(knock, typeAll(state, digits(limit.canonical)));

    it('draws its tallest bar on a mark, and gives every bar its own label', () => {
      const tallest = Math.max(...picture.bars.map((bar) => bar.value));
      expect(tallest % picture.step).toBe(0);
      const labels = picture.bars.map((bar) => bar.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it('holds each value it asks for, so that he reads it rather than being told', () => {
      expect(limit.say).not.toMatch(/\d\d/);
      expect(sum.say).not.toMatch(/\d\d/);
    });

    it('won’t take a line read wrong: it shakes, and points at the clue', () => {
      const fresh = newKnock(knock);
      const misread = limit.canonical.replace(/\d+/, (n) => String(Number(n) + 1));
      const wrong = knockEnter(knock, typeAll(fresh, digits(misread)));
      expect(wrong.lines).toHaveLength(0);
      expect(wrong.shakes).toBe(1);
      expect(wrong.pointAt).toBe(limit.id);
    });

    it('the moment before: with one clue used, more than one door is lit, and no knock', () => {
      const state = read(newKnock(knock));
      expect(state.lines).toHaveLength(1);
      expect(litDoors(knock.row, state.side, state.lines).length).toBeGreaterThan(1);
      expect(cluesLeft(knock, state).map((clue) => clue.id)).toEqual([sum.id]);
      const early = knockDoor(knock, state, knock.door);
      expect(early.opened).toBe(false);
      expect(early.shakes).toBe(1);
    });

    it('a wrong sum knocks at a grumpy door, and then has to be true', () => {
      const state = read(newKnock(knock));
      const wrongDoor = knock.door + 1;
      const typed = knockEnter(knock, typeAll(state, digits(String(wrongDoor))));
      expect(litDoors(knock.row, typed.side, typed.lines)).toEqual([wrongDoor]);
      const knocked = knockDoor(knock, typed, wrongDoor);
      expect(knocked.shown?.say).toBe(knock.grumpy[0]);
      expect(knocked.mode).toBe('working');
      const back = knockDismiss(knocked);
      const again = knockEnter(knock, typeAll(back, digits(String(wrongDoor))));
      expect(again.bounced).toBe(true);
      const right = knockEnter(knock, typeAll({ ...again, draft: [] }, digits(String(knock.door))));
      expect(litDoors(knock.row, right.side, right.lines)).toEqual([knock.door]);
      const opened = knockDoor(knock, right, knock.door);
      expect(opened.opened).toBe(true);
    });
  });

  it('asks the first chart with an axis of 10 and a bar between its marks', () => {
    const first = knocks[0]?.picture;
    expect(first).toMatchObject({ step: 10 });
    expect(first?.kind === 'bars' && first.bars.some((bar) => bar.value === 35)).toBe(true);
  });

  it('has two bars a street on the double chart, labelled by week', () => {
    const second = knocks[1]?.picture;
    expect(second?.kind === 'bars' && second.bars.map((bar) => bar.label)).toEqual([
      act4Text.l16.charts.trg1,
      act4Text.l16.charts.trg2,
      act4Text.l16.charts.most1,
      act4Text.l16.charts.most2,
      act4Text.l16.charts.pusta1,
      act4Text.l16.charts.pusta2,
    ]);
  });

  it('on the last chart one step means 10: reading the bar as it stands shakes', () => {
    const last = knocks[3] as KnockSpec;
    const typed = digits('x > 3').reduce((s, key) => knockType(s, key, 40), newKnock(last));
    expect(knockEnter(last, typed).lines).toHaveLength(0);
    const ten = digits('x > 30').reduce((s, key) => knockType(s, key, 40), newKnock(last));
    expect(knockEnter(last, ten).lines).toHaveLength(1);
  });
});

describe('the ending', () => {
  const panels = act4Text.ending.panels;

  it('has 5 to 7 panels', () => {
    expect(panels.length).toBeGreaterThanOrEqual(5);
    expect(panels.length).toBeLessThanOrEqual(7);
  });

  it('prints his name in the note and on the front page, and nowhere else', () => {
    const named = panels.flatMap((panel, i) => (panel.includes('{ime}') ? [i] : []));
    expect(named).toHaveLength(2);
    const first = named[0] as number;
    const second = named[1] as number;
    expect(first).toBeLessThan(second);
    expect(panels[second]).toContain('netko pametan');
  });

  it('ends on the next trail, after the notice that ends in its full stop', () => {
    const notice = panels.findIndex((panel) => /[A-ZĀ-ſ ]{8,}\.$/.test(panel));
    expect(notice).toBeGreaterThan(-1);
    expect(notice).toBeLessThan(panels.length - 1);
    expect(panels[panels.length - 1]).toMatch(/\?$/);
  });
});
