// Every action the store accepts, named `domain/verb` (architecture, Naming Conventions).

import type { Token } from '@/math/tokens';
import type { RoomId } from '@/room/types';

export type Action =
  | { type: 'room/enter'; roomId: RoomId }
  /** The dial landed on a new notch; the UI sends it once per notch, never per frame. */
  | { type: 'dial/set'; x: number }
  /** A pad key (or its keyboard stand-in) typed at the end of the draft line. */
  | { type: 'notebook/type'; token: Token }
  /** Delete: the draft's last token. */
  | { type: 'notebook/delete' }
  /** Enter: the draft is judged. */
  | { type: 'notebook/enter' }
  /** On a phone, the notebook slides over the scale; this pushes it aside or brings it back. */
  | { type: 'notebook/slide'; aside: boolean };
