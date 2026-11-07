import { hr } from '@/content/text/hr';
import { type GuideStep, type GuideTarget, guideFocus, guideTalks } from '@/fight/guide';

/**
 * The guided first fight's card (fight/guide.ts): Nikola says what to do now, in a line or
 * two. A step he only reads closes with "Dalje"; a step that waits for a move has no
 * button, since the move itself moves on.
 */
export function FightGuide({ step, onNext }: { step: GuideStep; onNext(): void }) {
  const lines = hr.fightGuide.steps[step];
  return (
    <aside
      className="fight__guide"
      data-step={step}
      aria-label={hr.fightGuide.label}
      aria-live="polite"
    >
      <span className="fight__guide-who">{hr.story.speakers.nikola}</span>
      {lines.map((line) => (
        <p key={line} className="fight__guide-text">
          {line}
        </p>
      ))}
      {guideTalks(step) && (
        <button type="button" className="fight__guide-next" onClick={onNext}>
          {step === 'clean' ? hr.fightGuide.last : hr.fightGuide.next}
        </button>
      )}
    </aside>
  );
}

/**
 * The attributes that mark a part of the fight screen for the guide: lit when the step
 * points at it, dimmed when it doesn't, nothing when no guide shows.
 */
export function guideMark(
  step: GuideStep | null,
  target: GuideTarget,
): { 'data-focus'?: true; 'data-dim'?: true } {
  if (step === null) return {};
  return guideFocus(step).includes(target) ? { 'data-focus': true } : { 'data-dim': true };
}
