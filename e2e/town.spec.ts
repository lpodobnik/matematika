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

/**
 * Story 6.1: Nikola's guide in room 1. He reads each step and taps its "Dalje"; a step that
 * waits for a move is left to the move he makes next.
 */
async function guide(page: Page) {
  for (let i = 0; i < 12; i += 1) {
    const next = page.locator('.room-guide__next');
    if ((await next.count()) === 0) return;
    await next.click();
  }
}

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
    await guide(page);
    await page.locator('.pad__key[data-key="5"]').click();
    await page.locator('.pad__key[data-key="enter"]').click();
  }
  await page.waitForFunction(
    () => (window as unknown as Game).__s.getState().ui.screen === 'story',
    null,
    { timeout: 20_000 },
  );
  // Nobody speaks without an introduction: Penkala says who he is, and his role is under his name.
  await expect(page.locator('.story__item[data-who="penkala"] .story__role').first()).toHaveText(
    '(kondukter)',
  );
  await expect(page.locator('.story__text').first()).toContainText('Ja sam Penkala');
  await shot(page, '4b-penkala-introduces-himself');
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
  // Its automaton isn't out yet: it shows once the street's machine can be reached.
  await expect(page.locator('.town__figure--automaton')).toHaveCount(0);
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

test('a tap on the district map takes him to the street, beside the machine', async ({ page }) => {
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
  await page.getByRole('button', { name: 'Karta četvrti' }).click();
  await page.locator('.map__node[data-node="r03"]').click();
  // Not into the puzzle: into the canal street, the map closed, the sluice gate beside him.
  await expect(page.locator('.town__board[data-area="canal"]')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.map__board')).toHaveCount(0);
  expect((await state(page)).room).toBeNull();
  await page.waitForTimeout(400);
  await shot(page, '10-map-to-canal');
  // The canal's automaton took this machine's parts: it says so, and he stays out here.
  await page.locator('.town__place[data-node="r03"]').click();
  await expect(page.locator('.town__bubble')).toContainText('Automat', { timeout: 8000 });
  expect((await state(page)).room).toBeNull();
  await shot(page, '11-held-by-the-automaton');
  // Once it is beaten, he goes in.
  await page.evaluate(() => {
    const g = window as unknown as Game;
    const s = g.__s.getState();
    g.__d({
      type: 'boot/start',
      save: {
        ...s.save,
        economy: {
          ...s.save.economy,
          lairs: { 'lair-20': { rewindsAt: '2000-01-01T00:00:00.000Z' } },
        },
      },
      room: null,
    });
  });
  await page.locator('.town__bubble').click();
  await page.locator('.town__place[data-node="r03"]').click();
  await expect.poll(async () => (await state(page)).ui.screen, { timeout: 8000 }).toBe('room');
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
  // Every way out is signposted: open ones with an arrow, closed ones locked.
  await expect(page.locator('.town__sign[data-sign="canal"]')).toHaveAttribute('data-open', 'true');
  await expect(page.locator('.town__sign[data-sign="bridge"]')).toHaveAttribute(
    'data-open',
    'true',
  );
  await page.locator('.town__place[data-exit="canal"]').click();
  await expect(page.locator('.town__board[data-area="canal"]')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.town__sign[data-sign="mill"]')).toHaveAttribute('data-open', 'true');
  await expect(page.locator('.town__sign[data-sign="lift"]')).toHaveAttribute('data-open', 'false');
  await expect(page.locator('.town__sign[data-sign="square"]')).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, '6-canal-signs');
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

test('people ask for help with their street machine: Milka at the canal, Vučetić at the bridge', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);
  await page.evaluate(() => {
    const g = window as unknown as Game;
    const s = g.__s.getState();
    const done = ['r01', 'r02'];
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
          tools: ['balance'],
          onMap: true,
        },
      },
      room: null,
    });
  });
  await page.locator('.town__place[data-exit="canal"]').click();
  await expect(page.locator('.town__board[data-area="canal"]')).toBeVisible({ timeout: 8000 });
  const milka = page.locator('[data-person="milka"]');
  await expect(milka).toHaveAttribute('data-asks', 'true');
  await expect(milka.locator('.town__ask')).toBeVisible();
  await milka.click();
  await expect(page.locator('.town__bubble')).toContainText('mlin', { timeout: 8000 });
  await page.waitForTimeout(300);
  await shot(page, '8-milka-asks');
  await page.locator('.town__bubble').click();
  await page.locator('.town__bubble').click();
  await page.locator('.town__place[data-exit="square"]').click();
  await expect(page.locator('.town__board[data-area="square"]')).toBeVisible({ timeout: 8000 });
  await page.locator('.town__place[data-exit="bridge"]').click();
  await expect(page.locator('.town__board[data-area="bridge"]')).toBeVisible({ timeout: 10_000 });
  // Not yet: the bridge needs Balance from the sluice gate first, so nobody asks for it.
  await expect(page.locator('[data-person="vucetic"]')).toHaveCount(0);

  // With the sluice gate fixed, Vučetić asks, and his bridge is open to go in.
  await page.evaluate(() => {
    const g = window as unknown as Game;
    const s = g.__s.getState();
    const done = ['r01', 'r02', 'r03'];
    g.__d({
      type: 'boot/start',
      save: {
        ...s.save,
        progress: { ...s.save.progress, roomsDone: done, told: done },
        economy: {
          ...s.save.economy,
          lairs: {
            'lair-20': { rewindsAt: '2000-01-01T00:00:00.000Z' },
            'lair-30': { rewindsAt: '2000-01-01T00:00:00.000Z' },
            'lair-45': { rewindsAt: '2000-01-01T00:00:00.000Z' },
            'lair-60': { rewindsAt: '2000-01-01T00:00:00.000Z' },
          },
        },
      },
      room: null,
    });
  });
  // He is still in the bridge street; now Vučetić is there.
  await expect(page.locator('.town__board[data-area="bridge"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-person="vucetic"]')).toHaveAttribute('data-asks', 'true');
  await page.locator('[data-person="vucetic"]').click();
  await expect(page.locator('.town__bubble')).toContainText('Utezi', { timeout: 8000 });
  await page.waitForTimeout(300);
  await shot(page, '9-vucetic');
  await page.locator('.town__bubble').click();
  await page.locator('.town__bubble').click();
  await page.locator('.town__place[data-node="r05"]').click();
  await expect.poll(async () => (await state(page)).ui.screen, { timeout: 8000 }).toBe('room');
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
        economy: {
          ...s.save.economy,
          lairs: {
            'lair-20': { rewindsAt: '2000-01-01T00:00:00.000Z' },
            'lair-30': { rewindsAt: '2000-01-01T00:00:00.000Z' },
            'lair-45': { rewindsAt: '2000-01-01T00:00:00.000Z' },
            'lair-60': { rewindsAt: '2000-01-01T00:00:00.000Z' },
          },
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
  // The final fight waits for the last machine.
  await expect(page.locator('.town__figure--automaton')).toHaveCount(0);
  await shot(page, '14-hill');
  // The clock tower opens room 13.
  await page.locator('.town__place[data-node="r13"]').click();
  await page.waitForFunction(
    () => (window as unknown as Game).__s.getState().room?.spec.id === 'r13',
    null,
    { timeout: 12_000 },
  );
});

for (const look of ['look-1', 'look-2', 'look-3', 'look-4', 'look-5', 'look-6']) {
  test(`his legs line up with his body, standing still (${look})`, async ({ page }) => {
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
    await expect(page.locator('.town__part--leg-l')).toBeVisible();
    // The three pieces are one picture: at rest they must lie exactly on top of each other,
    // and on the figure's centre, over its shadow.
    const centre = (selector: string) =>
      page.locator(selector).evaluate((el) => {
        const box = el.getBoundingClientRect();
        return box.left + box.width / 2;
      });
    const body = await centre('.town__part--body');
    expect(Math.abs((await centre('.town__part--leg-l')) - body)).toBeLessThan(1);
    expect(Math.abs((await centre('.town__part--leg-r')) - body)).toBeLessThan(1);
    expect(Math.abs((await centre('.town__figure--me')) - body)).toBeLessThan(1);
    await page.waitForTimeout(200);
    await page.locator('.town__figure--me').screenshot({ path: `test-results/stand-${look}.png` });
  });
}

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

test('the district done: the foundry gate is marked, sealed, and to be continued', async ({
  page,
}) => {
  test.setTimeout(120_000);
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
      'r13',
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
  for (const to of ['canal', 'mill', 'yard']) {
    await page.locator(`.town__place[data-exit="${to}"]`).click();
    await expect(area(to)).toBeVisible({ timeout: 12_000 });
  }
  await expect(page.locator('.town__next')).toBeVisible();
  await page.locator('.town__place[data-node="foundry"]').click();
  await expect(page.locator('.town__bubble')).toContainText('5 · x = 40', { timeout: 8000 });
  await page.locator('.town__bubble').click();
  await expect(page.locator('.town__bubble')).toContainText('Nastavak slijedi');
  await shot(page, '15-foundry');
  expect((await state(page)).ui.screen).toBe('map');
});
