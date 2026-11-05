// The domain events room reducers return (architecture, Pattern 4). They are defined here,
// beside the code that emits them, because pure folders can't import the store; the one
// DomainEvent union in src/store/events.ts is made of these.

import type { RoomSpec, WayId } from '@/room/types';

export type RoomEvent =
  | { type: 'StageArrived'; roomId: RoomSpec['id']; stage: number }
  /** The dial landed on a new notch (audio: a tick). */
  | { type: 'DialNotch'; x: number }
  /** The dial levelled the pans (audio: a thunk). Never fired by acting out a line. */
  | { type: 'PansLevel'; roomId: RoomSpec['id']; stage: number; x: number }
  /**
   * A line was committed to the notebook (saving from epic 2; the play log). `progress` is
   * whether it moves the machine: a valid line's own progress, and always for the answer
   * and check lines.
   */
  | {
      type: 'LineAccepted';
      roomId: RoomSpec['id'];
      stage: number;
      source: 'typed' | WayId;
      progress: boolean;
    }
  /** Enter judged a line wrong; it stays in the draft (the play log keeps the text). */
  | { type: 'LineWrong'; roomId: RoomSpec['id']; stage: number; line: string }
  /** The machine jammed: on a wrong line, or (story 1.11) a split that doesn't divide (audio: a hiss). */
  | { type: 'MachineJammed'; roomId: RoomSpec['id']; kind: 'line' | 'split' }
  /** The check line locked the stage's machine. */
  | { type: 'StageLocked'; roomId: RoomSpec['id']; stage: number }
  /** He reset the stage to line 0 (the play log's room `reset`). Earlier stages stay solved. */
  | { type: 'StageReset'; roomId: RoomSpec['id']; stage: number }
  /**
   * The room's last stage locked and the whole machine starts running (audio: its loop
   * joins; the play log's room `done`). The next room loads when the restart ends.
   */
  | { type: 'RoomRestarted'; roomId: RoomSpec['id'] };
