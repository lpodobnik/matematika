// Room links and reply links (epic 5; architecture, Links and Pattern 3). Pure. A room for a
// friend travels whole in the URL fragment, `#s=<data>`: no server, and nothing about the
// sender (NFR5, NFR7). The data is bits, then base64url:
//
//   version u8 · title u8 · blinds (readouts, short dial) u1 u1 · planted u1 · machines u2
//   each machine: form u4, then each number its form takes (a u7; b, c, d u14)
//   planted line, if any: machine u2, line u4, the line
//   each machine's solution: count u4, then the lines
//   a line: count u6, then its pad characters u5 each
//
// Numbers go in as numbers rather than characters (shorter, and easy to range-check). The
// largest legal room is about 1 300 characters (a test keeps it, with the origin, under
// 2 000). A link is untrusted: every field is checked, the room must keep the builder's
// rules and his solution must solve it, or it reads as broken. The reply link, `#r=<id>.c`
// or `.u`, names the room by a hash of its bytes (cyrb53, base36) and says whether the
// friend cracked it.
//
// A link version, once released, stays readable forever: links live on in chat histories.

import { TOKENS, type Token, tokenize } from '@/math/tokens';
import {
  checkDesign,
  checkSolution,
  limits,
  type MachineDesign,
  plantWorks,
  type RoomPayload,
  resolvedNumbers,
  type Solution,
  titleCount,
} from '@/workshop/design';
import { type FormId, formIds, forms, type Slot } from '@/workshop/forms';
import { fromBase64Url, toBase64Url } from './backup';

/** The fragment's prefix for a room link, and for a reply link. */
export const roomPrefix = '#s=';
export const replyPrefix = '#r=';

export const linkVersion = 1;

/** The longest payload read at all: far past the largest legal room. */
const maxPayload = 2400;

const slotBits: Readonly<Record<Slot, number>> = { a: 7, b: 14, c: 14, d: 14 };

class BitWriter {
  private bytes: number[] = [];
  private bit = 0;

  write(value: number, bits: number): void {
    for (let i = bits - 1; i >= 0; i -= 1) {
      if (this.bit % 8 === 0) this.bytes.push(0);
      const on = Math.floor(value / 2 ** i) % 2;
      const at = this.bytes.length - 1;
      this.bytes[at] = (this.bytes[at] ?? 0) | (on << (7 - (this.bit % 8)));
      this.bit += 1;
    }
  }

  done(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

class BitReader {
  private bit = 0;
  constructor(private readonly bytes: Uint8Array) {}

  /** The next `bits` bits as a number; throws past the end (the decoder catches it). */
  read(bits: number): number {
    let value = 0;
    for (let i = 0; i < bits; i += 1) {
      const byte = this.bytes[Math.floor(this.bit / 8)];
      if (byte === undefined) throw new Error('past the end');
      value = value * 2 + ((byte >> (7 - (this.bit % 8))) & 1);
      this.bit += 1;
    }
    return value;
  }

  /** Whether only the last byte's zero padding is left. */
  atEnd(): boolean {
    const left = this.bytes.length * 8 - this.bit;
    if (left >= 8) return false;
    for (let i = 0; i < left; i += 1) if (this.read(1) !== 0) return false;
    return true;
  }
}

function writeLine(out: BitWriter, line: string): void {
  const tokens = tokenize(line);
  if (!tokens.ok || tokens.tokens.length > limits.lineTokens) {
    throw new Error(`a line a link can't carry: ${line}`);
  }
  out.write(tokens.tokens.length, 6);
  for (const token of tokens.tokens) out.write(TOKENS.indexOf(token), 5);
}

function readLine(input: BitReader): string {
  const count = input.read(6);
  if (count < 1 || count > limits.lineTokens) throw new Error('line length');
  const tokens: Token[] = [];
  for (let i = 0; i < count; i += 1) {
    const token = TOKENS[input.read(5)];
    if (token === undefined) throw new Error('token');
    tokens.push(token);
  }
  return tokens.join('');
}

/** The payload's bytes. Throws for a room the builder's rules don't allow to be sent. */
export function roomBytes(room: RoomPayload): Uint8Array {
  const out = new BitWriter();
  const { design, planted, solution } = room;
  out.write(linkVersion, 8);
  out.write(room.title, 8);
  out.write(design.blinds.readouts ? 1 : 0, 1);
  out.write(design.blinds.shortDial ? 1 : 0, 1);
  out.write(planted ? 1 : 0, 1);
  out.write(design.machines.length, 2);
  for (const machine of design.machines) {
    out.write(formIds.indexOf(machine.form), 4);
    for (const slot of forms[machine.form].slots) {
      out.write(machine.numbers[slot], slotBits[slot]);
    }
  }
  if (planted) {
    out.write(planted.stage, 2);
    out.write(planted.line, 4);
    writeLine(out, planted.text);
  }
  for (const lines of solution) {
    out.write(lines.length, 4);
    for (const line of lines) writeLine(out, line);
  }
  return out.done();
}

/** A room's link data, `<data>` in `#s=<data>`. */
export function encodeRoom(room: RoomPayload): string {
  return toBase64Url(roomBytes(room));
}

function readMachine(input: BitReader): MachineDesign {
  const form: FormId | undefined = formIds[input.read(4)];
  if (!form) throw new Error('form');
  const numbers = { a: 0, b: 0, c: 0, d: 0 };
  for (const slot of forms[form].slots) numbers[slot] = input.read(slotBits[slot]);
  return { form, numbers };
}

function readPayload(input: BitReader): RoomPayload {
  if (input.read(8) !== linkVersion) throw new Error('version');
  const title = input.read(8);
  const readouts = input.read(1) === 1;
  const shortDial = input.read(1) === 1;
  const hasPlant = input.read(1) === 1;
  const count = input.read(2);
  const machines = Array.from({ length: count }, () => readMachine(input));
  const planted = hasPlant
    ? { stage: input.read(2), line: input.read(4), text: readLine(input) }
    : null;
  const solution: Solution = machines.map(() =>
    Array.from({ length: input.read(4) }, () => readLine(input)),
  );
  if (!input.atEnd()) throw new Error('trailing data');
  return {
    title,
    design: { machines, blinds: { readouts, shortDial }, plant: planted !== null },
    planted,
    solution,
  };
}

/**
 * Whether a room keeps the rules a link must: a title from the list, 1–3 machines of known
 * forms with numbers in their limits and whole answers, the fed numbers right, his solution
 * solving every machine, and a planted line that is wrong where it stands. The forms met
 * don't matter here: the friend didn't build it.
 */
export function roomValid(room: RoomPayload): boolean {
  const { design } = room;
  if (!Number.isInteger(room.title) || room.title < 0 || room.title >= titleCount) return false;
  const count = design.machines.length;
  if (count < 1 || count > limits.machines) return false;
  if (!designValid(room)) return false;
  if (checkSolution(design, room.solution) !== null) return false;
  if (room.planted && !plantWorks(design, room.solution, room.planted)) return false;
  return true;
}

/** Every form and option counts as met for the friend: a room with all of them done. */
const everything = ['r01', 'r02', 'r03', 'r04', 'r06', 'r07', 'r09', 'r10', 'r12'];

/** The design keeps the builder's rules, and its fed numbers are the answers before them. */
function designValid(room: RoomPayload): boolean {
  if (!checkDesign(room.design, everything).ok) return false;
  const resolved = resolvedNumbers(room.design);
  return room.design.machines.every((machine, i) =>
    forms[machine.form].slots.every((slot) => machine.numbers[slot] === resolved[i]?.[slot]),
  );
}

/** The room a link's data holds, or null when it doesn't read as a room that keeps the rules. */
export function decodeRoom(data: string): RoomPayload | null {
  if (data.length === 0 || data.length > maxPayload) return null;
  const bytes = fromBase64Url(data);
  if (!bytes || bytes.length === 0) return null;
  try {
    const room = readPayload(new BitReader(bytes));
    return roomValid(room) ? room : null;
  } catch {
    return null;
  }
}

/** The payload after `#s=`, or null when the fragment isn't a room link. */
export function roomPayload(hash: string): string | null {
  return hash.startsWith(roomPrefix) ? hash.slice(roomPrefix.length) : null;
}

/**
 * cyrb53 (public domain, bryc): a fast 53-bit hash. Not `crypto.subtle`, which is missing in
 * insecure contexts such as the tablet on the LAN (architecture, Pattern 3).
 */
export function cyrb53(bytes: Uint8Array, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (const byte of bytes) {
    h1 = Math.imul(h1 ^ byte, 2654435761);
    h2 = Math.imul(h2 ^ byte, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** A room's id: the hash of its link's bytes, in base36. The same room always has the same id. */
export function roomIdOf(data: string): string | null {
  const bytes = fromBase64Url(data);
  return bytes && bytes.length > 0 ? cyrb53(bytes).toString(36) : null;
}

export type Stamp = 'cracked' | 'uncracked';

export interface Reply {
  id: string;
  stamp: Stamp;
}

/** A reply link's fragment: `#r=<id>.c` when the friend cracked it, `.u` when not. */
export function replyFragment(reply: Reply): string {
  return `${replyPrefix}${reply.id}.${reply.stamp === 'cracked' ? 'c' : 'u'}`;
}

/** The reply a fragment holds, or null when it isn't a reply link. */
export function replyOf(hash: string): Reply | null {
  const match = /^#r=([0-9a-z]{1,12})\.([cu])$/.exec(hash);
  if (!match?.[1] || !match[2]) return null;
  return { id: match[1], stamp: match[2] === 'c' ? 'cracked' : 'uncracked' };
}
