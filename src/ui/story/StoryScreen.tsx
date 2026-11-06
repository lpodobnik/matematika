import '@/ui/story/story.css';
import { rooms } from '@/content/rooms';
import { hr } from '@/content/text/hr';
import { newIdeas } from '@/room/ideas';
import type { IdeaId, RoomId } from '@/room/types';
import { useGame } from '@/store/store';
import { IdeaCards, StoryLines } from '@/ui/story/StoryLines';

/**
 * The story card (story 2.5; narrative design, In-Game Storytelling): the first time a
 * room's restart ends, the city answers in one or two lines, between rooms and never during
 * one. The first time a room uses an idea, its explanation card follows (story 2.6). "Dalje"
 * goes on to what comes next. Every line and card can be read again in the city's log.
 */
export function StoryScreen() {
  const room = useGame((s) => {
    const { roomsDone, told } = s.save.progress;
    return roomsDone.find((id) => !told.includes(id)) ?? null;
  });
  const name = useGame((s) => s.save.character.name);
  const seen = useGame((s) => s.save.progress.ideasSeen);
  const dispatch = useGame((s) => s.dispatch);
  if (!room) return null;
  // The ideas this room explains: its own, less those an earlier room explained (story 2.6).
  const ideas = newIdeas(rooms.find((spec) => spec.id === room)?.ideas ?? [], seen);
  return (
    <StoryCard
      room={room}
      name={name}
      ideas={ideas}
      onNext={() => dispatch({ type: 'story/next' })}
    />
  );
}

/** The card from props only. */
export function StoryCard({
  room,
  name,
  ideas = [],
  onNext,
}: {
  room: RoomId;
  name: string | null;
  ideas?: readonly IdeaId[];
  onNext(): void;
}) {
  return (
    <main className="story">
      <section className="story__card">
        <h1 className="story__room">{hr.map.nodes[room]}</h1>
        <div className="story__body">
          <StoryLines room={room} name={name} />
          <IdeaCards ideas={ideas} />
          <button type="button" className="story__next" onClick={onNext}>
            {hr.story.next}
          </button>
        </div>
      </section>
    </main>
  );
}
