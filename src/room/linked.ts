// Linked machines (story 4.7; GDD, Linked machines: "one machine's answer becomes a weight
// in the next"; room 12, the junction). Pure. A room's machines are its stages, one after
// another: a stage `fed` by an earlier one has that stage's answer as a weight, in the
// place its `template` marks with ☐ (`3x + ☐ = 19` with room 12's first answer, 4, is
// `3x + 4 = 19`). The notebook shows the link: in the feeding stage, the next machine with
// its ☐ still empty; in the fed stage, the ☐ filled with the answer that came in. Content
// tests check that the template filled with the earlier stage's answer is the fed stage's
// equation, so the number is never typed in by hand.

import { stageSolution } from '@/math/check';
import { currentStageSpec, machineEquation } from '@/room/room';
import type { RoomState } from '@/room/types';

/** What the notebook shows of a linked machine. Flat, for selectors. */
export interface LinkedView {
  /** `feeds`: this stage's answer goes into the next; `fed`: it came in from an earlier one. */
  role: 'feeds' | 'fed';
  /** The fed machine's equation with its ☐: `3x + ☐ = 19`. */
  template: string;
  /** The answer that fills the ☐, once it is known (in the fed stage); else null. */
  value: number | null;
}

/** The link the stage in play takes part in, or null. */
export function linkedView(room: RoomState | null): LinkedView | null {
  if (!room) return null;
  const spec = currentStageSpec(room);
  if (spec.fed) {
    const from = room.spec.stages[spec.fed.from];
    if (!from) return null;
    return {
      role: 'fed',
      template: spec.fed.template,
      value: stageSolution(machineEquation(from, 0)),
    };
  }
  const next = room.spec.stages.find((stage) => stage.fed?.from === room.stageIndex);
  return next?.fed ? { role: 'feeds', template: next.fed.template, value: null } : null;
}
