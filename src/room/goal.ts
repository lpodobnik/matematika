// The goal card (story 1.16; GDD, Player Assistance): in a stage where the tray is offered,
// a small paper card in the scene shows what Balance aims for, "x alone": one x-gear by
// itself on one pan, a weight marked `?` on the other. Pure: when the card stands in the
// scene, and when the pans match its picture, so it lights. The scene draws it
// (ui/scene/scale/GoalCard.tsx) and its label is in hr.ts.
//
//   shown    while the tray is offered (room/tray.ts, `trayOffered`)
//   matched  the pans hold one x piece of count 1 (a small x-gear, not divided) on one side
//            and a single number piece, or nothing, on the other: `x = 9`, `9 = x`, by the
//            one rule for x alone (room/pieces.ts, `xAlone`). Not while the machine is
//            jammed on a wrong line, which the scale acts out instead

import { xAlone } from '@/room/pieces';
import { trayOffered } from '@/room/tray';
import type { RoomState, ToolId } from '@/room/types';

/** What the goal card shows. Flat, for selectors. */
export interface GoalView {
  /** The pans match the picture: the card's frame grows heavier, it shows a tick, and it lights. */
  matched: boolean;
}

/** The goal card of the stage in play, or null when it isn't in the scene (the tray isn't offered). */
export function goalView(room: RoomState | null, tools: readonly ToolId[]): GoalView | null {
  if (!room || !trayOffered(room, tools)) return null;
  return { matched: room.stage.jam === null && xAlone(room.stage.pans) };
}
