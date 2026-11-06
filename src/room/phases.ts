// A room from arrival to restart (architecture, Pattern 2):
//
//   arrive → poke (if a poke window) → pin (if a pin) → open → locked
//          → (the next stage's arrive) … → locked → restart → done
//
// - arrive   the stage waits, with no instruction screen, for his first touch anywhere on the
//            machine (`machine/touch`), then opens into its opening phase.
// - poke     the dial turns over its poke window only; pin: the pin is being placed, and the
//            dial still turns inside the poke window (room/pin.ts). Confirming the pin
//            opens the stage, and the machine tests the pin.
// - locked   the check line locked the stage (room/notebook.ts): part of the machine starts.
//            When the UI reports the presentation done, the next stage arrives, or on the
//            last stage the whole machine restarts.
// - restart  the whole machine runs; when the UI reports it done, the room is done, and the
//            store loads the next room.
// Both presentations end on `presentation/done`, or on the clock after
// `tuning.presentationTimeoutMs`, so a missed animation event never strands the game.
// Reset returns the stage in play to line 0, from any phase before locked.

import { tuning } from '@/config/tuning';
import type { RoomEvent } from '@/room/events';
import {
  arriveAtStage,
  currentStageSpec,
  fullDial,
  hasPin,
  pokeNotches,
  type RoomStep,
  stageArrived,
} from '@/room/room';
import type { Phase, RoomSpec, RoomState, StageSpec, StageState, ToolId } from '@/room/types';

/**
 * The phase a stage opens into after arrive, and that reset returns it to while its pin
 * isn't locked: `poke` with a poke window, `pin` with a pin but no poke window (so the
 * dial doesn't move before he pins), and `open` with no pin.
 */
export function openingPhase(stage: StageSpec): Phase {
  if (!hasPin(stage)) return 'open';
  return pokeNotches(stage) === null ? 'pin' : 'poke';
}

function withStage(room: RoomState, stage: StageState): RoomState {
  return { ...room, stage };
}

/**
 * His first touch on the machine ends arrive (`machine/touch`). Null, so the action is
 * ignored, in any other phase: every later touch is just a touch.
 */
export function touchMachine(room: RoomState): RoomStep | null {
  if (room.stage.phase !== 'arrive') return null;
  const phase = openingPhase(currentStageSpec(room));
  return { room: withStage(room, { ...room.stage, phase }), events: [] };
}

/** What the machine presents, and then reports done: a stage's lock, or the room's restart. */
export type Presentation = Extract<Phase, 'locked' | 'restart'>;

export function presentationOf(phase: Phase): Presentation | null {
  return phase === 'locked' || phase === 'restart' ? phase : null;
}

/** The presentation playing now, as `presentation/done` reports it, or null. Flat, for selectors. */
export interface PresentationView {
  roomId: RoomSpec['id'];
  stage: number;
  phase: Presentation;
}

export function presentationView(room: RoomState | null): PresentationView | null {
  if (!room) return null;
  const phase = presentationOf(room.stage.phase);
  return phase ? { roomId: room.spec.id, stage: room.stageIndex, phase } : null;
}

/** Whether the stage in play is the room's last. */
export function isLastStage(room: RoomState): boolean {
  return room.stageIndex >= room.spec.stages.length - 1;
}

/**
 * Ends the presentation playing now: after a lock, the next stage arrives (`StageArrived`),
 * or after the last stage's lock the whole machine restarts (`RoomRestarted`); after the
 * restart the room is done.
 */
function endPresentation(room: RoomState, now: number): RoomStep | null {
  const { stage } = room;
  if (stage.phase === 'locked') {
    const next = room.stageIndex + 1;
    const spec = room.spec.stages[next];
    if (spec) {
      return {
        room: { ...room, stageIndex: next, stage: arriveAtStage(spec) },
        events: [stageArrived(room.spec, next)],
      };
    }
    const events: RoomEvent[] = [{ type: 'RoomRestarted', roomId: room.spec.id }];
    return { room: withStage(room, { ...stage, phase: 'restart', presentedAt: now }), events };
  }
  if (stage.phase === 'restart') {
    return { room: withStage(room, { ...stage, phase: 'done', presentedAt: null }), events: [] };
  }
  return null;
}

/**
 * The UI finished presenting (`presentation/done`). Null, so the action is ignored, unless
 * the room, stage and phase it reports are the ones playing now: a report that arrives late,
 * after the clock already ended that presentation, changes nothing.
 */
export function finishPresentation(
  room: RoomState,
  done: PresentationView,
  now: number,
): RoomStep | null {
  const playing = presentationView(room);
  if (
    !playing ||
    playing.roomId !== done.roomId ||
    playing.stage !== done.stage ||
    playing.phase !== done.phase
  ) {
    return null;
  }
  return endPresentation(room, now);
}

/**
 * The clock (`clock/tick`, about once a second): a presentation that has played for
 * `tuning.presentationTimeoutMs` ends as if the UI had reported it done. One with no start
 * time yet, or a start time after now (the device's clock went back), starts counting now.
 * Null when nothing changes.
 */
export function tickClock(room: RoomState, now: number): RoomStep | null {
  const { stage } = room;
  if (presentationOf(stage.phase) === null) return null;
  if (stage.presentedAt === null || now < stage.presentedAt) {
    return { room: withStage(room, { ...stage, presentedAt: now }), events: [] };
  }
  if (now - stage.presentedAt < tuning.presentationTimeoutMs) return null;
  return endPresentation(room, now);
}

/**
 * The tool a step earns: the room's `earns` when its whole machine restarts
 * (`RoomRestarted`; GDD, Gating: room 3 earns Balance). Null for any other step.
 */
export function toolEarned(step: RoomStep): ToolId | null {
  const restarted = step.events.some((event) => event.type === 'RoomRestarted');
  return restarted ? step.room.spec.earns : null;
}

/**
 * The room that loads when this one is done: the next in play order (content/rooms), or
 * null after the last, and for a room that isn't in the list (a built or friend's room).
 */
export function nextRoom(list: readonly RoomSpec[], id: RoomSpec['id']): RoomSpec | null {
  const index = list.findIndex((room) => room.id === id);
  return index < 0 ? null : (list[index + 1] ?? null);
}

/**
 * Whether he has played every room in content: the last room in play order is done, its
 * restart over. The "to be continued" screen shows then (story 1.13), until the map takes
 * its place in epic 2. False for a room that isn't in the list (a built or friend's room).
 */
export function playedThrough(list: readonly RoomSpec[], room: RoomState): boolean {
  if (room.stage.phase !== 'done') return false;
  const index = list.findIndex((spec) => spec.id === room.spec.id);
  return index >= 0 && index === list.length - 1;
}

/** Phases from which reset works: any before the stage locks (Pattern 2, Reset). */
const resettingPhases: ReadonlySet<Phase> = new Set<Phase>(['arrive', 'poke', 'pin', 'open']);

export function resetWorks(phase: Phase): boolean {
  return resettingPhases.has(phase);
}

/**
 * Reset (`stage/reset`): the stage in play goes back to line 0, with its blanks to fill
 * again, the dial at its minimum, every machine of the stage at 0, and exploratory moves and
 * jams cleared; it opens at once, so a reset in arrive also ends arrive. A locked pin stays
 * as it is and isn't offered again: the stage returns to `open` with the dial's full range,
 * so he is never left with a short dial and no pin. A pin he hadn't confirmed goes back to
 * its holder, and the stage to its opening phase (`openingPhase`). Earlier stages stay
 * solved: the room stays at this stage. `jamsInARow` and `hintLevel` are kept, since only a
 * committed line resets the jam count (hints from epic 2), and so is `refused`, the
 * notebook's wiggle count; the tray keeps its numbers and the splitter its parts, which
 * are settings of the tools, not moves. A split jam clears, so the splitter is back in its
 * holder. Null, so the action is ignored, from locked on.
 */
export function resetStage(room: RoomState): RoomStep | null {
  const { stage } = room;
  if (!resetWorks(stage.phase)) return null;
  const spec = currentStageSpec(room);
  const pin = stage.pin?.locked ? stage.pin : null;
  const arrived = arriveAtStage(spec);
  const fresh: StageState = {
    ...arrived,
    phase: pin ? 'open' : openingPhase(spec),
    pin,
    dialOpen: pin ? fullDial(spec) : arrived.dialOpen,
    jamsInARow: stage.jamsInARow,
    refused: stage.refused,
    hintLevel: stage.hintLevel,
    tray: stage.tray,
    splitter: stage.splitter,
  };
  const events: RoomEvent[] = [
    { type: 'StageReset', roomId: room.spec.id, stage: room.stageIndex },
  ];
  return { room: withStage(room, fresh), events };
}
