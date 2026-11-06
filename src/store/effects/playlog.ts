// The play log (story 2.11; architecture, Pattern 4): rooms entered, finished and reset,
// ways used, predictions and wrong lines go into `matematika:log`, with a session mark after
// 30 minutes of nothing. Hints are never logged. Nothing is written on the loading screen.

import { logEntriesOf } from '@/playlog/log';
import type { LogStorage } from '@/save/log-storage';
import type { Effect } from '@/store/effects/types';

export function createPlayLogEffect(
  storage: LogStorage,
  now: () => string = () => new Date().toISOString(),
): Effect {
  let lastAt: string | null | undefined;
  return (event, state) => {
    if (state.ui.screen === 'loading') return;
    if (lastAt === undefined) lastAt = storage.read().at(-1)?.at ?? null;
    const at = now();
    const entries = logEntriesOf(event, at, lastAt);
    if (entries.length === 0) return;
    storage.append(entries);
    lastAt = at;
  };
}
