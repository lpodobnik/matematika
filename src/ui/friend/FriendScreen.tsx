import '@/ui/friend/friend.css';
import { useEffect, useState } from 'react';
import { hr } from '@/content/text/hr';
import { formatTokens } from '@/math/format';
import { tokenize } from '@/math/tokens';
import { useGame } from '@/store/store';
import type { FriendFlow } from '@/store/types';
import { ShareLink } from '@/ui/common/ShareLink';
import { gameUrl, replyUrl } from '@/ui/workshop/links';
import { roomTitleText } from '@/ui/workshop/room-title';
import { equations, type RoomPayload } from '@/workshop/design';

/**
 * A friend's side of a room link (epic 5; GDD, Friend's side and Giving up): the welcome,
 * the card after the intro machine, and the end, cracked or given up, with the reply link
 * and the offer to play the game. A link that doesn't read is a broken machine.
 */
export function FriendScreen() {
  const friend = useGame((s) => s.ui.friend);
  const dispatch = useGame((s) => s.dispatch);
  if (!friend) return null;
  return <FriendCard friend={friend} onNext={() => dispatch({ type: 'friend/next' })} />;
}

/** The friend's cards from props only. */
export function FriendCard({ friend, onNext }: { friend: FriendFlow; onNext(): void }) {
  const name = friend.room ? roomTitleText(friend.room.title) : '';
  return (
    <main className="friend" data-step={friend.step}>
      <div className="friend__card">
        {friend.step === 'welcome' && (
          <>
            <h1 className="friend__title">{hr.friend.welcomeTitle}</h1>
            <p className="friend__name">„{name}“</p>
            <p>{hr.friend.welcome(name)}</p>
            {friend.newToGame && <p>{hr.friend.newHere}</p>}
            <button type="button" className="friend__primary" onClick={onNext}>
              {hr.friend.go}
            </button>
          </>
        )}
        {friend.step === 'ready' && (
          <>
            <h1 className="friend__title">{hr.friend.readyTitle}</h1>
            <p>{hr.friend.ready}</p>
            <button type="button" className="friend__primary" onClick={onNext}>
              {hr.friend.toRoom}
            </button>
          </>
        )}
        {friend.step === 'cracked' && (
          <>
            <h1 className="friend__title">{hr.friend.crackedTitle}</h1>
            <p className="friend__name">„{name}“</p>
            <p>{hr.friend.cracked}</p>
            <ShareLink
              url={replyUrl(friend.id, 'cracked')}
              text={hr.friend.replyText}
              kind="reply"
            />
            <PlayOffer />
          </>
        )}
        {friend.step === 'gave-up' && friend.room && (
          <>
            <h1 className="friend__title">{hr.friend.gaveUpTitle}</h1>
            <p>{hr.friend.gaveUp}</p>
            <Playback room={friend.room} />
            <p>{hr.friend.replyWhat}</p>
            <ShareLink
              url={replyUrl(friend.id, 'uncracked')}
              text={hr.friend.replyText}
              kind="reply"
            />
            <PlayOffer />
          </>
        )}
        {friend.step === 'broken' && (
          <>
            <h1 className="friend__title">{hr.friend.brokenTitle}</h1>
            <p>{hr.friend.broken}</p>
            <PlayOffer />
          </>
        )}
      </div>
    </main>
  );
}

/** The builder's written solution, a line at a time, as the machine plays it (FR50). */
function Playback({ room }: { room: RoomPayload }) {
  const all = room.solution.flat().length;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= all) return;
    const timer = setTimeout(() => setShown((n) => n + 1), 700);
    return () => clearTimeout(timer);
  }, [shown, all]);
  const eqs = equations(room.design);
  let count = 0;
  return (
    <div className="friend__solution">
      {room.solution.map((lines, stage) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: machines are in a fixed order
        <ol key={stage} className="friend__lines">
          {room.solution.length > 1 && (
            <li className="friend__machine">{hr.friend.machine(stage + 1)}</li>
          )}
          <li className="friend__given">{eqs[stage]}</li>
          {lines.map((line, i) => {
            count += 1;
            return count <= shown ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: his lines are in a fixed order
              <li key={i} className="friend__line">
                {display(line)}
              </li>
            ) : null;
          })}
        </ol>
      ))}
    </div>
  );
}

function display(line: string): string {
  const tokens = tokenize(line);
  return tokens.ok ? formatTokens(tokens.tokens) : line;
}

/** The offer to start the game (GDD: "and an offer to start the game and build their own"). */
function PlayOffer() {
  return (
    <div className="friend__play">
      <span>{hr.friend.playWhat}</span>
      <button
        type="button"
        className="friend__secondary"
        onClick={() => location.replace(gameUrl())}
      >
        {hr.friend.play}
      </button>
    </div>
  );
}
