import { describe, expect, it } from 'vitest';
import {
  cluesLeft,
  type KnockSpec,
  type KnockState,
  knockCross,
  knockDelete,
  knockDismiss,
  knockDoor,
  knockEarns,
  knockEnter,
  knockFrom,
  knockHint,
  knockIdle,
  knockPickClue,
  knockStrike,
  knockType,
  lineStart,
  litDoors,
  newKnock,
} from '@/hunt/knock';
import { proveKnock } from '@/hunt/solve';
import type { SToken } from '@/math/statement-tokens';

const spec: KnockSpec = {
  kind: 'knock',
  intro: '',
  row: { kind: 'street', from: 1, to: 40 },
  startSide: 'even',
  clues: [
    { id: 'side', kind: 'side', side: 'odd', say: '' },
    { id: 'a', kind: 'sum', start: '7 · 2 + 1 =', answer: 15, say: '', structure: '' },
    { id: 'b', kind: 'sum', start: '8 · 2 − 1 =', answer: 15, say: '', structure: '' },
  ],
  door: 15,
  wrongDoors: [{ door: 17, say: 'seventeen' }],
  grumpy: ['go away'],
  opened: '',
  example: [],
  keys: [],
  hint: { step: '', move: '' },
};

const limits: KnockSpec = {
  ...spec,
  row: { kind: 'street', from: 200, to: 260 },
  startSide: 'even',
  door: 234,
  clues: [
    {
      id: 'r',
      kind: 'limit',
      numbers: [230, 240],
      canonical: '230 < x < 240',
      say: '',
      structure: '',
    },
    {
      id: 'l',
      kind: 'limit',
      numbers: [232, 236, 238],
      canonical: 'x ≠ 232',
      say: '',
      structure: '',
    },
  ],
};

const type = (state: KnockState, keys: string) =>
  keys.split('').reduce((s, key) => knockType(s, key as SToken, 40), state);

const write = (s: KnockSpec, state: KnockState, keys: string) => knockEnter(s, type(state, keys));

const lit = (s: KnockSpec, state: KnockState) => litDoors(s.row, state.side, state.lines);

describe('the doors', () => {
  it('start all lit, on the side he stands on', () => {
    const state = newKnock(spec);
    expect(lit(spec, state)).toHaveLength(20);
    expect(lit(spec, state)[0]).toBe(2);
    expect(lit(spec, knockCross(spec, state))[0]).toBe(1);
  });

  it('a sum with his result lights that door, whatever the result', () => {
    const state = write(spec, knockCross(spec, newKnock(spec)), '17');
    expect(lit(spec, state)).toEqual([17]);
    expect(state.lines[0]?.struck).toBe(false);
  });

  it('a line that leaves no door shakes, and is struck through', () => {
    const state = write(spec, knockCross(spec, newKnock(spec)), '16');
    expect(state.shakes).toBe(1);
    expect(state.lines[0]?.struck).toBe(true);
    expect(state.anyStruck).toBe(true);
    expect(lit(spec, state)).toHaveLength(20);
    expect(state.draft).toEqual([]);
  });

  it('two lines that disagree leave no door', () => {
    const crossed = knockCross(spec, newKnock(spec));
    const state = write(spec, write(spec, crossed, '15'), '17');
    expect(state.lines[1]?.struck).toBe(true);
    expect(lit(spec, state)).toEqual([15]);
  });

  it('striking a line relights what it ruled out, and tapping again restores it', () => {
    const state = write(spec, knockCross(spec, newKnock(spec)), '15');
    const struck = knockStrike(spec, state, 0);
    expect(lit(spec, struck)).toHaveLength(20);
    const back = knockStrike(spec, struck, 0);
    expect(lit(spec, back)).toEqual([15]);
  });

  it('a range and a limit narrow them, with no need for a result', () => {
    const state = write(limits, newKnock(limits), '230<x<240');
    expect(lit(limits, state)).toEqual([232, 234, 236, 238]);
  });

  it('a range using numbers not in the clue is refused', () => {
    const state = write(limits, newKnock(limits), '231<x<240');
    expect(state.shakes).toBe(1);
    expect(state.lines).toEqual([]);
    expect(state.draft.length).toBeGreaterThan(0);
  });
});

describe('what a line must be', () => {
  it('starts from the clue', () => {
    expect(lineStart(spec, newKnock(spec)).join('')).toBe('7·2+1=');
  });

  it('nothing typed is a shake', () => {
    const state = knockEnter(spec, newKnock(spec));
    expect(state.shakes).toBe(1);
    expect(state.lines).toEqual([]);
  });

  it('a line that does not read keeps the draft to be fixed', () => {
    const state = write(spec, newKnock(spec), '15+');
    expect(state.shakes).toBe(1);
    expect(state.draft).toEqual(['1', '5', '+']);
    expect(knockDelete(state).draft).toEqual(['1', '5']);
  });

  it('true working on the way goes in, and the next line goes on from it', () => {
    const crossed = knockCross(spec, newKnock(spec));
    const working = write(spec, crossed, '14+1');
    expect(working.lines).toHaveLength(1);
    expect(lit(spec, working)).toHaveLength(20);
    expect(lineStart(spec, working)).toEqual(['=']);
    const done = write(spec, working, '15');
    expect(lit(spec, done)).toEqual([15]);
  });

  it('false working on the way goes nowhere', () => {
    const state = write(spec, newKnock(spec), '13+1');
    expect(state.lines).toEqual([]);
    expect(state.shakes).toBe(1);
  });

  it('moves on to the next clue once a line is done', () => {
    const state = write(spec, knockCross(spec, newKnock(spec)), '15');
    expect(state.clue).toBe('b');
    expect(lineStart(spec, state).join('')).toBe('8·2−1=');
  });

  it('he can pick another clue', () => {
    const state = knockPickClue(spec, type(newKnock(spec), '1'), 'b');
    expect(state.clue).toBe('b');
    expect(state.draft).toEqual([]);
    expect(knockPickClue(spec, state, 'side').clue).toBe('b');
  });
});

describe('knocking', () => {
  const crossed = knockCross(spec, newKnock(spec));
  const ready = write(spec, write(spec, crossed, '15'), '15');

  it('the moment before: tapping any door with clues left is a shake', () => {
    const one = write(spec, crossed, '15');
    expect(cluesLeft(spec, one).map((c) => c.id)).toEqual(['b']);
    const tapped = knockDoor(spec, one, 15);
    expect(tapped.opened).toBe(false);
    expect(tapped.shakes).toBe(1);
    expect(tapped.pointAt).toBe('b');
  });

  it('tapping a door with several lit is a shake', () => {
    const tapped = knockDoor(spec, crossed, 15);
    expect(tapped.opened).toBe(false);
    expect(tapped.pointAt).toBe('a');
  });

  it('tapping a dark door is a shake', () => {
    expect(knockDoor(spec, ready, 17).opened).toBe(false);
    expect(knockDoor(spec, ready, 17).shakes).toBe(1);
  });

  it('crossing back with one door lit doesn’t knock on the other side', () => {
    const back = knockCross(spec, ready);
    expect(lit(spec, back)).toEqual([]);
    expect(knockDoor(spec, back, 16).opened).toBe(false);
  });

  it('the right door opens, and earns its parts when nothing was struck', () => {
    const open = knockDoor(spec, ready, 15);
    expect(open.opened).toBe(true);
    expect(knockEarns(open)).toBe(true);
  });

  it('a struck line takes the parts, even when the door is right', () => {
    const redo = write(spec, knockStrike(spec, ready, 1), '15');
    const open = knockDoor(spec, redo, 15);
    expect(open.opened).toBe(true);
    expect(knockEarns(open)).toBe(false);
  });

  it('the exact move from ? takes the parts, and the first press doesn’t', () => {
    expect(knockEarns(knockDoor(spec, knockHint(ready), 15))).toBe(true);
    expect(knockEarns(knockDoor(spec, knockHint(knockHint(ready)), 15))).toBe(false);
  });
});

describe('a wrong door', () => {
  const crossed = knockCross(spec, newKnock(spec));
  const wrongReady = write(spec, write(spec, crossed, '17'), '17');
  const wrong = knockDoor(spec, wrongReady, 17);

  it('shows what his idea caused, and strikes his lines', () => {
    expect(wrong.shown).toEqual({ door: 17, say: 'seventeen' });
    expect(wrong.lines.every((line) => line.struck)).toBe(true);
    expect(wrong.mode).toBe('working');
    expect(wrong.opened).toBe(false);
    expect(knockEarns(wrong)).toBe(false);
  });

  it('takes no moves until he has read it', () => {
    expect(knockType(wrong, '1', 40)).toBe(wrong);
    expect(knockDoor(spec, wrong, 15)).toBe(wrong);
    expect(knockDismiss(wrong).shown).toBeNull();
  });

  it('from then on, a false line bounces and stays in the draft', () => {
    const state = write(spec, knockDismiss(wrong), '17');
    expect(state.bounced).toBe(true);
    expect(state.draft).toEqual(['1', '7']);
    expect(state.lines).toHaveLength(2);
    // Nothing he types next is lost, and the wobble goes.
    expect(knockType(state, '0', 40).bounced).toBe(false);
  });

  it('from then on, working line by line gets him there', () => {
    const one = write(spec, knockDismiss(wrong), '14+1');
    expect(one.bounced).toBe(false);
    const two = write(spec, one, '16');
    expect(two.bounced).toBe(true);
    const three = write(spec, knockDelete(knockDelete(two)), '15');
    expect(three.bounced).toBe(false);
    expect(lit(spec, three)).toEqual([15]);
  });

  it('help rises with each wrong door, and the little one marks a line at the second', () => {
    expect(wrong.help).toBe(1);
    expect(wrong.marked).toBeNull();
    // The second time he can only get there through a door the lines stay true for, so seed it.
    const again = knockDoor(spec, { ...knockDismiss(wrong), lines: wrongReady.lines }, 17);
    expect(again.help).toBe(2);
    expect(again.marked).toBe(0);
  });

  it('a door with no known idea gets a grumpy neighbour', () => {
    const other = write(spec, write(spec, crossed, '19'), '19');
    expect(knockDoor(spec, other, 19).shown?.say).toBe('go away');
  });
});

describe('help', () => {
  it('rises with each idle minute, to the worked example, for nothing', () => {
    let state = newKnock(spec);
    for (let i = 0; i < 5; i++) state = knockIdle(state);
    expect(state.help).toBe(3);
    expect(state.anyStruck).toBe(false);
  });
});

describe('a saved scene', () => {
  it('comes back as it was', () => {
    const state = write(spec, knockCross(spec, newKnock(spec)), '15');
    const back = knockFrom(spec, JSON.parse(JSON.stringify(state)));
    expect(back?.lines).toEqual(state.lines);
    expect(back?.side).toBe('odd');
    expect(back?.clue).toBe('b');
  });

  it('doesn’t come back if it no longer fits', () => {
    const state = write(spec, knockCross(spec, newKnock(spec)), '15');
    expect(knockFrom(limits, JSON.parse(JSON.stringify(state)))).toBeNull();
    expect(knockFrom(spec, { lines: 'no' })).toBeNull();
    expect(knockFrom(spec, null)).toBeNull();
  });
});

describe('proving a scene', () => {
  it('passes a scene that works', () => {
    expect(proveKnock(spec)).toEqual([]);
    expect(proveKnock({ ...limits, door: 234, clues: [limits.clues[0] as never] })).not.toEqual([]);
  });

  it('catches clues that leave two doors', () => {
    const two = { ...spec, clues: [spec.clues[0] as never] };
    expect(proveKnock(two).length).toBeGreaterThan(0);
  });

  it('catches a door on the other side', () => {
    expect(proveKnock({ ...spec, door: 16 }).length).toBeGreaterThan(0);
  });
});
