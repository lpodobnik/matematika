import { type ErrorSource, recordError } from '@/lib/error-log';

// Global errors (window.onerror, unhandledrejection) and render errors inside the Pixi
// tree take the game to the same "tap to restart" screen as a render crash in the DOM
// tree. The top-level error boundary listens here. It lives in lib, not app, so that
// ui/scene can report to it without depending on app.

export interface CrashReporter {
  report(source: ErrorSource, error: unknown, componentStack?: string): void;
  isCrashed(): boolean;
  subscribe(listener: () => void): () => void;
  install(target: EventTarget): () => void;
}

type RecordError = (source: ErrorSource, error: unknown, componentStack?: string) => void;

// Chrome reports this through window.onerror although nothing is broken.
const benignMessages = [/ResizeObserver loop/];

export function isBenignError(message: unknown): boolean {
  return typeof message === 'string' && benignMessages.some((pattern) => pattern.test(message));
}

export function createCrashReporter(
  record: RecordError = (source, error, componentStack) =>
    recordError(source, error, componentStack ? { componentStack } : {}),
): CrashReporter {
  let crashed = false;
  const listeners = new Set<() => void>();

  const report = (source: ErrorSource, error: unknown, componentStack?: string) => {
    if (componentStack) record(source, error, componentStack);
    else record(source, error);
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
