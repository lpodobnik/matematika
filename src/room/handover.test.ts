import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r03 } from '@/content/rooms/r03-sluice-gate';
import { r04 } from '@/content/rooms/r04-water-wheel';
import { parse } from '@/math/parse';
import { tokenize } from '@/math/tokens';
import { setDial } from '@/room/dial';
import {
  actedAt,
  handoverApplies,
  handoverMet,
  handoverOrder,
  handoverView,
  meetHandovers,
  stampArrival,
  stepsTaken,
  tickIdle,
  xIsolated,
} from '@/room/handover';
import { enterLine, typeToken } from '@/room/notebook';
import { resetStage, touchMachine } from '@/room/phases';
import { setPin } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import { scaleView } from '@/room/scale';
import { splitterOffered } from '@/room/splitter';
import { dropOnScale, trayOffered } from '@/room/tray';
import type { FirstUseId, HandoverId, RoomSpec, RoomState, StageSpec, ToolId } from '@/room/types';

const balance: ToolId[] = ['balance'];

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

function equation(text: string) {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse`);
  return result.equation;
}

/** Every handover met but the ones named. */
function metBut(...unmet: HandoverId[]): FirstUseId[] {
  return handoverOrder.filter((id) => !unmet.includes(id)).map(handoverMet);
}
const allMet = metBut();

const opened = (room: RoomState): RoomState => step(touchMachine(room)).room;
const doorLift = (): RoomState => opened(enterRoom(r01).room);
const dialTo = (room: RoomState, x: number): RoomState => step(setDial(room, x)).room;

/** Types a line (or a blank's digits) and enters it. */
function write(room: RoomState, text: string): RoomState {
  const tokens = tokenize(text);
  if (!tokens.ok) throw new Error(text);
  const typed = tokens.tokens.reduce(
    (current, token) => step(typeToken(current, token)).room,
    room,
  );
  return step(enterLine(typed, 0)).room;
}

/**
 * Room 4, open, with the dial at 6, short of the answer 9; the tray is offered from the
 * start (story 1.16). Story 1.16 took its pin away (until then this locked the pin at 9
 * first).
 */
function waterWheel(): RoomState {
  return dialTo(opened(enterRoom(r04).room), 6);
}

/**
 * Room 4 as a stage Try values could finish, on the dial of 0–6 it had until Luka ran it
 * past the answer: the tray waits there for the dial's end, so the dial's step applies first.
 */
const triedWheel: RoomSpec = {
  ...r04,
  stages: [
    {
      ...(r04.stages[0] as StageSpec),
      dial: { min: 0, max: 6, step: 1 },
      ways: ['try', 'balance'],
    },
  ],
};

/** The stage after Balance moves wrote these lines (as Balance `auto` does), the last on the pans. */
function balancedTo(room: RoomState, ...lines: string[]): RoomState {
  let { stage } = room;
  for (const text of lines) {
    const tokens = tokenize(text);
    if (!tokens.ok) throw new Error(text);
    stage = {
      ...stage,
      lines: [
        ...stage.lines,
        {
          tokens: tokens.tokens,
          source: 'balance',
          verdict: { kind: 'valid', move: { kind: 'none' }, progress: true },
        },
      ],
      pans: equation(text),
    };
  }
  return {
    ...room,
    stage: { ...stage, balance: { ...stage.balance, moves: stage.balance.moves + 1 } },
  };
}

describe('which handover applies (story 1.15)', () => {
  it('tells him to turn the dial from arrival until the pans level', () => {
    const arrived = enterRoom(r01).room;
    expect(handoverView(arrived, [], [])).toBe('dial');
    expect(handoverView(doorLift(), [], [])).toBe('dial');
    expect(handoverView(dialTo(doorLift(), 3), [], [])).toBe('dial');
    expect(handoverView(doorLift(), [handoverMet('dial')], [])).toBeNull();
  });

  it('tells him to write x once his dial levels the pans, and to check after the answer', () => {
    const level = dialTo(doorLift(), 5);
    expect(handoverApplies('dial', level, [])).toBe(false);
    expect(handoverView(level, metBut('write'), [])).toBe('write');
    // Turned past level, the pans tip again: no "the scale is level".
    expect(handoverApplies('write', dialTo(level, 6), [])).toBe(false);
    const answered = write(level, '5');
    expect(handoverView(answered, metBut('check'), [])).toBe('check');
    // Turning the dial after the answer still leaves the check line to write.
    expect(handoverView(dialTo(answered, 2), metBut('check'), [])).toBe('check');
    const locked = write(answered, '5');
    expect(locked.stage.phase).toBe('locked');
    expect(handoverView(locked, [], [])).toBeNull();
  });

  it('shows the earliest step he has not met, one at a time', () => {
    const level = dialTo(doorLift(), 5);
    expect(handoverView(level, [], [])).toBe('write');
    expect(handoverView(level, metBut('write', 'check'), [])).toBe('write');
    // The answer written, check is the only step that applies.
    expect(handoverView(write(level, '5'), [], [])).toBe('check');
  });

  it('stays quiet while the pin is offered, its own question asking, and while jammed', () => {
    const poking = opened(enterRoom(r03).room);
    expect(poking.stage.phase).toBe('poke');
    expect(handoverOrder.some((id) => handoverApplies(id, poking, []))).toBe(false);
    const pinned = step(setPin(poking, { kind: 'x', x: 12 })).room;
    expect(handoverView(pinned, [], [])).toBeNull();
    // Room 3's second stage pins before the dial moves.
    expect(handoverView(opened(enterRoom(r03, 1).room), [], [])).toBeNull();
    const jammed = write(dialTo(doorLift(), 5), '4');
    expect(jammed.stage.jam).toEqual({ kind: 'line' });
    expect(handoverView(jammed, [], [])).toBeNull();
  });

  it('offers the tray step when the tray is offered, and the dial step no more', () => {
    const room = waterWheel();
    expect(trayOffered(room, balance)).toBe(true);
    expect(handoverApplies('dial', room, balance)).toBe(false);
    expect(handoverView(room, metBut('tray'), balance)).toBe('tray');
    // Without Balance there is no tray, so the dial is the step.
    expect(handoverView(room, metBut('dial'), [])).toBe('dial');
    // Room 4 offers the tray from the start (story 1.16), before any notch.
    expect(handoverView(opened(enterRoom(r04).room), metBut('tray'), balance)).toBe('tray');
  });

  it('sets the goal after a Balance move that leaves numbers beside x', () => {
    const moved = balancedTo(waterWheel(), '2x + 8 = 26');
    expect(handoverApplies('tray', moved, balance)).toBe(false);
    expect(handoverView(moved, metBut('balance-goal'), balance)).toBe('balance-goal');
    expect(handoverView(moved, [], balance)).toBe('balance-goal');
  });

  // Story 1.15 review: it looked for a line written by Balance, and Balance `blank` and
  // `blanks` write none, so the goal never showed there. It counts the moves now.
  it('sets the goal after a Balance move that writes no line (Balance blank or blanks)', () => {
    for (const mode of ['blank', 'blanks'] as const) {
      const first = r04.stages[0] as StageSpec;
      const quiet: RoomSpec = {
        ...r04,
        stages: [{ ...first, fading: { try: 'blank', balance: mode } }],
      };
      const open = opened(enterRoom(quiet).room);
      const moved = step(dropOnScale(dialTo(open, 6), balance, 'float')).room;
      expect(moved.stage.lines, mode).toHaveLength(1);
      expect(moved.stage.balance.moves, mode).toBe(1);
      expect(handoverApplies('tray', moved, balance), mode).toBe(false);
      expect(handoverView(moved, metBut('balance-goal'), balance), mode).toBe('balance-goal');
    }
  });

  it('shows the splitter once a side holds only x, and nothing once x stands alone', () => {
    const twoX = balancedTo(waterWheel(), '2x + 5 − 5 = 23 − 5', '2x = 18');
    expect(splitterOffered(twoX, balance)).toBe(true);
    expect(handoverApplies('balance-goal', twoX, balance)).toBe(false);
    expect(handoverView(twoX, metBut('splitter'), balance)).toBe('splitter');
    expect(handoverView(twoX, [], balance)).toBe('splitter');
    const alone = balancedTo(twoX, 'x = 9');
    expect(handoverApplies('splitter', alone, balance)).toBe(false);
    // Story 1.16: Balance leaves x alone, but the scale stays at the slider's 6, out of
    // balance, so it isn't `write` ("the scale is level") any more: `answer` asks for x.
    expect(handoverApplies('write', alone, balance)).toBe(false);
    expect(handoverView(alone, metBut('write', 'answer'), balance)).toBe('answer');
    expect(handoverView(alone, allMet, balance)).toBeNull();
  });

  // Story 1.16 review: x alone is judged on the pans' pieces, the rule the blanks and
  // simplify first use, so `x = 23 − 14` (a weight and a balloon) doesn't ask for x; and
  // the splitter's tag doesn't come where x is already single, with nothing to split.
  it('asks neither for x nor for the splitter at x = 23 − 14', () => {
    const twoX = write(waterWheel(), '2x = 18');
    const typed = write(twoX, 'x = 23 − 14');
    expect(typed.stage.lines).toHaveLength(3);
    expect(splitterOffered(typed, balance)).toBe(true);
    expect(handoverApplies('answer', typed, balance)).toBe(false);
    expect(handoverApplies('splitter', typed, balance)).toBe(false);
    expect(handoverApplies('splitter', twoX, balance)).toBe(true);
    // The split's own line is one gear against a 9: x alone.
    const split = balancedTo(twoX, '2x : 2 = 18 : 2');
    expect(handoverApplies('answer', split, balance)).toBe(true);
  });

  it('has the answer step after write and before check (1.16), and the chain before the tray (4.1)', () => {
    expect(handoverOrder).toEqual([
      'story',
      'dial',
      'rewrite',
      'write',
      'answer',
      'check',
      'chain',
      'tray',
      'balance-goal',
      'splitter',
    ]);
  });

  it('asks for x once room 4’s pans show x alone and no answer is written (story 1.16)', () => {
    const twoX = step(dropOnScale(waterWheel(), balance, 'float')).room;
    expect(handoverApplies('answer', twoX, balance)).toBe(false);
    const alone = { ...twoX, stage: { ...twoX.stage, pans: equation('x = 9') } };
    expect(handoverApplies('answer', alone, balance)).toBe(true);
    // Nothing earlier applies, even for a player who has met nothing.
    expect(handoverView(alone, [], balance)).toBe('answer');
    expect(handoverView(alone, metBut('splitter'), balance)).toBeNull();
    const backwards = { ...twoX, stage: { ...twoX.stage, pans: equation('9 = x') } };
    expect(handoverApplies('answer', backwards, balance)).toBe(true);
    // Not while x has company, nor once the answer is written.
    expect(handoverApplies('answer', balancedTo(waterWheel(), '2x = 18'), balance)).toBe(false);
    const answered = write(balancedTo(waterWheel(), '2x = 18'), 'x = 9');
    expect(handoverApplies('answer', answered, balance)).toBe(false);
    expect(handoverView(answered, metBut('check'), balance)).toBe('check');
  });

  // Story 1.16: the pans no longer weigh the stage's solution after a line, so `write`
  // ("the scale is level, write x") must also be a step he can take: simplify first.
  it('says the scale is level only where the answer may be written now', () => {
    const spec: RoomSpec = {
      ...r01,
      stages: [{ ...(r01.stages[0] as StageSpec), ways: ['balance'], fading: { try: 'blank' } }],
    };
    // x + 4 = 9 levels at 5, but only Balance finishes it, so x = 5 would be refused there.
    const level = dialTo(opened(enterRoom(spec).room), 5);
    expect(scaleView(level).level).toBe(true);
    expect(handoverApplies('write', level, [])).toBe(false);
    const notYet = dialTo(write(opened(enterRoom(spec).room), 'x = 9 − 4'), 5);
    expect(handoverApplies('write', notYet, [])).toBe(false);
    // Simplified to 2x = 10, it levels at 5 and he may write x = 5.
    const simplified = dialTo(write(opened(enterRoom(spec).room), '2x = 10'), 5);
    expect(handoverApplies('write', simplified, [])).toBe(true);
    expect(handoverApplies('write', dialTo(simplified, 4), [])).toBe(false);
  });

  // Story 1.15 kept the dial's tag away while a written line was acted out; now he has
  // written a line himself. On the tried wheel: room 4 offers the tray at once, so its
  // dial's step never applies with Balance.
  it('stops telling him to turn the dial once he writes a line himself', () => {
    const open = opened(enterRoom(triedWheel).room);
    expect(handoverApplies('dial', open, balance)).toBe(true);
    const typedLine = write(open, '2x = 18');
    expect(handoverApplies('dial', typedLine, balance)).toBe(false);
    expect(handoverView(typedLine, metBut('splitter'), balance)).toBe('splitter');
  });

  it('shows the earliest step that applies again once he has idled, met or not', () => {
    const room = doorLift();
    expect(handoverView(room, allMet, [])).toBeNull();
    const idle = { ...room, stage: { ...room.stage, idle: true } };
    expect(handoverView(idle, allMet, [])).toBe('dial');
    const level = dialTo(room, 5);
    expect(handoverView({ ...level, stage: { ...level.stage, idle: true } }, allMet, [])).toBe(
      'write',
    );
  });
});

describe('xIsolated', () => {
  it('holds when one side has only x and the other only numbers', () => {
    expect(xIsolated(equation('2x = 18'))).toBe(true);
    expect(xIsolated(equation('18 = 2x'))).toBe(true);
    expect(xIsolated(equation('x = 9'))).toBe(true);
    expect(xIsolated(equation('x : 3 = 5'))).toBe(true);
    expect(xIsolated(equation('2x + 5 = 23'))).toBe(false);
    expect(xIsolated(equation('20 − x = 6'))).toBe(false);
    expect(xIsolated(equation('3x = x + 8'))).toBe(false);
  });
});

describe('taking a step marks it met (story 1.15)', () => {
  it('meets the dial with his first notch, wherever he turns it', () => {
    const before = doorLift();
    expect(stepsTaken(before, dialTo(before, 1), 'dial', [])).toEqual(['dial']);
    expect(meetHandovers(before, dialTo(before, 1), 'dial', [], [])).toEqual(['handover-dial']);
    expect(meetHandovers(before, dialTo(before, 1), 'dial', ['handover-dial'], [])).toBeNull();
  });

  it('meets write with the answer line, and check with the check line', () => {
    const level = dialTo(doorLift(), 5);
    const answered = write(level, '5');
    expect(stepsTaken(level, answered, 'other', [])).toEqual(['write']);
    expect(stepsTaken(answered, write(answered, '5'), 'other', [])).toEqual(['check']);
    // A wrong answer jams, and meets nothing.
    expect(stepsTaken(level, write(level, '4'), 'other', [])).toEqual([]);
  });

  // Story 1.16: answer is met only when its step applied, so room 1's answer (after his dial
  // levelled the pans) doesn't meet it, and room 4 still shows it once.
  it('meets answer with the answer line written while x stood alone on the pans', () => {
    const twoX = balancedTo(waterWheel(), '2x + 5 − 5 = 23 − 5', '2x = 18');
    const alone = { ...twoX, stage: { ...twoX.stage, pans: equation('x = 9') } };
    const answered = write(alone, 'x = 9');
    expect(stepsTaken(alone, answered, 'other', balance)).toEqual(['write', 'answer']);
    expect(meetHandovers(alone, answered, 'other', [], balance)).toEqual([
      'handover-write',
      'handover-answer',
    ]);
    // Written beside 2x = 18, before x stood alone, it never showed: not met.
    expect(stepsTaken(twoX, write(twoX, 'x = 9'), 'other', balance)).toEqual(['write']);
  });

  it('meets the tray with a move between the tray and the scale, and the splitter with a split', () => {
    const room = waterWheel();
    expect(stepsTaken(room, room, 'tray', balance)).toEqual(['tray']);
    expect(stepsTaken(room, room, 'split', balance)).toEqual(['splitter']);
    expect(stepsTaken(room, room, 'other', balance)).toEqual([]);
    expect(stepsTaken(room, room, null, balance)).toEqual([]);
  });

  it('meets the goal only when it applied and his Balance move isolated x', () => {
    const room = waterWheel();
    const eight = balancedTo(room, '2x + 8 = 26');
    const twoX = balancedTo(eight, '2x = 18');
    expect(stepsTaken(eight, twoX, 'tray', balance)).toEqual(['tray', 'balance-goal']);
    // His first move isolated x straight away: the goal never showed, so it isn't met.
    expect(stepsTaken(room, balancedTo(room, '2x = 18'), 'tray', balance)).toEqual(['tray']);
    // A move that leaves numbers beside x doesn't meet it.
    expect(stepsTaken(eight, balancedTo(eight, '2x + 3 = 21'), 'tray', balance)).toEqual(['tray']);
  });

  it('never compares two different stages', () => {
    const room = doorLift();
    const other = opened(enterRoom(r03, 1).room);
    expect(meetHandovers(room, other, 'dial', [], [])).toBeNull();
    expect(meetHandovers(null, room, 'dial', [], [])).toBeNull();
  });
});

describe('the idle clock (story 1.15)', () => {
  it('starts as a stage arrives, and only once', () => {
    const arrived = enterRoom(r01).room;
    expect(arrived.stage.lastActionAt).toBeNull();
    const stamped = stampArrival(arrived, 1000);
    expect(stamped?.stage.lastActionAt).toBe(1000);
    expect(stampArrival(stamped as RoomState, 2000)).toBeNull();
  });

  it('goes idle after tuning.hintIdleMs without his acting, and his action ends it', () => {
    const room = actedAt(doorLift(), 0);
    expect(tickIdle(room, tuning.hintIdleMs - 1)).toBeNull();
    const idle = tickIdle(room, tuning.hintIdleMs);
    expect(idle?.stage.idle).toBe(true);
    expect(tickIdle(idle as RoomState, tuning.hintIdleMs * 2)).toBeNull();
    const acted = actedAt(idle as RoomState, tuning.hintIdleMs + 500);
    expect(acted.stage).toMatchObject({ idle: false, lastActionAt: tuning.hintIdleMs + 500 });
    expect(actedAt(acted, tuning.hintIdleMs + 500)).toBe(acted);
  });

  it('starts counting on a tick with no start time, or when the clock went back', () => {
    const room = doorLift();
    expect(tickIdle(room, 5000)?.stage.lastActionAt).toBe(5000);
    const later = actedAt(room, 9000);
    expect(tickIdle(later, 4000)?.stage).toMatchObject({ lastActionAt: 4000, idle: false });
  });

  it('never ticks once the stage locks', () => {
    const locked = write(write(dialTo(doorLift(), 5), '5'), '5');
    expect(tickIdle(actedAt(locked, 0), tuning.hintIdleMs * 2)).toBeNull();
  });

  it('is reset with the stage: a reset stage arrives with no start time', () => {
    const idle = { ...doorLift(), stage: { ...doorLift().stage, lastActionAt: 0, idle: true } };
    expect(step(resetStage(idle)).room.stage).toMatchObject({ lastActionAt: null, idle: false });
  });
});
