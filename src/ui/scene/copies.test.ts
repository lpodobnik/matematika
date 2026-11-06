import { describe, expect, it } from 'vitest';
import { copyPlacements } from '@/ui/scene/copies';
import { sceneSize } from '@/ui/scene/fit-scene';

describe('copyPlacements', () => {
  it('draws one copy as the scene itself', () => {
    expect(copyPlacements(1)).toEqual([{ x: 0, y: 0, scale: 1 }]);
  });

  it('puts three copies side by side at a third of the size, centred top to bottom', () => {
    const copies = copyPlacements(3);
    expect(copies).toHaveLength(3);
    for (const [index, copy] of copies.entries()) {
      expect(copy.scale).toBeCloseTo(1 / 3);
      expect(copy.x).toBeCloseTo((sceneSize.width / 3) * index);
      expect(copy.y).toBeCloseTo(sceneSize.height / 3);
    }
  });

  it('keeps every copy inside the scene, with no two overlapping', () => {
    const copies = copyPlacements(3);
    for (const copy of copies) {
      expect(copy.x).toBeGreaterThanOrEqual(0);
      expect(copy.y).toBeGreaterThanOrEqual(0);
      expect(copy.x + sceneSize.width * copy.scale).toBeLessThanOrEqual(sceneSize.width + 1e-9);
      expect(copy.y + sceneSize.height * copy.scale).toBeLessThanOrEqual(sceneSize.height + 1e-9);
    }
    for (let i = 1; i < copies.length; i += 1) {
      const left = copies[i - 1];
      const right = copies[i];
      if (!left || !right) throw new Error('missing copy');
      expect(right.x).toBeGreaterThanOrEqual(left.x + sceneSize.width * left.scale - 1e-9);
    }
  });

  it('falls back to one copy for a count that makes no sense', () => {
    for (const count of [0, -3, 1.5, Number.NaN]) {
      expect(copyPlacements(count)).toEqual([{ x: 0, y: 0, scale: 1 }]);
    }
  });
});
