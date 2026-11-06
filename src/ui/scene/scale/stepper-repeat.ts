// The tray's − and + buttons repeat while held (architecture, Balance moves: "a stepper,
// − and + buttons, which repeat when held"). A small controller with no React or Pixi in
// it, and timers handed in, so it can be tested on its own:
//
// - A press steps once at once, then again after `delayMs`, then every `intervalMs`.
// - It stops on release (pointer up, up outside, cancel), on `cancel` (blur, page hidden,
//   unmount), or when a step reports that it did nothing (the number reached its end).

export interface Timers {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface RepeatOptions {
  delayMs: number;
  intervalMs: number;
  /** One step; false when it did nothing, which stops the repeat. */
  onStep(): boolean;
  timers?: Timers;
}

export interface Repeat {
  press(pointerId: number): void;
  release(pointerId: number): void;
  cancel(): void;
  held(): boolean;
}

const realTimers: Timers = {
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export function createRepeat(options: RepeatOptions): Repeat {
  const { delayMs, intervalMs, onStep, timers = realTimers } = options;
  let press: { pointerId: number; timer: unknown } | null = null;

  const stop = () => {
    if (!press) return;
    timers.clearTimeout(press.timer);
    press = null;
  };
  const schedule = (ms: number) => {
    if (!press) return;
    const current = press;
    current.timer = timers.setTimeout(() => {
      if (press !== current) return;
      if (onStep()) schedule(intervalMs);
      else stop();
    }, ms);
  };

  return {
    press(pointerId) {
      if (press) return;
      press = { pointerId, timer: null };
      if (onStep()) schedule(delayMs);
      else stop();
    },
    release(pointerId) {
      if (press?.pointerId === pointerId) stop();
    },
    cancel: stop,
    held: () => press !== null,
  };
}
