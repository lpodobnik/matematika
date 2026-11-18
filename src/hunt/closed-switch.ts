// For tests only. Part 2 is open for players, but its switch can still be closed again, so the
// tests that check it shuts everything run with it closed for the length of one test.

import { tuning } from '@/config/tuning';

export function withPartTwoClosed<T>(run: () => T): T {
  const part2 = tuning.part2 as { live: boolean };
  const was = part2.live;
  part2.live = false;
  try {
    return run();
  } finally {
    part2.live = was;
  }
}
