// Kristijan's caches (GDD, Exploration and the trail map: secrets): 8 chalk marks, 2 of them in
// the old streets, each reached only with a piece of gear bought from Faust. Each holds one of
// his papers, a sketch or a note, and parts. None holds anything the trail needs. Positions are
// in town units over each street's picture, 1600 × 1000, like content/town.ts.

import type { Point } from '@/city/walk';
import type { AreaId, Rect } from '@/content/town';
import type { HuntMark, SecretId } from '@/hunt/ids';

/** Which of Kristijan's sketches a cache holds (ui/town/art), or none for a note. */
export type SketchId = 'little' | 'cylinder' | 'key' | 'tongs';

export interface SecretSpec {
  id: SecretId;
  street: AreaId;
  /** The gear the little one needs to reach it. */
  needs: 'lamp' | 'magnet' | 'long-hook';
  /** What opens its street, so its mark shows only where he can already walk. */
  opensWith: HuntMark;
  /** The chalk mark: where it's drawn. */
  mark: Point;
  /** The tap area over what it points at. */
  area: Rect;
  /** Where he stands to send the little one. */
  stand: Point;
  sketch: SketchId | null;
}

export const secrets: readonly SecretSpec[] = [
  {
    // Gornja ulica: the dark doorway of the low house by the foundry.
    id: 'secret-1',
    street: 'u1',
    needs: 'lamp',
    opensWith: 'gate',
    mark: { x: 205, y: 590 },
    area: { x: 160, y: 520, w: 90, h: 160 },
    stand: { x: 270, y: 740 },
    sketch: 'little',
  },
  {
    // Arhivska ulica: the gap behind the stone post by the archive's door.
    id: 'secret-2',
    street: 'u2',
    needs: 'magnet',
    opensWith: 'map',
    mark: { x: 585, y: 430 },
    area: { x: 540, y: 380, w: 100, h: 110 },
    stand: { x: 610, y: 600 },
    sketch: null,
  },
  {
    // Novinska ulica: the iron bracket high on the wall above the strongbox.
    id: 'secret-3',
    street: 'u3',
    needs: 'long-hook',
    opensWith: 'k1',
    mark: { x: 612, y: 110 },
    area: { x: 560, y: 40, w: 110, h: 140 },
    stand: { x: 740, y: 545 },
    sketch: 'cylinder',
  },
  {
    // Dvorište: the dark little shed by the wall.
    id: 'secret-4',
    street: 'u4',
    needs: 'lamp',
    opensWith: 'k2',
    mark: { x: 335, y: 560 },
    area: { x: 260, y: 490, w: 115, h: 160 },
    stand: { x: 300, y: 692 },
    sketch: null,
  },
  {
    // Ulica brava: the round iron cover in the cobbles.
    id: 'secret-5',
    street: 'u5',
    needs: 'magnet',
    opensWith: 'k3',
    mark: { x: 350, y: 770 },
    area: { x: 300, y: 735, w: 100, h: 70 },
    stand: { x: 430, y: 820 },
    sketch: 'key',
  },
  {
    // Pusta ulica: the dark open door of the first boarded house.
    id: 'secret-6',
    street: 'u6',
    needs: 'lamp',
    opensWith: 'l12',
    mark: { x: 245, y: 330 },
    area: { x: 195, y: 190, w: 100, h: 290 },
    stand: { x: 370, y: 600 },
    sketch: null,
  },
  {
    // The canal, in the old district: the drain hole in the dry bed below the railing.
    id: 'secret-7',
    street: 'canal',
    needs: 'magnet',
    opensWith: 'gate',
    mark: { x: 1032, y: 760 },
    area: { x: 980, y: 730, w: 110, h: 80 },
    stand: { x: 880, y: 870 },
    sketch: null,
  },
  {
    // The hill, in the old district: a hook high on the clock tower.
    id: 'secret-8',
    street: 'hill',
    needs: 'long-hook',
    opensWith: 'gate',
    mark: { x: 1250, y: 110 },
    area: { x: 1190, y: 40, w: 120, h: 150 },
    stand: { x: 1100, y: 640 },
    sketch: 'tongs',
  },
];

/** The caches in a street. */
export function secretsIn(street: AreaId): SecretSpec[] {
  return secrets.filter((secret) => secret.street === street);
}

export function secretSpec(id: string): SecretSpec | undefined {
  return secrets.find((secret) => secret.id === id);
}
