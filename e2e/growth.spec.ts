// Epic 11 in the browser, on the tablet and the phone: a chalk mark that needs gear, Faust's
// lamp, the paper the little one brings back, and part 2's first automaton. The rules are tested
// in `src/store/growth.test.ts`; this checks the screens.

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
  page.screenshot({ path: `test-results/growth-${test.info().project.name}-${name}.png` });

async function jump(page: Page, place: string) {
  await page.goto('/?dev');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);
  await page.locator(`[data-hunt-jump="${place}"]`).click();
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  await hook(page);
  await page.getByRole('button', { name: 'close', exact: true }).click();
}

test('a chalk mark needs the lamp; with it the little one brings back a paper and parts', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await jump(page, 'l01');
  await expect(page.locator('.town__board[data-area="u1"]')).toBeVisible({ timeout: 12_000 });
  const mark = page.locator('.town__chalk[data-secret="secret-1"]');
  await expect(mark).toHaveAttribute('data-needs', 'lamp');
  await mark.click();
  const bubble = page.locator('.town__bubble');
  await expect(bubble).toContainText('mrak', { timeout: 8_000 });
  // Its second line says what it needs, and where Faust sells it.
  await bubble.click();
  await expect(bubble).toContainText('svjetiljka');
  await shot(page, '1-needs-lamp');

  await dispatch(page, { type: 'dev/set-parts', parts: 30 });
  await dispatch(page, { type: 'map/travel', node: 'workshop' });
  await expect(page.locator('.shop__little')).toBeVisible();
  await page.getByRole('button', { name: 'Jaka svjetiljka: Kupi' }).click();
  expect((await state(page)).save.economy.parts).toBe(15);
  expect((await state(page)).save.companion?.gear).toContain('lamp');
  await page.locator('.shop__little').scrollIntoViewIfNeeded();
  await shot(page, '2-lamp-bought');
  await page.getByRole('button', { name: 'Natrag na kartu' }).click();

  await expect(page.locator('.town__board[data-area="u1"]')).toBeVisible({ timeout: 12_000 });
  await page.locator('.town__chalk[data-secret="secret-1"]').click();
  const card = page.getByRole('dialog', { name: 'Nacrt malog automata' });
  await expect(card).toBeVisible({ timeout: 8_000 });
  await expect(card.locator('.papers__sketch')).toBeVisible();
  expect((await state(page)).save.hunt.secrets).toEqual(['secret-1']);
  expect((await state(page)).save.economy.parts).toBe(20);
  await shot(page, '3-paper');
  await card.getByRole('button', { name: 'Spremi u Radionicu' }).click();
  await expect(card).toBeHidden();
  await expect(page.locator('.town__chalk[data-secret="secret-1"]')).toHaveAttribute(
    'data-found',
    'true',
  );
});

test("part 2's first automaton takes a fight, with its own picture", async ({ page }) => {
  test.setTimeout(90_000);
  await jump(page, 'l01');
  await expect(page.locator('.town__board[data-area="u1"]')).toBeVisible({ timeout: 12_000 });
  await dispatch(page, { type: 'map/travel', node: 'lair-70' });
  await expect(page.locator('.fight')).toBeVisible();
  await expect(page.locator('.fight__armour-number')).toHaveText('70');
  const picture = page.locator('.fight img').first();
  await expect
    .poll(() => picture.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await shot(page, '4-fight');
});
