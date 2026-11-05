import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clockTickMs, startClock } from '@/app/clock';
import type { Action } from '@/store/actions';

describe('startClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches clock/tick about once a second until stopped', () => {
    const dispatched: Action[] = [];
    const stop = startClock(globalThis, (action) => dispatched.push(action));
    expect(clockTickMs).toBe(1000);
    vi.advanceTimersByTime(3_500);
    expect(dispatched).toEqual([
      { type: 'clock/tick' },
      { type: 'clock/tick' },
      { type: 'clock/tick' },
    ]);
    stop();
    vi.advanceTimersByTime(5_000);
    expect(dispatched).toHaveLength(3);
  });

  it('ticks at another rate when asked', () => {
    const dispatch = vi.fn();
    const stop = startClock(globalThis, dispatch, 250);
    vi.advanceTimersByTime(1_000);
    expect(dispatch).toHaveBeenCalledTimes(4);
    stop();
  });
});
