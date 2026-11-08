import { describe, expect, it } from 'vitest';
import { l01 } from '@/content/leads/l01-two-sides';
import {
  type LeadAction,
  type LeadOutcome,
  type LeadPlay,
  leadPlayFrom,
  leadStep,
  newLeadPlay,
} from '@/hunt/lead';
import type { SToken } from '@/math/statement-tokens';

/** Plays actions in order; returns where he got to, and everything that came out. */
function play(start: LeadPlay, actions: readonly LeadAction[], taught: string[] = []) {
  let state = start;
  const outcomes: LeadOutcome[] = [];
  for (const action of actions) {
    const result = leadStep(l01, state, action, { taught, told: ['guide:knock'] });
    state = result.play;
    outcomes.push(result.outcome);
  }
  return { state, outcomes };
}

const types = (line: string): LeadAction[] => [
  ...line
    .split(' ')
    .flatMap((part) =>
      (['N₀', 'N', '∉', '∈'].includes(part) ? [part] : part.split('')).map(
        (token): LeadAction => ({ kind: 'type', token: token as SToken }),
      ),
    ),
  { kind: 'enter' },
];

const next: LeadAction = { kind: 'next' };
const add: LeadAction = { kind: 'move', move: { kind: 'pairs-add' } };

const toTry: LeadAction[] = l01.lesson.steps.map(() => next);
const toFix: LeadAction[] = [
  ...toTry,
  add,
  add,
  add,
  next,
  ...types('7'),
  next,
  ...types('∉'),
  next,
];
const toPlay: LeadAction[] = [
  ...toFix,
  { kind: 'fix-tap', line: 1 },
  add,
  ...types('4 · 2 + 1'),
  next,
];
const street: LeadAction[] = [
  { kind: 'cross' },
  ...types('15'),
  ...types('15'),
  { kind: 'door', door: 15 },
];
const toLift: LeadAction[] = [...toPlay, ...street, next];
const lift: LeadAction[] = [...types('0'), { kind: 'door', door: 0 }];
const toWrite: LeadAction[] = [...toLift, ...lift, next];

const mistake = l01.mistake as NonNullable<typeof l01.mistake>;

describe('the steps of a lead', () => {
  it('goes show, try, fix, play, write, thread, and ends', () => {
    const all = [...toWrite, ...types('0'), ...types('N₀'), ...types('7 · 2 + 1 = 15'), next, next];
    const { state, outcomes } = play(newLeadPlay(), all);
    expect(state.step).toBe('thread');
    const finished = outcomes[outcomes.length - 1]?.finished;
    expect(finished?.lines).toEqual(['0 ∉ N', '0 ∈ N₀', '7 · 2 + 1 = 15']);
    expect(finished?.firstTry).toBe(true);
  });

  it('marks the showing seen at its end, and not before', () => {
    const before = play(newLeadPlay(), toTry.slice(0, -1));
    expect(before.state.step).toBe('show');
    expect(before.outcomes.some((o) => o.lessonSeen)).toBe(false);
    const after = play(newLeadPlay(), toTry);
    expect(after.state.step).toBe('try');
    expect(after.outcomes[after.outcomes.length - 1]?.lessonSeen).toBe(true);
  });

  it('ignores what isn’t legal in a step', () => {
    const start = newLeadPlay();
    for (const action of [
      add,
      { kind: 'type', token: '1' },
      { kind: 'enter' },
      { kind: 'door', door: 15 },
      { kind: 'cross' },
      { kind: 'strike', line: 0 },
      { kind: 'fix-tap', line: 1 },
    ] as LeadAction[]) {
      expect(leadStep(l01, start, action, { taught: [], told: [] }).play).toBe(start);
    }
  });
});

describe('trying', () => {
  it('doesn’t move on until the task is done', () => {
    const { state } = play(newLeadPlay(), [...toTry, add, next]);
    expect(state.step).toBe('try');
    expect(state.at).toBe(0);
    expect(state.solved).toBe(false);
  });

  it('moves on once the object reaches its goal', () => {
    const { state } = play(newLeadPlay(), [...toTry, add, add, add]);
    expect(state.solved).toBe(true);
  });

  it('a false line bounces, and something else gets a wiggle', () => {
    const atLine = [...toTry, add, add, add, next];
    expect(play(newLeadPlay(), [...atLine, ...types('8')]).state.bounced).toBe(true);
    expect(play(newLeadPlay(), [...atLine, ...types('+')]).state.refused).toBe(true);
    expect(play(newLeadPlay(), [...atLine, { kind: 'enter' }]).state.refused).toBe(true);
  });
});

describe('fixing the little one', () => {
  it('a tap on a right line gets help, at no cost', () => {
    const { state } = play(newLeadPlay(), [...toFix, { kind: 'fix-tap', line: 0 }]);
    expect(state.fix).toBe('spot');
    expect(state.nudged).toBe(true);
  });

  it('goes from spotting it, to showing it, to writing it, and it learns', () => {
    const spotted = play(newLeadPlay(), [...toFix, { kind: 'fix-tap', line: 1 }]).state;
    expect(spotted.fix).toBe('show');
    expect(spotted.object).toEqual(mistake.show.object);
    const shown = play(spotted, [add]).state;
    expect(shown.fix).toBe('write');
    const { state, outcomes } = play(shown, types('4 · 2 + 1'));
    expect(state.fix).toBe('thanks');
    expect(outcomes[outcomes.length - 1]?.taught).toEqual({
      mistake: mistake.id,
      line: '9 = 4 · 2 + 1',
    });
  });

  it('a mistake it has learnt never comes back', () => {
    const { state } = play(newLeadPlay(), toFix, [mistake.id]);
    expect(state.step).toBe('play');
  });
});

describe('the doors in a lead', () => {
  it('earn their parts once each, with keys that say which', () => {
    const { outcomes } = play(newLeadPlay(), [...toLift, ...lift]);
    const earned = outcomes.flatMap((o) => (o.earned ? [o.earned] : []));
    expect(earned).toEqual([
      { key: 'l01:0', parts: 2 },
      { key: 'l01:1', parts: 2 },
    ]);
  });

  it('a wrong door earns nothing and costs nothing, and the lead isn’t a first try', () => {
    const wrong: LeadAction[] = [
      ...toPlay,
      { kind: 'cross' },
      ...types('17'),
      ...types('17'),
      { kind: 'door', door: 17 },
      { kind: 'dismiss' },
      ...types('15'),
      ...types('15'),
      { kind: 'door', door: 15 },
    ];
    const { state, outcomes } = play(newLeadPlay(), wrong);
    expect(state.knock?.opened).toBe(true);
    expect(outcomes.flatMap((o) => (o.earned ? [o.earned] : []))).toEqual([]);
    expect(outcomes.flatMap((o) => (o.doorKnocked ? [o.doorKnocked] : []))).toEqual([
      { door: 17, right: false },
      { door: 15, right: true },
    ]);
    expect(state.clean).toBe(false);
  });

  it('won’t leave a scene before its door has opened', () => {
    const { state } = play(newLeadPlay(), [...toPlay, next]);
    expect(state.step).toBe('play');
    expect(state.at).toBe(0);
  });
});

describe('the first Knock’s guide', () => {
  const firstTime = (actions: readonly LeadAction[]) => {
    let state = newLeadPlay();
    for (const action of actions) {
      state = leadStep(l01, state, action, { taught: [], told: [] }).play;
    }
    return state;
  };

  it('lets through only the asked move', () => {
    const atStart = firstTime(toPlay);
    expect(atStart.knock?.guide).toBe('intro');
    const blocked = firstTime([...toPlay, { kind: 'cross' }]);
    expect(blocked.knock?.side).toBe('even');
    const read = firstTime([...toPlay, next]);
    expect(read.knock?.guide).toBe('on');
    // Asked to cross: typing and doors don't pass.
    const typed = firstTime([...toPlay, next, { kind: 'type', token: '1' }]);
    expect(typed.knock?.draft).toEqual([]);
    const crossed = firstTime([...toPlay, next, { kind: 'cross' }]);
    expect(crossed.knock?.side).toBe('odd');
    // Asked to write: crossing back doesn't pass.
    expect(firstTime([...toPlay, next, { kind: 'cross' }, { kind: 'cross' }]).knock?.side).toBe(
      'odd',
    );
  });

  it('ends when the door opens, and says so once', () => {
    let state = newLeadPlay();
    const seen: LeadOutcome[] = [];
    for (const action of [
      ...toPlay,
      next,
      { kind: 'cross' },
      ...types('15'),
      ...types('15'),
      { kind: 'door', door: 15 },
    ] as LeadAction[]) {
      const result = leadStep(l01, state, action, { taught: [], told: [] });
      state = result.play;
      seen.push(result.outcome);
    }
    expect(state.knock?.opened).toBe(true);
    expect(seen.filter((o) => o.told === 'guide:knock')).toHaveLength(1);
  });

  it('doesn’t come back once told', () => {
    const { state } = play(newLeadPlay(), toPlay);
    expect(state.knock?.guide).toBeNull();
  });
});

describe('a saved lead', () => {
  it('comes back as it was, at any step', () => {
    for (const actions of [toTry, toFix, toPlay, toLift, toWrite]) {
      const { state } = play(newLeadPlay(), actions);
      const back = leadPlayFrom(l01, JSON.parse(JSON.stringify(state)));
      expect(back?.step).toBe(state.step);
      expect(back?.at).toBe(state.at);
      expect(back?.knock?.lines ?? null).toEqual(state.knock?.lines ?? null);
    }
  });

  it('restarts a scene that no longer fits, and keeps the lead', () => {
    const { state } = play(newLeadPlay(), [...toPlay, { kind: 'cross' }, ...types('15')]);
    const broken = JSON.parse(JSON.stringify(state));
    broken.knock.lines[0].clue = 'gone';
    const back = leadPlayFrom(l01, broken);
    expect(back?.step).toBe('play');
    expect(back?.knock?.lines).toEqual([]);
  });

  it('returns null for what can’t be read at all', () => {
    expect(leadPlayFrom(l01, null)).toBeNull();
    expect(leadPlayFrom(l01, { step: 'nope', at: 0, draft: [] })).toBeNull();
    expect(leadPlayFrom(l01, { step: 'try', at: 99, draft: [] })).toBeNull();
  });
});
