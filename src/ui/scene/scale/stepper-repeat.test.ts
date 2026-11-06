import { describe, expect, it } from 'vitest';
import { createRepeat, type Timers } from '@/ui/scene/scale/stepper-repeat';

/** Timers that run only when the test moves the clock on. */
function fakeTimers() {
  let now = 0;
  let next = 0;
  const pending = new Map<number, { at: number; callback: () => void }>();
  const timers: Timers = {
    setTimeout(callback, ms) {
      next += 1;
      pending.set(next, { at: now + ms, callback });
      return next;
    },
    clearTimeout(handle) {
      pending.delete(handle as number);
    },
  };
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const due = [...pending.entries()]
        .filter(([, timer]) => timer.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      pending.delete(due[0]);
      now = due[1].at;
      due[1].callback();
    }
    now = end;
  };
  return { timers, advance, pending };
}

function counting(limit = Number.POSITIVE_INFINITY) {
  let steps = 0;
  return {
    onStep: () => {
      if (steps >= limit) return false;
      steps += 1;
      return steps < limit;
    },
    steps: () => steps,
  };
}

describe('createRepeat', () => {
  it('steps once on a press, then after the delay, then at every interval while held', () => {
    const clock = fakeTimers();
    const count = counting();
    const repeat = createRepeat({
      delayMs: 450,
      intervalMs: 110,
      onStep: count.onStep,
      timers: clock.timers,
    });
    repeat.press(1);
    expect(count.steps()).toBe(1);
    clock.advance(449);
    expect(count.steps()).toBe(1);
    clock.advance(1);
    expect(count.steps()).toBe(2);
    clock.advance(330);
    expect(count.steps()).toBe(5);
    expect(repeat.held()).toBe(true);
  });

  it('stops on release of the same pointer, not of another', () => {
    const clock = fakeTimers();
    const count = counting();
    const repeat = createRepeat({
      delayMs: 450,
      intervalMs: 110,
      onStep: count.onStep,
      timers: clock.timers,
    });
    repeat.press(1);
    repeat.release(2);
    clock.advance(450);
    expect(count.steps()).toBe(2);
    repeat.release(1);
    clock.advance(1000);
    expect(count.steps()).toBe(2);
    expect(repeat.held()).toBe(false);
    expect(clock.pending.size).toBe(0);
  });

  it('stops on cancel (blur, a hidden page, unmount)', () => {
    const clock = fakeTimers();
    const count = counting();
    const repeat = createRepeat({
      delayMs: 450,
      intervalMs: 110,
      onStep: count.onStep,
      timers: clock.timers,
    });
    repeat.press(1);
    repeat.cancel();
    clock.advance(1000);
    expect(count.steps()).toBe(1);
  });

  it('stops by itself once a step does nothing (the number reached 1 or 99)', () => {
    const clock = fakeTimers();
    const count = counting(3);
    const repeat = createRepeat({
      delayMs: 450,
      intervalMs: 110,
      onStep: count.onStep,
      timers: clock.timers,
    });
    repeat.press(1);
    clock.advance(5000);
    expect(count.steps()).toBe(3);
    expect(repeat.held()).toBe(false);
  });

  it('ignores a second press while held, and can be pressed again after a release', () => {
    const clock = fakeTimers();
    const count = counting();
    const repeat = createRepeat({
      delayMs: 450,
      intervalMs: 110,
      onStep: count.onStep,
      timers: clock.timers,
    });
    repeat.press(1);
    repeat.press(2);
    expect(count.steps()).toBe(1);
    repeat.release(1);
    repeat.press(2);
    expect(count.steps()).toBe(2);
  });
});
