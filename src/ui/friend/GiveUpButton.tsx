import '@/ui/friend/friend.css';
import { useState } from 'react';
import { hr } from '@/content/text/hr';
import { useGame } from '@/store/store';

/**
 * In a friend's room, where the map control is in his own game (GDD, Giving up: "a friend can
 * give up at any time"): a white flag, a circle the map control's size, with its word beside
 * it on the tablet. A tap asks once, and yes plays the builder's solution. Not in the intro
 * machine, which is only practice.
 */
export function GiveUpButton() {
  const playing = useGame((s) => s.ui.friend?.step === 'play' && s.room !== null);
  const dispatch = useGame((s) => s.dispatch);
  const [asking, setAsking] = useState(false);
  if (!playing) return null;
  return (
    <div className="give-up" data-asking={asking}>
      <button
        type="button"
        className="give-up__flag"
        aria-label={hr.friend.giveUp}
        aria-expanded={asking}
        onClick={() => setAsking((a) => !a)}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M9 28 V4 M9 5 H24 L20 10 L24 15 H9" />
        </svg>
        <span className="give-up__word">{hr.friend.giveUp}</span>
      </button>
      {asking && (
        <>
          <span className="give-up__ask">{hr.friend.giveUpAsk}</span>
          <button
            type="button"
            className="give-up__button give-up__button--yes"
            onClick={() => dispatch({ type: 'friend/give-up' })}
          >
            {hr.friend.giveUpYes}
          </button>
          <button type="button" className="give-up__button" onClick={() => setAsking(false)}>
            {hr.friend.giveUpNo}
          </button>
        </>
      )}
    </div>
  );
}
