// Types for quiet-zone.mjs, so scripts/art-tools.test.ts can import it.

import type { Rect } from '../../src/art/scene-zones';

export interface ZoneCheck {
  name: string;
  zone: Rect;
  busyCell: number;
  busyShare: number;
  inkShare: number;
}

export const CHECKS: Readonly<Record<'backdrop' | 'housing', readonly ZoneCheck[]>>;

export function measureZone(
  rgb: Uint8Array,
  zone: Rect,
  busyCell: number,
): { inkShare: number; busy: Rect[]; cells: number };
