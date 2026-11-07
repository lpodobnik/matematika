// A machine he builds in the workshop (epic 5; GDD, Room builder; architecture, Builder:
// `src/workshop/`). Pure: the design he sets up, the rules it must keep (forms and options
// he has met, the limits, a whole-number answer), what it costs, and the RoomSpec the room
// engine plays it as, for him and for the friend who gets the link. The game works nothing
// out for him: it says only whether the machine can level, never what x is.

import { check } from '@/math/check';
import { solve } from '@/math/linear';
import { parse } from '@/math/parse';
import * as q from '@/math/rational';
import { tokenize } from '@/math/tokens';
import { sideValues } from '@/room/tilt';
import type { DialSpec, RoomSpec, StageSpec } from '@/room/types';
import {
  type FormId,
  fedSlot,
  fedTemplate,
  forms,
  formsMet,
  type Numbers,
  type Piece,
  type Slot,
  takesXAway,
} from '@/workshop/forms';

/** GDD, Room builder, Limits: coefficients up to 99, numbers up to 9 999. */
export const limits = {
  /** The coefficient or divisor a. */
  a: { min: 2, max: 99 },
  b: { min: 1, max: 9999 },
  c: { min: 0, max: 9999 },
  d: { min: 1, max: 9999 },
  /** The answer: a whole number the dial can stand on. */
  x: { min: 1, max: 9999 },
  /** GDD: up to 3 linked machines. */
  machines: 3,
  /** The most lines of his solution a link carries per machine, and the longest line. */
  lines: 12,
  lineTokens: 40,
} as const;

/**
 * The titles he picks from (GDD: "a fixed list, which keeps names and free text out"); their
 * text is `hr.workshop.titles`, and a link carries the index, so the list only grows.
 */
export const titleCount = 12;

/** GDD, Room builder, Costs, in parts, charged when he sends the room. */
export const costs: Readonly<Record<Piece | 'blind' | 'planted' | 'linked', number>> = {
  weight: 1,
  gear: 2,
  spring: 2,
  float: 2,
  blind: 5,
  planted: 5,
  linked: 15,
};

export interface MachineDesign {
  form: FormId;
  /** Every slot's number; a slot the form doesn't take is ignored (kept at its default). */
  numbers: Numbers;
}

export interface Blinds {
  /** Hide the readouts on the pans. */
  readouts: boolean;
  /** Shorten the dial so it stops short of x: trying values stops working. */
  shortDial: boolean;
}

export interface RoomDesign {
  /** 1–3; each after the first is fed the answer of the one before it (GDD, Linked machines). */
  machines: MachineDesign[];
  blinds: Blinds;
  /** He means to plant a wrong line once he has solved it. */
  plant: boolean;
}

/** The options beyond the forms, each met in a room (FR44). */
export type OptionId = 'readouts' | 'shortDial' | 'plant' | 'linked';

/** Where each option was met: hidden readouts in room 6, Try values not enough in room 4, … */
export const optionMetIn: Readonly<Record<OptionId, string>> = {
  readouts: 'r06',
  shortDial: 'r04',
  plant: 'r07',
  linked: 'r12',
};

export function optionMet(option: OptionId, roomsDone: readonly string[]): boolean {
  return roomsDone.includes(optionMetIn[option]);
}

/** The numbers a new machine starts with: a small room-4 machine, `2x + 5 = 23`. */
export const startNumbers: Readonly<Numbers> = { a: 2, b: 5, c: 23, d: 4 };

/** A new design: one machine of the first form he has met, nothing hidden. */
export function newDesign(form: FormId): RoomDesign {
  return {
    machines: [{ form, numbers: { ...startNumbers } }],
    blinds: { readouts: false, shortDial: false },
    plant: false,
  };
}

/** Why a design can't be played or sent. Each has its text in hr.ts (`hr.workshop.problem`). */
export type Problem =
  | 'form' // a form he hasn't met
  | 'option' // an option he hasn't met
  | 'limits' // a number outside its limits
  | 'machines' // no machine, or more than 3
  | 'fraction' // x isn't a whole number: the scale would never level
  | 'small' // x is less than 1
  | 'big' // x is more than 9 999
  | 'short'; // too small an x for a short dial

export interface Checked {
  ok: boolean;
  /** For each machine, the first problem, or null; then the room's own. */
  machines: (Problem | null)[];
  room: Problem | null;
}

/** The numbers of each machine with the fed slots filled from the answer before (null if none). */
export function resolvedNumbers(design: RoomDesign): Numbers[] {
  const out: Numbers[] = [];
  let before: number | null = null;
  for (const [i, machine] of design.machines.entries()) {
    const numbers = { ...machine.numbers };
    if (i > 0 && before !== null) numbers[fedSlot(machine.form)] = before;
    out.push(numbers);
    before = answerOf(machine.form, numbers);
  }
  return out;
}

/** The design with each fed number set to the answer before it, as a link carries it. */
export function withFedNumbers(design: RoomDesign): RoomDesign {
  const numbers = resolvedNumbers(design);
  return {
    ...design,
    machines: design.machines.map((m, i) => ({ ...m, numbers: numbers[i] ?? m.numbers })),
  };
}

/** A machine's equation in school notation. */
export function equationOf(form: FormId, numbers: Numbers): string {
  return forms[form].write(numbers);
}

/** Each machine's equation, the fed slots filled. */
export function equations(design: RoomDesign): string[] {
  const numbers = resolvedNumbers(design);
  return design.machines.map((machine, i) =>
    equationOf(machine.form, numbers[i] ?? machine.numbers),
  );
}

/** x, when the machine has one whole-number answer; else null. */
export function answerOf(form: FormId, numbers: Numbers): number | null {
  const parsed = parse(equationOf(form, numbers));
  if (!parsed.ok) return null;
  const solution = solve(parsed.equation);
  if (solution.kind !== 'one' || !q.isInteger(solution.x)) return null;
  return Number(solution.x.n);
}

function inLimits(slot: Slot, n: number): boolean {
  return Number.isInteger(n) && n >= limits[slot].min && n <= limits[slot].max;
}

/** The dial's units to x: the divisor in a division form, else 1. */
function stepOf(form: FormId, numbers: Numbers): number {
  return form === 'x:a' ? numbers.a : 1;
}

function machineProblem(
  form: FormId,
  numbers: Numbers,
  fed: Slot | null,
  met: readonly FormId[],
  shortDial: boolean,
): Problem | null {
  if (!met.includes(form)) return 'form';
  if (forms[form].slots.some((slot) => slot !== fed && !inLimits(slot, numbers[slot]))) {
    return 'limits';
  }
  const parsed = parse(equationOf(form, numbers));
  if (!parsed.ok) return 'limits';
  const solution = solve(parsed.equation);
  if (solution.kind !== 'one' || !q.isInteger(solution.x)) return 'fraction';
  if (solution.x.n < 1n) return 'small';
  const x = Number(solution.x.n);
  if (x > limits.x.max) return 'big';
  if (shortDial && x / stepOf(form, numbers) < 4) return 'short';
  return null;
}

/**
 * Whether the design keeps the rules: every form and option met in a room he has done,
 * every number in its limits, and every machine with one whole-number answer from 1 to
 * 9 999 (GDD: "a room whose answer isn't a whole number can't level, so it can't be sent").
 */
export function checkDesign(design: RoomDesign, roomsDone: readonly string[]): Checked {
  const met = formsMet(roomsDone);
  const count = design.machines.length;
  let room: Problem | null = count < 1 || count > limits.machines ? 'machines' : null;
  const { readouts, shortDial } = design.blinds;
  const options: [OptionId, boolean][] = [
    ['readouts', readouts],
    ['shortDial', shortDial],
    ['plant', design.plant],
    ['linked', count > 1],
  ];
  if (room === null && options.some(([id, on]) => on && !optionMet(id, roomsDone))) room = 'option';
  const numbers = resolvedNumbers(design);
  const machines = design.machines.map((machine, i) =>
    machineProblem(
      machine.form,
      numbers[i] ?? machine.numbers,
      i > 0 ? fedSlot(machine.form) : null,
      met,
      shortDial,
    ),
  );
  // A fed number past the limits (an answer over 9 999) is the machine before's problem.
  return { ok: room === null && machines.every((p) => p === null), machines, room };
}

/** What sending the room costs, in parts (FR46). Decorations aren't in the builder yet. */
export function costOf(design: RoomDesign): number {
  const pieces = design.machines
    .flatMap((machine) => forms[machine.form].pieces)
    .reduce((sum, piece) => sum + costs[piece], 0);
  const blinds = (design.blinds.readouts ? 1 : 0) + (design.blinds.shortDial ? 1 : 0);
  const extra = Math.max(0, design.machines.length - 1);
  return pieces + blinds * costs.blind + (design.plant ? costs.planted : 0) + extra * costs.linked;
}

/** The dial for a machine whose answer is x: past x with room to spare, or short of it. */
export function dialFor(x: number, step: number, short: boolean): DialSpec {
  const units = x / step;
  let notches = short ? Math.floor(units / 2) : 10 * Math.ceil((units + 3) / 10);
  let coarse: number | undefined;
  if (notches > 30) {
    let k = 10;
    while (notches / k > 30) k *= 10;
    coarse = k * step;
    // A coarse dial ends on a notch (story 4.6 review), past x, or still short of it.
    notches = (short ? Math.floor(notches / k) : Math.ceil(notches / k)) * k;
  }
  const dial: DialSpec = { min: 0, max: notches * step, step };
  return coarse === undefined ? dial : { ...dial, coarse };
}

/** Degrees per unit, so the widest tilt on the dial is about 14°, as room 11 tunes it. */
function tiltFor(equation: string, dial: DialSpec): number {
  const parsed = parse(equation);
  if (!parsed.ok) return 1;
  const widest = [dial.min, dial.max]
    .map((x) => sideValues(parsed.equation, q.rational(x)))
    .map(({ left, right }) => q.sub(left, right))
    .map((diff) => Math.abs(Number(diff.n) / Number(diff.d)))
    .reduce((a, b) => Math.max(a, b), 0);
  if (widest <= 14) return 1;
  return Number((14 / widest).toPrecision(2));
}

/** His solution, as the link carries it: each machine's lines after line 0, in pad characters. */
export type Solution = string[][];

/** The wrong line he plants: in which machine, in place of which of his lines, and its text. */
export interface Planted {
  stage: number;
  line: number;
  text: string;
}

/** Everything a room link carries (architecture, Pattern 3): nothing about the sender. */
export interface RoomPayload {
  title: number;
  design: RoomDesign;
  planted: Planted | null;
  solution: Solution;
}

/** Who plays the room: he does, to prove it; the friend, with the planted line if any. */
export type PlayMode = 'builder' | 'friend';

/** The id a built room plays under: his draft, or the friend's copy by the link's id. */
export const draftRoomId = 'built-draft';
export const introRoomId = 'built-intro';

/**
 * The RoomSpec the engine plays a design as: one stage per machine, each fed the answer of
 * the one before; all three ways, on a blank page (GDD, Friend's side: "the room, with all
 * three ways, a blank page and the usual help"), the tray's x-gear for forms that take x
 * away, the dial past x (or short of it, a blind), readouts hidden if he chose that. For
 * the friend, the machine with the planted line becomes a find-the-mistake stage (room 7):
 * his lines up to it written in, then the wrong one.
 */
export function roomSpecOf(
  design: RoomDesign,
  mode: PlayMode,
  id: RoomSpec['id'],
  extra: { planted: Planted | null; solution: Solution } = { planted: null, solution: [] },
): RoomSpec {
  const numbers = resolvedNumbers(design);
  const stages = design.machines.map((machine, i): StageSpec => {
    const n = numbers[i] ?? machine.numbers;
    const equation = equationOf(machine.form, n);
    const x = answerOf(machine.form, n) ?? 0;
    const dial = dialFor(x, stepOf(machine.form, n), design.blinds.shortDial);
    const stage: StageSpec = {
      type: 'solve',
      machines: [{ equation }],
      dial,
      tiltPerUnit: tiltFor(equation, dial),
      readouts: !design.blinds.readouts,
      ways: ['try', 'balance', 'undo'],
      fading: { try: 'blank', balance: 'blank', undo: 'blank' },
    };
    if (takesXAway(machine.form)) stage.trayGear = true;
    if (design.blinds.readouts || design.blinds.shortDial) {
      stage.blinds = {
        ...(design.blinds.readouts ? { readouts: true as const } : {}),
        ...(design.blinds.shortDial ? { shortDial: dial.max } : {}),
      };
    }
    const before = design.machines[i - 1];
    if (i > 0 && before) stage.fed = { from: i - 1, template: fedTemplate(machine.form, n) };
    const planted = extra.planted;
    if (mode === 'friend' && planted && planted.stage === i) {
      const lines = extra.solution[i] ?? [];
      stage.type = 'mistake';
      stage.pin = { kind: 'wrong-line' };
      stage.pokeNotches = 'all';
      stage.presetLines = [...lines.slice(0, planted.line), planted.text];
    }
    return stage;
  });
  return {
    id,
    machine: 'junction',
    xMeaning: 'a machine built in the workshop',
    stages,
    earns: null,
    mapChange: null,
  };
}

/**
 * The friend's one-minute intro machine (GDD, Friend's side): `2x = 6` on a dial of 0–10,
 * Try values with blanks to fill, as room 1 teaches it; the handover tags guide each step.
 */
export const introSpec: RoomSpec = {
  id: introRoomId,
  machine: 'door-lift',
  xMeaning: 'how much each of two counterweights weighs',
  stages: [
    {
      type: 'solve',
      machines: [{ equation: '2x = 6' }],
      dial: { min: 0, max: 10, step: 1 },
      readouts: true,
      ways: ['try'],
      fading: { try: 'blanks' },
    },
  ],
  earns: null,
  mapChange: null,
};

/** Why a solution or a planted line can't go in a link. Text in hr.ts. */
export type SolutionProblem = 'lines' | 'long' | 'unsolved';

/**
 * Whether his lines solve each machine, as the notebook judged them: every line parses and
 * has the machine's answer, and each machine's last line is the check line. At most 12 lines
 * a machine and 40 pad characters a line, so the link stays short (NFR7).
 */
export function checkSolution(design: RoomDesign, solution: Solution): SolutionProblem | null {
  const eqs = equations(design);
  if (solution.length !== eqs.length) return 'unsolved';
  for (const [i, lines] of solution.entries()) {
    if (lines.length === 0) return 'unsolved';
    if (lines.length > limits.lines) return 'lines';
    if (lines.some((line) => tokenCount(line) > limits.lineTokens)) return 'long';
    const given = parse(eqs[i] ?? '');
    if (!given.ok) return 'unsolved';
    const so = [given.equation];
    for (const [j, line] of lines.entries()) {
      const verdict = check(so, line);
      const last = j === lines.length - 1;
      if (last ? verdict.kind !== 'check' : !committed(verdict.kind)) return 'unsolved';
      const parsed = parse(line);
      if (!parsed.ok) return 'unsolved';
      so.push(parsed.equation);
    }
  }
  return null;
}

function committed(kind: string): boolean {
  return kind === 'valid' || kind === 'answer';
}

/** A line's pad characters, or Infinity for one with a character not on the pad. */
export function tokenCount(line: string): number {
  const tokens = tokenize(line);
  return tokens.ok ? tokens.tokens.length : Number.POSITIVE_INFINITY;
}

/**
 * Whether a planted line works: in a machine of the room, in place of one of his lines
 * before the check line, and wrong against the lines before it (room 7's rule: the friend
 * finds it because it tips the scale).
 */
export function plantWorks(design: RoomDesign, solution: Solution, planted: Planted): boolean {
  const lines = solution[planted.stage];
  const eq = equations(design)[planted.stage];
  if (!lines || eq === undefined) return false;
  if (!Number.isInteger(planted.line) || planted.line < 0 || planted.line >= lines.length - 1) {
    return false;
  }
  if (tokenCount(planted.text) > limits.lineTokens) return false;
  const so = [eq, ...lines.slice(0, planted.line)].map((line) => parse(line));
  if (so.some((p) => !p.ok)) return false;
  const equationsBefore = so.flatMap((p) => (p.ok ? [p.equation] : []));
  return check(equationsBefore, planted.text).kind === 'wrong';
}
