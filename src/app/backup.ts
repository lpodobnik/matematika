// The backup link (story 2.11; architecture, Links: `#b=`): the save without his name,
// deflate-raw (the browser's `CompressionStream`), base64url, in the URL fragment, which the
// browser never sends to a server. Reading one back decodes it leniently (save/decode.ts).

import { fromBase64Url, toBase64Url } from '@/links/backup';
import { decodeSave } from '@/save/decode';
import { migrate, migrations } from '@/save/migrate';
import { currentVersion, type SaveV1 } from '@/save/schema';

/** What a backup carries: the whole save but his apprentice's name and look (GDD privacy). */
export function backupOf(save: SaveV1): SaveV1 {
  return { ...save, character: { name: null, look: null } };
}

async function through(
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
) {
  const source = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(source).arrayBuffer());
}

type Json = Record<string, unknown>;

/**
 * The fragment's payload for a save: `<data>` in `#b=<data>`. It carries the save as stored
 * (`stored`, with fields this build doesn't know), or the save as this build has it, both
 * without his name and look.
 */
export async function encodeBackup(save: SaveV1, stored: Json | null = null): Promise<string> {
  const whole: Json = stored
    ? { ...stored, character: { name: null, look: null } }
    : { ...backupOf(save) };
  const json = new TextEncoder().encode(JSON.stringify(whole));
  return toBase64Url(await through(json, new CompressionStream('deflate-raw')));
}

/** A backup read from a link: the save as this build reads it, and as it came. */
export interface Backup {
  save: SaveV1;
  json: Json;
}

/**
 * The backup a payload holds, or null when it doesn't read as one: not compressed JSON, not
 * a save (no version), or a newer version's save, which this build would cut down (story
 * 2.11 review). An older version's save is migrated, as a launch would.
 */
export async function decodeBackup(payload: string, now: string): Promise<Backup | null> {
  const bytes = fromBase64Url(payload);
  if (!bytes || bytes.length === 0) return null;
  try {
    const text = new TextDecoder().decode(
      await through(bytes, new DecompressionStream('deflate-raw')),
    );
    const migrated = migrate(JSON.parse(text), migrations, currentVersion);
    if (migrated.kind !== 'current') return null;
    const save = decodeSave(migrated.save, now);
    return save ? { save, json: migrated.save } : null;
  } catch {
    return null;
  }
}

/** The JSON a restore writes: the backup's, with the device's own name and look kept. */
export function restoredJson(backup: Backup, current: SaveV1 | null): Json {
  return { ...backup.json, character: current?.character ?? { name: null, look: null } };
}
