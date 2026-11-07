// The equation forms he can build a machine from (epic 5; GDD, Room builder: "he can use
// only forms and options he has already met in rooms"). Pure. Each form names the numbers it
// takes, the room that first showed it, the pieces it puts on the pans (for the cost) and
// the number a linked machine's answer replaces. The forms are fixed and numbered: a form's
// place in `formIds` is what a room link carries, so the list only ever grows at its end.

import type { RoomId } from '@/room/types';

/** Every form, in the order the link numbers them. Never reorder: links keep the index. */
export const formIds = [
  'x+b', // x + b = c       room 1
  'ax', // ax = c           room 2
  'x:a', // x : a = c       room 2
  'x-b', // x − b = c       room 3
  'b-x', // b − x = c       room 3
  'ax+b', // ax + b = c     room 4
  'x+b=c+d', // x + b = c + d   room 6
  'ax-b', // ax − b = c     room 7
  'b-ax', // b − ax = c     room 9
  'b+ax', // b + ax = c     room 10
] as const;

export type FormId = (typeof formIds)[number];

/** The numbers a form can take: a coefficient or divisor `a`, and the numbers b, c and d. */
export type Slot = 'a' | 'b' | 'c' | 'd';

/** What sits on the pans, for the cost (GDD: weight 1; x-gear, spring or float 2). */
export type Piece = 'weight' | 'gear' | 'spring' | 'float';

export interface Form {
  /** Which numbers it takes, in the order they are written. */
  slots: readonly Slot[];
  /** The room whose machine first showed it: he can build it once that room is done. */
  metIn: RoomId;
  /** The pieces on the pans. */
  pieces: readonly Piece[];
  /** The equation with its numbers, in school notation (− and the pad's x). */
  write(n: Written): string;
}

/** What `write` puts in each place: a number, a letter or a ☐. */
export type Written = Record<Slot, number | string>;

export interface Numbers {
  a: number;
  b: number;
  c: number;
  d: number;
}

export const forms: Readonly<Record<FormId, Form>> = {
  'x+b': {
    slots: ['b', 'c'],
    metIn: 'r01',
    pieces: ['gear', 'weight', 'weight'],
    write: (n) => `x + ${n.b} = ${n.c}`,
  },
  ax: {
    slots: ['a', 'c'],
    metIn: 'r02',
    pieces: ['gear', 'weight'],
    write: (n) => `${n.a}x = ${n.c}`,
  },
  'x:a': {
    slots: ['a', 'c'],
    metIn: 'r02',
    pieces: ['gear', 'weight'],
    write: (n) => `x : ${n.a} = ${n.c}`,
  },
  'x-b': {
    slots: ['b', 'c'],
    metIn: 'r03',
    pieces: ['gear', 'float', 'weight'],
    write: (n) => `x − ${n.b} = ${n.c}`,
  },
  'b-x': {
    slots: ['b', 'c'],
    metIn: 'r03',
    pieces: ['weight', 'spring', 'weight'],
    write: (n) => `${n.b} − x = ${n.c}`,
  },
  'ax+b': {
    slots: ['a', 'b', 'c'],
    metIn: 'r04',
    pieces: ['gear', 'weight', 'weight'],
    write: (n) => `${n.a}x + ${n.b} = ${n.c}`,
  },
  'x+b=c+d': {
    slots: ['b', 'c', 'd'],
    metIn: 'r06',
    pieces: ['gear', 'weight', 'weight', 'weight'],
    write: (n) => `x + ${n.b} = ${n.c} + ${n.d}`,
  },
  'ax-b': {
    slots: ['a', 'b', 'c'],
    metIn: 'r07',
    pieces: ['gear', 'float', 'weight'],
    write: (n) => `${n.a}x − ${n.b} = ${n.c}`,
  },
  'b-ax': {
    slots: ['a', 'b', 'c'],
    metIn: 'r09',
    pieces: ['weight', 'spring', 'weight'],
    write: (n) => `${n.b} − ${n.a}x = ${n.c}`,
  },
  'b+ax': {
    slots: ['a', 'b', 'c'],
    metIn: 'r10',
    pieces: ['weight', 'gear', 'weight'],
    write: (n) => `${n.b} + ${n.a}x = ${n.c}`,
  },
};

/** The forms with x taken away, whose Balance needs the tray's x-gear (story 4.2). */
export function takesXAway(form: FormId): boolean {
  return form === 'b-x' || form === 'b-ax';
}

/** The number a linked machine's answer fills (GDD: "becomes a weight in the next"): b, else c. */
export function fedSlot(form: FormId): Slot {
  return forms[form].slots.includes('b') ? 'b' : 'c';
}

/** The forms he has met: those whose room is done, in the link's order. */
export function formsMet(roomsDone: readonly string[]): FormId[] {
  return formIds.filter((id) => roomsDone.includes(forms[id].metIn));
}

/** The form written with letters, for the builder's buttons: `ax + b = c`. */
export function formPattern(form: FormId): string {
  return forms[form].write({ a: 'a', b: 'b', c: 'c', d: 'd' });
}

/** The form with a ☐ where a linked machine's answer goes: `3x + ☐ = 19`. */
export function fedTemplate(form: FormId, n: Numbers): string {
  return forms[form].write({ ...n, [fedSlot(form)]: '☐' });
}
