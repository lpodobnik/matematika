// Story 4.9: rooms 8–13 back to back, in a real browser, at the tablet's 1280 × 800 and the
// phone's 640 × 360. From a game with rooms 1–7 done (set up through the store, as a save
// would bring it), every notebook control the epic added is tapped for real: the gear chain's
// last link, its operations and Pokreni, the pad's digits and enter, the story room's
// stories and Potvrdi, room 11's ranges and its − step, and the drum's heights; and every
// pin must be right (it pays). The scene is drawn on the canvas, so its moves (the dial, an
// x pin's value, the tray's x-gear) go to the game's store as the scene would send them; the
// first touch on the canvas and the pin's confirm are real taps. Locks and restarts play
// out on their own, within the scene's time. Every room is left back to the town (story 5.0)
// and the next is reached through its district map. Each room's key moments are screenshotted.
//
//   npm run e2e                                       (starts its own server on 5291)
//   E2E_URL=http://localhost:5290/ npm run e2e        (uses a server already running)

import { expect, type Page, test } from '@playwright/test';
import { hr } from '../src/content/text/hr';

/** Longest a lock or restart may take to report itself done (as in rooms-1-7.spec.ts). */
const playsWithinMs = 6000;

interface GameState {
  ui: { screen: string };
  room: { spec: { id: string }; stageIndex: number; stage: { phase: string } } | null;
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

/** An x pin set on the scene, then confirmed with its button; it must be right. */
async function pinX(page: Page, x: number) {
  const before = (await state(page)).parts;
  await dispatch(page, { type: 'pin/set', value: { kind: 'x', x } });
  await page.locator('button.pin-confirm').click();
  await expect.poll(async () => (await state(page)).phase).toBe('open');
  await paysForIt(page, before);
}

/** The gear chain's last link run backward: tapped, an operation, a number on the pad. */
async function runLink(page: Page, op: string, n: string, by: 'enter' | 'button' = 'enter') {
  await page.locator('.chain__link--last').click();
  await page.locator(`.chain-pick__op[data-op="${op}"]`).click();
  for (const digit of n) await key(page, digit).click();
  if (by === 'enter') await key(page, 'enter').click();
  else await page.locator('.chain-pick__run').click();
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

  // Room 8, the tram: the pin at 8, then the chain, − 9 (a wrong + 9 first, which jams and
  // is deleted) and : 4, then the two blanks.
  await arrive(page, 'r08');
  await dial(page, [1, 2, 3]);
  await pinX(page, 8);
  await runLink(page, 'add', '9');
  await expect(page.locator('.line--wrong')).toBeVisible();
  for (let i = 0; i < 12 && (await page.locator('.line--wrong').count()) > 0; i += 1) {
    await key(page, 'delete').click();
  }
  await expect(page.locator('.line--wrong')).toHaveCount(0);
  await runLink(page, 'sub', '9', 'button');
  await runLink(page, 'div', '4');
  await expect(page.locator('.notebook__lines')).toContainText('x = 32 : 4');
  await shot('r08-chain');
  await type(page, '8');
  await type(page, '8');
  await finish(page, 'r08', shot);

  // Room 9, the steam lift: the pin at 7; the tray's x-gear set to 5 and dropped (as the
  // scene would send it), which cancels the balloons, then a reset; then 135 − ☐ with 135,
  // its blank, : 5 and the last two blanks.
  await arrive(page, 'r09');
  await dial(page, [1, 2, 3]);
  await pinX(page, 7);
  for (let i = 0; i < 4; i += 1) await dispatch(page, { type: 'tray/step', kind: 'gear', by: 1 });
  await dispatch(page, { type: 'tray/drop', kind: 'gear' });
  await expect(page.locator('.chain__links')).toContainText('+ 100');
  await shot('r09-gear');
  await dispatch(page, { type: 'stage/reset' });
  await expect(page.locator('.chain__links')).toContainText('135 − ☐');
  await runLink(page, 'from', '135');
  await expect(page.locator('.notebook__lines')).toContainText('5x = 135 − 100');
  await type(page, '35');
  await runLink(page, 'div', '5');
  await shot('r09-chain');
  await expect(page.locator('.line--wrong')).toHaveCount(0);
  await type(page, '7');
  await type(page, '7');
  await finish(page, 'r09', shot);

  // Room 10, the market scales: the story written as an equation, then 10 and both lines;
  // then the story that fits the pans, flagged, then 7 and both lines.
  await arrive(page, 'r10');
  await expect(page.locator('.story-panel')).toBeVisible();
  await type(page, '60+3x=90');
  await shot('r10-written');
  await dial(page, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  await type(page, '10');
  await type(page, '10');
  await presented(page, 'locked');
  await touch(page);
  await flag(page, hr.stories.label, 1);
  await dial(page, [1, 2, 3, 4, 5, 6, 7]);
  await type(page, '7');
  await type(page, '7');
  await finish(page, 'r10', shot);

  // Room 11, the great wheel: the coarse slider's window, "100 to 300", the chain with 5 905
  // and 27, then the slider to 207 by − from 210 as his check, and both lines.
  await arrive(page, 'r11');
  await dial(page, [10, 20, 30]);
  await flag(page, hr.range.label, 1);
  await runLink(page, 'from', '5905');
  await runLink(page, 'div', '27');
  await dial(page, [210]);
  const down = page.getByRole('button', { name: hr.fineDial.down });
  for (let i = 0; i < 3; i += 1) await down.click();
  await expect(page.locator('.line--wrong')).toHaveCount(0);
  await expect(page.locator('.fine-dial__x')).toContainText('207');
  await shot('r11-at-207');
  await type(page, '207');
  await type(page, '207');
  await finish(page, 'r11', shot);

  // Room 12, the junction: the first machine's answer, 4, is the second's weight.
  await arrive(page, 'r12');
  await expect(page.locator('.linked-panel')).toContainText('☐');
  await dial(page, [1, 2, 3]);
  await pinX(page, 4);
  await type(page, '4');
  await type(page, '4');
  await presented(page, 'locked');
  await touch(page);
  await expect(page.locator('.linked-panel__slot')).toHaveText('4');
  await dial(page, [1, 2, 3]);
  await pinX(page, 5);
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
