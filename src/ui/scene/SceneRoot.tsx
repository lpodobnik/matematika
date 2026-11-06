import { Application, extend, useApplication } from '@pixi/react';
import {
  Container,
  type FederatedPointerEvent,
  Graphics,
  type Application as PixiApplication,
} from 'pixi.js';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { palette } from '@/art/palette';
import { useGame } from '@/store/store';
import { watchContextLoss } from '@/ui/scene/context-loss';
import { fitScene, sceneSize } from '@/ui/scene/fit-scene';
import { Machine } from '@/ui/scene/machine/Machine';
import { rendererPreference } from '@/ui/scene/renderer';
import { SceneErrorBoundary } from '@/ui/scene/SceneErrorBoundary';
import { Dial } from '@/ui/scene/scale/Dial';
import { Pin } from '@/ui/scene/scale/Pin';
import { Scale } from '@/ui/scene/scale/Scale';

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
 */
function SceneContent() {
  const { app, isInitialised } = useApplication();
  const sceneRef = useRef<Container>(null);
  const [sceneScale, setSceneScale] = useState(0);
  const dispatch = useGame((s) => s.dispatch);

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
    };
    layout();
    renderer.on('resize', layout);
    return () => {
      renderer.off('resize', layout);
    };
  }, [app, isInitialised]);

  return (
    <pixiContainer ref={sceneRef}>
      <pixiGraphics draw={drawPaper} />
      <Machine />
      <Scale sceneScale={sceneScale} />
      <Dial sceneScale={sceneScale} />
      <Pin sceneScale={sceneScale} />
    </pixiContainer>
  );
}
