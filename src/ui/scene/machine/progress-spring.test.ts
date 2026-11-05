import { MotionGlobalConfig, processFrame } from 'motion';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createProgressSpring,
  type ProgressSpring,
  progressSpringOptions,
} from '@/ui/scene/machine/progress-spring';

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

describe('createProgressSpring', () => {
  let seen: number[];
  let spring: ProgressSpring;

  beforeEach(() => {
    seen = [];
    spring = createProgressSpring((progress) => seen.push(progress));
  });

  afterEach(() => spring.destroy());

  it('is a spring, starting stopped', async () => {
    expect(progressSpringOptions.stiffness).toBeGreaterThan(0);
    await runFrames(5);
    expect(spring.current()).toBe(0);
    expect(seen).toEqual([]);
  });

  it('moves toward a new progress over many frames and settles there', async () => {
    spring.setTarget(0.2);
    await runFrames(3);
    expect(spring.current()).toBeGreaterThan(0);
    expect(spring.current()).toBeLessThan(0.2);
    await runFrames(300);
    expect(spring.current()).toBeCloseTo(0.2, 3);
  });

  it('never draws past fully open, even as it overshoots toward 1', async () => {
    spring.setTarget(1);
    await runFrames(300);
    expect(Math.max(...seen)).toBe(1);
    expect(seen.every((progress) => progress >= 0 && progress <= 1)).toBe(true);
    expect(spring.current()).toBeCloseTo(1, 3);
  });

  it('stops reporting once destroyed', async () => {
    spring.setTarget(0.9);
    await runFrames(3);
    spring.destroy();
    const count = seen.length;
    await runFrames(20);
    expect(seen.length).toBe(count);
  });
});
