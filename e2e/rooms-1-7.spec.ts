// Story 2.13: rooms 1–7 back to back from a fresh start, in a real browser, at the tablet's
// 1280 × 800 and the phone's 640 × 360. Story 6.1: from a fresh start every room guide of
// rooms 1–7 shows; he reads each through, tapping its "Dalje", and makes the moves it asks
// for (on a phone he brings the notebook back to write). Every DOM control is tapped for real: the opening's
// panel and skip, the naming form, the number pad, the pin's confirm, the logbook's flag, the
// hint button, the story cards' "next", the town's places (story 5.0: every room is left back
// to the town), its district map and the map's nodes, and the scene's canvas for the first
// touch. The rest
// of the scene is drawn on the canvas, so its moves (the dial, a pin's value, the tray and
// splitter) go to the game's store as the scene would send them. Locks and restarts play out
// on their own: a scene that never reports them done fails the test. Every room's restart
// and story card is screenshotted into the test's output folder.
//
// Runs against the dev server, whose store module the test imports to reach the scene:
//   npm run e2e                                       (starts its own server on 5291)
//   E2E_URL=http://localhost:5290/ npm run e2e        (uses a server already running)

import { expect, type Page, test } from '@playwright/test';

/**
 * Longest a lock or restart may take to report itself done: the restart's 3.6 s plus a
 * margin, under the 8 s clock fallback (`presentationTimeoutMs`), so the fallback can't pass.
 */
const playsWithinMs = 6000;

/** The part of the game's state the test reads (src/store/types.ts). */
interface GameState {
  ui: { screen: string; hint: { level: number } | null };
  room: {
    spec: { id: string };
    stageIndex: number;
    stage: { phase: string; dialX: number; refused: number };
  } | null;
  save: { progress: { roomsDone: string[] }; character: { name: string | null } };
}

type Game = { __s: { getState(): GameState }; __d(action: unknown): void };

async function hook(page: Page) {
  await page.waitForFunction(() => !document.querySelector('.boot'), null, { timeout: 20_000 });
  await page.evaluate(async () => {
    // The store module the app itself loaded (after a hot reload its URL carries ?t=).
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
    const r = s.room;
    return {
      screen: s.ui.screen,
      room: r ? r.spec.id : null,
      stage: r ? r.stageIndex : -1,
      phase: r ? r.stage.phase : null,
      dial: r ? r.stage.dialX : null,
      refused: r ? r.stage.refused : 0,
      hint: s.ui.hint?.level ?? 0,
      done: s.save.progress.roomsDone,
      name: s.save.character.name,
    };
  });

const key = (page: Page, name: string) => page.locator(`.pad__key[data-key="${name}"]`);

/**
 * Story 6.1: Nikola's guide, the first time a room needs a tool. He reads each step and taps
 * its "Dalje"; a step that waits for a move ("Probaj!") is left to the move he makes next.
 */
async function guide(page: Page) {
  for (let i = 0; i < 12; i += 1) {
    const next = page.locator('.room-guide__next');
    if ((await next.count()) === 0) return;
    await next.click();
  }
}

/**
 * On a phone the notebook is pushed aside while the guide rings something in the scene; he
 * brings it back with its handle to write.
 */
async function notebookBack(page: Page) {
  const phone = (page.viewportSize()?.height ?? 800) < 500;
  if (phone && (await page.locator('.notebook-area[data-aside="true"]').count()) > 0) {
    await page.locator('.notebook__handle').click();
    await expect(page.locator('.notebook-area')).toHaveAttribute('data-aside', 'false');
  }
}

/** Taps a line out on the pad and enters it. */
async function write(page: Page, line: string) {
  await guide(page);
  await notebookBack(page);
  for (const char of line) await key(page, char).click();
  await key(page, 'enter').click();
}

async function deleteKeys(page: Page, times: number) {
  await notebookBack(page);
  for (let i = 0; i < times; i += 1) await key(page, 'delete').click();
}

/** A lock or restart plays out, and the scene reports it done on its own. */
async function presented(page: Page) {
  const before = await state(page);
  if (before.phase !== 'locked' && before.phase !== 'restart') {
    throw new Error(`nothing plays in ${before.room}.${before.stage}:${before.phase}`);
  }
  await expect
    .poll(
      async () => {
        const now = await state(page);
        return now.room === before.room && now.stage === before.stage && now.phase === before.phase;
      },
      {
        timeout: playsWithinMs,
        message: `${before.room}.${before.stage}:${before.phase} plays out`,
      },
    )
    .toBe(false);
}

const dial = async (page: Page, xs: readonly number[]) => {
  for (const x of xs) await dispatch(page, { type: 'dial/set', x });
  await guide(page);
};

async function dialUpTo(page: Page, to: number) {
  const from = (await state(page)).dial ?? 0;
  for (let x = from + 1; x <= to; x += 1) await dispatch(page, { type: 'dial/set', x });
}

/** He touches the machine: a tap on the scene's canvas, in its empty top corner. */
async function touch(page: Page) {
  expect((await state(page)).phase).toBe('arrive');
  await page
    .locator('canvas')
    .first()
    .click({ position: { x: 8, y: 8 } });
  await expect.poll(async () => (await state(page)).phase).not.toBe('arrive');
  await guide(page);
}

/** A pin set on the scene, then confirmed with its button. */
async function pin(page: Page, value: unknown) {
  await dispatch(page, { type: 'pin/set', value });
  await guide(page);
  await page.locator('button.pin-confirm').click();
}

/** The restart plays: the restored machine, then the story card and its "next". */
async function finish(page: Page, room: string, shot: (name: string) => Promise<void>) {
  expect((await state(page)).phase).toBe('restart');
  await shot(`${room}-1-restart`);
  await presented(page);
  await expect.poll(async () => (await state(page)).done).toContain(room);
  await expect(page.locator('.story__card')).toBeVisible();
  await shot(`${room}-2-story`);
  await page.locator('.story__next').click();
}

/** The town's corner button opens the district map over it (story 5.0). */
async function openMap(page: Page) {
  await page.getByRole('button', { name: 'Karta četvrti' }).click();
  await expect(page.locator('.town__overlay .map__board')).toBeVisible();
}

/**
 * The next room, from the town he is back in after every story card (story 5.0): he walks
 * to its place in the town, or taps its node on the district map.
 */
async function arrive(page: Page, room: string, via: 'town' | 'map') {
  await expect.poll(async () => (await state(page)).screen).toBe('map');
  await expect(page.locator('.town__board')).toBeVisible();
  // A machine an automaton holds isn't what this walks through: e2e/town.spec.ts is.
  if (['r03', 'r05'].includes(room)) {
    await dispatch(page, { type: 'map/travel', node: room });
  } else if (via === 'town') {
    await page.locator(`.town__place[data-node="${room}"]`).click();
  } else {
    if ((await page.locator('.town__overlay').count()) === 0) await openMap(page);
    // The map takes him to the street; he walks to the machine.
    await page.locator(`button.map__node[data-node="${room}"]`).click();
    await page.locator(`.town__place[data-node="${room}"]`).click();
  }
  await expect.poll(async () => (await state(page)).room, { timeout: 10_000 }).toBe(room);
  await expect.poll(async () => (await state(page)).screen).toBe('room');
  await touch(page);
}

test('rooms 1–7 back to back from a fresh start', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text());
  });
  // Any failed request but the browser's favicon (index.html names none).
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

  // Story 5.0: the opening first (one panel tapped on, then skipped), then the naming.
  expect((await state(page)).screen).toBe('opening');
  expect((await state(page)).room).toBeNull();
  await page.locator('.opening__panel').click();
  await shot('opening');
  await page.getByRole('button', { name: 'Preskoči' }).click();
  await expect(page.locator('.naming__form')).toBeVisible();
  await page.locator('.naming__input').fill('Ivo');
  await page.locator('.naming__look').nth(2).click();
  await shot('naming');
  await page.locator('.naming__form button[type="submit"]').click();
  await expect(page.locator('.naming__reply')).toContainText('Ivo');
  await page.locator('.naming__reply .naming__button').click();

  // Room 1, the door lift, through the town's gate: 5 on the dial, both blanks.
  await arrive(page, 'r01', 'town');
  await dial(page, [1, 2, 3, 4, 5]);
  await write(page, '5');
  await write(page, '5');
  await presented(page);
  await finish(page, 'r01', shot);

  // Room 2, the street lamps: 3x = 12, then x : 3 = 5 on a dial in 3s. Stuck at first, he
  // asks for a hint twice (story 2.7): the step's tag, then the exact next move.
  await arrive(page, 'r02', 'town');
  await page.locator('button.hint').click();
  expect((await state(page)).hint).toBe(1);
  await page.locator('button.hint').click();
  expect((await state(page)).hint).toBe(2);
  await expect(page.locator('button.hint')).toHaveAttribute('data-shown', 'true');
  await shot('r02-0-hint');
  await dial(page, [4]);
  await write(page, '4');
  await write(page, '4');
  await presented(page);
  await touch(page);
  await dial(page, [3, 6, 9, 12, 15]);
  await write(page, '15');
  await write(page, '15');
  await presented(page);
  await finish(page, 'r02', shot);

  // Room 3, the sluice gate: the pin where it levels (the dial keeps turning while it
  // waits), then the direction pin.
  await arrive(page, 'r03', 'map');
  await dial(page, [7, 8, 9]);
  await dispatch(page, { type: 'pin/set', value: { kind: 'x', x: 14 } });
  await dial(page, [8, 9]);
  await guide(page);
  await page.locator('button.pin-confirm').click();
  await write(page, '14');
  await write(page, '14');
  await presented(page);
  await touch(page);
  await pin(page, { kind: 'choice', index: 1 });
  await dial(page, [5, 10, 14]);
  await write(page, '14');
  await write(page, '14');
  await presented(page);
  await finish(page, 'r03', shot);

  // The tablet is closed and opened again (story 2.1): his rooms and his name are kept, and
  // he is back in the town, where he left off.
  await page.reload();
  await hook(page);
  expect((await state(page)).done).toEqual(['r01', 'r02', 'r03']);
  expect((await state(page)).name).toBe('Ivo');
  expect((await state(page)).screen).toBe('map');

  // Room 4, the water wheel: x = 9 refused until simplified, then Balance.
  await arrive(page, 'r04', 'map');
  await dialUpTo(page, 9);
  await write(page, '9');
  expect((await state(page)).refused).toBe(1);
  expect((await state(page)).phase).not.toBe('locked');
  await deleteKeys(page, 3);
  for (let i = 0; i < 4; i += 1) await dispatch(page, { type: 'tray/step', kind: 'float', by: 1 });
  await dispatch(page, { type: 'tray/drop', kind: 'float' });
  await dispatch(page, { type: 'splitter/split' });
  await write(page, '9');
  await write(page, '9');
  await presented(page);
  await finish(page, 'r04', shot);

  // Back in the town, he opens the district map (story 2.2) to see the gates (story 2.3):
  // Balance, from room 3, opened the bridge; the old logbook waits for the bridge and the
  // weighing yard; the tram waits for the gear chain. He travels to the bridge from there.
  await expect.poll(async () => (await state(page)).screen).toBe('map');
  expect((await state(page)).room).toBeNull();
  await openMap(page);
  const node = (id: string) => page.locator(`button.map__node[data-node="${id}"]`);
  await expect(node('r04')).toHaveAttribute('data-state', 'restored');
  await expect(node('r05')).toHaveAttribute('data-state', 'open');
  await expect(node('r08')).not.toHaveAttribute('data-state', /^(open|restored)$/);
  await expect(node('r08')).toBeDisabled();
  await shot('map-mid');

  // Room 5, the bridge: the pin at 6, then the change and the pin at 7.
  await arrive(page, 'r05', 'map');
  await dial(page, [1, 2, 3]);
  await pin(page, { kind: 'x', x: 6 });
  await write(page, '6');
  await write(page, '6');
  await presented(page);
  await touch(page);
  await pin(page, { kind: 'x', x: 7 });
  await write(page, '7');
  await write(page, '7');
  await presented(page);
  await finish(page, 'r05', shot);

  // Room 6, the weighing yard: the readouts hidden, the pin at 29.
  await arrive(page, 'r06', 'map');
  await pin(page, { kind: 'x', x: 29 });
  await write(page, '29');
  await write(page, '29');
  await presented(page);
  await finish(page, 'r06', shot);

  // Room 7, the old logbook: the logbook's lines tapped onto the scale, the wrong one flagged
  // and confirmed in the notebook, then the rewrite.
  await arrive(page, 'r07', 'map');
  await dial(page, [2, 3, 4, 5, 6]);
  const logbook = page.locator('li.line--logbook');
  await logbook.nth(0).locator('button.line__tap').click();
  await expect(logbook.nth(0)).toHaveAttribute('data-shown', 'true');
  await logbook.nth(1).locator('button.line__tap').click();
  await expect(logbook.nth(1)).toHaveAttribute('data-shown', 'true');
  await guide(page);
  await logbook.nth(1).locator('button.line__flag').click();
  await page.locator('button.line__confirm').click();
  await write(page, '6');
  await write(page, '6');
  await presented(page);
  await finish(page, 'r07', shot);

  // Story 4.9: room 8, the tram, is open next (rooms 8–13 are e2e/rooms-8-13.spec.ts); he
  // is back in the town, never carried into it (story 5.0).
  await expect.poll(async () => (await state(page)).screen).toBe('map');
  expect((await state(page)).room).toBeNull();
  await openMap(page);
  await expect(node('r07')).toHaveAttribute('data-state', 'restored');
  await expect(node('r08')).toHaveAttribute('data-state', 'open');
  await shot('r08-next');
  expect((await state(page)).done).toEqual(['r01', 'r02', 'r03', 'r04', 'r05', 'r06', 'r07']);
  expect(errors).toEqual([]);
});
