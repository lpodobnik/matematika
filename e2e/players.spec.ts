// Two children on one device: "Tko igra?", a save for each, the switch in the town, starting
// over behind a confirm, and an existing save becoming the first player. Real taps throughout,
// except room 1's dial, which goes to the store as the scene would send it. A new tab of the
// same browser context stands for a new launch: it shares `localStorage` but not the tab's
// memory of who was playing.

import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { hr } from '../src/content/text/hr';
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
  page.screenshot({ path: `test-results/players-${test.info().project.name}-${name}.png` });

const titled = (page: Page, title: string) =>
  expect(page.getByRole('heading', { name: title })).toBeVisible();
const card = (page: Page, name: string) => page.locator('.players__card', { hasText: name });
const cardNames = (page: Page) => page.locator('.players__name').allTextContents();

/** The town's corner, to "Tko igra?": the page starts afresh on the new address. */
async function openPlayers(page: Page) {
  await page.getByRole('button', { name: hr.town.switchPlayer }).click();
  await titled(page, hr.players.title);
  expect(new URL(page.url()).hash).toBe('#igraci');
}

/** A new game as far as the town: the opening and the naming. */
async function newGame(page: Page, name: string, look: number) {
  await hook(page);
  expect((await state(page)).ui.screen).toBe('opening');
  for (let i = 0; i < 4; i += 1) await page.locator('.opening__panel').click();
  await page.locator('input[type="text"]').fill(name);
  await page.locator('.naming__look').nth(look).click();
  await page.locator('button[type="submit"]').click();
  await page.getByRole('button', { name: hr.naming.next }).click();
  await expect(page.locator('.town__board')).toBeVisible();
}

async function guide(page: Page) {
  for (let i = 0; i < 12; i += 1) {
    const next = page.locator('.room-guide__next');
    if ((await next.count()) === 0) return;
    await next.click();
  }
}

/** Into room 1 from the square, with the dial where a line of 5 is right. */
async function enterRoom1(page: Page) {
  await page.locator('.town__place[data-node="r01"]').click();
  await expect.poll(async () => (await state(page)).ui.screen, { timeout: 10_000 }).toBe('room');
  await page
    .locator('.scene-area canvas')
    .first()
    .click({ position: { x: 200, y: 200 } });
  for (const x of [1, 2, 3, 4, 5]) await dispatch(page, { type: 'dial/set', x });
}

async function writeFive(page: Page) {
  await guide(page);
  await page.locator('.pad__key[data-key="5"]').click();
  await page.locator('.pad__key[data-key="enter"]').click();
}

async function meetPenkala(page: Page) {
  await page.locator('[data-person="penkala"]').click();
  await expect(page.locator('.town__intro')).toContainText('Penkala', { timeout: 8000 });
  while ((await page.locator('.town__bubble').count()) > 0) {
    await page.locator('.town__bubble').click();
  }
}

/** A saved game for a player's key: decode takes the defaults for the rest. */
const savedGame = (name: string, look: string, createdAt: string, roomsDone: string[]) => ({
  v: 1,
  createdAt,
  character: { name, look },
  progress: { roomsDone, told: roomsDone, introSeen: true, onMap: true, tools: [], firstUse: [] },
});

const anaKey = 'matematika:save';
const brunoKey = 'matematika:player:bruno:save';

async function seed(page: Page, items: Record<string, unknown>) {
  await page.goto('/#igraci');
  await page.waitForSelector('.players');
  await page.evaluate((all) => {
    localStorage.clear();
    sessionStorage.clear();
    for (const [key, value] of Object.entries(all))
      localStorage.setItem(key, JSON.stringify(value));
  }, items);
}

const twoPlayers = () => ({
  [anaKey]: savedGame('Ana', 'look-1', '2026-11-01T08:00:00.000Z', ['r01', 'r02']),
  [brunoKey]: savedGame('Bruno', 'look-4', '2026-11-02T08:00:00.000Z', []),
});

/** A new launch: a tab with no memory of who was playing. */
async function launch(context: BrowserContext, hash = '') {
  const tab = await context.newPage();
  await tab.goto(`/${hash}`);
  return tab;
}

const saved = (page: Page, key: string) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), key);

test('two children keep their own games, across reloads and new launches', async ({
  page,
  context,
}) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Nobody yet: the game starts, with no question to answer.
  await expect(page.locator('.players')).toHaveCount(0);
  await newGame(page, 'Ana', 0);
  await page.waitForTimeout(300);
  await shot(page, '1-town-with-the-corner-button');

  // Ana meets Penkala and fixes the gate.
  await meetPenkala(page);
  await enterRoom1(page);
  await writeFive(page);
  await writeFive(page);
  await expect.poll(async () => (await state(page)).ui.screen, { timeout: 20_000 }).toBe('story');
  await page.getByRole('button', { name: hr.naming.next }).click();
  await expect(page.locator('.town__board')).toBeVisible();
  expect((await state(page)).save.progress.roomsDone).toEqual(['r01']);

  // The switch, with one player so far: back is offered, and a new player.
  await openPlayers(page);
  expect(await cardNames(page)).toEqual(['Ana', hr.players.newPlayer]);
  await expect(page.getByRole('button', { name: hr.players.back })).toBeVisible();
  await shot(page, '2-one-player');

  // Bruno starts from nothing: the opening, and Penkala introduces himself again.
  await page.getByRole('button', { name: hr.players.newPlayer }).click();
  await newGame(page, 'Bruno', 3);
  expect(new URL(page.url()).hash).toBe('');
  expect((await state(page)).save.progress.roomsDone).toEqual([]);
  await meetPenkala(page);

  // Bruno writes one line in room 1 and leaves it there.
  await enterRoom1(page);
  await writeFive(page);
  await expect
    .poll(async () => (await state(page)).room?.stage.lines.length ?? 0)
    .toBeGreaterThan(0);

  // A reload stays with Bruno, in the room, with his line.
  await page.reload();
  await hook(page);
  const bruno = await state(page);
  expect(bruno.save.character.name).toBe('Bruno');
  expect(bruno.room?.spec.id).toBe('r01');
  expect(bruno.save.progress.roomsDone).toEqual([]);
  await guide(page);
  await page.getByRole('button', { name: hr.ui.map }).click();
  await expect(page.locator('.town__board')).toBeVisible();

  // The switch again: now there are two, and Ana's game is as she left it.
  await openPlayers(page);
  expect(await cardNames(page)).toEqual(['Ana', 'Bruno', hr.players.newPlayer]);
  await shot(page, '3-two-players');
  await card(page, 'Ana').click();
  await hook(page);
  expect(new URL(page.url()).hash).toBe('');
  let ana = await state(page);
  expect(ana.save.character.name).toBe('Ana');
  expect(ana.save.progress.roomsDone).toEqual(['r01']);
  expect(ana.save.progress.started).toEqual([]);
  await expect(page.locator('.town__place[data-exit="canal"]')).toBeVisible();

  await page.reload();
  await hook(page);
  ana = await state(page);
  expect(ana.save.character.name).toBe('Ana');
  expect(ana.save.progress.roomsDone).toEqual(['r01']);

  // A new launch asks, and there is nobody to go back to.
  const tab = await launch(context);
  await titled(tab, hr.players.title);
  expect(await cardNames(tab)).toEqual(['Ana', 'Bruno', hr.players.newPlayer]);
  await expect(tab.getByRole('button', { name: hr.players.back })).toHaveCount(0);
  await card(tab, 'Bruno').click();
  await hook(tab);
  const brunoAgain = await state(tab);
  expect(brunoAgain.save.character.name).toBe('Bruno');
  expect(brunoAgain.save.progress.roomsDone).toEqual([]);
  expect(brunoAgain.save.progress.started.map((room) => room.id)).toEqual(['r01']);

  // Two tabs play as two children: Ana's tab still reloads as Ana.
  await page.reload();
  await hook(page);
  expect((await state(page)).save.character.name).toBe('Ana');
  await tab.close();

  // On the device: the first player on the old key, the second on keys of their own.
  expect((await saved(page, 'matematika:save')).character.name).toBe('Ana');
  const keys = await page.evaluate(() => Object.keys(localStorage));
  const own = keys.filter((key) => /^matematika:player:[0-9a-z]+:save$/.test(key));
  expect(own).toHaveLength(1);
  expect((await saved(page, own[0] as string)).character.name).toBe('Bruno');
  expect(errors).toEqual([]);
});

test('a save from before there were players is the first player, whole', async ({ page }) => {
  test.setTimeout(60_000);
  const save = savedGame('Ivo', 'look-2', '2026-11-01T08:00:00.000Z', ['r01', 'r02', 'r03']);
  await page.goto('/');
  await page.evaluate((s) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('matematika:save', JSON.stringify(s));
    localStorage.setItem('matematika:town:met', '["penkala"]');
    localStorage.setItem('matematika:log', '[{"type":"session","at":"2026-11-01T08:00:00.000Z"}]');
  }, save);
  await page.reload();
  await hook(page);

  // No question: his game opens as it always has.
  await expect(page.locator('.players')).toHaveCount(0);
  let game = await state(page);
  expect(game.ui.screen).toBe('map');
  expect(game.save.character.name).toBe('Ivo');
  expect(game.save.progress.roomsDone).toEqual(['r01', 'r02', 'r03']);

  // A second player joins; the first is untouched, and comes first.
  await openPlayers(page);
  await page.getByRole('button', { name: hr.players.newPlayer }).click();
  await newGame(page, 'Ana', 0);
  expect((await saved(page, 'matematika:save')).character.name).toBe('Ivo');
  expect(await saved(page, 'matematika:town:met')).toEqual(['penkala']);
  await openPlayers(page);
  expect(await cardNames(page)).toEqual(['Ivo', 'Ana', hr.players.newPlayer]);
  await card(page, 'Ivo').click();
  await hook(page);
  game = await state(page);
  expect(game.save.character.name).toBe('Ivo');
  expect(game.save.progress.roomsDone).toEqual(['r01', 'r02', 'r03']);
});

test('starting over and removing take a deliberate confirm', async ({ page, context }) => {
  test.setTimeout(90_000);
  await seed(page, twoPlayers());
  const tab = await launch(context);
  await titled(tab, hr.players.title);

  // At first only the list, and the quiet way into changes.
  await expect(tab.getByRole('button', { name: hr.players.remove })).toHaveCount(0);
  await tab.getByRole('button', { name: hr.players.manage }).click();
  await shot(tab, '4-manage');
  await expect(card(tab, 'Ana')).toBeDisabled();

  // The confirm says who and what; its "yes" isn't awake yet; "no" changes nothing.
  const anaRow = tab.locator('.players__item', { hasText: 'Ana' });
  await anaRow.getByRole('button', { name: hr.players.remove }).click();
  await titled(tab, hr.players.confirmRemove('Ana'));
  const yes = tab.getByRole('button', { name: hr.players.yesRemove });
  await expect(yes).toBeDisabled();
  await shot(tab, '5-confirm');
  await expect(yes).toBeEnabled({ timeout: 3000 });
  await tab.getByRole('button', { name: hr.players.no }).click();
  expect((await saved(tab, anaKey)).character.name).toBe('Ana');
  await expect(card(tab, 'Ana')).toBeVisible();

  // Bruno starts over: the name stays, the progress goes, and the opening comes again.
  await tab.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key) ?? '{}');
    save.progress.roomsDone = ['r01'];
    save.progress.told = ['r01'];
    localStorage.setItem(key, JSON.stringify(save));
  }, brunoKey);
  const brunoRow = tab.locator('.players__item', { hasText: 'Bruno' });
  await brunoRow.getByRole('button', { name: hr.players.restart }).click();
  await titled(tab, hr.players.confirmRestart('Bruno'));
  await tab.getByRole('button', { name: hr.players.yesRestart }).click();
  await tab.getByRole('button', { name: hr.players.manageDone }).click();
  await card(tab, 'Bruno').click();
  await hook(tab);
  let game = await state(tab);
  expect(game.ui.screen).toBe('opening');
  expect(game.save.character.name).toBe('Bruno');
  expect(game.save.progress.roomsDone).toEqual([]);
  for (let i = 0; i < 4; i += 1) await tab.locator('.opening__panel').click();
  // Already named: straight to the town.
  await expect(tab.locator('.town__board')).toBeVisible();
  expect((await saved(tab, anaKey)).progress.roomsDone).toEqual(['r01', 'r02']);

  // Ana is removed: only Bruno is left, and from then on the game opens without asking.
  await openPlayers(tab);
  await tab.getByRole('button', { name: hr.players.manage }).click();
  await tab
    .locator('.players__item', { hasText: 'Ana' })
    .getByRole('button', { name: hr.players.remove })
    .click();
  await tab.getByRole('button', { name: hr.players.yesRemove }).click();
  await expect(card(tab, 'Ana')).toHaveCount(0);
  expect(await saved(tab, anaKey)).toBeNull();
  expect((await saved(tab, brunoKey)).character.name).toBe('Bruno');
  await tab.close();

  const after = await launch(context);
  await hook(after);
  await expect(after.locator('.players')).toHaveCount(0);
  game = await state(after);
  expect(game.save.character.name).toBe('Bruno');
});

test('room links, the log and a backup each find the right player', async ({ page, context }) => {
  test.setTimeout(90_000);
  await seed(page, twoPlayers());
  const made = await page.evaluate(async () => {
    const linkModule: string = '/src/links/room-link.ts';
    const m = await import(/* @vite-ignore */ linkModule);
    const data = m.encodeRoom({
      title: 7,
      design: {
        machines: [{ form: 'ax-b', numbers: { a: 3, b: 1, c: 17, d: 0 } }],
        blinds: { readouts: false, shortDial: true },
        plant: false,
      },
      planted: null,
      solution: [['3x=18', 'x=6', '3·6−1=17']],
    }) as string;
    const id = m.roomIdOf(data) as string;
    return { data, id, reply: m.replyFragment({ id, stamp: 'cracked' }) as string };
  });
  // The room hangs on Bruno's wall, the second player's.
  await page.evaluate(
    ({ key, room }) => {
      const save = JSON.parse(localStorage.getItem(key) ?? '{}');
      save.workshop = { rooms: [room] };
      localStorage.setItem(key, JSON.stringify(save));
    },
    { key: brunoKey, room: { id: made.id, payload: made.data, title: 7, stamp: null } },
  );

  // A friend's link asks nothing, knows the device has played, and leaves everything as it was.
  const before = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  const friend = await launch(context, `#s=${made.data}`);
  await hook(friend);
  await expect(friend.locator('.players')).toHaveCount(0);
  const friendState = await state(friend);
  expect(friendState.ui.screen).toBe('friend');
  expect(friendState.ui.friend?.newToGame).toBe(false);
  await friend.getByRole('button', { name: hr.friend.go }).click();
  await expect.poll(async () => (await state(friend)).ui.screen).toBe('room');
  await friend.waitForTimeout(300);
  await friend.close();
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(before);

  // The reply goes straight to Bruno, who sent it, and stamps his wall alone.
  const reply = await launch(context, made.reply);
  await hook(reply);
  await expect(reply.locator('main.shop')).toBeVisible();
  const replied = await state(reply);
  expect(replied.save.character.name).toBe('Bruno');
  expect(replied.save.workshop.rooms[0]?.stamp).toBe('cracked');
  expect(new URL(reply.url()).hash).toBe('');
  expect((await saved(reply, brunoKey)).workshop.rooms[0].stamp).toBe('cracked');
  expect((await saved(reply, anaKey)).workshop).toBeUndefined();
  // A reload stays Bruno's, and stamps nothing twice.
  await reply.reload();
  await hook(reply);
  expect((await state(reply)).save.character.name).toBe('Bruno');
  await reply.close();

  // Luka's log asks whose, and names it.
  await page.evaluate(() => {
    localStorage.setItem(
      'matematika:player:bruno:log',
      JSON.stringify([{ type: 'session', at: '2026-11-02T08:00:00.000Z' }]),
    );
  });
  const log = await launch(context, '#dnevnik');
  await titled(log, hr.players.titleLog);
  await expect(log.getByRole('button', { name: hr.players.newPlayer })).toHaveCount(0);
  await expect(log.getByRole('button', { name: hr.players.manage })).toHaveCount(0);
  await card(log, 'Bruno').click();
  await expect(log.locator('.luka')).toContainText(hr.luka.player('Bruno'));
  await expect(log.locator('.luka')).not.toContainText(hr.luka.sessionsNone);
  await log.close();

  // A backup link asks whose game to replace, and leaves the other alone.
  const backup = await page.evaluate(async () => {
    const backupModule: string = '/src/app/backup.ts';
    const m = await import(/* @vite-ignore */ backupModule);
    const save = {
      v: 1,
      createdAt: '2026-10-01T08:00:00.000Z',
      character: { name: null, look: null },
      progress: {
        roomsDone: ['r01', 'r02', 'r03', 'r04'],
        tools: [],
        firstUse: [],
        room: null,
        started: [],
        onMap: true,
        told: ['r01', 'r02', 'r03', 'r04'],
        ideasSeen: [],
        tornPages: [],
        introSeen: true,
      },
    };
    return (await m.encodeBackup(save, save)) as string;
  });
  const restore = await launch(context, `#b=${backup}`);
  await titled(restore, hr.players.titleRestore);
  await card(restore, 'Ana').click();
  await expect(restore.locator('.luka')).toContainText(hr.luka.player('Ana'));
  await restore.getByRole('button', { name: hr.luka.restore.accept }).click();
  await hook(restore);
  const restored = await state(restore);
  expect(restored.save.character.name).toBe('Ana');
  expect(restored.save.progress.roomsDone).toHaveLength(4);
  expect((await saved(restore, brunoKey)).character.name).toBe('Bruno');
  await restore.close();
});
