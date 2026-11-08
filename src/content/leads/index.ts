// The leads as written so far (architecture, Pattern 6). A lead's id is stored in saves.

import { l01 } from '@/content/leads/l01-two-sides';
import { l03 } from '@/content/leads/l03-archive';
import { l04 } from '@/content/leads/l04-tram-line';
import { l06 } from '@/content/leads/l06-newspaper';
import { sealedBoard } from '@/content/leads/sealed-board';
import type { KnotId, LeadId } from '@/hunt/ids';
import type { LeadSpec } from '@/hunt/spec';

export const leadSpecs: Partial<Record<LeadId | KnotId, LeadSpec>> = { l01, l03, l04, l06 };

export const allLeadSpecs: readonly LeadSpec[] = Object.values(leadSpecs);

/**
 * A lead as it plays now: reached by the black thread, it's guarded, and gains one plain Sneak board
 * (GDD, Exploration and the trail map). A lead can only be sealed once, before it's started.
 */
export function playedSpec(id: LeadId | KnotId, sealed: readonly LeadId[]): LeadSpec | undefined {
  const spec = leadSpecs[id];
  if (!spec || !(sealed as readonly string[]).includes(id)) return spec;
  return { ...spec, scenes: [sealedBoard, ...spec.scenes] };
}
