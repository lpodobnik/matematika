// Pixi without eval, so the production CSP needs no 'unsafe-eval' (architecture, Security).
import 'pixi.js/unsafe-eval';
import '@/app/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { crashReporter } from '@/lib/crash';
import { gameStore } from '@/store/store';

// Later stories add: read the fragment, load the save, then mount.
crashReporter.install(window);

// Until the map (epic 2), the game opens on room 1.
gameStore.getState().dispatch({ type: 'room/enter', roomId: 'r01' });

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('index.html has no #root element');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
