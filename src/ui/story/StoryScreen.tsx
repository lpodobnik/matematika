import '@/ui/story/story.css';
import { hr } from '@/content/text/hr';
import type { RoomId } from '@/room/types';
import { useGame } from '@/store/store';
import { StoryLines } from '@/ui/story/StoryLines';

/**
 * The story card (story 2.5; narrative design, In-Game Storytelling): the first time a
 * room's restart ends, the city answers in one or two lines, between rooms and never during
 * one. "Dalje" goes on to what comes next. Every line can be read again in the city's log.
 */
export function StoryScreen() {
  const room = useGame((s) => {
    const { roomsDone, told } = s.save.progress;
    return roomsDone.find((id) => !told.includes(id)) ?? null;
  });
  const name = useGame((s) => s.save.character.name);
  const dispatch = useGame((s) => s.dispatch);
  if (!room) return null;
  return <StoryCard room={room} name={name} onNext={() => dispatch({ type: 'story/next' })} />;
}

/** The card from props only. */
export function StoryCard({
  room,
  name,
  onNext,
}: {
  room: RoomId;
  name: string | null;
  onNext(): void;
}) {
  return (
    <main className="story">
      <section className="story__card">
        <h1 className="story__room">{hr.map.nodes[room]}</h1>
        <StoryLines room={room} name={name} />
        <button type="button" className="story__next" onClick={onNext}>
          {hr.story.next}
        </button>
      </section>
    </main>
  );
}
