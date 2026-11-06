import '@/ui/luka/luka.css';
import { useState } from 'react';
import { hr } from '@/content/text/hr';
import { dayOf, type LogSummary } from '@/playlog/log';
import type { WayId } from '@/room/types';

/** A date as Luka reads it: the day, and the time. */
function when(at: string | null): string {
  if (!at) return '–';
  const time = new Date(at);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dayOf(at)} ${pad(time.getHours())}:${pad(time.getMinutes())}`;
}

interface Props {
  summary: LogSummary;
  /** The save isn't being written on this device (story 2.1's storage status). */
  notSaving: boolean;
  /** Makes the backup link (async: it compresses the save); null when there is no save. */
  makeBackupLink(): Promise<string | null>;
  /** Downloads the log as a JSON file. */
  exportLog(): void;
  onBack(): void;
}

/**
 * Luka's view (story 2.11; architecture, `#dnevnik`; FR53, FR54): how his son plays, from
 * the play log on this device, and a backup link that restores the whole save elsewhere.
 * For Luka: plain tables, no game skin. Linked from nowhere in the game.
 */
export function LukaView({ summary, notSaving, makeBackupLink, exportLog, onBack }: Props) {
  const [link, setLink] = useState<string | null>(null);
  // What the last try to make or copy the link said: nothing yet, done, or why not.
  const [note, setNote] = useState<'copied' | 'copyByHand' | 'noSave' | 'cantMake' | null>(null);
  const ways = (counts: Partial<Record<WayId, number>>) =>
    Object.entries(counts)
      .map(([way, n]) => `${hr.luka.wayNames[way as WayId]} ${n}`)
      .join(', ') || '–';
  return (
    <main className="luka">
      <header className="luka__head">
        <h1>{hr.luka.title}</h1>
        <button type="button" className="luka__button" onClick={onBack}>
          {hr.luka.back}
        </button>
      </header>
      {notSaving && <p className="luka__warning">{hr.luka.notSaving}</p>}

      <section>
        <h2>{hr.luka.sessions}</h2>
        {summary.sessions.length === 0 ? (
          <p>{hr.luka.sessionsNone}</p>
        ) : (
          <table className="luka__table">
            <thead>
              <tr>
                <th>{hr.luka.day}</th>
                <th>{hr.luka.count}</th>
              </tr>
            </thead>
            <tbody>
              {summary.sessions.map(({ day, count }) => (
                <tr key={day}>
                  <td>{day}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>{hr.luka.rooms}</h2>
        {summary.rooms.length === 0 && <p>{hr.luka.roomsNone}</p>}
        <table className="luka__table" hidden={summary.rooms.length === 0}>
          <thead>
            <tr>
              <th>{hr.luka.room}</th>
              <th>{hr.luka.entered}</th>
              <th>{hr.luka.done}</th>
              <th>{hr.luka.resets}</th>
              <th>{hr.luka.ways}</th>
              <th>{hr.luka.predictions}</th>
              <th>{hr.luka.wrongLines}</th>
            </tr>
          </thead>
          <tbody>
            {summary.rooms.map((room) => (
              <tr key={room.roomId}>
                <td>{hr.map.nodes[room.roomId]}</td>
                <td>{when(room.entered)}</td>
                <td>{when(room.done)}</td>
                <td>{room.resets}</td>
                <td>{ways(room.ways)}</td>
                <td>
                  {room.predictions.right} / {room.predictions.wrong}
                </td>
                <td>{room.wrongLines}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>{hr.luka.latest}</h2>
        {summary.wrongLines.length === 0 ? (
          <p>{hr.luka.latestNone}</p>
        ) : (
          <ul className="luka__lines">
            {summary.wrongLines.map((line) => (
              <li key={`${line.at}-${line.text}`}>
                <span>{when(line.at)}</span> <span>{hr.map.nodes[line.roomId]}</span>{' '}
                <code>{line.text}</code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>{hr.luka.backup}</h2>
        <p>{hr.luka.backupWhy}</p>
        <button
          type="button"
          className="luka__button"
          onClick={async () => {
            try {
              const made = await makeBackupLink();
              setLink(made);
              setNote(made === null ? 'noSave' : null);
            } catch {
              // A browser without compression streams can't make it (story 2.11 review).
              setNote('cantMake');
            }
          }}
        >
          {hr.luka.backupMake}
        </button>
        {link && (
          <div className="luka__link">
            <input
              readOnly
              value={link}
              aria-label={hr.luka.backup}
              onFocus={(event) => event.currentTarget.select()}
            />
            <button
              type="button"
              className="luka__button"
              onClick={async () => {
                // "Copied" only when it was: no clipboard (not a secure address) or a refusal
                // leaves him to copy it by hand (story 2.11 review).
                try {
                  if (!navigator.clipboard) throw new Error('no clipboard');
                  await navigator.clipboard.writeText(link);
                  setNote('copied');
                } catch {
                  setNote('copyByHand');
                }
              }}
            >
              {hr.luka.backupCopy}
            </button>
          </div>
        )}
        {note && (
          <p className={note === 'copied' ? undefined : 'luka__warning'}>{hr.luka.notes[note]}</p>
        )}
        <p>
          <button type="button" className="luka__button" onClick={exportLog}>
            {hr.luka.exportLog}
          </button>
        </p>
      </section>
    </main>
  );
}

interface RestoreProps {
  /** Rooms done in the backup, or null when the link doesn't read as one. */
  incoming: number | null;
  /** This device can't keep a save (no storage, or a newer version's save): say so first. */
  notSaving?: boolean;
  /** Rooms done on this device, or null when there is no save here. */
  current: number | null;
  /** Saving it failed (the device can't be written). */
  failed: boolean;
  onAccept(): void;
  onDecline(): void;
}

/**
 * Opening a backup link (`#b=`): it shows what the backup holds and what is on this device,
 * and asks before replacing it (story 2.11).
 */
export function RestoreView({
  incoming,
  notSaving = false,
  current,
  failed,
  onAccept,
  onDecline,
}: RestoreProps) {
  return (
    <main className="luka">
      <h1>{hr.luka.restore.title}</h1>
      {notSaving && <p className="luka__warning">{hr.luka.notSaving}</p>}
      {incoming === null ? (
        <p className="luka__warning">{hr.luka.restore.broken}</p>
      ) : (
        <>
          <p>{hr.luka.restore.incoming(incoming)}</p>
          <p>{current === null ? hr.luka.restore.noCurrent : hr.luka.restore.current(current)}</p>
          <p>{hr.luka.restore.warning}</p>
          {failed && <p className="luka__warning">{hr.luka.restore.failed}</p>}
          <button type="button" className="luka__button" onClick={onAccept}>
            {hr.luka.restore.accept}
          </button>{' '}
        </>
      )}
      <button type="button" className="luka__button" onClick={onDecline}>
        {hr.luka.restore.decline}
      </button>
    </main>
  );
}
