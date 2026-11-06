// Luka's view and the backup link's restore (story 2.11), as main.tsx opens them in place of
// the game: `#dnevnik`, or a backup link `#b=…`. The game doesn't run on this page, so the two
// never write the save at once. It reads the save and the play log from the device, and
// restoring writes the save and then opens the game, which loads it.

import { useEffect, useMemo, useState } from 'react';
import { type Backup, decodeBackup, encodeBackup, restoredJson } from '@/app/backup';
import { backupPayload } from '@/links/backup';
import { summarize } from '@/playlog/log';
import { logStorage } from '@/save/log-storage';
import type { SaveV1 } from '@/save/schema';
import { saveStorage } from '@/save/storage';
import { LukaView, RestoreView } from '@/ui/luka/LukaView';

/** The game, with no fragment: leaving Luka's view, or after a restore. */
function openGame(): void {
  location.replace(`${location.pathname}${location.search}`);
}

export default function LukaApp({ hash }: { hash: string }) {
  // Read once for this page: the save on the device, and whether this device writes.
  const loaded = useMemo(() => saveStorage.load(new Date().toISOString()), []);
  const payload = backupPayload(hash);
  if (payload !== null) {
    return <Restore payload={payload} current={loaded.save} saving={loaded.saving} />;
  }
  return (
    <LukaView
      summary={summarize(logStorage.read())}
      notSaving={!loaded.saving}
      makeBackupLink={async () => {
        if (!loaded.save) return null;
        const data = await encodeBackup(loaded.save, saveStorage.stored());
        return `${location.origin}${location.pathname}#b=${data}`;
      }}
      exportLog={() => {
        const blob = new Blob([JSON.stringify(logStorage.read(), null, 1)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `matematika-dnevnik-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        // After the click has started the download (story 2.11 review).
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }}
      onBack={openGame}
    />
  );
}

function Restore({
  payload,
  current,
  saving,
}: {
  payload: string;
  current: SaveV1 | null;
  saving: boolean;
}) {
  const [incoming, setIncoming] = useState<Backup | null | 'reading'>('reading');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    void decodeBackup(payload, new Date().toISOString()).then(setIncoming);
  }, [payload]);
  if (incoming === 'reading') return null;
  return (
    <RestoreView
      incoming={incoming ? incoming.save.progress.roomsDone.length : null}
      notSaving={!saving}
      current={current ? current.progress.roomsDone.length : null}
      failed={failed}
      onAccept={() => {
        if (!incoming) return;
        if (saveStorage.replace(restoredJson(incoming, current))) openGame();
        else setFailed(true);
      }}
      onDecline={openGame}
    />
  );
}
