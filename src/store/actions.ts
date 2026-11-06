// Every action the store accepts, named `domain/verb` (architecture, Naming Conventions).

import type { Token } from '@/math/tokens';
import type { PresentationView } from '@/room/phases';
import type { PinValue, RoomId, Side, ToolId, TrayKind } from '@/room/types';
import type { QualityAction } from '@/store/quality';
import type { SceneCopies } from '@/store/types';

export type Action =
  /** Enters a room at its first stage, or at `stage` (the dev panel jumps to any stage). */
  | { type: 'room/enter'; roomId: RoomId; stage?: number }
  /** A touch anywhere on the machine; the first one ends the stage's arrive. */
  | { type: 'machine/touch' }
  /** The reset control: the stage in play goes back to line 0. */
  | { type: 'stage/reset' }
  /** The machine finished presenting a stage's lock or the room's restart. */
  | ({ type: 'presentation/done' } & PresentationView)
  /** About once a second: ends a presentation the UI never reports done. */
  | { type: 'clock/tick' }
  /** The dial landed on a new notch; the UI sends it once per notch, never per frame. */
  | { type: 'dial/set'; x: number }
  /** He dragged the prediction pin onto a place of its track; once per place, never per frame. */
  | { type: 'pin/set'; value: PinValue }
  /** He confirmed the pin where it is: it locks and the stage opens. */
  | { type: 'pin/confirm' }
  /** The tray's − or + for its weight or float; the UI repeats it while the button is held. */
  | { type: 'tray/step'; kind: TrayKind; by: 1 | -1 }
  /** He dropped the tray's weight or float, with its number, on a pan. */
  | { type: 'tray/drop'; side: Side; kind: TrayKind }
  /** He dragged a weight or float off a pan into the tray; `key` is its key on the scale. */
  | { type: 'tray/take'; side: Side; key: string }
  /** The splitter's − or +: fewer or more parts; the UI repeats it while the button is held. */
  | { type: 'splitter/step'; by: 1 | -1 }
  /** He dragged the splitter, at the parts it is set to, across both pans. */
  | { type: 'splitter/split' }
  /** He dragged the splitter off the pans, after a split that jammed the machine. */
  | { type: 'splitter/lift' }
  /** A pad key (or its keyboard stand-in) typed at the end of the draft line. */
  | { type: 'notebook/type'; token: Token }
  /** Delete: the draft's last token. */
  | { type: 'notebook/delete' }
  /** Enter: the draft is judged. */
  | { type: 'notebook/enter' }
  /** On a phone, the notebook slides over the scale; this pushes it aside or brings it back. */
  | { type: 'notebook/slide'; aside: boolean }
  /** The dev panel only (architecture, Debug Tools): sets the tools he has earned. */
  | { type: 'dev/set-tools'; tools: ToolId[] }
  /** The dev panel only: draws the scene once, or three times side by side for the profile. */
  | { type: 'dev/set-copies'; copies: SceneCopies }
  /** The frame-time test's report, and the dev panel's forced setting (store/quality.ts). */
  | QualityAction;
