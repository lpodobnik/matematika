import { describe, expect, it } from 'vitest';
import {
  type GateFacts,
  type GateScene,
  gateDelete,
  gateEnter,
  gateState,
  gateType,
  newGateScene,
} from '@/hunt/gate';
import type { Token } from '@/math/tokens';

const facts = (over: Partial<GateFacts> = {}): GateFacts => ({
  roomsDone: ['r12', 'r13'],
  bossBeaten: true,
  hunt: { gateOpened: false },
  ...over,
});

const typed = (scene: GateScene, line: string): GateScene => {
  const tokens = line.replaceAll(' ', '').split('') as Token[];
  return tokens.reduce((s, token) => gateType(s, token, 40), scene);
};

describe('gateState', () => {
  it('is sealed while part 2 is off, whatever he has done', () => {
    expect(gateState(facts(), false)).toBe('sealed');
    expect(gateState(facts({ hunt: { gateOpened: true } }), false)).toBe('sealed');
  });

  it('waits the moment before it opens: room 13 alone, or the boss alone, is not enough', () => {
    expect(gateState(facts({ roomsDone: ['r12'] }), true)).toBe('waiting');
    expect(gateState(facts({ bossBeaten: false }), true)).toBe('waiting');
    expect(gateState(facts({ roomsDone: [], bossBeaten: false }), true)).toBe('waiting');
  });

  it('is ready with room 13 done and the boss beaten', () => {
    expect(gateState(facts(), true)).toBe('ready');
  });

  it('stays open once open, even if the lairs are woken', () => {
    const woken = facts({ bossBeaten: false, hunt: { gateOpened: true } });
    expect(gateState(woken, true)).toBe('opened');
  });
});

describe('the plate', () => {
  it('opens with the answer, then the check line', () => {
    const answered = gateEnter(typed(newGateScene(), 'x=8'));
    expect(answered.phase).toBe('solve');
    expect(answered.lines).toEqual(['x = 8']);
    const checked = gateEnter(typed(answered, '5·8=40'));
    expect(checked.phase).toBe('foundry');
  });

  it('a wrong line gets a knock back, at no cost', () => {
    const wrong = gateEnter(typed(newGateScene(), 'x=7'));
    expect(wrong.knockedBack).toBe(true);
    expect(wrong.lines).toEqual([]);
    expect(wrong.draft).toEqual([]);
    expect(wrong.phase).toBe('solve');
  });

  it('the check line alone does not open it, as in rooms', () => {
    const early = gateEnter(typed(newGateScene(), '5·8=40'));
    expect(early.phase).toBe('solve');
  });

  it('a line that does not read is refused, and stays to be fixed', () => {
    const scene = typed(newGateScene(), '5·');
    const refused = gateEnter(scene);
    expect(refused.refused).toBe(true);
    expect(refused.draft).toEqual(scene.draft);
    expect(gateDelete(refused).draft).toHaveLength(1);
  });

  it('takes no keys once it is open', () => {
    const open: GateScene = { ...newGateScene(), phase: 'foundry' };
    expect(gateType(open, '1', 40)).toBe(open);
    expect(gateEnter(open)).toBe(open);
  });
});
