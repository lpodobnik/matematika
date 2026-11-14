// Story 9.7: each new way to play, once, on screen, each with its first-time guide: Sneak in the
// tram line, Little one alone in the archive, and Unmask in the newspaper. Real taps throughout,
// with wrong tries included.

import { expect, type Page, test } from '@playwright/test';
import type { GameState } from '../src/store/types';

type Game = {
  __s: { getState(): GameState };
  __d(action: unknown): void;
  __sneak: {
    routeTo(board: unknown, from: unknown, target: number): number[] | null;
    standing(board: unknown, state: unknown): number;
    targetStop(board: unknown, state: unknown): number | null;
  };
  __spec(lead: string): { scenes: { boards: unknown[] }[] };
};

async function hook(page: Page) {
  await page.waitForFunction(() => !document.querySelector('.boot'), null, { timeout: 20_000 });
  await page.evaluate(async () => {
    const find = (path: string) =>
      performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .find((name) => new URL(name).pathname === path) ?? path;
    const store = await import(/* @vite-ignore */ find('/src/store/store.ts'));
    const sneak = await import(/* @vite-ignore */ find('/src/hunt/sneak.ts'));
    const leads = await import(/* @vite-ignore */ find('/src/content/leads/index.ts'));
    const w = window as unknown as Game;
    w.__s = store.gameStore;
    w.__d = (action) => store.gameStore.getState().dispatch(action);
    w.__sneak = sneak;
    w.__spec = (lead) => leads.leadSpecs[lead];
  });
  await page.waitForFunction(
    () => (window as unknown as Game).__s.getState().ui.screen !== 'loading',
  );
}

const state = (page: Page) => page.evaluate(() => (window as unknown as Game).__s.getState());
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/scenes-${test.info().project.name}-${name}.png` });

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

async function startLead(page: Page, lead: string, hunt: Record<string, unknown> = {}) {
  await page.goto('/?dev');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await hook(page);
  await page.getByRole('button', { name: 'close', exact: true }).click();
  await page.evaluate(
    ({ rooms, hunt }) => {
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
          hunt: {
            ...s.save.hunt,
            gateOpened: true,
            beats: ['foundry', 'named', 'map-given'],
            ...hunt,
          },
          companion: { name: 'Bip', looks: [], wearing: [], gear: [], taught: [] },
        },
        room: null,
      });
    },
    { rooms: allRooms, hunt },
  );
  const panels = page.locator('.opening__panel');
  for (let i = 0; i < 4; i += 1) {
    if (await panels.count()) await panels.click();
  }
  await expect(page.locator('.town__board[data-area="u1"]')).toBeVisible({ timeout: 12_000 });
  await page.locator('.town__map-button').first().click();
  await page.locator(`.trail__pin[data-lead="${lead}"]`).click();
  await expect(page.locator('.lesson')).toBeVisible({ timeout: 12_000 });
}

async function pad(page: Page, keys: string[]) {
  for (const key of keys) {
    await page
      .locator(`.pad__key[data-key="${key}"]`)
      .dispatchEvent('pointerdown', { button: 0, isPrimary: true });
  }
}

const next = (page: Page) => page.locator('.hunt__next').first().click();

async function showing(page: Page, steps: number) {
  for (let i = 0; i < steps; i += 1) await page.locator('.lesson').click();
}

/** He walks to the lit stop, by the safe way, with real taps on the moves. */
async function walkToTheStop(page: Page, lead: string) {
  const moves = await page.evaluate((id) => {
    const g = window as unknown as Game;
    const s = g.__s.getState();
    const play = s.save.hunt.scene?.state as { sneak: { board: number; tick: number } };
    const spec = g.__spec(id).scenes[0];
    const board = spec?.boards[play.sneak.board];
    const target = g.__sneak.targetStop(board, play.sneak);
    if (target === null) return null;
    return g.__sneak.routeTo(
      board,
      { at: g.__sneak.standing(board, play.sneak), tick: play.sneak.tick },
      target,
    );
  }, lead);
  expect(moves).not.toBeNull();
  for (const by of moves ?? []) {
    const name = by === 1 ? 'on' : by === -1 ? 'back' : 'wait';
    await page.locator(`.object__button[data-move="${name}"]`).click();
  }
}

async function theThread(page: Page, lead: string) {
  await expect(page.locator('.thread__find')).toBeVisible();
  await next(page);
  await next(page);
  await expect(page.locator('.town__board[data-area="u1"]')).toBeVisible({ timeout: 12_000 });
  const save = (await state(page)).save;
  expect(save.hunt.leadsDone).toContain(lead);
  expect(save.hunt.scene).toBeNull();
}

test('Sneak: the tram line, being caught and a wrong stop included', async ({ page }) => {
  test.setTimeout(180_000);
  await startLead(page, 'l04');
  await shot(page, 'l04-1-lesson');
  await showing(page, 3);

  // Try: the stop by tapping, then the letter by writing.
  await page.locator('.number-line__stop').nth(5).click();
  await next(page);
  await pad(page, ['1', '5', 'enter']);
  await next(page);

  // Fix: it counted ticks.
  await page.locator('.hunt__wobbly-line').nth(1).click();
  await page.locator('.number-line__stop').nth(1).click();
  await pad(page, ['1', '5', 'enter']);
  await next(page);

  // The first time, only the asked move passes.
  await expect(page.locator('.guide-card')).toBeVisible();
  await shot(page, 'l04-2-guide');
  await next(page);
  await page.locator('.object__button[data-move="on"]').click();
  expect((await state(page)).save.hunt.scene).toBeTruthy();
  const unmoved = (await state(page)).save.hunt.scene?.state as { sneak: { tick: number } };
  expect(unmoved.sneak.tick).toBe(0);

  // A wrong stop lights, and it's empty.
  await pad(page, ['1', '0', 'enter']);
  await expect(page.locator('.stop[data-lit="true"]')).toHaveAttribute('data-stop', '2');
  await shot(page, 'l04-3-board');
  await walkToTheStop(page, 'l04');
  await expect(page.locator('.knock__bubble')).toBeVisible();
  await shot(page, 'l04-4-empty');
  await page.locator('.knock__bubble button').click();

  // Asked for a different stop now: stop 3, worth 15.
  await pad(page, ['1', '5', 'enter']);
  await walkToTheStop(page, 'l04');
  await page.locator('.knock__bubble button').click();

  // Second board: walking into the patrol costs the walk.
  await pad(page, ['1', '6', '0', 'enter']);
  await page.locator('.object__button[data-move="on"]').click();
  await page.locator('.object__button[data-move="on"]').click();
  await expect(page.locator('.knock__bubble')).toContainText('HVALA');
  await shot(page, 'l04-5-caught');
  await page.locator('.knock__bubble button').click();
  await walkToTheStop(page, 'l04');
  await page.locator('.knock__bubble button').click();

  // Third board, far from zero.
  await pad(page, ['1', '0', '0', '4', 'enter']);
  await walkToTheStop(page, 'l04');
  await shot(page, 'l04-6-far');
  await page.locator('.knock__bubble button').click();
  await next(page);

  await pad(page, ['2', '5', 'enter']);
  await theThread(page, 'l04');
  // A wrong stop means no first-try parts; being caught alone wouldn't.
  expect((await state(page)).save.economy.parts).toBe(0);
  expect((await state(page)).save.hunt.firstTries.l04).toBe(false);
});

test('Unmask: the newspaper, a wrong accusation included', async ({ page }) => {
  test.setTimeout(180_000);
  await startLead(page, 'l06', {
    leadsDone: ['l01', 'l02', 'l03', 'l04'],
    knotsDone: ['k1', 'w1'],
  });
  await showing(page, 3);
  await page.locator('.number-line__stop').nth(1).click();
  await next(page);
  await pad(page, ['4', '9', '0', 'enter']);
  await next(page);
  await page.locator('.hunt__wobbly-line').nth(1).click();
  await page.locator('.number-line__stop').first().click();
  await pad(page, ['2', '0', '0', '0', 'enter']);
  await next(page);

  await expect(page.locator('.guide-card')).toBeVisible();
  await next(page);
  // The moment before: the guide asks for cards, and pointing doesn't pass.
  await page.locator('.suspect[data-suspect="slagar"] .suspect__name').click();
  const played = (await state(page)).save.hunt.scene?.state as { unmask?: { phase: string } };
  expect(played.unmask?.phase).toBe('ask');
  await page.locator('.clue[data-card="a"]').click();
  await page.locator('.clue[data-card="b"]').click();
  await expect(page.locator('.suspect__working li')).toHaveCount(6);
  await shot(page, 'l06-1-working');

  // The one who slipped once isn't the one.
  await page.locator('.suspect[data-suspect="raznosac"] .suspect__name').click();
  await expect(page.locator('.knock__bubble')).toContainText('jednom');
  await shot(page, 'l06-2-offended');
  await page.locator('.knock__bubble button').click();
  await page.locator('.suspect[data-suspect="slagar"] .suspect__name').click();

  // Pointing isn't the end: he writes the line corrected. A false one bounces.
  await pad(page, ['3', '4', '0', 'enter']);
  await expect(page.locator('.hunt__note')).toBeVisible();
  await shot(page, 'l06-3-write');
  await pad(page, ['delete', 'delete', '3', '0', 'enter']);
  await expect(page.locator('.knock__bubble')).toBeVisible();
  await next(page);

  await pad(page, ['3', '3', '0', 'enter']);
  await pad(page, ['3', '3', '4', '−', '3', '3', '0', '=', '4', 'enter']);
  await theThread(page, 'l06');
  expect((await state(page)).save.hunt.firstTries.l06).toBe(false);
});

test('Little one alone: the archive, the missing zero and a dead end included', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await startLead(page, 'l03');
  await showing(page, 3);

  // Try: 354, by place.
  const add = (place: number) =>
    page.locator(`.places__column[data-place="${place}"] [data-add]`).click();
  for (let i = 0; i < 3; i += 1) await add(0);
  for (let i = 0; i < 5; i += 1) await add(1);
  for (let i = 0; i < 4; i += 1) await add(2);
  await shot(page, 'l03-1-places');
  await next(page);
  await pad(page, ['1', '0', '0', '0', 'enter']);
  await next(page);
  await pad(page, ['3', '0', '0', '1', '5', 'enter']);
  await next(page);

  // Fix: it dropped the zero.
  await page.locator('.hunt__wobbly-line').nth(1).click();
  for (let i = 0; i < 5; i += 1) await add(0);
  for (let i = 0; i < 5; i += 1) {
    await page.locator('.places__column[data-place="1"] .places__button').first().click();
  }
  await pad(page, ['5', '·', '1', '0', '^', '2', '+', '7', 'enter']);
  await next(page);

  // Alone, by its lamp.
  await expect(page.locator('.guide-card')).toBeVisible();
  await shot(page, 'l03-2-alone');
  await next(page);
  const pipe = (n: number) => page.locator(`.alone__pipe[data-pipe="${n}"]`).click();
  await pipe(3);
  await pipe(4);
  await pipe(7);
  await expect(page.locator('.alone__plate')).toHaveText(/^34.7__$/);
  await shot(page, 'l03-3-dead-end');
  await page.locator('.knock__bubble button').click();
  await pipe(0);
  await pipe(7);
  await pipe(2);
  await expect(page.locator('.knock__bubble')).toBeVisible();
  await next(page);

  await pad(page, ['5', 'enter']);
  await pad(page, ['3', '·', '1', '0', '^', '4', '+', '4', '·', '1', '0', '^', '3', '+']);
  await shot(page, 'l03-4-write');
  await pad(page, ['7', '·', '1', '0', '+', '2', 'enter']);
  await theThread(page, 'l03');
  expect((await state(page)).save.hunt.pages.l03?.[1]?.text).toContain('10⁴');
});
