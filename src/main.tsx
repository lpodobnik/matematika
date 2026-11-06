// Pixi without eval, so the production CSP needs no 'unsafe-eval' (architecture, Security).
import 'pixi.js/unsafe-eval';
import '@/app/app.css';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { boot } from '@/app/boot';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { crashReporter } from '@/lib/crash';
import { backupPayload } from '@/links/backup';
import { saveStorage } from '@/save/storage';
import { gameStore } from '@/store/store';

crashReporter.install(window);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('index.html has no #root element');

/** Luka's view () and a backup link () open in place of the game (story 2.11). */
function routeOf(hash: string): string {
  if (hash === '#dnevnik') return 'dnevnik';
  const backup = backupPayload(hash);
  return backup === null ? 'game' : `backup:${backup}`;
}
const route = routeOf(location.hash);
const lukaRoute = route !== 'game';
// A new address of another kind (the game, Luka's view, a backup link) starts the page
// afresh, so each opens as it would from scratch.
window.addEventListener('hashchange', () => {
  if (routeOf(location.hash) !== route) location.reload();
});

if (lukaRoute) {
  // Loaded on demand, so the game's bundle doesn't carry it (architecture, Loading).
  const LukaApp = lazy(() => import('@/app/luka'));
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback={null}>
          <LukaApp hash={location.hash} />
        </Suspense>
      </ErrorBoundary>
    </StrictMode>,
  );
} else {
  // The game mounts on its loading screen (story 2.1), then starts from the save.
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
  void boot(saveStorage, gameStore.getState().dispatch);
}
