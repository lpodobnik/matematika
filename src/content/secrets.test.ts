import { describe, expect, it } from 'vitest';
import { findPath, onGround } from '@/city/walk';
import { allLeadSpecs } from '@/content/leads';
import { secrets } from '@/content/secrets';
import { huntText } from '@/content/text/hunt';
import { town } from '@/content/town';
import { secretIds } from '@/hunt/ids';

const newStreets = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'];

describe("Kristijan's caches (GDD, Exploration: secrets)", () => {
  it('are eight, one for each id, two of them in the old streets', () => {
    expect(secrets.map((secret) => secret.id).sort()).toEqual([...secretIds].sort());
    const old = secrets.filter((secret) => !newStreets.includes(secret.street));
    expect(old).toHaveLength(2);
  });

  it('each need bought gear, never the free hook, and all three pieces are needed somewhere', () => {
    for (const secret of secrets) expect(['lamp', 'magnet', 'long-hook']).toContain(secret.needs);
    expect(new Set(secrets.map((secret) => secret.needs)).size).toBe(3);
  });

  it.each(secrets.map((secret) => [secret.id, secret] as const))(
    '%s: he stands on the ground and can walk up to it',
    (_id, secret) => {
      const area = town.areas[secret.street];
      expect(onGround(area.ground, secret.stand)).toBe(true);
      expect(findPath(area.ground, area.arrive, secret.stand)).not.toBeNull();
    },
  );

  it.each(secrets.map((secret) => [secret.id, secret] as const))(
    '%s: its chalk mark is inside its tap area, which is in the picture',
    (_id, secret) => {
      const { mark, area } = secret;
      expect(mark.x).toBeGreaterThanOrEqual(area.x);
      expect(mark.x).toBeLessThanOrEqual(area.x + area.w);
      expect(mark.y).toBeGreaterThanOrEqual(area.y);
      expect(mark.y).toBeLessThanOrEqual(area.y + area.h);
      expect(area.x).toBeGreaterThanOrEqual(0);
      expect(area.y).toBeGreaterThanOrEqual(0);
      expect(area.x + area.w).toBeLessThanOrEqual(town.width);
      expect(area.y + area.h).toBeLessThanOrEqual(town.height);
    },
  );

  it("never sit on a lead's spot, so a tap means one thing", () => {
    for (const secret of secrets) {
      for (const spot of town.areas[secret.street].spots ?? []) {
        const a = secret.area;
        const b = spot.area;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${secret.id} and ${spot.lead}`).toBe(false);
      }
    }
  });

  it('each hold a paper with a title and a line', () => {
    for (const secret of secrets) {
      const paper = huntText.growth.secrets.papers[secret.id];
      expect(paper.title.length).toBeGreaterThan(0);
      expect(paper.line.length).toBeGreaterThan(0);
    }
  });

  it('half hold sketches, each a different one', () => {
    const sketches = secrets.flatMap((secret) => (secret.sketch ? [secret.sketch] : []));
    expect(sketches).toHaveLength(4);
    expect(new Set(sketches).size).toBe(4);
  });
});

describe('bought gear never opens the way forward (GDD, The little one: gear)', () => {
  it('no lead, knot or corrected street mentions the gear Faust sells', () => {
    for (const spec of allLeadSpecs) {
      const json = JSON.stringify(spec);
      for (const gear of ['"lamp"', '"magnet"', '"long-hook"']) {
        expect(json.includes(gear), `${spec.id} mentions ${gear}`).toBe(false);
      }
    }
  });
});
