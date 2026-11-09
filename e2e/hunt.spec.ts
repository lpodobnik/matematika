// Story 7.6: part 2's way in, as he would meet it. With `?dev`, from the end of part 1 through the
// foundry gate, the empty foundry, naming the little one and into the first new street. Without
// it, the game he plays today: the gate stays sealed and nothing of part 2 shows. Seeded from the
// real path, including the moment before the gate opens. Real taps throughout.

import { expect, type Page, test } from '@playwright/test';
import type { GameState } from '../src/store/types';

type Game = {
  __s: { getState(): GameState };
  __d(action: unknown): void;
};

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
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/hunt-${test.info().project.name}-${name}.png` });

const closeDevPanel = (page: Page) =>
  page.getByRole('button', { name: 'close', exact: true }).click();

/** A fresh game seeded at the end of part 1, on `url`. */
async function endOfPartOne(page: Page, url: string, rooms: string[], bossBeaten: boolean) {
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);
  if (url.includes('dev')) await closeDevPanel(page);
  await page.evaluate(
    ({ rooms, bossBeaten }) => {
      const g = window as unknown as Game;
      const s = g.__s.getState();
      g.__d({
        type: 'boot/start',
        save: {
          ...s.save,
          character: { name: 'Ivo', look: 'look-1' },
          progress: {
            ...s.save.progress,
            introSeen: true,
            roomsDone: rooms,
            told: rooms,
            tools: ['balance', 'workshop', 'chain', 'drum'],
            onMap: true,
          },
          economy: {
            ...s.save.economy,
            lairs: bossBeaten ? { 'lair-60': { rewindsAt: '2000-01-01T00:00:00.000Z' } } : {},
          },
        },
        room: null,
      });
    },
    { rooms, bossBeaten },
  );
}

const allRooms = [
  'r01',
  'r02',
  'r03',
  'r04',
  'r05',
  'r06',
  'r07',
  'r08',
  'r09',
  'r10',
  'r11',
  'r12',
  'r13',
];
const area = (page: Page, id: string) => page.locator(`.town__board[data-area="${id}"]`);

async function toTheYard(page: Page) {
  for (const to of ['canal', 'mill', 'yard']) {
    await page.locator(`.town__sign[data-sign="${to}"]`).click();
    await expect(area(page, to)).toBeVisible({ timeout: 12_000 });
  }
}

async function pad(page: Page, keys: string[]) {
  for (const key of keys)
    await page
      .locator(`.pad__key[data-key="${key}"]`)
      .dispatchEvent('pointerdown', { button: 0, isPrimary: true });
}

test('part 2 off: the gate stays sealed, and nothing of part 2 shows', async ({ page }) => {
  test.setTimeout(120_000);
  await endOfPartOne(page, '/', allRooms, true);
  for (let i = 0; i < 3; i += 1) await page.locator('.opening__panel').click();
  // The last panel promises what comes next, as it always has.
  await expect(page.locator('.opening__panel')).toContainText('Nastavak slijedi');
  await page.locator('.opening__panel').click();
  await toTheYard(page);
  await expect(page.locator('.town__figure--little')).toHaveCount(0);
  await expect(page.locator('.town__sign[data-sign="u1"]')).toHaveCount(0);
  await page.locator('.town__place[data-node="foundry"]').click();
  await expect(page.locator('.town__bubble')).toContainText('5 · x = 40', { timeout: 8000 });
  expect((await state(page)).ui.screen).toBe('map');
  expect((await state(page)).save.hunt.gateOpened).toBe(false);
});

test('part 2 on: the moment before, with room 13 still to do, the gate waits', async ({ page }) => {
  test.setTimeout(120_000);
  await endOfPartOne(page, '/?dev', allRooms.slice(0, 12), true);
  await toTheYard(page);
  await page.locator('.town__place[data-node="foundry"]').click();
  await expect(page.locator('.town__bubble')).toContainText('Ljevaonica', { timeout: 8000 });
  expect((await state(page)).ui.screen).toBe('map');
  expect((await state(page)).save.hunt.scene).toBeNull();
});

test('part 2 on: through the gate, the empty foundry, the name, and up the first street', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await endOfPartOne(page, '/?dev', allRooms, true);
  for (let i = 0; i < 3; i += 1) await page.locator('.opening__panel').click();
  // With part 2 on, the ending doesn't promise what's about to happen.
  await expect(page.locator('.opening__panel')).not.toContainText('Nastavak slijedi');
  await page.locator('.opening__panel').click();
  await toTheYard(page);

  await page.locator('.town__place[data-node="foundry"]').click();
  await expect(page.locator('.gate__plate')).toHaveText('5 · x = 40', { timeout: 8000 });
  await shot(page, '1-gate');

  await pad(page, ['x', '=', '7', 'enter']);
  await expect(page.locator('.gate__line')).toContainText('natrag');
  await pad(page, ['x', '=', '8', 'enter']);
  await expect(page.locator('.hunt__line')).toHaveCount(3);

  // He leaves halfway and comes back to the same lines.
  await page.reload();
  await hook(page);
  await expect(page.locator('.gate__plate')).toBeVisible();
  await expect(page.locator('.hunt__line').nth(1)).toHaveText('x = 8');
  await closeDevPanel(page);

  await pad(page, ['5', '·', '8', '=', '4', '0', 'enter']);
  await expect(page.locator('.opening__panel')).toContainText('hladna i prazna');
  await shot(page, '2-foundry');
  for (let i = 0; i < 4; i += 1) await page.locator('.opening__panel').click();

  await expect(page.locator('.hunt__input')).toBeVisible();
  await shot(page, '3-name');
  await page.locator('.hunt__input').fill('Bip');
  await page.locator('.hunt__confirm').click();

  await expect(area(page, 'u1')).toBeVisible({ timeout: 12_000 });
  const little = page.locator('.town__figure--little');
  await expect(little).toBeVisible();
  const save = (await state(page)).save;
  expect(save.companion?.name).toBe('Bip');
  expect(save.hunt.gateOpened).toBe(true);
  await shot(page, '4-street');

  // Vučetić hands over the map.
  await page.locator('.town__figure--person').click();
  await expect(page.locator('.town__bubble')).toContainText('Zapisano', { timeout: 8000 });
  await expect.poll(async () => (await state(page)).save.hunt.beats).toContain('map-given');

  // The little one says its one word.
  await page.locator('.town__bubble').click();
  await page.locator('.town__bubble').click();
  await little.click();
  await expect(page.locator('.town__bubble')).toContainText('Zašto?');
  await expect(page.locator('.town__bubble')).toContainText('Bip');
  await page.locator('.town__bubble').click();

  // The way back through the foundry, and it comes along.
  await page.locator('.town__sign[data-sign="yard"]').click();
  await expect(area(page, 'yard')).toBeVisible({ timeout: 12_000 });
  await expect(little).toBeVisible();
  await expect(page.locator('.town__sign[data-sign="u1"]')).toBeVisible();
  await shot(page, '5-yard');
});
