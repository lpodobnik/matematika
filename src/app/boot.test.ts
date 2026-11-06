import { afterEach, describe, expect, it, vi } from 'vitest';
import { boot } from '@/app/boot';
import { errorLogKey } from '@/lib/error-log';
import type { SaveV1 } from '@/save/schema';
import type { Action } from '@/store/actions';

const save: SaveV1 = {
  v: 1,
  createdAt: '2026-11-01T08:00:00.000Z',
  character: { name: null, look: null },
  progress: {
    roomsDone: ['r01'],
    tools: [],
    started: [],
    onMap: false,
    told: [],
    firstUse: [],
    room: { id: 'r02', stage: 0, lines: [], pin: null, splitterSeen: false },
  },
  economy: { parts: 0, upgrades: [], paidPredictions: [], piles: {}, lairs: {} },
  settings: { muted: false, quality: null },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('boot (story 2.1)', () => {
  it('reads the save, loads the assets, then starts the game from the save', async () => {
    const actions: Action[] = [];
    const load = vi.fn((now: string) => {
      expect(now).toBe('2026-11-06T10:00:00.000Z');
      return { save, status: 'loaded' as const, saving: true };
    });
    await boot(
      { load },
      (action) => actions.push(action),
      async (progress) => {
        progress(0.5);
        progress(1);
      },
      () => new Date('2026-11-06T10:00:00.000Z'),
    );
    expect(actions.map((action) => action.type)).toEqual([
      'boot/progress',
      'boot/progress',
      'boot/start',
    ]);
    expect(actions.at(-1)).toMatchObject({
      type: 'boot/start',
      save: { createdAt: save.createdAt, progress: { roomsDone: ['r01'] } },
      room: { id: 'r02', stage: 0 },
    });
  });

  it('starts a new game when there is no save', async () => {
    const actions: Action[] = [];
    await boot({ load: () => ({ save: null, status: 'fresh', saving: true }) }, (action) =>
      actions.push(action),
    );
    expect(actions.at(-1)).toEqual({ type: 'boot/start', save: null, room: null });
  });

  it('starts at the next room when the room in progress throws as it resumes', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
    const starts: Action[] = [];
    await boot({ load: () => ({ save, status: 'loaded', saving: true }) }, (action) => {
      if (action.type !== 'boot/start') return;
      starts.push(action);
      if (action.room) throw new Error('replay failed');
    });
    expect(starts).toHaveLength(2);
    expect(starts[1]).toMatchObject({ room: null, save: { progress: { roomsDone: ['r01'] } } });
  });

  it('starts anyway when the assets fail to load, and logs why', async () => {
    const items = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => items.set(key, value),
    });
    const actions: Action[] = [];
    await boot(
      { load: () => ({ save: null, status: 'fresh', saving: true }) },
      (action) => actions.push(action),
      async () => {
        throw new Error('bundle missing');
      },
    );
    expect(actions.at(-1)?.type).toBe('boot/start');
    expect(items.get(errorLogKey)).toContain('bundle missing');
  });
});
