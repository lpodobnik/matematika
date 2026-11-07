import { lazy, Suspense, useEffect, useRef } from 'react';
import { startClock } from '@/app/clock';
import { LoadingScreen } from '@/app/LoadingScreen';
import { PortraitOverlay } from '@/app/PortraitOverlay';
import { installSound } from '@/app/sound';
import { audio } from '@/audio/index';
import { useGame } from '@/store/store';
import type { Screen } from '@/store/types';
import { GoalBanner } from '@/ui/common/GoalBanner';
import { HintButton } from '@/ui/common/HintButton';
import { MapButton } from '@/ui/common/MapButton';
import { MuteButton } from '@/ui/common/MuteButton';
import { PartsCounter } from '@/ui/common/PartsCounter';
import { PinConfirm } from '@/ui/common/PinConfirm';
import { ResetButton } from '@/ui/common/ResetButton';
import { FightScreen } from '@/ui/fight/FightScreen';
import { NamingScreen } from '@/ui/naming/NamingScreen';
import { Notebook } from '@/ui/notebook/Notebook';
import { OpeningScreen } from '@/ui/opening/OpeningScreen';
import { SceneRoot } from '@/ui/scene/SceneRoot';
import { ShopScreen } from '@/ui/shop/ShopScreen';
import { StoryScreen } from '@/ui/story/StoryScreen';
import { TownScreen } from '@/ui/town/TownScreen';

// Development builds only, loaded on demand (architecture, Debug Tools): production builds
// drop this branch, and the panel's code with it.
const DevPanel = import.meta.env.DEV ? lazy(() => import('@/dev/DevPanel')) : null;

// Landscape layout: the scene on the left and the notebook beside it on the tablet; on a
// phone the notebook slides over the scene (ui/notebook/notebook.css). The canvas fills
// the scene area and SceneRoot scales the scene to fit. The reset control sits in the
// scene area's top-left corner, with the hint button under it (story 1.16), and the parts
// counter in its bottom-left; the pin's confirm control sits beside the pin's head while a
// pin waits to be confirmed. The clock ticks for as long as the game is open.
//
// The screen is a field in the store: the loading screen until the save is read and the
// assets are loaded (story 2.1); the city map after every restart and whenever he leaves a
// room (story 2.2), when the scene unmounts until he travels into a room again; and, once,
// the naming after room 1 (story 2.4); and a room's story card the first time its restart
// ends (story 2.5); and an automaton fight, entered from a lair on the map (story 3.1).
// Story 5.0: a new game opens on the opening, and the map screen now shows the town, with
// the district map a tap away. Story 6.2: the mute control sits in the top-right corner of
// every screen but the loading one.
export function App() {
  const dispatch = useGame((s) => s.dispatch);
  const screen = useGame((s) => s.ui.screen);
  const loaded = useGame((s) => s.ui.loaded);

  useEffect(() => startClock(window, dispatch), [dispatch]);
  // Story 6.2: the first tap starts the sound; buttons tap.
  useEffect(() => installSound(window, audio), []);

  return <AppScreen screen={screen} loaded={loaded} />;
}

function ScreenInPlay({ screen, loaded }: { screen: Screen; loaded: number }) {
  if (screen === 'loading') return <LoadingScreen loaded={loaded} />;
  if (screen === 'opening') return <OpeningScreen />;
  if (screen === 'map') return <TownScreen />;
  if (screen === 'naming') return <NamingScreen />;
  if (screen === 'story') return <StoryScreen />;
  if (screen === 'fight') return <FightScreen />;
  if (screen === 'shop') return <ShopScreen />;
  return <RoomScreen />;
}

/** The screen in play, from props only. */
export function AppScreen({ screen, loaded = 1 }: { screen: Screen; loaded?: number }) {
  return (
    <div className="app">
      <ScreenInPlay screen={screen} loaded={loaded} />
      <MuteButton />
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
        <HintButton />
        <MapButton />
        <PinConfirm area={sceneAreaRef} />
        <PartsCounter area={sceneAreaRef} />
        <GoalBanner area={sceneAreaRef} />
      </main>
      <Notebook />
    </>
  );
}
