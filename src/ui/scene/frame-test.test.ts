import { describe, expect, it, vi } from 'vitest';
import { tuning } from '@/config/tuning';
import type { VisibilitySource } from '@/ui/scene/context-loss';
import { createFrameTimer, type FrameSource, runFrameTest } from '@/ui/scene/frame-test';

const timing = { settleMs: 1000, durationMs: 2000 };

/** Feeds frames at a steady step from `start` until the timer answers or `until` passes. */
function feed(
  timer: ReturnType<typeof createFrameTimer>,
  start: number,
  stepMs: number,
  until: number,
): { result: number[] | null; at: number } {
  for (let now = start; now <= until; now += stepMs) {
    const result = timer.frame(now);
    if (result) return { result, at: now };
  }
  return { result: null, at: until };
}

describe('createFrameTimer', () => {
  it('uses the tuning’s timing by default: 1 s to settle, then 2 s of frames', () => {
    const timer = createFrameTimer();
    const { result, at } = feed(timer, 500, 10, 10_000);
    expect(at).toBe(500 + tuning.qualitySettleMs + tuning.qualityTestMs);
    expect(result).toHaveLength(tuning.qualityTestMs / 10);
  });

  it('times nothing in the first second after the first frame', () => {
    const timer = createFrameTimer(timing);
    timer.frame(0);
    // A spike while the scene mounts and uploads textures.
    expect(timer.frame(400)).toBeNull();
    const { result } = feed(timer, 1000, 20, 5000);
    expect(result).not.toBeNull();
    expect(result?.every((ms) => ms === 20)).toBe(true);
    expect(result).toHaveLength(100);
  });

  it('times every frame of the next 2 seconds, slow ones included', () => {
    const timer = createFrameTimer(timing);
    timer.frame(0);
    timer.frame(1000);
    timer.frame(1016);
    timer.frame(1050);
    expect(timer.frame(2500)).toBeNull();
    expect(timer.frame(3010)).toEqual([16, 34, 1450, 510]);
  });

  it('answers once, then stays quiet', () => {
    const timer = createFrameTimer(timing);
    const { result, at } = feed(timer, 0, 16, 10_000);
    expect(result).not.toBeNull();
    expect(timer.frame(at + 16)).toBeNull();
  });

  it('ignores a frame with no time', () => {
    const timer = createFrameTimer(timing);
    expect(timer.frame(Number.NaN)).toBeNull();
    const { at } = feed(timer, 100, 10, 10_000);
    expect(at).toBe(3100);
  });

  it('starts over from a frame that stalled right across the window, so it still ends', () => {
    const timer = createFrameTimer(timing);
    timer.frame(0);
    expect(timer.frame(5000)).toBeNull();
    const { result, at } = feed(timer, 5016, 16, 20_000);
    expect(at).toBe(5000 + 3008);
    expect(result?.every((ms) => ms === 16)).toBe(true);
  });

  it('starts over on restart: the next frame is the first again', () => {
    const timer = createFrameTimer(timing);
    feed(timer, 0, 10, 2000);
    timer.restart();
    const { result, at } = feed(timer, 60_000, 10, 70_000);
    expect(at).toBe(63_000);
    expect(result).toHaveLength(200);
    expect(result?.every((ms) => ms === 10)).toBe(true);
  });
});

type FrameCallback = Parameters<FrameSource['add']>[0];

/** Like Pixi's ticker, it hands callbacks the previous frame's time and the time since. */
class FakeTicker implements FrameSource {
  callbacks = new Set<FrameCallback>();
  lastTime = 0;
  add(callback: FrameCallback) {
    this.callbacks.add(callback);
  }
  remove(callback: FrameCallback) {
    this.callbacks.delete(callback);
  }
  tick(now: number) {
    const tick = { lastTime: this.lastTime, elapsedMS: now - this.lastTime };
    for (const callback of [...this.callbacks]) callback(tick);
    this.lastTime = now;
  }
  run(start: number, stepMs: number, until: number) {
    for (let now = start; now <= until; now += stepMs) this.tick(now);
  }
}

class FakePage extends EventTarget implements VisibilitySource {
  visibilityState: DocumentVisibilityState = 'visible';
  show(state: DocumentVisibilityState) {
    this.visibilityState = state;
    this.dispatchEvent(new Event('visibilitychange'));
  }
}

function setup() {
  const ticker = new FakeTicker();
  const page = new FakePage();
  const done = vi.fn<(frameTimesMs: number[]) => void>();
  const stop = runFrameTest(ticker, page, done, timing);
  return { ticker, page, done, stop };
}

/** The frame times the test reported (it reports once). */
function reported(done: ReturnType<typeof setup>['done']): number[] {
  const [call] = done.mock.calls;
  if (!call) throw new Error('nothing reported');
  return call[0];
}

describe('runFrameTest', () => {
  it('reports the frame times once, and lets go of the ticker', () => {
    const { ticker, done } = setup();
    ticker.run(0, 16, 4000);
    expect(done).toHaveBeenCalledOnce();
    const frameTimes = reported(done);
    expect(frameTimes.length).toBeGreaterThan(100);
    expect(frameTimes.every((ms) => ms === 16)).toBe(true);
    expect(ticker.callbacks.size).toBe(0);
  });

  it('times each frame as it is drawn, not the one before', () => {
    const { ticker, done } = setup();
    ticker.run(0, 20, 1000);
    ticker.tick(1100);
    ticker.run(1120, 20, 4000);
    // The 100 ms frame ends at 1100, inside the window, so it is timed.
    expect(reported(done)).toContain(100);
    expect(reported(done)[0]).toBe(100);
  });

  it('starts over when the page is hidden, so the gap is not a slow frame', () => {
    const { ticker, page, done } = setup();
    ticker.run(0, 16, 2000);
    page.show('hidden');
    // No frames while hidden; then the page is back 30 s later.
    page.show('visible');
    ticker.run(32_000, 16, 33_000);
    expect(done).not.toHaveBeenCalled();
    ticker.run(33_008, 16, 36_000);
    expect(done).toHaveBeenCalledOnce();
    expect(reported(done).every((ms) => ms === 16)).toBe(true);
  });

  it('times no frames drawn while the page is hidden', () => {
    const { ticker, page, done } = setup();
    page.show('hidden');
    ticker.run(0, 1000, 10_000);
    expect(done).not.toHaveBeenCalled();
    page.show('visible');
    ticker.run(10_016, 16, 14_000);
    expect(done).toHaveBeenCalledOnce();
    expect(reported(done).every((ms) => ms === 16)).toBe(true);
  });

  it('stops when asked, with nothing reported', () => {
    const { ticker, page, done, stop } = setup();
    stop();
    stop();
    expect(ticker.callbacks.size).toBe(0);
    ticker.run(0, 16, 4000);
    page.show('hidden');
    expect(done).not.toHaveBeenCalled();
  });
});
