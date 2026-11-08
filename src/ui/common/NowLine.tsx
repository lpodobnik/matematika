import '@/ui/common/now-line.css';
import { hr } from '@/content/text/hr';
import { useGame } from '@/store/store';
import { nowText } from '@/ui/common/now-line';

/**
 * Always on screen in a room: what he is doing right now, in one plain sentence, so nobody
 * has to stare at the screen wondering what the game wants. It stands at the top of the
 * notebook, and takes no touches. Never a number: the next step's goal, not its answer.
 */
export function NowLine() {
  const text = useGame((s) =>
    s.ui.screen === 'room' ? nowText(s.room, s.save.progress.tools) : null,
  );
  if (!text) return null;
  return (
    <p className="now-line" role="status">
      <span className="now-line__heading">{hr.now.heading}</span> {text}
    </p>
  );
}
