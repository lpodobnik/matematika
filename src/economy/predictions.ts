// Paying for predictions (GDD, Prediction: a right call earns 2 bonus parts, paid when the
// result is known and once per stage, so resetting earns nothing; a wrong one loses
// nothing). Pure: the root reducer calls it for each right `PredictionMade` (story 1.14).

import { tuning } from '@/config/tuning';
import { earnParts } from './parts';
import type { Economy } from './types';

/** The key a stage's paid prediction is recorded under in `paidPredictions`: `"r03:0"`. */
export function predictionKey(roomId: string, stage: number): string {
  return `${roomId}:${stage}`;
}

/**
 * Pays `tuning.predictionParts` for a right prediction in a stage, once: the stage's key is
 * recorded, and a stage already paid earns nothing more. A wrong prediction changes nothing.
 */
export function payPrediction(economy: Economy, key: string, right: boolean): Economy {
  if (!right || economy.paidPredictions.includes(key)) return economy;
  const paid = earnParts(economy, tuning.predictionParts);
  return { ...paid, paidPredictions: [...economy.paidPredictions, key] };
}
