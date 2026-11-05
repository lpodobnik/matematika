import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { r01 } from '@/content/rooms/r01-door-lift';
import type { Verdict } from '@/math/check';
import { isLocked, machineView, progressAfter } from '@/room/machine';
import { enterRoom } from '@/room/room';
import type { Phase, RoomState } from '@/room/types';

const progressing: Verdict = {
  kind: 'valid',
  move: { kind: 'add-both', term: { kind: 'num', value: 7, sign: -1 } },
  progress: true,
};
const standing: Verdict = {
  kind: 'valid',
  move: { kind: 'add-both', term: { kind: 'num', value: 1, sign: 1 } },
  progress: false,
};

describe('progressAfter (architecture, Machine progress)', () => {
  it(`adds ${tuning.progressStep} for a valid line with progress, up to ${tuning.progressCap}`, () => {
    const seen: number[] = [];
    let progress = 0;
    for (let i = 0; i < 6; i += 1) {
      progress = progressAfter(progress, progressing);
      seen.push(progress);
    }
    expect(seen).toEqual([0.2, 0.4, 0.6, 0.8, 0.8, 0.8]);
  });

  it('adds nothing for a valid line without progress', () => {
    expect(progressAfter(0, standing)).toBe(0);
    expect(progressAfter(0.4, standing)).toBe(0.4);
  });

  it('sets 0.9 on the answer line and 1 on the check line', () => {
    expect(progressAfter(0, { kind: 'answer' })).toBe(tuning.progressAnswer);
    expect(progressAfter(0.6, { kind: 'answer' })).toBe(0.9);
    expect(progressAfter(0.9, { kind: 'check' })).toBe(1);
  });

  it('never goes back: a line with progress after the answer leaves 0.9', () => {
    expect(progressAfter(0.9, progressing)).toBe(0.9);
    expect(progressAfter(0.9, { kind: 'answer' })).toBe(0.9);
  });

  it('is unchanged by lines that are never committed', () => {
    for (const kind of ['incomplete', 'nonlinear', 'aside', 'wrong'] as const) {
      expect(progressAfter(0.4, { kind })).toBe(0.4);
    }
  });
});

describe('machineView', () => {
  const room = (): RoomState => enterRoom(r01).room;

  it('is null with no room', () => {
    expect(machineView(null)).toBeNull();
  });

  it("shows room 1's door lift, stopped, not jammed, not locked", () => {
    expect(machineView(room())).toEqual({
      id: 'door-lift',
      progress: 0,
      jammed: false,
      locked: false,
    });
  });

  it("shows the active machine's progress, a jam of either kind, and a locked stage", () => {
    const base = room();
    const moved: RoomState = {
      ...base,
      stage: { ...base.stage, machine: 1, machineProgress: [1, 0.4] },
    };
    expect(machineView(moved)?.progress).toBe(0.4);
    for (const jam of [{ kind: 'line' }, { kind: 'split', parts: 2 }] as const) {
      expect(machineView({ ...base, stage: { ...base.stage, jam } })?.jammed).toBe(true);
    }
    expect(machineView({ ...base, stage: { ...base.stage, phase: 'locked' } })?.locked).toBe(true);
  });

  it.each<[Phase, boolean]>([
    ['arrive', false],
    ['poke', false],
    ['pin', false],
    ['open', false],
    ['locked', true],
    ['restart', true],
    ['done', true],
  ])('is locked in %s: %s', (phase, locked) => {
    expect(isLocked(phase)).toBe(locked);
  });
});
