import { type ErrorSource, recordError } from '@/lib/error-log';

// Global errors (window.onerror, unhandledrejection) take the game to the same
// "tap to restart" screen as a render crash. The error boundary listens here.

export interface CrashReporter {
  report(source: ErrorSource, error: unknown): void;
  isCrashed(): boolean;
  subscribe(listener: () => void): () => void;
  install(target: EventTarget): () => void;
}

type RecordError = (source: ErrorSource, error: unknown) => void;

// Chrome reports this through window.onerror although nothing is broken.
const benignMessages = [/ResizeObserver loop/];

export function isBenignError(message: unknown): boolean {
  return typeof message === 'string' && benignMessages.some((pattern) => pattern.test(message));
}

export function createCrashReporter(
  record: RecordError = (source, error) => recordError(source, error),
): CrashReporter {
  let crashed = false;
  const listeners = new Set<() => void>();

  const report = (source: ErrorSource, error: unknown) => {
    record(source, error);
    crashed = true;
    for (const listener of listeners) listener();
  };

  return {
    report,
    isCrashed: () => crashed,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    install(target) {
      const onError = (event: Event) => {
        const { message, error } = event as ErrorEvent;
        if (isBenignError(message)) return;
        report('error', error ?? message);
      };
      const onRejection = (event: Event) => {
        report('unhandledrejection', (event as PromiseRejectionEvent).reason);
      };
      target.addEventListener('error', onError);
      target.addEventListener('unhandledrejection', onRejection);
      return () => {
        target.removeEventListener('error', onError);
        target.removeEventListener('unhandledrejection', onRejection);
      };
    },
  };
}

export const crashReporter = createCrashReporter();
