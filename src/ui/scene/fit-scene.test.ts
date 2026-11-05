import { describe, expect, it } from 'vitest';
import { fitScene, sceneSize } from '@/ui/scene/fit-scene';

describe('fitScene', () => {
  it('uses a 1600 × 1000 logical scene', () => {
    expect(sceneSize).toEqual({ width: 1600, height: 1000 });
  });

  it('fills an area of the same shape exactly', () => {
    expect(fitScene(800, 500)).toEqual({ scale: 0.5, x: 0, y: 0 });
  });

  it('centres the scene in a tall area (tablet beside the notebook)', () => {
    const fit = fitScene(860, 800);
    expect(fit.scale).toBeCloseTo(0.5375);
    expect(fit.x).toBeCloseTo(0);
    expect(fit.y).toBeCloseTo((800 - 1000 * 0.5375) / 2);
  });

  it('centres the scene in a wide area', () => {
    expect(fitScene(2000, 500)).toEqual({ scale: 0.5, x: 600, y: 0 });
  });

  it('scales up on a large screen', () => {
    expect(fitScene(3200, 2000).scale).toBe(2);
  });

  it('collapses safely when the area has no size yet', () => {
    expect(fitScene(0, 0)).toEqual({ scale: 0, x: 0, y: 0 });
    expect(fitScene(Number.NaN, -5)).toEqual({ scale: 0, x: 0, y: 0 });
  });
});
