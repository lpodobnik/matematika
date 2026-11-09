// The trail map (architecture, Town, district and follower): where each lead's pin stands. All of
// it is drawn from `save.hunt`, so nothing here is saved. A lead joins here when it's written.

import type { KnotId, LeadId } from '@/hunt/ids';

export interface TrailPin {
  lead: LeadId | KnotId;
  /** Percent of the map's width and height. */
  x: number;
  y: number;
}

/** Where the red thread starts: the foundry, marked by Vučetić. */
export const trailStart = { x: 12, y: 78 };

export const trailPins: readonly TrailPin[] = [
  { lead: 'l01', x: 22, y: 62 },
  { lead: 'l02', x: 34, y: 80 },
  { lead: 'l03', x: 14, y: 40 },
  { lead: 'l04', x: 40, y: 56 },
  { lead: 'k1', x: 30, y: 36 },
  { lead: 'w1', x: 48, y: 76 },
  { lead: 'l05', x: 44, y: 30 },
  { lead: 'l06', x: 58, y: 44 },
  { lead: 'l07', x: 60, y: 68 },
  { lead: 'l08', x: 34, y: 14 },
  { lead: 'k2', x: 52, y: 16 },
  { lead: 'l09', x: 68, y: 26 },
  { lead: 'l10', x: 74, y: 52 },
  { lead: 'l11', x: 72, y: 80 },
  { lead: 'k3', x: 82, y: 66 },
  { lead: 'l12', x: 66, y: 10 },
  { lead: 'l13', x: 82, y: 12 },
  { lead: 'l14', x: 88, y: 34 },
  { lead: 'l15', x: 90, y: 52 },
  { lead: 'l16', x: 92, y: 84 },
];
