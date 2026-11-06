import '@/ui/map/map.css';
import { useMemo } from 'react';
import { type MapView, mapView, type NodeView } from '@/city/reach';
import type { NodeId } from '@/city/types';
import { districtMap } from '@/content/map';
import { rooms } from '@/content/rooms';
import { hr } from '@/content/text/hr';
import { useGame } from '@/store/store';
import { NodeGlyph } from '@/ui/map/glyphs';

const authored = rooms.map((room) => room.id);

/**
 * The city map (story 2.2; FR25, FR27): the district's 19 nodes and their roads, where he
 * goes after every restart and whenever he leaves a room. A room he has finished shows its
 * change in colour, and by shape (ui/map/glyphs.tsx); the room to play next pulses; a room
 * he left halfway carries a page. A tap on a room he can reach takes him there at once.
 */
export function MapScreen() {
  const roomsDone = useGame((s) => s.save.progress.roomsDone);
  const started = useGame((s) => s.save.progress.started);
  const fresh = useGame((s) => s.ui.fresh);
  const dispatch = useGame((s) => s.dispatch);
  const view = useMemo(
    () =>
      mapView(districtMap, { roomsDone, started: started.map((room) => room.id), fresh }, authored),
    [roomsDone, started, fresh],
  );
  return <MapBoard view={view} onTravel={(node) => dispatch({ type: 'map/travel', node })} />;
}

interface BoardProps {
  view: MapView;
  onTravel(node: NodeId): void;
}

/**
 * The map from props only. The board keeps the map's shape, 1600 × 1000, and fits the
 * screen; roads are drawn in an SVG under it, and each node is a button placed over its
 * spot, at least 56 CSS px, so it stays easy to hit however small the board is.
 */
export function MapBoard({ view, onTravel }: BoardProps) {
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
      </div>
    </main>
  );
}

function MapNode({ node, onTravel }: { node: NodeView; onTravel(node: NodeId): void }) {
  const name = hr.map.nodes[node.id];
  const reachable = node.state !== 'closed';
  const label = reachable ? `${name}, ${hr.map.states[node.state]}` : hr.map.states.closed;
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
        {node.started && (
          <path
            d="M22 -46 H42 V-20 H22 Z M26 -40 H38 M26 -33 H38 M26 -26 H34"
            className="map__page"
          />
        )}
      </svg>
      {reachable && <span className="map__name">{name}</span>}
    </button>
  );
}
