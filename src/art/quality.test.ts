import { describe, expect, it } from 'vitest';
import { effectsAt, effectsOffOrder } from '@/art/quality';
import { initialQuality, qualities, qualityInUse, reduceQuality } from '@/store/quality';

describe('effectsAt', () => {
  it('runs the particles (the steam) at high and medium, and not at low', () => {
    expect(effectsAt('high').particles).toBe(true);
    expect(effectsAt('medium').particles).toBe(true);
    expect(effectsAt('low').particles).toBe(false);
  });

  it('keeps every effect at high and none at low', () => {
    expect(effectsAt('high')).toEqual({ bloom: true, particles: true, shaders: true });
    expect(effectsAt('low')).toEqual({ bloom: false, particles: false, shaders: false });
  });

  it('switches effects off in a fixed order: bloom, then particles, then shaders', () => {
    expect(effectsOffOrder).toEqual(['bloom', 'particles', 'shaders']);
    expect(effectsAt('medium')).toEqual({ bloom: false, particles: true, shaders: true });
    for (const quality of qualities) {
      const on = effectsOffOrder.map((effect) => effectsAt(quality)[effect]);
      // Once one effect is on, every later one is on too.
      const firstOn = on.indexOf(true);
      if (firstOn >= 0) expect(on.slice(firstOn).every(Boolean), quality).toBe(true);
    }
  });

  it('never keeps more effects at a lower setting', () => {
    const count = (quality: (typeof qualities)[number]) =>
      Object.values(effectsAt(quality)).filter(Boolean).length;
    expect(count('high')).toBeGreaterThan(count('medium'));
    expect(count('medium')).toBeGreaterThan(count('low'));
  });
});

describe('the steam and the frame-time test', () => {
  const slowDevice = Array(120).fill(30);
  const fastDevice = Array(120).fill(16.7);

  it('runs while the test runs, so the test times it', () => {
    expect(effectsAt(qualityInUse(initialQuality)).particles).toBe(true);
  });

  it('stops on a slow device once the test is in', () => {
    const state = reduceQuality(initialQuality, {
      type: 'quality/measured',
      frameTimesMs: slowDevice,
    });
    expect(effectsAt(qualityInUse(state)).particles).toBe(false);
  });

  it('keeps running on a fast device, until low is forced', () => {
    const state = reduceQuality(initialQuality, {
      type: 'quality/measured',
      frameTimesMs: fastDevice,
    });
    expect(effectsAt(qualityInUse(state)).particles).toBe(true);
    const forced = reduceQuality(state, { type: 'quality/force', quality: 'low' });
    expect(effectsAt(qualityInUse(forced)).particles).toBe(false);
  });
});
