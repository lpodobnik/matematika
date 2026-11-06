// Pixi without eval, so the production CSP needs no 'unsafe-eval' (architecture, Security).
import 'pixi.js/unsafe-eval';
import '@/app/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { boot } from '@/app/boot';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { crashReporter } from '@/lib/crash';
import { saveStorage } from '@/save/storage';
import { gameStore } from '@/store/store';

crashReporter.install(window);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('index.html has no #root element');

// The game mounts on its loading screen (story 2.1), then starts from the save.
createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

void boot(saveStorage, gameStore.getState().dispatch);
