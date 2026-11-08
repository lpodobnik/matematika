import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  decodeRoom,
  encodeRoom,
  replyFragment,
  replyOf,
  roomIdOf,
  roomPayload,
  roomPrefix,
} from '@/links/room-link';
import type { RoomPayload } from '@/workshop/design';
import { roomV1 } from './__fixtures__/room-v1';

const simple: RoomPayload = {
  title: 3,
  design: {
    machines: [{ form: 'ax+b', numbers: { a: 2, b: 5, c: 23, d: 0 } }],
    blinds: { readouts: false, shortDial: false },
    plant: false,
  },
  planted: null,
  solution: [['x=9', '2·9+5=23']],
};

/**
 * The largest legal room: 3 linked machines, every blind, a planted line, and 12 lines of 40
 * pad characters a machine (the field widths are fixed, so the numbers' size doesn't matter).
 */
function largest(): RoomPayload {
  const pad = (line: string) => line + '+0'.repeat((40 - line.length) / 2);
  const filler = Array.from({ length: 10 }, () => pad('2x=9+9'));
  const lines = (b: number, c: number) => [...filler, 'x=9', `2·9+${b}=${c}`];
  return {
    title: 11,
    design: {
      machines: [
        { form: 'ax+b', numbers: { a: 2, b: 5, c: 23, d: 0 } },
        { form: 'ax+b', numbers: { a: 2, b: 9, c: 27, d: 0 } },
        { form: 'ax+b', numbers: { a: 2, b: 9, c: 27, d: 0 } },
      ],
      blinds: { readouts: true, shortDial: true },
      plant: true,
    },
    planted: { stage: 2, line: 9, text: pad('2x=9+8') },
    solution: [lines(5, 23), lines(9, 27), lines(9, 27)],
  };
}

describe('room links', () => {
  it('carry the whole room there and back', () => {
    const data = encodeRoom(simple);
    expect(decodeRoom(data)).toEqual(simple);
    expect(roomPayload(`${roomPrefix}${data}`)).toBe(data);
  });

  it('carry blinds, a planted line and linked machines', () => {
    const room: RoomPayload = {
      title: 0,
      design: {
        machines: [
          { form: 'ax+b', numbers: { a: 2, b: 3, c: 11, d: 0 } },
          { form: 'ax-b', numbers: { a: 3, b: 4, c: 17, d: 0 } },
        ],
        blinds: { readouts: true, shortDial: false },
        plant: true,
      },
      planted: { stage: 1, line: 0, text: '3x=20' },
      solution: [
        ['x=4', '2·4+3=11'],
        ['3x=21', 'x=7', '3·7−4=17'],
      ],
    };
    expect(decodeRoom(encodeRoom(room))).toEqual(room);
  });

  it('keep the largest legal room under 2,000 characters with the origin (NFR7)', () => {
    const room = largest();
    const data = encodeRoom(room);
    expect(decodeRoom(data)).not.toBeNull();
    const link = `https://lpodobnik.github.io/matematika/jednadzbe.html${roomPrefix}${data}`;
    expect(link.length).toBeLessThanOrEqual(2000);
  });

  it('hold nothing about the sender: only the room and its lines', () => {
    const json = JSON.stringify(decodeRoom(encodeRoom(simple)));
    expect(Object.keys(decodeRoom(encodeRoom(simple)) ?? {})).toEqual([
      'title',
      'design',
      'planted',
      'solution',
    ]);
    expect(json).not.toMatch(/name|look|createdAt/);
  });

  it('read a broken link as broken, never throwing', () => {
    const data = encodeRoom(simple);
    expect(decodeRoom('')).toBeNull();
    expect(decodeRoom('!!!')).toBeNull();
    expect(decodeRoom(data.slice(0, -3))).toBeNull();
    expect(decodeRoom(`${data}AAAA`)).toBeNull();
    expect(decodeRoom('A'.repeat(3000))).toBeNull();
    fc.assert(
      fc.property(fc.string({ maxLength: 120 }), (text) => {
        expect(() => decodeRoom(text)).not.toThrow();
      }),
    );
  });

  it('refuse rooms that break the rules, even if they read', () => {
    const fraction = {
      ...simple,
      design: {
        ...simple.design,
        machines: [{ form: 'ax+b' as const, numbers: { a: 2, b: 5, c: 24, d: 0 } }],
      },
    };
    expect(decodeRoom(encodeRoom({ ...fraction, solution: [['x=9', '2·9+5=23']] }))).toBeNull();
    expect(decodeRoom(encodeRoom({ ...simple, title: 200 }))).toBeNull();
    expect(decodeRoom(encodeRoom({ ...simple, solution: [['x=8', '2·8+5=23']] }))).toBeNull();
    expect(decodeRoom(encodeRoom({ ...simple, solution: [['x=9']] }))).toBeNull();
    // A planted line that is still right.
    const planted = {
      ...simple,
      design: { ...simple.design, plant: true },
      planted: { stage: 0, line: 0, text: 'x=9' },
    };
    expect(decodeRoom(encodeRoom(planted))).toBeNull();
    // A fed number that isn't the answer before it.
    const linked: RoomPayload = {
      ...simple,
      design: {
        ...simple.design,
        machines: [
          { form: 'ax+b', numbers: { a: 2, b: 3, c: 11, d: 0 } },
          { form: 'ax+b', numbers: { a: 3, b: 5, c: 20, d: 0 } },
        ],
      },
      solution: [
        ['x=4', '2·4+3=11'],
        ['x=5', '3·5+5=20'],
      ],
    };
    expect(decodeRoom(encodeRoom(linked))).toBeNull();
  });

  it('name a room by its bytes: the same room, the same id', () => {
    const data = encodeRoom(simple);
    expect(roomIdOf(data)).toMatch(/^[0-9a-z]{1,12}$/);
    expect(roomIdOf(encodeRoom(simple))).toBe(roomIdOf(data));
    expect(roomIdOf(encodeRoom({ ...simple, title: 4 }))).not.toBe(roomIdOf(data));
  });
});

describe('a room with his own name', () => {
  it('travels there and back, Croatian letters and all', () => {
    const room = { ...simple, title: 'Šaljivi čvor Ivića' };
    expect(decodeRoom(encodeRoom(room))).toEqual(room);
  });

  it('reads as broken when the name is empty, spaces or too long', () => {
    for (const title of ['', '   ', 'x'.repeat(25)]) {
      expect(decodeRoom(encodeRoom({ ...simple, title })), title).toBeNull();
    }
  });
});

describe('released link versions', () => {
  it('read a version 1 link as it was sent, forever', () => {
    expect(decodeRoom(roomV1.data)).toEqual(roomV1.room);
    expect(encodeRoom(roomV1.room)).toBe(roomV1.data);
  });
});

describe('reply links', () => {
  it('say cracked or uncracked, there and back', () => {
    expect(replyFragment({ id: 'abc123', stamp: 'cracked' })).toBe('#r=abc123.c');
    expect(replyOf('#r=abc123.c')).toEqual({ id: 'abc123', stamp: 'cracked' });
    expect(replyOf('#r=abc123.u')).toEqual({ id: 'abc123', stamp: 'uncracked' });
  });

  it('ignore anything else', () => {
    for (const hash of ['', '#r=', '#r=abc.x', '#r=ABC.c', '#r=abc', '#s=abc', '#r=a<b.c']) {
      expect(replyOf(hash), hash).toBeNull();
    }
  });
});
