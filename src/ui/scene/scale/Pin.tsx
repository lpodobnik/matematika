import { extend } from '@pixi/react';
import { animate } from 'motion';
import { Container, Graphics, Rectangle, Text, type TextStyleOptions } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { palette } from '@/art/palette';
import { type PinShape, pinSkin } from '@/art/skins/pin';
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

extend({ Container, Graphics, Text });

interface Props {
  /** CSS px per scene unit: places and the hit area are sized in CSS px. */
  sceneScale: number;
}

/** A wrong pin fades back, with no penalty: it stays in view, dimmer than a right one. */
const wrongAlpha = 0.45;

/**
 * The prediction pin (Pattern 2, Pin): it waits in a holder by the dial's track, he drags
 * it onto a place (an x over the dial's notches, or an option), drags it again to move it,
 * and confirms it with the confirm control (ui/common/PinConfirm.tsx). The first time the
 * game offers it, it wiggles once. Once it resolves, a right pin lights up like a lamp and
 * a wrong one dims. What it shows comes from `pinView`; the drag moves it through a ref,
 * and the store hears only a new place.
 */
export function Pin({ sceneScale }: Props) {
  const view = useGame(useShallow((s) => pinView(s.room)));
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

  if (!view || !layout || !shape || !handlers || !hitArea) return null;
  return (
    <pixiContainer>
      {view.kind === 'x' && <BeyondDial layout={layout} reach={view.reach} slots={view.slots} />}
      {track?.kind === 'choice' &&
        track.options.map((choice, i) => (
          <Place key={choice} layout={layout} slot={i} option={choice} />
        ))}
      {view.slot === null && view.movable && (
        <pixiContainer x={layout.holderX}>
          <pixiGraphics draw={drawHolder} />
        </pixiContainer>
      )}
      {/* Placed through the drag controller's ref (sync settles it), never by a position prop. */}
      <pixiContainer
        ref={pinRef}
        alpha={view.result === 'wrong' ? wrongAlpha : 1}
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
          {view.result === 'right' && <pixiGraphics draw={drawLight} />}
          {view.label !== null && (
            <pixiText text={view.label} anchor={0.5} y={layout.headY} style={style} />
          )}
        </pixiContainer>
      </pixiContainer>
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
