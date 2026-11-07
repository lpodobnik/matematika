// Epic 5: the rooms he sent, in the save. A save from before has none; each field is read
// leniently, as the rest of the save is.

import { describe, expect, it } from 'vitest';
import { decodeSave } from '@/save/decode';

const now = '2026-11-07T10:00:00.000Z';
const room = { id: 'abc123', payload: 'AQKKgwAQAfINT0kDalZHjCA', title: 2, stamp: null };

describe('the workshop in the save (epic 5)', () => {
  it('gives a save from before the workshop an empty wall', () => {
    expect(decodeSave({ v: 1 }, now)?.workshop).toEqual({ rooms: [] });
  });

  it('keeps the rooms he sent and their stamps', () => {
    const workshop = { rooms: [room, { ...room, id: 'def456', stamp: 'cracked' }] };
    expect(decodeSave({ v: 1, workshop }, now)?.workshop).toEqual(workshop);
  });

  it('drops what doesn’t read, field by field, and a room twice', () => {
    const rooms = [
      room,
      { ...room, id: 'BAD!' },
      { ...room, payload: 'no spaces allowed' },
      { ...room, id: 'x1', title: -1 },
      { ...room, id: 'x2', stamp: 'maybe' },
      room,
      'nonsense',
    ];
    expect(decodeSave({ v: 1, workshop: { rooms } }, now)?.workshop.rooms).toEqual([
      room,
      { ...room, id: 'x2', stamp: null },
    ]);
  });
});
