// Machine progress (architecture Pattern 1: "moves the machine one stage"). Each machine
// runs from 0, stopped, to 1, running. A valid line with progress adds
// `tuning.progressStep` up to `tuning.progressCap`; the answer line sets
// `tuning.progressAnswer`; the check line sets 1 and locks the machine. A valid line
// without progress adds nothing. The skin shows progress continuously, so any number of
// lines works, including the two-line shortest solution.

import { tuning } from '@/config/tuning';
import type { Verdict } from '@/math/check';
import type { MachineId, Phase, RoomState } from '@/room/types';

/** Progress is shown, never computed on: this keeps 0.2 + 0.2 + 0.2 at 0.6. */
function tidy(progress: number): number {
  return Math.round(progress * 1e6) / 1e6;
}

/** A machine's progress after a committed line with this verdict. It never goes back. */
export function progressAfter(progress: number, verdict: Verdict): number {
  switch (verdict.kind) {
    case 'valid': {
      if (!verdict.progress) return progress;
      const step = Math.min(tuning.progressCap, tidy(progress + tuning.progressStep));
      return Math.max(progress, step);
    }
    case 'answer':
      return Math.max(progress, tuning.progressAnswer);
    case 'check':
      return 1;
    default:
      return progress;
  }
}

/** Phases in which the stage's machine is locked: solved, then restarting (Pattern 2). */
const lockedPhases: ReadonlySet<Phase> = new Set<Phase>(['locked', 'restart', 'done']);

export function isLocked(phase: Phase): boolean {
  return lockedPhases.has(phase);
}

/** Phases in which the whole machine runs: its restart, and after it (Pattern 2, Restart). */
export function isRunning(phase: Phase): boolean {
  return phase === 'restart' || phase === 'done';
}

/** What the machine's skin shows. Flat, for selectors. */
export interface MachineView {
  /** Which skin draws it. */
  id: MachineId;
  /** 0–1: how far the active machine has moved. */
  progress: number;
  jammed: boolean;
  locked: boolean;
  /** The machine's parts, one per stage of the room (room 2's two lamps). */
  parts: number;
  /**
   * How many parts have started: one for each stage solved, this one included once it
   * locks. The stages before the one in play are solved, so they stay started.
   */
  partsStarted: number;
  /** The whole machine runs: its restart is playing, or it has played. */
  running: boolean;
}

/** The active machine of the stage in play, or null with no room. */
export function machineView(room: RoomState | null): MachineView | null {
  if (!room) return null;
  const { stage } = room;
  const locked = isLocked(stage.phase);
  return {
    id: room.spec.machine,
    progress: stage.machineProgress[stage.machine] ?? 0,
    jammed: stage.jam !== null,
    locked,
    parts: room.spec.stages.length,
    partsStarted: room.stageIndex + (locked ? 1 : 0),
    running: isRunning(stage.phase),
  };
}
