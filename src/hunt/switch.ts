// Part 2 stays off until Luka opens it (architecture, The gate and the switch): `main` deploys
// to his son's live save. `?dev` previews it, for that page load only, and is never saved.

import { tuning } from '@/config/tuning';

export function partTwoOn(preview: boolean): boolean {
  return tuning.part2.live || preview;
}
