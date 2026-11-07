// Pixi without eval, so the production CSP needs no 'unsafe-eval' (architecture, Security).
import 'pixi.js/unsafe-eval';
import '@/app/app.css';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { boot } from '@/app/boot';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { bootFriend, handleReply } from '@/app/friend';
import { crashReporter } from '@/lib/crash';
import { backupPayload } from '@/links/backup';
import { replyOf, roomPayload } from '@/links/room-link';
import { saveStorage } from '@/save/storage';
import { gameStore } from '@/store/store';

crashReporter.install(window);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('index.html has no #root element');

/**
 * Luka's view () and a backup link () open in place of the game (story 2.11). Epic 5: a
 * friend's room link (`#s=`) opens the game in friend mode, and a reply link (`#r=`) the
 * game, which stamps the room once the save is read.
 */
function routeOf(hash: string): string {
  if (hash === '#dnevnik') return 'dnevnik';
  const backup = backupPayload(hash);
  if (backup !== null) return `backup:${backup}`;
  const room = roomPayload(hash);
  if (room !== null) return `friend:${room}`;
  return replyOf(hash) ? `reply:${hash}` : 'game';
}
const route = routeOf(location.hash);
const lukaRoute = route === 'dnevnik' || route.startsWith('backup:');
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
  const { dispatch } = gameStore.getState();
  const friendRoom = roomPayload(location.hash);
  if (friendRoom !== null) {
    // A friend's page never reads the save, so it never writes one.
    bootFriend(friendRoom, dispatch);
  } else {
    const hash = location.hash;
    void boot(saveStorage, dispatch).then(() => {
      if (replyOf(hash)) handleReply(hash, dispatch);
    });
  }
}
