import { lazy, Suspense, useEffect, useRef } from 'react';
import { startClock } from '@/app/clock';
import { PortraitOverlay } from '@/app/PortraitOverlay';
import { useGame } from '@/store/store';
import { PinConfirm } from '@/ui/common/PinConfirm';
import { ResetButton } from '@/ui/common/ResetButton';
import { Notebook } from '@/ui/notebook/Notebook';
import { SceneRoot } from '@/ui/scene/SceneRoot';

// Development builds only, loaded on demand (architecture, Debug Tools): production builds
// drop this branch, and the panel's code with it.
const DevPanel = import.meta.env.DEV ? lazy(() => import('@/dev/DevPanel')) : null;

// Landscape layout: the scene on the left and the notebook beside it on the tablet; on a
// phone the notebook slides over the scene (ui/notebook/notebook.css). The canvas fills
// the scene area and SceneRoot scales the scene to fit. The reset control sits in the
// scene area's corner, and the pin's confirm control in the opposite corner while a pin
// waits to be confirmed. The clock ticks for as long as the game is open.
export function App() {
  const sceneAreaRef = useRef<HTMLDivElement>(null);
  const dispatch = useGame((s) => s.dispatch);

  useEffect(() => startClock(window, dispatch), [dispatch]);

  return (
    <div className="app">
      <main className="scene-area" ref={sceneAreaRef}>
        <SceneRoot resizeTo={sceneAreaRef} />
        <ResetButton />
        <PinConfirm />
      </main>
      <Notebook />
      <PortraitOverlay />
      {DevPanel && (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      )}
    </div>
  );
}
