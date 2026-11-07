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
  // The raised gate is now the way through, not the room.
  expect((await state(page)).save.progress.roomsDone).toContain('r01');
  await expect(page.locator('.town__place[data-exit="canal"]')).toBeVisible();
  await expect(page.locator('.town__place[data-node="r01"]')).toHaveCount(0);
  await expect(page.locator('[data-person="nikola"]')).toBeVisible();
  await page.waitForTimeout(2600);
  await shot(page, '5-town-after-room-1');

  // The raised gate is now a way through: he walks to the canal, where room 3's sluice gate
  // waits and the first automaton strips a lamp; and back.
  await page.locator('.town__place[data-exit="canal"]').click();
  await expect(page.locator('.town__board[data-area="canal"]')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.town__place[data-node="r03"]')).toBeVisible();
  await expect(page.locator('.town__figure--automaton')).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, '6-canal');
  await page.locator('.town__place[data-exit="square"]').click();
  await expect(page.locator('.town__board[data-area="square"]')).toBeVisible({ timeout: 8000 });

  // The district map is a tap away, and closes again.
  await page.getByRole('button', { name: 'Karta četvrti' }).click();
  await expect(page.locator('.map__board')).toBeVisible();
  await page.getByRole('button', { name: 'Zatvori' }).click();
  await expect(page.locator('.map__board')).toHaveCount(0);
});

test('a fixed machine runs on: tapping it shows a bubble, not the room again', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);
  await page.evaluate(() => {
    const g = window as unknown as Game;
    const s = g.__s.getState();
    g.__d({
      type: 'boot/start',
      save: {
        ...s.save,
        character: { name: 'Ivo', look: 'look-5' },
        progress: {
          ...s.save.progress,
          introSeen: true,
          roomsDone: ['r01', 'r02'],
          told: ['r01', 'r02'],
          onMap: true,
        },
      },
      room: null,
    });
  });
  await expect(page.locator('.town__board[data-area="square"]')).toBeVisible();
  await page.locator('.town__place[data-node="r02"]').click();
  await expect(page.locator('.town__bubble')).toContainText('radi', { timeout: 8000 });
  expect((await state(page)).ui.screen).toBe('map');
  expect((await state(page)).room).toBeNull();
});

test('fixed machines open the way on: square, canal, mill', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);
  await page.evaluate(() => {
    const g = window as unknown as Game;
    const s = g.__s.getState();
    g.__d({
      type: 'boot/start',
      save: {
        ...s.save,
        character: { name: 'Ivo', look: 'look-2' },
        progress: {
          ...s.save.progress,
          introSeen: true,
          roomsDone: ['r01', 'r02', 'r03'],
          told: ['r01', 'r02', 'r03'],
          tools: ['balance'],
          onMap: true,
        },
      },
      room: null,
    });
  });
  await page.locator('.town__place[data-exit="canal"]').click();
  await expect(page.locator('.town__board[data-area="canal"]')).toBeVisible({ timeout: 8000 });
  await page.locator('.town__place[data-exit="mill"]').click();
  await expect(page.locator('.town__board[data-area="mill"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.town__place[data-node="r04"]')).toHaveAttribute('data-state', 'open');
  await expect(page.locator('.town__next')).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, '7-mill');
  // Walking to the wheel opens room 4.
  await page.locator('.town__place[data-node="r04"]').click();
  await page.waitForFunction(
    () => (window as unknown as Game).__s.getState().room?.spec.id === 'r04',
    null,
    { timeout: 10_000 },
  );
});

test('the town to the midpoint: bridge, yard, the logbook house and Faust', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);
  await page.evaluate(() => {
    const g = window as unknown as Game;
    const s = g.__s.getState();
    const done = ['r01', 'r02', 'r03', 'r04', 'r05', 'r06'];
    g.__d({
      type: 'boot/start',
      save: {
        ...s.save,
        character: { name: 'Ivo', look: 'look-3' },
        progress: {
          ...s.save.progress,
          introSeen: true,
          roomsDone: done,
          told: done,
          tools: ['balance', 'workshop'],
          onMap: true,
        },
      },
      room: null,
    });
  });
  const area = (id: string) => page.locator(`.town__board[data-area="${id}"]`);
  // Faust stands at the workshop now.
  await expect(page.locator('[data-person="faust"]')).toBeVisible();
  // Down the lamp street to the bridge, with its automaton.
  await page.locator('.town__place[data-exit="bridge"]').click();
  await expect(area('bridge')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.town__place[data-node="r05"]')).toHaveAttribute(
    'data-state',
    'restored',
  );
  await expect(page.locator('.town__figure--automaton')).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, '8-bridge');
  await page.locator('.town__place[data-exit="square"]').click();
  await expect(area('square')).toBeVisible({ timeout: 10_000 });
  // Through the gate, along the canal and the mill, to the weighing yard.
  await page.locator('.town__place[data-exit="canal"]').click();
  await expect(area('canal')).toBeVisible({ timeout: 10_000 });
  await page.locator('.town__place[data-exit="mill"]').click();
  await expect(area('mill')).toBeVisible({ timeout: 10_000 });
  await page.locator('.town__place[data-exit="yard"]').click();
  await expect(area('yard')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.town__place[data-node="r07"]')).toHaveAttribute('data-state', 'open');
  await expect(page.locator('.town__next')).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, '9-yard');
  // The logbook house opens room 7.
  await page.locator('.town__place[data-node="r07"]').click();
  await page.waitForFunction(
    () => (window as unknown as Game).__s.getState().room?.spec.id === 'r07',
    null,
    { timeout: 10_000 },
  );
});

test('the whole district: tram, market, wheel, the hill, and the lift', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);
  await page.evaluate(() => {
    const g = window as unknown as Game;
    const s = g.__s.getState();
    const done = [
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
    ];
    g.__d({
      type: 'boot/start',
      save: {
        ...s.save,
        character: { name: 'Ivo', look: 'look-1' },
        progress: {
          ...s.save.progress,
          introSeen: true,
          roomsDone: done,
          told: done,
          tools: ['balance', 'workshop', 'chain', 'drum'],
          onMap: true,
        },
      },
      room: null,
    });
  });
  const area = (id: string) => page.locator(`.town__board[data-area="${id}"]`);
  const go = async (to: string) => {
    await page.locator(`.town__place[data-exit="${to}"]`).click();
    await expect(area(to)).toBeVisible({ timeout: 12_000 });
    await page.waitForTimeout(300);
  };
  await go('canal');
  await go('lift');
  await expect(page.locator('.town__place[data-node="r09"]')).toHaveAttribute(
    'data-state',
    'restored',
  );
  await shot(page, '10-lift');
  await go('canal');
  await go('mill');
  await go('yard');
  await go('tram');
  await expect(page.locator('.town__figure--automaton')).toBeVisible();
  await shot(page, '11-tram');
  await go('market');
  // Penkala has come to the market for his scene.
  await expect(page.locator('[data-person="penkala"]')).toBeVisible();
  await shot(page, '12-market');
  await go('wheel');
  await shot(page, '13-wheel');
  await go('hill');
  await expect(page.locator('.town__place[data-node="r13"]')).toHaveAttribute('data-state', 'open');
  await expect(page.locator('.town__figure--automaton')).toBeVisible();
  await shot(page, '14-hill');
  // The clock tower opens room 13.
  await page.locator('.town__place[data-node="r13"]').click();
  await page.waitForFunction(
    () => (window as unknown as Game).__s.getState().room?.spec.id === 'r13',
    null,
    { timeout: 12_000 },
  );
});

for (const [look, mirrored] of [
  ['look-1', true],
  ['look-2', false],
] as const) {
  test(`he faces where he walks (${look})`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await hook(page);
    await page.evaluate((l) => {
      const g = window as unknown as Game;
      const s = g.__s.getState();
      g.__d({
        type: 'boot/start',
        save: {
          ...s.save,
          character: { name: 'Ivo', look: l },
          progress: { ...s.save.progress, introSeen: true, onMap: true },
        },
        room: null,
      });
    }, look);
    // From where he arrives, a tap well to his right on open ground.
    const board = page.locator('.town__board');
    const box = await board.boundingBox();
    if (!box) throw new Error('no board');
    await page.mouse.click(box.x + box.width * 0.62, box.y + box.height * 0.9);
    await expect(page.locator('.town__figure--me')).toHaveAttribute('data-walking', 'true');
    // Look 1's picture faces left, so walking right mirrors it; look 2's faces right.
    await expect(page.locator('.town__doll')).toHaveAttribute(
      'style',
      `transform: scaleX(${mirrored ? -1 : 1});`,
    );
  });
}
