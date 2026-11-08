import '@/ui/workshop/workshop.css';
import { useEffect, useRef, useState } from 'react';
import { hr } from '@/content/text/hr';
import { decodeRoom } from '@/links/room-link';
import { useGame } from '@/store/store';
import type { SentRoom } from '@/store/types';
import { ShareLink } from '@/ui/common/ShareLink';
import { roomUrl } from '@/ui/workshop/links';
import { roomTitleText } from '@/ui/workshop/room-title';
import { equations } from '@/workshop/design';

/**
 * The workshop's half of the counter (epic 5): "Napravi stroj", and the wall where the rooms
 * he sent hang with their stamps (GDD, Reply link), newest first. A reply link that has just
 * come in is named over the wall.
 */
export function WorkshopWall() {
  const rooms = useGame((s) => s.save.workshop.rooms);
  const flow = useGame((s) => s.ui.workshop);
  const dispatch = useGame((s) => s.dispatch);
  const replied = flow?.step === 'reply' ? rooms.find((room) => room.id === flow.id) : undefined;
  const reply = useRef<HTMLParagraphElement>(null);
  // A reply that has just come in shows at once, on a phone too, where the wall is below.
  const repliedId = replied?.id;
  useEffect(() => {
    if (repliedId) reply.current?.scrollIntoView({ block: 'center' });
  }, [repliedId]);
  return (
    <section className="wall" aria-label={hr.workshop.wall}>
      <div className="wall__build">
        <button
          type="button"
          className="workshop__primary"
          onClick={() => dispatch({ type: 'workshop/open' })}
        >
          {hr.workshop.open}
        </button>
        <span className="workshop__hint">{hr.workshop.openWhat}</span>
      </div>
      {replied?.stamp && (
        <p ref={reply} className="wall__reply" role="status">
          {hr.workshop.reply(roomTitleText(replied.title), hr.workshop.stamps[replied.stamp])}
        </p>
      )}
      <h2 className="workshop__name">{hr.workshop.wall}</h2>
      {rooms.length === 0 ? (
        <p className="workshop__hint">{hr.workshop.wallEmpty}</p>
      ) : (
        <ul className="wall__list">
          {[...rooms].reverse().map((room) => (
            <WallRoom key={room.id} room={room} fresh={room.id === replied?.id} />
          ))}
        </ul>
      )}
    </section>
  );
}

function WallRoom({ room, fresh }: { room: SentRoom; fresh: boolean }) {
  const [open, setOpen] = useState(false);
  const payload = decodeRoom(room.payload);
  const name = roomTitleText(room.title);
  return (
    <li
      className="wall__room"
      data-room={room.id}
      data-stamp={room.stamp ?? 'none'}
      data-fresh={fresh}
    >
      <div className="wall__card">
        <h3 className="wall__title">{name}</h3>
        <p className="wall__equations">{payload ? equations(payload.design).join(' → ') : ''}</p>
        <span className="wall__stamp">
          {room.stamp ? hr.workshop.stamps[room.stamp] : hr.workshop.stamps.none}
        </span>
        <button
          type="button"
          className="workshop__small"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {hr.workshop.link}
        </button>
      </div>
      {open && (
        <ShareLink url={roomUrl(room.payload)} text={hr.workshop.shareText(name)} kind="room" />
      )}
    </li>
  );
}
