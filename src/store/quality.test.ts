import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import {
  initialQuality,
  percentile,
  pickQuality,
  type QualityState,
  qualityInUse,
  reduceQuality,
} from '@/store/quality';

/** 120 frames (2 s at 60 FPS): `slow` of them take `slowMs`, the rest `fastMs`. */
function frames(fastMs: number, slow = 0, slowMs = fastMs): number[] {
  return [...Array.from({ length: 120 - slow }, () => fastMs), ...Array(slow).fill(slowMs)];
}

describe('the quality tuning', () => {
  it('holds the architecture’s thresholds and timing', () => {
    expect(tuning.qualityHighMs).toBe(18);
    expect(tuning.qualityMediumMs).toBe(25);
    expect(tuning.qualityPercentile).toBe(95);
    expect(tuning.qualitySettleMs).toBe(1000);
    expect(tuning.qualityTestMs).toBe(2000);
  });
});

describe('percentile', () => {
  it('takes the nearest rank', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(values, 95)).toBe(95);
    expect(percentile(values, 50)).toBe(50);
    expect(percentile(values, 100)).toBe(100);
    expect(percentile([7], 95)).toBe(7);
  });

  it('ignores the input order', () => {
    expect(percentile([30, 10, 20, 40], 50)).toBe(20);
  });

  it('leaves out values that are not frame times', () => {
    expect(percentile([16, Number.NaN, -4, Number.POSITIVE_INFINITY, 17], 100)).toBe(17);
  });

  it('has nothing to say about no values', () => {
    expect(percentile([], 95)).toBeNull();
    expect(percentile([Number.NaN], 95)).toBeNull();
  });
});

describe('pickQuality', () => {
  it('picks high up to 18 ms at the 95th percentile, inclusive', () => {
    expect(pickQuality(frames(16.7))).toEqual({ quality: 'high', ms: 16.7 });
    expect(pickQuality(frames(18))).toEqual({ quality: 'high', ms: 18 });
  });

  it('picks medium above 18 ms and up to 25 ms', () => {
    expect(pickQuality(frames(18.01))?.quality).toBe('medium');
    expect(pickQuality(frames(25))).toEqual({ quality: 'medium', ms: 25 });
  });

  it('picks low above 25 ms', () => {
    expect(pickQuality(frames(25.01))?.quality).toBe('low');
    expect(pickQuality(frames(40))?.quality).toBe('low');
  });

  it('judges the 95th percentile: a few slow frames don’t count, more than 5% do', () => {
    // 6 of 120 frames is 5%: the 114th fastest is still a fast one.
    expect(pickQuality(frames(16.7, 6, 50))?.quality).toBe('high');
    expect(pickQuality(frames(16.7, 7, 50))).toEqual({ quality: 'low', ms: 50 });
    expect(pickQuality(frames(16.7, 7, 22))?.quality).toBe('medium');
  });

  it('follows the tuning', () => {
    const strict = { qualityPercentile: 95, qualityHighMs: 10, qualityMediumMs: 12 };
    expect(pickQuality(frames(11), strict)?.quality).toBe('medium');
    expect(pickQuality(frames(13), strict)?.quality).toBe('low');
  });

  it('has no pick without frames', () => {
    expect(pickQuality([])).toBeNull();
  });
});

describe('qualityInUse', () => {
  const measured = (quality: QualityState['measured']): QualityState => ({
    measured: quality,
    measuredMs: 20,
    forced: null,
  });

  it('keeps every effect on while the test runs', () => {
    expect(qualityInUse(initialQuality)).toBe('high');
  });

  it('keeps every effect on during the test even when a setting is forced', () => {
    expect(qualityInUse({ ...initialQuality, forced: 'low' })).toBe('high');
  });

  it('uses the test’s pick once it is in', () => {
    expect(qualityInUse(measured('medium'))).toBe('medium');
    expect(qualityInUse(measured('low'))).toBe('low');
  });

  it('lets a forced setting win over the test’s pick', () => {
    expect(qualityInUse({ ...measured('high'), forced: 'low' })).toBe('low');
    expect(qualityInUse({ ...measured('low'), forced: 'high' })).toBe('high');
  });
});

describe('reduceQuality', () => {
  it('starts with no pick and nothing forced', () => {
    expect(initialQuality).toEqual({ measured: null, measuredMs: null, forced: null });
  });

  it('holds the test’s pick and the frame time it came from', () => {
    const next = reduceQuality(initialQuality, {
      type: 'quality/measured',
      frameTimesMs: frames(22),
    });
    expect(next).toEqual({ measured: 'medium', measuredMs: 22, forced: null });
  });

  it('takes the test’s report once per launch', () => {
    const first = reduceQuality(initialQuality, {
      type: 'quality/measured',
      frameTimesMs: frames(30),
    });
    const second = reduceQuality(first, { type: 'quality/measured', frameTimesMs: frames(16) });
    expect(second).toBe(first);
  });

  it('ignores a report with nothing to judge, so the test can still report', () => {
    expect(reduceQuality(initialQuality, { type: 'quality/measured', frameTimesMs: [] })).toBe(
      initialQuality,
    );
  });

  it('forces a setting, and hands back to the test’s pick with null', () => {
    const picked = reduceQuality(initialQuality, {
      type: 'quality/measured',
      frameTimesMs: frames(16),
    });
    const forced = reduceQuality(picked, { type: 'quality/force', quality: 'low' });
    expect(forced).toMatchObject({ measured: 'high', forced: 'low' });
    expect(qualityInUse(forced)).toBe('low');
    const auto = reduceQuality(forced, { type: 'quality/force', quality: null });
    expect(auto.forced).toBeNull();
    expect(qualityInUse(auto)).toBe('high');
  });

  it('keeps a setting forced during the test, for use once the test is in', () => {
    const forced = reduceQuality(initialQuality, { type: 'quality/force', quality: 'medium' });
    const picked = reduceQuality(forced, { type: 'quality/measured', frameTimesMs: frames(40) });
    expect(picked).toEqual({ measured: 'low', measuredMs: 40, forced: 'medium' });
    expect(qualityInUse(picked)).toBe('medium');
  });
});
