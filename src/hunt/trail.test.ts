import { describe, expect, it } from 'vitest';
import type { BeatId, KnotId, LeadId } from '@/hunt/ids';
import {
  actOf,
  currentAct,
  openTrail,
  threadAfterLead,
  threadRoutes,
  threadTarget,
} from '@/hunt/trail';
import { newHunt } from '@/hunt/types';

const hunt = (
  leadsDone: LeadId[] = [],
  knotsDone: KnotId[] = [],
  beats: BeatId[] = ['foundry', 'named', 'map-given'],
) => ({ ...newHunt(), leadsDone, knotsDone, beats });

const act1: LeadId[] = ['l01', 'l02', 'l03', 'l04'];
const act2: LeadId[] = ['l05', 'l06', 'l07', 'l08'];

describe('what’s open', () => {
  it('nothing before Vučetić has given the map', () => {
    expect(openTrail(hunt([], [], ['foundry', 'named']))).toEqual([]);
  });

  it('Act 1’s four leads, in any order', () => {
    expect(openTrail(hunt())).toEqual(act1);
    expect(openTrail(hunt(['l03']))).toEqual(['l01', 'l02', 'l04']);
  });

  it('the moment before: the knot stays shut with one lead left', () => {
    expect(openTrail(hunt(['l01', 'l02', 'l03']))).toEqual(['l04']);
  });

  it('then the knot, and only the knot', () => {
    expect(openTrail(hunt(act1))).toEqual(['k1']);
  });

  it('after Knot 1 the wandering-off comes first: no other lead opens until then', () => {
    expect(openTrail(hunt(act1, ['k1']))).toEqual(['w1']);
    expect(openTrail(hunt(act1, ['k1', 'w1']))).toEqual(act2);
  });

  it('the coat is last in Act 3', () => {
    const before = hunt([...act1, ...act2], ['k1', 'w1', 'k2']);
    expect(openTrail(before)).toEqual(['l09', 'l10']);
    expect(openTrail({ ...before, leadsDone: [...before.leadsDone, 'l09'] })).toEqual(['l10']);
    expect(openTrail({ ...before, leadsDone: [...before.leadsDone, 'l09', 'l10'] })).toEqual([
      'l11',
    ]);
  });

  it('the locks are first in Act 4', () => {
    const before = hunt([...act1, ...act2, 'l09', 'l10', 'l11'], ['k1', 'w1', 'k2', 'k3']);
    expect(openTrail(before)).toEqual(['l12']);
    expect(openTrail({ ...before, leadsDone: [...before.leadsDone, 'l12'] })).toEqual([
      'l13',
      'l14',
      'l15',
    ]);
  });

  it('the lamp oil is last of all, and then nothing is open', () => {
    const all = hunt(
      [...act1, ...act2, 'l09', 'l10', 'l11', 'l12', 'l13', 'l14', 'l15'],
      ['k1', 'w1', 'k2', 'k3'],
    );
    expect(openTrail(all)).toEqual(['l16']);
    expect(openTrail({ ...all, leadsDone: [...all.leadsDone, 'l16'] })).toEqual([]);
  });

  it('knows which act a lead is in', () => {
    expect(actOf('l01')).toBe(0);
    expect(actOf('w1')).toBe(1);
    expect(actOf('l11')).toBe(2);
    expect(actOf('l16')).toBe(4);
  });

  it('starts in Act 1, and moves on only when the knot is tied', () => {
    expect(currentAct(hunt())).toBe(0);
    expect(currentAct(hunt(act1))).toBe(0);
    expect(currentAct(hunt(act1, ['k1']))).toBe(1);
  });
});

describe('the black thread', () => {
  const inAct2 = (done: LeadId[] = [], started: LeadId[] = []) => ({
    ...hunt([...act1, ...done], ['k1', 'w1']),
    leadsStarted: [...started, ...done],
  });

  it('has no target in Act 1', () => {
    expect(threadTarget(hunt())).toBeNull();
  });

  it('shows beforehand where it’s heading', () => {
    expect(threadTarget(inAct2())).toBe('l08');
  });

  it('turns to another if he starts that lead first', () => {
    expect(threadTarget(inAct2([], ['l08']))).toBe('l07');
    expect(threadTarget(inAct2([], ['l08', 'l07']))).toBe('l05');
  });

  it('doesn’t seal after the first lead he finishes in Act 2', () => {
    const state = inAct2(['l05']);
    const moved = threadAfterLead(state, 'l05');
    expect(moved.sealed).toEqual([]);
    expect(moved.thread.finishedSince).toBe(1);
  });

  it('seals what it’s heading for after the second, and only once', () => {
    const first = { ...inAct2(['l05', 'l06']), thread: { target: null, finishedSince: 1 } };
    const moved = threadAfterLead(first, 'l06');
    expect(moved.sealed).toEqual(['l08']);
    expect(moved.thread.finishedSince).toBe(0);
    const after = { ...first, sealed: [...moved.sealed] };
    expect(threadTarget(after)).toBeNull();
    const again = threadAfterLead({ ...after, thread: { target: null, finishedSince: 1 } }, 'l07');
    expect(again.sealed).toEqual(['l08']);
  });

  it('seals nothing he has already started', () => {
    const state = {
      ...inAct2(['l05', 'l06'], ['l08', 'l07']),
      thread: { target: null, finishedSince: 1 },
    };
    expect(threadAfterLead(state, 'l06').sealed).toEqual([]);
  });

  it('never reaches the coat', () => {
    for (const route of threadRoutes) expect(route.targets).not.toContain('l11');
  });

  it('seals after the first lead in Act 3', () => {
    const state = {
      ...hunt([...act1, ...act2, 'l09'], ['k1', 'w1', 'k2']),
      leadsStarted: ['l09'] as LeadId[],
    };
    expect(threadAfterLead(state, 'l09').sealed).toEqual(['l10']);
  });

  it('stops after the coat: it can’t read his map any more', () => {
    const state = { ...inAct2(['l05', 'l06']), beats: ['coat'] as BeatId[] };
    expect(threadTarget(state)).toBeNull();
    const moved = threadAfterLead({ ...state, thread: { target: null, finishedSince: 1 } }, 'l06');
    expect(moved.sealed).toEqual([]);
  });
});
