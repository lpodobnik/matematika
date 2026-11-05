import { extend } from '@pixi/react';
import { Container, Graphics, Rectangle } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { dialSkin } from '@/art/skins/dial';
import { tuning } from '@/config/tuning';
import { dialView, notchCount } from '@/room/dial';
import { useGame } from '@/store/store';
import {
  createDialDrag,
  dialPointerHandlers,
  dialSync,
  notchAction,
  watchDragCancel,
} from '@/ui/scene/scale/dial-drag';
import { type DialLayout, dialLayout, followScroll } from '@/ui/scene/scale/dial-layout';

extend({ Container, Graphics });

interface Props {
  /** CSS px per scene unit: notches are 24 CSS px apart, whatever the screen. */
  sceneScale: number;
}

/**
 * The x dial: a horizontal track under the scale, dragged left and right, one notch per
 * 24 CSS px, with a tick on each notch (architecture, The dial). The knob and the track's
 * scroll follow the finger through refs on every move; the store hears only a new notch.
 */
export function Dial({ sceneScale }: Props) {
  const dial = useGame(useShallow((s) => dialView(s.room)));
  const dispatch = useGame((s) => s.dispatch);
  const notches = dial ? notchCount(dial) : 0;
  const layout = useMemo(
    () => (sceneScale > 0 ? dialLayout(sceneScale, notches) : null),
    [sceneScale, notches],
  );

  const trackRef = useRef<Container>(null);
  const knobRef = useRef<Container>(null);
  const maskRef = useRef<Graphics>(null);
  const layoutRef = useRef<DialLayout | null>(layout);
  const dialRef = useRef(dial);
  const scrollRef = useRef(0);

  const drag = useMemo(
    () =>
      createDialDrag({
        notchPx: tuning.dialNotchPx,
        onKnob: (px) => {
          const current = layoutRef.current;
          if (!current) return;
          const offset = px * current.unitsPerPx;
          scrollRef.current = followScroll(current, scrollRef.current, offset);
          if (knobRef.current) knobRef.current.x = offset;
          if (trackRef.current) trackRef.current.x = current.originX - scrollRef.current;
        },
        onNotch: (notch) => {
          const view = dialRef.current;
          if (view) dispatch(notchAction(view, notch));
        },
      }),
    [dispatch],
  );
  const handlers = useMemo(() => dialPointerHandlers(drag), [drag]);

  // The store's dial, and the layout, reach the controller before the next paint; with no
  // drag in progress the knob settles on the store's notch.
  useLayoutEffect(() => {
    layoutRef.current = layout;
    dialRef.current = dial;
    const track = trackRef.current;
    if (track) track.mask = layout?.scrolls ? maskRef.current : null;
    drag.sync(dialSync(dial));
  }, [drag, layout, dial]);

  useEffect(() => {
    const stop = watchDragCancel(window, document, drag);
    return () => {
      stop();
      drag.cancel();
    };
  }, [drag]);

  const hitArea = useMemo(() => {
    const box = layout?.hitArea;
    return box ? new Rectangle(box.x, box.y, box.width, box.height) : null;
  }, [layout]);
  const drawTrack = useCallback(
    (g: Graphics) => {
      if (!layout) return;
      dialSkin.track(g, layout);
    },
    [layout],
  );
  const drawKnob = useCallback(
    (g: Graphics) => {
      if (!layout) return;
      dialSkin.knob(g, layout.knob.width, layout.knob.height, layout.lineWidth);
    },
    [layout],
  );
  const drawMask = useCallback(
    (g: Graphics) => {
      if (!layout) return;
      const { x, y, width, height } = layout.window;
      g.clear();
      g.rect(x, y, width, height).fill({ color: 0xffffff });
    },
    [layout],
  );

  if (!layout || !dial || !hitArea) return null;
  return (
    <pixiContainer
      eventMode="static"
      interactiveChildren={false}
      hitArea={hitArea}
      onPointerDown={handlers.onPointerDown}
      onGlobalPointerMove={handlers.onGlobalPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerUpOutside={handlers.onPointerUpOutside}
      onPointerCancel={handlers.onPointerCancel}
    >
      {layout.scrolls && <pixiGraphics ref={maskRef} draw={drawMask} />}
      <pixiContainer ref={trackRef} y={layout.trackY}>
        <pixiGraphics draw={drawTrack} />
        <pixiContainer ref={knobRef}>
          <pixiGraphics draw={drawKnob} />
        </pixiContainer>
      </pixiContainer>
    </pixiContainer>
  );
}
