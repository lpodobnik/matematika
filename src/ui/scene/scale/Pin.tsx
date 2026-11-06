import { extend } from '@pixi/react';
import { animate } from 'motion';
import { Container, Graphics, Rectangle, Text, type TextStyleOptions } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { palette } from '@/art/palette';
import { type PinShape, pinSkin } from '@/art/skins/pin';
import { hr } from '@/content/text/hr';
import { dialView, notchCount } from '@/room/dial';
import { pinTrack, pinView, slotValue } from '@/room/pin';
import { currentStageSpec } from '@/room/room';
import type { EffectOption } from '@/room/types';
import { useGame } from '@/store/store';
import { dialPointerHandlers, watchDragCancel } from '@/ui/scene/scale/dial-drag';
import { dialLayout } from '@/ui/scene/scale/dial-layout';
import { labelFontSize } from '@/ui/scene/scale/layout';
import { createPinDrag } from '@/ui/scene/scale/pin-drag';
import {
  type PinLayout,
  pinLayout,
  pinWiggle,
  pinWiggleMs,
  placeX,
} from '@/ui/scene/scale/pin-layout';
import {
  type PinTagLayout,
  pinTagLayout,
  resetCorner,
  tagObstacles,
} from '@/ui/scene/scale/pin-tag-layout';
import type { Point } from '@/ui/scene/scale/tray-layout';
import { usePinTest } from '@/ui/scene/scale/use-pin-test';

extend({ Container, Graphics, Text });

interface Props {
  /** CSS px per scene unit: places and the hit area are sized in CSS px. */
  sceneScale: number;
  /**
   * Where the scene's top-left corner sits in the scene area, in CSS px, so the question
   * tag keeps clear of the reset control there; null draws no tag (a copy of the scene).
   */
  question: Point | null;
}

/** A wrong pin fades back, with no penalty: it stays in view, dimmer than a right one. */
const wrongAlpha = 0.45;

/**
 * The prediction pin (Pattern 2, Pin): it waits in a holder by the dial's track, he drags
 * it onto a place (an x over the dial's notches, or an option), drags it again to move it,
 * and confirms it with the confirm control beside its head (ui/common/PinConfirm.tsx).
 * While it is offered, a paper tag hangs on the holder with its question (story 1.14). The
 * first time the game offers it, it wiggles once. When he confirms it, the machine tests it
 * (use-pin-test.ts); once the pans come to rest, a right pin lights up like a lamp and a
 * wrong one dims. What it shows comes from `pinView`; the drag moves it through a ref, and
 * the store hears only a new place.
 */
export function Pin({ sceneScale, question }: Props) {
  const view = useGame(useShallow((s) => pinView(s.room)));
  const test = usePinTest();
  const roomSpec = useGame((s) => s.room?.spec ?? null);
  const stageIndex = useGame((s) => s.room?.stageIndex ?? 0);
  const track = useGame(useShallow((s) => (s.room ? pinTrack(currentStageSpec(s.room)) : null)));
  const notches = useGame((s) => {
    const dial = dialView(s.room);
    return dial ? notchCount(dial) : null;
  });
  const dispatch = useGame((s) => s.dispatch);
  const fontSize = labelFontSize(sceneScale);
  const kind = view?.kind ?? null;
  const slots = view?.slots ?? 0;
  const layout = useMemo(
    () =>
      sceneScale > 0 && notches !== null && kind !== null && slots > 0
        ? pinLayout(dialLayout(sceneScale, notches), { kind, slots }, fontSize)
        : null,
    [sceneScale, notches, kind, slots, fontSize],
  );

  const pinRef = useRef<Container>(null);
  const bodyRef = useRef<Container>(null);
  const trackRef = useRef(track);
  useLayoutEffect(() => {
    trackRef.current = track;
  }, [track]);

  const drag = useMemo(() => {
    if (!layout) return null;
    return createPinDrag({
      slotPx: layout.slotPx,
      holderPx: layout.holderPx,
      onPin: (px) => {
        if (pinRef.current) pinRef.current.x = layout.originX + px * layout.unitsPerPx;
      },
      onPlace: (slot) => {
        const current = trackRef.current;
        if (current) dispatch({ type: 'pin/set', value: slotValue(current, slot) });
      },
    });
  }, [layout, dispatch]);
  const handlers = useMemo(() => (drag ? dialPointerHandlers(drag) : null), [drag]);

  const slot = view?.slot ?? null;
  const movable = view?.movable ?? false;
  // Shown again (a new stage's pin), the pin container is new and must be placed again.
  const shown = view !== null;
  useLayoutEffect(() => {
    if (shown) drag?.sync({ slot, slots: Math.max(1, slots), enabled: movable });
  }, [drag, slot, slots, movable, shown]);

  useEffect(() => {
    if (!drag) return;
    const stop = watchDragCancel(window, document, drag);
    return () => {
      stop();
      drag.cancel();
    };
  }, [drag]);

  // The first-use wiggle (hint level 1): once, when the game first offers the pin.
  const wiggle = view?.wiggle ?? false;
  const reach = layout ? layout.headRadius * 0.5 : 0;
  useEffect(() => {
    const body = bodyRef.current;
    if (!wiggle || !body) return;
    const controls = animate(0, 1, {
      duration: pinWiggleMs / 1000,
      ease: 'linear',
      onUpdate: (t) => {
        body.x = pinWiggle(t, reach);
      },
      onComplete: () => {
        body.x = 0;
      },
    });
    return () => {
      controls.stop();
      body.x = 0;
    };
  }, [wiggle, reach]);

  const shape: PinShape | null = useMemo(
    () =>
      layout
        ? {
            tipY: layout.tipY,
            headY: layout.headY,
            headRadius: layout.headRadius,
            lineWidth: layout.lineWidth,
          }
        : null,
    [layout],
  );
  const locked = view?.locked ?? false;
  const option = view?.option ?? null;
  const drawPin = useCallback(
    (g: Graphics) => {
      if (!shape) return;
      pinSkin.pin(g, shape, locked);
      if (option) pinSkin.arrow(g, option, shape.headY, shape.headRadius * 0.7, shape.lineWidth);
    },
    [shape, locked, option],
  );
  const drawLight = useCallback(
    (g: Graphics) => {
      if (shape) pinSkin.light(g, shape);
    },
    [shape],
  );
  const drawHolder = useCallback(
    (g: Graphics) => {
      if (shape) pinSkin.holder(g, shape);
    },
    [shape],
  );
  const style: TextStyleOptions = useMemo(
    () => ({ fontFamily: 'system-ui, sans-serif', fontSize, fontWeight: '700', fill: palette.ink }),
    [fontSize],
  );
  const hitArea = useMemo(() => {
    const box = layout?.hitArea;
    return box ? new Rectangle(box.x, box.y, box.width, box.height) : null;
  }, [layout]);

  const asks = (view?.asks ?? false) && question !== null;
  const questionKey = view?.question ?? null;
  const originX = question?.x ?? 0;
  const originY = question?.y ?? 0;
  const tag = useMemo(() => {
    if (!asks || !layout || !roomSpec || !questionKey) return null;
    const reset = resetCorner(sceneScale, { x: originX, y: originY });
    const obstacles = tagObstacles(roomSpec, stageIndex, layout, slots, fontSize, reset);
    return pinTagLayout(hr.pin.questions[questionKey], sceneScale, layout, obstacles);
  }, [
    asks,
    layout,
    roomSpec,
    stageIndex,
    questionKey,
    slots,
    fontSize,
    sceneScale,
    originX,
    originY,
  ]);

  if (!view || !layout || !shape || !handlers || !hitArea) return null;
  // The machine is still testing the pin: its light or dimming waits until the pans rest.
  const result = test.result ? view.result : null;
  return (
    <pixiContainer>
      {tag && <QuestionTag tag={tag} lineWidth={layout.lineWidth} />}
      {view.kind === 'x' && <BeyondDial layout={layout} reach={view.reach} slots={view.slots} />}
      {track?.kind === 'choice' &&
        track.options.map((choice, i) => (
          <Place key={choice} layout={layout} slot={i} option={choice} />
        ))}
      {/* The holder stays while the pin is offered: the question tag hangs on it. */}
      {view.movable && (
        <pixiContainer x={layout.holderX}>
          <pixiGraphics draw={drawHolder} />
        </pixiContainer>
      )}
      {/* Placed through the drag controller's ref (sync settles it), never by a position prop. */}
      <pixiContainer
        ref={pinRef}
        alpha={result === 'wrong' ? wrongAlpha : 1}
        eventMode={view.movable ? 'static' : 'none'}
        interactiveChildren={false}
        hitArea={hitArea}
        onPointerDown={handlers.onPointerDown}
        onGlobalPointerMove={handlers.onGlobalPointerMove}
        onPointerUp={handlers.onPointerUp}
        onPointerUpOutside={handlers.onPointerUpOutside}
        onPointerCancel={handlers.onPointerCancel}
      >
        <pixiContainer ref={bodyRef}>
          <pixiGraphics draw={drawPin} />
          {result === 'right' && <pixiGraphics draw={drawLight} />}
          {view.label !== null && (
            <pixiText text={view.label} anchor={0.5} y={layout.headY} style={style} />
          )}
        </pixiContainer>
      </pixiContainer>
    </pixiContainer>
  );
}

interface TagProps {
  tag: PinTagLayout;
  lineWidth: number;
}

/**
 * The paper tag with the pin's question, on its string (pin-tag-layout.ts): drawn once per
 * layout, under the pin, so the pin passes over it as he drags it.
 */
function QuestionTag({ tag, lineWidth }: TagProps) {
  const draw = useCallback(
    (g: Graphics) =>
      pinSkin.tag(g, {
        box: tag.box,
        hole: tag.hole,
        tie: tag.tie,
        nail: tag.spot === 'wall',
        lineWidth,
      }),
    [tag, lineWidth],
  );
  const style: TextStyleOptions = useMemo(
    () => ({
      fontFamily: 'system-ui, sans-serif',
      fontSize: tag.fontSize,
      lineHeight: tag.lineHeight,
      fill: palette.ink,
    }),
    [tag],
  );
  return (
    <pixiContainer eventMode="none">
      <pixiGraphics draw={draw} />
      <pixiText text={tag.lines.join('\n')} x={tag.text.x} y={tag.text.y} style={style} />
    </pixiContainer>
  );
}

interface BeyondProps {
  layout: PinLayout;
  reach: number;
  slots: number;
}

/** Marks for the places past the dial's end (a pin that goes beyond the dial, room 4). */
function BeyondDial({ layout, reach, slots }: BeyondProps) {
  const draw = useCallback(
    (g: Graphics) =>
      pinSkin.beyond(
        g,
        placeX(layout, reach - 1),
        placeX(layout, slots - 1),
        layout.spacing,
        layout.trackY,
        layout.tickHeight,
        layout.lineWidth,
      ),
    [layout, reach, slots],
  );
  if (!layout.aligned || reach >= slots) return null;
  return <pixiGraphics draw={draw} />;
}

interface PlaceProps {
  layout: PinLayout;
  slot: number;
  option: EffectOption;
}

/** One option's place for a choice pin, under where the pin's head goes. */
function Place({ layout, slot, option }: PlaceProps) {
  const draw = useCallback(
    (g: Graphics) =>
      pinSkin.place(g, option, layout.headY, layout.headRadius * 1.1, layout.lineWidth),
    [layout, option],
  );
  return (
    <pixiContainer x={placeX(layout, slot)}>
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
}
