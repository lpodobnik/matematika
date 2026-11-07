import '@/ui/town/town.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LookId } from '@/city/character';
import { type MapView, mapView, type NodeView } from '@/city/reach';
import type { NodeId } from '@/city/types';
import { findPath, type Point } from '@/city/walk';
import { districtMap } from '@/content/map';
import { rooms } from '@/content/rooms';
import { hr } from '@/content/text/hr';
import { type PersonId, type TownPerson, type TownPlace, town } from '@/content/town';
import { asleepLairs } from '@/fight/settle';
import type { RoomId } from '@/room/types';
import { useGame } from '@/store/store';
import { PartsCounterView } from '@/ui/common/PartsCounter';
import { MapScreen } from '@/ui/map/MapScreen';
import { OpeningPanels } from '@/ui/opening/OpeningScreen';
import { automaton20, looks, personArt, square, squareGateOpen } from '@/ui/town/art';

const authored = rooms.map((room) => room.id);

/** Walking speed, in town units a second. */
const SPEED = 320;
/** The automaton's speed, slower than his. */
const PATROL_SPEED = 60;

/**
 * The town (story 5.0): the square he walks through instead of a list of rooms. It replaces
 * the map as the place he goes after every restart; the district map is a tap away for the
 * rooms that have no street yet. What is open, locked or restored is the map's (city/reach.ts).
 */
export function TownScreen() {
  const roomsDone = useGame((s) => s.save.progress.roomsDone);
  const tools = useGame((s) => s.save.progress.tools);
  const started = useGame((s) => s.save.progress.started);
  const fresh = useGame((s) => s.ui.fresh);
  const economy = useGame((s) => s.save.economy);
  const look = useGame((s) => s.save.character.look);
  const dispatch = useGame((s) => s.dispatch);
  const asleep = useMemo(() => asleepLairs(economy, Date.now()), [economy]);
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
  return (
    <TownBoard
      view={view}
      done={roomsDone}
      fresh={fresh}
      look={look ?? 'look-1'}
      parts={economy.parts}
      wakesIn={(lair) => {
        const at = economy.lairs[lair]?.rewindsAt;
        if (!at || !asleepLairs(economy, Date.now()).includes(lair)) return null;
        return Math.max(1, Math.ceil((Date.parse(at) - Date.now()) / 60_000));
      }}
      onTravel={(node) => dispatch({ type: 'map/travel', node })}
    />
  );
}

interface BoardProps {
  view: MapView;
  done: readonly RoomId[];
  /** The room whose restart just ended: he comes out of it, and its patch blooms. */
  fresh: RoomId | null;
  look: LookId;
  parts: number;
  /** Minutes until a beaten lair's automaton is back (ADR-13); null when it is there. */
  wakesIn(lair: 'lair-20'): number | null;
  onTravel(node: NodeId): void;
}

type Bubble = {
  who: PersonId | 'self';
  at: Point;
  lines: readonly string[];
  line: number;
  intro?: string;
};

/** What happens when he reaches where he was walking to. */
type Errand =
  | { kind: 'place'; place: TownPlace }
  | { kind: 'person'; person: TownPerson }
  | { kind: 'automaton' };

const pct = (p: Point) => ({
  left: `${(p.x / town.width) * 100}%`,
  top: `${(p.y / town.height) * 100}%`,
});

function readMet(): PersonId[] {
  try {
    const raw = localStorage.getItem('matematika:town:met');
    const met: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(met) ? met.filter((id): id is PersonId => id in hr.town.people) : [];
  } catch {
    return [];
  }
}

function writeMet(met: PersonId[]) {
  try {
    localStorage.setItem('matematika:town:met', JSON.stringify(met));
  } catch {
    // A private window: he is introduced again next time.
  }
}

/** The town from props: the square, its machines, people and automaton, and his figure. */
export function TownBoard({ view, done, fresh, look, parts, wakesIn, onTravel }: BoardProps) {
  const nodes = useMemo(() => new Map(view.nodes.map((node) => [node.id, node])), [view]);
  const [start] = useState<Point>(
    () => town.places.find((place) => place.node === fresh)?.stand ?? town.arrive,
  );
  const [walking, setWalking] = useState(false);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [met, setMet] = useState<PersonId[]>(readMet);
  const path = useRef<Point[]>([]);
  const errand = useRef<Errand | null>(null);
  const board = useRef<HTMLDivElement>(null);
  // His figure and the automaton move every frame, so they move through their elements,
  // not through React state: the board renders only when something else changes.
  const meRef = useRef(start);
  const meFacing = useRef<1 | -1>(1);
  const meEl = useRef<HTMLDivElement>(null);
  const botRef = useRef({ at: town.patrol[0] as Point, target: 1, dir: 1, facing: -1 as 1 | -1 });
  const botEl = useRef<HTMLButtonElement>(null);

  const arrived = useCallback(
    (job: Errand | null) => {
      if (!job) return;
      if (job.kind === 'place') {
        const node = nodes.get(job.place.node);
        if (node && (node.state === 'open' || node.state === 'restored')) {
          onTravel(job.place.node);
          return;
        }
        const text =
          job.place.node === 'workshop' ? hr.town.places.workshop : hr.town.places.locked;
        setBubble({ who: 'self', at: job.place.marker, lines: [text], line: 0 });
        return;
      }
      if (job.kind === 'automaton') {
        const lair = nodes.get('lair-20');
        const seen = lair?.state === 'open' || lair?.state === 'winding';
        const wait = wakesIn('lair-20');
        if (seen && wait === null) {
          onTravel('lair-20');
          return;
        }
        const text = wait !== null ? hr.town.places.beaten(wait) : hr.town.places.automaton;
        setBubble({ who: 'self', at: botRef.current.at, lines: [text], line: 0 });
        return;
      }
      const { person } = job;
      const lines = personLines(person, done);
      const first = !met.includes(person.id);
      if (first) {
        const next = [...met, person.id];
        setMet(next);
        writeMet(next);
      }
      meFacing.current = person.at.x >= meRef.current.x ? 1 : -1;
      place(meEl.current, meRef.current, meFacing.current);
      setBubble({
        who: person.id,
        at: person.at,
        lines,
        line: 0,
        intro: first
          ? `${hr.town.people[person.id].name}, ${hr.town.people[person.id].who}`
          : undefined,
      });
    },
    [nodes, onTravel, wakesIn, done, met],
  );

  // One loop moves him along his path and the automaton along its round. It pauses while
  // the district map is open.
  useEffect(() => {
    if (showMap || showIntro) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const next = path.current[0];
      if (next) {
        const at = meRef.current;
        const dx = next.x - at.x;
        const dy = next.y - at.y;
        const d = Math.hypot(dx, dy);
        const step = SPEED * dt;
        if (Math.abs(dx) > 2) meFacing.current = dx > 0 ? 1 : -1;
        if (d <= step) {
          path.current.shift();
          meRef.current = next;
          if (path.current.length === 0) {
            setWalking(false);
            const job = errand.current;
            errand.current = null;
            arrived(job);
          }
        } else {
          meRef.current = { x: at.x + (dx / d) * step, y: at.y + (dy / d) * step };
        }
        place(meEl.current, meRef.current, meFacing.current);
      }
      const b = botRef.current;
      const target = town.patrol[b.target] as Point;
      const bx = target.x - b.at.x;
      const by = target.y - b.at.y;
      const bd = Math.hypot(bx, by);
      const bstep = PATROL_SPEED * dt;
      if (bd <= bstep) {
        b.at = target;
        if (b.target + b.dir < 0 || b.target + b.dir >= town.patrol.length) b.dir = -b.dir;
        b.target += b.dir;
      } else {
        b.at = { x: b.at.x + (bx / bd) * bstep, y: b.at.y + (by / bd) * bstep };
        if (Math.abs(bx) > 2) b.facing = bx > 0 ? 1 : -1;
      }
      place(botEl.current, b.at, b.facing);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [arrived, showMap, showIntro]);

  const walkTo = (target: Point, job: Errand | null) => {
    setBubble(null);
    errand.current = job;
    const route = findPath(town.ground, meRef.current, target);
    // No way there: he stays, and nothing happens.
    if (!route) {
      errand.current = null;
      return;
    }
    path.current = route;
    if (route.length === 0) {
      setWalking(false);
      errand.current = null;
      arrived(job);
      return;
    }
    setWalking(true);
  };

  const toTown = (clientX: number, clientY: number): Point | null => {
    const rect = board.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * town.width,
      y: ((clientY - rect.top) / rect.height) * town.height,
    };
  };

  const restored = town.places.filter((place) => nodes.get(place.node)?.state === 'restored');
  const lampsLit = done.includes('r02');
  // Room 1 lifts the gate: the square is drawn with it open from then on.
  const art = done.includes('r01') ? squareGateOpen : square;
  const people = town.people.filter(
    (person) => person.after === null || done.includes(person.after),
  );
  // The machine to go to next; the map marks one only after room 1, the town from the start.
  const nextPlace =
    town.places.find((place) => nodes.get(place.node)?.next) ??
    (done.length === 0 ? town.places.find((place) => place.node === 'r01') : undefined);
  // The next room is off the square: the map button calls instead.
  const nextOffSquare = !nextPlace && view.nodes.some((node) => node.next);

  return (
    <>
      <main className="town" aria-label={hr.town.label}>
        <div className="town__board" ref={board}>
          <button
            type="button"
            className="town__ground"
            aria-label={hr.town.walk}
            tabIndex={-1}
            onClick={(event) => {
              const p = toTown(event.clientX, event.clientY);
              if (p) walkTo(p, null);
            }}
          >
            <img className="town__art town__art--grey" src={art} alt="" draggable={false} />
            <img
              className="town__art town__art--colour"
              src={art}
              alt=""
              draggable={false}
              style={{
                maskImage: bloomMask(restored, fresh),
                WebkitMaskImage: bloomMask(restored, fresh),
              }}
            />
            {fresh === 'r01' && (
              // Room 1 just restarted: the closed gate fades, and the gate stands open.
              <img className="town__art town__art--closing" src={square} alt="" draggable={false} />
            )}
          </button>
          {lampsLit &&
            town.lamps.map((lamp) => (
              <span
                key={`${lamp.x},${lamp.y}`}
                className="town__glow"
                style={pct(lamp)}
                aria-hidden="true"
              />
            ))}
          {town.places.map((place) => (
            <PlaceButton
              key={place.node}
              place={place}
              node={nodes.get(place.node)}
              onTap={() => walkTo(place.stand, { kind: 'place', place })}
            />
          ))}
          {nextPlace && (
            <span className="town__next" style={pct(nextPlace.marker)} aria-hidden="true">
              <svg viewBox="-20 -28 40 40" aria-hidden="true">
                <path d="M-12 -24 H12 L0 -4 Z" />
              </svg>
            </span>
          )}
          {people.map((person) => (
            <button
              key={person.id}
              type="button"
              className="town__figure town__figure--person"
              data-person={person.id}
              style={{
                ...pct(person.at),
                zIndex: Math.round(person.at.y),
                height: `${(town.figure / town.height) * 100}%`,
              }}
              aria-label={hr.town.people[person.id].name}
              onClick={() =>
                walkTo(
                  {
                    x: person.at.x + (meRef.current.x < person.at.x ? -70 : 70),
                    y: person.at.y + 10,
                  },
                  { kind: 'person', person },
                )
              }
            >
              <img
                src={personArt[person.id]}
                alt=""
                draggable={false}
                style={{ transform: `scaleX(${-person.facing})` }}
              />
            </button>
          ))}
          <button
            type="button"
            ref={botEl}
            className="town__figure town__figure--automaton"
            style={{
              ...pct(town.patrol[0] as Point),
              height: `${((town.figure * 0.62) / town.height) * 100}%`,
            }}
            aria-label={hr.map.nodes['lair-20']}
            onClick={() =>
              walkTo(
                { x: botRef.current.at.x - 90, y: botRef.current.at.y + 10 },
                { kind: 'automaton' },
              )
            }
          >
            <img src={automaton20} alt="" draggable={false} />
          </button>
          <div
            ref={meEl}
            className="town__figure town__figure--me"
            data-walking={walking}
            style={{
              ...pct(start),
              zIndex: Math.round(start.y),
              height: `${(town.figure / town.height) * 100}%`,
            }}
            aria-hidden="true"
          >
            {/* A paper doll: the body, and each leg cut from the same picture, swinging from
                the hip in turn while he walks. */}
            <span className="town__doll">
              <img
                className="town__part town__part--body"
                src={looks[look]}
                alt=""
                draggable={false}
              />
              <img
                className="town__part town__part--leg-l"
                src={looks[look]}
                alt=""
                draggable={false}
              />
              <img
                className="town__part town__part--leg-r"
                src={looks[look]}
                alt=""
                draggable={false}
              />
            </span>
          </div>
          {bubble && (
            <SpeechBubble
              bubble={bubble}
              onNext={() =>
                setBubble((b) =>
                  b && b.line + 1 < b.lines.length
                    ? { ...b, line: b.line + 1, intro: undefined }
                    : null,
                )
              }
            />
          )}
        </div>
        <PartsCounterView shown={parts} visible={parts > 0} flight={null} />
        <button
          type="button"
          className="town__map-button"
          data-next={nextOffSquare}
          aria-label={hr.town.map}
          onClick={() => setShowMap(true)}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M4 8 L11 5 L21 8 L28 5 V24 L21 27 L11 24 L4 27 Z M11 5 V24 M21 8 V27" />
          </svg>
        </button>
        <button
          type="button"
          className="town__intro-button"
          aria-label={hr.town.intro}
          onClick={() => setShowIntro(true)}
        >
          {/* An open book: the story from the start. */}
          <svg viewBox="-20 -16 40 32" aria-hidden="true">
            <path d="M0 -10 Q-8 -14 -17 -11 V11 Q-8 8 0 12 Q8 8 17 11 V-11 Q8 -14 0 -10 Z M0 -10 V12" />
          </svg>
        </button>
      </main>
      {showMap && <MapOverlay onClose={() => setShowMap(false)} />}
      {showIntro && (
        <div className="town__overlay">
          <OpeningPanels onDone={() => setShowIntro(false)} />
        </div>
      )}
    </>
  );
}

/** The district map over the town, for the rooms that have no street yet; Escape closes it. */
function MapOverlay({ onClose }: { onClose(): void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="town__overlay">
      <MapScreen />
      <button type="button" className="town__close" onClick={onClose}>
        {hr.town.close}
      </button>
    </div>
  );
}

/** Moves a figure to `at`, facing `facing` (1 right, -1 left), in front of what stands behind. */
function place(el: HTMLElement | null, at: Point, facing: 1 | -1) {
  if (!el) return;
  el.style.left = `${(at.x / town.width) * 100}%`;
  el.style.top = `${(at.y / town.height) * 100}%`;
  el.style.zIndex = String(Math.round(at.y));
  // The pictures face left (art-src/CREDITS.md), so facing right is the mirror image.
  const img = el.firstElementChild as HTMLElement | null;
  if (img) img.style.transform = `scaleX(${-facing})`;
}

/** A person's lines: before the room that changes them, or after. */
function personLines(person: TownPerson, done: readonly RoomId[]): readonly string[] {
  const text = hr.town.people[person.id];
  return done.includes(person.changesWith) ? text.after : text.before;
}

/**
 * The colour layer's mask: a soft circle of colour over each restored place. The room just
 * restored blooms open (town.css, `town-bloom`).
 */
function bloomMask(restored: readonly TownPlace[], fresh: RoomId | null): string {
  if (restored.length === 0) return 'linear-gradient(transparent, transparent)';
  return restored
    .map((place) => {
      const { x, y, r } = place.bloom;
      const radius = place.node === fresh ? 'var(--bloom)' : `${(r / town.width) * 100}cqw`;
      return `radial-gradient(circle ${radius} at ${(x / town.width) * 100}% ${(y / town.height) * 100}%, #000 62%, transparent 100%)`;
    })
    .join(', ');
}

function PlaceButton({
  place,
  node,
  onTap,
}: {
  place: TownPlace;
  node: NodeView | undefined;
  onTap(): void;
}) {
  const state = node?.state ?? 'closed';
  const label = `${hr.map.nodes[place.node]}, ${hr.map.states[state]}`;
  return (
    <button
      type="button"
      className="town__place"
      data-node={place.node}
      data-state={state}
      style={{
        left: `${(place.area.x / town.width) * 100}%`,
        top: `${(place.area.y / town.height) * 100}%`,
        width: `${(place.area.w / town.width) * 100}%`,
        height: `${(place.area.h / town.height) * 100}%`,
      }}
      aria-label={label}
      onClick={onTap}
    />
  );
}

function SpeechBubble({ bubble, onNext }: { bubble: Bubble; onNext(): void }) {
  const text = bubble.lines[bubble.line] ?? '';
  // Above the speaker when there is room; below one standing near the top of the square.
  const above = bubble.at.y > town.height * 0.48;
  return (
    <button
      type="button"
      className="town__bubble"
      data-who={bubble.who}
      data-above={above}
      aria-live="polite"
      style={{
        ...pct({ x: Math.min(town.width - 300, Math.max(300, bubble.at.x)), y: bubble.at.y }),
        zIndex: 5000,
      }}
      onClick={onNext}
    >
      {bubble.intro && <span className="town__intro">{bubble.intro}</span>}
      <span className="town__line">{text}</span>
    </button>
  );
}
