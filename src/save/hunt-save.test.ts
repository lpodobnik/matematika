import { describe, expect, it } from 'vitest';
import { backupOf, decodeBackup, encodeBackup, restoredJson } from '@/app/backup';
import type { CompanionSave } from '@/hunt/types';
import { newHunt } from '@/hunt/types';
import { decodeSave } from '@/save/decode';
import type { SaveV1 } from '@/save/schema';
import { createSaveStorage } from '@/save/storage';

const now = '2026-11-08T20:00:00.000Z';

function memory() {
  const items = new Map<string, string>();
  return {
    items,
    storage: {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => {
        items.set(key, value);
      },
      removeItem: (key: string) => {
        items.delete(key);
      },
      key: (index: number) => [...items.keys()][index] ?? null,
      get length() {
        return items.size;
      },
    },
  };
}

const named: CompanionSave = { name: 'Kuc', looks: [], wearing: [], gear: [], taught: [] };

describe('part 2 in the save', () => {
  it('a save from before part 2 loads with none of it, and its progress untouched', () => {
    const old = {
      v: 1,
      createdAt: now,
      character: { name: 'Ivan', look: 'look-2' },
      progress: { roomsDone: ['r01', 'r13'], tools: ['balance'] },
    };
    const save = decodeSave(old, now);
    expect(save?.hunt).toEqual(newHunt());
    expect(save?.companion).toBeNull();
    expect(save?.progress.roomsDone).toEqual(['r01', 'r13']);
    expect(save?.character.name).toBe('Ivan');
  });

  it('keeps what it knows and drops ids it does not', () => {
    const save = decodeSave(
      {
        v: 1,
        hunt: {
          gateOpened: true,
          leadsDone: ['l01', 'l99'],
          thread: { target: 'l02', finishedSince: 1 },
          forged: 'struck',
          pages: { l01: [{ text: '0 ∉ N', kind: 'working', struck: false }], nope: [] },
          scene: { of: 'l01', index: 0, state: { phase: 'play' } },
        },
        companion: {
          name: 'Kuc',
          gear: ['hook', 'wings'],
          taught: [{ lead: 'l01', mistake: 'm', line: 'x', at: now }, { lead: 'z' }],
        },
      },
      now,
    );
    expect(save?.hunt.gateOpened).toBe(true);
    expect(save?.hunt.leadsDone).toEqual(['l01']);
    expect(save?.hunt.thread).toEqual({ target: 'l02', finishedSince: 1 });
    expect(save?.hunt.forged).toBe('struck');
    expect(Object.keys(save?.hunt.pages ?? {})).toEqual(['l01']);
    expect(save?.hunt.scene?.of).toBe('l01');
    expect(save?.companion?.gear).toEqual(['hook']);
    expect(save?.companion?.taught).toHaveLength(1);
  });

  it('a scene for something unknown is dropped, and the hunt stays', () => {
    const save = decodeSave({ v: 1, hunt: { gateOpened: true, scene: { of: 'nope' } } }, now);
    expect(save?.hunt.scene).toBeNull();
    expect(save?.hunt.gateOpened).toBe(true);
  });

  it('a page removed in play does not come back from the save as first read', () => {
    const { storage, items } = memory();
    const saved = createSaveStorage({ storage: () => storage, persist: () => {} });
    const first = decodeSave({ v: 1 }, now) as SaveV1;
    first.hunt.pages = { l01: [{ text: 'a', kind: 'his', struck: false }] };
    saved.load(now);
    saved.write(first);
    const reloaded = createSaveStorage({ storage: () => storage, persist: () => {} });
    const loaded = reloaded.load(now).save as SaveV1;
    expect(loaded.hunt.pages.l01).toHaveLength(1);
    reloaded.write({ ...loaded, hunt: { ...loaded.hunt, pages: {} } });
    const raw = [...items.values()].find((value) => value.includes('"hunt"')) ?? '{}';
    expect(JSON.parse(raw).hunt.pages).toEqual({});
  });
});

describe('the little one’s name in a backup', () => {
  const save = decodeSave({ v: 1, character: { name: 'Ivan', look: 'look-1' } }, now) as SaveV1;
  const withNames: SaveV1 = { ...save, companion: named };

  it('is left out, like his own', async () => {
    expect(backupOf(withNames).companion?.name).toBeNull();
    const fromSave = await decodeBackup(await encodeBackup(withNames), now);
    expect(fromSave?.save.companion?.name).toBeNull();
    expect(JSON.stringify(fromSave?.json)).not.toContain('Kuc');
    const stored = JSON.parse(JSON.stringify(withNames));
    const fromStored = await decodeBackup(await encodeBackup(withNames, stored), now);
    expect(JSON.stringify(fromStored?.json)).not.toContain('Kuc');
    expect(JSON.stringify(fromStored?.json)).not.toContain('Ivan');
  });

  it('a restore keeps the device’s name', async () => {
    const backup = await decodeBackup(await encodeBackup(withNames), now);
    if (!backup) throw new Error('no backup');
    const restored = restoredJson(backup, withNames);
    expect((restored.companion as CompanionSave).name).toBe('Kuc');
    const elsewhere = restoredJson(backup, save);
    expect((elsewhere.companion as CompanionSave).name).toBeNull();
  });

  it('a backup of a save with no little one stays that way', async () => {
    const backup = await decodeBackup(await encodeBackup(save), now);
    if (!backup) throw new Error('no backup');
    expect(restoredJson(backup, save).companion).toBeNull();
  });
});
