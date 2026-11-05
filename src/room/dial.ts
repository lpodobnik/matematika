// The x dial (GDD, Mechanics: whole numbers only, one notch per step, within a range set
// per room; in division forms each notch is a multiple of the divisor). Pure: which values
// the dial takes, and what turning it does to the stage. The drag itself (24 CSS px per
// notch) is input handling, in ui/scene/scale/.

import * as q from '@/math/rational';
import type { RoomEvent } from '@/room/events';
import { currentStageSpec } from '@/room/room';
import { isLevel, sideValues } from '@/room/tilt';
import type { DialSpec, Phase, RoomState } from '@/room/types';

/** Notches from min to max: room 1's 0–10 has 10, room 2's 0–30 in 3s has 10 too. */
export function notchCount(dial: DialSpec): number {
  return Math.floor((dial.max - dial.min) / dial.step);
}

/** The x at a notch: notch 0 is the minimum, and each notch adds one step. */
export function dialValue(dial: DialSpec, notch: number): number {
  return dial.min + notch * dial.step;
}

/** The notch an x sits on (a fraction if x isn't on the dial). */
export function notchOf(dial: DialSpec, x: number): number {
  return (x - dial.min) / dial.step;
}

/** Whether the dial can show x: a whole number on one of its notches. */
export function isOnDial(dial: DialSpec, x: number): boolean {
  return Number.isInteger(x) && x >= dial.min && x <= dial.max && (x - dial.min) % dial.step === 0;
}

/**
 * Phases in which the dial turns (Pattern 2). In `pin` the pin has frozen it, and from
 * `locked` on the stage is solved. `arrive` is here until story 1.8 ends it on his first
 * touch on the machine, so the dial works before the room phases exist.
 */
const turningPhases: ReadonlySet<Phase> = new Set<Phase>(['arrive', 'poke', 'open']);

export function dialTurns(phase: Phase): boolean {
  return turningPhases.has(phase);
}

/**
 * What the dial shows: its notches, the part he can reach, where it is and whether it
 * turns (not in a phase that holds it, nor while the machine is jammed).
 */
export interface DialView extends DialSpec {
  /** The reachable part: the poke window (story 1.9), then the full range. */
  openMin: number;
  openMax: number;
  x: number;
  turns: boolean;
}

/** The dial of the stage in play, or null with no room or a locked dial. Flat, for selectors. */
export function dialView(room: RoomState | null): DialView | null {
  if (!room) return null;
  const { dial } = currentStageSpec(room);
  if (dial === 'locked') return null;
  const { stage } = room;
  return {
    min: dial.min,
    max: dial.max,
    step: dial.step,
    openMin: stage.dialOpen.min,
    openMax: stage.dialOpen.max,
    x: stage.dialX,
    turns: dialTurns(stage.phase) && stage.jam === null,
  };
}

export interface DialStep {
  room: RoomState;
  events: RoomEvent[];
}

/**
 * Turns the dial to x (`dial/set`): the pans are weighed at x, `DialNotch` fires, and
 * `PansLevel` too when the sides are equal there. Null, so the action is ignored, when x is
 * where the dial already is, isn't one of its reachable notches, the phase holds the dial
 * still, or the machine is jammed (Pattern 2: while jammed he can only edit the draft,
 * drag the splitter off, reset or leave). The store only changes when the notch does.
 */
export function setDial(room: RoomState, x: number): DialStep | null {
  const { dial } = currentStageSpec(room);
  const { stage } = room;
  if (dial === 'locked' || !dialTurns(stage.phase) || stage.jam !== null) return null;
  if (x === stage.dialX || !isOnDial(dial, x)) return null;
  if (x < stage.dialOpen.min || x > stage.dialOpen.max) return null;
  const events: RoomEvent[] = [{ type: 'DialNotch', x }];
  if (isLevel(sideValues(stage.pans, q.rational(x)))) {
    events.push({ type: 'PansLevel', roomId: room.spec.id, stage: room.stageIndex, x });
  }
  return { room: { ...room, stage: { ...stage, dialX: x } }, events };
}
