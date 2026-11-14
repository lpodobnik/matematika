import { describe, expect, it } from 'vitest';
import { act2Leads, k1, k2, l02, l05, l07, l08, w1 } from '@/content/leads/act2';
import { act2Text } from '@/content/text/hunt-act2';
import {
  digitsOf,
  type KnockSpec,
  type KnockState,
  knockCross,
  knockDismiss,
  knockDoor,
  knockEarns,
  knockEnter,
  knockPickClue,
  knockStrike,
  knockType,
  litDoors,
  newKnock,
} from '@/hunt/knock';
import { type LeadAction, type LeadOutcome, leadStep, newLeadPlay } from '@/hunt/lead';
import type { ObjectGoal } from '@/hunt/objects';
import {
  newWindows,
  oneOffEarns,
  type WindowsSpec,
  windowNumber,
  windowsDismiss,
  windowsThrow,
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
import { allGuidesTold, type SceneSpec } from '@/hunt/scene';
import { proveLead } from '@/hunt/solve';
import type { LeadSpec } from '@/hunt/spec';
import {
  newUnmask,
  type UnmaskSpec,
  unmaskAccuse,
  unmaskAsk,
  unmaskDismiss,
  unmaskEarns,
  unmaskEnter,
  unmaskType,
} from '@/hunt/unmask';
import { parseStatement } from '@/math/statement';
import { isSDigit, readLine, readTokens, type SToken } from '@/math/statement-tokens';
import { BLANK } from '@/math/tokens';
import { isTrue } from '@/math/truth';

const all = Object.entries(act2Leads);

/** A line of content as the tokens he'd press, for a line that reads. */
const tokensOf = (line: string): SToken[] => {
  const tokens = readTokens(line);
  if (!tokens) throw new Error(`"${line}" doesn't read`);
  return tokens;
};

/** What he has to type to turn `start` into `line`. */
function typedFor(start: string, line: string): SToken[] {
  const from = readLine(start);
  if (!from) throw new Error(`"${start}" doesn't read`);
  const whole = tokensOf(line);
  const blank = from.indexOf(BLANK);
  if (blank < 0) return whole.slice(from.length);
  return whole.slice(blank, whole.length - (from.length - blank - 1));
}

const knockOf = (lead: LeadSpec, at = 0) => lead.scenes[at] as KnockSpec;
const guardOf = (lead: LeadSpec) => lead.scenes[0] as GuardSpec;

const typed = (state: KnockState, tokens: readonly SToken[]) =>
  tokens.reduce((s, token) => knockType(s, token, 40), state);

/** He picks a clue and writes on it. `text` is what he types: the clue's start is already there. */
const write = (spec: KnockSpec, state: KnockState, clue: string, text: string) =>
  knockEnter(spec, typed(knockPickClue(spec, state, clue), tokensOf(text)));

const lit = (spec: KnockSpec, state: KnockState) => litDoors(spec.row, state.side, state.lines);

const facts = { taught: [], told: allGuidesTold };

/** The whole lead, from the first step to the thread, by the real rules, with no wrong move. */
function playThrough(spec: LeadSpec): { outcome: LeadOutcome; ends: boolean } {
  let play = newLeadPlay(spec, facts);
  let outcome: LeadOutcome = {};
  const act = (action: LeadAction) => {
    const result = leadStep(spec, play, action, facts);
    play = result.play;
    outcome = result.outcome;
  };
  const typeLine = (start: string, line: string) => {
    for (const token of typedFor(start, line)) act({ kind: 'type', token });
    act({ kind: 'enter' });
  };
  const reach = (goal: ObjectGoal) => {
    if (goal.kind === 'line-mark') act({ kind: 'move', move: { kind: 'line-mark', at: goal.at } });
    if (goal.kind === 'grid-size') {
      for (let i = 0; i < 40; i++) {
        const object = play.object;
        if (object?.kind !== 'grid') return;
        if (object.rows !== goal.rows) {
          act({ kind: 'move', move: { kind: 'grid-rows', by: object.rows < goal.rows ? 1 : -1 } });
        } else if (object.columns !== goal.columns) {
          const by = object.columns < goal.columns ? 1 : -1;
          act({ kind: 'move', move: { kind: 'grid-columns', by } });
        } else return;
      }
    }
  };
  const playScene = (scene: SceneSpec) => {
    switch (scene.kind) {
      case 'knock':
        if (scene.clues.some((clue) => clue.kind === 'side')) act({ kind: 'cross' });
        for (const clue of scene.clues) {
          if (clue.kind === 'side' || clue.id === scene.forged) continue;
          act({ kind: 'pick-clue', clue: clue.id });
          const own = clue.kind === 'limit' ? tokensOf(clue.canonical) : digitsOf(clue.answer);
          for (const token of own) act({ kind: 'type', token });
          act({ kind: 'enter' });
        }
        act({ kind: 'door', door: scene.door });
        break;
      case 'guard': {
        const tile = scene.tiles.find((candidate) => candidate.breaks);
        act({ kind: 'tile', tile: tile?.id ?? '' });
        typeLine(scene.write.start, scene.write.accepts[0] ?? '');
        break;
      }
      case 'unmask':
        for (const card of scene.cards.slice(0, scene.required)) {
          act({ kind: 'ask', card: card.id });
        }
        act({ kind: 'accuse', suspect: scene.guilty });
        typeLine(scene.fix.start, scene.fix.accepts[0] ?? '');
        break;
      case 'windows':
        for (const round of scene.rounds) {
          act({ kind: 'window', number: round.target });
          act({ kind: 'dismiss' });
        }
        break;
      default:
        throw new Error(`no driver for ${scene.kind}`);
    }
    act({ kind: 'next' });
  };

  for (const _ of spec.lesson.steps) act({ kind: 'next' });
  for (const task of spec.tries) {
    if (task.kind === 'object') reach(task.goal);
    else typeLine(task.start, task.accepts[0] ?? '');
    act({ kind: 'next' });
  }
  if (spec.mistake) {
    act({ kind: 'fix-tap', line: spec.mistake.wrong });
    reach(spec.mistake.show.goal);
    typeLine(spec.mistake.write.start, spec.mistake.write.accepts[0] ?? '');
    act({ kind: 'next' });
  }
  for (const scene of spec.scenes) playScene(scene);
  for (const task of spec.writeUp) typeLine(task.start, task.accepts[0] ?? '');
  const ends = play.step === 'thread';
  act({ kind: 'next' });
  act({ kind: 'next' });
  return { outcome, ends };
}

describe('every lead and knot of Acts 1 and 2 here', () => {
  it.each(all)('%s proves out', (_id, spec) => {
    expect(proveLead(spec)).toEqual([]);
    expect(spec.street).toBe('u1');
  });

  it.each(all)('%s can be played to its end, with nothing struck', (_id, spec) => {
    const { outcome, ends } = playThrough(spec);
    expect(ends).toBe(true);
    expect(outcome.finished?.lines).toHaveLength(spec.writeUp.length);
    expect(outcome.finished?.firstTry).toBe(true);
  });

  it.each(all)('%s has the keys its lines need', (_id, spec) => {
    const canType = (start: string, line: string, keys: readonly SToken[]) => {
      for (const token of typedFor(start, line)) {
        if (!isSDigit(token)) expect(keys, `${line}: ${token}`).toContain(token);
      }
    };
    const tasks = [
      ...spec.tries.flatMap((task) => (task.kind === 'line' ? [task] : [])),
      ...spec.writeUp,
      ...(spec.mistake ? [spec.mistake.write] : []),
    ];
    for (const task of tasks) {
      for (const line of task.accepts) canType(task.start, line, task.keys);
    }
    for (const scene of spec.scenes) {
      if (scene.kind === 'guard') {
        for (const line of scene.write.accepts) {
          canType(scene.write.start, line, scene.write.keys);
        }
      }
      if (scene.kind === 'unmask') {
        for (const line of scene.fix.accepts) canType(scene.fix.start, line, scene.fix.keys);
      }
      if (scene.kind === 'knock') {
        for (const clue of scene.clues) {
          if (clue.kind === 'limit') canType('', clue.canonical, scene.keys);
        }
      }
    }
  });

  it('keeps every showing short, with tries going from object to numbers', () => {
    for (const spec of [l02, l05, l07, l08]) {
      expect(spec.lesson.steps.length).toBeLessThanOrEqual(5);
      for (const step of spec.lesson.steps) {
        expect(step.say.length).toBeLessThanOrEqual(2);
        for (const line of step.say) expect(line.length, line).toBeLessThanOrEqual(80);
      }
      expect(spec.tries.length).toBeGreaterThanOrEqual(2);
      expect(spec.tries.length).toBeLessThanOrEqual(3);
      expect(spec.tries[0]?.kind).toBe('object');
      expect(spec.tries[spec.tries.length - 1]?.kind).toBe('line');
    }
  });

  it('gives the little one a mistake of its own, stored under a stable id', () => {
    for (const spec of [l02, l05, l07, l08]) {
      expect(spec.mistake?.id.startsWith(`${spec.id}-`)).toBe(true);
    }
  });

  it('fades the write-up: a blank first, then a whole line', () => {
    for (const spec of [l02, l05, l07, l08]) {
      expect(spec.writeUp[0]?.start).toContain(BLANK);
      for (const task of spec.writeUp.slice(1)) expect(task.start).not.toContain(BLANK);
    }
  });

  it('names a general card for each find', () => {
    for (const [, spec] of all) {
      expect(spec.find.say).not.toBe('');
      expect(spec.find.title).not.toBe('');
      expect(spec.find.card.length).toBeGreaterThan(0);
    }
  });

  const strings = (value: unknown): string[] =>
    typeof value === 'string'
      ? [value]
      : typeof value === 'object' && value !== null
        ? Object.values(value).flatMap(strings)
        : [];

  it('never addresses him with a gendered past tense', () => {
    const pastWithSi = /(?<!\p{L})si\s+\p{L}+(?:o|la)(?!\p{L})|\p{L}+(?:o|la)\s+si(?!\p{L})/u;
    for (const line of strings(act2Text)) expect(line).not.toMatch(pastWithSi);
  });

  it('keeps out the words the curriculum leaves for later', () => {
    // Compared without diacritics, which stay out of this file.
    const banned = /baza|eksponent|ishodiste|jedinicna tocka/i;
    const plain = (line: string) => line.normalize('NFD').replace(/\p{M}/gu, '');
    for (const line of strings(act2Text)) expect(plain(line)).not.toMatch(banned);
  });
});

describe('the neighbours', () => {
  const street = knockOf(l02);
  const riddle = knockOf(l02, 1);

  it('has its doors in one row, with no road to cross, so that next door is the next number', () => {
    const state = newKnock(street);
    expect(state.side).toBeNull();
    expect(lit(street, state)).toContain(999);
    expect(lit(street, state)).toContain(1000);
  });

  it('knocking on the witness gets nothing, and from then on each line has to be true', () => {
    let state = newKnock(street);
    state = write(street, state, 'witness', '999');
    state = write(street, state, 'above', '999');
    state = write(street, state, 'postman', '999');
    expect(lit(street, state)).toEqual([999]);
    const wrong = knockDoor(street, state, 999);
    expect(wrong.shown?.say).toBe(act2Text.l02.street.wrongWitness);
    expect(wrong.mode).toBe('working');
    expect(knockEarns(wrong)).toBe(false);

    let on = knockDismiss(wrong);
    const bounced = write(street, on, 'witness', '999');
    expect(bounced.bounced).toBe(true);
    on = write(street, on, 'witness', '1000');
    on = write(street, on, 'above', '1000');
    on = write(street, on, 'postman', '1000');
    expect(lit(street, on)).toEqual([1000]);
    expect(knockDoor(street, on, 1000).opened).toBe(true);
  });

  it('the moment before: a tap with clues unused writes the next clue’s line, and doesn’t knock', () => {
    const one = write(street, newKnock(street), 'witness', '1000');
    expect(lit(street, one)).toEqual([1000]);
    const early = knockDoor(street, one, 1000);
    expect(early.opened).toBe(false);
    expect(early.lines).toHaveLength(2);
    expect(early.lines[1]?.clue).toBe('above');
  });

  it('a line that disagrees with the one before is struck, and leaves the door', () => {
    const one = write(street, newKnock(street), 'witness', '1000');
    const two = write(street, one, 'above', '999');
    expect(two.lines[1]?.struck).toBe(true);
    expect(lit(street, two)).toEqual([1000]);
  });

  it('its riddle answers 17, and the two near misses say why', () => {
    const at = (door: number) => {
      const state = write(riddle, newKnock(riddle), 'riddle', String(door));
      return knockDoor(riddle, state, door);
    };
    expect(at(18).shown?.say).toBe(act2Text.l02.riddle.wrongEighteen);
    expect(at(16).shown?.say).toBe(act2Text.l02.riddle.wrongSixteen);
    expect(at(17).opened).toBe(true);
    expect(at(20).shown?.say).toBe(act2Text.l02.riddle.grumpy[0]);
  });
});

describe('Knot 1', () => {
  const guard = guardOf(k1);
  const knock = knockOf(k1, 1);

  it('is a knot: no showing of its own, and it gives the hook', () => {
    expect(k1.lesson.steps).toEqual([]);
    expect(k1.tries).toEqual([]);
    expect(k1.mistake).toBeNull();
    expect(k1.gives).toBe('hook');
    expect(k1.beats).toEqual(['hook-given']);
    expect(k1.scenes.map((scene) => scene.kind)).toEqual(['guard', 'knock']);
    expect(newLeadPlay(k1, facts).step).toBe('play');
  });

  it('walks the first guard through: nothing passes before its opening words', () => {
    const told = { taught: [], told: [] };
    const start = newLeadPlay(k1, told);
    expect(leadStep(k1, start, { kind: 'tile', tile: 'moved' }, told).play).toBe(start);
    const on = leadStep(k1, start, { kind: 'next' }, told).play;
    expect(leadStep(k1, on, { kind: 'tile', tile: 'moved' }, told).play.guard?.phase).toBe('write');
  });

  it('has exactly one tile that breaks the rule: a digit that moves', () => {
    expect(guard.tiles.filter((tile) => tile.breaks).map((tile) => tile.face)).toEqual(['3 i 30']);
  });

  it('thanks him for a tile that keeps the digit in its place, at no cost', () => {
    const wrong = guardPick(guard, newGuard(), 'tens');
    expect(wrong.said).toBe(act2Text.k1.guard.thanks.tens);
    expect(wrong.phase).toBe('pick');
    const on = guardPick(guard, guardDismiss(wrong), 'moved');
    expect(on.phase).toBe('write');
    const type = (keys: string) =>
      tokensOf(keys).reduce((state, token) => guardType(state, token), on);
    expect(guardEnter(guard, type('3 · 11')).bounced).toBe(true);
    const done = guardEnter(guard, type('3 · 10'));
    expect(done.opened).toBe(true);
    expect(guardEarns(done)).toBe(false);
  });

  it('takes its door from the finds: a side, two sums and a member', () => {
    expect(knock.door).toBe(35);
    let state = newKnock(knock);
    expect(lit(knock, state)).not.toContain(35);
    state = knockCross(knock, state);
    state = write(knock, state, 'slip', '35');
    state = write(knock, state, 'tram', '35');
    state = write(knock, state, 'watchman', '35');
    expect(state.lines.every((line) => !line.struck)).toBe(true);
    expect(knockDoor(knock, state, 35).opened).toBe(true);
  });

  it('a sum that disagrees with the line before is struck, and leaves the door', () => {
    let state = knockCross(knock, newKnock(knock));
    state = write(knock, state, 'slip', '35');
    state = write(knock, state, 'tram', '45');
    expect(state.lines[1]?.struck).toBe(true);
    expect(lit(knock, state)).toEqual([35]);
  });
});

describe('the wandering-off', () => {
  const knock = knockOf(w1);

  it('plays as a knot, and marks both moments of the story', () => {
    expect(w1.act).toBe(2);
    expect(w1.lesson.steps).toEqual([]);
    expect(w1.beats).toEqual(['wandered', 'found']);
    expect(w1.scenes).toHaveLength(1);
  });

  it('answers a wrong door with the neighbours’ grumbling, each time another', () => {
    const wrongAt = (state: KnockState, door: number) => {
      const crossed = state.side === 'even' ? state : knockCross(knock, state);
      const one = write(knock, crossed, 'baker', String(door));
      return knockDoor(knock, write(knock, one, 'boy', String(door)), door);
    };
    const first = wrongAt(newKnock(knock), 66);
    expect(first.shown?.say).toBe(act2Text.w1.knock.grumpy[0]);
    // From then on a false line bounces, so seed his lines back: no third way there exists.
    const seeded = {
      ...knockDismiss(first),
      lines: first.lines.map((line) => ({ ...line, struck: false })),
    };
    expect(knockDoor(knock, seeded, 66).shown?.say).toBe(act2Text.w1.knock.grumpy[1]);
  });

  it('ends in relief at the right door', () => {
    let state = knockCross(knock, newKnock(knock));
    state = write(knock, state, 'baker', '64');
    state = write(knock, state, 'boy', '64');
    const open = knockDoor(knock, state, 64);
    expect(open.opened).toBe(true);
    expect(knock.opened).toBe(act2Text.w1.knock.opened);
  });
});

describe('the witnesses', () => {
  const knock = knockOf(l05);
  const crossed = knockCross(knock, newKnock(knock));
  const twoIn = write(knock, write(knock, crossed, 'range', '230 < x < 240'), 'not', 'x ≠ 232');

  it('the moment before: the range alone leaves four doors, and no knock', () => {
    const range = write(knock, crossed, 'range', '230 < x < 240');
    expect(lit(knock, range)).toEqual([232, 234, 236, 238]);
    expect(knockDoor(knock, range, 234).opened).toBe(false);
  });

  it('won’t take numbers that aren’t the clue’s', () => {
    const state = write(knock, crossed, 'range', '231 < x < 240');
    expect(state.lines).toEqual([]);
    expect(state.shakes).toBe(1);
  });

  it('< leaves door 234 out, and so no door at all', () => {
    const state = write(knock, twoIn, 'up-to', 'x < 234');
    expect(state.lines[2]?.struck).toBe(true);
    expect(state.anyStruck).toBe(true);
    expect(lit(knock, state)).toEqual([234, 236, 238]);
  });

  it('≤ keeps it in, and leaves one door', () => {
    const state = write(knock, twoIn, 'up-to', 'x ≤ 234');
    expect(lit(knock, state)).toEqual([234]);
    const open = knockDoor(knock, state, 234);
    expect(open.opened).toBe(true);
    expect(knockEarns(open)).toBe(true);
  });

  it('with the sides mixed up, no door is left to knock on', () => {
    const odd = write(knock, knockCross(knock, twoIn), 'up-to', 'x ≤ 234');
    expect(lit(knock, odd)).toEqual([231, 233]);
    expect(knockDoor(knock, odd, 233).opened).toBe(false);
  });

  it('knocking on the baker: his door says so, and a false line can’t go in after it', () => {
    let state = write(knock, crossed, 'range', '230 < x < 240');
    state = write(knock, state, 'not', 'x ≥ 232');
    state = write(knock, state, 'up-to', 'x < 234');
    expect(lit(knock, state)).toEqual([232]);
    const wrong = knockDoor(knock, state, 232);
    expect(wrong.shown?.say).toBe(act2Text.l05.scene.wrongBaker);
    expect(wrong.mode).toBe('working');
    // Nothing names the door, so the door strikes the last line he wrote.
    expect(wrong.lines[2]?.struck).toBe(true);
    const on = knockDismiss(wrong);
    expect(lit(knock, on)).toEqual([232, 234, 236, 238]);
    expect(write(knock, on, 'up-to', 'x < 234').bounced).toBe(true);
    const right = write(knock, on, 'up-to', 'x ≤ 234');
    expect(lit(knock, right)).toEqual([232, 234]);
    const redo = write(knock, knockStrike(knock, right, 1), 'not', 'x ≠ 232');
    expect(lit(knock, redo)).toEqual([234]);
    expect(knockDoor(knock, redo, 234).opened).toBe(true);
  });

  it('has the signs it needs on its pad', () => {
    for (const sign of ['<', '>', '≤', '≥', '≠', 'x', ',', '{', '}'] as const) {
      expect(knock.keys).toContain(sign);
    }
  });
});

describe('the ledgers', () => {
  const unmask = l07.scenes[0] as UnmaskSpec;
  const asked = unmaskAsk(unmask, unmaskAsk(unmask, newUnmask(), 'a'), 'b');
  const fixTyped = (text: string) =>
    tokensOf(text).reduce(
      (state, token) => unmaskType(state, token),
      unmaskAccuse(unmask, asked, 'ljevaonica'),
    );

  it('has two wrong in different ways: one each time, one only once', () => {
    const wrongOn = (suspect: string) =>
      unmask.cards.filter((card) => {
        const parsed = parseStatement(tokensOf(card.answers[suspect] ?? ''));
        return parsed.ok && !isTrue(parsed.statement);
      }).length;
    expect(wrongOn('ljevaonica')).toBe(3);
    expect(wrongOn('druga')).toBe(1);
    expect(wrongOn('prva')).toBe(0);
  });

  it('can’t point after only one card', () => {
    const one = unmaskAsk(unmask, newUnmask(), 'c');
    const soon = unmaskAccuse(unmask, one, 'ljevaonica');
    expect(soon.tooSoon).toBe(true);
    expect(soon.phase).toBe('ask');
  });

  it('an honest book’s keeper is offended, and shows why', () => {
    const wrong = unmaskAccuse(unmask, asked, 'prva');
    expect(wrong.phase).toBe('ask');
    expect(wrong.shown).toContain(act2Text.l07.scene.offended.prva);
    expect(wrong.shown).toContain(act2Text.l07.scene.why.prva);
  });

  it('the book that slipped once isn’t the one: he sees that, and goes on', () => {
    const wrong = unmaskAccuse(unmask, asked, 'druga');
    expect(wrong.shown).toContain(act2Text.l07.scene.why.druga);
    const on = unmaskAccuse(unmask, unmaskDismiss(wrong), 'ljevaonica');
    expect(on.phase).toBe('write');
    const done = unmaskEnter(
      unmask,
      tokensOf('423 − 91 = 332').reduce((state, token) => unmaskType(state, token), on),
    );
    expect(done.opened).toBe(true);
    expect(unmaskEarns(done)).toBe(false);
  });

  it('pointing isn’t the end: he writes the false line right', () => {
    expect(fixTyped('').opened).toBe(false);
    expect(unmaskEnter(unmask, fixTyped('406')).bounced).toBe(true);
    expect(unmaskEnter(unmask, fixTyped('423 − 17 = 406')).bounced).toBe(true);
    const short = unmaskEnter(unmask, fixTyped('332'));
    expect(short.opened).toBe(true);
    expect(unmaskEarns(short)).toBe(true);
    expect(unmaskEnter(unmask, fixTyped('423 − 91 = 332')).opened).toBe(true);
  });

  it('asks the big card too, to be judged and not calculated', () => {
    const big = unmask.cards.find((card) => card.id === 'c');
    expect(big?.answers.prva).toContain('700 000 000');
    expect(big?.answers.ljevaonica).toContain('− 10');
  });
});

describe('the facade', () => {
  const windows = l08.scenes[0] as WindowsSpec;

  it('has its rounds end at the last window of a row, one of them in a larger building', () => {
    for (const round of windows.rounds) {
      expect(round.target % round.columns).toBe(0);
      const row = round.target / round.columns - 1;
      expect(windowNumber(round, false, row, round.columns - 1)).toBe(round.target);
    }
    const sizes = windows.rounds.map((round) => round.rows * round.columns);
    expect(Math.max(...sizes)).toBe(72);
    expect(sizes[0]).toBe(42);
    expect(windows.rounds[0]?.target).toBe(42);
  });

  it('a wrong window shows its number and a sleepy resident, and costs the first-try parts', () => {
    const wrong = windowsThrow(windows, newWindows(), 7);
    expect(wrong.shown).toBe(7);
    expect(wrong.notice).toBe(act2Text.l08.scene.sleepy[0]);
    const back = windowsDismiss(windows, wrong);
    expect(back.round).toBe(0);
    const again = windowsThrow(windows, back, 41);
    expect(again.notice).toBe(act2Text.l08.scene.sleepy[1]);
    const on = windowsDismiss(windows, windowsThrow(windows, windowsDismiss(windows, again), 42));
    expect(on.round).toBe(1);
    expect(oneOffEarns({ ...on, opened: true })).toBe(false);
  });

  it('gets to the end through its rounds', () => {
    let state = newWindows();
    for (const target of [42, 24, 54]) {
      state = windowsThrow(windows, state, target);
      expect(state.notice).toBe(act2Text.l08.scene.reached);
      state = windowsDismiss(windows, state);
    }
    expect(state.opened).toBe(true);
    expect(oneOffEarns(state)).toBe(true);
  });

  it('shows a wing of 0 windows, and the little one’s zero is the wrong line', () => {
    expect(
      l08.lesson.steps.some((step) => step.object.kind === 'grid' && step.object.columns === 0),
    ).toBe(true);
    expect(l08.mistake?.lines[l08.mistake.wrong]).toBe('8 · 0 = 8');
  });

  it('goes as far as 40 · 100 in a try', () => {
    const tasks = l08.tries.flatMap((task) => (task.kind === 'line' ? task.accepts : []));
    expect(tasks).toContain('40 · 100 = 4 000');
  });
});

describe('Knot 2', () => {
  const guard = guardOf(k2);
  const knock = knockOf(k2, 1);
  const crossed = knockCross(knock, newKnock(knock));
  const limits = write(knock, write(knock, crossed, 'news', '325 ≤ x ≤ 334'), 'chalk', 'x ≠ 330');

  it('is a knot with no gear', () => {
    expect(k2.gives).toBeUndefined();
    expect(k2.mistake).toBeNull();
    expect(k2.scenes.map((scene) => scene.kind)).toEqual(['guard', 'knock']);
  });

  it('breaks the rule with a number ending in 5, and only that', () => {
    expect(guard.id).toBe('rule-2');
    const breaking = guard.tiles.filter((tile) => tile.breaks).map((tile) => tile.face);
    expect(breaking).toEqual(['25']);
    const wrong = guardPick(guard, newGuard(), 't52');
    expect(wrong.said).toBe(act2Text.k2.guard.thanks.tens);
    const on = guardPick(guard, guardDismiss(wrong), 't25');
    const type = (text: string) => tokensOf(text).reduce((s, t) => guardType(s, t), on);
    expect(guardEnter(guard, type('20')).bounced).toBe(true);
    expect(guardEnter(guard, type('30')).opened).toBe(true);
  });

  it('needs no note: the true clues leave the door by themselves', () => {
    const state = write(knock, limits, 'books', '332');
    expect(lit(knock, state)).toEqual([332]);
    expect(knockDoor(knock, state, 332).opened).toBe(true);
  });

  it('the note names another door than the true clues do', () => {
    const state = write(knock, limits, 'note', '334');
    expect(lit(knock, state)).toEqual([334]);
    const both = write(knock, state, 'books', '332');
    expect(both.lines[both.lines.length - 1]?.struck).toBe(true);
    expect(lit(knock, both)).toEqual([334]);
  });

  it('copying the note leads to its door, and a polite notice', () => {
    const copied = write(knock, limits, 'books', '334');
    expect(lit(knock, copied)).toEqual([334]);
    const trap = knockDoor(knock, copied, 334);
    expect(trap.shown?.say).toBe(act2Text.k2.knock.notice);
    expect(trap.shown?.say).toContain('OVO JE ISPRAVLJENO. HVALA.');
    expect(trap.opened).toBe(false);
    expect(trap.mode).toBe('working');
    expect(knockEarns(trap)).toBe(false);

    // The note's own sum can't go in again: from now on each line has to be true.
    const on = knockDismiss(trap);
    expect(write(knock, on, 'note', '334').bounced).toBe(true);
    const right = write(knock, on, 'books', '332');
    expect(lit(knock, right)).toEqual([332]);
    expect(knockDoor(knock, right, 332).opened).toBe(true);
  });

  it('writing the note’s line and knocking there counts as following it', () => {
    const facts2 = { taught: [], told: allGuidesTold };
    const inKnock = leadStep(k2, newLeadPlay(k2, facts2), { kind: 'tile', tile: 't25' }, facts2);
    let play = inKnock.play;
    const act = (action: LeadAction) => {
      const result = leadStep(k2, play, action, facts2);
      play = result.play;
      return result.outcome;
    };
    for (const token of ['3', '0'] as const) act({ kind: 'type', token });
    act({ kind: 'enter' });
    act({ kind: 'next' });
    act({ kind: 'cross' });
    const say = (clue: string, text: string) => {
      act({ kind: 'pick-clue', clue });
      for (const token of tokensOf(text)) act({ kind: 'type', token });
      act({ kind: 'enter' });
    };
    say('news', '325 ≤ x ≤ 334');
    say('chalk', 'x ≠ 330');
    say('note', '334');
    say('books', '334');
    expect(act({ kind: 'door', door: 334 }).forged).toBe('followed');
    act({ kind: 'dismiss' });
    say('books', '332');
    expect(act({ kind: 'door', door: 332 }).forged).toBe('struck');
  });

  it('striking the note’s line lets the true sum in', () => {
    const state = write(knock, limits, 'note', '334');
    const struck = knockStrike(knock, state, 2);
    expect(lit(knock, struck)).toEqual([326, 328, 332, 334]);
    const right = write(knock, struck, 'books', '332');
    expect(lit(knock, right)).toEqual([332]);
    expect(knockDoor(knock, right, 332).opened).toBe(true);
  });
});
