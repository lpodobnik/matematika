// Story 6.2: the mute control is on every screen (the opening, the town, a room, a fight),
// toggles, and is kept in the save across a reload. The first tap starts the sound, and the
// town plays the restored machines' loops.

import { expect, type Page, test } from '@playwright/test';
import type { GameState } from '../src/store/types';

type Engine = { running: boolean };
type Game = {
  __s: { getState(): GameState };
  __d(action: unknown): void;
  __audio: Engine;
};

/** The store and the audio engine, the very modules the game loaded. */
async function hook(page: Page) {
  await page.waitForFunction(() => !document.querySelector('.boot'), null, { timeout: 20_000 });
  await page.evaluate(async () => {
    const loaded = (path: string) =>
      performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .find((name) => new URL(name).pathname === path) ?? path;
    const store = await import(/* @vite-ignore */ loaded('/src/store/store.ts'));
    const audio = await import(/* @vite-ignore */ loaded('/src/audio/index.ts'));
    const w = window as unknown as Game;
    w.__s = store.gameStore;
    w.__d = (action) => store.gameStore.getState().dispatch(action);
    w.__audio = audio.audio;
  });
  await page.waitForFunction(
    () => (window as unknown as Game).__s.getState().ui.screen !== 'loading',
  );
}

const state = (page: Page) => page.evaluate(() => (window as unknown as Game).__s.getState());
const dispatch = (page: Page, action: unknown) =>
  page.evaluate((a) => (window as unknown as Game).__d(a), action);
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/sound-${test.info().project.name}-${name}.png` });

const mute = (page: Page) => page.getByRole('button', { name: 'Bez zvuka' });

/** A game with rooms 1–6 done, in the town, as a save would bring it, with the settings kept. */
async function startInTown(page: Page) {
  await page.evaluate(async () => {
    const persist: string = '/src/store/persist.ts';
    const p = await import(/* @vite-ignore */ persist);
    const s = p.newSave('2026-11-07T08:00:00.000Z');
    const done = ['r01', 'r02', 'r03', 'r04', 'r05', 'r06'];
    (window as unknown as Game).__d({
      type: 'boot/start',
      save: {
        ...s,
        character: { name: 'Ivo', look: 'look-1' },
        settings: (window as unknown as Game).__s.getState().save.settings,
        progress: {
          ...s.progress,
          roomsDone: done,
          told: done,
          tools: ['balance', 'workshop'],
          onMap: true,
          introSeen: true,
          firstUse: ['fight-guide'],
        },
      },
      room: null,
      fight: null,
    });
  });
  await expect(page.locator('.town__board')).toBeVisible();
}

test('the mute control toggles, is kept across a reload, and is on every screen', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);

  // The opening: the speaker is there, sounding.
  expect((await state(page)).ui.screen).toBe('opening');
  await expect(mute(page)).toBeVisible();
  await expect(mute(page)).toHaveAttribute('aria-pressed', 'false');
  const box = await mute(page).boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(48);
  expect(box?.height).toBeGreaterThanOrEqual(48);

  // The first tap starts the sound.
  await page.locator('.opening__panel').click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as Game).__audio.running))
    .toBe(true);

  // Muted: the save keeps it, and the sound stops.
  await mute(page).click();
  await expect(mute(page)).toHaveAttribute('aria-pressed', 'true');
  expect((await state(page)).save.settings.muted).toBe(true);
  expect(await page.evaluate(() => (window as unknown as Game).__audio.running)).toBe(false);
  const saved = await page.evaluate(() => localStorage.getItem('matematika:save'));
  expect(JSON.parse(saved ?? '{}').settings?.muted).toBe(true);

  // Still muted after a reload.
  await page.reload();
  await hook(page);
  await expect(mute(page)).toHaveAttribute('aria-pressed', 'true');
  expect((await state(page)).save.settings.muted).toBe(true);
  await shot(page, '1-opening-muted');

  // In the town, in a room and in a fight, the same control.
  await startInTown(page);
  await expect(mute(page)).toBeVisible();
  await expect(mute(page)).toHaveAttribute('aria-pressed', 'true');
  await mute(page).click();
  await expect(mute(page)).toHaveAttribute('aria-pressed', 'false');
  expect((await state(page)).save.settings.muted).toBe(false);
  await page.waitForTimeout(400);
  await shot(page, '2-town');

  await dispatch(page, { type: 'room/enter', roomId: 'r07' });
  await expect(page.locator('.scene-area')).toBeVisible();
  await expect(mute(page)).toBeVisible();
  await page.waitForTimeout(800);
  await shot(page, '3-room');

  await dispatch(page, { type: 'map/open' });
  await expect(page.locator('.town__board')).toBeVisible();
  await page.getByRole('button', { name: 'Karta četvrti' }).click();
  await dispatch(page, { type: 'map/travel', node: 'lair-20' });
  await expect(page.locator('.fight')).toBeVisible();
  await expect(mute(page)).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, '4-fight');
  await mute(page).click();
  await expect(mute(page)).toHaveAttribute('aria-pressed', 'true');

  expect(errors).toEqual([]);
});
