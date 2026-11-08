// The leads as written so far (architecture, Pattern 6). A lead's id is stored in saves.

import { l01 } from '@/content/leads/l01-two-sides';
import { l03 } from '@/content/leads/l03-archive';
import { l04 } from '@/content/leads/l04-tram-line';
import { l06 } from '@/content/leads/l06-newspaper';
import type { LeadId } from '@/hunt/ids';
import type { LeadSpec } from '@/hunt/spec';

export const leadSpecs: Partial<Record<LeadId, LeadSpec>> = { l01, l03, l04, l06 };

export const allLeadSpecs: readonly LeadSpec[] = Object.values(leadSpecs);
