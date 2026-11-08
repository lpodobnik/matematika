import type { MapView, NodeView, RoadView } from '@/city/reach';
import { type AreaId, town } from '@/content/town';

/** A street on the map: its current machine's state, at the middle of its machines. */
export interface StreetView extends NodeView {
  area: AreaId;
}

/**
 * The map as he travels it: one place per street, not one per machine. Which machine it
 * stands for: the first not yet running that he can go to, else the first not yet running,
 * else the last. So a street with two machines shows as open until both run. A tap takes him
 * to the street (TownScreen). Roads run between streets, as the town's ways out do, and are
 * travelled once the way is open.
 */
export function streetsOf(view: MapView): { nodes: StreetView[]; roads: RoadView[] } {
  const byId = new Map(view.nodes.map((node) => [node.id, node]));
  const areas = Object.values(town.areas);
  const streets = areas.flatMap((area): StreetView[] => {
    const machines = area.places.flatMap((place) => {
      const node = byId.get(place.node);
      return node?.kind === 'room' ? [node] : [];
    });
    if (machines.length === 0) return [];
    const waiting = machines.filter((node) => node.state !== 'restored');
    const stands =
      waiting.find((node) => node.state === 'open') ?? waiting[0] ?? machines[machines.length - 1];
    if (!stands) return [];
    const x = machines.reduce((sum, node) => sum + node.x, 0) / machines.length;
    const y = machines.reduce((sum, node) => sum + node.y, 0) / machines.length;
    return [
      {
        ...stands,
        area: area.id,
        x,
        y,
        next: machines.some((node) => node.next),
        started: machines.some((node) => node.started),
        fresh: machines.some((node) => node.fresh),
      },
    ];
  });
  const at = new Map(streets.map((street) => [street.area, street]));
  const seen = new Set<string>();
  const roads = areas.flatMap((area) =>
    area.exits.flatMap((exit): RoadView[] => {
      const key = [area.id, exit.to].sort().join('-');
      const [from, to] = [at.get(area.id), at.get(exit.to)];
      if (seen.has(key) || !from || !to) return [];
      seen.add(key);
      const travelled = byId.get(exit.opensWith)?.state === 'restored';
      return [{ from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y }, travelled }];
    }),
  );
  return { nodes: streets, roads };
}
