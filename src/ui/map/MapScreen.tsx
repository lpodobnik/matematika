import '@/ui/map/map.css';
import { useMemo, useState } from 'react';
import { type MapView, mapView, type NodeView } from '@/city/reach';
import type { NodeId } from '@/city/types';
import { districtMap } from '@/content/map';
import { rooms } from '@/content/rooms';
import { hr } from '@/content/text/hr';
import type { RoomId } from '@/room/types';
import { useGame } from '@/store/store';
import { LockBadge, NodeGlyph } from '@/ui/map/glyphs';
import '@/ui/story/story.css';
import { StoryLines } from '@/ui/story/StoryLines';

const authored = rooms.map((room) => room.id);

/**
 * The city map (story 2.2; FR25, FR27): the district's 19 nodes and their roads, where he
 * goes after every restart and whenever he leaves a room. A room he has finished shows its
 * change in colour, and by shape (ui/map/glyphs.tsx); the room to play next pulses; a room
 * he left halfway carries a page. A tap on a room he can reach takes him there at once.
 * A place he can see but not open yet shows its name, and its lock shows what opens it
 * (story 2.3).
 */
export function MapScreen() {
  const roomsDone = useGame((s) => s.save.progress.roomsDone);
  const tools = useGame((s) => s.save.progress.tools);
  const started = useGame((s) => s.save.progress.started);
  const fresh = useGame((s) => s.ui.fresh);
  const told = useGame((s) => s.save.progress.told);
  const name = useGame((s) => s.save.character.name);
  const dispatch = useGame((s) => s.dispatch);
  const view = useMemo(
    () =>
      mapView(
        districtMap,
        { roomsDone, tools, started: started.map((room) => room.id), fresh },
        authored,
      ),
    [roomsDone, tools, started, fresh],
  );
  return (
    <MapBoard
      view={view}
      told={told}
      name={name}
      onTravel={(node) => dispatch({ type: 'map/travel', node })}
    />
  );
}

interface BoardProps {
  view: MapView;
  /** Rooms whose lines he has been told, in order: the city's log (story 2.5). */
  told?: readonly RoomId[];
  name?: string | null;
  onTravel(node: NodeId): void;
  /** For tests: the log starts open. */
  logOpen?: boolean;
}

/**
 * The map from props only. The board keeps the map's shape, 1600 × 1000, and fits the
 * screen; roads are drawn in an SVG under it, and each node is a button placed over its
 * spot, at least 56 CSS px, so it stays easy to hit however small the board is.
 */
export function MapBoard({ view, told = [], name = null, onTravel, logOpen = false }: BoardProps) {
  const [log, setLog] = useState(logOpen);
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
          <MapNode key={node.id} node={node} onTravel={onTravel} />
        ))}
        {view.allDone && <p className="map__note">{hr.app.toBeContinued}</p>}
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
      {log && <CityLog told={told} name={name} onClose={() => setLog(false)} />}
    </main>
  );
}

function MapNode({ node, onTravel }: { node: NodeView; onTravel(node: NodeId): void }) {
  const name = hr.map.nodes[node.id];
  // Seen, he knows its name; only a room he can travel to takes a tap (story 2.3).
  const named = node.state !== 'closed';
  const reachable = node.state === 'open' || node.state === 'restored';
  const label = named ? `${name}, ${hr.map.states[node.state]}` : hr.map.states.closed;
  return (
    <button
      type="button"
      className="map__node"
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
    </button>
  );
}

/**
 * The city's log (story 2.5; narrative design, In-Game Storytelling): every line he has
 * been told, room by room in the order he restarted them, to read again.
 */
function CityLog({
  told,
  name,
  onClose,
}: {
  told: readonly RoomId[];
  name: string | null;
  onClose(): void;
}) {
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
        </article>
      ))}
    </section>
  );
}
