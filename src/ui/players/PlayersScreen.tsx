import '@/ui/players/players.css';
import { useEffect, useState } from 'react';
import type { LookId } from '@/city/character';
import { hr } from '@/content/text/hr';
import { looks } from '@/ui/town/art';

export interface PlayerView {
  id: string;
  name: string | null;
  look: LookId | null;
}

interface Props {
  title: string;
  players: readonly PlayerView[];
  onPick(id: string): void;
  onNew?(): void;
  /** Back to the player this tab was playing as; absent at a launch, where someone must pick. */
  onBack?(): void;
  /** Starting over and removing come as a pair; absent where a list is only to pick from. */
  manage?: { onRestart(id: string): boolean; onRemove(id: string): boolean };
}

type Ask = { kind: 'restart' | 'remove'; player: PlayerView };

/** How long the confirm's "yes" stays off, so a second tap of the same finger can't reach it. */
export const armAfterMs = 800;

/**
 * "Tko igra?": each player's look and name, a tap to play. Changing a player takes three
 * separate taps a child won't make by chance: the quiet manage button, the player's button, and a
 * "yes" that says what it does, that wakes a moment late, and that sits beside a "no".
 */
export function PlayersBoard({ title, players, onPick, onNew, onBack, manage }: Props) {
  const [managing, setManaging] = useState(false);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [failed, setFailed] = useState(false);
  const editing = managing && manage !== undefined;

  if (ask && manage) {
    return (
      <Confirm
        ask={ask}
        onNo={() => setAsk(null)}
        onYes={() => {
          const done =
            ask.kind === 'restart'
              ? manage.onRestart(ask.player.id)
              : manage.onRemove(ask.player.id);
          setFailed(!done);
          setAsk(null);
        }}
      />
    );
  }

  return (
    <main className="players" data-editing={editing}>
      <h1 className="players__title">{title}</h1>
      {failed && <p className="players__warning">{hr.players.failed}</p>}
      <ul className="players__list">
        {players.map((player) => (
          <li key={player.id} className="players__item" data-player={player.id}>
            <button
              type="button"
              className="players__card"
              disabled={editing}
              onClick={() => onPick(player.id)}
            >
              <Portrait look={player.look} />
              <span className="players__name">{player.name ?? hr.players.unnamed}</span>
            </button>
            {editing && (
              <span className="players__actions">
                <button
                  type="button"
                  className="players__small"
                  onClick={() => setAsk({ kind: 'restart', player })}
                >
                  {hr.players.restart}
                </button>
                <button
                  type="button"
                  className="players__small"
                  onClick={() => setAsk({ kind: 'remove', player })}
                >
                  {hr.players.remove}
                </button>
              </span>
            )}
          </li>
        ))}
        {onNew && !editing && (
          <li className="players__item">
            <button type="button" className="players__card players__card--new" onClick={onNew}>
              <span className="players__plus" aria-hidden="true">
                +
              </span>
              <span className="players__name">{hr.players.newPlayer}</span>
            </button>
          </li>
        )}
      </ul>
      <div className="players__foot">
        {onBack && !editing && (
          <button type="button" className="players__small" onClick={onBack}>
            {hr.players.back}
          </button>
        )}
        {manage && players.length > 0 && (
          <button
            type="button"
            className="players__small players__small--quiet"
            onClick={() => setManaging(!managing)}
          >
            {editing ? hr.players.manageDone : hr.players.manage}
          </button>
        )}
      </div>
    </main>
  );
}

function Confirm({ ask, onNo, onYes }: { ask: Ask; onNo(): void; onYes(): void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setArmed(true), armAfterMs);
    return () => clearTimeout(timer);
  }, []);
  const name = ask.player.name ?? hr.players.unnamed;
  const restart = ask.kind === 'restart';
  return (
    <main className="players">
      <section className="players__confirm" role="alertdialog" aria-labelledby="players-ask">
        <Portrait look={ask.player.look} />
        <div className="players__speech">
          <h1 id="players-ask" className="players__title">
            {restart ? hr.players.confirmRestart(name) : hr.players.confirmRemove(name)}
          </h1>
          <p className="players__warn">
            {restart ? hr.players.warnRestart : hr.players.warnRemove}
          </p>
          <div className="players__choice">
            <button type="button" className="players__no" onClick={onNo}>
              {hr.players.no}
            </button>
            <button type="button" className="players__yes" disabled={!armed} onClick={onYes}>
              {restart ? hr.players.yesRestart : hr.players.yesRemove}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Portrait({ look }: { look: LookId | null }) {
  if (!look) {
    return (
      <svg className="players__portrait" viewBox="0 0 60 90" aria-hidden="true">
        <circle cx="30" cy="24" r="14" />
        <path d="M8 86 Q8 44 30 44 Q52 44 52 86 Z" />
      </svg>
    );
  }
  return <img className="players__portrait" src={looks[look]} alt="" draggable={false} />;
}
