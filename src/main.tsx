// Pixi without eval, so the production CSP needs no 'unsafe-eval' (architecture, Security).
import 'pixi.js/unsafe-eval';
import '@/app/app.css';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { boot } from '@/app/boot';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { bootFriend, handleReply } from '@/app/friend';
import { PlayersApp, type PlayersMode } from '@/app/players';
import { crashReporter } from '@/lib/crash';
import { firstPlayer, playersHash, setActivePlayer } from '@/lib/player';
import { backupPayload } from '@/links/backup';
import { replyOf, roomPayload } from '@/links/room-link';
import { listPlayers, playerWithRoom, rememberPlayer, startingPlayer } from '@/save/players';
import { saveStorage } from '@/save/storage';
import { gameStore } from '@/store/store';

crashReporter.install(window);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('index.html has no #root element');
const root = createRoot(rootElement);

/**
 * Luka's view () and a backup link () open in place of the game (story 2.11). Epic 5: a
 * friend's room link (`#s=`) opens the game in friend mode, and a reply link (`#r=`) the
 * game, which stamps the room once the save is read. `#igraci` opens "Tko igra?".
 */
function routeOf(hash: string): string {
  if (hash === '#dnevnik') return 'dnevnik';
  if (hash === playersHash) return 'players';
  const backup = backupPayload(hash);
  if (backup !== null) return `backup:${backup}`;
  const room = roomPayload(hash);
  if (room !== null) return `friend:${room}`;
  return replyOf(hash) ? `reply:${hash}` : 'game';
}
let route = routeOf(location.hash);
const restoring = route.startsWith('backup:');
const lukaRoute = route === 'dnevnik' || restoring;
// A new address of another kind (the game, Luka's view, a backup link) starts the page
// afresh, so each opens as it would from scratch.
window.addEventListener('hashchange', () => {
  if (routeOf(location.hash) !== route) location.reload();
});

function showPlayers(mode: PlayersMode, onChosen: (id: string) => void): void {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <PlayersApp mode={mode} onChosen={onChosen} />
      </ErrorBoundary>
    </StrictMode>,
  );
}

function showLuka(id: string): void {
  // Luka looking doesn't change who plays in this tab; restoring does (app/luka.tsx).
  setActivePlayer(id);
  // Loaded on demand, so the game's bundle doesn't carry it (architecture, Loading).
  const LukaApp = lazy(() => import('@/app/luka'));
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback={null}>
          <LukaApp hash={location.hash} />
        </Suspense>
      </ErrorBoundary>
    </StrictMode>,
  );
}

function mountGame(): void {
  // The game mounts on its loading screen (story 2.1), then starts from the save.
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

/** Starts the game as this player, for this tab until another is picked. */
function play(id: string, hash: string): void {
  setActivePlayer(id);
  rememberPlayer(id);
  mountGame();
  const { dispatch } = gameStore.getState();
  if (new URLSearchParams(location.search).has('dev')) dispatch({ type: 'dev/preview' });
  void boot(saveStorage, dispatch).then(() => {
    if (replyOf(hash)) handleReply(hash, dispatch);
  });
}

/** Picked on "Tko igra?": into the game on this page, with `#igraci` gone from the address. */
function pickedThenPlay(hash: string): (id: string) => void {
  return (id) => {
    if (hash === playersHash) {
      history.replaceState(null, '', `${location.pathname}${location.search}`);
      route = 'game';
    }
    play(id, hash);
  };
}

if (lukaRoute) {
  const players = listPlayers();
  // A backup goes to somebody, or to somebody new; a log, only ever to read, asks among two.
  if (restoring ? players.length > 0 : players.length > 1) {
    showPlayers(restoring ? 'restore' : 'log', showLuka);
  } else {
    showLuka(players[0]?.id ?? firstPlayer);
  }
} else if (roomPayload(location.hash) !== null) {
  // A friend's page never reads a save and picks no player, so it never writes one.
  mountGame();
  bootFriend(roomPayload(location.hash) as string, gameStore.getState().dispatch);
} else {
  const hash = location.hash;
  const reply = replyOf(hash);
  // A reply goes to whoever sent the room, whoever played last.
  const owner = reply ? playerWithRoom(reply.id) : null;
  const starting = owner ?? (route === 'players' ? null : startingPlayer());
  if (starting !== null) play(starting, hash);
  else showPlayers('game', pickedThenPlay(hash));
}
