import { describe, expect, it } from 'vitest';
import { effectsAt } from '@/art/quality';
import { rooms } from '@/content/rooms';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r02 } from '@/content/rooms/r02-street-lamps';
import {
  devReadout,
  isToggleKey,
  jumpTargets,
  leaveProfile,
  opensOnLoad,
  pinText,
  profileActions,
  profileToggle,
  qualityReadout,
  splitterText,
  toggledBalance,
  trayText,
  tupleText,
  verdictText,
} from '@/dev/dev-view';
import { tokenize } from '@/math/tokens';
import { dialView, setDial } from '@/room/dial';
import { enterLine, typeToken } from '@/room/notebook';
import { touchMachine } from '@/room/phases';
import { enterRoom } from '@/room/room';
import type { RoomSpec, RoomState, StageSpec } from '@/room/types';
import type { Action } from '@/store/actions';
import { initialQuality, qualityInUse } from '@/store/quality';
import { initialGameState, reduce } from '@/store/reducer';
import type { GameState } from '@/store/types';

const freeStage: StageSpec = { ...(r01.stages[0] as StageSpec), fading: { try: 'blank' } };
const freeRoomOne: RoomSpec = { ...r01, stages: [freeStage] };

function opened(spec: RoomSpec): RoomState {
  const room = enterRoom(spec).room;
  return touchMachine(room)?.room ?? room;
}

function typed(room: RoomState, text: string): RoomState {
  const result = tokenize(text);
  if (!result.ok) throw new Error(text);
  return result.tokens.reduce((current, token) => typeToken(current, token)?.room ?? current, room);
}

type Modifier = 'ctrl' | 'alt' | 'meta';

function key(name: string, code: string, ...modifiers: Modifier[]) {
  return {
    key: name,
    code,
    ctrlKey: modifiers.includes('ctrl'),
    altKey: modifiers.includes('alt'),
    metaKey: modifiers.includes('meta'),
  };
}

describe('jumpTargets', () => {
  it('offers every stage of every authored room, in play order', () => {
    expect(jumpTargets(rooms)).toEqual([
      { roomId: 'r01', stage: 0, label: 'r01 · 1' },
      { roomId: 'r02', stage: 0, label: 'r02 · 1' },
      { roomId: 'r02', stage: 1, label: 'r02 · 2' },
      { roomId: 'r03', stage: 0, label: 'r03 · 1' },
      { roomId: 'r03', stage: 1, label: 'r03 · 2' },
      { roomId: 'r04', stage: 0, label: 'r04 · 1' },
      { roomId: 'r05', stage: 0, label: 'r05 · 1' },
      { roomId: 'r05', stage: 1, label: 'r05 · 2' },
      { roomId: 'r06', stage: 0, label: 'r06 · 1' },
      { roomId: 'r07', stage: 0, label: 'r07 · 1' },
    ]);
  });

  it("leaves out rooms that aren't authored (built and friends' rooms)", () => {
    expect(jumpTargets([{ ...r01, id: 'built-1' }])).toEqual([]);
  });
});

describe('devReadout', () => {
  it('shows where the game is: room, stage and phase, progress and jam', () => {
    const readout = devReadout(enterRoom(r02, 1).room);
    expect(readout.place).toBe('r02 · stage 2 of 2 · arrive');
    expect(readout.progress).toBe('0');
    expect(readout.jam).toBe('none');
    expect(readout.pin).toBe('none');
    expect(readout.pans).toBe('x : 3 = 5');
    expect(readout.tray).toBe('off');
    expect(readout.splitter).toBe('off');
    expect(readout.draft).toBeNull();
  });

  it('shows the tray once Balance is earned and the stage offers it, and switches Balance', () => {
    const fresh = opened(freeRoomOne);
    expect(trayText(fresh, ['balance'])).toBe('off');
    // Story 1.15: the dial at its maximum without levelling the pans offers the tray.
    const room = setDial(fresh, 10)?.room;
    if (!room) throw new Error('the dial did not turn');
    expect(trayText(room, [])).toBe('off');
    expect(trayText(room, ['balance'])).toBe('weight 1, float 1');
    const jammed = enterLine(typed(room, 'x = 6'), 0)?.room;
    if (!jammed) throw new Error('enter was ignored');
    expect(trayText(jammed, ['balance'])).toBe('weight 1, float 1, jammed');
    expect(devReadout(room, ['balance']).tray).toBe('weight 1, float 1');
    expect(toggledBalance([])).toEqual(['balance']);
    expect(toggledBalance(['balance', 'chain'])).toEqual(['chain']);
  });

  it('shows the splitter once Balance is earned and a side holds only x pieces, and jammed', () => {
    expect(splitterText(opened(freeRoomOne), ['balance'])).toBe('off');
    // Story 1.15: room 2's `3x = 12` holds only x pieces on the left from the start.
    const freeRoomTwo: RoomSpec = {
      ...r02,
      stages: [{ ...(r02.stages[0] as StageSpec), fading: { try: 'blank' } }],
    };
    const room = opened(freeRoomTwo);
    expect(splitterText(room, [])).toBe('off');
    expect(splitterText(room, ['balance'])).toBe('2 parts');
    expect(devReadout(room, ['balance']).splitter).toBe('2 parts');
    const jammed = enterLine(typed(room, 'x = 6'), 0)?.room;
    if (!jammed) throw new Error('enter was ignored');
    expect(splitterText(jammed, ['balance'])).toBe('2 parts, jammed');
  });

  it('shows the prediction pin: where it is, and whether it is locked and resolved', () => {
    expect(pinText(null)).toBe('none');
    const x = { kind: 'x', x: 12 } as const;
    expect(pinText({ value: x, locked: false, resolved: false })).toBe('x = 12, moving');
    expect(pinText({ value: x, locked: true, resolved: false })).toBe('x = 12, locked');
    expect(pinText({ value: x, locked: true, resolved: true })).toBe('x = 12, locked, resolved');
    const choice = { kind: 'choice', index: 1 } as const;
    expect(pinText({ value: choice, locked: false, resolved: false })).toBe('choice 1, moving');
  });

  it('shows the last committed line with its verdict and progress tuple', () => {
    const room = opened(freeRoomOne);
    expect(devReadout(room).last).toEqual({
      text: 'x + 4 = 9',
      verdict: 'valid, none, no progress',
      tuple: '(2, 0, 0)',
    });
    const committed = enterLine(typed(room, 'x = 9 − 4'), 0)?.room;
    if (!committed) throw new Error('enter was ignored');
    expect(devReadout(committed).last).toEqual({
      text: 'x = 9 − 4',
      verdict: 'valid, move-across, progress',
      tuple: '(1, 0, 1)',
    });
  });

  it('shows the draft as enter judges it: a jammed line stays there, marked wrong', () => {
    const jammed = enterLine(typed(opened(freeRoomOne), 'x = 6'), 0)?.room;
    if (!jammed) throw new Error('enter was ignored');
    const readout = devReadout(jammed);
    expect(readout.jam).toBe('line');
    expect(readout.draft).toEqual({ text: 'x = 6', verdict: 'wrong', tuple: '(1, 0, 0)' });
    const half = devReadout(typed(opened(freeRoomOne), 'x +'));
    expect(half.draft).toEqual({ text: 'x +', verdict: 'incomplete', tuple: null });
  });

  it('reads a blank filled so far as its whole line', () => {
    const room = typed(opened(r01), '5');
    expect(devReadout(room).draft).toEqual({
      text: 'x = 5',
      verdict: 'answer',
      tuple: '(1, 0, 0)',
    });
  });
});

describe('qualityReadout', () => {
  it('shows the test running, with every effect on meanwhile', () => {
    expect(qualityReadout(initialQuality)).toEqual({
      inUse: 'high · test running',
      test: 'running',
      forced: null,
    });
    expect(qualityReadout({ ...initialQuality, forced: 'low' }).inUse).toBe(
      'high · test running, then low (forced)',
    );
  });

  it('shows the test’s pick and the frame time it came from', () => {
    expect(qualityReadout({ measured: 'medium', measuredMs: 21.37, forced: null })).toEqual({
      inUse: 'medium · from the test',
      test: 'p95 21.4 ms → medium',
      forced: null,
    });
  });

  it('shows a forced setting over the test’s pick', () => {
    expect(qualityReadout({ measured: 'high', measuredMs: 12, forced: 'low' })).toEqual({
      inUse: 'low · forced',
      test: 'p95 12.0 ms → high',
      forced: 'low',
    });
  });
});

describe('verdictText and tupleText', () => {
  it("names the verdict, with a valid line's move and progress", () => {
    expect(verdictText({ kind: 'check' })).toBe('check');
    expect(verdictText({ kind: 'valid', move: { kind: 'swap' }, progress: false })).toBe(
      'valid, swap, no progress',
    );
    expect(tupleText([1, 1, 0])).toBe('(1, 1, 0)');
  });
});

describe('opening the panel', () => {
  it('opens on load with ?dev', () => {
    expect(opensOnLoad('?dev')).toBe(true);
    expect(opensOnLoad('?a=1&dev')).toBe(true);
    expect(opensOnLoad('')).toBe(false);
    expect(opensOnLoad('?developer')).toBe(false);
  });

  it('toggles with the backtick, however the layout types it', () => {
    expect(isToggleKey(key('`', 'Backquote'))).toBe(true);
    // A Croatian layout types the backtick with AltGr+7, and the key left of 1 types a cedilla.
    expect(isToggleKey(key('`', 'Digit7', 'ctrl', 'alt'))).toBe(true);
    expect(isToggleKey(key('¸', 'Backquote'))).toBe(true);
    expect(isToggleKey(key('Dead', 'Backquote'))).toBe(true);
  });

  it('ignores other keys, and shortcuts on the backtick key', () => {
    expect(isToggleKey(key('7', 'Digit7'))).toBe(false);
    expect(isToggleKey(key('x', 'KeyX'))).toBe(false);
    expect(isToggleKey(key('¸', 'Backquote', 'ctrl'))).toBe(false);
  });
});

describe('the tablet profile (story 1.13)', () => {
  const ctx = { now: 1_000, rng: { next: () => 0.5 } };
  const run = (state: GameState, actions: readonly Action[]) =>
    actions.reduce((current, action) => reduce(current, action, ctx).state, state);

  it('opens room 4 with Balance, its whole dial free to drag, the steam on and three copies', () => {
    const state = run(initialGameState(), profileActions(rooms, []));
    const room = state.room as RoomState;
    expect(room.spec.id).toBe('r04');
    expect(room.stage.phase).toBe('open');
    // Story 1.16: room 4 has no pin any more (1.14–1.15 placed and confirmed it at 9 here).
    expect(room.stage.pin).toBeNull();
    expect(dialView(room)).toMatchObject({ min: 0, max: 12, openMin: 0, openMax: 12, turns: true });
    expect(state.save.progress.tools).toEqual(['balance']);
    expect(state.ui.copies).toBe(3);
    expect(state.ui.quality.forced).toBe('high');
    expect(effectsAt(qualityInUse(state.ui.quality)).particles).toBe(true);
    const picked = { ...state.ui.quality, measured: 'low' as const, measuredMs: 40 };
    expect(effectsAt(qualityInUse(picked)).particles).toBe(true);
  });

  it('sets up the same from anywhere, keeping the tools he has', () => {
    let midway = run(initialGameState(), [
      { type: 'dev/set-tools', tools: ['workshop'] },
      { type: 'room/enter', roomId: 'r02', stage: 1 },
      { type: 'machine/touch' },
      { type: 'dial/set', x: 9 },
    ]);
    midway = run(midway, profileActions(rooms, midway.save.progress.tools));
    expect(midway.save.progress.tools).toEqual(['workshop', 'balance']);
    expect(midway.room?.spec.id).toBe('r04');
    expect(midway.room?.stage.phase).toBe('open');
    expect(midway.room?.stage.dialX).toBe(0);
  });

  it('toggles: sets the profile up with one copy showing, and leaves it with three', () => {
    expect(profileToggle(1, rooms, [])).toEqual(profileActions(rooms, []));
    expect(profileToggle(3, rooms, [])).toEqual([leaveProfile]);
    const profiled = run(initialGameState(), profileActions(rooms, []));
    const left = run(profiled, [leaveProfile]);
    expect(left.ui.copies).toBe(1);
    expect(left.room).toBe(profiled.room);
    expect(left.ui.quality.forced).toBe('high');
  });

  it('needs room 4 in content', () => {
    expect(() => profileActions([r01, r02], [])).toThrow(/r04/);
  });
});
