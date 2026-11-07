// Story 3.7: automaton fights in a real browser, at the tablet's 1280 × 800 and the phone's
// 640 × 360. From a game with rooms 1–6 done (set up through the store, as a save would
// bring it), every fight control is tapped for real: the town's district map button (story
// 5.0) and the lair on the map, the roll, the dice and slots, the blows notches, the strike,
// the leave and its question, the end's way back, the torn page, the map's pages button, and
// the counter's buy and back. Each step is screenshotted into the test's output folder.
//
//   npm run e2e                                       (starts its own server on 5291)
//   E2E_URL=http://localhost:5290/ npm run e2e        (uses a server already running)

import { expect, type Page, test } from '@playwright/test';
import { tuning } from '../src/config/tuning';

/** The part of the game's state the test reads (src/store/types.ts). */
interface GameState {
  ui: { screen: string; fightEnd: { won: boolean; dropped: number; page: string | null } | null };
  fight: { phase: string; armour: number; strikes: number; dice: number[] } | null;
  save: {
    economy: { parts: number; upgrades: string[]; piles: Record<string, number> };
    progress: { tornPages: string[] };
  };
}

type Game = { __s: { getState(): GameState }; __d(action: unknown): void };

/** Reaches the store module the app itself loaded (after a hot reload its URL carries ?t=). */
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

const toSix = ['r01', 'r02', 'r03', 'r04', 'r05', 'r06'];

/** A game with rooms 1–6 done and some parts, in the town, as a save would bring it. */
async function startOnTheMap(page: Page, parts: number) {
  await page.evaluate(
    async ({ done, parts }) => {
      const persist: string = '/src/store/persist.ts';
      const p = await import(/* @vite-ignore */ persist);
      const s = p.newSave('2026-11-07T08:00:00.000Z');
      (window as unknown as Game).__d({
        type: 'boot/start',
        save: {
          ...s,
          character: { name: 'Ivo', look: 'look-1' },
          progress: {
            ...s.progress,
            roomsDone: done,
            told: done,
            tools: ['balance', 'workshop'],
            onMap: true,
            introSeen: true,
            // Past the guided first fight, which e2e/fight-guide.spec.ts walks through.
            firstUse: ['fight-guide'],
          },
          economy: { ...s.economy, parts },
        },
        room: null,
        fight: null,
      });
    },
    { done: toSix, parts },
  );
  await expect(page.locator('.town__board')).toBeVisible();
}

/**
 * The town's corner button opens the district map over it (story 5.0); a fight or the
 * workshop left goes back to the town with it closed.
 */
async function openMap(page: Page) {
  await page.getByRole('button', { name: 'Karta četvrti' }).click();
  await expect(page.locator('.town__overlay .map__board')).toBeVisible();
}

/** One round, tapped: roll, the dice placed hard (or soft), the blows set, the strike. */
async function round(page: Page, hard: boolean) {
  await page.locator('.fight__roll').click();
  await expect(page.locator('.fight__die')).not.toHaveCount(0);
  const dice = await page.locator('.fight__die').evaluateAll((els) =>
    els.map((b) => ({
      i: (b as HTMLElement).dataset.die ?? '',
      v: Number(b.getAttribute('aria-label')?.match(/\d+/)?.[0]),
    })),
  );
  dice.sort((a, b) => (hard ? b.v - a.v : a.v - b.v));
  const slots = hard ? ['blade', 'reach', 'charge'] : ['blade', 'charge', 'reach'];
  for (const [k, slot] of slots.entries()) {
    await page.locator(`.fight__die[data-die="${dice[k]?.i}"]`).click();
    await page.locator(`.fight__slot[data-slot="${slot}"]`).click();
  }
  const notches = page.locator('.fight__notch:not([disabled])');
  const notch = hard ? notches.last() : notches.first();
  await notch.click();
  await expect(notch).toHaveAttribute('aria-pressed', 'true');
  // He sees a · x + b with his numbers, never the total, until the strike.
  await expect(page.locator('.fight__formula')).not.toContainText('=');
  await page.locator('.fight__strike').click();
  await expect(page.locator('.fight__banner')).toContainText('=');
}

const over = async (page: Page) => {
  const phase = (await state(page)).fight?.phase;
  return phase === 'won' || phase === 'lost';
};

test('fights from the map: lose, win the pile back with a page, and buy an upgrade', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
  const shot = async (name: string) => {
    await page.waitForTimeout(300);
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
  };

  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);
  await startOnTheMap(page, 12);
  await openMap(page);
  await shot('01-map');

  // Armour 30, beside the bridge: one soft strike, then leave, which asks and loses.
  await dispatch(page, { type: 'dev/fight-seed', seed: 21 });
  await page.locator('.map__node[data-node="lair-30"]').click();
  await expect(page.locator('.fight')).toBeVisible();
  await shot('02-fight-start');
  await round(page, false);
  expect((await state(page)).fight?.phase).toBe('strike');
  await shot('03-struck');
  // A reload mid-fight resumes it where it was.
  const before = (await state(page)).fight;
  await page.reload();
  await hook(page);
  expect((await state(page)).ui.screen).toBe('fight');
  expect((await state(page)).fight?.armour).toBe(before?.armour);
  await page.locator('.fight__leave').click();
  await expect(page.locator('.fight__confirm')).toBeVisible();
  await shot('04-leave-asks');
  await page.locator('.fight__go').click();
  await expect(page.locator('.fight__end')).toBeVisible();
  const lost = await state(page);
  const dropped = Math.floor(12 / tuning.fight.pileDivisor);
  expect(lost.ui.fightEnd).toMatchObject({ won: false, dropped });
  expect(lost.save.economy).toMatchObject({ parts: 12 - dropped, piles: { 'lair-30': dropped } });
  await expect(page.locator('.fight__end')).toContainText(`${dropped} dijela ostaju`);
  await shot('05-lost');
  await page.locator('.fight__close').click();
  await openMap(page);
  await expect(page.locator('.map__node[data-node="lair-30"] .map__pile')).toHaveText(
    String(dropped),
  );
  await shot('06-map-pile');

  // Back in, played hard: seed 22's dice win with a clean cut, the pile comes back, and the
  // first win returns page 1. (With other dice this test fails here, on purpose.)
  await dispatch(page, { type: 'dev/fight-seed', seed: 22 });
  await page.locator('.map__node[data-node="lair-30"]').click();
  await expect(page.locator('.fight__pile')).toContainText(String(dropped));
  while (!(await over(page))) await round(page, true);
  expect((await state(page)).fight?.phase).toBe('won');
  await expect(page.locator('.fight__clean')).toBeVisible();
  const won = await state(page);
  expect(won.ui.fightEnd?.page).toBe('page-1');
  const paid = (won.ui.fightEnd as unknown as { reward: number }).reward + dropped;
  await expect(page.locator('.fight__paid')).toHaveText(`+${paid} dio`);
  await expect(page.locator('.fight__end')).toContainText(`+${dropped} vraćeno s hrpe`);
  expect(won.save.economy.piles).toEqual({});
  await shot('07-won');
  await expect(page.locator('.pages__card')).toBeVisible({ timeout: 4000 });
  await shot('08-page');
  await page.locator('.pages__close').click();
  await page.locator('.fight__close').click();
  await openMap(page);
  await expect(page.locator('.map__node[data-node="lair-30"]')).toHaveAttribute(
    'data-state',
    'winding',
  );
  // The pile is gone from the map.
  await expect(page.locator('.map__node[data-node="lair-30"] .map__pile')).toHaveCount(0);
  await page.locator('.map__pages-button').click();
  await expect(page.locator('.torn-page')).toHaveCount(1);
  await shot('09-pages');
  await page.locator('.pages__close').click();
  // The district map closes again, back to the town.
  await page.getByRole('button', { name: 'Zatvori' }).click();
  await expect(page.locator('.town__overlay')).toHaveCount(0);

  // The dev panel's "+10 parts" (story 3.7), tapped in the town; then the workshop after
  // room 6, from the district map.
  const beforePanel = (await state(page)).save.economy.parts;
  await page.keyboard.press('Backquote');
  await page.locator('.dev-panel button', { hasText: '+10 parts' }).click();
  expect((await state(page)).save.economy.parts).toBe(beforePanel + 10);
  await page.locator('.dev-panel button', { hasText: 'close' }).click();
  await openMap(page);
  await page.locator('.map__node[data-node="workshop"]').click();
  await expect(page.locator('.shop')).toBeVisible();
  const parts = (await state(page)).save.economy.parts;
  const steamCost = tuning.upgrades.steam.cost;
  expect(parts).toBeGreaterThanOrEqual(steamCost);
  await page.locator('.shop__item[data-upgrade="steam"] .shop__buy').click();
  await expect(page.locator('.shop__item[data-upgrade="steam"]')).toHaveAttribute(
    'data-offer',
    'owned',
  );
  await shot('10-bought');
  expect((await state(page)).save.economy).toMatchObject({
    parts: parts - steamCost,
    upgrades: ['steam'],
  });
  await page.locator('.shop__back').click();

  // Kept across a reload; the next fight has 13 steam.
  await page.reload();
  await hook(page);
  expect((await state(page)).save.economy.upgrades).toEqual(['steam']);
  expect((await state(page)).save.progress.tornPages).toEqual(['page-1']);
  await openMap(page);
  await page.locator('.map__node[data-node="lair-20"]').click();
  await expect(page.locator('.fight__pip')).toHaveCount(
    tuning.fight.steam + tuning.upgrades.steam.steam,
  );
  await shot('11-upgraded-fight');

  expect(errors).toEqual([]);
});
