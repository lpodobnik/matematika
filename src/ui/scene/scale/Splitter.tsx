import { extend, useApplication } from '@pixi/react';
import { animate } from 'motion';
import {
  Container,
  type FederatedPointerEvent,
  Graphics,
  type PointData,
  Rectangle,
  Text,
  type TextStyleOptions,
} from 'pixi.js';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { palette } from '@/art/palette';
import { type BladeShape, bladeTag, splitterSkin } from '@/art/skins/splitter';
import { formatNumber } from '@/math/format';
import { canStepParts, splitterView, stepSplitter } from '@/room/splitter';
import { gameStore, useGame } from '@/store/store';
import { watchDragCancel } from '@/ui/scene/scale/dial-drag';
import type { Box } from '@/ui/scene/scale/dial-layout';
import { labelFontSize } from '@/ui/scene/scale/layout';
import { pinWiggle } from '@/ui/scene/scale/pin-layout';
import { StepButton } from '@/ui/scene/scale/StepButton';
import {
  type SplitterCarry,
  type SplitterDrag,
  type SplitterGrab,
  splitterAction,
  splitterCancelWatch,
  splitterTakes,
} from '@/ui/scene/scale/splitter-drag';
import {
  type SplitterLayout,
  splitterLayout,
  splitterWiggleMs,
} from '@/ui/scene/scale/splitter-layout';
import { landMs, type Point, returnMs } from '@/ui/scene/scale/tray-layout';

extend({ Container, Graphics, Text });

interface Props {
  /** CSS px per scene unit: buttons and grab areas are sized in CSS px. */
  sceneScale: number;
  /** Carries the splitter across the pans, or off them. */
  drag: SplitterDrag;
  /** A point on the canvas in scene units. */
  toScene(point: PointData): Point;
}

/** A splitter that does nothing now (a wrong line jams the machine) is drawn faint. */
const idleAlpha = 0.45;

function useSplitterCarry(drag: SplitterDrag): SplitterCarry | null {
  return useSyncExternalStore(drag.subscribe, drag.carry, drag.carry);
}

/**
 * Whether the blade where he grabbed it is hidden: while he carries it, and while it slides
 * back. Once the store has taken the drag it shows where the store puts it (back in the
 * holder, or across the pans), while the carried one fades. A hidden blade can still be
 * grabbed, so a drag during the slide back starts at once, and a slide back that never
 * plays (a page in the background has no animation frames) never leaves it out of reach.
 */
function carriedFrom(carry: SplitterCarry | null, from: SplitterGrab): boolean {
  return carry !== null && carry.from === from && carry.phase !== 'landing';
}

/**
 * The splitter (Pattern 1, Balance moves): once Balance is earned, an open stage shows it in
 * its holder in the top-left corner, set to 2–9 parts by its − and + (which repeat when
 * held). He drags it across both pans to split them; the store decides what that does
 * (room/splitter.ts), and a drag it doesn't take slides back. A split that doesn't divide
 * evenly jams the machine, and the splitter lies across the pans until he drags it off.
 * The first time it is offered it wiggles once. It draws the blade he carries above
 * everything, moved through a ref as his finger moves.
 */
export function Splitter({ sceneScale, drag, toScene }: Props) {
  const { app, isInitialised } = useApplication();
  const view = useGame(useShallow((s) => splitterView(s.room, s.save.progress.tools)));
  const stageKey = useGame((s) => (s.room ? `${s.room.spec.id}.${s.room.stageIndex}` : null));
  const dispatch = useGame((s) => s.dispatch);
  const fontSize = labelFontSize(sceneScale);
  const layout = useMemo(
    () => (sceneScale > 0 ? splitterLayout(sceneScale, fontSize) : null),
    [sceneScale, fontSize],
  );
  const carry = useSplitterCarry(drag);

  // The release handler reads the latest layout without re-registering, and asks the live
  // store whether it takes the drag, since that is the store the dispatch reaches.
  const latestLayout = useRef(layout);
  useLayoutEffect(() => {
    latestLayout.current = layout;
  });

  useEffect(() => {
    drag.setReleaseHandler((held, at, crossed) => {
      const current = latestLayout.current;
      if (!current) return false;
      const action = splitterAction(held, at, crossed, current);
      const { room: live, save } = gameStore.getState();
      if (!action || !splitterTakes(live, save.progress.tools, action)) return false;
      dispatch(action);
      return true;
    });
    return () => drag.setReleaseHandler(null);
  }, [drag, dispatch]);

  // A drag is followed on the stage: every move, and up or up outside wherever the finger
  // was let go. A cancelled pointer, blur or a hidden page is not a release: it slides back.
  useEffect(() => {
    if (!isInitialised) return;
    const { stage } = app;
    const onMove = (event: FederatedPointerEvent) =>
      drag.move(event.pointerId, toScene(event.global));
    const onUp = (event: FederatedPointerEvent) => drag.end(event.pointerId);
    stage.on('globalpointermove', onMove);
    stage.on('pointerup', onUp);
    stage.on('pointerupoutside', onUp);
    const stopWatching = watchDragCancel(window, document, splitterCancelWatch(drag));
    return () => {
      stage.off('globalpointermove', onMove);
      stage.off('pointerup', onUp);
      stage.off('pointerupoutside', onUp);
      stopWatching();
      drag.cancel();
      drag.settle();
    };
  }, [app, isInitialised, drag, toScene]);

  const step = useCallback(
    (by: 1 | -1) => () => {
      const { room: live, save } = gameStore.getState();
      if (!live || !stepSplitter(live, save.progress.tools, by)) return false;
      dispatch({ type: 'splitter/step', by });
      return canStepParts(live.stage.splitter + by, by);
    },
    [dispatch],
  );
  const stepUp = useMemo(() => step(1), [step]);
  const stepDown = useMemo(() => step(-1), [step]);

  const grab = useCallback(
    (from: SplitterGrab, home: Box, parts: number) => (event: FederatedPointerEvent) => {
      if (event.button !== 0) return;
      drag.start(event.pointerId, from, home, parts, toScene(event.global));
    },
    [drag, toScene],
  );

  // The first-use wiggle (hint level 1): once per stage, when the game first offers it.
  const holderRef = useRef<Container>(null);
  const wiggled = useRef<string | null>(null);
  const wiggle = view?.wiggle ?? false;
  const reach = layout ? layout.box.height * 0.08 : 0;
  useEffect(() => {
    const node = holderRef.current;
    if (!wiggle || !node || stageKey === null || wiggled.current === stageKey) return;
    wiggled.current = stageKey;
    // The holder unmounts when the stage locks: its container may be destroyed by cleanup.
    const shift = (x: number) => {
      if (!node.destroyed) node.x = x;
    };
    const controls = animate(0, 1, {
      duration: splitterWiggleMs / 1000,
      ease: 'linear',
      onUpdate: (t) => shift(pinWiggle(t, reach)),
      onComplete: () => shift(0),
    });
    return () => {
      controls.stop();
      shift(0);
    };
  }, [wiggle, stageKey, reach]);

  if (!layout) return null;
  return (
    <pixiContainer>
      {view && (
        <pixiContainer ref={holderRef} alpha={view.works || view.onPans ? 1 : idleAlpha}>
          <Holder layout={layout} />
          {!view.onPans && (
            <Blade
              hidden={carriedFrom(carry, 'holder')}
              box={layout.blade}
              grabBox={layout.grab}
              parts={view.parts}
              halves={false}
              jammed={false}
              fontSize={fontSize}
              lineWidth={layout.lineWidth}
              onGrab={view.works ? grab('holder', layout.blade, view.parts) : null}
            />
          )}
          <StepButton
            box={layout.up}
            by={1}
            enabled={view.works && canStepParts(view.parts, 1)}
            lineWidth={layout.lineWidth}
            onStep={stepUp}
          />
          <StepButton
            box={layout.down}
            by={-1}
            enabled={view.works && canStepParts(view.parts, -1)}
            lineWidth={layout.lineWidth}
            onStep={stepDown}
          />
        </pixiContainer>
      )}
      {view?.onPans && (
        <Blade
          hidden={carriedFrom(carry, 'pans')}
          box={layout.onPans}
          grabBox={layout.onPansGrab}
          parts={view.parts}
          halves
          jammed
          fontSize={fontSize}
          lineWidth={layout.lineWidth}
          onGrab={grab('pans', layout.onPans, view.parts)}
        />
      )}
      {carry && (
        <Carried carry={carry} drag={drag} fontSize={fontSize} lineWidth={layout.lineWidth} />
      )}
    </pixiContainer>
  );
}

function Holder({ layout }: { layout: SplitterLayout }) {
  const { box, lineWidth } = layout;
  const draw = useCallback(
    (g: Graphics) => splitterSkin.holder(g, { ...box, lineWidth }),
    [box, lineWidth],
  );
  return <pixiGraphics draw={draw} />;
}

interface BladeProps {
  /** Where the blade is drawn: its top-left corner and size, in scene units. */
  box: Box;
  /** Where a drag of it can start, in scene units; null for a carried blade. */
  grabBox: Box | null;
  parts: number;
  halves: boolean;
  jammed: boolean;
  fontSize: number;
  lineWidth: number;
  onGrab: ((event: FederatedPointerEvent) => void) | null;
  /** Carried away, or sliding back: not drawn here, though it can still be grabbed. */
  hidden?: boolean;
}

/** The blade, marked into its parts, with the number of parts on its tag. */
function Blade({
  box,
  grabBox,
  parts,
  halves,
  jammed,
  fontSize,
  lineWidth,
  onGrab,
  hidden = false,
}: BladeProps) {
  const { width, height } = box;
  const shape: BladeShape = useMemo(
    () => ({ width, height, parts, halves, jammed, lineWidth }),
    [width, height, parts, halves, jammed, lineWidth],
  );
  const draw = useCallback((g: Graphics) => splitterSkin.blade(g, shape), [shape]);
  const tag = bladeTag(shape);
  const style: TextStyleOptions = useMemo(
    () => ({
      fontFamily: 'system-ui, sans-serif',
      fontSize,
      fontWeight: '700',
      fill: jammed ? palette.jam : palette.ink,
    }),
    [fontSize, jammed],
  );
  const hitArea = useMemo(
    () =>
      grabBox
        ? new Rectangle(grabBox.x - box.x, grabBox.y - box.y, grabBox.width, grabBox.height)
        : null,
    [grabBox, box.x, box.y],
  );
  const grabbable = onGrab !== null && hitArea !== null;
  return (
    <pixiContainer
      x={box.x}
      y={box.y}
      eventMode={grabbable ? 'static' : 'none'}
      interactiveChildren={false}
      hitArea={hitArea}
      onPointerDown={onGrab ?? undefined}
    >
      <pixiContainer visible={!hidden}>
        <pixiGraphics draw={draw} />
        <pixiText
          text={formatNumber(parts)}
          anchor={0.5}
          x={tag.x + tag.width / 2}
          y={tag.y + tag.height / 2}
          style={style}
        />
      </pixiContainer>
    </pixiContainer>
  );
}

interface CarriedProps {
  carry: SplitterCarry;
  drag: SplitterDrag;
  fontSize: number;
  lineWidth: number;
}

/**
 * The blade he carries, under his finger. When the store takes the drag it fades where it
 * is (the splitter shows back in its holder, or across the pans); otherwise it slides back
 * to where he grabbed it. Either way the carry then settles.
 */
function Carried({ carry, drag, fontSize, lineWidth }: CarriedProps) {
  const ref = useRef<Container>(null);
  const { width, height } = carry.home;
  const box = useMemo(() => ({ x: 0, y: 0, width, height }), [width, height]);

  useLayoutEffect(() => {
    const move = (at: Point) => ref.current?.position.set(at.x, at.y);
    const now = drag.position();
    if (now) move(now);
    drag.setMoveListener(move);
    return () => drag.setMoveListener(null);
  }, [drag]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (carry.phase === 'held') {
      node.alpha = 1;
      return;
    }
    const from = drag.position() ?? carry.home;
    const to = carry.home;
    const controls =
      carry.phase === 'landing'
        ? animate(0, 1, {
            duration: landMs / 1000,
            ease: 'easeOut',
            onUpdate: (t) => {
              node.alpha = 1 - t;
            },
            onComplete: () => drag.settle(),
          })
        : animate(0, 1, {
            duration: returnMs / 1000,
            ease: 'easeOut',
            onUpdate: (t) =>
              node.position.set(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t),
            onComplete: () => drag.settle(),
          });
    return () => {
      controls.stop();
      // Unmounted mid-animation, the carry still ends (a new drag has already replaced it otherwise).
      drag.settle();
    };
  }, [carry, drag]);

  return (
    <pixiContainer ref={ref} eventMode="none">
      <Blade
        box={box}
        grabBox={null}
        parts={carry.parts}
        halves={carry.from === 'pans'}
        jammed={carry.from === 'pans'}
        fontSize={fontSize}
        lineWidth={lineWidth}
        onGrab={null}
      />
    </pixiContainer>
  );
}
