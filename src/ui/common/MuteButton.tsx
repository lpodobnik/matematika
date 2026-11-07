import '@/ui/common/mute-button.css';
import { hr } from '@/content/text/hr';
import { useGame } from '@/store/store';

/**
 * Story 6.2 (GDD, Audio and Music: "a mute control is always available"): a speaker in a
 * corner of every screen but the loading one. Kept in the save's settings.
 */
export function MuteButton() {
  const muted = useGame((s) => s.save.settings.muted);
  const shown = useGame((s) => s.ui.screen !== 'loading');
  const dispatch = useGame((s) => s.dispatch);
  if (!shown) return null;
  return (
    <MuteControl
      muted={muted}
      onToggle={() => dispatch({ type: 'settings/mute', muted: !muted })}
    />
  );
}

interface MuteControlProps {
  muted: boolean;
  onToggle(): void;
}

/**
 * The button from props only: a toggle, pressed while the sound is off, at least 48 CSS px.
 * Like the other corner controls it acts on release and never takes focus, so a key typed
 * into the notebook never toggles it.
 */
export function MuteControl({ muted, onToggle }: MuteControlProps) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className="mute-button"
      aria-label={hr.ui.mute}
      aria-pressed={muted}
      data-muted={muted}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onToggle}
    >
      <svg className="mute-button__icon" viewBox="0 0 32 32" aria-hidden="true">
        <path className="mute-button__speaker" d="M5 12 H10 L17 6 V26 L10 20 H5 Z" />
        {muted ? (
          <path className="mute-button__off" d="M21 12 L29 20 M29 12 L21 20" />
        ) : (
          <path className="mute-button__waves" d="M21 11 Q24 16 21 21 M24.5 8 Q29.5 16 24.5 24" />
        )}
      </svg>
    </button>
  );
}
