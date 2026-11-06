import { lazy, Suspense, useEffect, useRef } from 'react';
import { startClock } from '@/app/clock';
import { PortraitOverlay } from '@/app/PortraitOverlay';
import { ToBeContinued } from '@/app/ToBeContinued';
import { useGame } from '@/store/store';
import type { Screen } from '@/store/types';
import { PartsCounter } from '@/ui/common/PartsCounter';
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
// scene area's top-left corner and the parts counter in its bottom-left; the pin's confirm
// control sits beside the pin's head while a pin waits to be confirmed. The clock ticks for
// as long as the game is open.
//
// The screen is a field in the store: after room 4's restart the placeholder "to be
// continued" screen takes the scene's and notebook's place (story 1.13), and the scene
// unmounts until the dev panel jumps back into a room. The map replaces it in epic 2.
export function App() {
  const dispatch = useGame((s) => s.dispatch);
  const screen = useGame((s) => s.ui.screen);

  useEffect(() => startClock(window, dispatch), [dispatch]);

  return <AppScreen screen={screen} />;
}

/** The screen in play, from props only. */
export function AppScreen({ screen }: { screen: Screen }) {
  return (
    <div className="app">
      {screen === 'continued' ? <ToBeContinued /> : <RoomScreen />}
      <PortraitOverlay />
      {DevPanel && (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      )}
    </div>
  );
}

/**
 * A room in play: the scene, with its reset and pin controls and the parts counter, and the
 * notebook beside it.
 */
function RoomScreen() {
  const sceneAreaRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <main className="scene-area" ref={sceneAreaRef}>
        <SceneRoot resizeTo={sceneAreaRef} />
        <ResetButton />
        <PinConfirm area={sceneAreaRef} />
        <PartsCounter area={sceneAreaRef} />
      </main>
      <Notebook />
    </>
  );
}
