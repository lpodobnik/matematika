// Part 2's switch (architecture, The gate and the switch): Luka opened it on 2026-11-18, and
// `main` deploys to his son's live save. `?dev` still turns it on, for that page load only.

import { tuning } from '@/config/tuning';

export function partTwoOn(preview: boolean): boolean {
  return tuning.part2.live || preview;
}
