import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r08 } from '@/content/rooms/r08-tram';
import { r09 } from '@/content/rooms/r09-steam-lift';
import { hr } from '@/content/text/hr';
import { tokenize } from '@/math/tokens';
import { setDial } from '@/room/dial';
import { enterLine, typeToken } from '@/room/notebook';
import { touchMachine } from '@/room/phases';
import { enterRoom, type RoomStep } from '@/room/room';
import type { RoomSpec, RoomState, ToolId } from '@/room/types';
import { nowText } from '@/ui/common/now-line';

const earned: ToolId[] = ['balance', 'workshop', 'chain'];

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

const opened = (spec: RoomSpec): RoomState => step(touchMachine(enterRoom(spec).room)).room;

/** Types a blank's digits and enters them. */
function write(room: RoomState, text: string): RoomState {
  const tokens = tokenize(text);
  if (!tokens.ok) throw new Error(text);
  const typed = tokens.tokens.reduce(
    (current, token) => step(typeToken(current, token)).room,
    room,
  );
  return step(enterLine(typed, 0)).room;
}

describe('the "what now" line', () => {
  it('says nothing without a room', () => {
    expect(nowText(null, [])).toBeNull();
  });

  it('asks him to touch the machine as he arrives', () => {
    expect(nowText(enterRoom(r01).room, [])).toBe(hr.now.touch);
    expect(nowText(enterRoom(r08).room, earned)).toBe(hr.now.touch);
  });

  it('sends him back along the steps while x isn’t alone in room 8', () => {
    expect(nowText(opened(r08), earned)).toBe(hr.now.chain);
  });

  it('asks for the gear in room 9, from the start', () => {
    expect(nowText(opened(r09), earned)).toBe(hr.now.gear);
  });

  it('never gives room 1’s answer away, from arrival to the lock', () => {
    const answer = '5';
    const arriving = enterRoom(r01).room;
    const sliding = opened(r01);
    const level = step(setDial(sliding, 5)).room;
    const answered = write(level, answer);
    const locked = write(answered, answer);
    const says = [arriving, sliding, level, answered, locked].map((room) => nowText(room, []));
    expect(says.slice(0, 4)).toEqual([hr.now.touch, hr.now.slide, hr.now.answer, hr.now.check]);
    expect(says[4]).toBeNull();
    for (const text of says) expect(text ?? '').not.toContain(answer);
  });
});
