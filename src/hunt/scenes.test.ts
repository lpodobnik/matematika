import { describe, expect, it } from 'vitest';
import { l03 } from '@/content/leads/l03-archive';
import { l04 } from '@/content/leads/l04-tram-line';
import { l06 } from '@/content/leads/l06-newspaper';
import {
  type AloneSpec,
  aloneDismiss,
  aloneEarns,
  aloneFrom,
  alonePick,
  newAlone,
  proveAlone,
} from '@/hunt/alone';
import {
  newSneak,
  nextSafeMove,
  patrolAt,
  proveSneak,
  routeTo,
  type SneakBoard,
  type SneakSpec,
  type SneakState,
  sneakDismiss,
  sneakEarns,
  sneakEnter,
  sneakFrom,
  sneakHint,
  sneakStep,
  sneakType,
  standing,
} from '@/hunt/sneak';
import {
  newUnmask,
  proveUnmask,
  type UnmaskSpec,
  unmaskAccuse,
  unmaskAsk,
  unmaskDismiss,
  unmaskEarns,
  unmaskEnter,
  unmaskFrom,
  unmaskType,
} from '@/hunt/unmask';
import type { SToken } from '@/math/statement-tokens';

const board: SneakBoard = {
  stops: 7,
  start: 0,
  exit: null,
  patrols: [{ route: [3, 3, -1, -1] }],
  line: {
    first: 0,
    step: 5,
    labelled: [0, 2, 4],
    asks: [
      { at: 5, label: 'A' },
      { at: 1, label: 'A' },
    ],
  },
};

const plain: SneakBoard = {
  stops: 5,
  start: 0,
  exit: 4,
  patrols: [{ route: [2, 3, -1] }],
  line: null,
};

const sneak: SneakSpec = {
  kind: 'sneak',
  intro: '',
  boards: [board, plain],
  caught: ['caught one', 'caught two'],
  empty: 'empty',
  found: 'found',
  opened: 'opened',
  example: [],
  hint: { step: '', move: '' },
};

const typed = (state: SneakState, keys: string) =>
  keys.split('').reduce((s, key) => sneakType(sneak, s, key as SToken), state);

/** He walks to wherever he's heading, by the safe route. */
function walk(state: SneakState): SneakState {
  let now = state;
  for (let i = 0; i < 40 && !now.notice; i++) {
    const on = sneak.boards[now.board] as SneakBoard;
    const move = nextSafeMove(on, now);
    if (move === null) return now;
    now = sneakStep(sneak, now, move);
  }
  return now;
}

describe('Sneak', () => {
  it('nothing moves until he moves, and then the patrol takes its step', () => {
    const start = newSneak();
    expect(standing(board, start)).toBe(0);
    expect(patrolAt({ route: [3, 3, -1, -1] }, 0)).toBe(3);
    const moved = sneakStep(sneak, start, 1);
    expect(moved.at).toBe(1);
    expect(moved.tick).toBe(1);
  });

  it('waiting is a move: the patrol still walks', () => {
    const waited = sneakStep(sneak, newSneak(), 0);
    expect(waited.at).toBe(0);
    expect(waited.tick).toBe(1);
  });

  it('won’t walk off either end', () => {
    const start = newSneak();
    expect(sneakStep(sneak, start, -1)).toBe(start);
  });

  it('being caught costs nothing but the walk, and prints a notice', () => {
    let state = sneakStep(sneak, newSneak(), 1);
    state = sneakStep(sneak, state, 1);
    // The patrol stands on 3 for two ticks.
    state = { ...state, tick: 0 };
    const caught = sneakStep(sneak, state, 1);
    expect(caught.notice).toBe('caught one');
    expect(caught.at).toBe(0);
    expect(caught.tick).toBe(0);
    expect(sneakEarns({ ...caught, opened: true })).toBe(true);
    expect(sneakStep(sneak, caught, 1)).toBe(caught);
    expect(sneakDismiss(sneak, caught).notice).toBeNull();
  });

  it('the moment before: nothing lights until he writes it', () => {
    const start = newSneak();
    expect(start.lit).toBeNull();
    const walked = sneakStep(sneak, sneakStep(sneak, start, 1), 1);
    expect(walked.notice).toBeNull();
  });

  it('his line lights the stop it claims, right or not', () => {
    const right = sneakEnter(sneak, typed(newSneak(), '25'));
    expect(right.lit).toBe(5);
    const wrong = sneakEnter(sneak, typed(newSneak(), '10'));
    expect(wrong.lit).toBe(2);
  });

  it('a number that isn’t a stop on the line gets a shake', () => {
    const state = sneakEnter(sneak, typed(newSneak(), '12'));
    expect(state.lit).toBeNull();
    expect(state.shakes).toBe(1);
    expect(sneakEnter(sneak, typed(newSneak(), '500')).lit).toBeNull();
    expect(sneakEnter(sneak, newSneak()).shakes).toBe(1);
  });

  it('a wrong stop is empty, and the next try asks for a different stop', () => {
    const lit = sneakEnter(sneak, typed(newSneak(), '10'));
    const there = walk(lit);
    expect(there.notice).toBe('empty');
    expect(there.ask).toBe(1);
    expect(there.lit).toBeNull();
    expect(there.wrongStops).toBe(1);
    expect(there.help).toBe(1);
    const again = sneakDismiss(sneak, there);
    expect(again.boardDone).toBe(false);
    const redo = walk(sneakEnter(sneak, typed(again, '5')));
    expect(redo.notice).toBe('found');
    const on = sneakDismiss(sneak, redo);
    expect(on.board).toBe(1);
    expect(sneakEarns({ ...on, opened: true })).toBe(false);
  });

  it('the right stop ends the board, and the last board ends the scene', () => {
    const one = sneakDismiss(sneak, walk(sneakEnter(sneak, typed(newSneak(), '25'))));
    expect(one.board).toBe(1);
    expect(one.at).toBe(-1);
    expect(one.opened).toBe(false);
    const two = walk(one);
    expect(two.notice).toBe('found');
    const done = sneakDismiss(sneak, two);
    expect(done.opened).toBe(true);
    expect(sneakEarns(done)).toBe(true);
    expect(sneakEarns(sneakHint(sneakHint(done)))).toBe(true);
  });

  it('the exact move from ? takes the parts', () => {
    const hinted = sneakHint(sneakHint(newSneak()));
    expect(hinted.exactTaken).toBe(true);
    expect(sneakEarns({ ...hinted, opened: true })).toBe(false);
  });

  it('a search finds the way past a patrol, by waiting if it must', () => {
    const route = routeTo(board, { at: 0, tick: 0 }, 5);
    expect(route).not.toBeNull();
    let at = 0;
    for (const [i, by] of (route ?? []).entries()) {
      at += by;
      expect(patrolAt(board.patrols[0] as never, i + 1)).not.toBe(at);
    }
    expect(at).toBe(5);
  });

  it('proving catches a board that can’t be solved', () => {
    const walled: SneakBoard = { ...plain, patrols: [{ route: [2] }] };
    expect(proveSneak({ ...sneak, boards: [walled] }).length).toBeGreaterThan(0);
    expect(proveSneak(sneak)).toEqual([]);
  });

  it('comes back from a save, or doesn’t if it no longer fits', () => {
    const state = sneakStep(sneak, sneakEnter(sneak, typed(newSneak(), '25')), 1);
    const back = sneakFrom(sneak, JSON.parse(JSON.stringify(state)));
    expect(back?.lit).toBe(5);
    expect(back?.at).toBe(1);
    expect(sneakFrom(sneak, { board: 99, draft: [] })).toBeNull();
    expect(sneakFrom(sneak, null)).toBeNull();
  });
});

const unmask: UnmaskSpec = l06.scenes[0] as UnmaskSpec;

describe('Unmask', () => {
  it('can’t point before asking enough, and says so', () => {
    const one = unmaskAsk(unmask, newUnmask(), 'a');
    expect(one.asked).toEqual(['a']);
    const soon = unmaskAccuse(unmask, one, 'slagar');
    expect(soon.phase).toBe('ask');
    expect(soon.tooSoon).toBe(true);
  });

  it('asking again changes nothing', () => {
    const one = unmaskAsk(unmask, newUnmask(), 'a');
    expect(unmaskAsk(unmask, one, 'a')).toBe(one);
    expect(unmaskAsk(unmask, one, 'zzz')).toBe(one);
  });

  it('a wrong accusation shows why, costs nothing, and takes the parts', () => {
    const asked = unmaskAsk(unmask, unmaskAsk(unmask, newUnmask(), 'a'), 'b');
    const wrong = unmaskAccuse(unmask, asked, 'raznosac');
    expect(wrong.phase).toBe('ask');
    expect(wrong.shown).toContain('jednom');
    expect(unmaskAccuse(unmask, wrong, 'slagar')).toBe(wrong);
    const on = unmaskAccuse(unmask, unmaskDismiss(wrong), 'slagar');
    expect(on.phase).toBe('write');
    const done = unmaskEnter(
      unmask,
      ['3', '3', '0'].reduce((s, k) => unmaskType(s, k as SToken), on),
    );
    expect(done.opened).toBe(true);
    expect(unmaskEarns(done)).toBe(false);
  });

  it('pointing at the right one isn’t the end: he writes the line corrected', () => {
    const asked = unmaskAsk(unmask, unmaskAsk(unmask, newUnmask(), 'a'), 'b');
    const writing = unmaskAccuse(unmask, asked, 'slagar');
    expect(writing.phase).toBe('write');
    expect(writing.opened).toBe(false);
    const wrong = unmaskEnter(
      unmask,
      ['3', '4', '0'].reduce((s, k) => unmaskType(s, k as SToken), writing),
    );
    expect(wrong.bounced).toBe(true);
    expect(wrong.opened).toBe(false);
    const done = unmaskEnter(
      unmask,
      ['3', '3', '0'].reduce((s, k) => unmaskType(s, k as SToken), writing),
    );
    expect(done.opened).toBe(true);
    expect(unmaskEarns(done)).toBe(true);
  });

  it('proving: the culprit stands out, whichever two cards he asks', () => {
    expect(proveUnmask(unmask)).toEqual([]);
  });

  it('proving catches a culprit who is right on a card', () => {
    const honest: UnmaskSpec = {
      ...unmask,
      cards: unmask.cards.map((card, i) =>
        i === 0 ? { ...card, answers: { ...card.answers, slagar: '334 ≈ 330' } } : card,
      ),
    };
    expect(proveUnmask(honest).length).toBeGreaterThan(0);
  });

  it('comes back from a save', () => {
    const asked = unmaskAsk(unmask, newUnmask(), 'a');
    expect(unmaskFrom(unmask, JSON.parse(JSON.stringify(asked)))?.asked).toEqual(['a']);
    expect(unmaskFrom(unmask, { phase: 'x', draft: [] })).toBeNull();
  });
});

const alone: AloneSpec = l03.scenes[0] as AloneSpec;

describe('Little one alone', () => {
  it('a wrong pipe is a dead end, showing what the route means so far', () => {
    const on = alonePick(alone, alonePick(alone, newAlone(), 3), 4);
    const dead = alonePick(alone, on, 7);
    expect(dead.plate).toBe('347');
    expect(dead.taken).toEqual([3, 4]);
    expect(dead.deadEnds).toBe(1);
    expect(alonePick(alone, dead, 0)).toBe(dead);
  });

  it('it can’t be lost: it goes back to the same junction', () => {
    const dead = alonePick(alone, newAlone(), 9);
    const back = aloneDismiss(dead);
    expect(back.plate).toBeNull();
    expect(back.taken).toEqual([]);
    expect(alonePick(alone, back, 3).taken).toEqual([3]);
  });

  it('needs the missing 0, and reaches the end', () => {
    const end = [3, 4, 0, 7, 2].reduce((s, pipe) => alonePick(alone, s, pipe), newAlone());
    expect(end.opened).toBe(true);
    expect(aloneEarns(end)).toBe(true);
  });

  it('no dead ends, no exact move: first-try parts', () => {
    const dead = aloneDismiss(alonePick(alone, newAlone(), 9));
    const end = [3, 4, 0, 7, 2].reduce((s, pipe) => alonePick(alone, s, pipe), dead);
    expect(end.opened).toBe(true);
    expect(aloneEarns(end)).toBe(false);
  });

  it('proves out, and catches a board with no way on', () => {
    expect(proveAlone(alone)).toEqual([]);
    const broken: AloneSpec = {
      ...alone,
      junctions: [{ sign: 'x', pipes: [1, 2], right: 9 }],
    };
    expect(proveAlone(broken).length).toBeGreaterThan(0);
  });

  it('comes back from a save, or doesn’t if its route no longer fits', () => {
    const on = alonePick(alone, newAlone(), 3);
    expect(aloneFrom(alone, JSON.parse(JSON.stringify(on)))?.taken).toEqual([3]);
    expect(aloneFrom(alone, { taken: [9] })).toBeNull();
  });
});

describe('the tram line’s boards', () => {
  it('can all be solved', () => {
    expect(proveSneak(l04.scenes[0] as SneakSpec)).toEqual([]);
  });
});
