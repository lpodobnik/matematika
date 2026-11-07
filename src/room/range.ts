// The range pin (story 4.6; GDD room 11: "x under 100, 100–300 or over 300"). Pure: what the
// notebook shows of it. The pin itself (its track, its places and whether it is right) is
// in room/pin.ts, as every pin's is; like room 7's line pin and room 10's story pin it is
// placed in the notebook, not in the scene.

import { stageSolution } from '@/math/check';
import { bucketOf } from '@/room/pin';
import { currentStageSpec, machineEquation } from '@/room/room';
import type { RoomState } from '@/room/types';

/** What the notebook shows of a range pin. Flat, for selectors. */
export interface RangeView {
  bounds: number[];
  /** Offered now: before it is confirmed, in poke or pin. */
  asks: boolean;
  /** The range it is on, or null in its holder. */
  at: number | null;
  confirmable: boolean;
  /** Once confirmed: the range x is in. */
  right: number | null;
}

/** The range pin as the notebook shows it, or null in a stage without one. */
export function rangeView(room: RoomState | null): RangeView | null {
  if (!room) return null;
  const spec = currentStageSpec(room);
  if (spec.pin?.kind !== 'range') return null;
  const { stage } = room;
  const offered =
    (stage.phase === 'poke' || stage.phase === 'pin') && !(stage.pin?.locked ?? false);
  const at = stage.pin?.value.kind === 'bucket' ? stage.pin.value.index : null;
  const solution = stageSolution(machineEquation(spec, stage.machine));
  return {
    bounds: [...spec.pin.bounds],
    asks: offered,
    at,
    confirmable: offered && stage.phase === 'pin' && at !== null,
    right: stage.pin?.locked ? bucketOf(spec.pin.bounds, solution) : null,
  };
}
