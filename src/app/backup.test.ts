import { describe, expect, it } from 'vitest';
import { decodeBackup, encodeBackup, restoredJson } from '@/app/backup';
import { backupPayload, toBase64Url } from '@/links/backup';
import { decodeSave } from '@/save/decode';
import type { SaveV1 } from '@/save/schema';

const now = '2026-11-06T10:00:00.000Z';
const save = decodeSave(
  {
    v: 1,
    createdAt: now,
    character: { name: 'Lana', look: 'look-2' },
    progress: { roomsDone: ['r01', 'r02'], told: ['r01', 'r02'], tools: [], ideasSeen: ['equal'] },
  },
  now,
) as SaveV1;

describe('the backup link (story 2.11)', () => {
  it('round-trips the save through deflate-raw and base64url, without his name', async () => {
    const payload = await encodeBackup(save);
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(payload).not.toContain('Lana');
    const back = await decodeBackup(payload, now);
    expect(back?.save.progress.roomsDone).toEqual(['r01', 'r02']);
    expect(back?.save.character).toEqual({ name: null, look: null });
  });

  it('reads nothing from a payload that isn’t a backup', async () => {
    expect(await decodeBackup('', now)).toBeNull();
    expect(await decodeBackup('not base64!', now)).toBeNull();
    expect(await decodeBackup('AAAA', now)).toBeNull();
  });

  it('finds the payload in #b= only, and keeps the device’s own name on restore', () => {
    expect(backupPayload('#b=abc')).toBe('abc');
    expect(backupPayload('#dnevnik')).toBeNull();
    const backup = { ...save, character: { name: null, look: null } };
    const read = { save: backup, json: { ...backup } };
    expect(restoredJson(read, save).character).toEqual({ name: 'Lana', look: 'look-2' });
    expect(restoredJson(read, null).character).toEqual({ name: null, look: null });
  });
});

describe('a backup link’s safety (story 2.11 review)', () => {
  const pack = async (value: unknown) => {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return toBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()));
  };

  it('refuses JSON that isn’t a save, and a newer version’s save', async () => {
    expect(await decodeBackup(await pack({}), now)).toBeNull();
    expect(await decodeBackup(await pack({ hello: 'world' }), now)).toBeNull();
    expect(await decodeBackup(await pack({ v: 7, progress: {} }), now)).toBeNull();
  });

  it('carries the save as stored, fields this build doesn’t know too, and restores it whole', async () => {
    const stored = {
      ...save,
      workshop: { rooms: ['mine'] },
      character: { name: 'Lana', look: 'look-2' },
    };
    const payload = await encodeBackup(save, stored);
    const back = await decodeBackup(payload, now);
    expect(back?.json.workshop).toEqual({ rooms: ['mine'] });
    expect(back?.json.character).toEqual({ name: null, look: null });
    const device = { ...save, character: { name: 'Ivo', look: 'look-1' as const } };
    const written = restoredJson(back as never, device);
    expect(written.character).toEqual({ name: 'Ivo', look: 'look-1' });
    expect(written.workshop).toEqual({ rooms: ['mine'] });
  });
});
