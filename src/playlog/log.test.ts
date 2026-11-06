import { describe, expect, it } from 'vitest';
import { appended, logEntriesOf, maxLogEvents, type PlayLogEvent, summarize } from '@/playlog/log';

const at = (minute: number) => new Date(Date.UTC(2026, 10, 6, 10, minute)).toISOString();

describe('the play log (story 2.11)', () => {
  it('logs rooms, ways, predictions and wrong lines, and nothing else', () => {
    expect(logEntriesOf({ type: 'StageArrived', roomId: 'r01', stage: 0 }, at(0), at(0))).toEqual([
      { type: 'room', roomId: 'r01', action: 'enter', at: at(0) },
    ]);
    expect(logEntriesOf({ type: 'StageArrived', roomId: 'r02', stage: 1 }, at(0), at(0))).toEqual(
      [],
    );
    expect(logEntriesOf({ type: 'RoomRestarted', roomId: 'r01' }, at(1), at(0))).toEqual([
      { type: 'room', roomId: 'r01', action: 'done', at: at(1) },
    ]);
    expect(
      logEntriesOf({ type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' }, at(1), at(0)),
    ).toEqual([{ type: 'way', roomId: 'r04', way: 'balance', at: at(1) }]);
    expect(
      logEntriesOf({ type: 'PredictionMade', roomId: 'r03', stage: 0, right: true }, at(1), at(0)),
    ).toEqual([{ type: 'prediction', roomId: 'r03', stage: 0, right: true, at: at(1) }]);
    expect(
      logEntriesOf({ type: 'LineWrong', roomId: 'r04', stage: 0, line: 'x = 18' }, at(1), at(0)),
    ).toEqual([{ type: 'line', roomId: 'r04', ok: false, text: 'x = 18', at: at(1) }]);
    // Hints, dial notches and the rest aren't logged.
    for (const type of ['DialNotch', 'LineAccepted', 'SaveChanged', 'StageLocked']) {
      expect(logEntriesOf({ type, roomId: 'r01' } as never, at(1), at(0)), type).toEqual([]);
    }
    // Rooms that aren't authored wait for epic 5.
    expect(logEntriesOf({ type: 'RoomRestarted', roomId: 'built-1' }, at(1), at(0))).toEqual([]);
  });

  it('marks a session after 30 minutes of nothing, and at the first event', () => {
    const event = { type: 'RoomRestarted', roomId: 'r01' } as const;
    expect(logEntriesOf(event, at(0), null)[0]?.type).toBe('session');
    expect(logEntriesOf(event, at(29), at(0))).toHaveLength(1);
    expect(logEntriesOf(event, at(31), at(0))[0]?.type).toBe('session');
  });

  it('keeps at most 20,000 entries, dropping the oldest', () => {
    const many: PlayLogEvent[] = Array.from({ length: maxLogEvents }, (_, i) => ({
      type: 'session',
      at: at(i % 60),
    }));
    const next = appended(many, [{ type: 'room', roomId: 'r01', action: 'enter', at: at(1) }]);
    expect(next).toHaveLength(maxLogEvents);
    expect(next.at(-1)?.type).toBe('room');
  });

  it('sums up sessions per day, each room’s dates, ways, predictions and wrong lines', () => {
    const log: PlayLogEvent[] = [
      { type: 'session', at: at(0) },
      { type: 'room', roomId: 'r03', action: 'enter', at: at(1) },
      { type: 'prediction', roomId: 'r03', stage: 0, right: false, at: at(2) },
      { type: 'line', roomId: 'r03', ok: false, text: 'x = 2', at: at(3) },
      { type: 'room', roomId: 'r03', action: 'reset', at: at(4) },
      { type: 'prediction', roomId: 'r03', stage: 1, right: true, at: at(5) },
      { type: 'way', roomId: 'r03', way: 'try', at: at(6) },
      { type: 'room', roomId: 'r03', action: 'done', at: at(7) },
      { type: 'session', at: at(50) },
    ];
    const summary = summarize(log);
    expect(summary.sessions).toHaveLength(1);
    expect(summary.sessions[0]?.count).toBe(2);
    expect(summary.rooms).toEqual([
      {
        roomId: 'r03',
        entered: at(1),
        done: at(7),
        resets: 1,
        ways: { try: 1 },
        predictions: { right: 1, wrong: 1 },
        wrongLines: 1,
      },
    ]);
    expect(summary.wrongLines).toEqual([{ at: at(3), roomId: 'r03', text: 'x = 2' }]);
  });
});
