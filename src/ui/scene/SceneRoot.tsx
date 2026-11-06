import { Application, extend, useApplication } from '@pixi/react';
import {
  Container,
  type FederatedPointerEvent,
  Graphics,
  type Application as PixiApplication,
  type PointData,
} from 'pixi.js';
import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { palette } from '@/art/palette';
import { useGame } from '@/store/store';
import { watchContextLoss } from '@/ui/scene/context-loss';
import { type CopyPlacement, copyPlacements } from '@/ui/scene/copies';
import { fitScene, sceneSize } from '@/ui/scene/fit-scene';
import { runFrameTest } from '@/ui/scene/frame-test';
import { Machine } from '@/ui/scene/machine/Machine';
import { rendererPreference } from '@/ui/scene/renderer';
import { SceneErrorBoundary } from '@/ui/scene/SceneErrorBoundary';
import { Dial } from '@/ui/scene/scale/Dial';
import { HandoverTag } from '@/ui/scene/scale/HandoverTag';
import { Pin } from '@/ui/scene/scale/Pin';
import { createPieceDrag } from '@/ui/scene/scale/piece-drag';
import { Scale } from '@/ui/scene/scale/Scale';
import { Splitter } from '@/ui/scene/scale/Splitter';
import { createSplitShow } from '@/ui/scene/scale/split-show';
import { createSplitterDrag } from '@/ui/scene/scale/splitter-drag';
import { Tray } from '@/ui/scene/scale/Tray';
import type { Point } from '@/ui/scene/scale/tray-layout';

extend({ Container, Graphics });

const gridStep = 100;

/** Architecture, Asset Management: the renderer's resolution is min(devicePixelRatio, 2). */
function currentResolution(): number {
  return Math.min(window.devicePixelRatio || 1, 2);
}

interface Props {
  /** The element the canvas fills; the scene is scaled to fit inside it. */
  resizeTo: RefObject<HTMLElement | null>;
}

/**
 * The Pixi root: `<Application>`, resize, resolution and WebGL context loss.
 * No game state lives in Pixi objects, so remounting (a new `key`) loses nothing.
 */
export function SceneRoot({ resizeTo }: Props) {
  // A remount also picks up the current device pixel ratio.
  const [mount, setMount] = useState(() => ({ generation: 0, resolution: currentResolution() }));
  const detachRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(false);

  const detach = useCallback(() => {
    detachRef.current?.();
    detachRef.current = null;
  }, []);

  const handleInit = useCallback(
    (app: PixiApplication) => {
      detach();
      // Init is asynchronous: the scene may have unmounted (say, after a crash) meanwhile.
      if (!mountedRef.current) return;
      const stopWatching = watchContextLoss(app.canvas, document, () => {
        detach();
        setMount(({ generation }) => ({
          generation: generation + 1,
          resolution: currentResolution(),
        }));
      });
      // Pixi follows window resizes only; this also catches layout changes beside it.
      const area = resizeTo.current;
      const observer = new ResizeObserver(() => app.queueResize());
      if (area) observer.observe(area);
      detachRef.current = () => {
        stopWatching();
        observer.disconnect();
      };
    },
    [detach, resizeTo],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      detach();
    };
  }, [detach]);

  return (
    <Application
      key={mount.generation}
      resizeTo={resizeTo}
      resolution={mount.resolution}
      autoDensity
      antialias
      // @pixi/react 8.0.5 declares this prop as 'webgl' | 'webgpu', older than Pixi 8.22's
      // array form; it passes the value to app.init unchanged, so the array reaches Pixi.
      preference={rendererPreference as unknown as 'webgl'}
      background={palette.table}
      onInit={handleInit}
    >
      {/* <Application> renders its children in a separate React root: see SceneErrorBoundary. */}
      <SceneErrorBoundary>
        <SceneContent />
      </SceneErrorBoundary>
    </Application>
  );
}

function drawPaper(g: Graphics): void {
  const { width, height } = sceneSize;
  g.clear();
  g.rect(0, 0, width, height).fill(palette.paper);
  for (let x = gridStep; x < width; x += gridStep) g.moveTo(x, 0).lineTo(x, height);
  for (let y = gridStep; y < height; y += gridStep) g.moveTo(0, y).lineTo(width, y);
  g.stroke({ width: 1, color: palette.ink, alpha: 0.12 });
  g.rect(3, 3, width - 6, height - 6).stroke({ width: 6, color: palette.ink, alpha: 0.6 });
}

/**
 * The logical scene, scaled to fit and centred; layout goes through a ref. The scale factor
 * is also state (it changes only on resize), so labels can keep their minimum CSS size.
 *
 * Every press anywhere on the canvas, margins included, reports `machine/touch`: the scene
 * is the machine, and the first touch ends the stage's arrive (Pattern 2). Presses bubble up
 * to the stage from the dial too, after the dial has started its drag, so grabbing the dial
 * is a touch like any other.
 *
 * The scale and the tray share one piece drag (story 1.10): a weight or float can be carried
 * from the tray over the scale, or off a pan, and either acts on both sides (story 1.15). The
 * splitter (story 1.11) has a drag of its own, dropped over the scale, and shows what it does
 * on the pans through the scale (`splitShow`). The tray and the splitter, drawn last, draw
 * what he carries above everything else.
 *
 * Until the quality setting is picked, the frame-time test runs from the scene's first frame,
 * with every effect on (store/quality.ts); a scene remounted mid-test starts it over.
 *
 * For the tablet profile (story 1.13) the dev panel can ask for three copies of the scene
 * side by side (`ui.copies`; ui/scene/copies.ts). Each copy is the scene's machine, steam,
 * scale, dial and pin, reading the same room, so the dial dragged in one moves the pans of
 * all three. The tray and the splitter stay out of the copies: their controls keep 48 CSS
 * px for touch, so at a third of the scene's size they would cover the machines, and a
 * room's machines will share one of each.
 */
function SceneContent() {
  const { app, isInitialised } = useApplication();
  const sceneRef = useRef<Container>(null);
  const [sceneScale, setSceneScale] = useState(0);
  // Where the scene's top-left corner sits in the scene area, in CSS px: the pin's question
  // tag keeps clear of the HTML reset control in the area's corner.
  const [sceneOrigin, setSceneOrigin] = useState<Point>({ x: 0, y: 0 });
  const dispatch = useGame((s) => s.dispatch);
  const copies = useGame((s) => s.ui.copies);
  const placements = useMemo(() => copyPlacements(copies), [copies]);
  const qualityPicked = useGame((s) => s.ui.quality.measured !== null);

  // A layout effect, so the ticker callback goes before the app is destroyed on a remount.
  useLayoutEffect(() => {
    if (!isInitialised || qualityPicked) return;
    return runFrameTest(app.ticker, document, (frameTimesMs) =>
      dispatch({ type: 'quality/measured', frameTimesMs }),
    );
  }, [app, isInitialised, qualityPicked, dispatch]);

  useEffect(() => {
    if (!isInitialised) return;
    const { stage } = app;
    const touch = (event: FederatedPointerEvent) => {
      if (event.button === 0) dispatch({ type: 'machine/touch' });
    };
    stage.eventMode = 'static';
    // The screen rectangle is resized in place, so the hit area follows the canvas.
    stage.hitArea = app.screen;
    stage.on('pointerdown', touch);
    return () => {
      stage.off('pointerdown', touch);
    };
  }, [app, isInitialised, dispatch]);

  useEffect(() => {
    if (!isInitialised) return;
    const renderer = app.renderer;
    const layout = () => {
      const scene = sceneRef.current;
      if (!scene) return;
      const fit = fitScene(app.screen.width, app.screen.height);
      scene.scale.set(fit.scale);
      scene.position.set(fit.x, fit.y);
      setSceneScale(fit.scale);
      setSceneOrigin((origin) =>
        origin.x === fit.x && origin.y === fit.y ? origin : { x: fit.x, y: fit.y },
      );
    };
    layout();
    renderer.on('resize', layout);
    return () => {
      renderer.off('resize', layout);
    };
  }, [app, isInitialised]);

  return (
    <pixiContainer ref={sceneRef}>
      {placements.map((placement, index) => (
        <SceneCopy
          // biome-ignore lint/suspicious/noArrayIndexKey: a copy is its place in the row
          key={`copy-${index}`}
          placement={placement}
          sceneScale={sceneScale}
          sceneOrigin={sceneOrigin}
          tools={placements.length === 1}
        />
      ))}
    </pixiContainer>
  );
}

interface SceneCopyProps {
  placement: CopyPlacement;
  /** The whole scene's CSS px per scene unit. */
  sceneScale: number;
  /** The scene's top-left corner in the scene area, in CSS px. */
  sceneOrigin: Point;
  /** Whether the copy has the tray and the splitter: only when it is the only one. */
  tools: boolean;
}

/**
 * One copy of the scene: the paper, the machine, the scale, the dial, the pin and, when it
 * is the only copy, the tray, the splitter and the pin's question tag. Normally there is
 * one, filling the scene. Its drags and its `toScene` work in its own units, and its parts
 * get its own CSS px per unit, so a notch stays 24 CSS px in a copy drawn at a third of the
 * size.
 */
function SceneCopy({ placement, sceneScale, sceneOrigin, tools }: SceneCopyProps) {
  const copyRef = useRef<Container>(null);
  const drag = useMemo(() => createPieceDrag(), []);
  const splitterDrag = useMemo(() => createSplitterDrag(), []);
  const splitShow = useMemo(() => createSplitShow(), []);
  const toScene = useCallback((point: PointData): Point => {
    const copy = copyRef.current;
    if (!copy) return { x: point.x, y: point.y };
    const local = copy.toLocal(point);
    return { x: local.x, y: local.y };
  }, []);
  const copyScale = sceneScale * placement.scale;
  return (
    <pixiContainer ref={copyRef} x={placement.x} y={placement.y} scale={placement.scale}>
      <pixiGraphics draw={drawPaper} />
      <Machine />
      <Scale sceneScale={copyScale} drag={drag} toScene={toScene} splitShow={splitShow} />
      <Dial sceneScale={copyScale} />
      {/* The pin's question tag keeps 20 CSS px text, so like the tools it is drawn only
          when the copy is the only one. */}
      <Pin sceneScale={copyScale} question={tools ? sceneOrigin : null} />
      {tools && <Tray sceneScale={copyScale} drag={drag} toScene={toScene} />}
      {tools && (
        <Splitter sceneScale={copyScale} drag={splitterDrag} toScene={toScene} show={splitShow} />
      )}
      {/* Story 1.15: the next step's handover tag, over the tools; like them, only in the
          only copy, as its text keeps 20 CSS px. */}
      {tools && <HandoverTag sceneScale={copyScale} origin={sceneOrigin} />}
    </pixiContainer>
  );
}
