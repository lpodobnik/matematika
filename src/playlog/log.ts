// The play log (story 2.11; architecture, Data Persistence and `PlayLogEvent`; GDD, Luka's
// view). Pure: what a domain event adds to the log, and the summaries Luka's view shows.
// The log is game data for Luka, kept on the device only; hints are never logged (GDD:
// free and never recorded), and it never holds his name.

import type { RoomId, WayId } from '@/room/types';

/** One entry in the log. `at` is ISO 8601. */
export type PlayLogEvent = { at: string } /** The first event after 30 minutes of nothing. */ & (
  | { type: 'session' }
  | { type: 'room'; roomId: RoomId; action: 'enter' | 'done' | 'reset' }
  | { type: 'way'; roomId: RoomId; way: WayId }
  | { type: 'prediction'; roomId: RoomId; stage: number; right: boolean }
  /** A wrong line, as he wrote it. */
  | { type: 'line'; roomId: RoomId; ok: boolean; text: string }
);

/** The domain events the log reads, by what they carry (store/events.ts). */
export type LoggedEvent =
  | { type: 'StageArrived'; roomId: string; stage: number }
  | { type: 'RoomRestarted'; roomId: string }
  | { type: 'StageReset'; roomId: string; stage: number }
  | { type: 'WayUsed'; roomId: string; stage: number; way: WayId }
  | { type: 'PredictionMade'; roomId: string; stage: number; right: boolean }
  | { type: 'LineWrong'; roomId: string; stage: number; line: string };

/** A gap this long starts a new session. */
export const sessionGapMs = 30 * 60 * 1000;

/** The most entries kept; the oldest go first. */
export const maxLogEvents = 20_000;

function isAuthoredRoom(id: string): id is RoomId {
  return /^r(0[1-9]|1[0-3])$/.test(id);
}

/**
 * What one event adds to the log, at `at`: a session mark first when `lastAt` is more than
 * `sessionGapMs` before it (or there is none), then the event's own entry, if it has one.
 * Rooms that aren't authored (built and friends' rooms) aren't logged yet (epic 5).
 */
export function logEntriesOf(
  event: LoggedEvent | { type: string },
  at: string,
  lastAt: string | null,
): PlayLogEvent[] {
  const entry = entryOf(event as LoggedEvent, at);
  if (!entry) return [];
  const gap = lastAt === null ? Number.POSITIVE_INFINITY : Date.parse(at) - Date.parse(lastAt);
  return gap > sessionGapMs ? [{ type: 'session', at }, entry] : [entry];
}

function entryOf(event: LoggedEvent, at: string): PlayLogEvent | null {
  if (!('roomId' in event) || !isAuthoredRoom(event.roomId)) return null;
  const { roomId } = event;
  switch (event.type) {
    case 'StageArrived':
      return event.stage === 0 ? { type: 'room', roomId, action: 'enter', at } : null;
    case 'RoomRestarted':
      return { type: 'room', roomId, action: 'done', at };
    case 'StageReset':
      return { type: 'room', roomId, action: 'reset', at };
    case 'WayUsed':
      return { type: 'way', roomId, way: event.way, at };
    case 'PredictionMade':
      return { type: 'prediction', roomId, stage: event.stage, right: event.right, at };
    case 'LineWrong':
      return { type: 'line', roomId, ok: false, text: event.line, at };
    default:
      return null;
  }
}

/** The log with new entries, the oldest dropped past `maxLogEvents`. */
export function appended(log: readonly PlayLogEvent[], entries: readonly PlayLogEvent[]) {
  const all = [...log, ...entries];
  return all.length > maxLogEvents ? all.slice(all.length - maxLogEvents) : all;
}

/** A room's line in Luka's view. */
export interface RoomSummary {
  roomId: RoomId;
  /** The first time he entered it, and the first time he finished it (ISO dates). */
  entered: string | null;
  done: string | null;
  resets: number;
  /** How often each way moved him on. */
  ways: Partial<Record<WayId, number>>;
  predictions: { right: number; wrong: number };
  wrongLines: number;
}

/** What Luka's view shows of the log. */
export interface LogSummary {
  /** Sessions per day, by local date (YYYY-MM-DD), in date order. */
  sessions: { day: string; count: number }[];
  rooms: RoomSummary[];
  /** The latest wrong lines, newest first (up to `latestLines`). */
  wrongLines: { at: string; roomId: RoomId; text: string }[];
}

export const latestLines = 30;

/** The day an ISO time falls on, in the device's time zone, as YYYY-MM-DD. */
export function dayOf(at: string): string {
  const date = new Date(at);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The summary of a log. */
export function summarize(log: readonly PlayLogEvent[]): LogSummary {
  const days = new Map<string, number>();
  const rooms = new Map<RoomId, RoomSummary>();
  const room = (roomId: RoomId): RoomSummary => {
    const known = rooms.get(roomId);
    if (known) return known;
    const fresh: RoomSummary = {
      roomId,
      entered: null,
      done: null,
      resets: 0,
      ways: {},
      predictions: { right: 0, wrong: 0 },
      wrongLines: 0,
    };
    rooms.set(roomId, fresh);
    return fresh;
  };
  const wrongLines: LogSummary['wrongLines'] = [];
  for (const event of log) {
    if (event.type === 'session') {
      const day = dayOf(event.at);
      days.set(day, (days.get(day) ?? 0) + 1);
      continue;
    }
    const summary = room(event.roomId);
    if (event.type === 'room') {
      if (event.action === 'enter') summary.entered ??= event.at;
      if (event.action === 'done') summary.done ??= event.at;
      if (event.action === 'reset') summary.resets += 1;
    } else if (event.type === 'way') {
      summary.ways[event.way] = (summary.ways[event.way] ?? 0) + 1;
    } else if (event.type === 'prediction') {
      summary.predictions[event.right ? 'right' : 'wrong'] += 1;
    } else if (!event.ok) {
      summary.wrongLines += 1;
      wrongLines.push({ at: event.at, roomId: event.roomId, text: event.text });
    }
  }
  return {
    sessions: [...days]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day, count })),
    rooms: [...rooms.values()].sort((a, b) => a.roomId.localeCompare(b.roomId)),
    wrongLines: wrongLines.reverse().slice(0, latestLines),
  };
}
