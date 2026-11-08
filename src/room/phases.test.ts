import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r02 } from '@/content/rooms/r02-street-lamps';
import { r03 } from '@/content/rooms/r03-sluice-gate';
import type { Equation } from '@/math/expr';
import { parse } from '@/math/parse';
import { setDial } from '@/room/dial';
import { machineView } from '@/room/machine';
import { enterLine, notebookWrites, typeToken } from '@/room/notebook';
import {
  finishPresentation,
  isLastStage,
  nextRoom,
  openingPhase,
  playedThrough,
  presentationOf,
  presentationView,
  resetStage,
  resetWorks,
  tickClock,
  toolEarned,
  touchMachine,
} from '@/room/phases';
import { confirmPin, pinOffered, setPin } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import type { Phase, RoomSpec, RoomState, StageSpec } from '@/room/types';

const allPhases: readonly Phase[] = ['arrive', 'poke', 'pin', 'open', 'locked', 'restart', 'done'];

function equation(text: string): Equation {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.equation;
}

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

function inPhase(room: RoomState, phase: Phase): RoomState {
  return { ...room, stage: { ...room.stage, phase } };
}

const opened = (room: RoomState): RoomState => step(touchMachine(room)).room;

/** Fills the stage's blanks with its answer: the answer line, then the check line, at `now`. */
function solve(room: RoomState, answer: string, now = 0): RoomStep {
  let current = room;
  let last: RoomStep | null = null;
  for (let line = 0; line < 2; line += 1) {
    for (const digit of answer) {
      current = step(typeToken(current, digit as '0')).room;
    }
    last = step(enterLine(current, now));
    current = last.room;
  }
  return step(last);
}

describe('arrive (Pattern 2)', () => {
  it('ends on his first touch on the machine, and opens the stage', () => {
    const arrived = enterRoom(r01).room;
    expect(arrived.stage.phase).toBe('arrive');
    expect(notebookWrites(arrived.stage)).toBe(false);
    const touched = step(touchMachine(arrived));
    expect(touched.room.stage.phase).toBe('open');
    expect(touched.events).toEqual([]);
    expect(notebookWrites(touched.room.stage)).toBe(true);
  });

  it('changes nothing else on the touch', () => {
    const arrived = enterRoom(r01).room;
    const touched = step(touchMachine(arrived)).room;
    expect({ ...touched.stage, phase: 'arrive' }).toEqual(arrived.stage);
  });

  it('ignores every later touch', () => {
    for (const phase of allPhases.filter((p) => p !== 'arrive')) {
      expect(touchMachine(inPhase(enterRoom(r01).room, phase)), phase).toBeNull();
    }
  });

  it('opens into open with no pin, poke with a poke window, and pin with a pin alone', () => {
    for (const stage of [...r01.stages, ...r02.stages]) expect(openingPhase(stage)).toBe('open');
    const [first, second] = r03.stages as readonly StageSpec[];
    expect(openingPhase(first as StageSpec)).toBe('poke');
    expect(openingPhase(second as StageSpec)).toBe('pin');
    // A poke window without a pin would never open, so it doesn't count.
    expect(openingPhase({ ...(first as StageSpec), pin: undefined })).toBe('open');
  });

  it('opens room 3 into poke on his first touch, and its second stage into pin', () => {
    expect(step(touchMachine(enterRoom(r03).room)).room.stage.phase).toBe('poke');
    expect(step(touchMachine(enterRoom(r03, 1).room)).room.stage.phase).toBe('pin');
  });

  it('also ends when the dial is turned, since the dial is part of the machine', () => {
    const turned = step(setDial(enterRoom(r01).room, 3)).room;
    expect(turned.stage.phase).toBe('open');
    expect(turned.stage.dialX).toBe(3);
  });
});

describe('presentations', () => {
  it('are the lock and the restart', () => {
    expect(allPhases.map(presentationOf)).toEqual([
      null,
      null,
      null,
      null,
      'locked',
      'restart',
      null,
    ]);
  });

  it('name the room, stage and phase they belong to', () => {
    expect(presentationView(null)).toBeNull();
    const room = enterRoom(r02, 1).room;
    expect(presentationView(room)).toBeNull();
    expect(presentationView(inPhase(room, 'locked'))).toEqual({
      roomId: 'r02',
      stage: 1,
      phase: 'locked',
    });
  });

  it('start the clock when the check line locks the stage', () => {
    const locked = solve(opened(enterRoom(r01).room), '5', 4_200).room;
    expect(locked.stage.phase).toBe('locked');
    expect(locked.stage.presentedAt).toBe(4_200);
  });
});

describe('a room with one stage: arrive → open → locked → restart → done', () => {
  const locked = () => solve(opened(enterRoom(r01).room), '5', 1_000).room;

  it('restarts the whole machine when the lock has played, and fires RoomRestarted', () => {
    const room = locked();
    expect(isLastStage(room)).toBe(true);
    const restart = step(
      finishPresentation(room, { roomId: 'r01', stage: 0, phase: 'locked' }, 2_500),
    );
    expect(restart.room.stage.phase).toBe('restart');
    expect(restart.room.stage.presentedAt).toBe(2_500);
    expect(restart.events).toEqual([{ type: 'RoomRestarted', roomId: 'r01' }]);
    expect(machineView(restart.room)).toMatchObject({ running: true, partsStarted: 1, parts: 1 });
  });

  it('is done when the restart has played, with its lines kept and nothing presenting', () => {
    const restart = step(
      finishPresentation(locked(), { roomId: 'r01', stage: 0, phase: 'locked' }, 2_500),
    ).room;
    const done = step(
      finishPresentation(restart, { roomId: 'r01', stage: 0, phase: 'restart' }, 6_000),
    );
    expect(done.room.stage.phase).toBe('done');
    expect(done.room.stage.presentedAt).toBeNull();
    expect(done.room.stage.lines).toHaveLength(3);
    expect(done.events).toEqual([]);
    expect(presentationView(done.room)).toBeNull();
    expect(machineView(done.room)?.running).toBe(true);
  });

  it('ignores a report for another room, stage or phase, so a late one changes nothing', () => {
    const room = locked();
    expect(finishPresentation(room, { roomId: 'r02', stage: 0, phase: 'locked' }, 0)).toBeNull();
    expect(finishPresentation(room, { roomId: 'r01', stage: 1, phase: 'locked' }, 0)).toBeNull();
    expect(finishPresentation(room, { roomId: 'r01', stage: 0, phase: 'restart' }, 0)).toBeNull();
    const open = opened(enterRoom(r01).room);
    expect(finishPresentation(open, { roomId: 'r01', stage: 0, phase: 'locked' }, 0)).toBeNull();
  });
});

describe('a room with two stages (room 2)', () => {
  it('starts one lamp when the first stage locks, then the second stage arrives', () => {
    const first = solve(opened(enterRoom(r02).room), '4').room;
    expect(first.stage.phase).toBe('locked');
    expect(isLastStage(first)).toBe(false);
    expect(machineView(first)).toMatchObject({ parts: 2, partsStarted: 1, running: false });

    const second = step(finishPresentation(first, { roomId: 'r02', stage: 0, phase: 'locked' }, 9));
    expect(second.events).toEqual([{ type: 'StageArrived', roomId: 'r02', stage: 1 }]);
    expect(second.room.stageIndex).toBe(1);
    expect(second.room.stage.phase).toBe('arrive');
    expect(second.room.stage.pans).toEqual(equation('x : 3 = 5'));
    expect(second.room.stage.dialX).toBe(0);
    expect(second.room.stage.dialOpen).toEqual({ min: 0, max: 30 });
    expect(second.room.stage.machineProgress).toEqual([0]);
    expect(second.room.stage.presentedAt).toBeNull();
    // The first lamp stays lit: the first stage stays solved.
    expect(machineView(second.room)).toMatchObject({ partsStarted: 1, running: false });
  });

  it('restarts the whole machine only after the last stage', () => {
    const first = solve(opened(enterRoom(r02).room), '4').room;
    const second = step(
      finishPresentation(first, { roomId: 'r02', stage: 0, phase: 'locked' }, 0),
    ).room;
    const locked = solve(opened(second), '15').room;
    expect(machineView(locked)).toMatchObject({ partsStarted: 2, running: false });
    const restart = step(
      finishPresentation(locked, { roomId: 'r02', stage: 1, phase: 'locked' }, 0),
    );
    expect(restart.events).toEqual([{ type: 'RoomRestarted', roomId: 'r02' }]);
  });
});

describe('the clock ends a presentation the UI never reports (timeout fallback)', () => {
  const lockedAt = (now: number) => solve(opened(enterRoom(r01).room), '5', now).room;

  it(`waits ${tuning.presentationTimeoutMs} ms, then ends the lock, then the restart`, () => {
    const locked = lockedAt(1_000);
    expect(tickClock(locked, 1_000 + tuning.presentationTimeoutMs - 1)).toBeNull();
    const restart = step(tickClock(locked, 1_000 + tuning.presentationTimeoutMs));
    expect(restart.room.stage.phase).toBe('restart');
    expect(restart.events).toEqual([{ type: 'RoomRestarted', roomId: 'r01' }]);
    const at = restart.room.stage.presentedAt ?? Number.NaN;
    expect(tickClock(restart.room, at + tuning.presentationTimeoutMs - 1)).toBeNull();
    expect(step(tickClock(restart.room, at + tuning.presentationTimeoutMs)).room.stage.phase).toBe(
      'done',
    );
  });

  it('brings the next stage in when the lock of an earlier stage times out', () => {
    const first = solve(opened(enterRoom(r02).room), '4', 0).room;
    const next = step(tickClock(first, tuning.presentationTimeoutMs));
    expect(next.room.stageIndex).toBe(1);
    expect(next.events).toEqual([{ type: 'StageArrived', roomId: 'r02', stage: 1 }]);
  });

  it('does nothing outside a presentation', () => {
    for (const phase of ['arrive', 'poke', 'pin', 'open', 'done'] as const) {
      expect(tickClock(inPhase(enterRoom(r01).room, phase), 1e12), phase).toBeNull();
    }
  });

  it('starts counting at the next tick when a presentation has no start time, or one ahead', () => {
    const unstamped = { ...lockedAt(0), stage: { ...lockedAt(0).stage, presentedAt: null } };
    const stamped = step(tickClock(unstamped, 50_000));
    expect(stamped.room.stage).toMatchObject({ phase: 'locked', presentedAt: 50_000 });
    expect(stamped.events).toEqual([]);
    const ahead = lockedAt(90_000);
    expect(step(tickClock(ahead, 10_000)).room.stage.presentedAt).toBe(10_000);
  });
});

describe('reset (Pattern 2)', () => {
  const lamps = (): RoomState => opened(enterRoom(r02).room);

  it('works in any phase before locked, and is off while locked or restarting', () => {
    expect(allPhases.filter(resetWorks)).toEqual(['arrive', 'poke', 'pin', 'open']);
    const room = lamps();
    for (const phase of ['locked', 'restart', 'done'] as const) {
      expect(resetStage(inPhase(room, phase)), phase).toBeNull();
    }
  });

  it('returns the stage to line 0, the dial to its minimum and the machine to 0', () => {
    let room = step(setDial(lamps(), 4)).room;
    room = step(typeToken(room, '4')).room;
    room = step(enterLine(room, 0)).room; // x = 4: the machine moves to 0.9
    room = step(typeToken(room, '5')).room; // a wrong fill of the check line
    room = step(enterLine(room, 0)).room;
    expect(room.stage.jam).toMatchObject({ kind: 'line' });
    expect(room.stage.machineProgress).toEqual([tuning.progressAnswer]);

    const reset = step(resetStage(room));
    expect(reset.events).toEqual([{ type: 'StageReset', roomId: 'r02', stage: 0 }]);
    const fresh = enterRoom(r02).room.stage;
    expect(reset.room.stage).toEqual({
      ...fresh,
      phase: 'open',
      jamsInARow: room.stage.jamsInARow,
      refused: room.stage.refused,
    });
    expect(reset.room.stage.lines).toHaveLength(1);
    expect(reset.room.stage.dialX).toBe(0);
    expect(reset.room.stage.machineProgress).toEqual([0]);
    expect(reset.room.stage.jam).toBeNull();
    expect(reset.room.stage.templates).toEqual(fresh.templates);
  });

  it('keeps earlier stages solved: the room stays at the stage in play', () => {
    const first = solve(lamps(), '4').room;
    const second = opened(
      step(finishPresentation(first, { roomId: 'r02', stage: 0, phase: 'locked' }, 0)).room,
    );
    const written = step(enterLine(step(typeToken(second, '9')).room, 0)).room;
    const reset = step(resetStage(written));
    expect(reset.room.stageIndex).toBe(1);
    expect(reset.room.stage.pans).toEqual(equation('x : 3 = 5'));
    expect(reset.room.stage.dialOpen).toEqual({ min: 0, max: 30 });
    expect(machineView(reset.room)?.partsStarted).toBe(1);
    expect(reset.events).toEqual([{ type: 'StageReset', roomId: 'r02', stage: 1 }]);
  });

  it('keeps the count of jams in a row, which only a committed line resets', () => {
    const jammed = step(enterLine(step(typeToken(lamps(), '7')).room, 0)).room;
    expect(jammed.stage.jamsInARow).toBe(1);
    expect(step(resetStage(jammed)).room.stage.jamsInARow).toBe(1);
  });

  it('opens a stage reset in arrive', () => {
    const reset = step(resetStage(enterRoom(r02).room));
    expect(reset.room.stage.phase).toBe('open');
  });
});

describe('reset with a pin (Pattern 2)', () => {
  const poking = (): RoomState => opened(enterRoom(r03).room);
  const x = (value: number) => ({ kind: 'x', x: value }) as const;

  it('keeps a locked pin, offers it no more, and opens the full dial range', () => {
    let room = step(setDial(poking(), 8)).room;
    room = step(confirmPin(step(setPin(room, x(12))).room)).room;
    room = step(setDial(room, 17)).room;
    room = step(enterLine(step(typeToken(room, '9')).room, 0)).room; // x = 9 jams
    const reset = step(resetStage(room)).room;
    expect(reset.stage.phase).toBe('open');
    // It resolved as he confirmed it (story 1.14), and stays resolved.
    expect(reset.stage.pin).toEqual({ value: x(12), locked: true, resolved: true });
    expect(reset.stage.dialOpen).toEqual({ min: 6, max: 20 });
    expect(reset.stage.dialX).toBe(6);
    expect(reset.stage.jam).toBeNull();
    expect(reset.stage.lines).toHaveLength(1);
    expect(pinOffered(reset)).toBe(false);
    expect(notebookWrites(reset.stage)).toBe(true);
    expect(setDial(reset, 20)?.room.stage.dialX).toBe(20);
  });

  it('keeps a resolved pin resolved, so it resolves only once per stage', () => {
    let room = step(confirmPin(step(setPin(poking(), x(14))).room)).room;
    room = step(setDial(room, 15)).room;
    const reset = step(resetStage(room));
    expect(reset.room.stage.pin).toEqual({ value: x(14), locked: true, resolved: true });
    expect(reset.room.stage.dialX).toBe(6);
    const levelled = step(setDial(reset.room, 14));
    expect(levelled.events.map((event) => event.type)).toEqual(['DialNotch', 'PansLevel']);
    expect(confirmPin(reset.room)).toBeNull();
  });

  it('puts a pin he had not confirmed back in its holder, and the stage back in poke', () => {
    const pinned = step(setPin(step(setDial(poking(), 9)).room, x(12))).room;
    const reset = step(resetStage(pinned)).room;
    expect(reset.stage.phase).toBe('poke');
    expect(reset.stage.pin).toBeNull();
    expect(reset.stage.dialOpen).toEqual({ min: 6, max: 9 });
    expect(reset.stage.dialX).toBe(6);
    expect(pinOffered(reset)).toBe(true);
  });

  it('returns a stage with a pin but no poke window to pin, not open, until the pin is locked', () => {
    const second = opened(enterRoom(r03, 1).room);
    const pinned = step(setPin(second, { kind: 'choice', index: 0 })).room;
    expect(step(resetStage(pinned)).room.stage).toMatchObject({ phase: 'pin', pin: null });
    const locked = step(confirmPin(pinned)).room;
    expect(step(resetStage(locked)).room.stage.phase).toBe('open');
  });

  it('keeps the hint level, so the first-use wiggle does not come back', () => {
    const room = poking();
    const hinted = { ...room, stage: { ...room.stage, hintLevel: 1 as const } };
    expect(step(resetStage(hinted)).room.stage.hintLevel).toBe(1);
  });
});

describe('toolEarned', () => {
  it("is the room's tool when its whole machine restarts", () => {
    const second = opened(enterRoom(r03, 1).room);
    let room = step(confirmPin(step(setPin(second, { kind: 'choice', index: 1 })).room)).room;
    room = step(setDial(room, 14)).room;
    const locked = solve(room, '14');
    expect(toolEarned(locked)).toBeNull();
    const restart = step(
      finishPresentation(locked.room, { roomId: 'r03', stage: 1, phase: 'locked' }, 0),
    );
    expect(restart.events).toEqual([{ type: 'RoomRestarted', roomId: 'r03' }]);
    expect(toolEarned(restart)).toBe('balance');
  });

  it('is null for a room that earns nothing', () => {
    const locked = solve(opened(enterRoom(r01).room), '5');
    const restart = step(
      finishPresentation(locked.room, { roomId: 'r01', stage: 0, phase: 'locked' }, 0),
    );
    expect(toolEarned(restart)).toBeNull();
  });
});

describe('nextRoom', () => {
  const list: readonly RoomSpec[] = [r01, r02];

  it('is the next room in play order', () => {
    expect(nextRoom(list, 'r01')).toBe(r02);
  });

  it('is null after the last room, and for a room not in the list', () => {
    expect(nextRoom(list, 'r02')).toBeNull();
    expect(nextRoom(list, 'built-abc')).toBeNull();
    expect(nextRoom([], 'r01')).toBeNull();
  });
});

describe('playedThrough', () => {
  const list: readonly RoomSpec[] = [r01, r02];

  it('is true once the last room in play order is done', () => {
    expect(playedThrough(list, inPhase(enterRoom(r02).room, 'done'))).toBe(true);
  });

  it('is false while the last room is still playing, restart included', () => {
    for (const phase of allPhases.filter((p) => p !== 'done')) {
      expect(playedThrough(list, inPhase(enterRoom(r02).room, phase)), phase).toBe(false);
    }
  });

  it('is false for a room done before the last, and for a room not in the list', () => {
    expect(playedThrough(list, inPhase(enterRoom(r01).room, 'done'))).toBe(false);
    expect(playedThrough([r01], inPhase(enterRoom(r02).room, 'done'))).toBe(false);
    expect(playedThrough([], inPhase(enterRoom(r01).room, 'done'))).toBe(false);
  });
});

describe('isLastStage', () => {
  it('is true only on the last stage', () => {
    const stages = r02.stages as readonly StageSpec[];
    expect(stages).toHaveLength(2);
    expect(isLastStage(enterRoom(r02).room)).toBe(false);
    expect(isLastStage(enterRoom(r02, 1).room)).toBe(true);
  });
});
