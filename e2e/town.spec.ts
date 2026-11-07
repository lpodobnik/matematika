// Story 5.0: a new game, as Luka's son meets it. The opening, the naming, the town; he
// walks to Penkala and is introduced, walks to the gate and plays room 1, and comes back
// out into the town with the gate in colour and Nikola there. Real taps throughout, except
// room 1's dial, which goes to the store as the scene would send it.

import { expect, type Page, test } from '@playwright/test';
import type { GameState } from '../src/store/types';

type Game = { __s: { getState(): GameState }; __d(action: unknown): void };

async function hook(page: Page) {
  await page.waitForFunction(() => !document.querySelector('.boot'), null, { timeout: 20_000 });
  await page.evaluate(async () => {
    const loaded = performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .find((name) => new URL(name).pathname === '/src/store/store.ts');
    const m = await import(/* @vite-ignore */ loaded ?? '/src/store/store.ts');
    const w = window as unknown as Game;
    w.__s = m.gameStore;
    w.__d = (action) => m.gameStore.getState().dispatch(action);
  });
  await page.waitForFunction(
    () => (window as unknown as Game).__s.getState().ui.screen !== 'loading',
  );
}

const state = (page: Page) => page.evaluate(() => (window as unknown as Game).__s.getState());
const dispatch = (page: Page, action: unknown) =>
  page.evaluate((a) => (window as unknown as Game).__d(a), action);
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/town-${test.info().project.name}-${name}.png` });

test('a new game: the opening, the naming, the town, room 1 and back', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);

  // The opening, four panels; a tap on each goes on.
  expect((await state(page)).ui.screen).toBe('opening');
  await page.waitForTimeout(700);
  await shot(page, '1-opening');
  for (let i = 0; i < 3; i += 1) await page.locator('.opening__panel').click();
  await page.locator('.opening__panel').click();

  // The naming, now before any room.
  expect((await state(page)).ui.screen).toBe('naming');
  await page.locator('input[type="text"]').fill('Ivo');
  await page.locator('.naming__look').first().click();
  await page.locator('button[type="submit"]').click();
  await page.getByRole('button', { name: 'Dalje' }).click();

  // The town.
  await expect(page.locator('.town__board')).toBeVisible();
  expect((await state(page)).room).toBeNull();
  await expect(page.locator('.town__next')).toBeVisible();
  await page.waitForTimeout(500);
  await shot(page, '2-town');

  // He walks to Penkala, who introduces himself.
  await page.locator('[data-person="penkala"]').click();
  await expect(page.locator('.town__bubble')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('.town__intro')).toContainText('Penkala');
  await shot(page, '3-penkala');
  await page.locator('.town__bubble').click();
  await page.locator('.town__bubble').click();
  await expect(page.locator('.town__bubble')).toHaveCount(0);

  // The lamps are not his yet: a bubble says so.
  await page.locator('.town__place[data-node="r02"]').click();
  await expect(page.locator('.town__bubble')).toBeVisible({ timeout: 8000 });
  await page.locator('.town__bubble').click();

  // He walks to the gate, and room 1 opens.
  await page.locator('.town__place[data-node="r01"]').click();
  await page.waitForFunction(
    () => (window as unknown as Game).__s.getState().ui.screen === 'room',
    null,
    { timeout: 10_000 },
  );
  expect((await state(page)).room?.spec.id).toBe('r01');
  await page.waitForTimeout(800);
  await shot(page, '4-room-1');

  // Room 1: he plays it (the dial through the store), writes 5 twice.
  await page
    .locator('.scene-area canvas')
    .first()
    .click({ position: { x: 300, y: 300 } });
  for (const x of [1, 2, 3, 4, 5]) await dispatch(page, { type: 'dial/set', x });
  for (let i = 0; i < 2; i += 1) {
    await page.locator('.pad__key[data-key="5"]').click();
    await page.locator('.pad__key[data-key="enter"]').click();
  }
  await page.waitForFunction(
    () => (window as unknown as Game).__s.getState().ui.screen === 'story',
    null,
    { timeout: 20_000 },
  );
  await page.getByRole('button', { name: 'Dalje' }).click();

  // Back in the town, outside the gate, now in colour; Nikola is there.
  await expect(page.locator('.town__board')).toBeVisible();
  expect((await state(page)).save.progress.roomsDone).toEqual(['r01']);
  await expect(page.locator('.town__place[data-node="r01"]')).toHaveAttribute(
    'data-state',
    'restored',
  );
  await expect(page.locator('[data-person="nikola"]')).toBeVisible();
  await page.waitForTimeout(2600);
  await shot(page, '5-town-after-room-1');

  // The district map is a tap away, and closes again.
  await page.getByRole('button', { name: 'Karta četvrti' }).click();
  await expect(page.locator('.map__board')).toBeVisible();
  await page.getByRole('button', { name: 'Zatvori' }).click();
  await expect(page.locator('.map__board')).toHaveCount(0);
});
