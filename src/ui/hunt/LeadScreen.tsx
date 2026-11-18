import { useCallback, useState } from 'react';
import { hr } from '@/content/text/hr';
import type { LeadAction, LeadPlay } from '@/hunt/lead';
import type { LeadSpec } from '@/hunt/spec';
import { useGame } from '@/store/store';
import { MapControl } from '@/ui/common/MapButton';
import { LeadBoard } from '@/ui/hunt/LeadBoard';
import { Lesson } from '@/ui/hunt/Lesson';

const restartText = hr.hunt.ui.restart;

/**
 * The lead in play: its board, the little one's one word, the way back to the town, and
 * starting it again, which asks first, since a stray tap mustn't wipe his lines.
 */
export function LeadScreen({ spec, play }: { spec: LeadSpec; play: LeadPlay }) {
  const dispatch = useGame((s) => s.dispatch);
  const act = useCallback(
    (action: LeadAction) => dispatch({ type: 'hunt/lead', action }),
    [dispatch],
  );
  const [replay, setReplay] = useState<number | null>(null);
  const [asking, setAsking] = useState(false);
  const step = replay === null ? null : spec.lesson.steps[replay];
  return (
    <>
      <LeadBoard spec={spec} play={play} act={act} />
      {play.step !== 'show' && play.step !== 'thread' && (
        <div className="lead__corner">
          {spec.lesson.steps.length > 0 && (
            <button type="button" className="lead__why" onClick={() => setReplay(0)}>
              {hr.hunt.littleOne.why}
            </button>
          )}
          <button
            type="button"
            className="lead__restart"
            aria-label={restartText.button}
            onClick={() => setAsking(true)}
          >
            <svg className="lead__restart-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 4v6h6" />
              <path d="M5.2 15a8 8 0 1 0 1.6-8.4L4 10" />
            </svg>
            <span className="lead__restart-label">{restartText.button}</span>
          </button>
          <MapControl works={true} onOpen={() => dispatch({ type: 'hunt/leave' })} />
        </div>
      )}
      {asking && (
        <div className="lead__ask" role="dialog" aria-modal="true" aria-label={restartText.ask}>
          <div className="lead__ask-card">
            <h2 className="lead__ask-head">{restartText.ask}</h2>
            <p className="lead__ask-warn">{restartText.warn}</p>
            <div className="lead__ask-moves">
              <button type="button" className="lead__ask-no" onClick={() => setAsking(false)}>
                {restartText.no}
              </button>
              <button
                type="button"
                className="lead__ask-yes"
                onClick={() => {
                  setAsking(false);
                  dispatch({ type: 'hunt/restart' });
                }}
              >
                {restartText.yes}
              </button>
            </div>
          </div>
        </div>
      )}
      {step && replay !== null && (
        <div className="lead__replay">
          <Lesson
            step={step}
            onNext={() => setReplay(replay + 1 < spec.lesson.steps.length ? replay + 1 : null)}
            onBack={replay > 0 ? () => setReplay(replay - 1) : undefined}
          />
          <button type="button" className="lead__skip" onClick={() => setReplay(null)}>
            {hr.hunt.ui.skip}
          </button>
        </div>
      )}
    </>
  );
}
