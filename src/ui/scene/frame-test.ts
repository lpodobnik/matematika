// The quality setting's frame-time test (architecture, Performance): with all effects on,
// it waits `tuning.qualitySettleMs` after the scene's first frame, so mount and
// texture-upload spikes don't count, then times every frame for `tuning.qualityTestMs` and
// hands the frame times over. The store picks the setting from them (store/quality.ts).

import { tuning } from '@/config/tuning';
import type { VisibilitySource } from '@/ui/scene/context-loss';

export interface FrameTestTiming {
  settleMs: number;
  durationMs: number;
}

const defaultTiming: FrameTestTiming = {
  settleMs: tuning.qualitySettleMs,
  durationMs: tuning.qualityTestMs,
};

export interface FrameTimer {
  /**
   * One frame drawn at `now` (ms). Returns every frame time timed once the test is over,
   * and null before that and after.
   */
  frame(now: number): number[] | null;
  /** Starts over: the next frame counts as the first. */
  restart(): void;
}

/**
 * Times every frame that starts inside the window from `settleMs` to `settleMs + durationMs`
 * after the first frame. The first frame to end at or past the window's end is the last one
 * timed, and finishes the test. A window with no frame timed in it (one frame stalled right
 * across it) starts the test over from that frame, so the test still ends with a pick.
 */
export function createFrameTimer(timing: FrameTestTiming = defaultTiming): FrameTimer {
  let first: number | null = null;
  let last = 0;
  let done = false;
  let samples: number[] = [];

  return {
    frame(now) {
      if (done || !Number.isFinite(now)) return null;
      if (first === null) {
        first = now;
        last = now;
        return null;
      }
      const from = first + timing.settleMs;
      const until = from + timing.durationMs;
      if (last >= from) samples.push(now - last);
      last = now;
      if (now < until) return null;
      if (samples.length === 0) {
        first = now;
        return null;
      }
      done = true;
      return samples;
    },
    restart() {
      first = null;
      done = false;
      samples = [];
    },
  };
}

/**
 * The part of Pixi's ticker the test uses. While its callbacks run, `lastTime` is still the
 * previous frame's time and `elapsedMS` the raw time since then, so the frame's own time is
 * their sum.
 */
export interface FrameTick {
  lastTime: number;
  elapsedMS: number;
}

export interface FrameSource {
  add(callback: (ticker: FrameTick) => void): unknown;
  remove(callback: (ticker: FrameTick) => void): unknown;
}

/**
 * Runs the test on the ticker and calls `done` once with the frame times. A hidden page
 * draws no frames (or throttled ones), so the gap would count as one slow frame: hiding the
 * page starts the test over, frames drawn while hidden don't count, and it settles again once
 * the page is visible. Returns a function that stops it.
 */
export function runFrameTest(
  ticker: FrameSource,
  page: VisibilitySource,
  done: (frameTimesMs: number[]) => void,
  timing: FrameTestTiming = defaultTiming,
): () => void {
  const timer = createFrameTimer(timing);
  let running = true;

  const onFrame = ({ lastTime, elapsedMS }: FrameTick) => {
    if (page.visibilityState === 'hidden') {
      timer.restart();
      return;
    }
    const frameTimes = timer.frame(lastTime + elapsedMS);
    if (!frameTimes) return;
    stop();
    done(frameTimes);
  };
  const onVisibility = () => {
    if (page.visibilityState === 'hidden') timer.restart();
  };

  function stop() {
    if (!running) return;
    running = false;
    ticker.remove(onFrame);
    page.removeEventListener('visibilitychange', onVisibility);
  }

  ticker.add(onFrame);
  page.addEventListener('visibilitychange', onVisibility);
  return stop;
}
