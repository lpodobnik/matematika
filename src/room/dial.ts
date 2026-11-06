// The x dial (GDD, Mechanics: whole numbers only, one notch per step, within a range set
// per room; in division forms each notch is a multiple of the divisor). Pure: which values
// the dial takes, and what turning it does to the stage. The drag itself (24 CSS px per
// notch) is input handling, in ui/scene/scale/.

import * as q from '@/math/rational';
import type { RoomEvent } from '@/room/events';
import { openingPhase, touchMachine } from '@/room/phases';
import { currentStageSpec, hasPin, pokeNotches } from '@/room/room';
import { isLevel, sideValues } from '@/room/tilt';
import type { DialSpec, Phase, RoomState, StageSpec } from '@/room/types';

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
 * Whether a stage's dial turns in a phase (Pattern 2). It turns in `poke`, `pin` and `open`,
 * over its reachable part (`dialOpen`): in `pin` the poke window still holds it, so placing
 * or moving the pin never freezes it (story 1.14). A stage with a pin but no poke window
 * (room 3's second) opens straight into `pin`, and there its dial stays still until the pin
 * is confirmed. In `arrive` it turns if the phase the stage opens into does: the dial is
 * part of the machine, so grabbing it is the first touch that ends arrive, and the drag goes
 * on. From `locked` on the stage is solved.
 */
export function dialTurnsIn(stage: StageSpec, phase: Phase): boolean {
  switch (phase) {
    case 'arrive':
      return dialTurnsIn(stage, openingPhase(stage));
    case 'poke':
    case 'open':
      return true;
    case 'pin':
      return pokeNotches(stage) !== null;
    default:
      return false;
  }
}

/**
 * Whether the dial of the stage in play turns now: in a phase where its stage's dial turns,
 * and not while the machine is jammed.
 */
export function dialTurnsNow(room: RoomState): boolean {
  const { stage } = room;
  return stage.jam === null && dialTurnsIn(currentStageSpec(room), stage.phase);
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
  /**
   * A pin waits to be confirmed and holds the dial still where it is: a stage with a pin but
   * no poke window (room 3's second), in `arrive` and `pin`. The scene clamps the knob there.
   */
  heldByPin: boolean;
}

/** The dial of the stage in play, or null with no room or a locked dial. Flat, for selectors. */
export function dialView(room: RoomState | null): DialView | null {
  if (!room) return null;
  const { dial } = currentStageSpec(room);
  if (dial === 'locked') return null;
  const { stage } = room;
  const spec = currentStageSpec(room);
  const waiting = stage.phase === 'arrive' || stage.phase === 'pin';
  return {
    min: dial.min,
    max: dial.max,
    step: dial.step,
    openMin: stage.dialOpen.min,
    openMax: stage.dialOpen.max,
    x: stage.dialX,
    turns: dialTurnsNow(room),
    heldByPin: waiting && hasPin(spec) && !stage.pin?.locked && !dialTurnsIn(spec, stage.phase),
  };
}

export interface DialStep {
  room: RoomState;
  events: RoomEvent[];
}

/**
 * Turns the dial to x (`dial/set`): the pans are weighed at x, `DialNotch` fires, and
 * `PansLevel` too when the sides are equal there. Turning the dial is exploring, so it ends
 * acting out a written line: the pans go back to the dial's x, in the last committed
 * line's layout (Pattern 1). It never resolves the pin: the pin resolves when he confirms
 * it, and the machine tests it then (room/pin.ts; story 1.14). Null, so the action is
 * ignored, when x is where the dial already is, isn't one of its reachable notches (the
 * poke window, until the pin is locked), the phase holds the dial still, or the machine is
 * jammed (Pattern 2: while jammed he can only edit the draft, reset or leave). The store only changes when the notch does. A notch in `arrive` is a touch on
 * the machine, so it ends arrive too (the scene reports the touch first, so this only
 * matters if that report is ever missed). A notch at the dial's maximum that leaves the
 * pans tipped is remembered: it offers the tray (room/tray.ts; story 1.15).
 */
export function setDial(room: RoomState, x: number): DialStep | null {
  const { dial } = currentStageSpec(room);
  const { stage } = room;
  if (dial === 'locked' || !dialTurnsNow(room)) return null;
  if (x === stage.dialX || !isOnDial(dial, x)) return null;
  if (x < stage.dialOpen.min || x > stage.dialOpen.max) return null;
  const events: RoomEvent[] = [{ type: 'DialNotch', x }];
  const level = isLevel(sideValues(stage.pans, q.rational(x)));
  if (level) {
    events.push({ type: 'PansLevel', roomId: room.spec.id, stage: room.stageIndex, x });
  }
  const touched = touchMachine(room)?.room.stage ?? stage;
  // Story 1.15: his dial at its maximum without levelling the pans offers the tray.
  const maxed = x === dial.max && !level && !touched.balance.dialMaxed;
  const balance = maxed ? { ...touched.balance, dialMaxed: true } : touched.balance;
  return { room: { ...room, stage: { ...touched, dialX: x, actingOut: false, balance } }, events };
}
