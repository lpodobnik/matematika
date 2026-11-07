import { describe, expect, it } from 'vitest';
import { r10 } from '@/content/rooms/r10-market-scales';
import { formatEquation, formatTokens } from '@/math/format';
import { tokenFromChar } from '@/math/tokens';
import { chainOffered } from '@/room/chain';
import { setDial } from '@/room/dial';
import { handoverView } from '@/room/handover';
import { workedExample } from '@/room/help';
import { nextMove } from '@/room/hint';
import { enterLine, refusalView, typeToken } from '@/room/notebook';
import { resetStage, touchMachine } from '@/room/phases';
import { confirmPin, pinRight, setPin } from '@/room/pin';
import { resumeRoom, savedRoomOf } from '@/room/resume';
import { enterRoom, type RoomStep } from '@/room/room';
import { splitterOffered } from '@/room/splitter';
import { rightStory, storyView, storyWaits } from '@/room/story';
import { trayOffered } from '@/room/tray';
import type { RoomState, StageSpec, ToolId } from '@/room/types';

const tools: ToolId[] = ['balance', 'workshop', 'chain'];

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
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

/** Room 10's first stage, open after his first touch, the story not yet written. */
function wrench(): RoomState {
  const room = step(touchMachine(enterRoom(r10).room)).room;
  return { ...room, stage: { ...room.stage, balance: { ...room.stage.balance, trayMet: true } } };
}

describe('writing the story (story 4.5)', () => {
  it('opens with the story and empty pans, and the dial, tray and chain waiting', () => {
    const room = wrench();
    expect(storyWaits(room)).toBe(true);
    expect(formatEquation(room.stage.pans)).toBe('0 = 0');
    expect(setDial(room, 1)).toBeNull();
    expect(trayOffered(room, tools)).toBe(false);
    expect(storyView(room)).toMatchObject({ build: 'wrench', written: false, options: [] });
    expect(handoverView(room, [], tools)).toBe('story');
    expect(nextMove(room, tools)).toEqual({ kind: 'story', line: '60 + 3x = 90' });
  });

  it('takes the story as told, its terms or sides swapped, and the pans fill from it', () => {
    for (const line of ['60 + 3x = 90', '3x + 60 = 90', '90 = 60 + 3x']) {
      const room = write(wrench(), line);
      expect(storyWaits(room), line).toBe(false);
      expect(formatTokens(room.stage.lines[1]?.tokens ?? []), line).toBe(line);
      expect(setDial(room, 1), line).not.toBeNull();
    }
  });

  it('refuses a step or the answer with a tag until the story is written', () => {
    for (const line of ['3x = 30', 'x = 10']) {
      const room = write(wrench(), line);
      expect(storyWaits(room), line).toBe(true);
      expect(room.stage.jam, line).toBeNull();
      expect(refusalView(room), line).toBe('story');
    }
  });

  it('jams a wrong story, acted out on the pans', () => {
    const room = write(wrench(), '60x + 3 = 90');
    expect(room.stage.jam).toEqual({ kind: 'line' });
    expect(storyWaits(room)).toBe(true);
  });

  it('comes back written after a reload', () => {
    const written = write(wrench(), '60 + 3x = 90');
    const saved = savedRoomOf(written);
    if (!saved) throw new Error('nothing saved');
    const back = resumeRoom(r10, saved, 0);
    expect(back && storyWaits(back)).toBe(false);
    expect(back && formatEquation(back.stage.pans)).toBe('60 + 3x = 90');
  });
});

describe('waiting for the story (story 4.5 review)', () => {
  it('keeps the splitter, the chain and the worked example waiting, after a reset too', () => {
    const solving = write(write(wrench(), '60 + 3x = 90'), '3x = 30');
    expect(splitterOffered(solving, tools)).toBe(true);
    const reset = step(resetStage(solving)).room;
    expect(storyWaits(reset)).toBe(true);
    expect(splitterOffered(reset, tools)).toBe(false);
    expect(chainOffered(reset, tools)).toBe(false);
    expect(workedExample(reset, tools)).toBeNull();
  });

  it('takes the cogs written one by one as the story', () => {
    expect(storyWaits(write(wrench(), '60 + x + x + x = 90'))).toBe(false);
  });
});

describe('choosing the story (story 4.5)', () => {
  const stage = r10.stages[1] as StageSpec;

  it('knows the one story that fits the pans', () => {
    expect(rightStory(stage)).toBe(1);
    expect(pinRight(stage, 0, { kind: 'choice', index: 1 })).toBe(true);
    expect(pinRight(stage, 0, { kind: 'choice', index: 0 })).toBe(false);
  });

  it('flags a story, confirms it, and then shows the one that fits', () => {
    const room = step(touchMachine(enterRoom(r10, 1).room)).room;
    expect(room.stage.phase).toBe('pin');
    expect(storyView(room)).toMatchObject({ asks: true, at: null, confirmable: false });
    const flagged = step(setPin(room, { kind: 'choice', index: 0 })).room;
    expect(storyView(flagged)).toMatchObject({ at: 0, confirmable: true });
    const confirmed = step(confirmPin(flagged));
    expect(confirmed.events).toContainEqual(
      expect.objectContaining({ type: 'PredictionMade', right: false }),
    );
    expect(storyView(confirmed.room)).toMatchObject({ asks: false, right: 1 });
    expect(confirmed.room.stage.phase).toBe('open');
  });
});
