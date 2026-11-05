import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { r01 } from '@/content/rooms/r01-door-lift';
import { TOKENS, type Token, tokenize } from '@/math/tokens';
import { dialView, setDial } from '@/room/dial';
import {
  committedEquations,
  deleteToken,
  enterLine,
  isCommitted,
  isRefused,
  lineDisplays,
  type NotebookStep,
  notebookWrites,
  typeToken,
} from '@/room/notebook';
import { enterRoom } from '@/room/room';
import type { Phase, RoomState, StageSpec } from '@/room/types';

const roomOneStage = r01.stages[0] as StageSpec;

function roomWith(equation: string): RoomState {
  return enterRoom({ ...r01, stages: [{ ...roomOneStage, machines: [{ equation }] }] }).room;
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
  return step(enterLine(typed(room, text)));
}

function inPhase(room: RoomState, phase: Phase): RoomState {
  return { ...room, stage: { ...room.stage, phase } };
}

const roomOne = (): RoomState => enterRoom(r01).room;

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
    const result = step(enterLine(room));
    expect(result.verdict.kind).toBe(verdict);
    expect(result.room.stage.draft).toEqual(room.stage.draft);
    expect(result.room.stage.lines).toBe(room.stage.lines);
    expect(result.room.stage.jam).toBeNull();
    expect(result.room.stage.refused).toBe(1);
    expect(result.events).toEqual([]);
  });

  it('wiggles again on every refusal', () => {
    let room = typed(roomOne(), 'x +');
    room = step(enterLine(room)).room;
    room = step(enterLine(room)).room;
    room = step(enterLine(room)).room;
    expect(room.stage.refused).toBe(3);
  });

  it('keeps a wrong line in the draft, marked as wrong, never in lines', () => {
    const room = typed(roomOne(), 'x = 6');
    const result = step(enterLine(room));
    expect(result.verdict.kind).toBe('wrong');
    expect(result.room.stage.draft).toEqual(tokens('x = 6'));
    expect(result.room.stage.lines).toEqual(room.stage.lines);
    expect(result.room.stage.jam).toEqual({ kind: 'line' });
    expect(result.room.stage.refused).toBe(0);
    expect(result.events).toEqual([{ type: 'LineWrong', roomId: 'r01', stage: 0, line: 'x = 6' }]);
  });

  it('ignores enter again until the wrong line is edited', () => {
    const jammed = written(roomOne(), 'x = 6').room;
    expect(enterLine(jammed)).toBeNull();
  });

  it('clears the mark on any edit, and judges the edited line again', () => {
    const jammed = written(roomOne(), 'x = 6').room;
    const deleted = step(deleteToken(jammed)).room;
    expect(deleted.stage.jam).toBeNull();
    expect(deleted.stage.draft).toEqual(tokens('x ='));
    const retyped = step(typeToken(deleted, '5')).room;
    expect(step(enterLine(retyped)).verdict.kind).toBe('answer');

    const extended = step(typeToken(jammed, '0')).room;
    expect(extended.stage.jam).toBeNull();
    expect(step(enterLine(extended)).verdict.kind).toBe('wrong');
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
    expect(checked.events).toMatchObject([{ type: 'LineAccepted', progress: true }]);
    expect(lineDisplays(checked.room.stage.lines).map((line) => line.text)).toEqual([
      'x + 4 = 9',
      'x = 5',
      '5 + 4 = 9',
    ]);
    const done = checked.room;
    expect(notebookWrites(done.stage)).toBe(false);
    expect(typeToken(done, '1')).toBeNull();
    expect(deleteToken(done)).toBeNull();
    expect(enterLine(done)).toBeNull();
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
        const result = step(enterLine(room));
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
    ['arrive', true],
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
    expect(enterLine(room) !== null).toBe(writes);
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

  it('keeps a split jam on an edit; only a line jam clears', () => {
    const room = typed(roomOne(), 'x = 5');
    const split: RoomState = {
      ...room,
      stage: { ...room.stage, jam: { kind: 'split', parts: 2 } },
    };
    expect(step(typeToken(split, '1')).room.stage.jam).toEqual({ kind: 'split', parts: 2 });
    expect(step(deleteToken(split)).room.stage.jam).toEqual({ kind: 'split', parts: 2 });
    expect(enterLine(split)).toBeNull();
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
