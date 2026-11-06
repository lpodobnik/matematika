import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { createEconomy, earnParts } from './parts';
import { payPrediction, predictionKey } from './predictions';

describe('payPrediction (GDD, Prediction)', () => {
  it('keys a stage by its room and stage index', () => {
    expect(predictionKey('r03', 0)).toBe('r03:0');
    expect(predictionKey('r05', 1)).toBe('r05:1');
  });

  it('pays 2 parts for a right prediction and records the stage', () => {
    const paid = payPrediction(createEconomy(), 'r03:0', true);
    expect(tuning.predictionParts).toBe(2);
    expect(paid.parts).toBe(2);
    expect(paid.paidPredictions).toEqual(['r03:0']);
  });

  it('pays each stage once, so resetting and pinning again earns nothing', () => {
    const once = payPrediction(createEconomy(), 'r03:0', true);
    expect(payPrediction(once, 'r03:0', true)).toBe(once);
    const next = payPrediction(once, 'r03:1', true);
    expect(next.parts).toBe(4);
    expect(next.paidPredictions).toEqual(['r03:0', 'r03:1']);
  });

  it('changes nothing for a wrong prediction, and costs nothing', () => {
    const economy = earnParts(createEconomy(), 5);
    expect(payPrediction(economy, 'r03:0', false)).toBe(economy);
  });

  it('adds to the parts he already has, and leaves the rest of the economy alone', () => {
    const economy = { ...earnParts(createEconomy(), 7), upgrades: ['steam' as const] };
    const paid = payPrediction(economy, 'r04:0', true);
    expect(paid).toEqual({ ...economy, parts: 9, paidPredictions: ['r04:0'] });
    expect(economy.paidPredictions).toEqual([]);
  });
});
