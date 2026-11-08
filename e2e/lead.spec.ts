// Stories 8.3 to 8.9: the first lead, "Two sides", from the trail map to the written line, with
// the wrong door included. Seeded from the real path: the gate open and the map given. With
// part 2 off, none of it is reachable. Real taps throughout.

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
  page.screenshot({ path: `test-results/lead-${test.info().project.name}-${name}.png` });

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

/** After the gate, with the little one named and the map given. */
async function atTheFirstStreet(page: Page, url: string) {
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);
  if (url.includes('dev')) await page.getByRole('button', { name: 'close', exact: true }).click();
  await page.evaluate((rooms) => {
    const g = window as unknown as Game;
    const s = g.__s.getState();
    sessionStorage.setItem(
      'matematika:town:where',
      JSON.stringify({ area: 'u1', at: { x: 200, y: 790 } }),
    );
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
          lairs: { 'lair-60': { rewindsAt: '2000-01-01T00:00:00.000Z' } },
        },
        hunt: { ...s.save.hunt, gateOpened: true, beats: ['foundry', 'named', 'map-given'] },
        companion: { name: 'Bip', looks: [], wearing: [], gear: [], taught: [] },
      },
      room: null,
    });
  }, allRooms);
}

async function pad(page: Page, keys: string[]) {
  for (const key of keys) {
    await page
      .locator(`.pad__key[data-key="${key}"]`)
      .dispatchEvent('pointerdown', { button: 0, isPrimary: true });
  }
}

const next = (page: Page) => page.locator('.hunt__next').click();

async function intoTheLead(page: Page) {
  const panels = page.locator('.opening__panel');
  for (let i = 0; i < 4; i += 1) {
    if (await panels.count()) await panels.click();
  }
  await expect(page.locator('.town__board[data-area="u1"]')).toBeVisible({ timeout: 12_000 });
  await expect(page.locator('.town__sign[data-sign="l01"]')).toBeVisible();
  await shot(page, '0-street');
  // Picking its pin on the trail map walks him there, and the lead starts.
  await page.locator('.town__map-button, button[aria-label="Karta"]').first().click();
  await expect(page.locator('.trail')).toBeVisible();
  await shot(page, '0-trail');
  await page.locator('.trail__pin[data-lead="l01"]').click();
  await expect(page.locator('.lesson')).toBeVisible({ timeout: 12_000 });
}

async function throughTheShowingAndTheFix(page: Page) {
  await shot(page, '1-lesson');
  for (let i = 0; i < 5; i += 1) await page.locator('.lesson').click();

  // Try: three more lamps, then two lines.
  await expect(page.locator('.pairs__sum')).toHaveText('2 · 2 = 4');
  for (let i = 0; i < 3; i += 1) await page.locator('.object__button[data-add]').click();
  await expect(page.locator('.pairs__sum')).toHaveText('3 · 2 + 1 = 7');
  await shot(page, '2-try');
  await next(page);
  await pad(page, ['8', 'enter']);
  await expect(page.locator('.hunt__note')).toBeVisible();
  await pad(page, ['delete', '7', 'enter']);
  await next(page);
  await pad(page, ['∉', 'enter']);
  await next(page);

  // Fix: a tap on its right line gets help, then the wrong line, the lamps, and the right line.
  await page.locator('.hunt__wobbly-line').first().click();
  await expect(page.locator('.hunt__task')).toContainText('točan');
  await shot(page, '3-fix');
  await page.locator('.hunt__wobbly-line').nth(1).click();
  await page.locator('.object__button[data-add]').click();
  await pad(page, ['4', '·', '2', '+', '1', 'enter']);
  await next(page);
}

test('part 2 on: the whole of "Two sides", wrong door included', async ({ page }) => {
  test.setTimeout(240_000);
  await atTheFirstStreet(page, '/?dev');
  await intoTheLead(page);
  await throughTheShowingAndTheFix(page);

  // The first Knock's guide: only the asked move passes.
  await expect(page.locator('.guide-card')).toBeVisible();
  await shot(page, '4-guide');
  await page.locator('.door').first().click({ force: true });
  await next(page);
  await pad(page, ['1']);
  expect((await state(page)).save.hunt.scene).toBeTruthy();
  await page.locator('.knock__cross').click();
  await expect(page.locator('.door[data-door="1"]')).toBeVisible();

  // A wrong result lights the wrong door, and it's judged at the door.
  await pad(page, ['1', '7', 'enter']);
  await expect(page.locator('.door[data-lit="true"]')).toHaveCount(1);
  await expect(page.locator('.door[data-lit="true"]')).toHaveAttribute('data-door', '17');
  await shot(page, '5-lit');
  await pad(page, ['1', '7', 'enter']);
  await page.locator('.door[data-door="17"]').click();
  await expect(page.locator('.knock__bubble')).toBeVisible();
  await shot(page, '6-wrong-door');
  await page.locator('.knock__bubble button').click();

  // From now on each line has to be true.
  await expect(page.locator('.his-line[data-struck="true"]')).toHaveCount(2);
  await pad(page, ['1', '7', 'enter']);
  await expect(page.locator('.hunt__notebook[data-refused="true"]')).toBeVisible();
  await pad(page, ['delete', 'delete', '1', '4', '+', '1', 'enter']);
  await pad(page, ['1', '5', 'enter']);
  await pad(page, ['1', '5', 'enter']);
  await expect(page.locator('.door[data-lit="true"]')).toHaveAttribute('data-door', '15');
  await page.locator('.door[data-door="15"]').click();
  await expect(page.locator('.door[data-open="true"]')).toBeVisible();
  // Lines were struck, so these doors pay nothing.
  expect((await state(page)).save.economy.parts).toBe(0);
  await shot(page, '7-opened');
  await next(page);

  // The lift, from 0.
  await expect(page.locator('.door[data-door="0"]')).toBeVisible();
  await pad(page, ['0', 'enter']);
  await page.locator('.door[data-door="0"]').click();
  await shot(page, '8-lift');
  await next(page);

  // He leaves in the middle, and comes back to the same place.
  await pad(page, ['0', 'enter']);
  await page.reload();
  await hook(page);
  await page.getByRole('button', { name: 'close', exact: true }).click();
  await expect(page.locator('.hunt__ink').last()).toContainText('0 ∉ N');

  // Writing it the way school does: a false line bounces.
  await pad(page, ['N₀', 'enter']);
  await pad(page, ['7', '·', '2', '+', '1', '=', '1', '6', 'enter']);
  await expect(page.locator('.hunt__note')).toBeVisible();
  await shot(page, '9-write');
  await pad(page, ['delete', '5', 'enter']);

  await expect(page.locator('.thread__find')).toBeVisible();
  await shot(page, '10-thread');
  await next(page);
  await expect(page.locator('.thread__title')).toBeVisible();
  await shot(page, '11-card');
  await next(page);

  // Back in the street, with colour in the place, and the lead done.
  await expect(page.locator('.town__board[data-area="u1"]')).toBeVisible({ timeout: 12_000 });
  const save = (await state(page)).save;
  expect(save.hunt.leadsDone).toEqual(['l01']);
  expect(save.hunt.firstTries.l01).toBe(false);
  expect(save.hunt.pages.l01?.map((line) => line.text)).toEqual([
    '0 ∉ N',
    '0 ∈ N₀',
    '7 · 2 + 1 = 15',
  ]);
  expect(save.companion?.taught.map((entry) => entry.mistake)).toEqual(['l01-pairs-left-over']);
  expect(save.hunt.scene).toBeNull();
  await shot(page, '12-street-after');
});

test('part 2 on: right the first time pays its parts, once', async ({ page }) => {
  test.setTimeout(240_000);
  await atTheFirstStreet(page, '/?dev');
  await intoTheLead(page);
  await throughTheShowingAndTheFix(page);
  await next(page);
  await page.locator('.knock__cross').click();
  await pad(page, ['1', '5', 'enter']);
  await pad(page, ['1', '5', 'enter']);
  await page.locator('.door[data-door="15"]').click();
  await expect(page.locator('.door[data-open="true"]')).toBeVisible();
  expect((await state(page)).save.economy.parts).toBe(2);
  // Reloading can't earn them twice.
  await page.reload();
  await hook(page);
  await expect(page.locator('.door[data-open="true"]')).toBeVisible();
  expect((await state(page)).save.economy.parts).toBe(2);
});

test('part 2 off: the lead’s spot is nowhere, even with a save that has gone this far', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await atTheFirstStreet(page, '/');
  expect((await state(page)).ui.screen).toBe('map');
  await expect(page.locator('.town__sign[data-sign="l01"]')).toHaveCount(0);
  await expect(page.locator('.town__figure--little')).toHaveCount(0);
});
