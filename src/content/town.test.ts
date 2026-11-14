import { describe, expect, it } from 'vitest';
import { roomOpen } from '@/city/reach';
import { findPath, onGround } from '@/city/walk';
import { allLeadSpecs } from '@/content/leads';
import { districtMap } from '@/content/map';
import { rooms } from '@/content/rooms';
import { town } from '@/content/town';
import { isRoomId } from '@/room/resume';

const areas = Object.values(town.areas);

describe('where leads start', () => {
  const spots = Object.values(town.areas).flatMap((area) =>
    (area.spots ?? []).map((spot) => [spot.lead, area, spot] as const),
  );

  it.each(spots)('%s stands on the ground, and he can walk up to it', (_lead, area, spot) => {
    expect(onGround(area.ground, spot.stand)).toBe(true);
    expect(findPath(area.ground, area.arrive, spot.stand)).not.toBeNull();
  });

  it('every lead has one place', () => {
    const leads = spots.map(([lead]) => lead);
    expect(new Set(leads).size).toBe(leads.length);
    expect([...leads].sort()).toEqual(allLeadSpecs.map((lead) => lead.id).sort());
  });
});

// The upper district's streets (part 2). The lower town's ways end at the picture's edge, off
// the cobbles, and he has walked them since part 1.
describe('the ways between the upper streets', () => {
  const ways = areas
    .filter((area) => area.id.startsWith('u'))
    .flatMap((area) => area.exits.map((exit) => [area.id, exit.to, area, exit] as const));

  it.each(ways)(
    '%s to %s: he can walk to it, and he arrives on the ground',
    (_from, to, area, exit) => {
      expect(onGround(area.ground, exit.stand)).toBe(true);
      expect(findPath(area.ground, area.arrive, exit.stand)).not.toBeNull();
      expect(onGround(town.areas[to].ground, exit.arrive)).toBe(true);
    },
  );

  it.each(ways.filter(([, to]) => to.startsWith('u')))(
    '%s to %s has a way back, open as soon as it is',
    (from, to, _area, exit) => {
      const back = town.areas[to].exits.find((way) => way.to === from);
      expect(back?.opensWith).toBe(exit.opensWith);
    },
  );
});

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

  // The tools rooms give (content/map.ts): Balance from room 3, the workshop from 6, the gear
  // chain from 7, the drum from 12.
  const gives: Record<string, string> = {
    r03: 'balance',
    r06: 'workshop',
    r07: 'chain',
    r12: 'drum',
  };
  const authored: string[] = rooms.map((room) => room.id);

  it.each(
    areas.flatMap((area) =>
      area.people
        .filter((person) => person.after !== person.changesWith && isRoomId(person.changesWith))
        .map((person) => [person.id, area.id, person] as const),
    ),
  )('%s in the %s asks only for a machine he can already reach', (_id, _area, person) => {
    // Played in order up to the room they come with.
    const done = authored.slice(0, authored.indexOf(person.after as string) + 1);
    const tools = done.flatMap((room) => (gives[room] ? [gives[room]] : []));
    expect(roomOpen(districtMap, person.changesWith, { done, tools, authored })).toBe(true);
  });

  it('someone asks for help in most streets before its machine is fixed', () => {
    const streets = areas.filter((area) => area.places.length > 0);
    const asking = streets.filter((area) =>
      area.places.some((place) => area.people.some((person) => person.changesWith === place.node)),
    );
    expect(asking.length).toBeGreaterThanOrEqual(streets.length - 1);
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
