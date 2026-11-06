import { describe, expect, it } from 'vitest';
import { tapDie, tapLeave, tapSlot } from './taps';

const empty = { blade: null, charge: null, reach: null };

describe('fight taps (story 3.1)', () => {
  it('picks a die up, and puts it down when tapped again', () => {
    expect(tapDie(null, 1)).toEqual({ held: 1, action: null });
    expect(tapDie(1, 1)).toEqual({ held: null, action: null });
    expect(tapDie(1, 2)).toEqual({ held: 2, action: null });
  });

  it('puts the held die in the slot tapped, also a placed die moving to another slot', () => {
    expect(tapSlot(2, 'reach', empty)).toEqual({
      held: null,
      action: { type: 'fight/place', die: 2, slot: 'reach' },
    });
    const placed = { blade: 0, charge: null, reach: null };
    expect(tapSlot(0, 'charge', placed).action).toEqual({
      type: 'fight/place',
      die: 0,
      slot: 'charge',
    });
  });

  it('takes a die back from a filled slot when nothing is held, and does nothing on an empty one', () => {
    expect(tapSlot(null, 'blade', { ...empty, blade: 1 })).toEqual({
      held: null,
      action: { type: 'fight/unplace', slot: 'blade' },
    });
    expect(tapSlot(null, 'charge', empty)).toEqual({ held: null, action: null });
  });

  it('leaves at once before the first strike, and asks after it (story 3.2)', () => {
    expect(tapLeave({ strikes: 0 })).toBe('leave');
    expect(tapLeave({ strikes: 1 })).toBe('ask');
    expect(tapLeave({ strikes: 4 })).toBe('ask');
  });
});
