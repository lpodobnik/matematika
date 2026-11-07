// The launch (story 2.1; architecture, src/main.tsx: "read fragment → load save → mount"):
// the loading screen shows while the save is read and the assets load, then the game starts
// from the save. Links (`#b`, `#s`, `#r`) are read here too from story 2.11 and epic 5.

import { recordError } from '@/lib/error-log';
import type { LoadResult, SaveStorage } from '@/save/storage';
import type { Action } from '@/store/actions';
import { fromSaveV1 } from '@/store/persist';
import { openingArt } from '@/ui/opening/art';
import { townImages } from '@/ui/town/art';

/** Loads the assets, reporting how much has loaded, 0–1. */
export type AssetLoader = (onProgress: (loaded: number) => void) => Promise<void>;

/**
 * The pictures the game shows outside the scene (story 5.0): the opening's panels and the
 * town, fetched and decoded behind the loading screen so nothing pops in. One that fails is
 * skipped; the browser fetches it again when it shows. Pixi `Assets` bundles join here.
 */
export const loadAssets: AssetLoader = async (onProgress) => {
  const urls = [...openingArt.map((art) => art.src), ...townImages];
  if (typeof Image === 'undefined' || urls.length === 0) {
    onProgress(1);
    return;
  }
  let done = 0;
  await Promise.all(
    urls.map(async (url) => {
      const image = new Image();
      image.src = url;
      try {
        await image.decode();
      } catch {
        // Skipped: see above.
      }
      done += 1;
      onProgress(done / urls.length);
    }),
  );
};

/**
 * Reads the save, loads the assets, then starts the game (`boot/start`): from the save, or
 * new when there is none or it couldn't be read. Assets that fail to load are logged and the
 * game starts anyway, as far as it can, rather than staying on the loading screen.
 */
export async function boot(
  storage: Pick<SaveStorage, 'load'>,
  dispatch: (action: Action) => void,
  load: AssetLoader = loadAssets,
  now: () => Date = () => new Date(),
): Promise<LoadResult> {
  const result = storage.load(now().toISOString());
  try {
    await load((loaded) => dispatch({ type: 'boot/progress', loaded }));
  } catch (error) {
    recordError('error', error);
  }
  const from = result.save ? fromSaveV1(result.save) : null;
  try {
    dispatch({
      type: 'boot/start',
      save: from?.save ?? null,
      room: from?.room ?? null,
      fight: from?.fight ?? null,
    });
  } catch (error) {
    // A room in progress that throws as it resumes must not stop every launch: he starts at
    // the next room instead, and the save keeps the rest (story 2.1 review).
    recordError('save', error);
    dispatch({ type: 'boot/start', save: from?.save ?? null, room: null });
  }
  return result;
}
