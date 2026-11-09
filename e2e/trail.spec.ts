// Story 10.7 and 10.8 in the browser: the dev panel's jumps into part 2, the order of the acts on
// the trail map, the black thread's mark, and the ending. The chapter's own playthrough, move by
// move, is `src/store/hunt-playthrough.test.ts`.

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
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/trail-${test.info().project.name}-${name}.png` });

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

const pins = (page: Page) =>
  page.locator('.trail__pin').evaluateAll((all) => all.map((pin) => pin.getAttribute('data-lead')));

test('a jump lands where it says, with what comes before it done', async ({ page }) => {
  test.setTimeout(90_000);
  await jump(page, 'l06');
  await expect(page.locator('.town__board[data-area="u1"]')).toBeVisible({ timeout: 12_000 });
  const save = (await state(page)).save;
  expect(save.hunt.knotsDone).toEqual(['k1', 'w1']);
  expect(save.hunt.leadsDone).toContain('l04');
  expect(save.hunt.leadsDone).toContain('l05');
  expect(save.hunt.leadsDone).not.toContain('l06');
  expect(save.companion?.gear).toEqual(['hook']);
  await expect(page.locator('.town__sign[data-sign="l06"]')).toBeVisible();
  await expect(page.locator('.town__sign[data-sign="k2"]')).toHaveCount(0);
});

test('the trail map shows what’s solved, what’s open, and where the black thread is heading', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await jump(page, 'l05');
  await page.locator('.town__map-button').first().click();
  await expect(page.locator('.trail')).toBeVisible();
  const shown = await pins(page);
  expect(shown).toContain('l01');
  expect(shown).toContain('k1');
  expect(shown).toContain('l05');
  expect(shown).not.toContain('k2');
  expect(shown).not.toContain('l09');
  await expect(page.locator('.trail__pin[data-target="true"]')).toHaveAttribute('data-lead', 'l08');
  await shot(page, '1-map');
});

test('the wandering-off comes first in Act 2: nothing else is open', async ({ page }) => {
  test.setTimeout(90_000);
  await jump(page, 'w1');
  await expect(page.locator('.town__sign[data-sign="w1"]')).toBeVisible();
  await expect(page.locator('.town__sign[data-sign="l05"]')).toHaveCount(0);
});

test('the ending: the warm lamp, his name on the note, and it isn’t read twice', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await jump(page, 'l16');
  await page.evaluate(() => {
    const g = window as unknown as Game;
    const { save } = g.__s.getState();
    g.__d({
      type: 'boot/start',
      save: {
        ...save,
        character: { name: 'Ivo', look: 'look-1' },
        hunt: {
          ...save.hunt,
          leadsDone: [...save.hunt.leadsDone, 'l16'],
          beats: [...save.hunt.beats, 'near-miss'],
        },
      },
      room: null,
    });
  });
  // He'd come to it out of the lead: the town opens afresh.
  await page.waitForTimeout(600);
  await page.reload();
  await hook(page);
  await page.waitForTimeout(500);
  // The backtick closes the dev panel, which the ending's panels would otherwise cover.
  await page.keyboard.press('Backquote');
  const panel = page.locator('.opening__panel');
  await expect(panel).toBeVisible({ timeout: 10_000 });
  await shot(page, '2-ending');
  let named = false;
  for (let i = 0; i < 10 && (await panel.count()); i += 1) {
    const text = (await panel.textContent()) ?? '';
    expect(text).not.toContain('{ime}');
    if (text.includes('Ivo')) named = true;
    await panel.click();
  }
  expect(named).toBe(true);
  await expect(panel).toHaveCount(0);
  await page.reload();
  await hook(page);
  await page.waitForTimeout(600);
  await expect(page.locator('.opening__panel')).toHaveCount(0);
});
