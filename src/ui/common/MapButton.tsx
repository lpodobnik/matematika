import '@/ui/common/common.css';
import { hr } from '@/content/text/hr';
import { leaveWorks } from '@/room/phases';
import { useGame } from '@/store/store';

/**
 * The map control (story 2.2, FR26): he leaves the room for the map, and the room keeps its
 * committed lines for when he comes back. In the scene area's bottom-left corner, above the
 * parts counter. Off once the stage locks: the machine is running, and the map comes by
 * itself when the restart ends.
 */
export function MapButton() {
  const present = useGame((s) => s.room !== null);
  const works = useGame((s) => (s.room ? leaveWorks(s.room.stage.phase) : false));
  const dispatch = useGame((s) => s.dispatch);
  if (!present) return null;
  return <MapControl works={works} onOpen={() => dispatch({ type: 'map/open' })} />;
}

interface MapControlProps {
  works: boolean;
  onOpen(): void;
}

/**
 * The button from props only: a folded map, at least 48 CSS px (common.css). Like the reset
 * control, it acts on release and never takes focus.
 */
export function MapControl({ works, onOpen }: MapControlProps) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className="map-button"
      aria-label={hr.ui.map}
      disabled={!works}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onOpen}
    >
      <svg className="map-button__icon" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 8 L11 5 L21 8 L28 5 V24 L21 27 L11 24 L4 27 Z M11 5 V24 M21 8 V27" />
      </svg>
    </button>
  );
}
