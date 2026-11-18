import { huntUiText } from '@/content/text/hunt-leads';
import type { LessonStep } from '@/hunt/spec';
import { OurLittleOne } from '@/ui/hunt/LittleOne';
import { ObjectView } from '@/ui/hunt/objects/ObjectView';

/**
 * One step of a showing: the object, the little one's lines, and "Dalje". Only "Dalje" moves on,
 * never a tap elsewhere, and nothing moves on by itself: his son tapped the number line by mistake
 * and lost a step he hadn't read. "Natrag" brings the step before back.
 */
export function Lesson({
  step,
  found,
  little = false,
  onNext,
  onBack,
}: {
  step: LessonStep;
  /** The line over the first step: what the little one has found. */
  found?: string;
  little?: boolean;
  onNext(): void;
  /** Absent on the first step. */
  onBack?: () => void;
}) {
  return (
    <div className="lesson">
      {found && <span className="lesson__found">{found}</span>}
      <span className="lesson__object">
        {little && (
          <span className="lesson__little">
            <OurLittleOne />
          </span>
        )}
        <ObjectView object={step.object} />
      </span>
      {step.say.map((line) => (
        <span key={line} className="lesson__line">
          {line}
        </span>
      ))}
      <span className="lesson__moves">
        {onBack && (
          <button type="button" className="lesson__back" onClick={onBack}>
            {huntUiText.back}
          </button>
        )}
        <button type="button" className="lesson__next" onClick={onNext}>
          {huntUiText.next}
        </button>
      </span>
    </div>
  );
}
