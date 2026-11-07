import '@/ui/common/room-guide.css';
import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { hr } from '@/content/text/hr';
import { type GuideTarget, guideKey, guideOfKey, guideTargetPlace } from '@/room/guide';
import type { RoomState, ToolId } from '@/room/types';
import { roomGuideOf } from '@/store/room-guide';
import { useGame } from '@/store/store';
import {
  placeGuideCard,
  type Rect,
  ringRect,
  sceneAvoidBoxes,
  sceneBoxInArea,
  sceneScaleIn,
  sceneTargetBoxes,
} from '@/ui/common/guide-spots';
import type { Size } from '@/ui/common/scene-spots';
import { fitScene } from '@/ui/scene/fit-scene';

interface Props {
  /** The scene area: the scene's parts are found in it, and the card stands over it. */
  area: RefObject<HTMLElement | null>;
}

/**
 * Story 6.1: a room guide's step (room/guide.ts) over the room. Nikola's card says what the
 * ringed control does; everything else dims. The dimming and the rings take no touches, so
 * the room stays his while the card shows. A step he reads closes with "Dalje"; a step that
 * waits for a move says "Probaj!" and moves on when he makes it. The card stands where it
 * covers none of what it points at (guide-spots.ts).
 */
export function RoomGuide({ area }: Props) {
  const key = useGame((s) => guideKey(roomGuideOf(s)));
  const last = useGame((s) => roomGuideOf(s)?.last ?? false);
  const room = useGame((s) => s.room);
  const tools = useGame((s) => s.save.progress.tools);
  const copies = useGame((s) => s.ui.copies);
  const dispatch = useGame((s) => s.dispatch);
  const guide = guideOfKey(key);
  if (!guide || !room) return null;
  return (
    <GuideLayer
      key={key}
      stepId={guide.step.id}
      targets={guide.step.targets}
      waits={guide.step.waits !== undefined}
      last={last}
      room={room}
      tools={tools}
      copies={copies}
      area={area}
      onNext={() => dispatch({ type: 'room/guide-next' })}
    />
  );
}

/** The HTML a step can ring, by what it rings (the scene's own parts are drawn on the canvas). */
const selectors: Partial<Record<GuideTarget, string>> = {
  confirm: 'button.pin-confirm',
  goal: '.goal-banner',
  hint: 'button.hint',
  notebook: '.notebook__lines',
  draft: '.notebook .line--draft, .notebook .line--upcoming',
  pad: '.pad',
  enter: '.pad__key[data-key="enter"]',
  logbook: '.notebook li.line--logbook',
  chain: 'section.chain',
  story: '.story-panel:not(.linked-panel)',
  range: '.story-panel:not(.linked-panel)',
  'fine-dial': '.fine-dial',
  linked: '.linked-panel',
  drum: 'section.drum',
};

/** The controls laid over the scene, which the card keeps clear of where it can. */
const controls = 'button.reset, button.hint, button.map-button, .parts-counter, .notebook__handle';

function rectOf(element: Element): Rect {
  const r = element.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function unionRects(rects: readonly Rect[]): Rect | null {
  if (rects.length === 0) return null;
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.left + r.width));
  const bottom = Math.max(...rects.map((r) => r.top + r.height));
  return { left, top, width: right - left, height: bottom - top };
}

const visible = (rect: Rect, screen: Size) =>
  rect.width > 0 &&
  rect.height > 0 &&
  rect.left < screen.width &&
  rect.top < screen.height &&
  rect.left + rect.width > 0 &&
  rect.top + rect.height > 0;

interface Layout {
  screen: Size;
  rings: Rect[];
  card: { left: number; top: number } | null;
}

/** Where everything is now, measured; the rings in the order the step names its targets. */
function measure(
  targets: readonly GuideTarget[],
  room: RoomState,
  tools: readonly ToolId[],
  copies: number,
  areaEl: HTMLElement,
  cardEl: HTMLElement | null,
): Layout {
  const screen = { width: window.innerWidth, height: window.innerHeight };
  const areaRect = rectOf(areaEl);
  const areaSize = { width: areaEl.clientWidth, height: areaEl.clientHeight };
  const fit = fitScene(areaSize.width, areaSize.height);
  const scene = {
    room,
    tools,
    sceneScale: sceneScaleIn(areaSize, copies),
    origin: { x: fit.x, y: fit.y },
  };
  const inScreen = (box: Parameters<typeof sceneBoxInArea>[0]): Rect | null => {
    const inArea = sceneBoxInArea(box, areaSize, copies);
    return inArea
      ? { ...inArea, left: inArea.left + areaRect.left, top: inArea.top + areaRect.top }
      : null;
  };
  const pad = 6;
  const rings: Rect[] = [];
  for (const target of targets) {
    // The HTML it rings, where there is one; else the scene's part (the goal is either).
    const selector = selectors[target];
    const found = selector ? [...document.querySelectorAll(selector)].map(rectOf) : [];
    const html = unionRects(found.filter((r) => visible(r, screen)));
    let parts: Rect[] = [];
    if (html) parts = [html];
    else if (guideTargetPlace(target) === 'scene') {
      parts = sceneTargetBoxes(target, scene).flatMap((box) => inScreen(box) ?? []);
    }
    for (const rect of parts) {
      if (visible(rect, screen)) rings.push(ringRect(rect, screen, pad));
    }
  }
  // The card stands over the scene area, left of the notebook where it lies over the scene.
  const notebook = document.querySelector('.notebook-area');
  const book = notebook ? rectOf(notebook) : null;
  const areaRight = areaRect.left + areaRect.width;
  const right = book && book.left < areaRight && book.left > areaRect.left ? book.left : areaRight;
  const region = {
    left: areaRect.left,
    top: areaRect.top,
    width: right - areaRect.left,
    height: areaRect.height,
  };
  const avoid = [
    ...[...document.querySelectorAll(controls)].map(rectOf),
    ...sceneAvoidBoxes(scene).flatMap((box) => inScreen(box) ?? []),
  ].filter((r) => visible(r, screen));
  const size = cardEl ? { width: cardEl.offsetWidth, height: cardEl.offsetHeight } : null;
  const card = size && size.width > 0 ? placeGuideCard(region, size, rings, avoid) : null;
  return { screen, rings, card };
}

const sameLayout = (a: Layout, b: Layout) => JSON.stringify(a) === JSON.stringify(b);

function rounded(layout: Layout): Layout {
  const r = (n: number) => Math.round(n);
  return {
    screen: layout.screen,
    rings: layout.rings.map((x) => ({
      left: r(x.left),
      top: r(x.top),
      width: r(x.width),
      height: r(x.height),
    })),
    card: layout.card ? { left: r(layout.card.left), top: r(layout.card.top) } : null,
  };
}

interface LayerProps {
  stepId: keyof typeof hr.roomGuide.steps;
  targets: readonly GuideTarget[];
  waits: boolean;
  last: boolean;
  room: RoomState;
  tools: readonly ToolId[];
  copies: number;
  area: RefObject<HTMLElement | null>;
  onNext(): void;
}

/**
 * The dimming with its rings, and the card. The parts it rings move (the pans tip, the
 * notebook slides on a phone), so it measures them on every frame while it shows and lays
 * itself out again only when something moved.
 */
function GuideLayer({
  stepId,
  targets,
  waits,
  last,
  room,
  tools,
  copies,
  area,
  onNext,
}: LayerProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const roomRef = useRef(room);
  const toolsRef = useRef(tools);
  useLayoutEffect(() => {
    roomRef.current = room;
    toolsRef.current = tools;
  }, [room, tools]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const areaEl = area.current;
      if (areaEl) {
        const next = rounded(
          measure(targets, roomRef.current, toolsRef.current, copies, areaEl, cardRef.current),
        );
        setLayout((was) => (was && sameLayout(was, next) ? was : next));
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [targets, copies, area]);

  return (
    <RoomGuideView
      text={hr.roomGuide.steps[stepId]}
      stepId={stepId}
      waits={waits}
      last={last}
      layout={layout}
      cardRef={cardRef}
      onNext={onNext}
    />
  );
}

interface ViewProps {
  text: string;
  stepId: string;
  waits: boolean;
  last: boolean;
  layout: Layout | null;
  cardRef?: RefObject<HTMLElement | null>;
  onNext(): void;
}

/** The guide itself, from props only: the dimming with its holes and rings, and the card. */
export function RoomGuideView({ text, stepId, waits, last, layout, cardRef, onNext }: ViewProps) {
  const screen = layout?.screen ?? { width: 0, height: 0 };
  const rings = layout?.rings ?? [];
  return (
    <div className="room-guide" data-step={stepId}>
      {layout && (
        <svg
          className="room-guide__dim"
          width={screen.width}
          height={screen.height}
          viewBox={`0 0 ${screen.width} ${screen.height}`}
          aria-hidden="true"
        >
          <defs>
            <mask id="room-guide-holes">
              <rect width={screen.width} height={screen.height} fill="white" />
              {rings.map((ring) => (
                <rect
                  key={`${ring.left},${ring.top}`}
                  x={ring.left}
                  y={ring.top}
                  width={ring.width}
                  height={ring.height}
                  rx={12}
                  fill="black"
                />
              ))}
            </mask>
          </defs>
          <rect
            className="room-guide__shade"
            width={screen.width}
            height={screen.height}
            mask="url(#room-guide-holes)"
          />
          {rings.map((ring) => (
            <rect
              key={`ring-${ring.left},${ring.top}`}
              className="room-guide__ring"
              x={ring.left}
              y={ring.top}
              width={ring.width}
              height={ring.height}
              rx={12}
            />
          ))}
        </svg>
      )}
      <aside
        ref={cardRef}
        className="room-guide__card"
        aria-label={hr.roomGuide.label}
        aria-live="polite"
        style={
          layout?.card ? { left: layout.card.left, top: layout.card.top } : { visibility: 'hidden' }
        }
      >
        <span className="room-guide__who">{hr.story.speakers.nikola}</span>
        <p className="room-guide__text">{text}</p>
        {waits ? (
          <span className="room-guide__try">{hr.roomGuide.try}</span>
        ) : (
          <button
            type="button"
            tabIndex={-1}
            className="room-guide__next"
            onPointerDown={(event) => event.preventDefault()}
            onClick={onNext}
          >
            {last ? hr.roomGuide.last : hr.roomGuide.next}
          </button>
        )}
      </aside>
    </div>
  );
}
