import { useRef } from 'react';
import { PortraitOverlay } from '@/app/PortraitOverlay';
import { Notebook } from '@/ui/notebook/Notebook';
import { SceneRoot } from '@/ui/scene/SceneRoot';

// Landscape layout: the scene on the left and the notebook beside it on the tablet; on a
// phone the notebook slides over the scene (ui/notebook/notebook.css). The canvas fills
// the scene area and SceneRoot scales the scene to fit.
export function App() {
  const sceneAreaRef = useRef<HTMLDivElement>(null);
  return (
    <div className="app">
      <main className="scene-area" ref={sceneAreaRef}>
        <SceneRoot resizeTo={sceneAreaRef} />
      </main>
      <Notebook />
      <PortraitOverlay />
    </div>
  );
}
