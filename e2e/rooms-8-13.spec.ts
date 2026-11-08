// Story 4.9: rooms 8–13 back to back, in a real browser, at the tablet's 1280 × 800 and the
// phone's 640 × 360. From a game with rooms 1–7 done (set up through the store, as a save
// would bring it), every room is solved with its one tool, and every notebook control the
// epic added is tapped for real: the way back's two buttons, the pad's digits and enter, the
// story room's stories and Potvrdi, room 11's − step, and the drum's heights; and every pin
// must be right (it pays). The scene is drawn on the canvas, so its moves (the dial, the
// tray, the splitter) go to the game's store as the scene would send them; the first touch
// on the canvas is a real tap. Locks and restarts play out on their own, within the scene's
// time. Every room is left back to the town (story 5.0) and the next is reached through its
// district map. Each room's key moments are screenshotted.
//
//   npm run e2e                                       (starts its own server on 5291)
//   E2E_URL=http://localhost:5290/ npm run e2e        (uses a server already running)

import { expect, type Page, test } from '@playwright/test';
import { hr } from '../src/content/text/hr';

/** Longest a lock or restart may take to report itself done (as in rooms-1-7.spec.ts). */
const playsWithinMs = 6000;

interface GameState {
  ui: { screen: string };
  room: {
    spec: { id: string };
    stageIndex: number;
    stage: {
      phase: string;
      tray: { weight: number; float: number; gear: number };
      splitter: number;
    };
  } | null;
  save: { progress: { roomsDone: string[]; tools: string[] }; economy: { parts: number } };
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

const dispatch = (page: Page, action: unknown) =>
  page.evaluate((a) => (window as unknown as Game).__d(a), action);

const state = (page: Page) =>
  page.evaluate(() => {
    const s = (window as unknown as Game).__s.getState();
    return {
      screen: s.ui.screen,
      room: s.room?.spec.id ?? null,
      stage: s.room?.stageIndex ?? -1,
      phase: s.room?.stage.phase ?? null,
      done: s.save.progress.roomsDone,
      tools: s.save.progress.tools,
      parts: s.save.economy.parts,
    };
  });

const toSeven = ['r01', 'r02', 'r03', 'r04', 'r05', 'r06', 'r07'];
/** What a player of rooms 1–7 has met: the controls and the handover steps. */
const met = [
  'pin',
  'tray',
  'splitter',
  'handover-dial',
  'handover-write',
  'handover-answer',
  'handover-check',
  'handover-tray',
  'handover-balance-goal',
  'handover-splitter',
  'handover-rewrite',
  // Story 6.1: every room guide read (e2e/room-guide.spec.ts goes through them).
  ...[
    'dial',
    'notebook',
    'check',
    'pin',
    'tilt',
    'tray',
    'splitter',
    'logbook',
    'chain',
    'gear',
    'story',
    'story-choice',
    'coarse',
    'range',
    'linked',
    'linked-fed',
    'drum',
  ].map((topic) => `guide-${topic}`),
];

async function startOnTheMap(page: Page) {
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
        },
        room: null,
        fight: null,
      });
    },
    { done: toSeven, met },
  );
  await expect(page.locator('.town__board')).toBeVisible();
}

/** The town's corner button opens the district map over it (story 5.0). */
async function openMap(page: Page) {
  await page.getByRole('button', { name: 'Karta četvrti' }).click();
  await expect(page.locator('.town__overlay .map__board')).toBeVisible();
}

const key = (page: Page, name: string) => page.locator(`.pad__key[data-key="${name}"]`);

async function type(page: Page, line: string) {
  for (const char of line) await key(page, char).click();
  await key(page, 'enter').click();
}

/** He touches the machine: a tap on the canvas's empty top corner. */
async function touch(page: Page) {
  await expect.poll(async () => (await state(page)).phase).toBe('arrive');
  await page
    .locator('canvas')
    .first()
    .click({ position: { x: 8, y: 8 } });
  await expect.poll(async () => (await state(page)).phase).not.toBe('arrive');
}

async function dial(page: Page, xs: readonly number[]) {
  for (const x of xs) await dispatch(page, { type: 'dial/set', x });
}

/** A right prediction pays 2 parts (story 4.9 review: a wrong pin would also open the stage). */
async function paysForIt(page: Page, before: number) {
  await expect.poll(async () => (await state(page)).parts).toBe(before + 2);
}

/**
 * The way back: one of the two buttons for the last step, always in the same order (+ then
 * −, · then :, and for `135 − ☐` the right one first).
 */
async function wayBack(page: Page, button: 0 | 1) {
  await page.locator('button.chain-pick__op').nth(button).click();
}

const stageNow = (page: Page) =>
  page.evaluate(() => {
    const stage = (window as unknown as Game).__s.getState().room?.stage;
    if (!stage) throw new Error('no room');
    return { tray: stage.tray, splitter: stage.splitter };
  });

/** A piece of this number from the tray, stepped there and dropped, as the scene sends it. */
async function drop(page: Page, kind: 'weight' | 'float' | 'gear', value: number) {
  const { tray } = await stageNow(page);
  const by = tray[kind] < value ? 1 : -1;
  for (let i = tray[kind]; i !== value; i += by) {
    await dispatch(page, { type: 'tray/step', kind, by });
  }
  await dispatch(page, { type: 'tray/drop', kind });
}

/** The splitter set to `parts` and dropped, as the scene sends it. */
async function split(page: Page, parts: number) {
  const { splitter } = await stageNow(page);
  const by = splitter < parts ? 1 : -1;
  for (let i = splitter; i !== parts; i += by) {
    await dispatch(page, { type: 'splitter/step', by });
  }
  await dispatch(page, { type: 'splitter/split' });
}

/**
 * A flag on the i-th option of a notebook panel (a story, a range, a height), then Potvrdi;
 * it must be right: it pays.
 */
async function flag(page: Page, panel: string, i: number) {
  const before = (await state(page)).parts;
  const scope = page.getByRole('region', { name: panel });
  await scope.locator('.story-panel__choice').nth(i).click();
  await scope.locator('.story-panel__confirm').click();
  await expect.poll(async () => (await state(page)).phase).toBe('open');
  await paysForIt(page, before);
}

/**
 * A lock or restart plays out, and the scene reports it done within `playsWithinMs`, under
 * the clock's 8 s fallback (as rooms-1-7.spec.ts's `presented`).
 */
async function presented(page: Page, phase: 'locked' | 'restart') {
  await expect.poll(async () => (await state(page)).phase).toBe(phase);
  const before = await state(page);
  await expect
    .poll(
      async () => {
        const now = await state(page);
        return now.room === before.room && now.stage === before.stage && now.phase === phase;
      },
      { timeout: playsWithinMs },
    )
    .toBe(false);
}

/** The restart plays (its restored machine screenshotted), then the story card and "next". */
async function finish(page: Page, room: string, shot: (name: string) => Promise<void>) {
  await expect.poll(async () => (await state(page)).phase).toBe('restart');
  await shot(`${room}-restart`);
  await presented(page, 'restart');
  await expect(page.locator('.story__card')).toBeVisible();
  await shot(`${room}-story`);
  await page.locator('.story__next').click();
}

/** The next room, from the town he is back in after every story card (story 5.0). */
async function arrive(page: Page, room: string) {
  await expect.poll(async () => (await state(page)).screen).toBe('map');
  expect((await state(page)).room).toBeNull();
  await openMap(page);
  // The map takes him to the street; he walks to the machine. One an automaton holds isn't
  // what this walks through: e2e/town.spec.ts is.
  await page.locator(`button.map__node[data-node="${room}"]`).click();
  if (['r08', 'r12', 'r13'].includes(room)) {
    await dispatch(page, { type: 'map/travel', node: room });
  } else {
    await page.locator(`.town__place[data-node="${room}"]`).click();
  }
  await expect.poll(async () => (await state(page)).room, { timeout: 10_000 }).toBe(room);
  await touch(page);
}

test('rooms 8–13 back to back, through the line reveal', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
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
  await hook(page);
  await startOnTheMap(page);

  // Room 8, the tram: the way back, − 9 (a wrong + 9 first, which jams and is deleted) and
  // : 4, then the two blanks.
  await arrive(page, 'r08');
  await wayBack(page, 0);
  await expect(page.locator('.line--wrong')).toBeVisible();
  for (let i = 0; i < 12 && (await page.locator('.line--wrong').count()) > 0; i += 1) {
    await key(page, 'delete').click();
  }
  await expect(page.locator('.line--wrong')).toHaveCount(0);
  await wayBack(page, 1);
  await expect(page.locator('.notebook__lines')).toContainText('4x = 32');
  await wayBack(page, 1);
  await expect(page.locator('.notebook__lines')).toContainText('x = 32 : 4');
  await shot('r08-chain');
  await type(page, '8');
  await type(page, '8');
  await finish(page, 'r08', shot);

  // Room 9, the steam lift, the tray from the start: the x-gear set to 5 and dropped (as the
  // scene would send it), which cancels the balloons; the 100 dragged off, more than the
  // tray's stepper reaches; a split by 5; and the last two blanks. No way back here.
  await arrive(page, 'r09');
  await expect(page.locator('.chain')).toHaveCount(0);
  await drop(page, 'gear', 5);
  await expect(page.locator('.notebook__lines')).toContainText('135 = 5x + 100');
  await shot('r09-gear');
  await dispatch(page, { type: 'tray/take', side: 'right', key: 'right-weight-0' });
  await split(page, 5);
  await shot('r09-alone');
  await expect(page.locator('.line--wrong')).toHaveCount(0);
  await type(page, '7');
  await type(page, '7');
  await finish(page, 'r09', shot);

  // Room 10, the market scales: the story written as an equation, then a balloon of 60, a
  // split by 3 and both blanks; then the story that fits the pans, flagged, then a balloon
  // of 5, a split by 2 and both blanks.
  await arrive(page, 'r10');
  await expect(page.locator('.story-panel')).toBeVisible();
  await type(page, '60+3x=90');
  await shot('r10-written');
  await drop(page, 'float', 60);
  await split(page, 3);
  await type(page, '10');
  await type(page, '10');
  await presented(page, 'locked');
  await touch(page);
  await flag(page, hr.stories.label, 1);
  await drop(page, 'float', 5);
  await split(page, 2);
  await type(page, '7');
  await type(page, '7');
  await finish(page, 'r10', shot);

  // Room 11, the great wheel: the way back, − 316 and : 27, the numbers already on its
  // buttons, then the slider to 207 by − from 210 as his check, and both blanks.
  await arrive(page, 'r11');
  await wayBack(page, 1);
  await expect(page.locator('.notebook__lines')).toContainText('27x =');
  await wayBack(page, 1);
  await dial(page, [210]);
  const down = page.getByRole('button', { name: hr.fineDial.down });
  for (let i = 0; i < 3; i += 1) await down.click();
  await expect(page.locator('.line--wrong')).toHaveCount(0);
  await expect(page.locator('.fine-dial__x')).toContainText('207');
  await shot('r11-at-207');
  await type(page, '207');
  await type(page, '207');
  await finish(page, 'r11', shot);

  // Room 12, the junction: a weight of 1 and a split by 2; the first machine's answer, 4, is
  // the second's weight: a balloon of 4 and a split by 3.
  await arrive(page, 'r12');
  await expect(page.locator('.linked-panel')).toContainText('☐');
  await drop(page, 'weight', 1);
  await split(page, 2);
  await type(page, '4');
  await type(page, '4');
  await presented(page, 'locked');
  await touch(page);
  await expect(page.locator('.linked-panel__slot')).toHaveText('4');
  await drop(page, 'float', 4);
  await split(page, 3);
  await shot('r12-linked');
  await type(page, '5');
  await type(page, '5');
  await finish(page, 'r12', shot);
  expect((await state(page)).tools).toContain('drum');

  // Room 13, the clock tower: three dots, the next one pinned on the drum, the line.
  await arrive(page, 'r13');
  for (const [stage, x, right] of [
    [0, 5, 0],
    [1, 4, 2],
  ] as const) {
    if (stage === 1) await touch(page);
    await dial(page, [1, 2]);
    await expect(page.locator('.drum__left')).toHaveCount(3);
    await flag(page, hr.drum.label, right);
    await expect(page.locator('.drum__pin [data-right][aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('.drum__left')).toHaveCount(4);
    await dial(page, [x]);
    await type(page, String(x));
    await type(page, String(x));
    if (stage === 0) await presented(page, 'locked');
  }
  await expect(page.locator('.drum__line')).toBeVisible();
  await shot('r13-line');
  await expect
    .poll(async () => (await state(page)).done, { timeout: playsWithinMs })
    .toContain('r13');
  await expect(page.locator('.story__card')).toContainText('Linearna');
  await shot('r13-reveal');
  await page.locator('.story__next').click();

  // The district restored: every room done, the note, and the armour 60 lair open, on the
  // district map over the town.
  await expect(page.locator('.town__board')).toBeVisible();
  expect((await state(page)).done).toHaveLength(13);
  await openMap(page);
  await expect(page.locator('.map__node[data-kind="lair"]')).toHaveCount(0);
  await shot('map-whole');
  expect(errors).toEqual([]);
});
