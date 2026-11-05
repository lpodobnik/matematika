import { describe, expect, it } from 'vitest';
import {
  describeError,
  errorLogKey,
  errorLogLimit,
  readErrors,
  recordError,
} from '@/lib/error-log';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    data,
  };
}

const now = new Date('2026-11-05T21:00:00.000Z');

describe('recordError', () => {
  it('writes the error to matematika:errors', () => {
    const storage = memoryStorage();
    recordError('render', new TypeError('boom'), { storage, now, componentStack: '\n  at App' });
    expect(errorLogKey).toBe('matematika:errors');
    expect(readErrors(storage)).toEqual([
      {
        at: '2026-11-05T21:00:00.000Z',
        source: 'render',
        message: 'TypeError: boom',
        stack: expect.stringContaining('boom'),
        componentStack: '\n  at App',
      },
    ]);
  });

  it('keeps only the last 50 errors, dropping the oldest', () => {
    const storage = memoryStorage();
    for (let i = 0; i < errorLogLimit + 5; i++) {
      recordError('error', `error ${i}`, { storage, now });
    }
    const entries = readErrors(storage);
    expect(entries).toHaveLength(50);
    expect(entries[0]?.message).toBe('error 5');
    expect(entries.at(-1)?.message).toBe('error 54');
  });

  it('starts a fresh log when the stored one is corrupt', () => {
    const storage = memoryStorage({ [errorLogKey]: '{not json' });
    recordError('unhandledrejection', 'late', { storage, now });
    expect(readErrors(storage).map((entry) => entry.message)).toEqual(['late']);
  });

  it('never throws when storage fails or is missing', () => {
    const broken = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(() => recordError('error', 'x', { storage: broken, now })).not.toThrow();
    expect(() => recordError('error', 'x', { storage: null, now })).not.toThrow();
    expect(readErrors(broken)).toEqual([]);
  });
});

describe('describeError', () => {
  it('describes errors, strings and other values', () => {
    expect(describeError(new RangeError('too far')).message).toBe('RangeError: too far');
    expect(describeError('plain')).toEqual({ message: 'plain' });
    expect(describeError({ code: 7 })).toEqual({ message: '{"code":7}' });
    expect(describeError(undefined)).toEqual({ message: 'undefined' });
  });

  it('clips very long text', () => {
    expect(describeError('a'.repeat(10_000)).message.length).toBeLessThanOrEqual(4001);
  });
});
