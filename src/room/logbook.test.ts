import { describe, expect, it } from 'vitest';
import { r07 } from '@/content/rooms/r07-old-logbook';
import { formatTokens } from '@/math/format';
import { setDial } from '@/room/dial';
import { logbookView, showLine } from '@/room/logbook';
import { resetStage, touchMachine } from '@/room/phases';
import { confirmPin, pinRight, setPin } from '@/room/pin';
import { enterRoom, givenLine } from '@/room/room';
import { scaleView } from '@/room/scale';
import type { RoomState } from '@/room/types';

const stage = r07.stages[0];
if (!stage) throw new Error('room 7 has a stage');

/** Room 7 touched, with the slider at x. */
function at(x: number): RoomState {
  let room = touchMachine(enterRoom(r07).room)?.room as RoomState;
  for (let v = room.stage.dialX + 1; v <= x; v += 1) room = setDial(room, v)?.room ?? room;
  return room;
}

describe('the old logbook (room 7, story 2.10)', () => {
  it('opens with the logbook’s right line committed and its wrong line planted, never committed', () => {
    const room = enterRoom(r07).room;
    expect(room.stage.lines.map((line) => [formatTokens(line.tokens), line.source])).toEqual([
      ['3x − 1 = 17', 'given'],
      ['3x = 18', 'logbook'],
    ]);
    expect(room.stage.planted).toMatchObject({ line: 2, found: false });
    expect(formatTokens(room.stage.planted?.tokens ?? [])).toBe('x = 15');
  });

  it('levels the stage equation at 6, with the slider open from the start', () => {
    expect(scaleView(at(6)).level).toBe(true);
    expect(scaleView(at(5)).level).toBe(false);
  });

  it('puts a tapped line on the scale at the slider’s x: 3x = 18 stays level at 6, x = 15 tips', () => {
    const six = at(6);
    const right = showLine(six, 1) as RoomState;
    expect(scaleView(right).level).toBe(true);
    const wrong = showLine(six, 2) as RoomState;
    expect(scaleView(wrong).level).toBe(false);
    // Tapping it again takes it off; the dial moving takes it off too.
    expect(showLine(wrong, 2)?.stage.shownLine).toBeNull();
    expect(setDial(wrong, 7)?.room.stage.shownLine).toBeNull();
    expect(showLine(six, 0)).toBeNull();
    expect(showLine(six, 3)).toBeNull();
  });

  it('pins a line: right only on the planted one; either way the mistake is found for him to rewrite', () => {
    expect(pinRight(stage, 0, { kind: 'line', index: 2 })).toBe(true);
    expect(pinRight(stage, 0, { kind: 'line', index: 1 })).toBe(false);
    expect(givenLine(stage, 0).source).toBe('given');
    for (const index of [1, 2]) {
      const placed = setPin(at(3), { kind: 'line', index })?.room as RoomState;
      const tested = confirmPin(placed);
      const room = tested?.room as RoomState;
      expect(tested?.events).toEqual([
        { type: 'PredictionMade', roomId: 'r07', stage: 0, right: index === 2 },
      ]);
      // The machine tests it where the stage equation levels, with the pinned line shown.
      expect(room.stage).toMatchObject({ dialX: 6, shownLine: null, phase: 'open' });
      expect(room.stage.planted?.found).toBe(true);
      // x = ☐, then the check line, as blanks; the pans take 3x = 18.
      expect(room.stage.templates).toHaveLength(2);
      expect(logbookView(room)).toMatchObject({ found: true, pinAsks: false });
    }
  });

  it('keeps the mistake found through a reset after the pin, so he can always rewrite it', () => {
    const placed = setPin(at(3), { kind: 'line', index: 2 })?.room as RoomState;
    const tested = confirmPin(placed)?.room as RoomState;
    const reset = resetStage(tested)?.room as RoomState;
    expect(reset.stage.planted?.found).toBe(true);
    expect(reset.stage.templates).toHaveLength(2);
    expect(reset.stage.phase).toBe('open');
  });

  it('shows the notebook its lines, the shown one, and the pin while it is offered', () => {
    const room = showLine(at(6), 1) as RoomState;
    expect(logbookView(room)).toEqual({
      shown: 1,
      plantedLine: 2,
      plantedText: 'x = 15',
      found: false,
      tapped: true,
      pinAsks: true,
      pinAt: null,
      pinConfirmable: false,
    });
    expect(
      logbookView(enterRoom({ ...r07, stages: [{ ...stage, presetLines: undefined }] }).room),
    ).toBeNull();
  });
});

describe('the logbook after the rewrite (story 2.10 review)', () => {
  it('taps only the logbook’s lines and the planted one, whose number wins over his own line', () => {
    const placed = setPin(at(3), { kind: 'line', index: 2 })?.room as RoomState;
    const found = confirmPin(placed)?.room as RoomState;
    const written: RoomState = {
      ...found,
      stage: {
        ...found.stage,
        // Off the scale, as after his line (the pin's test had put line 2 there).
        shownLine: null,
        lines: [
          ...found.stage.lines,
          { tokens: ['x', '=', '6'], source: 'typed', verdict: { kind: 'answer' } as never },
        ],
      },
    };
    expect(formatTokens(written.stage.planted?.tokens ?? [])).toBe('x = 15');
    expect(showLine(written, 2)?.stage.shownLine).toBe(2);
    expect(scaleView(showLine(written, 2) as RoomState).level).toBe(false);
  });
});
