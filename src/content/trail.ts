// The trail map (architecture, Town, district and follower): where each lead's pin stands. All of
// it is drawn from `save.hunt`, so nothing here is saved. A lead joins here when it's written.

import type { LeadId } from '@/hunt/ids';

export interface TrailPin {
  lead: LeadId;
  /** Percent of the map's width and height. */
  x: number;
  y: number;
}

/** Where the red thread starts: the foundry, marked by Vučetić. */
export const trailStart = { x: 12, y: 78 };

export const trailPins: readonly TrailPin[] = [
  { lead: 'l01', x: 26, y: 58 },
  { lead: 'l03', x: 44, y: 34 },
  { lead: 'l04', x: 66, y: 46 },
  { lead: 'l06', x: 84, y: 22 },
];

/** The leads open now: written, not done. */
export function openLeads(done: readonly LeadId[]): LeadId[] {
  return trailPins.map((pin) => pin.lead).filter((lead) => !done.includes(lead));
}
