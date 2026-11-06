import '@/ui/naming/naming.css';
import { type FormEvent, useState } from 'react';
import { cleanName, type LookId, lookIds, maxNameLength } from '@/city/character';
import { hr } from '@/content/text/hr';
import { useGame } from '@/store/store';
import look1 from '@/ui/naming/looks/look-1.webp';
import look2 from '@/ui/naming/looks/look-2.webp';
import look3 from '@/ui/naming/looks/look-3.webp';
import look4 from '@/ui/naming/looks/look-4.webp';
import look5 from '@/ui/naming/looks/look-5.webp';
import look6 from '@/ui/naming/looks/look-6.webp';

/** The art bible's looks t14–t19, placeholders until the final images (story 2.12, epic 6). */
const lookImages: Record<LookId, string> = {
  'look-1': look1,
  'look-2': look2,
  'look-3': look3,
  'look-4': look4,
  'look-5': look5,
  'look-6': look6,
};

/**
 * The naming (story 2.4; narrative design, Opening): once room 1's door is open, Gospon
 * Penkala asks who he is. He types a name, the only time the keyboard comes up in the game,
 * and picks one of six looks, shown in grey (NFR12). Penkala answers with the name, and the
 * next room follows.
 */
export function NamingScreen() {
  const dispatch = useGame((s) => s.dispatch);
  return <NamingBoard onDone={(name, look) => dispatch({ type: 'character/set', name, look })} />;
}

interface BoardProps {
  onDone(name: string, look: LookId): void;
  /** For tests: where the board starts. */
  initial?: { name: string; look: LookId | null; replied: boolean };
}

/** The naming from props only. */
export function NamingBoard({ onDone, initial }: BoardProps) {
  const [typed, setTyped] = useState(initial?.name ?? '');
  const [look, setLook] = useState<LookId | null>(initial?.look ?? null);
  const [replied, setReplied] = useState(initial?.replied ?? false);
  const name = cleanName(typed);
  const ready = name !== null && look !== null;

  const confirm = (event: FormEvent) => {
    event.preventDefault();
    // The keyboard goes away: before Penkala answers, or, with no look yet, to show the looks.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (ready) setReplied(true);
  };

  if (replied && name && look) {
    return (
      <main className="naming">
        <section className="naming__reply">
          <img className="naming__portrait" src={lookImages[look]} alt="" />
          <div className="naming__speech">
            <p className="naming__speaker">{hr.naming.speaker}</p>
            <p className="naming__line">{hr.naming.reply(name)}</p>
            <button type="button" className="naming__button" onClick={() => onDone(name, look)}>
              {hr.naming.next}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="naming">
      <form className="naming__form" onSubmit={confirm}>
        <div className="naming__ask">
          <p className="naming__speaker">{hr.naming.speaker}</p>
          <p className="naming__line">{hr.naming.ask}</p>
          <label className="naming__label">
            {hr.naming.nameLabel}
            <input
              className="naming__input"
              type="text"
              value={typed}
              maxLength={maxNameLength}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck={false}
              enterKeyHint="done"
              onChange={(event) => setTyped(event.target.value)}
            />
          </label>
          {/* Not `disabled`: the keyboard's Enter must still reach the form (see confirm). */}
          <button type="submit" className="naming__button" aria-disabled={!ready}>
            {hr.naming.confirm}
          </button>
        </div>
        <fieldset className="naming__looks">
          <legend className="naming__label">{hr.naming.pickLook}</legend>
          {lookIds.map((id, index) => (
            <button
              key={id}
              type="button"
              className="naming__look"
              aria-pressed={look === id}
              aria-label={hr.naming.looks[index]}
              onClick={() => setLook(id)}
            >
              <img src={lookImages[id]} alt="" draggable={false} />
            </button>
          ))}
        </fieldset>
      </form>
    </main>
  );
}
