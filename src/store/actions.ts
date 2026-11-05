// Every action the store accepts, named `domain/verb` (architecture, Naming Conventions).

import type { RoomId } from '@/room/types';

export type Action =
  | { type: 'room/enter'; roomId: RoomId }
  /** The dial landed on a new notch; the UI sends it once per notch, never per frame. */
  | { type: 'dial/set'; x: number };
