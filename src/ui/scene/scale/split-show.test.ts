import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { parse } from '@/math/parse';
import { splitGroups } from '@/room/splitter';
import {
  createSplitShow,
  groupCentres,
  splitPose,
  unevenSpread,
} from '@/ui/scene/scale/split-show';

function groupsOf(text: string, parts: number) {
  const parsed = parse(text);
  if (!parsed.ok) throw new Error(text);
  return splitGroups(parsed.equation, parts);
}

describe('createSplitShow', () => {
  it('plays one show at a time, notifies on play and end only, and ignores a stale end', () => {
    const show = createSplitShow();
    const listener = vi.fn();
    show.subscribe(listener);
    expect(show.current()).toBeNull();
    show.play(groupsOf('2x = 18', 2));
    const first = show.current();
    expect(first?.groups.even).toBe(true);
    show.play(groupsOf('2x = 23', 2));
    const second = show.current();
    expect(second?.id).not.toBe(first?.id);
    if (first) show.end(first.id);
    expect(show.current()).toBe(second);
    if (second) show.end(second.id);
    expect(show.current()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(3);
  });
});

describe('splitPose (story 1.15)', () => {
  it('even: the groups move apart, all but the first fade away, and it goes to the middle', () => {
    expect(splitPose(0, true)).toEqual({ spread: 0, othersAlpha: 1, toMiddle: 0, leftoverLift: 0 });
    expect(splitPose(0.4, true).spread).toBe(1);
    expect(splitPose(0.4, true).othersAlpha).toBe(1);
    expect(splitPose(0.8, true).othersAlpha).toBe(0);
    expect(splitPose(1, true)).toEqual({ spread: 1, othersAlpha: 0, toMiddle: 1, leftoverLift: 0 });
  });

  it('uneven: they start to separate, the leftover lifts, and all slide back together', () => {
    expect(splitPose(0, false)).toMatchObject({ spread: 0, leftoverLift: 0 });
    expect(splitPose(0.5, false)).toEqual({
      spread: unevenSpread,
      othersAlpha: 1,
      toMiddle: 0,
      leftoverLift: 1,
    });
    expect(unevenSpread).toBeLessThan(1);
    expect(splitPose(1, false)).toMatchObject({ spread: 0, leftoverLift: 0, othersAlpha: 1 });
  });
});

describe('groupCentres', () => {
  it('packs the groups side by side about the middle, and spreads them apart', () => {
    const packed = groupCentres([100, 100], 0, 10, 50, { spread: 0, toMiddle: 0 });
    expect(packed).toEqual({ groups: [-55, 55], leftover: 0 });
    const apart = groupCentres([100, 100], 0, 10, 50, { spread: 1, toMiddle: 0 });
    expect(apart.groups).toEqual([-80, 80]);
  });

  it('puts the leftover last, and brings the first group to the middle at the end', () => {
    const withRest = groupCentres([100, 100], 40, 10, 0, { spread: 0, toMiddle: 0 });
    expect(withRest.leftover).toBeGreaterThan(withRest.groups[1] ?? 0);
    const middle = groupCentres([100, 100, 100], 0, 10, 50, { spread: 1, toMiddle: 1 });
    expect(middle.groups[0]).toBeCloseTo(0);
  });
});

describe('Scale.tsx and SplitGroups.tsx', () => {
  const scale = readFileSync(new URL('./Scale.tsx', import.meta.url), 'utf8');
  const groups = readFileSync(new URL('./SplitGroups.tsx', import.meta.url), 'utf8');

  it('draws a show on each pan in place of its pieces, and ends it once', () => {
    expect(scale).toContain('piecesHidden={show !== null}');
    expect(scale.match(/onDone=\{endShow\}/g)).toHaveLength(1);
  });

  it('moves the groups through refs on the animation, never React state, and never a destroyed node', () => {
    expect(groups).toContain('animate(0, 1');
    expect(groups).not.toContain('useState');
    expect(groups).toContain('node.destroyed');
  });
});
