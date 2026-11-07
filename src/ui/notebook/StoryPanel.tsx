import { hr } from '@/content/text/hr';
import type { StoryView } from '@/room/story';
import { primaryPress } from '@/ui/notebook/pad-keys';

interface Props {
  view: StoryView;
  onFlag(index: number): void;
  onConfirm(): void;
}

/**
 * A story stage's story at the top of the notebook (story 4.5; GDD, Room types: Story). In
 * a building stage, the story he writes as an equation; it stays there once written. In a
 * choosing stage, the stories to choose from: while the pin is offered each is a button
 * that flags it, with the pin's confirm under them once one is flagged; once the pin is tested, the
 * story that fits stands alone.
 */
export function StoryPanel({ view, onFlag, onConfirm }: Props) {
  if (view.build) {
    return (
      <section className="story-panel" data-build aria-label={hr.stories.label}>
        <p className="story-panel__story" data-written={view.written || undefined}>
          {hr.stories[view.build]}
        </p>
      </section>
    );
  }
  if (view.right !== null) {
    const key = view.options[view.right];
    return key ? (
      <section className="story-panel" aria-label={hr.stories.label}>
        <p className="story-panel__story" data-written>
          {hr.stories[key]}
        </p>
      </section>
    ) : null;
  }
  return (
    <section className="story-panel" aria-label={hr.stories.label}>
      <ol className="story-panel__options">
        {view.options.map((key, i) => (
          <li key={key} className="story-panel__option">
            <button
              type="button"
              tabIndex={-1}
              className="story-panel__choice"
              aria-pressed={view.at === i}
              aria-label={`${hr.stories.flag(i + 1)}: ${hr.stories[key]}`}
              disabled={!view.asks}
              onPointerDown={(event) => primaryPress(event, () => onFlag(i))}
            >
              <span className="story-panel__flag" aria-hidden="true">
                {view.at === i ? '⚑' : ''}
              </span>
              <span className="story-panel__text">{hr.stories[key]}</span>
            </button>
          </li>
        ))}
      </ol>
      {view.confirmable && (
        <button
          type="button"
          tabIndex={-1}
          className="story-panel__confirm"
          onPointerDown={(event) => primaryPress(event, onConfirm)}
        >
          {hr.stories.confirm}
        </button>
      )}
    </section>
  );
}
