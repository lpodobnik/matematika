import { describe, expect, it, vi } from 'vitest';
import { createCrashReporter, isBenignError } from '@/app/crash';

function errorEvent(message: string, error?: unknown): Event {
  return Object.assign(new Event('error'), { message, error });
}

function rejectionEvent(reason: unknown): Event {
  return Object.assign(new Event('unhandledrejection'), { reason });
}

describe('crash reporter', () => {
  it('records a window error and tells subscribers', () => {
    const record = vi.fn();
    const reporter = createCrashReporter(record);
    const listener = vi.fn();
    reporter.subscribe(listener);
    const target = new EventTarget();
    reporter.install(target);

    const error = new Error('boom');
    target.dispatchEvent(errorEvent('Uncaught Error: boom', error));

    expect(record).toHaveBeenCalledWith('error', error);
    expect(listener).toHaveBeenCalledOnce();
    expect(reporter.isCrashed()).toBe(true);
  });

  it('records an unhandled rejection and tells subscribers', () => {
    const record = vi.fn();
    const reporter = createCrashReporter(record);
    const listener = vi.fn();
    reporter.subscribe(listener);
    const target = new EventTarget();
    reporter.install(target);

    target.dispatchEvent(rejectionEvent('init failed'));

    expect(record).toHaveBeenCalledWith('unhandledrejection', 'init failed');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('falls back to the message when the error object is missing', () => {
    const record = vi.fn();
    const reporter = createCrashReporter(record);
    const target = new EventTarget();
    reporter.install(target);
    target.dispatchEvent(errorEvent('Script error.'));
    expect(record).toHaveBeenCalledWith('error', 'Script error.');
  });

  it('ignores the benign ResizeObserver loop error', () => {
    const record = vi.fn();
    const reporter = createCrashReporter(record);
    const target = new EventTarget();
    reporter.install(target);
    target.dispatchEvent(
      errorEvent('ResizeObserver loop completed with undelivered notifications.'),
    );
    expect(record).not.toHaveBeenCalled();
    expect(reporter.isCrashed()).toBe(false);
    expect(isBenignError('ResizeObserver loop limit exceeded')).toBe(true);
    expect(isBenignError('TypeError: x is undefined')).toBe(false);
  });

  it('stops listening when uninstalled or unsubscribed', () => {
    const record = vi.fn();
    const reporter = createCrashReporter(record);
    const listener = vi.fn();
    const unsubscribe = reporter.subscribe(listener);
    const target = new EventTarget();
    const uninstall = reporter.install(target);
    uninstall();
    target.dispatchEvent(errorEvent('later', new Error('later')));
    expect(record).not.toHaveBeenCalled();

    unsubscribe();
    reporter.report('error', new Error('direct'));
    expect(listener).not.toHaveBeenCalled();
  });
});
