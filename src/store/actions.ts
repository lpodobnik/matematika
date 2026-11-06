// Every action the store accepts, named `domain/verb` (architecture, Naming Conventions).

import type { Token } from '@/math/tokens';
import type { PresentationView } from '@/room/phases';
import type { RoomId } from '@/room/types';
import type { QualityAction } from '@/store/quality';

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
  /** A pad key (or its keyboard stand-in) typed at the end of the draft line. */
  | { type: 'notebook/type'; token: Token }
  /** Delete: the draft's last token. */
  | { type: 'notebook/delete' }
  /** Enter: the draft is judged. */
  | { type: 'notebook/enter' }
  /** On a phone, the notebook slides over the scale; this pushes it aside or brings it back. */
  | { type: 'notebook/slide'; aside: boolean }
  /** The frame-time test's report, and the dev panel's forced setting (store/quality.ts). */
  | QualityAction;
