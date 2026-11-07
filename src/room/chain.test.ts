import { describe, expect, it } from 'vitest';
import type { Link } from '@/math/chain';
import { formatEquation, formatTokens } from '@/math/format';
import { tokenFromChar } from '@/math/tokens';
import { chainView, chainWorks, runLink } from '@/room/chain';
import { handoverView, meetHandovers } from '@/room/handover';
import { workedExample } from '@/room/help';
import { nextMove } from '@/room/hint';
import { deleteToken, enterLine, typeToken } from '@/room/notebook';
import { touchMachine } from '@/room/phases';
import { resumeRoom, savedRoomOf } from '@/room/resume';
import { enterRoom, type RoomStep } from '@/room/room';
import type { FadingMode, RoomSpec, RoomState, ToolId } from '@/room/types';

const tools: ToolId[] = ['balance', 'workshop', 'chain'];

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

/** A tram-like room: `4x + 9 = 41`, Balance and Undo, no pin, with Undo in `mode`. */
function tram(mode: FadingMode = 'auto', equation = '4x + 9 = 41'): RoomState {
  const spec: RoomSpec = {
    id: 'r08',
    machine: 'tram',
    xMeaning: 'length per rail',
    stages: [
      {
        type: 'solve',
        machines: [{ equation }],
        dial: { min: 0, max: 10, step: 1 },
        readouts: true,
        ways: ['balance', 'undo'],
        fading: { try: 'blank', balance: 'blank', undo: mode },
      },
    ],
    earns: null,
    mapChange: null,
  };
  return step(touchMachine(enterRoom(spec).room)).room;
}

function run(room: RoomState, op: Link['op'], n: number, with_ = tools): RoomState {
  return step(runLink(room, with_, { op, n })).room;
}

function written(room: RoomState): string[] {
  return room.stage.lines.slice(1).map((line) => formatTokens(line.tokens));
}

function write(room: RoomState, line: string): RoomState {
  let current = room;
  for (const char of line.replaceAll(' ', '')) {
    const token = tokenFromChar(char);
    if (!token) throw new Error(`no key for ${char}`);
    current = step(typeToken(current, token)).room;
  }
  return step(enterLine(current, 0)).room;
}

describe('the gear chain on the machine', () => {
  it('shows the pans as links, with the last one to tap', () => {
    expect(chainView(tram(), tools)).toEqual({
      links: [
        { op: 'mul', n: 4, dark: false },
        { op: 'add', n: 9, dark: false },
      ],
      output: 41,
      tappable: 1,
    });
  });

  it('shows nothing before the chain is earned, or in a stage without Undo', () => {
    expect(chainView(tram(), ['balance'])).toBeNull();
    expect(runLink(tram(), ['balance'], { op: 'sub', n: 9 })).toBeNull();
  });

  it('runs a right inverse: pans, a dark link, and with auto the move and its result', () => {
    const result = step(runLink(tram(), tools, { op: 'sub', n: 9 }));
    const room = result.room;
    expect(formatEquation(room.stage.pans)).toBe('4x = 32');
    expect(written(room)).toEqual(['4x = 41 − 9', '4x = 32']);
    expect(room.stage.lines.slice(1).map((line) => line.source)).toEqual(['undo', 'undo']);
    expect(result.events.map((event) => event.type)).toEqual([
      'WayUsed',
      'LineAccepted',
      'LineAccepted',
    ]);
    expect(chainView(room, tools)).toEqual({
      links: [
        { op: 'mul', n: 4, dark: false },
        { op: 'add', n: 9, dark: true },
      ],
      output: 32,
      tappable: 0,
    });
  });

  it('leaves x = n for him, then gives the last two lines as blanks', () => {
    const room = run(run(tram(), 'sub', 9), 'div', 4);
    expect(written(room)).toEqual(['4x = 41 − 9', '4x = 32', 'x = 32 : 4']);
    expect(formatEquation(room.stage.pans)).toBe('x = 8');
    expect(room.stage.templates.map((line) => line.join(' '))).toEqual([
      'x = ☐',
      '4 · ☐ + 9 = 4 1',
    ]);
    expect(chainWorks(room, tools)).toBe(false);
  });

  it('jams a wrong inverse like a wrong line, and delete takes it back', () => {
    const result = step(runLink(tram(), tools, { op: 'add', n: 9 }));
    expect(result.room.stage.jam).toMatchObject({ kind: 'line' });
    expect(formatTokens(result.room.stage.draft)).toBe('4x = 41 + 9');
    expect(result.events.map((event) => event.type)).toEqual(['LineWrong', 'MachineJammed']);
    expect(chainWorks(result.room, tools)).toBe(false);
    let room = result.room;
    while (room.stage.draft.length > 0) room = step(deleteToken(room)).room;
    expect(room.stage.jam).toBeNull();
    expect(chainWorks(room, tools)).toBe(true);
  });

  it('writes the move and asks for the result as a blank with blanks', () => {
    const room = run(tram('blanks'), 'sub', 9);
    expect(written(room)).toEqual(['4x = 41 − 9']);
    expect(room.stage.templates.map((line) => line.join(' '))).toEqual(['4 x = ☐']);
    expect(chainWorks(room, tools)).toBe(false);
    const filled = write(room, '32');
    expect(written(filled)).toEqual(['4x = 41 − 9', '4x = 32']);
    expect(chainWorks(filled, tools)).toBe(true);
    const alone = run(filled, 'div', 4);
    expect(alone.stage.templates.map((line) => line.join(' '))).toEqual([
      'x = ☐',
      '4 · ☐ + 9 = 4 1',
    ]);
  });

  it('moves only the pans with blank', () => {
    const room = run(tram('blank'), 'sub', 9);
    expect(written(room)).toEqual([]);
    expect(formatEquation(room.stage.pans)).toBe('4x = 32');
    expect(chainView(room, tools)?.links?.map((link) => link.dark)).toEqual([false, true]);
  });

  it('undoes 135 − ☐ with 135 − 100', () => {
    const room = run(tram('auto', '135 − 5x = 100'), 'from', 135);
    expect(written(room)).toEqual(['5x = 135 − 100', '5x = 35']);
    const wrong = step(runLink(tram('auto', '135 − 5x = 100'), tools, { op: 'add', n: 135 }));
    expect(wrong.room.stage.jam).not.toBeNull();
  });

  it('shows its handover tag until he runs a link', () => {
    const room = tram();
    expect(handoverView(room, ['handover-dial'], tools)).toBe('chain');
    const after = run(room, 'sub', 9);
    const met = meetHandovers(room, after, 'chain', [], tools);
    expect(met).toContain('handover-chain');
  });

  it('hints the last link’s inverse', () => {
    expect(nextMove(tram(), tools)).toEqual({ kind: 'chain', op: 'sub', n: 9 });
    expect(nextMove(run(tram(), 'sub', 9), tools)).toEqual({ kind: 'chain', op: 'div', n: 4 });
  });

  it('resumes its lines without counting a Balance move', () => {
    const room = run(tram(), 'sub', 9);
    const saved = savedRoomOf(room);
    if (!saved) throw new Error('nothing saved');
    const back = resumeRoom(room.spec, saved, 0);
    expect(back && written(back)).toEqual(['4x = 41 − 9', '4x = 32']);
    expect(back?.stage.balance.moves).toBe(0);
    expect(back && formatEquation(back.stage.pans)).toBe('4x = 32');
  });

  it('refuses a run that divides by zero, without a jam (story 4.1 review)', () => {
    const room = run(tram(), 'sub', 9);
    expect(runLink(room, tools, { op: 'div', n: 0 })).toBeNull();
  });

  it('takes a wrong run back in one delete, to the pans before it, with blank', () => {
    const ran = run(tram('blank'), 'sub', 9);
    const jammed = step(runLink(ran, tools, { op: 'div', n: 8 })).room;
    expect(jammed.stage.jam).not.toBeNull();
    const back = step(deleteToken(jammed)).room;
    expect(back.stage.jam).toBeNull();
    expect(back.stage.draft).toEqual([]);
    expect(formatEquation(back.stage.pans)).toBe('4x = 32');
    expect(chainWorks(back, tools)).toBe(true);
  });

  it('brings the blanks back on resume with blanks (story 4.1 review)', () => {
    const afterMove = run(tram('blanks'), 'sub', 9);
    const saved = savedRoomOf(afterMove);
    if (!saved) throw new Error('nothing saved');
    const back = resumeRoom(afterMove.spec, saved, 0);
    expect(back?.stage.templates.map((line) => line.join(' '))).toEqual(['4 x = ☐']);
    const alone = run(write(afterMove, '32'), 'div', 4);
    const savedAlone = savedRoomOf(alone);
    if (!savedAlone) throw new Error('nothing saved');
    const backAlone = resumeRoom(alone.spec, savedAlone, 0);
    expect(backAlone?.stage.templates.map((line) => line.join(' '))).toEqual([
      'x = ☐',
      '4 · ☐ + 9 = 4 1',
    ]);
  });

  it('hints the blank a run left, not a Balance tool, with blanks', () => {
    const room = run(tram('blanks'), 'sub', 9);
    expect(nextMove(room, tools)).toEqual({ kind: 'blank', value: 32 });
  });

  it('runs on from a move he typed himself', () => {
    const typed = write(tram('blank'), '4x=41−9');
    expect(chainView(typed, tools)?.output).toBe(32);
    expect(nextMove(typed, tools)).toEqual({ kind: 'chain', op: 'div', n: 4 });
  });

  it('works the example the Undo way at help level 4', () => {
    const lines = workedExample(tram(), tools)?.map(formatEquation) ?? [];
    expect(lines[1]).toMatch(/^4x = \d+ − 9$/);
    expect(lines.at(-2)).toMatch(/^x = \d+$/);
  });
});
