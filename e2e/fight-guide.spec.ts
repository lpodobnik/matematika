// The guided first fight in a real browser, at the tablet's 1280 × 800 and the phone's
// 640 × 360: from a game past the opening that has never fought, the first lair's fight
// opens with Nikola's card, and every step is tapped for real, through "Dalje", the roll,
// the dice the guide lights, the blows and the strike, to the clean cut. Each step is
// screenshotted into the test's output folder, and checked for clipped or covered text.
//
//   npx playwright test e2e/fight-guide.spec.ts       (starts its own server on 5291)

import { expect, type Page, test } from '@playwright/test';

interface GameState {
  ui: { screen: string; fightGuide: string | null };
  fight: { phase: string; lastStrike: { dented: boolean } | null } | null;
  save: { progress: { firstUse: string[] } };
}

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

/** A game with rooms 1–2 done, in the town, that has never fought. */
async function startInTown(page: Page) {
  await page.evaluate(async () => {
    const persist: string = '/src/store/persist.ts';
    const p = await import(/* @vite-ignore */ persist);
    const s = p.newSave('2026-11-07T08:00:00.000Z');
    const done = ['r01', 'r02'];
    (window as unknown as Game).__d({
      type: 'boot/start',
      save: {
        ...s,
        character: { name: 'Ivo', look: 'look-1' },
        progress: { ...s.progress, roomsDone: done, told: done, onMap: true, introSeen: true },
      },
      room: null,
      fight: null,
    });
  });
  await expect(page.locator('.town__board')).toBeVisible();
}

/**
 * Nothing of the guide's card or the bench is cut off or off screen, and the card covers
 * no control: every visible button and text box sits inside the viewport, and none
 * overlaps the card.
 */
async function laidOut(page: Page) {
  const problems = await page.evaluate(() => {
    const out: string[] = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const card = document.querySelector('.fight__guide')?.getBoundingClientRect() ?? null;
    const boxes = document.querySelectorAll<HTMLElement>(
      '.fight button, .fight__guide-text, .fight__caption, .fight__armour, .fight__banner',
    );
    for (const el of boxes) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const name = `${el.className} "${el.textContent?.trim().slice(0, 30)}"`;
      if (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1) {
        out.push(`off screen: ${name}`);
      }
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') {
        out.push(`clipped: ${name}`);
      }
      if (card && !el.closest('.fight__guide')) {
        const overlaps =
          r.left < card.right - 1 &&
          r.right > card.left + 1 &&
          r.top < card.bottom - 1 &&
          r.bottom > card.top + 1;
        if (overlaps) out.push(`under the card: ${name}`);
      }
    }
    // Every button is a 48 px target.
    for (const b of document.querySelectorAll<HTMLElement>('.fight button')) {
      const r = b.getBoundingClientRect();
      if (r.width > 0 && (r.width < 47.5 || r.height < 47.5)) {
        out.push(`small: ${b.className} ${r.width}×${r.height}`);
      }
    }
    return out;
  });
  expect(problems).toEqual([]);
}

test('the first fight is guided step by step, once', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  let n = 0;
  const shot = async (name: string) => {
    await page.waitForTimeout(350);
    n += 1;
    await page.screenshot({
      path: testInfo.outputPath(`${String(n).padStart(2, '0')}-${name}.png`),
    });
    await laidOut(page);
  };
  const card = page.locator('.fight__guide');
  const step = async () => (await state(page)).ui.fightGuide;
  const next = async (from: string) => {
    expect(await step()).toBe(from);
    await shot(from);
    await page.locator('.fight__guide-next').click();
  };

  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);
  await startInTown(page);
  await page.getByRole('button', { name: 'Karta četvrti' }).click();
  await expect(page.locator('.town__overlay .map__board')).toBeVisible();
  // Seed 21's first roll is 3, 3, 2: one strike leaves armour, so the dent is explained too.
  await dispatch(page, { type: 'dev/fight-seed', seed: 21 });
  await page.locator('.map__node[data-node="lair-20"]').click();
  await expect(card).toBeVisible();
  await expect(card).toContainText('Nikola');

  await expect(page.locator('.fight__armour')).toHaveAttribute('data-focus');
  await expect(page.locator('.fight__roll')).toBeDisabled();
  await next('armour');
  await next('goal');

  expect(await step()).toBe('roll');
  await expect(page.locator('.fight__guide-next')).toHaveCount(0);
  await shot('roll');
  await page.locator('.fight__roll').click();

  for (const slot of ['blade', 'charge', 'reach']) {
    expect(await step()).toBe(slot);
    const lit = page.locator('.fight__die[data-focus]');
    await expect(lit.first()).toBeVisible();
    await expect(page.locator(`.fight__slot[data-slot="${slot}"]`)).toHaveAttribute('data-focus');
    // A die the guide doesn't ask for can't be picked up.
    await expect(page.locator('.fight__die[data-dim]').first()).toBeDisabled();
    await shot(slot);
    await lit.first().click();
    await page.locator(`.fight__slot[data-slot="${slot}"]`).click();
  }

  expect(await step()).toBe('blows');
  await expect(page.locator('.fight__strike')).toBeDisabled();
  await shot('blows');
  await page.locator('.fight__notch:not([disabled])').last().click();

  expect(await step()).toBe('strike');
  await shot('strike');
  await page.locator('.fight__strike').click();
  await expect(page.locator('.fight__banner')).toContainText('=');

  await next('banner');
  if ((await state(page)).fight?.lastStrike?.dented) await next('dent');
  // No next roll while Nikola is still talking.
  await expect(page.locator('.fight__roll')).toBeDisabled();
  await next('steam');
  await expect(page.locator('.fight__guide-next')).toHaveText('Idemo!');
  await next('clean');

  await expect(card).toHaveCount(0);
  expect((await state(page)).save.progress.firstUse).toContain('fight-guide');
  await expect(page.locator('.fight__roll')).toBeEnabled();
  await shot('after-guide');

  // Met for good: kept across a reload, and the next fight has no guide.
  await page.locator('.fight__leave').click();
  await page.locator('.fight__go').click();
  await page.locator('.fight__close').click();
  await page.reload();
  await hook(page);
  expect((await state(page)).save.progress.firstUse).toContain('fight-guide');
  await page.getByRole('button', { name: 'Karta četvrti' }).click();
  await page.locator('.map__node[data-node="lair-20"]').click();
  await expect(page.locator('.fight')).toBeVisible();
  await expect(card).toHaveCount(0);
  await shot('next-fight');

  expect(errors).toEqual([]);
});

test('a first fight won in one strike: the guide finishes over the end', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  const shot = async (name: string) => {
    await page.waitForTimeout(350);
    await page.screenshot({ path: testInfo.outputPath(`won-${name}.png`) });
    await laidOut(page);
  };
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);
  await startInTown(page);
  await page.getByRole('button', { name: 'Karta četvrti' }).click();
  // Seed 11's first roll is 4, 4, 4: four blows of 4 plus 4 cut armour 20 clean.
  await dispatch(page, { type: 'dev/fight-seed', seed: 11 });
  await page.locator('.map__node[data-node="lair-20"]').click();
  await page.locator('.fight__guide-next').click();
  await page.locator('.fight__guide-next').click();
  await page.locator('.fight__roll').click();
  for (const slot of ['blade', 'charge', 'reach']) {
    await page.locator('.fight__die[data-focus]').first().click();
    await page.locator(`.fight__slot[data-slot="${slot}"]`).click();
  }
  await page.locator('.fight__notch[data-x="4"]').click();
  await page.locator('.fight__strike').click();
  await expect(page.locator('.fight__clean')).toBeVisible();
  // The way back waits until Nikola has finished.
  await expect(page.locator('.fight__close')).toBeDisabled();
  await shot('banner');
  await page.locator('.fight__guide-next').click();
  await shot('steam');
  await page.locator('.fight__guide-next').click();
  await shot('clean');
  await page.locator('.fight__guide-next').click();
  await expect(page.locator('.fight__guide')).toHaveCount(0);
  await expect(page.locator('.fight__close')).toBeEnabled();
  await page.locator('.fight__close').click();
  expect((await state(page)).ui.screen).toBe('map');
});
