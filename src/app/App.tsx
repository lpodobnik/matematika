import { useRef } from 'react';
import { PortraitOverlay } from '@/app/PortraitOverlay';
import { SceneRoot } from '@/ui/scene/SceneRoot';

// Landscape layout: the scene on the left, the notebook beside it (a placeholder until
// story 1.6). The canvas fills the scene area and SceneRoot scales the scene to fit.
export function App() {
  const sceneAreaRef = useRef<HTMLDivElement>(null);
  return (
    <div className="app">
      <main className="scene-area" ref={sceneAreaRef}>
        <SceneRoot resizeTo={sceneAreaRef} />
      </main>
      <aside className="notebook-area" aria-hidden="true" />
      <PortraitOverlay />
    </div>
  );
}
