import { describe, expect, it } from 'vitest';
import { act3Leads } from '@/content/leads/act3';
import { huntText } from '@/content/text/hunt';
import { act3Text } from '@/content/text/hunt-act3';
import {
  canonicalLine,
  doorsOf,
  type KnockSpec,
  type KnockState,
  knockCross,
  knockDismiss,
  knockDoor,
  knockEarns,
  knockEnter,
  knockPickClue,
  knockType,
  lineStart,
  litDoors,
  newKnock,
} from '@/hunt/knock';
import { type LeadAction, type LeadPlay, leadStep, newLeadPlay } from '@/hunt/lead';
import type { ObjectGoal, ObjectMove, ObjectState } from '@/hunt/objects';
import {
  type CartsSpec,
  type CartsState,
  cartsDismiss,
  cartsEnter,
  cartsGo,
  cartsLoad,
  newCarts,
  oneOffEarns,
  oneOffType,
  proveCarts,
  sumResult,
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
  proveUnmask,
  type UnmaskSpec,
  type UnmaskState,
  unmaskAccuse,
  unmaskAsk,
  unmaskDismiss,
  unmaskEarns,
  unmaskEnter,
  unmaskType,
} from '@/hunt/unmask';
import { parseStatement } from '@/math/statement';
import { isSDigit, readLine, readTokens, type SToken } from '@/math/statement-tokens';
import { isTrue } from '@/math/truth';

const { l09, l10, l11, k3 } = act3Leads;
const leads = [
  ['l09', l09],
  ['l10', l10],
  ['l11', l11],
  ['k3', k3],
] as const;

const yard = l09.scenes[0] as KnockSpec;
const bigLot = l09.scenes[1] as KnockSpec;
const carts = l10.scenes[0] as CartsSpec;
const coat = l11.scenes[0] as UnmaskSpec;
const address = l11.scenes[1] as KnockSpec;
const guard = k3.scenes[0] as GuardSpec;
const walls = k3.scenes[1] as KnockSpec;

const tokens = (line: string): SToken[] => {
  const read = readTokens(line);
  if (!read) throw new Error(`"${line}" doesn't read`);
  return read;
};

/** What he has to type for a line, given what's already written on it. */
function typedFor(start: string, line: string): SToken[] {
  const from = readLine(start) ?? [];
  const whole = tokens(line);
  const at = from.indexOf('☐');
  if (at < 0) return whole.slice(from.length);
  return whole.slice(at, whole.length - (from.length - at - 1));
}

const typeKnock = (state: KnockState, line: string) =>
  tokens(line).reduce((s, token) => knockType(s, token, 40), state);
const write = (spec: KnockSpec, state: KnockState, line: string) =>
  knockEnter(spec, typeKnock(state, line));
const lit = (spec: KnockSpec, state: KnockState) => litDoors(spec.row, state.side, state.lines);

/** A sum the way the First Automaton reads it: left to right, whatever the signs. */
function leftToRight(sum: string): number {
  const parts = sum.split(' ');
  let value = Number(parts[0]);
  for (let i = 1; i < parts.length; i += 2) {
    const next = Number(parts[i + 1]);
    const sign = parts[i];
    if (sign === '+') value += next;
    else if (sign === '−') value -= next;
    else if (sign === '·') value *= next;
    else value /= next;
  }
  return value;
}

const isFalse = (line: string) => {
  const parsed = parseStatement(tokens(line));
  if (!parsed.ok) throw new Error(`"${line}" doesn't read`);
  return !isTrue(parsed.statement);
};

/** The moves from an object to its goal: none, if it's an object that can't reach one. */
function movesTo(object: ObjectState, goal: ObjectGoal): ObjectMove[] {
  const steps = (from: number, to: number) =>
    Array.from({ length: Math.abs(to - from) }, (): -1 | 1 => (to > from ? 1 : -1));
  if (object.kind === 'grid' && goal.kind === 'grid-size') {
    const turned = object.rows === goal.columns && object.columns === goal.rows;
    if (turned && object.rows !== goal.rows) return [{ kind: 'grid-turn' }];
    return [
      ...steps(object.rows, goal.rows).map((by): ObjectMove => ({ kind: 'grid-rows', by })),
      ...steps(object.columns, goal.columns).map(
        (by): ObjectMove => ({ kind: 'grid-columns', by }),
      ),
    ];
  }
  if (object.kind === 'packing' && goal.kind === 'packing-per') {
    return steps(object.per, goal.per).map((by): ObjectMove => ({ kind: 'packing-per', by }));
  }
  throw new Error(`no move takes ${object.kind} to ${goal.kind}`);
}

/** Plays a lead from its start to its end, by the real path, with every right move. */
function playThrough(spec: LeadSpec) {
  const facts = { taught: [], told: allGuidesTold };
  let play: LeadPlay = newLeadPlay(spec, facts);
  const out: { lines: readonly string[] | null } = { lines: null };
  const go = (action: LeadAction) => {
    const result = leadStep(spec, play, action, facts);
    play = result.play;
    if (result.outcome.finished) out.lines = result.outcome.finished.lines;
  };
  const next = () => go({ kind: 'next' });
  const typeLine = (typed: readonly SToken[]) => {
    for (const token of typed) go({ kind: 'type', token });
    go({ kind: 'enter' });
  };
  const line = (task: { start: string; accepts: readonly string[] }) =>
    typeLine(typedFor(task.start, task.accepts[0] as string));

  const playKnock = (scene: KnockSpec) => {
    const side = scene.clues.find((clue) => clue.kind === 'side');
    if (side?.kind === 'side' && scene.startSide !== side.side) go({ kind: 'cross' });
    for (const clue of scene.clues) {
      if (clue.kind === 'side') continue;
      go({ kind: 'pick-clue', clue: clue.id });
      const start = lineStart(scene, play.knock as KnockState);
      typeLine((canonicalLine(clue) ?? []).slice(start.length));
    }
    go({ kind: 'door', door: scene.door });
    expect(play.knock?.opened).toBe(true);
  };
  const playCarts = (scene: CartsSpec) => {
    for (const round of scene.rounds) {
      if (round.kind === 'share') {
        for (let tap = 0; tap < round.crates / round.bundle; tap++) {
          go({ kind: 'cart', cart: tap % round.carts });
        }
      }
      if (round.kind === 'loads') {
        for (let tap = 0; tap < round.crates / round.bundle; tap++) {
          go({ kind: 'cart', cart: (play.carts as CartsState).loads.length - 1 });
        }
      }
      go({ kind: 'go' });
      if (round.kind === 'no-carts') go({ kind: 'dismiss' });
      else line(round.line);
    }
    expect(play.carts?.opened).toBe(true);
  };
  const playScene = (scene: SceneSpec) => {
    if (scene.kind === 'knock') playKnock(scene);
    else if (scene.kind === 'carts') playCarts(scene);
    else if (scene.kind === 'unmask') {
      for (const card of scene.cards.slice(0, scene.required)) go({ kind: 'ask', card: card.id });
      go({ kind: 'accuse', suspect: scene.guilty });
      line(scene.fix);
      expect(play.unmask?.opened).toBe(true);
    } else if (scene.kind === 'guard') {
      go({ kind: 'tile', tile: (scene.tiles.find((tile) => tile.breaks) as { id: string }).id });
      line(scene.write);
      expect(play.guard?.opened).toBe(true);
    } else throw new Error(`no script for ${scene.kind}`);
    next();
  };

  for (const _step of spec.lesson.steps) next();
  for (const task of spec.tries) {
    expect(play.step).toBe('try');
    if (task.kind === 'object') {
      for (const move of movesTo(task.object, task.goal)) go({ kind: 'move', move });
    } else line(task);
    expect(play.solved).toBe(true);
    next();
  }
  if (spec.mistake) {
    expect(play.step).toBe('fix');
    go({ kind: 'fix-tap', line: spec.mistake.wrong });
    for (const move of movesTo(spec.mistake.show.object, spec.mistake.show.goal)) {
      go({ kind: 'move', move });
    }
    line(spec.mistake.write);
    expect(play.fix).toBe('thanks');
    next();
  }
  for (const scene of spec.scenes) {
    expect(play.step).toBe('play');
    playScene(scene);
  }
  for (const task of spec.writeUp) {
    expect(play.step).toBe('write');
    line(task);
  }
  expect(play.step).toBe('thread');
  next();
  next();
  return out.lines;
}

/** Every string a text object holds. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('act 3 can be played', () => {
  it.each([
    ['l09', l09],
    ['l10', l10],
    ['k3', k3],
  ] as const)('%s proves out', (_id, lead) => {
    expect(proveLead(lead)).toEqual([]);
  });

  // solve.ts counts the numbers on both sides of a street against the GDD's 70 doors, and 45 and
  // 125 are 81 numbers apart, so this row can't pass until it counts the doors on his side. The
  // filter stays harmless when it does. Everything else has to prove out.
  it('l11 proves out, but for the length of a row that must hold both 45 and 125', () => {
    expect(proveLead(l11)).toEqual([]);
    expect(doorsOf(address.row, 'odd').length).toBeLessThanOrEqual(70);
  });

  it.each(leads)('%s goes from its first step to its last by the real path', (_id, lead) => {
    expect(playThrough(lead)).not.toBeNull();
  });

  it.each(leads)('%s has every line typeable on the pad it shows', (_id, lead) => {
    const check = (task: {
      start: string;
      accepts: readonly string[];
      keys: readonly SToken[];
    }) => {
      for (const line of task.accepts) {
        for (const token of typedFor(task.start, line)) {
          expect(isSDigit(token) || task.keys.includes(token), `${line}: ${token}`).toBe(true);
        }
      }
    };
    for (const task of lead.tries) if (task.kind === 'line') check(task);
    if (lead.mistake) check(lead.mistake.write);
    for (const task of lead.writeUp) check(task);
    for (const scene of lead.scenes) {
      if (scene.kind === 'unmask') check(scene.fix);
      if (scene.kind === 'guard') check(scene.write);
      if (scene.kind === 'carts') {
        for (const round of scene.rounds) if (round.kind !== 'no-carts') check(round.line);
      }
      if (scene.kind === 'knock') {
        for (const clue of scene.clues) {
          if (clue.kind === 'limit') {
            check({ start: '', accepts: [clue.canonical], keys: scene.keys });
          }
        }
      }
    }
  });

  it('keeps to the lead limits: 5 steps, 2 short lines, 2 or 3 tries, blanks before whole lines', () => {
    for (const lead of [l09, l10, l11]) {
      expect(lead.lesson.steps.length).toBeLessThanOrEqual(5);
      for (const step of lead.lesson.steps) {
        expect(step.say.length).toBeLessThanOrEqual(2);
        for (const line of step.say) expect(line.length, line).toBeLessThanOrEqual(62);
      }
      expect(lead.tries.length).toBeGreaterThanOrEqual(2);
      expect(lead.tries.length).toBeLessThanOrEqual(3);
      expect(lead.tries[0]?.kind).toBe('object');
      expect(lead.mistake?.id.startsWith(`${lead.id}-`)).toBe(true);
      expect(lead.writeUp[0]?.start).toContain('☐');
      expect(lead.writeUp[lead.writeUp.length - 1]?.start).toBe('');
      expect(lead.find.card.length).toBeGreaterThan(0);
    }
    expect(l09.lesson.steps.some((step) => step.object.kind === 'grid')).toBe(true);
    expect(l10.lesson.steps.some((step) => step.object.kind === 'packing')).toBe(true);
    expect(l11.lesson.steps.some((step) => step.object.kind === 'bundles')).toBe(true);
  });

  it('marks the story moments', () => {
    expect(l09.beats).toEqual(['warned']);
    expect(l11.beats).toEqual(['coat']);
    expect(k3.beats).toEqual(['real-vucetic']);
    expect(l09.lesson.found).toContain('Kartu');
  });
});

describe('act 3 words', () => {
  const all = strings(act3Text);

  it('never addresses him with a gendered past tense', () => {
    const pastWithSi = /(?<!\p{L})si\s+\p{L}+(?:o|la)(?!\p{L})|\p{L}+(?:o|la)\s+si(?!\p{L})/u;
    for (const line of all) expect(line).not.toMatch(pastWithSi);
  });

  it('keeps out the words the curriculum avoids', () => {
    for (const line of all) expect(line).not.toMatch(/baza|eksponent|ishodi.te|jedini.na to.ka/i);
  });

  it('keeps the coat out of the text before it', () => {
    for (const line of strings(act3Text.l09)) expect(line).not.toMatch(/Vu.eti|kaput|zup.anik/i);
    for (const line of strings(act3Text.l10)) expect(line).not.toMatch(/Vu.eti|kaput|zup.anik/i);
  });
});

describe('the crate yard', () => {
  it('the moment before: on the wrong side his line leaves no door, and is struck', () => {
    const state = write(yard, newKnock(yard), '7000');
    expect(state.lines[0]?.struck).toBe(true);
    expect(lit(yard, state)).not.toContain(7000);
  });

  it('a lot it gets wrong brings a neighbour, and then every line has to be true', () => {
    let state = knockCross(yard, newKnock(yard));
    state = write(yard, state, '7010');
    state = write(yard, state, '7010');
    expect(lit(yard, state)).toEqual([7010]);
    state = knockDoor(yard, state, 7010);
    expect(state.shown?.say).toBe(yard.grumpy[0]);
    expect(state.mode).toBe('working');
    state = knockDismiss(state);
    expect(write(yard, state, '7010').bounced).toBe(true);
    state = write(yard, state, '1000 · 7 = 7000');
    state = write(yard, state, '7000');
    expect(lit(yard, state)).toEqual([7000]);
    state = knockDoor(yard, state, 7000);
    expect(state.opened).toBe(true);
    expect(knockEarns(state)).toBe(false);
  });

  it('the same factors in another order come to the same lot, and earn the parts', () => {
    let state = knockCross(yard, newKnock(yard));
    state = write(yard, state, '1000 · 7 = 7000');
    state = write(yard, state, '7000');
    state = knockDoor(yard, state, 7000);
    expect(state.opened).toBe(true);
    expect(knockEarns(state)).toBe(true);
  });

  it('the big lot has 6 digits, and both ways of counting reach it', () => {
    expect(bigLot.door).toBe(730_000);
    let state = write(bigLot, knockCross(bigLot, newKnock(bigLot)), '730000');
    state = write(bigLot, state, '730000');
    expect(knockDoor(bigLot, state, 730_000).opened).toBe(true);
  });

  it('the little one thinks whoever stands first counts more: the turned grid shows otherwise', () => {
    const { mistake } = l09;
    expect(mistake?.lines[1]).toBe('4 · 3 − 3 · 4 = 1');
    expect(mistake?.show.object).toEqual({ kind: 'grid', rows: 4, columns: 3 });
    expect(movesTo(mistake?.show.object as ObjectState, mistake?.show.goal as ObjectGoal)).toEqual([
      { kind: 'grid-turn' },
    ]);
  });
});

describe('the sixth cart', () => {
  const typeCarts = (state: CartsState, line: string) =>
    tokens(line).reduce((s, token) => oneOffType(s, token), state);
  const share = (state: CartsState, taps: number, cartCount: number) => {
    let now = state;
    for (let tap = 0; tap < taps; tap++) now = cartsLoad(carts, now, tap % cartCount);
    return now;
  };

  it('proves out, with every bundle dividing evenly', () => {
    expect(proveCarts(carts)).toEqual([]);
  });

  it('the moment before: crates left on the ground, and uneven carts tip', () => {
    const left = cartsGo(carts, cartsLoad(carts, newCarts(carts), 0));
    expect(left.notice).toBe(carts.left);
    expect(left.phase).toBe('load');
    let uneven = newCarts(carts);
    for (const cart of [0, 0, 0, 1, 2, 3, 4, 5, 1, 2, 3, 4])
      uneven = cartsLoad(carts, uneven, cart);
    const tipped = cartsGo(carts, uneven);
    expect(tipped.notice).toBe(carts.tipped);
    expect(oneOffEarns({ ...tipped, opened: true })).toBe(false);
  });

  it('has 20 on each of 6 carts, then 6 carts of 20, and a false line bounces', () => {
    let state = cartsGo(carts, share(newCarts(carts), 12, 6));
    expect(state.loads).toEqual([20, 20, 20, 20, 20, 20]);
    expect(state.phase).toBe('write');
    expect(cartsEnter(carts, typeCarts(state, '6')).bounced).toBe(true);
    state = cartsEnter(carts, typeCarts(state, '20'));
    expect(state.round).toBe(1);
    for (let tap = 0; tap < 12; tap++) state = cartsLoad(carts, state, state.loads.length - 1);
    expect(state.loads).toEqual([20, 20, 20, 20, 20, 20]);
    state = cartsEnter(carts, typeCarts(cartsGo(carts, state), '6'));
    expect(state.round).toBe(2);
  });

  it('among 0 carts the crates stay on the ground for good, and says why', () => {
    const at = carts.rounds.findIndex((round) => round.kind === 'no-carts');
    const state: CartsState = { ...newCarts(carts), round: at, loads: [] };
    const stuck = cartsGo(carts, state);
    expect(stuck.notice).toContain('S nulom se ne dijeli');
    const next = cartsDismiss(carts, stuck);
    expect(next.round).toBe(at + 1);
    const none = cartsGo(carts, next);
    expect(none.phase).toBe('write');
    expect(none.loads).toEqual([0, 0, 0]);
    const done = cartsEnter(carts, typeCarts(none, '0'));
    expect(done.opened).toBe(true);
  });

  it('writes "3 puta manje" and "za 3 manje" apart, and notes both ways of writing division', () => {
    expect(l10.writeUp[0]?.accepts).toEqual(['60 : 3 = 20']);
    expect(l10.writeUp[1]?.accepts).toEqual(['60 − 3 = 57']);
    expect(l10.writeUp[2]?.accepts).toEqual(['120 : 20 = 6']);
    expect(act3Text.l10.scene.share.say).toContain('120 / 6');
    expect(l10.mistake?.lines[l10.mistake.wrong]).toBe('15 : 3 = 12');
  });
});

describe('the coat: who is it', () => {
  const asked = (cards: readonly string[]): UnmaskState =>
    cards.reduce((state, card) => unmaskAsk(coat, state, card), newUnmask());
  const typeFix = (state: UnmaskState, line: string) =>
    tokens(line).reduce((s, token) => unmaskType(s, token), state);

  it('has five people, with the automaton as the guilty one, and Penkala isn’t one of them', () => {
    expect(coat.suspects).toHaveLength(5);
    expect(coat.guilty).toBe('vucetic');
    expect(coat.suspects.map((suspect) => suspect.id)).not.toContain('penkala');
    expect(coat.intro).toContain('Penkala');
    expect(coat.cards[0]?.answers.vucetic).toBe('2 + 2 : 2 = 4 : 2 = 2');
  });

  it('proves out whichever two cards he asks', () => {
    expect(proveUnmask(coat)).toEqual([]);
  });

  it('the automaton goes left to right on every card, and everyone else slips once at most', () => {
    for (const card of coat.cards) {
      const sides = (card.answers.vucetic as string).split(' = ');
      expect(Number(sides[sides.length - 1])).toBe(leftToRight(sides[0] as string));
    }
    for (const suspect of coat.suspects) {
      if (suspect.id === coat.guilty) continue;
      const wrong = coat.cards.filter((card) => isFalse(card.answers[suspect.id] as string));
      expect(wrong.length, suspect.id).toBeLessThanOrEqual(1);
    }
  });

  it('can’t point before two cards', () => {
    const soon = unmaskAccuse(coat, asked(['a']), 'vucetic');
    expect(soon.phase).toBe('ask');
    expect(soon.tooSoon).toBe(true);
  });

  it('someone who slipped once is offended, says why, and it costs only the parts', () => {
    const wrong = unmaskAccuse(coat, asked(['b', 'c']), 'nikola');
    expect(wrong.phase).toBe('ask');
    expect(wrong.shown).toContain(act3Text.l11.unmask.offended.nikola);
    expect(wrong.shown).toContain(act3Text.l11.unmask.why.nikola);
    const writing = unmaskAccuse(coat, unmaskDismiss(wrong), 'vucetic');
    expect(writing.phase).toBe('write');
    const done = unmaskEnter(coat, typeFix(writing, '3'));
    expect(done.opened).toBe(true);
    expect(unmaskEarns(done)).toBe(false);
  });

  it('the reveal has its gears, its word, and the little one’s only word, with no answer', () => {
    expect(coat.reveal).toContain('Zapisano.');
    expect(coat.reveal).toContain(huntText.littleOne.why);
    const writing = unmaskAccuse(coat, asked(['a', 'd']), 'vucetic');
    expect(writing.phase).toBe('write');
    expect(writing.opened).toBe(false);
    expect(unmaskEnter(coat, typeFix(writing, '2')).bounced).toBe(true);
    const done = unmaskEnter(coat, typeFix(writing, '3'));
    expect(done.opened).toBe(true);
    expect(unmaskEarns(done)).toBe(true);
  });

  it('the little one’s mistake goes wrong on what left to right breaks, and not on what it doesn’t', () => {
    const [right, wrong] = l11.mistake?.lines ?? [];
    expect(right).toBe('2 · 3 + 4 = 10');
    expect(wrong).toBe('2 + 3 · 4 = 20');
    expect(leftToRight('2 · 3 + 4')).toBe(10);
    expect(leftToRight('2 + 3 · 4')).toBe(20);
    expect(l11.mistake?.write.accepts).toContain('2 + 3 · 4 = 14');
  });
});

describe('the coat: the address', () => {
  it('is 45, and left to right is 125, both on the street’s odd side', () => {
    expect(sumResult('100 − 20 · 3 + 10 : 2')).toBe('45');
    expect(leftToRight('100 − 20 · 3 + 10 : 2')).toBe(125);
    const odd = doorsOf(address.row, 'odd');
    expect(odd).toContain(45);
    expect(odd).toContain(125);
    expect(address.startSide).toBe('odd');
    expect(address.door).toBe(45);
    expect(address.clues.find((clue) => clue.id === 'tape')).toMatchObject({
      start: '100 − 20 · 3 + 10 : 2 =',
    });
  });

  it('the moment before: no knock with a clue unused, and it points at that clue', () => {
    const state = write(address, newKnock(address), '125');
    expect(lit(address, state)).toEqual([125]);
    const early = knockDoor(address, state, 125);
    expect(early.shown).toBeNull();
    expect(early.pointAt).toBe('past');
  });

  it('left to right is a wrong door: automatons searching there, and his line struck', () => {
    let state = write(address, newKnock(address), '125');
    state = write(address, state, 'x > 40');
    expect(lit(address, state)).toEqual([125]);
    state = knockDoor(address, state, 125);
    expect(state.opened).toBe(false);
    expect(state.shown).toEqual({ door: 125, say: act3Text.l11.knock.wrong125 });
    expect(state.mode).toBe('working');
    expect(state.lines[0]?.struck).toBe(true);
    expect(state.lines[1]?.struck).toBe(false);
    expect(lit(address, state)).toContain(45);
  });

  it('after 125 he can’t just change the answer: only true lines go in, and then 45 opens', () => {
    let state = write(address, newKnock(address), '125');
    state = write(address, state, 'x > 40');
    state = knockDismiss(knockDoor(address, state, 125));
    expect(write(address, state, '125').bounced).toBe(true);
    expect(write(address, state, '47').bounced).toBe(true);
    state = write(address, state, '100 − 60 + 5');
    expect(lineStart(address, state)).toEqual(['=']);
    state = write(address, state, '45');
    expect(lit(address, state)).toEqual([45]);
    state = knockDoor(address, state, 45);
    expect(state.opened).toBe(true);
    expect(knockEarns(state)).toBe(false);
  });

  it('house 45 opens first time, and earns the parts', () => {
    let state = write(address, newKnock(address), '45');
    state = write(address, state, 'x > 40');
    expect(lit(address, state)).toEqual([45]);
    state = knockDoor(address, state, 45);
    expect(state.opened).toBe(true);
    expect(knockEarns(state)).toBe(true);
  });

  it('a number he merely got wrong brings a grumpy neighbour', () => {
    let state = write(address, newKnock(address), '55');
    state = write(address, state, 'x > 40');
    state = knockDoor(address, state, 55);
    expect(state.shown?.say).toBe(address.grumpy[0]);
  });

  it('a number the clue rules out leaves no door, and is struck', () => {
    let state = knockPickClue(address, newKnock(address), 'past');
    state = write(address, state, 'x > 40');
    state = write(address, state, '25');
    expect(state.lines[0]?.struck).toBe(false);
    expect(state.lines[1]?.struck).toBe(true);
    expect(state.opened).toBe(false);
  });

  it('writes the school form', () => {
    expect(l11.writeUp[1]?.accepts).toContain('100 − 60 + 5 = 45');
  });
});

describe('Knot 3', () => {
  const typeGuard = (state: ReturnType<typeof newGuard>, line: string) =>
    tokens(line).reduce((s, token) => guardType(s, token), state);

  it('has no showing, try or mistake, so it starts at the guard', () => {
    expect(k3.lesson.steps).toEqual([]);
    expect(k3.tries).toEqual([]);
    expect(k3.mistake).toBeNull();
    expect(newLeadPlay(k3, { taught: [], told: allGuidesTold }).step).toBe('play');
    expect(guard.id).toBe('rule-3');
  });

  it('only the tile that breaks the rule gives left to right a wrong result', () => {
    expect(guard.tiles).toHaveLength(6);
    for (const tile of guard.tiles) {
      const broken = String(leftToRight(tile.face)) !== sumResult(tile.face);
      expect(broken, tile.face).toBe(tile.breaks);
    }
  });

  it('a wrong tile makes it thank him, at the cost of the parts', () => {
    const wrong = guardPick(guard, newGuard(), 'adds');
    expect(wrong.said).toBe(act3Text.k3.guard.thanks.adds);
    expect(wrong.phase).toBe('pick');
    const on = guardPick(guard, guardDismiss(wrong), 'breaks');
    expect(on.phase).toBe('write');
    const done = guardEnter(guard, typeGuard(on, '4'));
    expect(done.opened).toBe(true);
    expect(guardEarns(done)).toBe(false);
  });

  it('the moment before: the tile alone doesn’t jam it, and left to right’s line bounces', () => {
    const on = guardPick(guard, newGuard(), 'breaks');
    expect(on.opened).toBe(false);
    expect(guardEnter(guard, typeGuard(on, '24')).bounced).toBe(true);
    const done = guardEnter(guard, typeGuard(on, '4'));
    expect(done.opened).toBe(true);
    expect(guardEarns(done)).toBe(true);
  });

  it('the story comes to door 65, and left to right to door 35, which lies on the way', () => {
    expect(sumResult('45 + 60 : 3')).toBe('65');
    expect(leftToRight('45 + 60 : 3')).toBe(35);
    let state = knockCross(walls, newKnock(walls));
    state = write(walls, state, 'x < 70');
    state = write(walls, state, '35');
    expect(lit(walls, state)).toEqual([35]);
    state = knockDoor(walls, state, 35);
    expect(state.shown).toEqual({ door: 35, say: act3Text.k3.knock.wrong35 });
    state = knockDismiss(state);
    expect(write(walls, state, '35').bounced).toBe(true);
    state = write(walls, state, '45 + 20');
    state = write(walls, state, '65');
    expect(lit(walls, state)).toEqual([65]);
    expect(knockDoor(walls, state, 65).opened).toBe(true);
  });

  it('starts across the road, so that the walls send him over', () => {
    const fresh = newKnock(walls);
    expect(lit(walls, fresh)).not.toContain(65);
    const written = write(walls, fresh, 'x < 70');
    expect(knockDoor(walls, written, 65).opened).toBe(false);
  });

  it('keeps the comedy: it eats a kifla, by date', () => {
    expect(act3Text.k3.knock.opened).toContain('zagrize kiflu');
    expect(act3Text.k3.knock.intro).toContain('Dan 1.');
    expect(act3Text.k3.knock.story).toContain('dan 40.');
  });
});
