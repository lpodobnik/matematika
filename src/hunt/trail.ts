// Which leads are open, and the black thread (GDD, Structure, and Exploration and the trail map;
// architecture, Pattern 7). All of it is derived from the save, or deterministic from it.

import type { KnotId, LeadId } from '@/hunt/ids';
import type { HuntSave, ThreadState } from '@/hunt/types';

export type TrailId = LeadId | KnotId;

/** The order of the chapter: within an act, leads can be done in any order, but for these. */
export const acts: readonly {
  /** It opens the act: nothing else opens until it's done. */
  first?: TrailId;
  leads: readonly LeadId[];
  /** Done last in the act, as its climax. */
  last?: LeadId;
  /** Ties the act off. */
  knot?: KnotId;
}[] = [
  { leads: ['l01', 'l02', 'l03', 'l04'], knot: 'k1' },
  { first: 'w1', leads: ['l05', 'l06', 'l07', 'l08'], knot: 'k2' },
  { leads: ['l09', 'l10'], last: 'l11', knot: 'k3' },
  { first: 'l12', leads: ['l13', 'l14', 'l15'] },
  { leads: ['l16'] },
];

type Progress = Pick<HuntSave, 'leadsDone' | 'knotsDone' | 'beats'>;

const isDone = (progress: Progress, id: TrailId) =>
  (progress.leadsDone as readonly string[]).includes(id) ||
  (progress.knotsDone as readonly string[]).includes(id);

/** Everything in an act is done, knot included. */
function actDone(progress: Progress, act: (typeof acts)[number]): boolean {
  const all: TrailId[] = [
    ...(act.first ? [act.first] : []),
    ...act.leads,
    ...(act.last ? [act.last] : []),
    ...(act.knot ? [act.knot] : []),
  ];
  return all.every((id) => isDone(progress, id));
}

/** The act he's in: the first that isn't finished. */
export function currentAct(progress: Progress): number {
  const at = acts.findIndex((act) => !actDone(progress, act));
  return at < 0 ? acts.length : at;
}

/** What's open now: not done, and with whatever has to come first done. */
export function openTrail(progress: Progress): TrailId[] {
  if (!progress.beats.includes('map-given')) return [];
  const act = acts[currentAct(progress)];
  if (!act) return [];
  if (act.first && !isDone(progress, act.first)) return [act.first];
  const leads = act.leads.filter((lead) => !isDone(progress, lead));
  if (leads.length > 0) return leads;
  if (act.last && !isDone(progress, act.last)) return [act.last];
  return act.knot && !isDone(progress, act.knot) ? [act.knot] : [];
}

/** The act a lead belongs to. */
export function actOf(id: TrailId): number {
  return acts.findIndex(
    (act) =>
      act.first === id ||
      act.last === id ||
      act.knot === id ||
      (act.leads as readonly string[]).includes(id),
  );
}

/**
 * The black thread: deterministic, from this list, with no timer. It reaches a lead he hasn't
 * started twice: after the second lead he finishes in Act 2, and after the first in Act 3. The map
 * shows beforehand which one. It never reaches the coat, and it can't read his map after it.
 */
export const threadRoutes: readonly { act: number; after: number; targets: readonly LeadId[] }[] = [
  { act: 1, after: 2, targets: ['l08', 'l07', 'l05', 'l06'] },
  { act: 2, after: 1, targets: ['l10', 'l09'] },
];

type ThreadFacts = Pick<HuntSave, 'leadsDone' | 'leadsStarted' | 'sealed' | 'beats' | 'knotsDone'>;

/** The lead the thread is heading for now, if it's heading anywhere. */
export function threadTarget(hunt: ThreadFacts): LeadId | null {
  if (hunt.beats.includes('coat')) return null;
  const route = threadRoutes.find((candidate) => candidate.act === currentAct(hunt));
  if (!route) return null;
  if (route.targets.some((lead) => hunt.sealed.includes(lead))) return null;
  return (
    route.targets.find(
      (lead) => !hunt.leadsStarted.includes(lead) && !hunt.leadsDone.includes(lead),
    ) ?? null
  );
}

/** A lead has finished: the thread may reach what it was heading for, and seal it. */
export function threadAfterLead(
  hunt: ThreadFacts & { thread: ThreadState },
  finished: TrailId,
): { thread: ThreadState; sealed: readonly LeadId[] } {
  const act = actOf(finished);
  const route = threadRoutes.find((candidate) => candidate.act === act);
  const inRoute = route?.targets.includes(finished as LeadId) ?? false;
  const counted = inRoute ? hunt.thread.finishedSince + 1 : hunt.thread.finishedSince;
  if (!route || hunt.beats.includes('coat') || counted < route.after) {
    return { thread: { target: threadTarget(hunt), finishedSince: counted }, sealed: hunt.sealed };
  }
  const target = threadTarget(hunt);
  if (!target) return { thread: { target: null, finishedSince: 0 }, sealed: hunt.sealed };
  return { thread: { target: null, finishedSince: 0 }, sealed: [...hunt.sealed, target] };
}
