// The room in progress, as the save keeps it, and resuming it (story 2.1; architecture, Data
// Persistence: "a reload resumes at the last written line"). Pure. The save keeps only what
// he has committed: the stage, its lines after line 0, and the pin he confirmed. What he was
// only trying (the dial, pieces moved but not written, a pin not yet confirmed, the draft)
// is not kept. Resuming replays the committed part through the room's own functions, so the
// notebook, the pans, the blanks and the machine's progress come back as they were after
// the last line; anything that no longer replays (the room's content changed, or the save
// was edited) gives null, and the caller starts the stage fresh.

import { check } from '@/math/check';
import type { Equation } from '@/math/expr';
import { tokenize } from '@/math/tokens';
import { withLastLines } from '@/room/fading';
import {
  commitLine,
  commitTypedLine,
  committedEquations,
  isCommitted,
  lineProgress,
} from '@/room/notebook';
import { touchMachine } from '@/room/phases';
import { confirmPin, setPin } from '@/room/pin';
import { currentStageSpec, enterRoom } from '@/room/room';
import { linearSide, sideExpr } from '@/room/tray';
import {
  type NotebookLine,
  type Phase,
  type PinValue,
  type RoomId,
  type RoomSpec,
  type RoomState,
  roomIds,
  type WayId,
} from '@/room/types';

/** A committed line as the save keeps it. */
export interface SavedLine {
  /** Its pad characters, as written: `2x+5−5=23−5`. */
  text: string;
  /** Who wrote it: he typed it, or a way on the machine wrote it (Balance `auto`). */
  source: 'typed' | WayId;
  /**
   * Whether it moved the machine (`LineAccepted.progress`). Kept because a Balance line is
   * judged against the lines before its move, which the replay can't tell apart.
   */
  progress: boolean;
}

/** The room in progress (`SaveV1.progress.room`). */
export interface SavedRoom {
  id: RoomId;
  /** Index into the room's stages; the stages before it are solved. */
  stage: number;
  /** The stage's committed lines after line 0, in order. */
  lines: SavedLine[];
  /** The pin, once he confirmed it; null before, and in a stage with no pin. */
  pin: PinValue | null;
  /**
   * The splitter has been offered in this stage, so it stays offered, a reset and a reload
   * included (room/splitter.ts; story 2.1 review).
   */
  splitterSeen: boolean;
}

const authored: ReadonlySet<string> = new Set(roomIds);

export function isRoomId(id: string): id is RoomId {
  return authored.has(id);
}

/** Phases after which the room is no longer in progress: its restart has begun. */
const finishedPhases: ReadonlySet<Phase> = new Set<Phase>(['restart', 'done']);

function savedLine(line: NotebookLine): SavedLine | null {
  if (line.source === 'given') return null;
  return { text: line.tokens.join(''), source: line.source, progress: lineProgress(line.verdict) };
}

/**
 * The room in play as the save keeps it, or null when nothing is in progress: no room, a
 * room whose restart has begun (it is in rooms done), or a room that isn't authored (built
 * and friends' rooms join the save in epic 5).
 */
export function savedRoomOf(room: RoomState | null): SavedRoom | null {
  if (!room || finishedPhases.has(room.stage.phase) || !isRoomId(room.spec.id)) return null;
  const { stage } = room;
  return {
    id: room.spec.id,
    stage: room.stageIndex,
    lines: stage.lines.flatMap((line) => savedLine(line) ?? []),
    pin: stage.pin?.locked ? stage.pin.value : null,
    splitterSeen: stage.balance.splitterSeen,
  };
}

/**
 * The stage open, as he left it before his first line: touched, and with a pin, the pin set
 * where he confirmed it and confirmed, so the machine tests it again (its events are not
 * kept: a paid prediction stays paid in the economy). Null when the save doesn't fit the
 * stage: a pin for a stage without one, none for a stage with one, or a pin off its track.
 */
function opened(room: RoomState, pin: PinValue | null): RoomState | null {
  const touched = touchMachine(room)?.room;
  if (!touched) return null;
  if (!currentStageSpec(touched).pin) return pin === null ? touched : null;
  if (pin === null) return null;
  const placed = setPin(touched, pin)?.room;
  return placed ? (confirmPin(placed)?.room ?? null) : null;
}

/**
 * Where a Balance move left the pans: each side's pieces gathered (`2x + 5 − 5 = 23 − 5`
 * leaves `2x = 18`), as room/tray.ts's move does. Its result is written as the next line,
 * unless it is the answer line, which he writes himself.
 */
function moveResult(line: Equation): Equation {
  const [left, right] = [line.left, line.right].map((side) => {
    const { a, b } = linearSide(side);
    return sideExpr(a, b);
  });
  return left && right ? { left, right } : line;
}

/**
 * One saved line committed again, as it was written: a typed line as enter commits it
 * (without enter's refusals, since it was accepted when he wrote it), a way's line as the
 * way writes it, with its saved progress, the pans taking the move's result. Null when it
 * no longer commits, or the stage no longer takes lines.
 */
function replayLine(room: RoomState, line: SavedLine, now: number): RoomState | null {
  if (room.stage.phase !== 'open') return null;
  const tokenized = tokenize(line.text);
  if (!tokenized.ok || tokenized.tokens.length === 0) return null;
  const { tokens } = tokenized;
  const verdict = check(committedEquations(room.stage.lines), tokens);
  if (!isCommitted(verdict)) return null;
  if (line.source === 'typed') return commitTypedLine(room, tokens, verdict, now).room;
  // A way never writes the answer or the check line.
  if (verdict.kind !== 'valid') return null;
  const written = commitLine(room.stage, tokens, line.source, {
    ...verdict,
    progress: line.progress,
  });
  // Only whether a move was made counts (room/tray.ts, room/handover.ts), so each way line counts one.
  const balance = { ...written.balance, moves: written.balance.moves + 1 };
  const stage = withLastLines(currentStageSpec(room), {
    ...written,
    pans: moveResult(written.pans),
    balance,
  });
  return { ...room, stage };
}

/**
 * The room as the save left it (`savedRoomOf`): entered at its stage, then opened and its
 * lines replayed, so he is back after his last line. `now` is ctx.now: a replayed check
 * line presents the lock from then. Null when the save doesn't replay: a stage that no
 * longer exists, a pin that doesn't fit, or a line that no longer commits.
 */
export function resumeRoom(spec: RoomSpec, saved: SavedRoom, now: number): RoomState | null {
  if (!Number.isInteger(saved.stage) || !spec.stages[saved.stage]) return null;
  const entered = enterRoom(spec, saved.stage).room;
  let room: RoomState | null =
    saved.pin === null && saved.lines.length === 0 ? entered : opened(entered, saved.pin);
  for (const line of saved.lines) {
    if (!room) return null;
    room = replayLine(room, line, now);
  }
  if (!room || !saved.splitterSeen) return room;
  const { stage } = room;
  return { ...room, stage: { ...stage, balance: { ...stage.balance, splitterSeen: true } } };
}
