import '@/ui/map/map.css';
import { useEffect, useMemo, useState } from 'react';
import { type MapView, mapView, type NodeView } from '@/city/reach';
import type { NodeId } from '@/city/types';
import { districtMap } from '@/content/map';
import { rooms } from '@/content/rooms';
import { hr } from '@/content/text/hr';
import { asleepLairs } from '@/fight/settle';
import { ideasByRoom } from '@/room/ideas';
import type { IdeaId, RoomId } from '@/room/types';
import { useGame } from '@/store/store';
import { LockBadge, NodeGlyph } from '@/ui/map/glyphs';
import '@/ui/story/story.css';
import type { PageId } from '@/fight/types';
import { PartsCounterView } from '@/ui/common/PartsCounter';
import { PagesReader } from '@/ui/pages/TornPages';
import { IdeaCards, StoryLines } from '@/ui/story/StoryLines';

const authored = rooms.map((room) => room.id);

/**
 * The city map (story 2.2; FR25, FR27): the district's 19 nodes and their roads, where he
 * goes after every restart and whenever he leaves a room. A room he has finished shows its
 * change in colour, and by shape (ui/map/glyphs.tsx); the room to play next pulses; a room
 * he left halfway carries a page. A tap on a room he can reach takes him there at once.
 * A place he can see but not open yet shows its name, and its lock shows what opens it
 * (story 2.3).
 */
export function MapScreen({ onTravel }: { onTravel?(node: NodeId): void } = {}) {
  const roomsDone = useGame((s) => s.save.progress.roomsDone);
  const tools = useGame((s) => s.save.progress.tools);
  const started = useGame((s) => s.save.progress.started);
  const fresh = useGame((s) => s.ui.fresh);
  const told = useGame((s) => s.save.progress.told);
  const seen = useGame((s) => s.save.progress.ideasSeen);
  const name = useGame((s) => s.save.character.name);
  const economy = useGame((s) => s.save.economy);
  const pages = useGame((s) => s.save.progress.tornPages);
  const dispatch = useGame((s) => s.dispatch);
  // A winding-down automaton rewinds on the clock (ADR-13), so the map looks again each half
  // minute while one is asleep.
  const [now, tick] = useNow();
  const asleep = useMemo(() => asleepLairs(economy, now), [economy, now]);
  useEffect(() => tick(asleep.length > 0), [asleep.length, tick]);
  const view = useMemo(
    () =>
      mapView(
        districtMap,
        {
          roomsDone,
          tools,
          started: started.map((room) => room.id),
          fresh,
          asleep,
          piles: economy.piles,
        },
        authored,
      ),
    [roomsDone, tools, started, fresh, asleep, economy.piles],
  );
  const wakes = Object.fromEntries(
    asleep.map((id) => [id, minutesUntil(economy.lairs[id]?.rewindsAt, now)]),
  );
  return (
    <MapBoard
      view={view}
      told={told}
      seen={seen}
      name={name}
      wakes={wakes}
      pages={pages}
      parts={economy.parts}
      onTravel={onTravel ?? ((node) => dispatch({ type: 'map/travel', node }))}
    />
  );
}

/** The time now, looked at again every 30 s while ticking is on. */
function useNow(): [number, (on: boolean) => void] {
  const [now, setNow] = useState(() => Date.now());
  const [ticking, setTicking] = useState(false);
  useEffect(() => {
    if (!ticking) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [ticking]);
  return [now, setTicking];
}

/** Whole minutes from `now` until `at`, at least 1. */
function minutesUntil(at: string | undefined, now: number): number {
  const ms = at ? Date.parse(at) - now : 0;
  return Math.max(1, Math.ceil(ms / 60_000));
}

interface BoardProps {
  view: MapView;
  /** Rooms whose lines he has been told, in order: the city's log (story 2.5). */
  told?: readonly RoomId[];
  /** Ideas whose explanation card he has seen (story 2.6). */
  seen?: readonly IdeaId[];
  name?: string | null;
  /** Lairs winding down: the minutes until each rewinds (story 3.3). */
  wakes?: Readonly<Partial<Record<NodeId, number>>>;
  /** Torn pages fights have returned (story 3.4); their button shows once he has one. */
  pages?: readonly PageId[];
  /** His parts, on the counter in the board's corner once he has any (story 3.6). */
  parts?: number;
  onTravel(node: NodeId): void;
  /** For tests: the log starts open. */
  logOpen?: boolean;
}

/**
 * The map from props only. The board keeps the map's shape, 1600 × 1000, and fits the
 * screen; roads are drawn in an SVG under it, and each node is a button placed over its
 * spot, at least 56 CSS px, so it stays easy to hit however small the board is.
 */
export function MapBoard({
  view,
  told = [],
  seen = [],
  name = null,
  wakes = {},
  pages = [],
  parts = 0,
  onTravel,
  logOpen = false,
}: BoardProps) {
  const [log, setLog] = useState(logOpen);
  const [reading, setReading] = useState(false);
  return (
    <main className="map">
      <div className="map__board">
        <svg className="map__roads" viewBox="0 0 1600 1000" aria-hidden="true">
          {view.roads.map((road) => (
            <line
              key={`${road.from.x},${road.from.y}-${road.to.x},${road.to.y}`}
              x1={road.from.x}
              y1={road.from.y}
              x2={road.to.x}
              y2={road.to.y}
              className={road.travelled ? 'map__road map__road--travelled' : 'map__road'}
            />
          ))}
        </svg>
        <h1 className="map__title">{hr.map.title}</h1>
        {view.nodes.map((node) => (
          <MapNode key={node.id} node={node} wake={wakes[node.id] ?? null} onTravel={onTravel} />
        ))}
        {view.allDone && <p className="map__note">{hr.app.toBeContinued}</p>}
        <PartsCounterView shown={parts} visible={parts > 0} flight={null} />
        {pages.length > 0 && (
          <button
            type="button"
            className="map__log-button map__pages-button"
            aria-label={hr.pages.open}
            onClick={() => setReading(true)}
          >
            {/* A page torn along its top edge. */}
            <svg viewBox="-20 -16 40 32" aria-hidden="true">
              <path d="M-11 -11 L-6 -14 L-1 -10 L4 -14 L8 -10 L11 -12 V14 H-11 Z" />
              <path d="M-7 -4 H7 M-7 1 H7 M-7 6 H3" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className="map__log-button"
          aria-label={hr.story.log.open}
          onClick={() => setLog(true)}
        >
          {/* An open book: the city's log. */}
          <svg viewBox="-20 -16 40 32" aria-hidden="true">
            <path d="M0 -10 Q-8 -14 -17 -11 V11 Q-8 8 0 12 Q8 8 17 11 V-11 Q8 -14 0 -10 Z M0 -10 V12" />
            <path d="M-13 -5 H-5 M-13 0 H-5 M5 -5 H13 M5 0 H13" />
          </svg>
        </button>
      </div>
      {log && <CityLog told={told} seen={seen} name={name} onClose={() => setLog(false)} />}
      {reading && <PagesReader pages={pages} onClose={() => setReading(false)} />}
    </main>
  );
}

function MapNode({
  node,
  wake,
  onTravel,
}: {
  node: NodeView;
  /** A winding-down lair: minutes until it rewinds. */
  wake: number | null;
  onTravel(node: NodeId): void;
}) {
  const name = hr.map.nodes[node.id];
  // Seen, he knows its name; only a room he can travel to takes a tap (story 2.3).
  const named = node.state !== 'closed';
  const reachable = node.state === 'open' || node.state === 'restored';
  const parts: string[] = [name, hr.map.states[node.state]];
  if (node.state === 'winding' && wake !== null) parts.push(hr.map.wakes(wake));
  if (node.pile > 0) parts.push(hr.map.pile(node.pile));
  const label = named ? parts.join(', ') : hr.map.states.closed;
  return (
    <button
      type="button"
      className="map__node"
      data-node={node.id}
      data-kind={node.kind}
      data-state={node.state}
      data-next={node.next}
      data-fresh={node.fresh}
      style={{ left: `${(node.x / 1600) * 100}%`, top: `${(node.y / 1000) * 100}%` }}
      disabled={!reachable}
      aria-label={node.started ? `${label}, ${hr.map.started}` : label}
      onClick={() => onTravel(node.id)}
    >
      <svg className="map__glyph" viewBox="-50 -50 100 100" aria-hidden="true">
        {node.next && <circle r="47" className="map__pulse" />}
        <NodeGlyph id={node.id} kind={node.kind} state={node.state} />
        {node.state === 'locked' && <LockBadge lock={node.lock} />}
        {node.started && (
          <path
            d="M22 -46 H42 V-20 H22 Z M26 -40 H38 M26 -33 H38 M26 -26 H34"
            className="map__page"
          />
        )}
      </svg>
      {named && <span className="map__name">{name}</span>}
      {node.plate && <span className="map__plate">{node.plate}</span>}
      {node.state === 'winding' && wake !== null && (
        <span className="map__plate">{hr.map.wakes(wake)}</span>
      )}
      {node.pile > 0 && (
        <span className="map__pile" aria-hidden="true">
          {node.pile}
        </span>
      )}
    </button>
  );
}

/**
 * The city's log (story 2.5; narrative design, In-Game Storytelling): every line he has
 * been told, and every explanation card he has seen, room by room in the order he restarted
 * them, to read again.
 */
function CityLog({
  told,
  seen,
  name,
  onClose,
}: {
  told: readonly RoomId[];
  seen: readonly IdeaId[];
  name: string | null;
  onClose(): void;
}) {
  const ideas = ideasByRoom(told, seen, rooms);
  return (
    <section className="map__log" aria-label={hr.story.log.open}>
      <div className="map__log-head">
        <h2 className="map__log-title">{hr.story.log.open}</h2>
        <button type="button" className="story__next" onClick={onClose}>
          {hr.story.log.close}
        </button>
      </div>
      {told.length === 0 && <p className="story__text">{hr.story.log.empty}</p>}
      {told.map((room) => (
        <article key={room} className="map__log-room">
          <h3 className="story__room">{hr.map.nodes[room]}</h3>
          <StoryLines room={room} name={name} />
          <IdeaCards ideas={ideas.get(room) ?? []} />
        </article>
      ))}
    </section>
  );
}
