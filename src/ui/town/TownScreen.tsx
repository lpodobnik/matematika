import '@/ui/town/town.css';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { LookId } from '@/city/character';
import { type MapView, mapView } from '@/city/reach';
import type { NodeId } from '@/city/types';
import { findPath, type Point } from '@/city/walk';
import { tuning } from '@/config/tuning';
import { lairs } from '@/content/lairs';
import { districtMap } from '@/content/map';
import { rooms } from '@/content/rooms';
import { hr } from '@/content/text/hr';
import {
  type AreaId,
  areaOf,
  type PersonId,
  streetRestored,
  type TownExit,
  type TownPerson,
  type TownPlace,
  town,
} from '@/content/town';
import { asleepLairs } from '@/fight/settle';
import type { LairId } from '@/fight/types';
import { playersHash } from '@/lib/player';
import type { RoomId } from '@/room/types';
import { useGame } from '@/store/store';
import { PartsCounterView } from '@/ui/common/PartsCounter';
import { Automaton } from '@/ui/fight/fight-art';
import { logbookArt, outroArt } from '@/ui/opening/art';
import { OpeningPanels, StoryPanels } from '@/ui/opening/OpeningScreen';
import { areaArt, areaChange, lookFacing, looks, personArt, personFacing } from '@/ui/town/art';
import { bloomMask, pct, place, rectStyle, sameRect } from '@/ui/town/town-geometry';
import { type Bubble, ExitSign, MapOverlay, PlaceButton, SpeechBubble } from '@/ui/town/town-parts';
import {
  readMet,
  readOutroSeen,
  readWhere,
  writeMet,
  writeOutroSeen,
  writeWhere,
} from '@/ui/town/town-storage';
import { botAt, useTownLoop } from '@/ui/town/use-town-loop';
import { useTownSound } from '@/ui/town/use-town-sound';

const authored = rooms.map((room) => room.id);

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
      beaten={(lair) => economy.lairs[lair] !== undefined}
      canBuy={Object.entries(tuning.upgrades).some(
        ([id, upgrade]) =>
          !(economy.upgrades as readonly string[]).includes(id) && economy.parts >= upgrade.cost,
      )}
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
  wakesIn(lair: LairId): number | null;
  /** Whether he has ever beaten a lair's automaton. */
  beaten(lair: LairId): boolean;
  /** He has the parts for something the workshop still sells. */
  canBuy: boolean;
  onTravel(node: NodeId): void;
}

/** What happens when he reaches where he was walking to. */
type Errand =
  | { kind: 'place'; place: TownPlace }
  | { kind: 'person'; person: TownPerson }
  | { kind: 'automaton'; at: Point }
  | { kind: 'exit'; exit: TownExit };

/** The rooms that give the tools gates ask for (content/map.ts). */
const toolRooms: Record<string, RoomId> = {
  balance: 'r03',
  workshop: 'r06',
  chain: 'r07',
  drum: 'r12',
};

/** The machines a locked place waits for, by name: its gate's rooms and tool rooms not done. */
function waitsFor(node: NodeId, done: readonly RoomId[]): string[] {
  const gate = districtMap.nodes.find((n) => n.id === node)?.gate;
  if (!gate || gate.sealed) return [];
  const rooms = [
    ...(gate.rooms ?? []),
    ...(gate.tools ?? []).flatMap((tool) => (toolRooms[tool] ? [toolRooms[tool]] : [])),
  ] as RoomId[];
  return [...new Set(rooms)]
    .filter((room) => !done.includes(room))
    .map((room) => hr.map.nodes[room]);
}

/** The town from props: the square, its machines, people and automaton, and his figure. */
export function TownBoard({
  view,
  done,
  fresh,
  look,
  parts,
  wakesIn,
  beaten,
  canBuy,
  onTravel,
}: BoardProps) {
  const nodes = useMemo(() => new Map(view.nodes.map((node) => [node.id, node])), [view]);
  // He comes out where he went in: the area holding the room just restarted, or else the
  // street and spot he left from (a fight, a room left halfway), or else the square.
  const [where] = useState(() => (fresh ? null : readWhere()));
  const [areaId, setAreaId] = useState<AreaId>(() => areaOf(fresh) ?? where?.area ?? town.start);
  const area = town.areas[areaId];
  useTownSound(areaId);
  const [start, setStart] = useState<Point>(
    () =>
      area.places.find((place) => place.node === fresh)?.stand ??
      (where?.area === areaId ? where.at : area.arrive),
  );
  const areaRef = useRef(areaId);
  areaRef.current = areaId;
  const [walking, setWalking] = useState(false);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [slides, setSlides] = useState<'logbook' | 'outro' | null>(() => {
    if (fresh === 'r07') return 'logbook';
    return done.includes('r13') && beaten('lair-60') && !readOutroSeen() ? 'outro' : null;
  });
  const [met, setMet] = useState<PersonId[]>(readMet);
  const board = useRef<HTMLDivElement>(null);
  const lookRef = useRef(look);
  lookRef.current = look;
  const lairHere = useRef(area.lair);
  lairHere.current = area.lair;
  const arrivedRef = useRef<(job: Errand | null) => void>(() => {});
  // His figure and the automaton move every frame, so they move through their elements,
  // not through React state: the board renders only when something else changes.
  const { meRef, meFacing, meEl, path, errand, botRef, botEl } = useTownLoop<Errand>({
    start,
    patrol: area.patrol,
    picture: () => lookFacing[lookRef.current],
    paused: showMap || showIntro || slides !== null,
    onStopped: () => setWalking(false),
    onArrive: (job) => arrivedRef.current(job),
  });

  const arrived = useCallback(
    (job: Errand | null) => {
      if (!job) return;
      if (job.kind === 'exit') {
        // Into the next area, where he comes out at the way in.
        const { to, arrive } = job.exit;
        setAreaId(to);
        meRef.current = arrive;
        setStart(arrive);
        botRef.current = botAt(town.areas[to].patrol);
        setBubble(null);
        return;
      }
      if (job.kind === 'place') {
        const node = nodes.get(job.place.node);
        // A machine he has fixed runs on; he doesn't go back in (the district map still can).
        if (node?.state === 'restored' && node.kind === 'room') {
          const text = hr.town.places.running(hr.map.nodes[job.place.node]);
          setBubble({ who: 'self', at: job.place.marker, lines: [text], line: 0 });
          return;
        }
        // The street's automaton took this machine's parts: it comes first.
        const lairId = lairHere.current;
        // Only one that is out: the boss comes after room 12, in the street of rooms 12 and 13.
        const lairIsOut = lairId && nodes.get(lairId)?.state !== 'closed';
        const holds = lairId && lairIsOut && !beaten(lairId);
        if (node?.kind === 'room' && node.state === 'open' && holds) {
          setBubble({ who: 'self', at: job.place.marker, lines: [hr.town.places.held], line: 0 });
          return;
        }
        if (node && (node.state === 'open' || node.state === 'restored')) {
          writeWhere(areaRef.current, meRef.current);
          onTravel(job.place.node);
          return;
        }
        if (job.place.node === 'foundry') {
          setBubble({ who: 'self', at: job.place.marker, lines: hr.town.places.foundry, line: 0 });
          return;
        }
        const missing = waitsFor(job.place.node, done);
        const text =
          job.place.node === 'workshop'
            ? hr.town.places.workshop
            : missing.length > 0
              ? hr.town.places.waits(missing)
              : hr.town.places.locked;
        setBubble({ who: 'self', at: job.place.marker, lines: [text], line: 0 });
        return;
      }
      if (job.kind === 'automaton') {
        const id = lairHere.current;
        if (!id) return;
        const lair = nodes.get(id);
        const seen = lair?.state === 'open' || lair?.state === 'winding';
        const wait = wakesIn(id);
        if (seen && wait === null) {
          writeWhere(areaRef.current, meRef.current);
          onTravel(id);
          return;
        }
        const text = wait !== null ? hr.town.places.beaten(wait) : hr.town.places.automaton;
        setBubble({ who: 'self', at: job.at, lines: [text], line: 0 });
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
      place(meEl.current, meRef.current, meFacing.current, lookFacing[lookRef.current]);
      setBubble({
        who: person.id,
        at: person.at,
        lines,
        line: 0,
        intro: first
          ? `${hr.town.people[person.id].name} (${hr.town.people[person.id].who})`
          : undefined,
      });
    },
    [nodes, onTravel, wakesIn, beaten, done, met, meFacing, meEl, meRef, botRef],
  );
  arrivedRef.current = arrived;

  // A tap on the district map: to the street that holds the place, standing beside it.
  const pick = useCallback(
    (node: NodeId) => {
      const to = areaOf(node);
      if (!to) {
        onTravel(node);
        return;
      }
      const there = town.areas[to];
      const stand = there.places.find((p) => p.node === node)?.stand ?? there.arrive;
      path.current = [];
      errand.current = null;
      setWalking(false);
      setShowMap(false);
      setAreaId(to);
      meRef.current = stand;
      setStart(stand);
      botRef.current = botAt(there.patrol);
      setBubble(null);
    },
    [onTravel, path, meRef, errand, botRef],
  );

  const walkTo = (target: Point, job: Errand | null) => {
    setBubble(null);
    errand.current = job;
    const route = findPath(area.ground, meRef.current, target);
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

  const restored = area.places.filter((place) => nodes.get(place.node)?.state === 'restored');
  // All its machines running, the whole street is in colour, as the room's backdrop shows it.
  const colourMask = streetRestored(areaId, done)
    ? 'linear-gradient(#000, #000)'
    : bloomMask(restored, fresh);
  const lampsLit = done.includes('r02');
  const art = areaArt(areaId, done);
  const change = areaChange(areaId);
  const people = area.people.filter(
    (person) =>
      (person.after === null || done.includes(person.after)) &&
      !(person.until && done.includes(person.until)),
  );
  const pile = (area.lair && nodes.get(area.lair)?.pile) || 0;
  const lairOut = area.lair !== null && nodes.get(area.lair)?.state !== 'closed';
  // The final fight, waiting: the one thing left to do.
  const finalWaits = area.lair === 'lair-60' && lairOut && !beaten('lair-60');
  // Until he is beaten the game isn't over, in whichever street he is.
  const bossWaits = nodes.get('lair-60')?.state === 'open' && !beaten('lair-60');
  const exits = area.exits.filter((exit) => done.includes(exit.opensWith));
  // An open way on takes the tap over its area (the raised gate is now a way through).
  const places = area.places.filter(
    (place) => !exits.some((exit) => sameRect(exit.area, place.area)),
  );
  // The machine to go to next (the map marks one only after room 1; the town from the
  // start): its place here, or the way towards it, or else the map button calls.
  // With the whole district running, the way on is the sealed foundry gate.
  const nextNode =
    view.nodes.find((node) => node.next)?.id ??
    (done.length === 0 ? 'r01' : view.allDone ? 'foundry' : null);
  // While the boss waits he is the next thing, not the machine he holds.
  const nextPlace = bossWaits ? undefined : places.find((place) => place.node === nextNode);
  const nextExit = nextPlace ? undefined : exits.find((exit) => exit.to === areaOf(nextNode));
  const nextMarker = nextPlace?.marker ?? nextExit?.marker;
  const nextOffTown = nextNode !== null && !nextMarker;

  return (
    <>
      <main className="town" aria-label={hr.town.label}>
        <div className="town__board" ref={board} data-area={areaId}>
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
                maskImage: colourMask,
                WebkitMaskImage: colourMask,
              }}
            />
            {change && fresh === change.room && (
              // Its machine just restarted: the picture before fades, and it stands running.
              <img
                className="town__art town__art--closing"
                src={change.before}
                alt=""
                draggable={false}
              />
            )}
          </button>
          {lampsLit &&
            area.lamps.map((lamp) => (
              <span
                key={`${lamp.x},${lamp.y}`}
                className="town__glow"
                style={pct(lamp)}
                aria-hidden="true"
              />
            ))}
          {area.exits
            .filter((exit) => !done.includes(exit.opensWith))
            .map((exit) => (
              // A way not open yet sits under the machines and says which machine opens it.
              <button
                key={`closed-${exit.to}`}
                type="button"
                className="town__place"
                data-closed-exit={exit.to}
                style={rectStyle(exit.area)}
                aria-label={hr.town.signs[exit.to]}
                onClick={() =>
                  setBubble({
                    who: 'self',
                    at: exit.marker,
                    lines: [
                      hr.town.places.wayWaits(hr.town.signs[exit.to], hr.map.nodes[exit.opensWith]),
                    ],
                    line: 0,
                  })
                }
              />
            ))}
          {area.places
            .filter((place) => place.node === 'workshop' || place.node === 'foundry')
            .filter((place) => nodes.get(place.node)?.state !== 'closed')
            .map((place) => (
              <span
                key={`sign-${place.node}`}
                className="town__sign"
                data-sign={place.node}
                data-open={nodes.get(place.node)?.state === 'open'}
                data-edge="mid"
                style={pct(place.marker)}
                aria-hidden="true"
              >
                {hr.map.nodes[place.node]}
                {place.node === 'workshop' && canBuy && <span className="town__sign-ask">!</span>}
              </span>
            ))}
          {places.map((place) => (
            <PlaceButton
              key={place.node}
              place={place}
              node={nodes.get(place.node)}
              onTap={() => walkTo(place.stand, { kind: 'place', place })}
            />
          ))}
          {exits.map((exit) => (
            <button
              key={exit.to}
              type="button"
              className="town__place"
              data-exit={exit.to}
              style={rectStyle(exit.area)}
              aria-label={exitLabel(areaId, exit.to)}
              onClick={() => walkTo(exit.stand, { kind: 'exit', exit })}
            />
          ))}
          {area.exits.map((exit) => (
            // A signpost at every way out, open or not yet: where it leads, and which way.
            <ExitSign
              key={`sign-${exit.to}`}
              exit={exit}
              open={done.includes(exit.opensWith)}
              onGo={() => walkTo(exit.stand, { kind: 'exit', exit })}
            />
          ))}
          {nextMarker && (
            <span className="town__next" style={pct(nextMarker)} aria-hidden="true">
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
              data-asks={!done.includes(person.changesWith)}
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
                style={{ transform: `scaleX(${person.facing * personFacing[person.id]})` }}
              />
              {!done.includes(person.changesWith) && (
                // Still waiting on their machine: a "!" over the head, like a raised hand.
                <span className="town__ask" aria-hidden="true">
                  !
                </span>
              )}
            </button>
          ))}
          {lairOut && area.lair && area.lairSpot && (
            // The automaton the picture shows, standing still: a tap on it.
            <button
              type="button"
              className="town__place"
              data-lair={area.lair}
              style={rectStyle(area.lairSpot.area)}
              aria-label={
                pile > 0
                  ? `${hr.map.nodes[area.lair]}, ${hr.map.pile(pile)}`
                  : hr.map.nodes[area.lair]
              }
              onClick={() => {
                const spot = area.lairSpot;
                if (spot) {
                  walkTo(spot.stand, {
                    kind: 'automaton',
                    at: { x: spot.area.x + spot.area.w / 2, y: spot.area.y + 40 },
                  });
                }
              }}
            />
          )}
          {lairOut && area.lair && area.patrol.length > 0 && (
            <button
              type="button"
              ref={botEl}
              className="town__figure town__figure--automaton"
              style={{
                ...pct(area.patrol[0] as Point),
                height: `${((town.figure * (area.lair === 'lair-60' ? 1.15 : 0.62)) / town.height) * 100}%`,
              }}
              aria-label={
                pile > 0
                  ? `${hr.map.nodes[area.lair]}, ${hr.map.pile(pile)}`
                  : hr.map.nodes[area.lair]
              }
              onClick={() =>
                walkTo(
                  { x: botRef.current.at.x - 90, y: botRef.current.at.y + 10 },
                  { kind: 'automaton', at: botRef.current.at },
                )
              }
            >
              <Automaton armour={lairs[area.lair].armour} />
              {finalWaits && (
                <span className="town__ask" aria-hidden="true">
                  !
                </span>
              )}
              {/* The parts he left here by losing, to win back. */}
              {pile > 0 && (
                <span className="town__pile" aria-hidden="true">
                  {pile}
                </span>
              )}
            </button>
          )}
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
          data-next={nextOffTown}
          aria-label={hr.town.map}
          onClick={() => setShowMap(true)}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M4 8 L11 5 L21 8 L28 5 V24 L21 27 L11 24 L4 27 Z M11 5 V24 M21 8 V27" />
          </svg>
        </button>
        <button
          type="button"
          className="town__player-button"
          aria-label={hr.town.switchPlayer}
          onClick={() => {
            // "Tko igra?" opens in place of the game (main.tsx); he comes back where he stood.
            writeWhere(areaRef.current, meRef.current);
            location.replace(playersHash);
          }}
        >
          <img src={looks[look]} alt="" draggable={false} />
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
      {showMap && <MapOverlay onClose={() => setShowMap(false)} onPick={pick} />}
      {bossWaits && !slides && !showMap && !showIntro && (
        <p className="town__goal" role="status">
          {hr.now.boss}
        </p>
      )}
      {slides && (
        <div className="town__overlay">
          <StoryPanels
            panels={hr.slides[slides]}
            art={slides === 'outro' ? outroArt : logbookArt}
            onDone={() => {
              if (slides === 'outro') writeOutroSeen();
              setSlides(null);
            }}
          />
        </div>
      )}
      {showIntro && (
        <div className="town__overlay">
          <OpeningPanels onDone={() => setShowIntro(false)} />
        </div>
      )}
    </>
  );
}

/** A person's lines: before the room that changes them, or after. */
function personLines(person: TownPerson, done: readonly RoomId[]): readonly string[] {
  const text = person.scene ? hr.town.scenes[person.scene] : hr.town.people[person.id];
  return done.includes(person.changesWith) ? text.after : text.before;
}

function exitLabel(from: AreaId, to: AreaId): string {
  const key = `${from}-${to}` as keyof typeof hr.town.exits;
  return hr.town.exits[key] ?? hr.town.walk;
}
