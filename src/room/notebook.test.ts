import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { r01 } from '@/content/rooms/r01-door-lift';
import { hr } from '@/content/text/hr';
import type { Equation } from '@/math/expr';
import { parse } from '@/math/parse';
import { TOKENS, type Token, tokenize } from '@/math/tokens';
import { dialView, setDial } from '@/room/dial';
import {
  answerAllowed,
  blankMaxDigits,
  committedEquations,
  deleteToken,
  draftDisplay,
  enterLine,
  fillsBlank,
  isCommitted,
  isRefused,
  jammedLine,
  keyWorks,
  lastCommitted,
  lineDisplays,
  lineTokens,
  type NotebookKey,
  type NotebookStep,
  notebookWrites,
  refusalView,
  typeToken,
} from '@/room/notebook';
import { touchMachine } from '@/room/phases';
import { simplified } from '@/room/pieces';
import { enterRoom } from '@/room/room';
import { scaleView } from '@/room/scale';
import type { Phase, RoomSpec, RoomState, StageSpec } from '@/room/types';

// Room 1 fills blanks (Try values `blanks`); most tests write whole lines, so they use
// room 1 with a blank page (`blank`), as room 4 has.
const roomOneStage: StageSpec = { ...(r01.stages[0] as StageSpec), fading: { try: 'blank' } };
const freeRoomOne: RoomSpec = { ...r01, stages: [roomOneStage] };

/** The room after his first touch on the machine: the stage is open, so he can write. */
function opened(room: RoomState): RoomState {
  return touchMachine(room)?.room ?? room;
}

function roomWith(equation: string, extra: Partial<StageSpec> = {}): RoomState {
  return opened(
    enterRoom({ ...r01, stages: [{ ...roomOneStage, machines: [{ equation }], ...extra }] }).room,
  );
}

function tokens(text: string): Token[] {
  const result = tokenize(text);
  if (!result.ok) throw new Error(`"${text}" has a symbol that isn't on the pad`);
  return result.tokens;
}

function step<T extends NotebookStep>(result: T | null): T {
  if (!result) throw new Error('the notebook ignored the key');
  return result;
}

/** Types the text key by key, as the pad would. */
function typed(room: RoomState, text: string): RoomState {
  return tokens(text).reduce((current, token) => step(typeToken(current, token)).room, room);
}

/** Types the text, then presses enter. */
function written(room: RoomState, text: string) {
  return step(enterLine(typed(room, text), 0));
}

function inPhase(room: RoomState, phase: Phase): RoomState {
  return { ...room, stage: { ...room.stage, phase } };
}

const roomOne = (): RoomState => opened(enterRoom(freeRoomOne).room);

describe('the notebook opens on the stage equation', () => {
  it('has line 0, read-only, and an empty draft', () => {
    const room = roomOne();
    expect(lineDisplays(room.stage.lines)).toEqual([
      { number: 0, text: 'x + 4 = 9', source: 'given' },
    ]);
    expect(room.stage.draft).toEqual([]);
  });

  it('never deletes line 0: delete on an empty draft is ignored', () => {
    expect(deleteToken(roomOne())).toBeNull();
  });

  it('shows the stage equation in school notation', () => {
    const room = roomWith('5905 − 27x = 316');
    expect(lineDisplays(room.stage.lines)[0]?.text).toBe('5 905 − 27x = 316');
  });
});

describe('editing the draft', () => {
  it('types each pad token at the end of the draft', () => {
    for (const token of TOKENS) {
      expect(step(typeToken(roomOne(), token)).room.stage.draft).toEqual([token]);
    }
    expect(typed(roomOne(), '2x+7=25').stage.draft).toEqual(tokens('2x + 7 = 25'));
  });

  it('deletes from the end, one token at a time', () => {
    let room = typed(roomOne(), 'x=12');
    room = step(deleteToken(room)).room;
    expect(room.stage.draft).toEqual(tokens('x = 1'));
    room = step(deleteToken(room)).room;
    room = step(deleteToken(room)).room;
    room = step(deleteToken(room)).room;
    expect(room.stage.draft).toEqual([]);
    expect(deleteToken(room)).toBeNull();
  });

  it('changes nothing but the draft, and emits nothing', () => {
    const room = roomOne();
    const next = step(typeToken(room, '5'));
    expect(next.events).toEqual([]);
    expect(next.room.stage.lines).toBe(room.stage.lines);
    expect(next.room.stage.pans).toBe(room.stage.pans);
    expect({ ...next.room.stage, draft: [] }).toEqual(room.stage);
  });

  it(`holds at most ${tuning.draftMaxTokens} tokens`, () => {
    const full = typed(roomOne(), '1'.repeat(tuning.draftMaxTokens));
    expect(full.stage.draft).toHaveLength(tuning.draftMaxTokens);
    expect(typeToken(full, '2')).toBeNull();
    expect(step(deleteToken(full)).room.stage.draft).toHaveLength(tuning.draftMaxTokens - 1);
  });
});

describe('enter judges the draft (story 1.3)', () => {
  it.each([
    ['incomplete', 'x + 4 =', 'incomplete'],
    ['incomplete', '', 'incomplete'],
    ['incomplete', 'x = 9 : 0', 'incomplete'],
    ['nonlinear', 'x · x = 25', 'nonlinear'],
    ['aside', '9 − 4 = 5', 'aside'],
    ['aside', '5 + 4 = 9', 'aside'],
  ])('refuses an %s line (%s): it stays in the draft and wiggles', (_kind, text, verdict) => {
    const room = typed(roomOne(), text);
    const result = step(enterLine(room, 0));
    expect(result.verdict.kind).toBe(verdict);
    expect(result.room.stage.draft).toEqual(room.stage.draft);
    expect(result.room.stage.lines).toBe(room.stage.lines);
    expect(result.room.stage.jam).toBeNull();
    expect(result.room.stage.refused).toBe(1);
    expect(result.events).toEqual([]);
  });

  it('wiggles again on every refusal', () => {
    let room = typed(roomOne(), 'x +');
    room = step(enterLine(room, 0)).room;
    room = step(enterLine(room, 0)).room;
    room = step(enterLine(room, 0)).room;
    expect(room.stage.refused).toBe(3);
  });

  it('keeps a wrong line in the draft, marked as wrong, never in lines', () => {
    const room = typed(roomOne(), 'x = 6');
    const result = step(enterLine(room, 0));
    expect(result.verdict.kind).toBe('wrong');
    expect(result.room.stage.draft).toEqual(tokens('x = 6'));
    expect(result.room.stage.lines).toEqual(room.stage.lines);
    expect(result.room.stage.jam).toMatchObject({ kind: 'line' });
    expect(result.room.stage.refused).toBe(0);
    expect(result.events).toEqual([
      { type: 'LineWrong', roomId: 'r01', stage: 0, line: 'x = 6' },
      { type: 'MachineJammed', roomId: 'r01', kind: 'line' },
    ]);
  });

  it('ignores enter again until the wrong line is edited', () => {
    const jammed = written(roomOne(), 'x = 6').room;
    expect(enterLine(jammed, 0)).toBeNull();
  });

  it('clears the mark on any edit, and judges the edited line again', () => {
    const jammed = written(roomOne(), 'x = 6').room;
    const deleted = step(deleteToken(jammed)).room;
    expect(deleted.stage.jam).toBeNull();
    expect(deleted.stage.draft).toEqual(tokens('x ='));
    const retyped = step(typeToken(deleted, '5')).room;
    expect(step(enterLine(retyped, 0)).verdict.kind).toBe('answer');

    const extended = step(typeToken(jammed, '0')).room;
    expect(extended.stage.jam).toBeNull();
    expect(step(enterLine(extended, 0)).verdict.kind).toBe('wrong');
  });

  it('appends a valid line to lines, read-only, and empties the draft', () => {
    const result = written(roomOne(), 'x = 9 − 4');
    expect(result.verdict).toMatchObject({ kind: 'valid', progress: true });
    expect(result.room.stage.lines).toHaveLength(2);
    expect(result.room.stage.lines[1]).toEqual({
      tokens: tokens('x = 9 − 4'),
      source: 'typed',
      verdict: result.verdict,
    });
    expect(result.room.stage.draft).toEqual([]);
    expect(result.events).toEqual([
      { type: 'LineAccepted', roomId: 'r01', stage: 0, source: 'typed', progress: true },
    ]);
  });

  it('accepts a valid line without progress, and says so', () => {
    const result = written(roomWith('2x + 7 = 25'), '2x + 8 = 26');
    expect(result.verdict).toMatchObject({ kind: 'valid', progress: false });
    expect(result.room.stage.lines).toHaveLength(2);
    expect(result.events).toEqual([
      { type: 'LineAccepted', roomId: 'r01', stage: 0, source: 'typed', progress: false },
    ]);
  });

  it('appends the answer line, then the check line, and then takes no more keys', () => {
    const answered = written(roomOne(), 'x = 5');
    expect(answered.verdict.kind).toBe('answer');
    expect(answered.events).toMatchObject([{ type: 'LineAccepted', progress: true }]);
    const checked = written(answered.room, '5 + 4 = 9');
    expect(checked.verdict.kind).toBe('check');
    expect(checked.events).toMatchObject([
      { type: 'LineAccepted', progress: true },
      { type: 'StageLocked' },
    ]);
    expect(lineDisplays(checked.room.stage.lines).map((line) => line.text)).toEqual([
      'x + 4 = 9',
      'x = 5',
      '5 + 4 = 9',
    ]);
    const done = checked.room;
    expect(notebookWrites(done.stage)).toBe(false);
    expect(typeToken(done, '1')).toBeNull();
    expect(deleteToken(done)).toBeNull();
    expect(enterLine(done, 0)).toBeNull();
  });

  it('judges each line against the committed lines before it', () => {
    let room = roomWith('2x + 7 = 25');
    room = written(room, '2x = 25 − 7').room;
    room = written(room, '2x = 18').room;
    expect(written(room, 'x = 18 : 2').verdict).toMatchObject({ kind: 'valid', progress: true });
    expect(written(room, '2 · 9 + 7 = 25').verdict.kind).toBe('aside');
    room = written(room, 'x = 9').room;
    expect(written(room, '2 · 9 + 7 = 25').verdict.kind).toBe('check');
  });

  it('never stores a line that is not valid, an answer or a check (fast-check)', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...TOKENS), { maxLength: 12 }), (draft) => {
        const room = draft.reduce(
          (current, token) => step(typeToken(current, token)).room,
          roomOne(),
        );
        const result = step(enterLine(room, 0));
        const { stage } = result.room;
        if (isCommitted(result.verdict)) {
          expect(stage.lines).toHaveLength(2);
          expect(stage.lines[1]?.tokens).toEqual(draft);
          expect(stage.draft).toEqual([]);
        } else {
          expect(stage.lines).toHaveLength(1);
          expect(stage.draft).toEqual(draft);
          expect(stage.jam === null).toBe(isRefused(result.verdict));
        }
        expect(committedEquations(stage.lines)).toHaveLength(stage.lines.length);
      }),
      { numRuns: 500 },
    );
  });
});

describe('when the notebook takes keys (Pattern 2)', () => {
  it.each<[Phase, boolean]>([
    ['arrive', false],
    ['poke', false],
    ['pin', false],
    ['open', true],
    ['locked', false],
    ['restart', false],
    ['done', false],
  ])('in %s: %s', (phase, writes) => {
    const room = inPhase(typed(roomOne(), 'x = 5'), phase);
    expect(notebookWrites(room.stage)).toBe(writes);
    expect(typeToken(room, '1') !== null).toBe(writes);
    expect(deleteToken(room) !== null).toBe(writes);
    expect(enterLine(room, 0) !== null).toBe(writes);
  });
});

describe('a wrong line jams the machine (Pattern 2)', () => {
  it('holds the dial still until he edits the line', () => {
    const jammed = written(roomOne(), 'x = 6').room;
    expect(setDial(jammed, 1)).toBeNull();
    expect(dialView(jammed)?.turns).toBe(false);
    const edited = step(deleteToken(jammed)).room;
    expect(dialView(edited)?.turns).toBe(true);
    expect(setDial(edited, 1)?.room.stage.dialX).toBe(1);
  });

  it('clears the line jam on any edit, the only jam there is (story 1.15 refuses uneven splits)', () => {
    const jammed = written(roomOne(), 'x = 6').room;
    expect(jammed.stage.jam).toMatchObject({ kind: 'line' });
    expect(enterLine(jammed, 0)).toBeNull();
    expect(step(typeToken(jammed, '1')).room.stage.jam).toBeNull();
    expect(step(deleteToken(jammed)).room.stage.jam).toBeNull();
  });
});

describe('verdict groups', () => {
  it('refuses incomplete, nonlinear and aside; commits valid, answer and check', () => {
    expect(isRefused({ kind: 'incomplete' })).toBe(true);
    expect(isRefused({ kind: 'nonlinear' })).toBe(true);
    expect(isRefused({ kind: 'aside' })).toBe(true);
    expect(isRefused({ kind: 'wrong' })).toBe(false);
    expect(isCommitted({ kind: 'wrong' })).toBe(false);
    expect(isCommitted({ kind: 'answer' })).toBe(true);
    expect(isCommitted({ kind: 'check' })).toBe(true);
    expect(isCommitted({ kind: 'valid', move: { kind: 'none' }, progress: false })).toBe(true);
  });
});

function equation(text: string): Equation {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.equation;
}

/** Room 1 as authored: Try values fades to blanks. */
const blanksRoomOne = (): RoomState => opened(enterRoom(r01).room);

// Story 1.16 rewrote this block in place: until then a committed line was acted out at the
// stage's solution, so it always hung level. Now the pans stay at the dial's x.
describe('a committed line on the pans (story 1.7; one x, story 1.16)', () => {
  it("replaces the pans with the line's layout, weighed where the dial is", () => {
    const explored = step(setDial(roomWith('2x + 7 = 25'), 4)).room;
    const result = written(explored, '2x = 25 − 7');
    expect(result.room.stage.pans).toEqual(equation('2x = 25 − 7'));
    expect(result.room.stage.dialX).toBe(4);
    expect(scaleView(result.room)).toMatchObject({ x: 4, level: false });
  });

  it('never fires PansLevel, even when a committed line hangs level at the dial’s x', () => {
    let room = step(setDial(roomWith('2x + 7 = 25'), 9)).room;
    for (const line of ['2x = 25 − 7', '2x = 18', 'x = 18 : 2', 'x = 9', '2 · 9 + 7 = 25']) {
      const result = written(room, line);
      expect(result.events.map((event) => event.type)).not.toContain('PansLevel');
      expect(scaleView(result.room).level).toBe(true);
      room = result.room;
    }
  });

  it("weighs the line's layout at the dial's next notch", () => {
    const acted = written(roomOne(), 'x = 9 − 4').room;
    const turned = step(setDial(acted, 3));
    expect(turned.room.stage.pans).toEqual(equation('x = 9 − 4'));
    expect(turned.room.stage.dialX).toBe(3);
    expect(scaleView(turned.room).x).toBe(3);
  });

  it('lets the dial level the committed layout, which fires PansLevel as usual', () => {
    const acted = written(roomOne(), 'x = 9 − 4').room;
    expect(step(setDial(acted, 5)).events).toEqual([
      { type: 'DialNotch', x: 5 },
      { type: 'PansLevel', roomId: 'r01', stage: 0, x: 5 },
    ]);
  });
});

describe('a committed line moves the machine (story 1.7)', () => {
  it(`adds ${tuning.progressStep} per valid line with progress, up to ${tuning.progressCap}`, () => {
    // Five lines, each with a smaller progress tuple than the one before.
    let room = roomWith('2x + 1 + 2 + 4 = 25');
    const seen: number[] = [];
    for (const line of ['2x + 3 + 4 = 25', '2x + 7 = 25', '2x = 25 − 7', '2x = 18', 'x = 18 : 2']) {
      const result = written(room, line);
      expect(result.verdict, line).toMatchObject({ kind: 'valid', progress: true });
      expect(result.events).toEqual([
        { type: 'LineAccepted', roomId: 'r01', stage: 0, source: 'typed', progress: true },
      ]);
      room = result.room;
      seen.push(room.stage.machineProgress[0] ?? Number.NaN);
    }
    expect(seen).toEqual([0.2, 0.4, 0.6, 0.8, 0.8]);
  });

  // Story 1.16: until then a committed line was acted out at the solution, always level.
  it('weighs the line at the dial’s x while it moves: level only where the dial levels it', () => {
    const atZero = written(roomWith('2x + 7 = 25'), '2x = 18').room;
    expect(atZero.stage.machineProgress).toEqual([0.2]);
    expect(scaleView(atZero)).toMatchObject({ x: 0, level: false, tilt: -15 });
    const atNine = written(step(setDial(roomWith('2x + 7 = 25'), 9)).room, '2x = 18').room;
    expect(scaleView(atNine)).toMatchObject({ x: 9, level: true, tilt: 0 });
  });

  it('accepts a valid line without progress and leaves the machine where it is', () => {
    const moved = written(roomWith('2x + 7 = 25'), '2x = 18').room;
    const result = written(moved, '2x + 8 = 26');
    expect(result.verdict).toMatchObject({ kind: 'valid', progress: false });
    expect(result.room.stage.lines).toHaveLength(3);
    expect(result.room.stage.machineProgress).toEqual([0.2]);
    const first = written(roomWith('2x + 7 = 25'), '2x + 8 = 26').room;
    expect(first.stage.machineProgress).toEqual([0]);
  });

  it('sets 0.9 on the answer line, then 1 on the check line, which locks the stage', () => {
    const answered = written(roomWith('2x + 7 = 25'), 'x = 9');
    expect(answered.room.stage.machineProgress).toEqual([tuning.progressAnswer]);
    expect(answered.room.stage.phase).toBe('open');
    const checked = written(answered.room, '2 · 9 + 7 = 25');
    expect(checked.room.stage.machineProgress).toEqual([1]);
    expect(checked.room.stage.phase).toBe('locked');
    expect(checked.events).toEqual([
      { type: 'LineAccepted', roomId: 'r01', stage: 0, source: 'typed', progress: true },
      { type: 'StageLocked', roomId: 'r01', stage: 0 },
    ]);
  });

  it('goes from open to locked on the check line, and the notebook and dial stop', () => {
    const open = inPhase(written(roomOne(), 'x = 5').room, 'open');
    const locked = written(open, '5 + 4 = 9').room;
    expect(locked.stage.phase).toBe('locked');
    expect(notebookWrites(locked.stage)).toBe(false);
    expect(dialView(locked)?.turns).toBe(false);
  });

  it('moves only the active machine', () => {
    const room = roomOne();
    const two: RoomState = { ...room, stage: { ...room.stage, machineProgress: [0, 0] } };
    expect(written(two, 'x = 9 − 4').room.stage.machineProgress).toEqual([0.2, 0]);
  });
});

describe('a wrong line jams the machine (story 1.7)', () => {
  it('is acted out, stays in the draft, not in lines, and fires MachineJammed', () => {
    const result = written(roomOne(), 'x = 6');
    const { stage } = result.room;
    expect(stage.jam).toMatchObject({ kind: 'line' });
    expect(stage.lines).toHaveLength(1);
    expect(stage.draft).toEqual(tokens('x = 6'));
    expect(jammedLine(stage)).toEqual(equation('x = 6'));
    expect(result.events).toContainEqual({ type: 'MachineJammed', roomId: 'r01', kind: 'line' });
    expect(stage.machineProgress).toEqual([0]);
  });

  it(`tips the pans at least ${tuning.jamMinTilt}°, so a near miss still shows`, () => {
    for (const line of ['x = 6', 'x = 4', 'x = 16', 'x + 4 = 10', 'x = x', 'x + 1 = x']) {
      const view = scaleView(written(roomOne(), line).room);
      expect(Math.abs(view.tilt), line).toBeGreaterThanOrEqual(tuning.jamMinTilt);
      expect(view.level, line).toBe(false);
    }
    const answered = written(roomOne(), 'x = 5').room;
    const falseCheck = scaleView(written(answered, '6 + 4 = 9').room);
    expect(falseCheck.tilt).toBe(tuning.jamMinTilt);
  });

  it('counts jams in a row, and resets the count on a committed line', () => {
    let room = written(roomOne(), 'x = 6').room;
    expect(room.stage.jamsInARow).toBe(1);
    room = written(step(deleteToken(room)).room, '7').room;
    expect(room.stage.jamsInARow).toBe(2);
    room = step(enterLine(step(deleteToken(room)).room, 0)).room; // `x =` is refused, not a jam
    expect(room.stage.jamsInARow).toBe(2);
    room = written(room, '8').room;
    expect(room.stage.jamsInARow).toBe(3);
    room = written(step(deleteToken(room)).room, '5').room;
    expect(room.stage.lines).toHaveLength(2);
    expect(room.stage.jamsInARow).toBe(0);
  });

  it('returns the pans to the last committed line on any edit, and judges the edit again', () => {
    const moved = written(roomWith('2x + 7 = 25'), '2x = 18').room;
    const jammed = written(moved, 'x = 8').room;
    expect(jammedLine(jammed.stage)).toEqual(equation('x = 8'));
    const edited = step(deleteToken(jammed)).room;
    expect(edited.stage.jam).toBeNull();
    expect(jammedLine(edited.stage)).toBeNull();
    expect(edited.stage.pans).toEqual(equation('2x = 18'));
    expect(lastCommitted(edited.stage)).toEqual(equation('2x = 18'));
    expect(step(enterLine(step(typeToken(edited, '9')).room, 0)).verdict.kind).toBe('answer');
  });

  it('shows the pans as they were before the wrong line once it is edited', () => {
    const explored = step(setDial(roomOne(), 6)).room;
    const edited = step(deleteToken(written(explored, 'x = 6').room)).room;
    expect(scaleView(edited)).toEqual(scaleView(explored));
    const acted = written(roomOne(), 'x = 9 − 4').room;
    const back = step(deleteToken(written(acted, 'x = 6').room)).room;
    expect(scaleView(back)).toEqual(scaleView(acted));
  });
});

describe('Try values blanks (story 1.7)', () => {
  const emptyAnswer = [
    { kind: 'text', text: 'x = ' },
    { kind: 'blank', text: '' },
  ];
  const emptyCheck = [
    { kind: 'blank', text: '' },
    { kind: 'text', text: ' + 4 = 9' },
  ];

  it('opens room 1 with x = ☐ to fill and the check line with x blanked after it', () => {
    const { stage } = blanksRoomOne();
    expect(fillsBlank(stage)).toBe(true);
    expect(draftDisplay(stage)).toEqual({ draft: emptyAnswer, upcoming: [emptyCheck] });
  });

  it('fills only the current blank: digits go in, other keys do nothing', () => {
    const room = blanksRoomOne();
    for (const token of TOKENS) {
      const result = typeToken(room, token);
      if ('0123456789'.includes(token)) expect(result?.room.stage.draft).toEqual([token]);
      else expect(result, token).toBeNull();
    }
    const typedIn = typed(room, '15');
    expect(lineTokens(typedIn.stage)).toEqual(tokens('x = 15'));
    expect(draftDisplay(typedIn.stage).draft).toEqual([
      { kind: 'text', text: 'x = ' },
      { kind: 'blank', text: '15' },
    ]);
  });

  it(`holds at most ${blankMaxDigits} digits in a blank`, () => {
    const full = typed(blanksRoomOne(), '1'.repeat(blankMaxDigits));
    expect(typeToken(full, '1')).toBeNull();
  });

  it("clears the blank on delete, never the template's own text", () => {
    const cleared = step(deleteToken(typed(blanksRoomOne(), '15'))).room;
    expect(cleared.stage.draft).toEqual([]);
    expect(draftDisplay(cleared.stage).draft).toEqual(emptyAnswer);
    expect(deleteToken(cleared)).toBeNull();
  });

  it('writes the answer line, then fills the check line, which locks the machine', () => {
    const answered = written(blanksRoomOne(), '5');
    expect(answered.verdict.kind).toBe('answer');
    expect(answered.room.stage.lines[1]?.tokens).toEqual(tokens('x = 5'));
    expect(answered.room.stage.machineProgress).toEqual([0.9]);
    expect(draftDisplay(answered.room.stage)).toEqual({ draft: emptyCheck, upcoming: [] });
    const checked = written(answered.room, '5');
    expect(checked.verdict.kind).toBe('check');
    expect(lineDisplays(checked.room.stage.lines).map((line) => line.text)).toEqual([
      'x + 4 = 9',
      'x = 5',
      '5 + 4 = 9',
    ]);
    expect(checked.room.stage.phase).toBe('locked');
    expect(checked.room.stage.machineProgress).toEqual([1]);
    expect(checked.room.stage.templates).toEqual([]);
    expect(checked.events).toContainEqual({ type: 'StageLocked', roomId: 'r01', stage: 0 });
  });

  it('jams on a wrong fill; delete clears the blank and the jam together', () => {
    const jammed = written(blanksRoomOne(), '6');
    expect(jammed.verdict.kind).toBe('wrong');
    expect(jammed.events).toEqual([
      { type: 'LineWrong', roomId: 'r01', stage: 0, line: 'x = 6' },
      { type: 'MachineJammed', roomId: 'r01', kind: 'line' },
    ]);
    expect(jammedLine(jammed.room.stage)).toEqual(equation('x = 6'));
    const cleared = step(deleteToken(jammed.room)).room;
    expect(cleared.stage.jam).toBeNull();
    expect(cleared.stage.draft).toEqual([]);
    const wrongCheck = written(written(cleared, '5').room, '4');
    expect(wrongCheck.verdict.kind).toBe('wrong');
    expect(wrongCheck.room.stage.lines).toHaveLength(2);
    expect(jammedLine(wrongCheck.room.stage)).toEqual(equation('4 + 4 = 9'));
  });

  it('refuses an empty blank with a wiggle, not a jam', () => {
    const result = step(enterLine(blanksRoomOne(), 0));
    expect(result.verdict.kind).toBe('incomplete');
    expect(result.room.stage.refused).toBe(1);
    expect(result.room.stage.jam).toBeNull();
  });

  it('shows an empty draft line in blank mode, with nothing to fill', () => {
    const { stage } = roomOne();
    expect(fillsBlank(stage)).toBe(false);
    expect(draftDisplay(stage)).toEqual({ draft: [], upcoming: [] });
  });
});

describe('which keys work (story 1.7)', () => {
  const keys: NotebookKey[] = [...TOKENS, 'delete', 'enter'];

  it('all of them while he writes freely, none while the notebook is off', () => {
    for (const key of keys) {
      expect(keyWorks(key, true, false)).toBe(true);
      expect(keyWorks(key, false, false)).toBe(false);
      expect(keyWorks(key, false, true)).toBe(false);
    }
  });

  it('only digits, delete and enter while he fills a blank', () => {
    expect(keys.filter((key) => keyWorks(key, true, true))).toEqual([
      ...'0123456789',
      'delete',
      'enter',
    ]);
  });
});

describe('simplify first (story 1.16)', () => {
  /** A stage only Balance finishes, like room 4, on a blank page. */
  const balanceOnly = (text: string, extra: Partial<StageSpec> = {}) =>
    roomWith(text, { ways: ['balance'], fading: { try: 'blank', balance: 'auto' }, ...extra });

  it('calls pans simplified when one pan holds only x and the other a single number', () => {
    for (const text of ['2x = 18', '18 = 2x', 'x = 9', 'x + x = 18', '2x : 2 = 18 : 2', 'x = 0']) {
      expect(simplified(equation(text)), text).toBe(true);
    }
    for (const text of [
      '2x + 5 = 23',
      '2x = 23 − 5',
      '2x + 5 − 5 = 23 − 5',
      '2x = x + 9',
      '23 = 2x + 5',
      '18 = 18',
    ]) {
      expect(simplified(equation(text)), text).toBe(false);
    }
  });

  it('lets the answer be written at once where Try values can finish, else only once simplified', () => {
    const balanceStage: StageSpec = { ...roomOneStage, ways: ['balance'] };
    const both: StageSpec = { ...roomOneStage, ways: ['try', 'balance'] };
    expect(answerAllowed(roomOneStage, equation('2x + 5 = 23'))).toBe(true);
    expect(answerAllowed(both, equation('2x + 5 = 23'))).toBe(true);
    expect(answerAllowed(balanceStage, equation('2x + 5 = 23'))).toBe(false);
    expect(answerAllowed(balanceStage, equation('2x = 18'))).toBe(true);
    expect(answerAllowed(balanceStage, equation('18 = 2x'))).toBe(true);
  });

  it('refuses an early x = 9 like an incomplete line: not stored, a wiggle, no jam, a tag', () => {
    const result = written(balanceOnly('2x + 5 = 23'), 'x = 9');
    expect(result.verdict.kind).toBe('answer');
    expect(result.events).toEqual([]);
    expect(result.room.stage.lines).toHaveLength(1);
    expect(result.room.stage.refused).toBe(1);
    expect(result.room.stage.jam).toBeNull();
    expect(result.room.stage.jamsInARow).toBe(0);
    expect(result.room.stage.machineProgress).toEqual([0]);
    expect(result.room.stage.draft).toEqual(tokens('x = 9'));
    expect(result.room.stage.refusal).toBe('simplify');
    expect(refusalView(result.room)).toBe('simplify');
    expect(hr.refusal[result.room.stage.refusal ?? 'simplify']).toMatch(/\S/);
    // Enter again: refused again, and the wiggle counts on.
    expect(step(enterLine(result.room, 0)).room.stage.refused).toBe(2);
  });

  it('takes the tag away on his next edit, or once the pans are simplified', () => {
    const refused = written(balanceOnly('2x + 5 = 23'), 'x = 9').room;
    const edited = step(deleteToken(refused)).room;
    expect(edited.stage.refusal).toBeNull();
    expect(refusalView(edited)).toBeNull();
    // A Balance move that simplifies the pans (here set straight) hides it at once.
    const moved = { ...refused, stage: { ...refused.stage, pans: equation('2x = 18') } };
    expect(refusalView(moved)).toBeNull();
    expect(refusalView(null)).toBeNull();
  });

  it('counts simplifying lines he types himself: 2x = 18 or 18 = 2x, then x = 9', () => {
    for (const line of ['2x = 18', '18 = 2x']) {
      const simpler = written(balanceOnly('2x + 5 = 23'), line);
      expect(simpler.verdict.kind).toBe('valid');
      const answered = written(simpler.room, 'x = 9');
      expect(answered.verdict.kind).toBe('answer');
      expect(answered.room.stage.lines).toHaveLength(3);
      expect(answered.room.stage.refusal).toBeNull();
    }
    // A line that only moves the numbers about isn't simple enough yet.
    const halfway = written(balanceOnly('2x + 5 = 23'), '2x = 23 − 5').room;
    expect(written(halfway, 'x = 9').room.stage.refusal).toBe('simplify');
  });

  it('refuses an answer filled into a blank the same way', () => {
    const room = balanceOnly('2x + 5 = 23', { fading: { try: 'blanks', balance: 'auto' } });
    expect(fillsBlank(room.stage)).toBe(true);
    const result = written(room, '9');
    expect(result.room.stage.lines).toHaveLength(1);
    expect(result.room.stage.refusal).toBe('simplify');
    expect(result.room.stage.templates).toHaveLength(2);
  });

  // Story 1.16 review: the gate looked only at the checker's `answer` verdict, so a valid
  // line that leaves x alone the same way slipped past it.
  it('refuses any line that would leave x alone before the pans are simplified: x = 3 · 3', () => {
    for (const line of ['x = 3 · 3', 'x = 18 : 2', 'x = 9 + 0', '3 · 3 = x']) {
      const result = written(balanceOnly('2x + 5 = 23'), line);
      expect(result.verdict.kind, line).toBe('valid');
      expect(result.room.stage.lines, line).toHaveLength(1);
      expect(result.room.stage.refused, line).toBe(1);
      expect(result.room.stage.jam, line).toBeNull();
      expect(result.room.stage.refusal, line).toBe('simplify');
      expect(result.events, line).toEqual([]);
      expect(result.room.stage.draft, line).toEqual(tokens(line));
    }
    // Once the pans are simplified it is taken, and x stands alone (the blanks come).
    const simpler = written(balanceOnly('2x + 5 = 23'), '2x = 18').room;
    const alone = written(simpler, 'x = 18 : 2');
    expect(alone.verdict.kind).toBe('valid');
    expect(alone.room.stage.lines).toHaveLength(3);
    expect(alone.room.stage.refusal).toBeNull();
    expect(alone.room.stage.templates).toHaveLength(2);
    // Where Try values can finish, nothing changes.
    expect(written(roomWith('2x + 5 = 23'), 'x = 3 · 3').room.stage.lines).toHaveLength(2);
  });

  // Story 1.16 review: `x = 23 − 14` brought `x = ☐` and the `answer` tag (x alone on the
  // linear form), and then refused the 9 filled in (not simplified on the pieces).
  it('takes x = 23 − 14 as a line, with no blanks, since x isn’t alone on the pans', () => {
    const room = written(balanceOnly('2x + 5 = 23'), 'x = 23 − 14').room;
    expect(room.stage.lines).toHaveLength(2);
    expect(room.stage.refusal).toBeNull();
    expect(room.stage.templates).toEqual([]);
    // The answer still waits for simplified pans, as the scale shows a weight and a balloon.
    expect(written(room, 'x = 9').room.stage.refusal).toBe('simplify');
  });

  it('leaves stages Try values can finish as they were, and other lines alone', () => {
    const answered = written(roomWith('2x + 5 = 23'), 'x = 9');
    expect(answered.verdict.kind).toBe('answer');
    expect(answered.room.stage.refusal).toBeNull();
    // A wrong line still jams, with no tag; an incomplete one wiggles with no tag.
    const wrong = written(balanceOnly('2x + 5 = 23'), 'x = 8').room;
    expect(wrong.stage.jam).toMatchObject({ kind: 'line' });
    expect(wrong.stage.refusal).toBeNull();
    const incomplete = written(balanceOnly('2x + 5 = 23'), 'x =').room;
    expect(incomplete.stage.refused).toBe(1);
    expect(incomplete.stage.refusal).toBeNull();
  });
});
