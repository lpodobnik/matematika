// Part 2's fields of the save (story 7.2). As everywhere in decoding, a field that is missing or
// doesn't fit takes its default, and an id this build doesn't know is dropped.

import {
  beatIds,
  gearIds,
  huntStreetIds,
  inList,
  knotIds,
  leadIds,
  lookPieceIds,
  ruleGuardIds,
  secretIds,
} from '@/hunt/ids';
import {
  type CompanionSave,
  type HuntSave,
  newHunt,
  type PageLine,
  type SavedScene,
  type TaughtEntry,
} from '@/hunt/types';

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function known<T extends string>(value: unknown, isKnown: (item: string) => item is T): T[] {
  if (!Array.isArray(value)) return [];
  const items = value.filter((item): item is string => typeof item === 'string');
  return [...new Set(items.filter(isKnown))];
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const isLead = inList(leadIds);
const isKnot = inList(knotIds);
const isLeadOrKnot = (id: string): id is (typeof leadIds)[number] | (typeof knotIds)[number] =>
  isLead(id) || isKnot(id);

function decodePages(value: unknown): HuntSave['pages'] {
  if (!isObject(value)) return {};
  const pages: HuntSave['pages'] = {};
  for (const [id, lines] of Object.entries(value)) {
    if (!isLeadOrKnot(id) || !Array.isArray(lines)) continue;
    pages[id] = lines.flatMap((line): PageLine[] => {
      if (!isObject(line) || typeof line.text !== 'string') return [];
      const kind = line.kind === 'clue' || line.kind === 'working' ? line.kind : 'his';
      return [{ text: line.text, kind, struck: line.struck === true }];
    });
  }
  return pages;
}

function decodeFirstTries(value: unknown): HuntSave['firstTries'] {
  if (!isObject(value)) return {};
  const tries: HuntSave['firstTries'] = {};
  for (const [id, first] of Object.entries(value)) {
    if (isLeadOrKnot(id) && typeof first === 'boolean') tries[id] = first;
  }
  return tries;
}

function decodeScene(value: unknown): SavedScene | null {
  if (!isObject(value) || typeof value.of !== 'string') return null;
  const { of } = value;
  if (of !== 'gate' && !isLeadOrKnot(of)) return null;
  const index = typeof value.index === 'number' && value.index >= 0 ? value.index : 0;
  return { of, index, state: value.state ?? null };
}

export function decodeHunt(value: unknown): HuntSave {
  const empty = newHunt();
  if (!isObject(value)) return empty;
  const thread = isObject(value.thread) ? value.thread : {};
  const target = typeof thread.target === 'string' && isLead(thread.target) ? thread.target : null;
  const since = thread.finishedSince;
  return {
    gateOpened: value.gateOpened === true,
    leadsStarted: known(value.leadsStarted, isLead),
    leadsDone: known(value.leadsDone, isLead),
    knotsDone: known(value.knotsDone, isKnot),
    sealed: known(value.sealed, isLead),
    thread: {
      target,
      finishedSince: typeof since === 'number' && Number.isInteger(since) && since >= 0 ? since : 0,
    },
    corrected: known(value.corrected, inList(huntStreetIds)),
    secrets: known(value.secrets, inList(secretIds)),
    guards: known(value.guards, inList(ruleGuardIds)),
    paid: [...new Set(strings(value.paid))],
    beats: known(value.beats, inList(beatIds)),
    forged: value.forged === 'struck' || value.forged === 'followed' ? value.forged : 'open',
    pages: decodePages(value.pages),
    firstTries: decodeFirstTries(value.firstTries),
    told: strings(value.told),
    scene: decodeScene(value.scene),
  };
}

function decodeTaught(value: unknown): TaughtEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): TaughtEntry[] => {
    if (!isObject(entry) || typeof entry.lead !== 'string' || !isLead(entry.lead)) return [];
    if (typeof entry.mistake !== 'string' || typeof entry.line !== 'string') return [];
    if (typeof entry.at !== 'string') return [];
    return [{ lead: entry.lead, mistake: entry.mistake, line: entry.line, at: entry.at }];
  });
}

export function decodeCompanion(value: unknown): CompanionSave | null {
  if (!isObject(value)) return null;
  return {
    name: typeof value.name === 'string' && value.name.length > 0 ? value.name : null,
    looks: known(value.looks, inList(lookPieceIds)),
    wearing: known(value.wearing, inList(lookPieceIds)),
    gear: known(value.gear, inList(gearIds)),
    taught: decodeTaught(value.taught),
  };
}
