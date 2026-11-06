// First use (architecture, Pattern 2): the first time the game offers the pin, the tray or
// the splitter, it wiggles once (hint level 1, "the piece he can move wiggles"). What he
// has met is kept beside the room, in the store's progress, so a control wiggles in the
// first stage that offers it and never again, even after a reset. Saving it (epic 2) keeps
// it across sessions. The tray and the splitter need Balance, so it takes the tools he has
// earned; both are first offered in the same stage, so they wiggle together.

import { pinOffered } from '@/room/pin';
import { splitterOffered } from '@/room/splitter';
import { trayOffered } from '@/room/tray';
import type { FirstUseId, HintLevel, RoomState, ToolId } from '@/room/types';

/** The controls the stage offers now that have a first-use wiggle. */
export function offeredControls(room: RoomState, tools: readonly ToolId[] = []): FirstUseId[] {
  const offered: FirstUseId[] = [];
  if (pinOffered(room)) offered.push('pin');
  if (trayOffered(room, tools)) offered.push('tray');
  if (splitterOffered(room, tools)) offered.push('splitter');
  return offered;
}

export interface FirstUseStep {
  room: RoomState;
  /** Everything he has met, the new ones included. */
  met: FirstUseId[];
}

/**
 * Meets what the stage offers for the first time: the stage's hint level rises to 1, so
 * the new control wiggles once, and it counts as met from now on. Null when the stage
 * offers nothing new.
 */
export function meetControls(
  room: RoomState,
  met: readonly FirstUseId[],
  tools: readonly ToolId[] = [],
): FirstUseStep | null {
  const fresh = offeredControls(room, tools).filter((control) => !met.includes(control));
  if (fresh.length === 0) return null;
  const hintLevel = Math.max(1, room.stage.hintLevel) as HintLevel;
  return {
    room: { ...room, stage: { ...room.stage, hintLevel } },
    met: [...met, ...fresh],
  };
}
