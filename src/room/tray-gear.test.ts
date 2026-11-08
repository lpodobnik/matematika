import { describe, expect, it } from 'vitest';
import { r09 } from '@/content/rooms/r09-steam-lift';
import { formatEquation, formatTokens } from '@/math/format';
import { parse } from '@/math/parse';
import * as q from '@/math/rational';
import { runLink } from '@/room/chain';
import { nextMove } from '@/room/hint';
import { touchMachine } from '@/room/phases';
import { confirmPin, setPin } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import { dropOnScale, stepTray, trayView, trayWorks, xOnBothSides } from '@/room/tray';
import type { RoomState, ToolId } from '@/room/types';

const tools: ToolId[] = ['balance', 'workshop', 'chain'];

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

/** Room 9, open after the pin at 7, with the tray met in an earlier room (so it is offered). */
function steamLift(): RoomState {
  const touched = step(touchMachine(enterRoom(r09).room)).room;
  const pinned = step(setPin(touched, { kind: 'x', x: 7 })).room;
  const open = step(confirmPin(pinned)).room;
  return { ...open, stage: { ...open.stage, balance: { ...open.stage.balance, trayMet: true } } };
}

describe('the tray’s x-gear (story 4.2)', () => {
  it('leaves the tray once the balloons are gone: there is nothing left for it to do', () => {
    let room = steamLift();
    for (let i = 0; i < 4; i += 1) room = step(stepTray(room, tools, 'gear', 1)).room;
    const dropped = step(dropOnScale(room, tools, 'gear')).room;
    expect(trayView(dropped, tools)?.gear).toBeNull();
    expect(dropOnScale(dropped, tools, 'gear')).toBeNull();
  });

  it('shows from room 9, with its count, and adds that many x to both sides', () => {
    let room = steamLift();
    expect(trayView(room, tools)?.gear).toBe(1);
    for (let i = 0; i < 4; i += 1) room = step(stepTray(room, tools, 'gear', 1)).room;
    expect(trayView(room, tools)?.gear).toBe(5);
    const dropped = step(dropOnScale(room, tools, 'gear'));
    expect(formatEquation(dropped.room.stage.pans)).toBe('135 = 5x + 100');
    expect(dropped.events[0]).toMatchObject({ type: 'WayUsed', way: 'balance' });
    // Balance has faded to a blank page in room 9, but nothing else shows what a gear did:
    // this move is written out, and its result.
    expect(dropped.room.stage.lines.map((line) => formatTokens(line.tokens)).at(-1)).toBe(
      '135 = 5x + 100',
    );
  });

  it('isn’t there before room 9', () => {
    const room = steamLift();
    const noGear = {
      ...room,
      spec: { ...room.spec, stages: [{ ...r09.stages[0], trayGear: undefined }] },
    } as RoomState;
    expect(trayView(noGear, tools)?.gear).toBeNull();
    expect(dropOnScale(noGear, tools, 'gear')).toBeNull();
  });

  it('is the hint’s Balance move where x is taken away, once Balance is under way', () => {
    const room = steamLift();
    const moved = step(dropOnScale(room, tools, 'weight')).room;
    expect(nextMove(moved, tools)).toMatchObject({ kind: 'tray', piece: 'gear', amount: 5 });
  });

  it('slides back unless its count cancels a side’s x-balloons exactly (story 4.2 review)', () => {
    const room = steamLift();
    // One gear against five balloons: nothing moves, and it says why.
    const refused = step(dropOnScale(room, tools, 'gear')).room;
    expect(refused.stage.pans).toEqual(room.stage.pans);
    expect(refused.stage.refusal).toBe('gear');
    const eq = (text: string) => {
      const parsed = parse(text);
      if (!parsed.ok) throw new Error(text);
      return parsed.equation;
    };
    expect(xOnBothSides(eq('135 = 5x + 100'), q.rational(5))).toBeNull();
    const right = xOnBothSides(eq('100 = 135 − 5x'), q.rational(5));
    expect(right && formatEquation(right.pans)).toBe('5x + 100 = 135');
  });

  it('waits, with the splitter, while a chain run’s result waits as a blank', () => {
    const room = steamLift();
    const ran = step(runLink(room, tools, { op: 'from', n: 135 })).room;
    expect(trayWorks(ran, tools)).toBe(false);
    expect(nextMove(ran, tools)).toEqual({ kind: 'blank', value: 35 });
  });

  it('hints the chain before any move, and dragging the 100 off after the gear', () => {
    let room = steamLift();
    expect(nextMove(room, tools)).toEqual({ kind: 'chain', op: 'from', n: 135 });
    for (let i = 0; i < 4; i += 1) room = step(stepTray(room, tools, 'gear', 1)).room;
    const geared = step(dropOnScale(room, tools, 'gear')).room;
    expect(nextMove(geared, tools)).toEqual({ kind: 'take-off', amount: 100 });
  });
});
