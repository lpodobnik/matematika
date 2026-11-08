import { hr } from '@/content/text/hr';
import type { IdeaId, RoomId } from '@/room/types';

type Rooms = typeof hr.story.rooms;
type Line = Rooms[keyof Rooms][number];

/** A room's story lines (story 2.5), or none for a room whose lines aren't written yet. */
export function storyLines(room: RoomId): readonly Line[] {
  return (hr.story.rooms as Partial<Record<RoomId, readonly Line[]>>)[room] ?? [];
}

/** A line as it reads, with his name where it takes one. */
export function lineText(line: Line, name: string | null): string {
  return typeof line.text === 'function' ? line.text(name ?? hr.story.noName) : line.text;
}

/**
 * A room's lines, each with who says it. Townspeople speak in bubbles; Kristijan's lines are
 * a note in his hand, and the First Automaton's a punched-tape notice (narrative design,
 * Found Documents).
 */
export function StoryLines({ room, name }: { room: RoomId; name: string | null }) {
  return (
    <ul className="story__lines">
      {storyLines(room).map((line) => (
        <li key={`${line.who}-${lineText(line, name)}`} className="story__item" data-who={line.who}>
          <span className="story__who">
            {hr.story.speakers[line.who]}
            <span className="story__role">{hr.story.roles[line.who]}</span>
          </span>
          <p className="story__text">{lineText(line, name)}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Explanation cards (story 2.6, FR34): Nikola asks how, and each card gives the name school
 * uses for the idea, in one or two sentences.
 */
export function IdeaCards({ ideas }: { ideas: readonly IdeaId[] }) {
  if (ideas.length === 0) return null;
  return (
    <div className="story__ideas">
      <div className="story__item" data-who="nikola">
        <span className="story__who">
          {hr.story.speakers.nikola}
          <span className="story__role">{hr.story.roles.nikola}</span>
        </span>
        <p className="story__text">{hr.ideas.ask}</p>
      </div>
      {ideas.map((idea) => (
        <section key={idea} className="story__idea" data-idea={idea}>
          <p className="story__term">{hr.ideas.cards[idea].term}</p>
          <p className="story__explain">{hr.ideas.cards[idea].text}</p>
        </section>
      ))}
    </div>
  );
}
