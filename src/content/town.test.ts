import { describe, expect, it } from 'vitest';
import { findPath, onGround } from '@/city/walk';
import { town } from '@/content/town';

const areas = Object.values(town.areas);

describe('the townspeople', () => {
  it.each(areas.flatMap((area) => area.people.map((person) => [area.id, person] as const)))(
    '%s: %o stands on the ground, and he can walk up to them',
    (areaId, person) => {
      const area = town.areas[areaId];
      expect(onGround(area.ground, person.at)).toBe(true);
      // TownScreen sends him to one side of them or the other.
      const sides = [-70, 70].map((dx) => ({ x: person.at.x + dx, y: person.at.y + 10 }));
      expect(sides.some((side) => findPath(area.ground, area.arrive, side) !== null)).toBe(true);
    },
  );

  it('someone asks for help in most streets before its machine is fixed', () => {
    const asking = areas.filter((area) =>
      area.places.some((place) => area.people.some((person) => person.changesWith === place.node)),
    );
    expect(asking.length).toBeGreaterThanOrEqual(areas.length - 1);
  });

  it('nobody is in two streets at once: each stay ends with the room the next begins with', () => {
    const stays = areas.flatMap((area) =>
      area.people.map((person) => ({ area: area.id, ...person })),
    );
    for (const id of new Set(stays.map((stay) => stay.id))) {
      const own = stays.filter((stay) => stay.id === id);
      // Walk the chain from the first stay; every stay must be on it, in order.
      let at = own.find((stay) => !own.some((other) => other.until === stay.after));
      const seen = [];
      while (at) {
        seen.push(at);
        const current = at;
        at = current.until ? own.find((stay) => stay.after === current.until) : undefined;
      }
      expect(seen.length, id).toBe(own.length);
    }
  });
});
