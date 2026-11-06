import { hr } from '@/content/text/hr';
import type { RoomId } from '@/room/types';

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
          <span className="story__who">{hr.story.speakers[line.who]}</span>
          <p className="story__text">{lineText(line, name)}</p>
        </li>
      ))}
    </ul>
  );
}
