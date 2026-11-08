import '@/ui/common/now-line.css';
import { hr } from '@/content/text/hr';
import { roomGuideOf } from '@/store/room-guide';
import { useGame } from '@/store/store';
import { nowText } from '@/ui/common/now-line';

function useNow(): string | null {
  return useGame((s) => (s.ui.screen === 'room' ? nowText(s.room, s.save.progress.tools) : null));
}

/**
 * Always on screen in a room: what he is doing right now, in one plain sentence, so nobody
 * has to stare at the screen wondering what the game wants. Never a number he has to find:
 * the next step's goal, not its answer. Two places: this one in the notebook, where a phone
 * has room for it (now-line.css shows it only there) ...
 */
export function NowLine() {
  const text = useNow();
  if (!text) return null;
  return (
    <p className="now-line" role="status">
      <span className="now-line__heading">{hr.now.heading}</span> {text}
    </p>
  );
}

/**
 * ... and this one, big, over the scene on a tablet, where his eyes are: the playtest showed
 * a yellow strip in the notebook's corner goes unseen. It bumps when the sentence changes,
 * and steps aside while Nikola's card is talking.
 */
export function NowBanner() {
  const text = useNow();
  const guiding = useGame((s) => roomGuideOf(s) !== null);
  if (!text || guiding) return null;
  return (
    <p key={text} className="now-banner">
      <span className="now-line__heading">{hr.now.heading}</span> {text}
    </p>
  );
}
