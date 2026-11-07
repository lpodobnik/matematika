// Epic 5: a room for a friend, end to end, at the tablet's 1280 × 800 and the phone's
// 640 × 360. He builds a machine at the workshop (rooms 1–7 done, parts to spend), solves it
// himself on the pad, names it and sends it; the link opens in a fresh browser context as a
// friend new to the game: the welcome, the intro machine, then his room, cracked on the pad;
// and the friend's reply link, opened back in his game, stamps the room on the workshop wall.
// The first touch on each machine is a real tap on the canvas; locks and restarts play out
// on their own. Each step is screenshotted.
//
//   npx playwright test e2e/friend-room.spec.ts        (starts its own server on 5291)

import { type Browser, expect, type Page, test } from '@playwright/test';
import { hr } from '../src/content/text/hr';

interface GameState {
  ui: { screen: string; friend: { step: string } | null; workshop: { step: string } | null };
  room: { spec: { id: string }; stage: { phase: string } } | null;
  save: { economy: { parts: number }; workshop: { rooms: { id: string; stamp: string | null }[] } };
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

const state = (page: Page) =>
  page.evaluate(() => {
    const s = (window as unknown as Game).__s.getState();
    return {
      screen: s.ui.screen,
      friend: s.ui.friend?.step ?? null,
      workshop: s.ui.workshop?.step ?? null,
      room: s.room?.spec.id ?? null,
      phase: s.room?.stage.phase ?? null,
      parts: s.save.economy.parts,
      sent: s.save.workshop.rooms,
    };
  });

const toSeven = ['r01', 'r02', 'r03', 'r04', 'r05', 'r06', 'r07'];
const met = [
  'pin',
  'tray',
  'splitter',
  'fight-guide',
  'handover-dial',
  'handover-write',
  'handover-answer',
  'handover-check',
  'handover-tray',
  'handover-balance-goal',
  'handover-splitter',
  'handover-rewrite',
];

/** His game, as a save would bring it: rooms 1–7 done, 30 parts, in the town. */
async function startInTown(page: Page) {
  await page.evaluate(
    async ({ done, met }) => {
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
            tools: ['balance', 'workshop', 'chain'],
            onMap: true,
            introSeen: true,
            firstUse: met,
          },
          economy: { ...s.economy, parts: 30 },
        },
        room: null,
        fight: null,
      });
    },
    { done: toSeven, met },
  );
  await expect(page.locator('.town__board')).toBeVisible();
}

const key = (page: Page, name: string) => page.locator(`.pad__key[data-key="${name}"]`);

async function type(page: Page, line: string) {
  for (const char of line) await key(page, char).click();
  await key(page, 'enter').click();
}

/** The first touch on the machine: a tap on the canvas's empty top corner. */
async function touch(page: Page) {
  await expect.poll(async () => (await state(page)).phase).toBe('arrive');
  await page
    .locator('canvas')
    .first()
    .click({ position: { x: 8, y: 8 } });
  await expect.poll(async () => (await state(page)).phase).not.toBe('arrive');
}

function shooter(page: Page, outputPath: (name: string) => string, who: string) {
  return async (name: string) => {
    await page.waitForTimeout(300);
    await page.screenshot({ path: outputPath(`${who}-${name}.png`) });
  };
}

async function friendPage(browser: Browser, viewport: { width: number; height: number }) {
  const context = await browser.newContext({ viewport, baseURL: undefined });
  return { context, page: await context.newPage() };
}

test('a room for a friend: built, solved, sent, cracked and stamped', async ({
  page,
  browser,
  viewport,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  const shot = shooter(page, (n) => testInfo.outputPath(n), 'builder');

  await page.goto('/');
  await hook(page);
  await startInTown(page);

  // The workshop: Faust's counter, with "Napravi stroj" and the empty wall.
  await page.evaluate(() =>
    (window as unknown as Game).__d({ type: 'map/travel', node: 'workshop' }),
  );
  await expect(page.locator('main.shop')).toBeVisible();
  await expect(page.locator('.wall')).toContainText(hr.workshop.wallEmpty);
  await shot('1-counter');
  await page.getByRole('button', { name: hr.workshop.open }).click();
  await expect(page.locator('main.workshop')).toBeVisible();

  // 3x + 4 = 31, readouts hidden: x = 9, a whole number, so it may be played.
  await page.locator('.workshop__form[data-form="ax+b"]').click();
  await page.locator('.workshop__number[data-slot="a"] input').fill('3');
  await page.locator('.workshop__number[data-slot="b"] input').fill('4');
  await page.locator('.workshop__number[data-slot="c"] input').fill('32');
  await expect(page.locator('.workshop__equation')).toHaveText('3x + 4 = 32');
  await expect(page.locator('.workshop__machine .workshop__status')).toHaveText(
    hr.workshop.problem.fraction,
  );
  await expect(page.getByRole('button', { name: hr.workshop.solve })).toBeDisabled();
  await page.locator('.workshop__number[data-slot="c"] input').fill('31');
  await expect(page.locator('.workshop__machine .workshop__status')).toHaveText(hr.workshop.levels);
  await page.locator('.workshop__toggle[data-option="readouts"]').click();
  // 4 for the pieces and 5 for the blind.
  await expect(page.locator('.workshop__bill')).toContainText(hr.workshop.cost(9));
  await shot('2-design');
  await page.getByRole('button', { name: hr.workshop.solve }).click();

  // He solves it himself, on the pad.
  await expect.poll(async () => (await state(page)).room).toBe('built-draft');
  await touch(page);
  await type(page, 'x=9');
  await shot('3-solving');
  await type(page, '3·9+4=31');
  await expect.poll(async () => (await state(page)).workshop, { timeout: 20_000 }).toBe('finish');

  // Solved: a title, then send; the parts are paid and the link appears.
  await expect(page.locator('.workshop__speech')).toHaveText(hr.workshop.solved);
  await page.getByRole('button', { name: hr.workshop.titles[2] }).click();
  await shot('4-finish');
  await page.getByRole('button', { name: hr.workshop.send }).click();
  await expect(page.locator('.workshop__sent')).toBeVisible();
  expect((await state(page)).parts).toBe(21);
  const link = await page.locator('.share-link__url').inputValue();
  expect(link).toMatch(/#s=[A-Za-z0-9_-]+$/);
  expect(link.length).toBeLessThanOrEqual(2000);
  await shot('5-sent');

  // A friend, new to the game, opens it in a fresh browser.
  const friend = await friendPage(browser, viewport ?? { width: 1280, height: 800 });
  const fp = friend.page;
  fp.on('pageerror', (error) => errors.push(`friend: ${String(error)}`));
  const fshot = shooter(fp, (n) => testInfo.outputPath(n), 'friend');
  await fp.goto(link);
  await hook(fp);
  await expect(fp.locator('.friend__card')).toContainText(
    hr.friend.welcome(hr.workshop.titles[2] ?? ''),
  );
  await expect(fp.locator('.friend__card')).toContainText(hr.friend.newHere);
  await fshot('1-welcome');
  await fp.getByRole('button', { name: hr.friend.go }).click();

  // The intro machine: 2x = 6, with room 1's blanks.
  await expect.poll(async () => (await state(fp)).room).toBe('built-intro');
  await touch(fp);
  await fshot('2-intro');
  await type(fp, '3');
  await type(fp, '3');
  await expect.poll(async () => (await state(fp)).friend, { timeout: 20_000 }).toBe('ready');
  await fshot('3-ready');
  await fp.getByRole('button', { name: hr.friend.toRoom }).click();

  // His room: a blank page, all three ways, and the give-up control where the map would be.
  await expect.poll(async () => (await state(fp)).room).toMatch(/^built-[0-9a-z]+$/);
  await touch(fp);
  await expect(fp.getByRole('button', { name: hr.friend.giveUp })).toBeVisible();
  await expect(fp.getByRole('button', { name: hr.ui.map })).toHaveCount(0);
  await fshot('4-room');
  await type(fp, 'x=9');
  await type(fp, '3·9+4=31');
  await expect.poll(async () => (await state(fp)).friend, { timeout: 20_000 }).toBe('cracked');
  await expect(fp.locator('.friend__card')).toContainText(hr.friend.crackedTitle);
  await expect(fp.getByRole('button', { name: hr.friend.play })).toBeVisible();
  const reply = await fp.locator('.share-link__url').inputValue();
  expect(reply).toMatch(/#r=[0-9a-z]+\.c$/);
  await fshot('5-cracked');
  // Nothing the friend did is saved on the friend's device.
  expect(await fp.evaluate(() => localStorage.getItem('matematika:save'))).toBeNull();
  await friend.context.close();

  // The reply link, opened back in his game, stamps the room on the wall.
  const replyPath = new URL(reply);
  await page.goto('about:blank');
  await page.goto(`/${replyPath.hash}`);
  await hook(page);
  await expect(page.locator('main.shop')).toBeVisible();
  await expect(page.locator('.wall__reply')).toContainText(hr.workshop.stamps.cracked);
  await expect(page.locator('.wall__room[data-stamp="cracked"] .wall__stamp')).toHaveText(
    hr.workshop.stamps.cracked,
  );
  expect(new URL(page.url()).hash).toBe('');
  await shot('6-stamped');
  expect((await state(page)).sent).toEqual([expect.objectContaining({ stamp: 'cracked' })]);

  expect(errors).toEqual([]);
});

test('a friend who gives up sees the solution play and gets an uncracked reply', async ({
  page,
  viewport,
}, testInfo) => {
  test.setTimeout(60_000);
  // The friend's page alone: a room link made the way the workshop makes it.
  await page.goto('/');
  await hook(page);
  const data = await page.evaluate(async () => {
    const linkModule: string = '/src/links/room-link.ts';
    const m = await import(/* @vite-ignore */ linkModule);
    return m.encodeRoom({
      title: 7,
      design: {
        machines: [{ form: 'ax-b', numbers: { a: 3, b: 1, c: 17, d: 0 } }],
        blinds: { readouts: false, shortDial: true },
        plant: false,
      },
      planted: null,
      solution: [['3x=18', 'x=6', '3·6−1=17']],
    }) as string;
  });
  // The game page wrote a save; the friend's device has none.
  await page.evaluate(() => localStorage.clear());
  await page.goto('about:blank');
  await page.goto(`/#s=${data}`);
  await hook(page);
  const shot = shooter(page, (n) => testInfo.outputPath(n), `giveup-${viewport?.width ?? 0}`);
  await page.getByRole('button', { name: hr.friend.go }).click();
  await expect.poll(async () => (await state(page)).room).toBe('built-intro');
  await touch(page);
  await type(page, '3');
  await type(page, '3');
  await expect.poll(async () => (await state(page)).friend, { timeout: 20_000 }).toBe('ready');
  await page.getByRole('button', { name: hr.friend.toRoom }).click();
  await touch(page);
  await page.getByRole('button', { name: hr.friend.giveUp }).click();
  await shot('1-ask');
  await page.getByRole('button', { name: hr.friend.giveUpYes }).click();
  await expect(page.locator('.friend__card')).toContainText(hr.friend.gaveUp);
  await expect(page.locator('.friend__line')).toHaveCount(3, { timeout: 5000 });
  const reply = await page.locator('.share-link__url').inputValue();
  expect(reply).toMatch(/#r=[0-9a-z]+\.u$/);
  await shot('2-solution');
});

test('he plants a wrong line in his solved machine before sending it', async ({
  page,
  viewport,
}, testInfo) => {
  test.setTimeout(90_000);
  const shot = shooter(page, (n) => testInfo.outputPath(n), `plant-${viewport?.width ?? 0}`);
  await page.goto('/');
  await hook(page);
  await startInTown(page);
  await page.evaluate(() =>
    (window as unknown as Game).__d({ type: 'map/travel', node: 'workshop' }),
  );
  await page.getByRole('button', { name: hr.workshop.open }).click();
  // The starting machine, 2x + 5 = 23, with a planted line (met in room 7).
  await page.locator('.workshop__toggle[data-option="plant"]').click();
  await page.getByRole('button', { name: hr.workshop.solve }).click();
  await touch(page);
  await type(page, '2x=18');
  await type(page, 'x=9');
  await type(page, '2·9+5=23');
  await expect.poll(async () => (await state(page)).workshop, { timeout: 20_000 }).toBe('finish');
  // He picks his line 2x = 18 and makes it 2x = 19, which is wrong where it stands.
  await page.locator('.workshop__line', { hasText: '2x = 18' }).click();
  await expect(page.locator('.workshop__plant .workshop__status')).toHaveText(
    hr.workshop.plantStill,
  );
  await page.getByRole('button', { name: `18 ${hr.workshop.more}` }).click();
  await expect(page.locator('.workshop__plant .workshop__status')).toHaveText(
    hr.workshop.plantReady,
  );
  await page.getByRole('button', { name: hr.workshop.titles[0] }).click();
  await shot('1-planted');
  await page.getByRole('button', { name: hr.workshop.send }).click();
  await expect(page.locator('.workshop__sent')).toBeVisible();
  // 4 for the pieces, 5 for the planted line.
  expect((await state(page)).parts).toBe(21);
  const link = await page.locator('.share-link__url').inputValue();
  const planted = await page.evaluate(async (data) => {
    const linkModule: string = '/src/links/room-link.ts';
    const m = await import(/* @vite-ignore */ linkModule);
    return m.decodeRoom(data)?.planted;
  }, new URL(link).hash.slice(3));
  expect(planted).toEqual({ stage: 0, line: 0, text: '2x=19' });
});
