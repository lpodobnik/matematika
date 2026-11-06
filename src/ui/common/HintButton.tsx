import '@/ui/common/hint-button.css';
import { hr } from '@/content/text/hr';
import { hintWorks } from '@/room/hint';
import { useGame } from '@/store/store';
import { hintOf } from '@/ui/common/hint-text';

/**
 * The hint button (story 1.16; GDD, Player Assistance): `?`, directly under the reset
 * control in the scene area's top-left corner. The first press shows the current step's
 * tag, the second the exact next move (room/hint.ts). It works in every phase he can act
 * in, and is off once the stage locks. Hints are free and never recorded.
 */
export function HintButton() {
  const present = useGame((s) => s.room !== null);
  const works = useGame((s) => hintWorks(s.room, s.save.progress.tools));
  const shown = useGame((s) => hintOf(s) !== null);
  const dispatch = useGame((s) => s.dispatch);
  if (!present) return null;
  return (
    <HintControl works={works} shown={shown} onPress={() => dispatch({ type: 'hint/press' })} />
  );
}

interface HintControlProps {
  works: boolean;
  /** A hint shows now: the button's ring is heavier (hint-button.css). */
  shown: boolean;
  onPress(): void;
}

/**
 * The button itself, from props only: a round `?`, at least 48 CSS px (hint-button.css). Like
 * the reset control, it acts on release, so a finger that slides off does nothing, and it
 * never takes focus, so a computer's keys keep going to the notebook.
 */
export function HintControl({ works, shown, onPress }: HintControlProps) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className="hint"
      aria-label={hr.ui.hint}
      data-shown={shown}
      disabled={!works}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onPress}
    >
      <span className="hint__mark" aria-hidden="true">
        ?
      </span>
    </button>
  );
}
