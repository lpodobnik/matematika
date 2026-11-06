// Reading a save back (story 2.1). Lenient on purpose: every field is checked, and one that
// is missing or doesn't fit takes its default, so a save keeps the rest of his progress
// rather than being thrown away for one odd field, and fields that later stories add need
// no new version. Only a value that isn't a save at all is refused (save/storage.ts keeps
// it aside). The save is his own device's, but it is still read as untrusted JSON: nothing
// here throws.

import { cleanName, isLookId } from '@/city/character';
import { LAIR_ORDER } from '@/content/lairs';
import { rooms } from '@/content/rooms';
import { createEconomy } from '@/economy/parts';
import type { Economy } from '@/economy/types';
import { UPGRADE_IDS } from '@/economy/upgrades';
import type { LairId } from '@/fight/types';
import { ideasByRoom } from '@/room/ideas';
import { isRoomId, type SavedLine, type SavedRoom } from '@/room/resume';
import {
  type FirstUseId,
  handoverIds,
  type IdeaId,
  ideaIds,
  type PinValue,
  type ToolId,
  toolIds,
  wayIds,
} from '@/room/types';
import {
  type Character,
  currentVersion,
  type QualityPick,
  qualityPicks,
  type SaveV1,
  type Settings,
} from '@/save/schema';

type Json = Record<string, unknown>;

/**
 * The most lines a saved stage keeps, far past play: every Balance move in room 4 writes
 * two lines, and exploring the scale can make dozens (story 2.1 review).
 */
const maxSavedLines = 5000;
/** The longest saved line, in pad characters. */
const maxLineLength = 200;

export function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

/** The strings of an array that are in `known`, each once, in order. */
function known<T extends string>(value: unknown, isKnown: (item: string) => item is T): T[] {
  if (!Array.isArray(value)) return [];
  const items = value.filter((item): item is string => typeof item === 'string');
  return [...new Set(items.filter(isKnown))];
}

function inList<T extends string>(list: readonly T[]): (item: string) => item is T {
  const set: ReadonlySet<string> = new Set(list);
  return (item): item is T => set.has(item);
}

const firstUseIds: readonly FirstUseId[] = [
  'pin',
  'tray',
  'splitter',
  ...handoverIds.map((id): FirstUseId => `handover-${id}`),
];

const isTool = inList<ToolId>(toolIds);
const isFirstUse = inList<FirstUseId>(firstUseIds);
const isIdea = inList<IdeaId>(ideaIds);
const isUpgrade = inList(UPGRADE_IDS);
const isLair = inList<LairId>(LAIR_ORDER);
const isQuality = inList<QualityPick>(qualityPicks);
const isSource = inList<SavedLine['source']>(['typed', ...wayIds]);
/** A paid prediction's key: room and stage, `r03:0` (economy/predictions.ts). */
const predictionKey = /^r\d\d:\d+$/;

function decodeEconomy(value: unknown): Economy {
  const economy = createEconomy();
  if (!isObject(value)) return economy;
  const paid = Array.isArray(value.paidPredictions) ? value.paidPredictions : [];
  const piles: Economy['piles'] = {};
  const lairs: Economy['lairs'] = {};
  if (isObject(value.piles)) {
    for (const [lair, parts] of Object.entries(value.piles)) {
      if (isLair(lair) && count(parts) > 0) piles[lair] = count(parts);
    }
  }
  if (isObject(value.lairs)) {
    for (const [lair, state] of Object.entries(value.lairs)) {
      if (isLair(lair) && isObject(state) && typeof state.rewindsAt === 'string') {
        lairs[lair] = { rewindsAt: state.rewindsAt };
      }
    }
  }
  return {
    parts: count(value.parts),
    upgrades: known(value.upgrades, isUpgrade),
    paidPredictions: [
      ...new Set(
        paid.filter((key): key is string => typeof key === 'string' && predictionKey.test(key)),
      ),
    ],
    piles,
    lairs,
  };
}

function decodePin(value: unknown): PinValue | null {
  if (!isObject(value)) return null;
  const { kind } = value;
  if (kind === 'x') {
    const { x } = value;
    return typeof x === 'number' && Number.isInteger(x) ? { kind, x } : null;
  }
  if (kind === 'line' || kind === 'choice' || kind === 'bucket') {
    const { index } = value;
    return typeof index === 'number' && Number.isInteger(index) && index >= 0
      ? { kind, index }
      : null;
  }
  return null;
}

function decodeLine(value: unknown): SavedLine | null {
  if (!isObject(value)) return null;
  const { text, source, progress } = value;
  if (typeof text !== 'string' || text.length === 0 || text.length > maxLineLength) return null;
  if (typeof source !== 'string' || !isSource(source) || typeof progress !== 'boolean') {
    return null;
  }
  return { text, source, progress };
}

/**
 * The room in progress, or null when there is none or it doesn't fit: a room that isn't
 * authored, a stage that isn't a whole number, or a line that isn't a line. A pin that
 * doesn't read is dropped with the room, since its lines were written after it.
 */
function decodeRoom(value: unknown): SavedRoom | null {
  if (!isObject(value)) return null;
  const { id, stage, lines, pin, splitterSeen } = value;
  if (typeof id !== 'string' || !isRoomId(id)) return null;
  if (typeof stage !== 'number' || !Number.isInteger(stage) || stage < 0) return null;
  if (!Array.isArray(lines) || lines.length > maxSavedLines) return null;
  const decoded = lines.map(decodeLine);
  if (decoded.some((line) => line === null)) return null;
  const pinValue = pin === null || pin === undefined ? null : decodePin(pin);
  if (pin !== null && pin !== undefined && pinValue === null) return null;
  return {
    id,
    stage,
    lines: decoded as SavedLine[],
    pin: pinValue,
    splitterSeen: splitterSeen === true,
  };
}

/** Rooms left halfway: each that reads, once per room, the first kept. */
function decodeStarted(value: unknown): SavedRoom[] {
  if (!Array.isArray(value)) return [];
  const rooms = value.slice(0, 50).flatMap((room) => decodeRoom(room) ?? []);
  return rooms.filter((room, i) => rooms.findIndex((other) => other.id === room.id) === i);
}

function decodeCharacter(value: unknown): Character {
  if (!isObject(value)) return { name: null, look: null };
  const name = typeof value.name === 'string' ? cleanName(value.name) : null;
  return { name, look: isLookId(value.look) ? value.look : null };
}

/**
 * A save from before story 2.6 has no `ideasSeen`: the ideas of the rooms it has told
 * count as seen, as they would have been on their cards, so the log shows them.
 */
function toldIdeas(told: readonly string[]): IdeaId[] {
  const all = rooms.flatMap((room) => room.ideas ?? []);
  return [...ideasByRoom(told, all, rooms).values()].flat();
}

function decodeSettings(value: unknown): Settings {
  if (!isObject(value)) return { muted: false, quality: null };
  const { muted, quality } = value;
  return {
    muted: muted === true,
    quality: typeof quality === 'string' && isQuality(quality) ? quality : null,
  };
}

/**
 * A save of the current version, from JSON already migrated to it: every field checked,
 * and defaulted when it is missing or doesn't fit. `createdAt` defaults to `now` (ISO
 * 8601). Null only when the value isn't an object.
 */
export function decodeSave(value: unknown, now: string): SaveV1 | null {
  if (!isObject(value)) return null;
  const progress = isObject(value.progress) ? value.progress : {};
  return {
    v: currentVersion,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    character: decodeCharacter(value.character),
    progress: {
      roomsDone: known(progress.roomsDone, isRoomId),
      tools: known(progress.tools, isTool),
      firstUse: known(progress.firstUse, isFirstUse),
      room: decodeRoom(progress.room),
      started: decodeStarted(progress.started),
      onMap: progress.onMap === true,
      told: known(progress.told, isRoomId),
      ideasSeen: Array.isArray(progress.ideasSeen)
        ? known(progress.ideasSeen, isIdea)
        : toldIdeas(known(progress.told, isRoomId)),
    },
    economy: decodeEconomy(value.economy),
    settings: decodeSettings(value.settings),
  };
}
