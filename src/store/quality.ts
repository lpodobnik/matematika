// The quality setting (architecture, Performance): a 2-second frame-time test at start-up,
// timed once the scene has settled, picks `high`, `medium` or `low` from its 95th-percentile
// frame time. The scene times the frames and reports them; this decides. The result is held
// in memory and the test runs on every launch until epic 2 saves it in
// `save.settings.quality`. The dev panel can force a setting, which overrides the test's
// result until reload. Which effects each setting keeps is `art/quality.ts`.

import { tuning } from '@/config/tuning';

export type Quality = 'high' | 'medium' | 'low';

/** Best first: the order the dev panel offers them in. */
export const qualities: readonly Quality[] = ['high', 'medium', 'low'];

export interface QualityState {
  /** The frame-time test's pick, or null while it hasn't finished. */
  measured: Quality | null;
  /** The frame time the pick was made from, at `tuning.qualityPercentile`. */
  measuredMs: number | null;
  /** Forced from the dev panel; wins over the test's pick until reload. */
  forced: Quality | null;
}

export const initialQuality: QualityState = { measured: null, measuredMs: null, forced: null };

export type QualityAction =
  /** The frame-time test finished: every frame time it timed, in ms. */
  | { type: 'quality/measured'; frameTimesMs: readonly number[] }
  /** The dev panel forces a setting, or with null hands back to the test's pick. */
  | { type: 'quality/force'; quality: Quality | null };

/** The tuning numbers the pick reads; tests can bring their own. */
export interface QualityTuning {
  qualityPercentile: number;
  qualityHighMs: number;
  qualityMediumMs: number;
}

/**
 * The nearest-rank percentile (0 < p ≤ 100) of the finite, non-negative values, or null when
 * there are none.
 */
export function percentile(values: readonly number[], p: number): number | null {
  const sorted = values.filter((v) => Number.isFinite(v) && v >= 0).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const rank = Math.ceil((Math.min(Math.max(p, 0), 100) / 100) * sorted.length);
  return sorted[Math.max(rank, 1) - 1] ?? null;
}

/**
 * The setting for a test's frame times: up to `qualityHighMs` at the percentile is `high`,
 * up to `qualityMediumMs` `medium`, slower `low`. Null when there is nothing to judge.
 */
export function pickQuality(
  frameTimesMs: readonly number[],
  t: QualityTuning = tuning,
): { quality: Quality; ms: number } | null {
  const ms = percentile(frameTimesMs, t.qualityPercentile);
  if (ms === null) return null;
  if (ms <= t.qualityHighMs) return { quality: 'high', ms };
  if (ms <= t.qualityMediumMs) return { quality: 'medium', ms };
  return { quality: 'low', ms };
}

/**
 * The setting the scene uses now. While the test runs, every effect is on (`high`), so the
 * test times the full load; after it, a forced setting wins over the test's pick.
 */
export function qualityInUse(state: QualityState): Quality {
  if (state.measured === null) return 'high';
  return state.forced ?? state.measured;
}

/**
 * The test's report is taken once: a second report in the same launch (say, from a scene
 * remounted after a lost context) changes nothing. A report with nothing to judge is ignored,
 * so the test's pick stays pending.
 */
export function reduceQuality(state: QualityState, action: QualityAction): QualityState {
  switch (action.type) {
    case 'quality/measured': {
      if (state.measured !== null) return state;
      const pick = pickQuality(action.frameTimesMs);
      if (!pick) return state;
      return { ...state, measured: pick.quality, measuredMs: pick.ms };
    }
    case 'quality/force':
      return { ...state, forced: action.quality };
  }
}
