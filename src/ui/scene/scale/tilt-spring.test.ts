import { MotionGlobalConfig, processFrame } from 'motion';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { createTiltSpring, type TiltSpring, tiltSpringOptions } from '@/ui/scene/scale/tilt-spring';

// Motion on a clock the test controls: each frame is 1/60 s, processed by hand.
let now = 0;

async function runFrames(count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    now += 1000 / 60;
    processFrame(now);
    await Promise.resolve();
  }
}

beforeAll(() => {
  MotionGlobalConfig.useManualTiming = true;
});

afterAll(() => {
  MotionGlobalConfig.useManualTiming = false;
});

describe('createTiltSpring', () => {
  let seen: number[];
  let spring: TiltSpring;

  beforeEach(() => {
    seen = [];
    spring = createTiltSpring((tilt) => seen.push(tilt));
  });

  afterEach(() => spring.destroy());

  it('is a spring', () => {
    expect(tiltSpringOptions.stiffness).toBeGreaterThan(0);
    expect(tiltSpringOptions.damping).toBeGreaterThan(0);
  });

  it('starts level and reports nothing until a target is set', async () => {
    await runFrames(5);
    expect(spring.current()).toBe(0);
    expect(seen).toEqual([]);
  });

  it('swings toward the target over many frames, overshoots a little and settles there', async () => {
    spring.setTarget(-5);
    await runFrames(4);
    const early = spring.current();
    expect(early).toBeLessThan(0);
    expect(early).toBeGreaterThan(-5);
    await runFrames(240);
    expect(seen.length).toBeGreaterThan(10);
    expect(Math.min(...seen)).toBeLessThan(-5);
    expect(Math.min(...seen)).toBeGreaterThan(-7);
    expect(spring.current()).toBeCloseTo(-5, 2);
  });

  it('never draws beyond the clamp: a swing from level to 15° stops at 15°', async () => {
    spring.setTarget(tuning.tiltMax);
    for (let i = 0; i < 300; i += 1) {
      await runFrames(1);
      expect(Math.abs(spring.current())).toBeLessThanOrEqual(tuning.tiltMax);
    }
    expect(Math.max(...seen)).toBe(tuning.tiltMax);
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(0);
    expect(spring.current()).toBeCloseTo(tuning.tiltMax, 2);
  });

  it('never draws beyond the clamp: a swing from −15° to 15° stays within ±15°', async () => {
    spring.setTarget(-tuning.tiltMax);
    await runFrames(300);
    expect(spring.current()).toBeCloseTo(-tuning.tiltMax, 2);
    spring.setTarget(tuning.tiltMax);
    await runFrames(300);
    expect(seen.length).toBeGreaterThan(20);
    expect(Math.max(...seen)).toBe(tuning.tiltMax);
    expect(Math.min(...seen)).toBe(-tuning.tiltMax);
    expect(seen.every((tilt) => Math.abs(tilt) <= tuning.tiltMax)).toBe(true);
    expect(spring.current()).toBeCloseTo(tuning.tiltMax, 2);
  });

  it('keeps the springy swing inside the range', async () => {
    spring.setTarget(10);
    await runFrames(300);
    const peak = Math.max(...seen);
    expect(peak).toBeGreaterThan(10);
    expect(peak).toBeLessThan(tuning.tiltMax);
    expect(spring.current()).toBeCloseTo(10, 2);
  });

  it('retargets mid-swing without jumping', async () => {
    spring.setTarget(15);
    await runFrames(10);
    const before = spring.current();
    spring.setTarget(0);
    await runFrames(1);
    expect(Math.abs(spring.current() - before)).toBeLessThan(3);
    await runFrames(300);
    expect(spring.current()).toBeCloseTo(0, 2);
  });

  it('stops reporting once destroyed', async () => {
    spring.setTarget(10);
    await runFrames(3);
    spring.destroy();
    const count = seen.length;
    await runFrames(20);
    expect(seen.length).toBe(count);
  });
});
