import { useCallback, useState } from 'react';
import { hr } from '@/content/text/hr';
import type { LeadAction, LeadPlay } from '@/hunt/lead';
import type { LeadSpec } from '@/hunt/spec';
import { useGame } from '@/store/store';
import { MapControl } from '@/ui/common/MapButton';
import { LeadBoard } from '@/ui/hunt/LeadBoard';
import { ObjectView } from '@/ui/hunt/objects/ObjectView';

/** The lead in play: its board, the little one's one word, and the way back to the town. */
export function LeadScreen({ spec, play }: { spec: LeadSpec; play: LeadPlay }) {
  const dispatch = useGame((s) => s.dispatch);
  const act = useCallback(
    (action: LeadAction) => dispatch({ type: 'hunt/lead', action }),
    [dispatch],
  );
  const [replay, setReplay] = useState<number | null>(null);
  const step = replay === null ? null : spec.lesson.steps[replay];
  return (
    <>
      <LeadBoard spec={spec} play={play} act={act} />
      {play.step !== 'show' && play.step !== 'thread' && (
        <div className="lead__corner">
          <button type="button" className="lead__why" onClick={() => setReplay(0)}>
            {hr.hunt.littleOne.why}
          </button>
          <MapControl works={true} onOpen={() => dispatch({ type: 'hunt/leave' })} />
        </div>
      )}
      {step && replay !== null && (
        <div className="lead__replay">
          <button
            type="button"
            className="lesson"
            onClick={() => setReplay(replay + 1 < spec.lesson.steps.length ? replay + 1 : null)}
          >
            <span className="lesson__object">
              <ObjectView object={step.object} />
            </span>
            {step.say.map((line) => (
              <span key={line} className="lesson__line">
                {line}
              </span>
            ))}
            <span className="lesson__next">{hr.hunt.ui.next}</span>
          </button>
          <button type="button" className="lead__skip" onClick={() => setReplay(null)}>
            {hr.hunt.ui.skip}
          </button>
        </div>
      )}
    </>
  );
}
