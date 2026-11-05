import { Application, extend, useApplication } from '@pixi/react';
import { Container, Graphics, type Application as PixiApplication } from 'pixi.js';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { palette } from '@/art/palette';
import { watchContextLoss } from '@/ui/scene/context-loss';
import { fitScene, sceneSize } from '@/ui/scene/fit-scene';

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
      preference="webgl"
      background={palette.table}
      onInit={handleInit}
    >
      <SceneContent />
    </Application>
  );
}

function drawEmptyScene(g: Graphics): void {
  const { width, height } = sceneSize;
  g.clear();
  g.rect(0, 0, width, height).fill(palette.paper);
  for (let x = gridStep; x < width; x += gridStep) g.moveTo(x, 0).lineTo(x, height);
  for (let y = gridStep; y < height; y += gridStep) g.moveTo(0, y).lineTo(width, y);
  g.stroke({ width: 1, color: palette.ink, alpha: 0.12 });
  g.rect(3, 3, width - 6, height - 6).stroke({ width: 6, color: palette.ink, alpha: 0.6 });
}

/** The empty logical scene, scaled to fit and centred; layout goes through a ref. */
function SceneContent() {
  const { app, isInitialised } = useApplication();
  const sceneRef = useRef<Container>(null);

  useEffect(() => {
    if (!isInitialised) return;
    const renderer = app.renderer;
    const layout = () => {
      const scene = sceneRef.current;
      if (!scene) return;
      const fit = fitScene(app.screen.width, app.screen.height);
      scene.scale.set(fit.scale);
      scene.position.set(fit.x, fit.y);
    };
    layout();
    renderer.on('resize', layout);
    return () => {
      renderer.off('resize', layout);
    };
  }, [app, isInitialised]);

  return (
    <pixiContainer ref={sceneRef}>
      <pixiGraphics draw={drawEmptyScene} />
    </pixiContainer>
  );
}
