// What the piece drag (piece-drag.ts) carries now, for React: it changes when a drag
// starts, is let go and settles, never per move, so a carry costs a few renders at most.

import { useSyncExternalStore } from 'react';
import type { Carry, PieceDrag } from '@/ui/scene/scale/piece-drag';

export function useCarry(drag: PieceDrag): Carry | null {
  return useSyncExternalStore(drag.subscribe, drag.carry, drag.carry);
}
