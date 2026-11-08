// Part 2's ids (architecture, Pattern 6). They are stored in saves, so they stay stable even
// when a label changes, and are never renamed or reused.

export const leadIds = [
  'l01',
  'l02',
  'l03',
  'l04',
  'l05',
  'l06',
  'l07',
  'l08',
  'l09',
  'l10',
  'l11',
  'l12',
  'l13',
  'l14',
  'l15',
  'l16',
] as const;
export type LeadId = (typeof leadIds)[number];

export const knotIds = ['k1', 'k2', 'k3'] as const;
export type KnotId = (typeof knotIds)[number];

export const ruleGuardIds = ['rule-1', 'rule-2', 'rule-3', 'rule-4'] as const;
export type RuleGuardId = (typeof ruleGuardIds)[number];

export const huntStreetIds = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'] as const;
export type HuntStreetId = (typeof huntStreetIds)[number];

export const gearIds = ['hook', 'lamp', 'magnet', 'long-hook'] as const;
export type GearId = (typeof gearIds)[number];

export const lookPieceIds = [
  'paint-brass',
  'paint-red',
  'paint-blue',
  'hat-cap',
  'hat-top',
  'hat-chef',
] as const;
export type LookPieceId = (typeof lookPieceIds)[number];

export const secretIds = [
  'secret-1',
  'secret-2',
  'secret-3',
  'secret-4',
  'secret-5',
  'secret-6',
  'secret-7',
  'secret-8',
] as const;
export type SecretId = (typeof secretIds)[number];

/** The story's fixed moments, each played once. */
export const beatIds = [
  'foundry',
  'named',
  'map-given',
  'hook-given',
  'wandered',
  'found',
  'warned',
  'coat',
  'real-vucetic',
  'near-miss',
] as const;
export type BeatId = (typeof beatIds)[number];

/** What in the hunt can open a way or change what someone says: a lead, a knot, or a moment. */
export type HuntMark = 'gate' | 'map' | LeadId | KnotId;

/** Whether a string is one of `list`, as a type guard, for filtering what a save holds. */
export function inList<T extends string>(list: readonly T[]): (item: string) => item is T {
  const set: ReadonlySet<string> = new Set(list);
  return (item): item is T => set.has(item);
}
