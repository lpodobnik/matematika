// What of the hunt he has reached, as the marks that open ways, show people and change what
// they say (content/town.ts): the beats, rule guards, leads and knots done, the gate and the map.

import type { HuntSave } from '@/hunt/types';

/** Every mark he has reached, in no particular order. */
export function reachedMarks(hunt: HuntSave): string[] {
  return [
    ...hunt.beats,
    ...hunt.guards,
    ...hunt.leadsDone,
    ...hunt.knotsDone,
    ...(hunt.gateOpened ? ['gate'] : []),
    ...(hunt.beats.includes('map-given') ? ['map'] : []),
  ];
}
