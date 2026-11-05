import { describe, expect, it } from 'vitest';
import { AssertionError, assert } from '@/lib/assert';

describe('assert', () => {
  it('passes a true condition', () => {
    expect(() => assert(1 + 1 === 2, 'arithmetic')).not.toThrow();
  });

  it('throws an AssertionError with the message on a false condition', () => {
    expect(() => assert(false, 'impossible state')).toThrow(AssertionError);
    expect(() => assert(0, 'impossible state')).toThrow('impossible state');
  });
});
