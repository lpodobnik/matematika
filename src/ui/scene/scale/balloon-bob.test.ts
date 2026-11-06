import { describe, expect, it } from 'vitest';
import { balloonBob, bobOffset, bobPhase, stringStretch } from '@/ui/scene/scale/balloon-bob';

describe("a balloon's bob (story 1.15)", () => {
  it('rises and sinks a few scene units over about 2 s', () => {
    const offsets = Array.from({ length: 200 }, (_, i) => bobOffset(i * 10, 0, false));
    expect(Math.max(...offsets)).toBeCloseTo(balloonBob.amplitude, 1);
    expect(Math.min(...offsets)).toBeCloseTo(-balloonBob.amplitude, 1);
    expect(balloonBob.amplitude).toBeGreaterThanOrEqual(2);
    expect(balloonBob.amplitude).toBeLessThanOrEqual(8);
    expect(balloonBob.periodMs).toBeGreaterThanOrEqual(1500);
    expect(balloonBob.periodMs).toBeLessThanOrEqual(2500);
    // It comes back to where it was after one period, rising first.
    expect(bobOffset(balloonBob.periodMs, 0.7, false)).toBeCloseTo(bobOffset(0, 0.7, false));
    expect(bobOffset(balloonBob.periodMs / 4, 0, false)).toBeCloseTo(-balloonBob.amplitude);
  });

  it('stays still under reduced motion, and before the clock is known', () => {
    for (const t of [0, 250, 500, 1234]) expect(bobOffset(t, 1, true)).toBe(0);
    expect(bobOffset(Number.NaN, 0, false)).toBe(0);
  });

  it('gives each key its own phase, the same every time', () => {
    expect(bobPhase('left-float-0')).toBe(bobPhase('left-float-0'));
    expect(bobPhase('left-float-0')).not.toBe(bobPhase('left-spring-0'));
    for (const key of ['left-spring-0', 'right-float-3', 'tray-float']) {
      expect(bobPhase(key)).toBeGreaterThanOrEqual(0);
      expect(bobPhase(key)).toBeLessThan(2 * Math.PI);
    }
  });

  it('stretches the string so it reaches the balloon and stays on the pan', () => {
    const knot = -40;
    // Up 4: the string runs from the pan to 44 above it.
    expect(knot * stringStretch(knot, -4)).toBeCloseTo(-44);
    expect(knot * stringStretch(knot, 4)).toBeCloseTo(-36);
    expect(stringStretch(knot, 0)).toBe(1);
    expect(stringStretch(0, 4)).toBe(1);
  });
});
