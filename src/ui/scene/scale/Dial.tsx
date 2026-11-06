import { extend } from '@pixi/react';
import { animate } from 'motion';
import { Container, Graphics, Rectangle } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { dialSkin } from '@/art/skins/dial';
import { tuning } from '@/config/tuning';
import { dialView, notchCount, notchOf } from '@/room/dial';
import { useGame } from '@/store/store';
import {
  createDialDrag,
  type DialPointerEvent,
  dialPointerHandlers,
  dialSync,
  notchAction,
  watchDragCancel,
} from '@/ui/scene/scale/dial-drag';
import {
  clampNotch,
  type DialLayout,
  dialLayout,
  followScroll,
} from '@/ui/scene/scale/dial-layout';
import { usePinTest } from '@/ui/scene/scale/use-pin-test';

extend({ Container, Graphics });

interface Props {
  /** CSS px per scene unit: notches are 24 CSS px apart, whatever the screen. */
  sceneScale: number;
}

/** How long the poke window's clamp takes to lift away when the pin is confirmed. */
export const clampLiftMs = 360;
/** The clamp's jaws, along the track, as a share of a notch: clear of the knob beside it. */
const clampWidth = 0.6;

/**
 * The x dial: a horizontal track under the scale, dragged left and right, one notch per
 * 24 CSS px, with a tick on each notch (architecture, The dial). The knob and the track's
 * scroll follow the finger through refs on every move; the store hears only a new notch.
 *
 * While the poke window holds it short, a clamp grips the track just past the window's
 * last notch, and the track beyond it is fainter; a stage whose pin holds the dial still
 * until it is confirmed clamps it just past the knob. When the pin is confirmed the clamp
 * lifts away (story 1.14). Then the machine tests the pin: the knob turns to it notch by notch
 * (use-pin-test.ts), though the store has it there already. If he grabs the dial during the
 * test, his drag takes over from where the knob is: the dial is set there, and the test
 * ends.
 */
export function Dial({ sceneScale }: Props) {
  const dial = useGame(useShallow((s) => dialView(s.room)));
  const dispatch = useGame((s) => s.dispatch);
  const test = usePinTest();
  const notches = dial ? notchCount(dial) : 0;
  const layout = useMemo(
    () => (sceneScale > 0 ? dialLayout(sceneScale, notches) : null),
    [sceneScale, notches],
  );

  const trackRef = useRef<Container>(null);
  const knobRef = useRef<Container>(null);
  const maskRef = useRef<Graphics>(null);
  const clampRef = useRef<Container>(null);
  const layoutRef = useRef<DialLayout | null>(layout);
  const dialRef = useRef(dial);
  const testXRef = useRef(test.dialX);
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
  const handlers = useMemo(() => {
    const base = dialPointerHandlers(drag);
    return {
      ...base,
      onPointerDown: (event: DialPointerEvent) => {
        base.onPointerDown(event);
        // His grab during the machine's test: the dial is his from where the knob is.
        const testX = testXRef.current;
        if (testX !== null && drag.dragging()) dispatch({ type: 'dial/set', x: testX });
      },
    };
  }, [drag, dispatch]);

  // The store's dial, and the layout, reach the controller before the next paint; with no
  // drag in progress the knob settles on the store's notch, or on the test's while the
  // machine turns it.
  useLayoutEffect(() => {
    layoutRef.current = layout;
    dialRef.current = dial;
    testXRef.current = test.dialX;
    const track = trackRef.current;
    if (track) track.mask = layout?.scrolls ? maskRef.current : null;
    const sync = dialSync(dial);
    drag.sync(dial && test.dialX !== null ? { ...sync, notch: notchOf(dial, test.dialX) } : sync);
  }, [drag, layout, dial, test.dialX]);

  useEffect(() => {
    const stop = watchDragCancel(window, document, drag);
    return () => {
      stop();
      drag.cancel();
    };
  }, [drag]);

  // The clamp: where it grips now, or where it gripped while it lifts away.
  const clampAt = dial ? clampNotch(dial) : null;
  const [lifting, setLifting] = useState<number | null>(null);
  const lastClamp = useRef(clampAt);
  useLayoutEffect(() => {
    const was = lastClamp.current;
    lastClamp.current = clampAt;
    if (clampAt !== null) {
      setLifting(null);
      clampRef.current?.position.set(0, 0);
      if (clampRef.current) clampRef.current.alpha = 1;
    } else if (was !== null) {
      setLifting(was);
    }
  }, [clampAt]);
  useEffect(() => {
    const clamp = clampRef.current;
    if (lifting === null || !clamp || !layout) return;
    const rise = layout.tickHeight * 2.5;
    const controls = animate(0, 1, {
      duration: clampLiftMs / 1000,
      ease: 'easeIn',
      onUpdate: (t) => {
        clamp.y = -rise * t;
        clamp.alpha = 1 - t;
      },
      onComplete: () => setLifting(null),
    });
    return () => controls.stop();
  }, [lifting, layout]);

  const hitArea = useMemo(() => {
    const box = layout?.hitArea;
    return box ? new Rectangle(box.x, box.y, box.width, box.height) : null;
  }, [layout]);
  const drawTrack = useCallback(
    (g: Graphics) => {
      if (!layout) return;
      dialSkin.track(g, layout, clampAt === null ? null : clampAt - clampWidth / 2);
    },
    [layout, clampAt],
  );
  const drawKnob = useCallback(
    (g: Graphics) => {
      if (!layout) return;
      dialSkin.knob(g, layout.knob.width, layout.knob.height, layout.lineWidth);
    },
    [layout],
  );
  const drawClamp = useCallback(
    (g: Graphics) => {
      if (!layout) return;
      dialSkin.clamp(g, layout.spacing * clampWidth, layout.tickHeight, layout.lineWidth);
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
  const clampShown = clampAt ?? lifting;
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
        {clampShown !== null && (
          <pixiContainer x={clampShown * layout.spacing}>
            {/* Lifted through its ref; set back when a window holds the dial again. */}
            <pixiContainer ref={clampRef}>
              <pixiGraphics draw={drawClamp} />
            </pixiContainer>
          </pixiContainer>
        )}
        <pixiContainer ref={knobRef}>
          <pixiGraphics draw={drawKnob} />
        </pixiContainer>
      </pixiContainer>
    </pixiContainer>
  );
}
