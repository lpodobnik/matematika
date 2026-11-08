// The leads as written so far (architecture, Pattern 6). A lead's id is stored in saves.

import { l01 } from '@/content/leads/l01-two-sides';
import type { LeadId } from '@/hunt/ids';
import type { LeadSpec } from '@/hunt/spec';

export const leadSpecs: Partial<Record<LeadId, LeadSpec>> = { l01 };

export const allLeadSpecs: readonly LeadSpec[] = Object.values(leadSpecs);
