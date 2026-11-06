import { describe, expect, it } from 'vitest';
import {
  createPuffs,
  maxStepMs,
  plumeBounds,
  puffLook,
  type SteamSpec,
  stepPuffs,
} from '@/ui/scene/effects/steam-sim';

const spec: SteamSpec = {
  origin: { x: 100, y: 200 },
  count: 10,
  lifeMs: 2000,
  rise: 30,
  drift: -10,
  spread: 5,
  startScale: 0.5,
  endScale: 1.5,
  alpha: 0.8,
  radius: 20,
};

/** A repeatable stand-in for Math.random. */
function seeded(seed = 1): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

describe('puffLook', () => {
  it('grows a puff from its start size to its end size', () => {
    expect(puffLook(0, spec).scale).toBe(0.5);
    expect(puffLook(0.5, spec).scale).toBeCloseTo(1);
    expect(puffLook(1, spec).scale).toBe(1.5);
  });

  it('fades a puff in quickly and out slowly, from nothing to nothing', () => {
    expect(puffLook(0, spec).alpha).toBe(0);
    expect(puffLook(0.15, spec).alpha).toBeCloseTo(0.8 * 0.85);
    expect(puffLook(1, spec).alpha).toBe(0);
    for (const t of [0.05, 0.3, 0.6, 0.95]) {
      const { alpha } = puffLook(t, spec);
      expect(alpha).toBeGreaterThan(0);
      expect(alpha).toBeLessThanOrEqual(spec.alpha);
    }
  });

  it('clamps outside a life', () => {
    expect(puffLook(-1, spec)).toEqual(puffLook(0, spec));
    expect(puffLook(2, spec)).toEqual(puffLook(1, spec));
  });
});

describe('createPuffs', () => {
  it('fills the plume at once, with ages spread over a life', () => {
    const puffs = createPuffs(spec, seeded());
    expect(puffs).toHaveLength(spec.count);
    const ages = puffs.map((puff) => puff.age);
    expect(ages[0]).toBe(0);
    expect(Math.max(...ages)).toBeLessThan(spec.lifeMs);
    expect(new Set(ages).size).toBe(spec.count);
  });

  it('places older puffs higher', () => {
    const puffs = createPuffs(spec, seeded());
    const ys = puffs.map((puff) => puff.y);
    expect([...ys].sort((a, b) => b - a)).toEqual(ys);
    expect(puffs[0]).toMatchObject({ x: 100, y: 200 });
  });

  it('gives each puff a sideways speed within the drift and its spread', () => {
    for (const puff of createPuffs({ ...spec, count: 200 }, seeded(7))) {
      expect(puff.vx).toBeGreaterThanOrEqual(spec.drift - spec.spread);
      expect(puff.vx).toBeLessThanOrEqual(spec.drift + spec.spread);
    }
  });
});

describe('stepPuffs', () => {
  it('lifts and drifts every puff, and ages it', () => {
    const puffs = createPuffs(spec, seeded());
    const before = puffs.map((puff) => ({ ...puff }));
    stepPuffs(puffs, 50, spec, seeded());
    puffs.forEach((puff, i) => {
      const was = before[i];
      if (!was) throw new Error('no puff');
      expect(puff.age).toBeCloseTo(was.age + 50);
      expect(puff.y).toBeCloseTo(was.y - spec.rise * 0.05);
      expect(puff.x).toBeCloseTo(was.x + was.vx * 0.05);
    });
  });

  it('starts a faded puff again at the vent, with a fresh sideways speed', () => {
    const puffs = createPuffs({ ...spec, count: 1 }, () => 0);
    stepPuffs(puffs, maxStepMs, spec, () => 0);
    const [puff] = puffs;
    if (!puff) throw new Error('no puff');
    puff.age = spec.lifeMs - 10;
    stepPuffs(puffs, 30, spec, () => 0.999);
    expect(puff.age).toBeCloseTo(20);
    expect(puff.vx).toBeCloseTo(spec.drift + spec.spread, 1);
    expect(puff.y).toBeCloseTo(spec.origin.y - spec.rise * 0.02);
  });

  it('never jumps more than one step after a stall, and ignores a step with no time', () => {
    const puffs = createPuffs(spec, seeded());
    const ages = puffs.map((puff) => puff.age);
    stepPuffs(puffs, 5000, spec, seeded());
    puffs.forEach((puff, i) => {
      expect(puff.age).toBeCloseTo(((ages[i] ?? 0) + maxStepMs) % spec.lifeMs);
    });
    const after = puffs.map((puff) => puff.age);
    stepPuffs(puffs, Number.NaN, spec, seeded());
    stepPuffs(puffs, -16, spec, seeded());
    expect(puffs.map((puff) => puff.age)).toEqual(after);
  });

  it('keeps every puff inside the plume’s bounds over many frames', () => {
    const random = seeded(3);
    const puffs = createPuffs(spec, random);
    const box = plumeBounds(spec);
    for (let frame = 0; frame < 600; frame += 1) {
      stepPuffs(puffs, 16.7, spec, random);
      for (const puff of puffs) {
        const reach = spec.radius * puff.scale;
        expect(puff.x - reach).toBeGreaterThanOrEqual(box.left - 1e-9);
        expect(puff.x + reach).toBeLessThanOrEqual(box.right + 1e-9);
        expect(puff.y - reach).toBeGreaterThanOrEqual(box.top - 1e-9);
        expect(puff.y + reach).toBeLessThanOrEqual(box.bottom + 1e-9);
      }
    }
  });
});

describe('plumeBounds', () => {
  it('reaches as far as a puff can rise and drift, at its full size', () => {
    expect(plumeBounds(spec)).toEqual({
      left: 100 - 15 * 2 - 30,
      right: 100 + 30,
      top: 200 - 30 * 2 - 30,
      bottom: 200 + 30,
    });
  });
});
