// Content tests for every room (architecture, Room Data). Story 1.4 checks what room 1
// needs; later stories add the GDD-table checks (dial ranges, poke windows, the tilt clamp,
// fading, ways that can finish, paper-test equations) as their rooms arrive. Story 1.9 adds
// room 3 and the checks for poke windows and pins; story 1.10 room 4, the fading matrix
// and the ways that can finish. Story 1.13 checks rooms 1–4 against the GDD's tables in
// one place, xMeaning included, has every finishing way finish through `steps.ts`, and
// keeps the paper test's equations out of every room. Story 1.16 takes room 4's pin and
// poke window away and checks simplify first and the last two lines' blanks. After story
// 1.16 Luka runs room 4's dial to 0–12, past the answer: the slider is his check.

import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { paperTest } from '@/content/paper-test';
import { rooms } from '@/content/rooms';
import { hr } from '@/content/text/hr';
import { check, stageSolution } from '@/math/check';
import { type Equation, sameEquation } from '@/math/expr';
import { formatEquation } from '@/math/format';
import { solve } from '@/math/linear';
import { classifyMove } from '@/math/moves';
import { parse } from '@/math/parse';
import * as q from '@/math/rational';
import { canonicalSolution } from '@/math/steps';
import { fillBlanks, tokenize } from '@/math/tokens';
import { dialValue, isOnDial, notchCount } from '@/room/dial';
import { blanksOnceAlone, lastLines, openingTemplates } from '@/room/fading';
import { answerAllowed } from '@/room/notebook';
import { panPieces, sidePieces } from '@/room/pieces';
import {
  machineTestX,
  pinSupported,
  pinTrack,
  slotCount,
  slotValue,
  tiltAsXGrows,
} from '@/room/pin';
import { openingDial } from '@/room/room';
import { splitOutcome } from '@/room/splitter';
import { isLevel, sideValues, tiltFor } from '@/room/tilt';
import { sameLayout, trayMinNumber } from '@/room/tray';
import {
  type DialSpec,
  type FadingMode,
  type PinSpec,
  type RoomSpec,
  roomIds,
  type StageSpec,
  type WayId,
} from '@/room/types';

function stageEquation(stage: StageSpec | undefined) {
  const parsed = parse(stage?.machines[0]?.equation ?? '');
  if (!parsed.ok) throw new Error('does not parse');
  return parsed.equation;
}

function equationOf(text: string): Equation {
  const parsed = parse(text);
  if (!parsed.ok) throw new Error(`"${text}" does not parse: ${parsed.reason}`);
  return parsed.equation;
}

/** Every equation a room shows: its machines', and any notebook lines it starts with. */
function roomEquations(room: RoomSpec): string[] {
  return room.stages.flatMap((stage) => [
    ...stage.machines.map((machine) => machine.equation),
    ...(stage.presetLines ?? []),
  ]);
}

/** The paper-test equation `text` is, up to swapped sides and commuted terms, or null. */
function onPaperTest(text: string): string | null {
  const equation = equationOf(text);
  return paperTest.find((paper) => sameEquation(equationOf(paper), equation)) ?? null;
}

/**
 * GDD, Puzzle Progression: rows 1–4 of both tables, as written there. Room 3 is a Predict
 * room by its second stage; its first pins where the pans level, as a Solve stage does.
 */
const gddRooms: readonly {
  id: string;
  machine: string;
  xIs: string;
  equations: string[];
  answers: number[];
  types: StageSpec['type'][];
  dials: DialSpec[];
  pokeNotches: (number | 'all' | undefined)[];
  pins: (PinSpec | undefined)[];
  ways: WayId[];
  earns: RoomSpec['earns'];
}[] = [
  {
    id: 'r01',
    machine: 'door-lift',
    xIs: 'Counterweight still needed',
    equations: ['x + 4 = 9'],
    answers: [5],
    types: ['solve'],
    dials: [{ min: 0, max: 10, step: 1 }],
    pokeNotches: [undefined],
    pins: [undefined],
    ways: ['try'],
    earns: null,
  },
  {
    id: 'r02',
    machine: 'street-lamps',
    xIs: 'Oil per lamp, then a full tank',
    equations: ['3x = 12', 'x : 3 = 5'],
    answers: [4, 15],
    types: ['solve', 'solve'],
    dials: [
      { min: 0, max: 10, step: 1 },
      { min: 0, max: 30, step: 3 },
    ],
    pokeNotches: [undefined, undefined],
    pins: [undefined, undefined],
    ways: ['try'],
    earns: null,
  },
  {
    id: 'r03',
    machine: 'sluice-gate',
    xIs: 'Water before the release, then water to release',
    equations: ['x − 6 = 8', '20 − x = 6'],
    answers: [14, 14],
    types: ['solve', 'predict'],
    dials: [
      { min: 6, max: 20, step: 1 },
      { min: 0, max: 20, step: 1 },
    ],
    pokeNotches: [4, undefined],
    pins: [{ kind: 'level-x' }, { kind: 'effect', options: ['tilt-left', 'tilt-right'] }],
    ways: ['try'],
    earns: 'balance',
  },
  {
    id: 'r04',
    machine: 'water-wheel',
    xIs: 'Load per bucket',
    equations: ['2x + 5 = 23'],
    answers: [9],
    types: ['solve'],
    // The GDD's table says 0–6; Luka ran it to 0–12 after story 1.16, past the answer.
    dials: [{ min: 0, max: 12, step: 1 }],
    // Story 1.16: one new idea, Balance; the pin beyond the dial and the poke window went.
    pokeNotches: [undefined],
    pins: [undefined],
    ways: ['balance'],
    earns: null,
  },
  {
    id: 'r05',
    machine: 'bridge',
    xIs: 'Length per plank',
    equations: ['3x + 4 = 22', '3x + 4 = 25'],
    answers: [6, 7],
    types: ['predict', 'predict'],
    dials: [
      { min: 0, max: 10, step: 1 },
      { min: 0, max: 10, step: 1 },
    ],
    // Story 2.8: a poke window before the first pin; the second pin comes before the
    // slider opens, after the change.
    pokeNotches: [4, undefined],
    pins: [{ kind: 'level-x' }, { kind: 'level-x' }],
    ways: ['try', 'balance'],
    earns: null,
  },
  {
    id: 'r06',
    machine: 'weighing-yard',
    xIs: 'Weight of a crate',
    equations: ['x + 56 = 58 + 27'],
    answers: [29],
    types: ['compare'],
    dials: [{ min: 20, max: 40, step: 1 }],
    // Story 2.9: the pin before anything moves, with the readouts hidden.
    pokeNotches: [undefined],
    pins: [{ kind: 'level-x' }],
    ways: ['try', 'balance'],
    earns: 'workshop',
  },
  {
    id: 'r07',
    machine: 'old-logbook',
    xIs: 'Teeth per gear',
    equations: ['3x − 1 = 17'],
    answers: [6],
    types: ['mistake'],
    // Story 2.10: from 1, so 3x − 1 never weighs below 0.
    dials: [{ min: 1, max: 10, step: 1 }],
    pokeNotches: ['all'],
    pins: [{ kind: 'wrong-line' }],
    ways: ['balance'],
    earns: 'chain',
  },
  {
    id: 'r08',
    machine: 'tram',
    xIs: 'Length per rail',
    equations: ['4x + 9 = 41'],
    answers: [8],
    types: ['solve'],
    dials: [{ min: 0, max: 10, step: 1 }],
    pokeNotches: [4],
    pins: [{ kind: 'level-x' }],
    ways: ['balance', 'undo'],
    earns: null,
  },
  {
    id: 'r09',
    machine: 'steam-lift',
    xIs: 'Pressure per valve',
    equations: ['135 − 5x = 100'],
    answers: [7],
    types: ['predict'],
    dials: [{ min: 0, max: 10, step: 1 }],
    pokeNotches: [4],
    pins: [{ kind: 'level-x' }],
    ways: ['try', 'balance', 'undo'],
    earns: null,
  },
];

/** The x values the dial reaches before the pin is locked: the poke window. */
/** Which way a tilt leans the whole scale, as a direction pin's options name it. */
function tiltSide(tilt: number): 'tilt-left' | 'tilt-right' | 'level' {
  if (tilt === 0) return 'level';
  return tilt > 0 ? 'tilt-left' : 'tilt-right';
}

function pokeValues(stage: StageSpec): number[] {
  if (stage.dial === 'locked') return [];
  const { min, max } = openingDial(stage);
  const values: number[] = [];
  for (let x = min; x <= max; x += stage.dial.step) values.push(x);
  return values;
}

const machines = rooms.flatMap((room) =>
  room.stages.flatMap((stage, stageIndex) =>
    stage.machines.map((machine) => ({
      room: room.id,
      stage: stageIndex,
      dial: stage.dial,
      ...machine,
    })),
  ),
);

const stages = rooms.flatMap((room) =>
  room.stages.map((stage, index) => ({ room: room.id, index, stage })),
);

describe("rooms 1–4 against the GDD's Puzzle Progression tables", () => {
  it('has a row for every room in content, and a room for every row', () => {
    expect(rooms.map((room) => room.id)).toEqual(gddRooms.map((row) => row.id));
  });

  describe.each(gddRooms)('$id, the $machine', (row) => {
    const room = rooms.find((spec) => spec.id === row.id) as RoomSpec;
    const stagesOf = <T>(pick: (stage: StageSpec) => T): T[] => room.stages.map(pick);

    it('is the machine the GDD names, with what x is there in its xMeaning', () => {
      expect(room.machine).toBe(row.machine);
      const words = row.xIs
        .toLowerCase()
        .split(/[\s,]+/)
        .filter((word) => !['a', 'the', 'then'].includes(word));
      for (const word of words) expect(room.xMeaning.toLowerCase(), word).toContain(word);
    });

    it('has its equations, one per stage, with their answers', () => {
      expect(stagesOf((stage) => stage.machines.map((m) => m.equation))).toEqual(
        row.equations.map((equation) => [equation]),
      );
      expect(stagesOf((stage) => stageSolution(stageEquation(stage)))).toEqual(row.answers);
      expect(stagesOf((stage) => stage.type)).toEqual(row.types);
    });

    it('has its dial ranges, poke windows and pins', () => {
      expect(stagesOf((stage) => stage.dial)).toEqual(row.dials);
      expect(stagesOf((stage) => stage.pokeNotches)).toEqual(row.pokeNotches);
      expect(stagesOf((stage) => stage.pin)).toEqual(row.pins);
    });

    it('is finished by the ways the GDD lists, and earns what it says', () => {
      for (const stage of room.stages) expect(stage.ways).toEqual(row.ways);
      expect(room.earns).toBe(row.earns);
    });
  });
});

describe('the paper test (content/paper-test.ts)', () => {
  it("holds the brief's paper-test equations, each parsing", () => {
    expect(paperTest).toEqual(
      expect.arrayContaining([
        '47 + 38 = 46 + 39',
        '3x + 2 = 20',
        '3x + 2 = 23',
        '3x = 22',
        '2x + 7 = 25',
      ]),
    );
    for (const text of paperTest) expect(parse(text).ok, text).toBe(true);
  });

  it('spots its equations written with swapped sides or commuted terms, and only those', () => {
    expect(onPaperTest('20 = 2 + 3x')).toBe('3x + 2 = 20');
    expect(onPaperTest('39 + 46 = 38 + 47')).toBe('47 + 38 = 46 + 39');
    expect(onPaperTest('25 = 7 + 2x')).toBe('2x + 7 = 25');
    expect(onPaperTest('x · 3 = 22')).toBe('3x = 22');
    expect(onPaperTest('3x + 2 = 21')).toBeNull();
    expect(onPaperTest('2x + 5 = 23')).toBeNull();
  });

  it.each(rooms.map((room) => [room.id, room] as const))(
    'appears nowhere in room %s',
    (_id, room) => {
      for (const equation of roomEquations(room)) {
        expect(onPaperTest(equation), equation).toBeNull();
      }
    },
  );
});

describe('rooms', () => {
  it('starts with room 1, the door lift', () => {
    expect(rooms[0]?.id).toBe('r01');
    expect(rooms[0]?.machine).toBe('door-lift');
    expect(rooms[0]?.stages[0]?.machines.map((m) => m.equation)).toEqual(['x + 4 = 9']);
  });

  it("gives room 1 the GDD's dial, 0–10 in ones, with readouts", () => {
    expect(rooms[0]?.stages[0]?.dial).toEqual({ min: 0, max: 10, step: 1 });
    expect(rooms[0]?.stages[0]?.readouts).toBe(true);
  });

  it('lists the rooms in play order, from room 1', () => {
    expect(rooms.map((room) => room.id)).toEqual(roomIds.slice(0, rooms.length));
  });

  describe("room 4, the water wheel (GDD's Puzzle Progression tables)", () => {
    const room = rooms[3];
    const stage = room?.stages[0] as StageSpec;

    it('is 2x + 5 = 23 on a dial of 0–12, at 0.75° per unit, finished by Balance', () => {
      expect(room?.id).toBe('r04');
      expect(room?.machine).toBe('water-wheel');
      expect(room?.stages).toHaveLength(1);
      expect(stage.type).toBe('solve');
      expect(stage.machines.map((m) => m.equation)).toEqual(['2x + 5 = 23']);
      expect(stage.dial).toEqual({ min: 0, max: 12, step: 1 });
      expect(stage.tiltPerUnit).toBe(0.75);
      expect(stage.readouts).toBe(true);
      expect(stage.ways).toEqual(['balance']);
      expect(stage.fading).toEqual({ try: 'blank', balance: 'auto' });
      expect(room?.earns).toBeNull();
    });

    // Story 1.16 rewrote this test: until then room 4 opened a poke window over 0–3 and a
    // "where it levels" pin beyond the dial, on 0–12.
    it('has no pin and no poke window: its one new idea is Balance, on the whole dial', () => {
      expect(stage.pokeNotches).toBeUndefined();
      expect(stage.pin).toBeUndefined();
      expect(pinTrack(stage)).toBeNull();
      expect(openingDial(stage)).toEqual({ min: 0, max: 12 });
    });

    // Luka, after story 1.16: "the slider reaches 9 always". Until then the dial ran 0–6 and
    // couldn't reach it. Try values still can't finish the room: x = 9 waits for simplifying.
    it('answers 9, which the dial reaches, though Try values can’t finish it', () => {
      const answer = stageSolution(stageEquation(stage));
      expect(answer).toBe(9);
      expect(isOnDial(stage.dial as DialSpec, answer)).toBe(true);
      expect(stage.ways).not.toContain('try');
      expect(answerAllowed(stage, stageEquation(stage))).toBe(false);
    });

    // Story 1.16 rewrote this test: until then he could type x = 9 straight away. The checker
    // still judges it the answer (any correct method), but the room waits for the pans to be
    // simplified first (room/notebook.ts, `answerAllowed`).
    it('takes x = 9 and the check line only once the pans are simplified', () => {
      const given = stageEquation(stage);
      expect(check([given], 'x = 9').kind).toBe('answer');
      expect(answerAllowed(stage, given)).toBe(false);
      expect(answerAllowed(stage, equationOf('2x + 5 − 5 = 23 − 5'))).toBe(false);
      expect(answerAllowed(stage, equationOf('2x = 18'))).toBe(true);
      expect(answerAllowed(stage, equationOf('x = 9'))).toBe(true);
      const lines = [given, equationOf('2x = 18')];
      const verdicts = ['x = 9', '2 · 9 + 5 = 23'].map((line) => {
        const verdict = check(lines, line);
        lines.push(equationOf(line));
        return verdict.kind;
      });
      expect(verdicts).toEqual(['answer', 'check']);
    });

    it('gives x = ☐ and 2 · ☐ + 5 = 23 once x is alone, and 9 fills them', () => {
      const lines = [stageEquation(stage), equationOf('2x = 18')];
      expect(lastLines(stage, { machine: 0, pans: equationOf('2x = 18'), lines: [] })).toEqual([]);
      const templates = lastLines(stage, { machine: 0, pans: equationOf('x = 9'), lines: [] });
      expect(templates).toEqual([
        ['x', '=', '☐'],
        ['2', '·', '☐', '+', '5', '=', '2', '3'],
      ]);
      const filled = (templates ?? []).map((template) => fillBlanks(template, ['9']));
      const verdicts = filled.map((line) => {
        const verdict = check(lines, line);
        const parsed = parse(line);
        if (parsed.ok) lines.push(parsed.equation);
        return verdict.kind;
      });
      expect(verdicts).toEqual(['answer', 'check']);
    });

    // Story 1.16: the pans are weighed at the slider's x through every Balance move, so at
    // a wrong x the scale stays out of balance: at 6, 17 vs 23, then 12 vs 18, then 6 vs 9.
    // At 9 it levels through every line: the slider is his check.
    it('levels only at 9 through its Balance lines, and never hits the clamp at any notch', () => {
      const dial = stage.dial as DialSpec;
      const balanceLines = [
        stageEquation(stage),
        ...(
          canonicalSolution(stageEquation(stage), 'balance', {
            trayGear: stage.trayGear === true,
          }) ?? []
        ).slice(0, -1),
        equationOf('2x : 2 = 18 : 2'),
      ];
      for (let notch = 0; notch <= notchCount(dial); notch += 1) {
        const x = q.rational(dialValue(dial, notch));
        for (const line of balanceLines) {
          const values = sideValues(line, x);
          const at = `${formatEquation(line)} at ${q.toText(x)}`;
          expect(isLevel(values), at).toBe(q.equals(x, q.rational(9)));
          expect(Math.abs(tiltFor(values, stage.tiltPerUnit ?? 1)), at).toBeLessThan(
            tuning.tiltMax,
          );
        }
      }
      const atSix = ['2x + 5 = 23', '2x = 18', 'x = 9'].map((text) => {
        const values = sideValues(equationOf(text), q.rational(6));
        return [q.toText(values.left), q.toText(values.right)];
      });
      expect(atSix).toEqual([
        ['17', '23'],
        ['12', '18'],
        ['6', '9'],
      ]);
      const atNine = ['2x + 5 = 23', '2x = 18', 'x = 9'].map((text) => {
        const values = sideValues(equationOf(text), q.rational(9));
        return [q.toText(values.left), q.toText(values.right)];
      });
      expect(atNine).toEqual([
        ['23', '23'],
        ['18', '18'],
        ['9', '9'],
      ]);
    });

    it('is balanced by a float of 5 on both pans, then a split by 2', () => {
      const lines = canonicalSolution(stageEquation(stage), 'balance', {
        trayGear: stage.trayGear === true,
      });
      expect(lines?.map((line) => formatEquation(line))).toEqual([
        '2x = 18',
        'x = 9',
        '2 · 9 + 5 = 23',
      ]);
    });
  });

  // GDD, Notebook, Fading: Try values gives blanks in rooms 1–3 and a blank page from
  // room 4; Balance writes its lines in rooms 4–5, gives blanks in rooms 6–7 and a blank
  // page from room 8; Undo writes its lines in room 8, gives blanks in room 9 and a blank
  // page from room 10 (epic 4).
  it('gives the tray its x-gear from room 9 on, where Balance is listed (GDD room 9)', () => {
    rooms.forEach((room, index) => {
      for (const stage of room.stages) {
        const expected = index + 1 >= 9 && stage.ways.includes('balance') ? true : undefined;
        expect(stage.trayGear, room.id).toBe(expected);
      }
    });
  });

  it('fades each way as the GDD table says, room by room', () => {
    const fadingFor = (index: number): Partial<Record<WayId, FadingMode>> => {
      const number = index + 1;
      return {
        try: number <= 3 ? 'blanks' : 'blank',
        // Balance is earned at the end of room 3, so rooms 1–3 have no Balance mode.
        // Rooms 6 and 7 keep `auto` (stories 2.9 and 2.10): Balance `blanks` isn't built,
        // filling in each move's numbers would be doing the sums room 6 is about not doing,
        // and room 7's rewrite needs no Balance move.
        balance: number <= 3 ? undefined : number <= 7 ? 'auto' : 'blank',
        // The gear chain is earned at the end of room 7.
        undo: number <= 7 ? undefined : number === 8 ? 'auto' : number === 9 ? 'blanks' : 'blank',
      };
    };
    rooms.forEach((room, index) => {
      const expected = fadingFor(index);
      for (const stage of room.stages) {
        expect(stage.fading.try, room.id).toBe(expected.try);
        expect(stage.fading.balance, room.id).toBe(expected.balance);
        expect(stage.fading.undo, room.id).toBe(expected.undo);
      }
    });
  });

  describe("room 3, the sluice gate (GDD's Puzzle Progression tables)", () => {
    const room = rooms[2];
    const [first, second] = room?.stages ?? [];

    it('has two stages, x − 6 = 8 on a dial of 6–20, then 20 − x = 6 on 0–20, and earns Balance', () => {
      expect(room?.id).toBe('r03');
      expect(room?.machine).toBe('sluice-gate');
      expect(room?.stages).toHaveLength(2);
      expect(first?.machines.map((m) => m.equation)).toEqual(['x − 6 = 8']);
      expect(first?.dial).toEqual({ min: 6, max: 20, step: 1 });
      expect(second?.machines.map((m) => m.equation)).toEqual(['20 − x = 6']);
      expect(second?.dial).toEqual({ min: 0, max: 20, step: 1 });
      for (const stage of [first, second]) {
        expect(stage?.readouts).toBe(true);
        expect(stage?.ways).toEqual(['try']);
        expect(stage?.fading).toEqual({ try: 'blanks' });
      }
      expect(room?.earns).toBe('balance');
    });

    it('answers 14 in both stages', () => {
      expect([first, second].map((stage) => stageSolution(stageEquation(stage)))).toEqual([14, 14]);
    });

    it('opens stage 1 with a poke window over 6, 7, 8 and 9, and a "where it levels" pin', () => {
      expect(first?.pokeNotches).toBe(4);
      expect(first?.pin).toEqual({ kind: 'level-x' });
      expect(pokeValues(first as StageSpec)).toEqual([6, 7, 8, 9]);
      const track = pinTrack(first as StageSpec);
      expect(track).toMatchObject({ kind: 'x', min: 6, max: 20, step: 1 });
    });

    // Story 1.15: the direction pin asks which way the whole scale tilts (it was which way
    // the pan holding x goes). x is a balloon on the left, so the scale tilts right.
    it('gives stage 2 no poke window and a direction pin: x lightens the left, so it tilts right', () => {
      expect(second?.pokeNotches).toBeUndefined();
      expect(second?.pin).toEqual({ kind: 'effect', options: ['tilt-left', 'tilt-right'] });
      expect(second?.type).toBe('predict');
      expect(panPieces(stageEquation(second)).left.map((piece) => piece.kind)).toEqual([
        'weight',
        'spring',
      ]);
      expect(tiltAsXGrows(stageEquation(second))).toBe('tilt-right');
    });
  });

  describe("room 2, the street lamps (GDD's Puzzle Progression tables)", () => {
    const room = rooms[1];
    const [first, second] = room?.stages ?? [];

    it('has two Solve stages, 3x = 12 on a dial of 0–10, then x : 3 = 5 on 0–30 in 3s', () => {
      expect(room?.machine).toBe('street-lamps');
      expect(room?.stages).toHaveLength(2);
      expect(first?.machines.map((m) => m.equation)).toEqual(['3x = 12']);
      expect(first?.dial).toEqual({ min: 0, max: 10, step: 1 });
      expect(second?.machines.map((m) => m.equation)).toEqual(['x : 3 = 5']);
      expect(second?.dial).toEqual({ min: 0, max: 30, step: 3 });
      for (const stage of [first, second]) {
        expect(stage?.type).toBe('solve');
        expect(stage?.readouts).toBe(true);
        expect(stage?.pokeNotches).toBeUndefined();
        expect(stage?.pin).toBeUndefined();
        expect(stage?.ways).toEqual(['try']);
        expect(stage?.fading).toEqual({ try: 'blanks' });
      }
      expect(room?.earns).toBeNull();
    });

    it('has the answers 4, then 15, both on the dial', () => {
      const answers = [first, second].map((stage) => {
        const parsed = parse(stage?.machines[0]?.equation ?? '');
        if (!parsed.ok) throw new Error('does not parse');
        return stageSolution(parsed.equation);
      });
      expect(answers).toEqual([4, 15]);
    });

    it('moves the pans by the same amount at every notch, so no notch hits the clamp', () => {
      for (const stage of [first, second]) {
        if (!stage || stage.dial === 'locked') throw new Error('no dial');
        const parsed = parse(stage.machines[0]?.equation ?? '');
        if (!parsed.ok) throw new Error('does not parse');
        const tilts = Array.from({ length: notchCount(stage.dial) + 1 }, (_, notch) =>
          tiltFor(
            sideValues(parsed.equation, q.rational(dialValue(stage.dial as DialSpec, notch))),
            stage.tiltPerUnit ?? tuning.tiltPerUnit,
          ),
        );
        const steps = tilts.slice(1).map((tilt, i) => tilt - (tilts[i] ?? 0));
        for (const change of steps) expect(change).toBeCloseTo(steps[0] ?? 0);
        expect(Math.max(...tilts.map(Math.abs))).toBeLessThan(tuning.tiltMax);
      }
    });
  });

  it('has one entry per room id', () => {
    const ids = rooms.map((room) => room.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe.each(rooms)('room $id', (room) => {
    it('has a machine, an xMeaning and a mapChange', () => {
      expect(room.machine).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(room.xMeaning.trim().length).toBeGreaterThan(0);
      expect(room.mapChange?.trim().length ?? 0).toBeGreaterThan(0);
    });

    it('has at least one stage, each with 1–3 machines', () => {
      expect(room.stages.length).toBeGreaterThan(0);
      for (const stage of room.stages) {
        expect(stage.machines.length).toBeGreaterThanOrEqual(1);
        expect(stage.machines.length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe.each(stages)('$room stage $index', ({ stage }) => {
    it('has a dial of whole numbers from 0 up, ending on a notch', () => {
      if (stage.dial === 'locked') return;
      const { min, max, step } = stage.dial;
      for (const value of [min, max, step]) expect(Number.isInteger(value)).toBe(true);
      expect(min).toBeGreaterThanOrEqual(0);
      expect(max).toBeGreaterThan(min);
      expect(step).toBeGreaterThanOrEqual(1);
      expect((max - min) % step).toBe(0);
    });

    it('opens a poke window of 3 or 4 notches (or all of them) only with a pin', () => {
      if (stage.pokeNotches === undefined) return;
      expect(stage.pin).toBeDefined();
      expect([3, 4, 'all']).toContain(stage.pokeNotches);
    });

    it('has only pins the engine can place and resolve, each with its answer on its track', () => {
      if (!stage.pin) return;
      expect(pinSupported(stage.pin)).toBe(true);
      const track = pinTrack(stage);
      if (!track) throw new Error('no track');
      const values = Array.from({ length: slotCount(track) }, (_, slot) => slotValue(track, slot));
      if (track.kind === 'x') {
        const answer = stageSolution(stageEquation(stage));
        expect(values).toContainEqual({ kind: 'x', x: answer });
      } else if (track.kind === 'choice') {
        expect(track.options).toContain(tiltAsXGrows(stageEquation(stage)));
      } else {
        // A line pin (room 7): the planted line is one of its places.
        expect(values.length).toBeGreaterThan(0);
      }
    });

    // Story 1.15: the direction pin asks about the whole scale, so x no longer has to sit on
    // one side only (1.14 checked that); growing x must tip it one way, and both ways are offered.
    it('gives every effect pin option its text, and both ways the scale can tilt', () => {
      if (stage.pin?.kind !== 'effect') return;
      for (const option of stage.pin.options) expect(hr.pin.options[option]).toMatch(/\S/);
      expect([...stage.pin.options].sort()).toEqual(['tilt-left', 'tilt-right']);
      expect(() => tiltAsXGrows(stageEquation(stage))).not.toThrow();
    });

    // Story 1.15 review: the machine tests a direction pin by turning the dial (room/pin.ts).
    // 1.14's 3 notches left room 3.2 tipped left, so the right answer, `desno`, looked wrong.
    // Wherever the dial stood when he confirmed, the test must end tipped the right way.
    it("ends the machine's test of a direction pin tipped the way the right option names", () => {
      if (stage.pin?.kind !== 'effect') return;
      const equation = stageEquation(stage);
      const right = tiltAsXGrows(equation);
      const value = { kind: 'choice', index: stage.pin.options.indexOf(right) } as const;
      for (const from of pokeValues(stage)) {
        const x = machineTestX(stage, from, value);
        const values = sideValues(equation, q.rational(x));
        const tilt = tiltFor(values, stage.tiltPerUnit ?? tuning.tiltPerUnit);
        expect(tiltSide(tilt), `from x = ${from}, tested at ${x}`).toBe(right);
      }
    });

    it("never levels the pans or hits the tilt clamp inside the poke window, so it can't give the answer away", () => {
      if (stage.pokeNotches === undefined) return;
      const equation = stageEquation(stage);
      // A mistake pin is about a line, not x: the slider is open from the start, and levelling
      // at the answer is how he checks the lines (room 7, story 2.10).
      const pinsX = stage.pin?.kind !== 'wrong-line';
      for (const x of pokeValues(stage)) {
        if (!pinsX) break;
        const values = sideValues(equation, q.rational(x));
        expect(isLevel(values), `x = ${x}`).toBe(false);
        const tilt = tiltFor(values, stage.tiltPerUnit ?? tuning.tiltPerUnit);
        expect(Math.abs(tilt), `x = ${x}`).toBeLessThan(tuning.tiltMax);
      }
    });

    it('is finished by the canonical solution of every way it lists (steps.ts)', () => {
      const equation = stageEquation(stage);
      for (const way of stage.ways) {
        const lines = canonicalSolution(equation, way, { trayGear: stage.trayGear === true });
        expect(lines, way).not.toBeNull();
        const committed = [equation];
        const verdicts = (lines ?? []).map((line) => {
          const verdict = check(committed, line);
          committed.push(line);
          return verdict.kind;
        });
        expect(verdicts.slice(-2), way).toEqual(['answer', 'check']);
        for (const verdict of verdicts.slice(0, -2)) expect(verdict, way).toBe('valid');
      }
    });

    it('can be finished by every way it lists, within the dial, the tray and the splitter', () => {
      const equation = stageEquation(stage);
      const answer = stageSolution(equation);
      for (const way of stage.ways) {
        if (way === 'try') {
          expect(
            stage.dial !== 'locked' && isOnDial(stage.dial, answer),
            'the dial reaches x',
          ).toBe(true);
        }
        if (way === 'balance') {
          const lines = canonicalSolution(equation, 'balance', {
            trayGear: stage.trayGear === true,
          });
          expect(lines, 'Balance finishes').not.toBeNull();
          let previous = equation;
          for (const line of lines ?? []) {
            const move = classifyMove(previous, line);
            if (move.kind === 'add-both') {
              // Story 4.2: x-gears only where the stage's tray holds one.
              expect(move.term.kind === 'num' || stage.trayGear === true).toBe(true);
              if (move.term.kind === 'x') {
                expect(move.term.coef).toBeLessThanOrEqual(tuning.trayMaxNumber);
              }
              if (move.term.kind === 'num') {
                expect(move.term.value).toBeGreaterThanOrEqual(trayMinNumber);
                // A number taken off both sides can also be a weight dragged off a pan,
                // which has no stepper limit (story 4.4: room 9's 100).
                const value = move.term.value;
                const draggedOff =
                  move.term.sign === -1 &&
                  (['left', 'right'] as const).some((side) =>
                    sidePieces(previous[side], side).some(
                      (piece) =>
                        piece.kind === 'weight' && q.equals(piece.value, q.rational(value)),
                    ),
                  );
                if (!draggedOff) expect(value).toBeLessThanOrEqual(tuning.trayMaxNumber);
              }
            }
            if (move.kind === 'split-both') {
              expect(move.parts).toBeGreaterThanOrEqual(tuning.splitterMinParts);
              expect(move.parts).toBeLessThanOrEqual(tuning.splitterMaxParts);
              // The splitter itself gets there: an even split of the line before.
              const outcome = splitOutcome(previous, move.parts);
              expect(outcome?.kind).toBe('even');
              if (outcome?.kind === 'even') expect(sameLayout(outcome.pans, line)).toBe(true);
            }
            previous = line;
          }
        }
      }
    });

    it('tilts by more than 0° per unit when it sets its own tilt', () => {
      if (stage.tiltPerUnit !== undefined) expect(stage.tiltPerUnit).toBeGreaterThan(0);
    });

    // Story 1.16: where Try values can't finish, the answer waits for simplified pans. Until
    // Luka's change after it, the dial also had to stop short of x there; now the slider may
    // reach x and level the pans (room 4: it is his check), so the stage's own equation must
    // need simplifying, or the dial alone would finish it.
    it("refuses the answer on its first line where Try values can't finish", () => {
      if (stage.ways.includes('try')) return;
      expect(answerAllowed(stage, stageEquation(stage))).toBe(false);
    });

    // Story 1.16: with Balance `auto` the last two lines come as blanks once x is alone.
    it('can be finished by filling the last two blanks with x once Balance leaves x alone', () => {
      if (!blanksOnceAlone(stage)) return;
      const equation = stageEquation(stage);
      const answer = stageSolution(equation);
      const templates = lastLines(stage, {
        machine: 0,
        pans: equationOf(`x = ${answer}`),
        lines: [],
      });
      const digits = tokenize(String(answer));
      if (!digits.ok) throw new Error('no answer');
      const lines = [
        equation,
        ...(
          canonicalSolution(equation, 'balance', { trayGear: stage.trayGear === true }) ?? []
        ).slice(0, -2),
      ];
      const verdicts = (templates ?? []).map((template) => {
        const line = fillBlanks(template, digits.tokens);
        const verdict = check(lines, line);
        const filled = parse(line);
        if (filled.ok) lines.push(filled.equation);
        return verdict.kind;
      });
      expect(verdicts).toEqual(['answer', 'check']);
    });

    it('can be finished by filling its blanks with x, when Try values fades to blanks', () => {
      const templates = openingTemplates(stage, 0);
      if (stage.fading.try !== 'blanks') {
        expect(templates).toEqual([]);
        return;
      }
      const parsed = parse(stage.machines[0]?.equation ?? '');
      if (!parsed.ok) throw new Error('does not parse');
      const answer = tokenize(String(stageSolution(parsed.equation)));
      if (!answer.ok) throw new Error('no answer');
      const lines = [parsed.equation];
      const verdicts = templates.map((template) => {
        const line = fillBlanks(template, answer.tokens);
        const verdict = check(lines, line);
        const filled = parse(line);
        if (filled.ok) lines.push(filled.equation);
        return verdict.kind;
      });
      expect(verdicts).toEqual(['answer', 'check']);
    });
  });

  describe.each(machines)('$room stage $stage: $equation', ({ equation, dial }) => {
    it('weighs a whole number of 0 or more on each side at every notch, for the readouts', () => {
      if (dial === 'locked') return;
      const parsed = parse(equation);
      if (!parsed.ok) throw new Error(`does not parse: ${parsed.reason}`);
      for (let notch = 0; notch <= notchCount(dial); notch += 1) {
        const values = sideValues(parsed.equation, q.rational(dialValue(dial, notch)));
        for (const value of [values.left, values.right]) {
          expect(q.isInteger(value)).toBe(true);
          expect(q.compare(value, q.zero)).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('parses, with one solution, a whole number', () => {
      const parsed = parse(equation);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) return;
      const solution = solve(parsed.equation);
      expect(solution.kind).toBe('one');
      if (solution.kind !== 'one') return;
      expect(q.isInteger(solution.x)).toBe(true);
      expect(q.compare(solution.x, q.zero)).toBeGreaterThanOrEqual(0);
    });

    it('has pieces on both pans', () => {
      const parsed = parse(equation);
      if (!parsed.ok) throw new Error(`does not parse: ${parsed.reason}`);
      const pieces = panPieces(parsed.equation);
      expect(pieces.left.length).toBeGreaterThan(0);
      expect(pieces.right.length).toBeGreaterThan(0);
    });
  });
});
