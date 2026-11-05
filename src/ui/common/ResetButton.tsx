import '@/ui/common/common.css';
import { hr } from '@/content/text/hr';
import { resetWorks } from '@/room/phases';
import { useGame } from '@/store/store';

/**
 * The reset control (FR26): the stage in play starts again from line 0. It is always on
 * screen while a room is in play, and off while the stage is locked or restarting. What
 * reset does is decided in `room/phases.ts`.
 */
export function ResetButton() {
  const present = useGame((s) => s.room !== null);
  const works = useGame((s) => (s.room ? resetWorks(s.room.stage.phase) : false));
  const dispatch = useGame((s) => s.dispatch);
  if (!present) return null;
  return <ResetControl works={works} onReset={() => dispatch({ type: 'stage/reset' })} />;
}

interface ResetControlProps {
  works: boolean;
  onReset(): void;
}

/**
 * The button itself, from props only: a circular arrow, at least 48 CSS px (common.css). It
 * acts on release, so a finger that slides off doesn't reset his lines, and it never takes
 * focus, so a computer's keys keep going to the notebook.
 */
export function ResetControl({ works, onReset }: ResetControlProps) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className="reset"
      aria-label={hr.ui.reset}
      disabled={!works}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onReset}
    >
      <svg className="reset__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4v6h6" />
        <path d="M5.2 15a8 8 0 1 0 1.6-8.4L4 10" />
      </svg>
    </button>
  );
}
