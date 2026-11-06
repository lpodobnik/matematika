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
import { type FrameShape, frameTag, splitterSkin } from '@/art/skins/splitter';
import { divisorLabel } from '@/room/pieces';
import {
  canStepParts,
  splitGroups,
  splitterView,
  splitterWorks,
  stepSplitter,
} from '@/room/splitter';
import { gameStore, useGame } from '@/store/store';
import { watchDragCancel } from '@/ui/scene/scale/dial-drag';
import type { Box } from '@/ui/scene/scale/dial-layout';
import { labelFontSize } from '@/ui/scene/scale/layout';
import { pinWiggle } from '@/ui/scene/scale/pin-layout';
import { StepButton } from '@/ui/scene/scale/StepButton';
import type { SplitShowChannel } from '@/ui/scene/scale/split-show';
import {
  type SplitterCarry,
  type SplitterDrag,
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
  /** Carries the divider frame over the scale. */
  drag: SplitterDrag;
  /** A point on the canvas in scene units. */
  toScene(point: PointData): Point;
  /** Where a split it is let go for shows on the pans (Scale.tsx draws it). */
  show: SplitShowChannel;
}

/** A splitter that does nothing now (a wrong line jams the machine) is drawn faint. */
const idleAlpha = 0.45;

function useSplitterCarry(drag: SplitterDrag): SplitterCarry | null {
  return useSyncExternalStore(drag.subscribe, drag.carry, drag.carry);
}

/**
 * Whether the frame in its holder is hidden: while he carries it, and while it goes back.
 * Once the store has taken the drag it shows in its holder again, while the carried one
 * fades. A hidden frame can still be grabbed, so a drag during the way back starts at once,
 * and a way back that never plays (a page in the background has no animation frames) never
 * leaves it out of reach.
 */
function carried(carry: SplitterCarry | null): boolean {
  return carry !== null && carry.phase !== 'landing';
}

/**
 * The splitter (Pattern 1, Balance moves; story 1.15): a divider frame of 2–9 equal
 * compartments with its number `: n` on its tag, offered in its holder in the top-left
 * corner once a side holds only x pieces, and set by its − and + (which repeat when held).
 * He drags it anywhere over the scale. Before the store hears of it, the pans show what it
 * does (split-show.ts): each side's pieces separate into equal groups; an even split is
 * then a Balance move (room/splitter.ts), and an uneven one slides back together while the
 * frame goes home. The first time it is offered it wiggles once. It draws the frame he
 * carries above everything, moved through a ref as his finger moves.
 */
export function Splitter({ sceneScale, drag, toScene, show }: Props) {
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
  // store what the split does, since that is the store the dispatch reaches.
  const latestLayout = useRef(layout);
  useLayoutEffect(() => {
    latestLayout.current = layout;
  });

  useEffect(() => {
    drag.setReleaseHandler((_held, at) => {
      const current = latestLayout.current;
      if (!current) return false;
      const action = splitterAction(at, current);
      const { room: live, save } = gameStore.getState();
      if (!action || !live || !splitterWorks(live, save.progress.tools)) return false;
      const groups = splitGroups(live.stage.pans, live.stage.splitter);
      const takes = groups.even && splitterTakes(live, save.progress.tools, action);
      // Story 1.15: an uneven split is shown separating and sliding back, never a jam.
      if (takes || !groups.even) show.play(groups);
      if (!takes) return false;
      dispatch(action);
      return true;
    });
    return () => drag.setReleaseHandler(null);
  }, [drag, dispatch, show]);

  // A drag is followed on the stage: every move, and up or up outside wherever the finger
  // was let go. A cancelled pointer, blur or a hidden page is not a release: it goes back.
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
    (home: Box, parts: number) => (event: FederatedPointerEvent) => {
      if (event.button !== 0) return;
      drag.start(event.pointerId, home, parts, toScene(event.global));
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
        <pixiContainer ref={holderRef} alpha={view.works ? 1 : idleAlpha}>
          <Holder layout={layout} />
          <Frame
            hidden={carried(carry)}
            box={layout.frame}
            grabBox={layout.grab}
            parts={view.parts}
            fontSize={fontSize}
            lineWidth={layout.lineWidth}
            onGrab={view.works ? grab(layout.frame, view.parts) : null}
          />
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

interface FrameProps {
  /** Where the frame is drawn: its top-left corner and size, in scene units. */
  box: Box;
  /** Where a drag of it can start, in scene units; null for a carried frame. */
  grabBox: Box | null;
  parts: number;
  fontSize: number;
  lineWidth: number;
  onGrab: ((event: FederatedPointerEvent) => void) | null;
  /** Carried away, or going back: not drawn here, though it can still be grabbed. */
  hidden?: boolean;
}

/** The divider frame, walled into its compartments, with `: n` on its tag. */
function Frame({ box, grabBox, parts, fontSize, lineWidth, onGrab, hidden = false }: FrameProps) {
  const { width, height } = box;
  const shape: FrameShape = useMemo(
    () => ({ width, height, parts, lineWidth }),
    [width, height, parts, lineWidth],
  );
  const draw = useCallback((g: Graphics) => splitterSkin.frame(g, shape), [shape]);
  const tag = frameTag(shape);
  const style: TextStyleOptions = useMemo(
    () => ({ fontFamily: 'system-ui, sans-serif', fontSize, fontWeight: '700', fill: palette.ink }),
    [fontSize],
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
          text={divisorLabel(BigInt(parts))}
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
 * The frame he carries, under his finger. When the store takes the drag it fades where it
 * is (the splitter shows back in its holder); otherwise it goes back to where he grabbed it.
 * Either way the carry then settles.
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
      <Frame
        box={box}
        grabBox={null}
        parts={carry.parts}
        fontSize={fontSize}
        lineWidth={lineWidth}
        onGrab={null}
      />
    </pixiContainer>
  );
}
