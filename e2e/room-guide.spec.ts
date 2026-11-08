// Story 6.1: the rooms teach themselves. The first time a room needs a tool, Nikola's card
// says what it does, a step at a time, with the control ringed and the rest dimmed. In a
// real browser, at the tablet's 1280 × 800 and the phone's 640 × 360:
// - room 1's guide shows once: read through (its "Dalje" tapped for real, its slider step
//   moved on by the slider), it is saved, and back in the room, or after a reload, it is gone;
// - every room's guide, step by step, from a save that has met the guides before it: each
//   step is screenshotted into the test's output folder, and its card never covers what it
//   rings.
//
//   npm run e2e                                       (starts its own server on 5291)
//   E2E_URL=http://localhost:5290/ npm run e2e        (uses a server already running)

import { expect, type Page, test } from '@playwright/test';
import { hr } from '../src/content/text/hr';

interface GameState {
  ui: { screen: string };
  room: { spec: { id: string }; stageIndex: number; stage: { phase: string } } | null;
  save: { progress: { firstUse: string[]; roomsDone: string[] } };
}

type Game = { __s: { getState(): GameState }; __d(action: unknown): void };

/** Every topic (src/room/types.ts, `guideTopicIds`). */
const topics = [
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
  'range',
  'linked',
  'linked-fed',
  'drum',
];

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
      phase: s.room?.stage.phase ?? null,
      firstUse: s.save.progress.firstUse,
    };
  });

/** A game on the town, named, with the tools and the first uses given. */
async function startOnTheMap(page: Page, tools: string[], firstUse: string[]) {
  await page.evaluate(
    async ({ tools, firstUse }) => {
      const persist: string = '/src/store/persist.ts';
      const loaded = performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .find((name) => new URL(name).pathname === persist);
      const p = await import(/* @vite-ignore */ loaded ?? persist);
      const s = p.newSave('2026-11-07T08:00:00.000Z');
      (window as unknown as Game).__d({
        type: 'boot/start',
        save: {
          ...s,
          character: { name: 'Ivo', look: 'look-1' },
          progress: { ...s.progress, tools, onMap: true, introSeen: true, firstUse },
        },
        room: null,
        fight: null,
      });
    },
    { tools, firstUse },
  );
  await expect.poll(async () => (await state(page)).screen).toBe('map');
}

/** He touches the machine: a tap on the canvas's empty top corner. */
async function touch(page: Page) {
  // A machine starts by itself a moment after he arrives.
  await expect.poll(async () => (await state(page)).phase).not.toBe('arrive');
}

const card = (page: Page) => page.locator('.room-guide__card');
const stepNow = (page: Page) =>
  page.evaluate(() => document.querySelector('.room-guide')?.getAttribute('data-step') ?? null);

/** The card's box and every ring's, once the card stands somewhere. */
async function layout(page: Page) {
  await expect(card(page)).not.toHaveAttribute('style', /visibility/);
  return page.evaluate(() => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    };
    const cardEl = document.querySelector('.room-guide__card');
    return {
      card: cardEl ? box(cardEl) : null,
      rings: [...document.querySelectorAll('.room-guide__ring')].map(box),
    };
  });
}

type Box = { left: number; top: number; right: number; bottom: number };
const overlapArea = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

test('room 1’s guide shows once', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto('/');
  await hook(page);
  await startOnTheMap(page, [], []);
  await dispatch(page, { type: 'map/travel', node: 'r01' });
  await expect.poll(async () => (await state(page)).screen).toBe('room');

  // The slider first: ringed, and the card waits for it to move ("Probaj!", no button).
  await expect(card(page)).toContainText(hr.roomGuide.steps.dial);
  await expect(card(page)).toContainText(hr.story.speakers.nikola);
  await expect(page.locator('.room-guide__next')).toHaveCount(0);
  await expect(page.locator('.room-guide__ring')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('r01-guide-dial.png') });
  await touch(page);
  await dispatch(page, { type: 'dial/set', x: 1 });
  await expect(card(page)).toContainText(hr.roomGuide.steps['dial-x']);
  for (const next of ['readouts', 'level', 'hint'] as const) {
    await page.locator('.room-guide__next').click();
    await expect(card(page)).toContainText(hr.roomGuide.steps[next]);
  }
  await expect(page.locator('.room-guide__next')).toHaveText(hr.roomGuide.last);
  await page.locator('.room-guide__next').click();
  await expect(card(page)).toHaveCount(0);
  expect((await state(page)).firstUse).toContain('guide-dial');

  // He leaves for the town and comes back: the slider's guide is not there again.
  await page.locator('button.map-button').click();
  await expect.poll(async () => (await state(page)).screen).toBe('map');
  await dispatch(page, { type: 'map/travel', node: 'r01' });
  await expect.poll(async () => (await state(page)).screen).toBe('room');
  await page.waitForTimeout(600);
  await expect(card(page)).toHaveCount(0);

  // Nor after the tablet is closed and opened again: it was saved.
  await page.reload();
  await hook(page);
  expect((await state(page)).firstUse).toContain('guide-dial');
  if ((await state(page)).screen !== 'room') {
    await dispatch(page, { type: 'map/travel', node: 'r01' });
    await expect.poll(async () => (await state(page)).screen).toBe('room');
  }
  await page.waitForTimeout(600);
  await expect(card(page)).toHaveCount(0);
  expect(errors).toEqual([]);
});

/** A move a step waits for, as the scene or the notebook would send it. */
type Move = (page: Page) => Promise<void>;

interface Scenario {
  name: string;
  room: string;
  stage?: number;
  topics: string[];
  tools: string[];
  /** Before the guide: the first touch, and what opens the stage. */
  setup?: Move;
  /** By step id: the move that takes a waiting step on. */
  moves: Record<string, Move>;
  /** When no guide shows: what he does next, one at a time, until a guide shows again. */
  next?: Move[];
}

const key = (page: Page, name: string) => page.locator(`.pad__key[data-key="${name}"]`);
async function type(page: Page, line: string) {
  for (const char of line) await key(page, char).click();
  await key(page, 'enter').click();
}
const confirmPin = (page: Page) => page.locator('button.pin-confirm').click();
const allTools = ['balance', 'workshop', 'chain', 'drum'];

const scenarios: Scenario[] = [
  {
    name: 'r01',
    room: 'r01',
    topics: ['dial', 'notebook', 'check'],
    tools: [],
    moves: {
      dial: (page) => dispatch(page, { type: 'dial/set', x: 1 }),
      enter: (page) => type(page, '5'),
    },
    next: [2, 3, 4, 5].map((x) => (page: Page) => dispatch(page, { type: 'dial/set', x })),
  },
  {
    name: 'r03',
    room: 'r03',
    topics: ['pin'],
    tools: [],
    setup: touch,
    moves: {
      'pin-drag': (page) => dispatch(page, { type: 'pin/set', value: { kind: 'x', x: 12 } }),
      'pin-confirm': confirmPin,
    },
  },
  {
    name: 'r03-2',
    room: 'r03',
    stage: 1,
    topics: ['tilt'],
    tools: [],
    setup: touch,
    moves: {
      'tilt-drag': (page) =>
        dispatch(page, { type: 'pin/set', value: { kind: 'choice', index: 1 } }),
      'pin-confirm': confirmPin,
    },
  },
  {
    name: 'r04',
    room: 'r04',
    topics: ['tray', 'splitter'],
    tools: ['balance'],
    setup: touch,
    moves: {
      'tray-drop': async (page) => {
        for (let i = 0; i < 4; i += 1) {
          await dispatch(page, { type: 'tray/step', kind: 'float', by: 1 });
        }
        await dispatch(page, { type: 'tray/drop', kind: 'float' });
      },
      split: (page) => dispatch(page, { type: 'splitter/split' }),
    },
  },
  {
    name: 'r07',
    room: 'r07',
    topics: ['logbook'],
    tools: ['balance', 'workshop'],
    setup: touch,
    moves: {
      'logbook-tap': (page) =>
        page.locator('li.line--logbook').nth(0).locator('button.line__tap').click(),
      'logbook-flag': async (page) => {
        await page.locator('li.line--logbook').nth(1).locator('button.line__flag').click();
        await page.locator('button.line__confirm').click();
      },
    },
  },
  {
    name: 'r08',
    room: 'r08',
    topics: ['chain'],
    tools: allTools,
    setup: touch,
    moves: {
      // A real tap: `− 9`, the second of the two buttons.
      'chain-run': (page) => page.locator('button.chain-pick__op').nth(1).click(),
    },
  },
  {
    name: 'r09',
    room: 'r09',
    topics: ['gear'],
    tools: allTools,
    setup: touch,
    moves: {
      'gear-why': async (page) => {
        for (let i = 0; i < 4; i += 1) {
          await dispatch(page, { type: 'tray/step', kind: 'gear', by: 1 });
        }
        await dispatch(page, { type: 'tray/drop', kind: 'gear' });
      },
    },
  },
  {
    name: 'r10',
    room: 'r10',
    topics: ['story'],
    tools: allTools,
    setup: touch,
    moves: { 'story-write': (page) => type(page, '60+3x=90') },
  },
  {
    name: 'r10-2',
    room: 'r10',
    stage: 1,
    topics: ['story-choice'],
    tools: allTools,
    setup: touch,
    moves: {
      'story-flag': async (page) => {
        await dispatch(page, { type: 'pin/set', value: { kind: 'choice', index: 1 } });
        await dispatch(page, { type: 'pin/confirm' });
      },
    },
  },
  { name: 'r12', room: 'r12', topics: ['linked'], tools: allTools, setup: touch, moves: {} },
  {
    name: 'r12-2',
    room: 'r12',
    stage: 1,
    topics: ['linked-fed'],
    tools: allTools,
    setup: touch,
    moves: {},
  },
  {
    name: 'r13',
    room: 'r13',
    topics: ['drum'],
    tools: allTools,
    setup: touch,
    moves: {
      'drum-try': async (page) => {
        for (const x of [1, 2, 0]) await dispatch(page, { type: 'dial/set', x });
      },
      'drum-pin': async (page) => {
        await dispatch(page, { type: 'pin/set', value: { kind: 'choice', index: 1 } });
        await dispatch(page, { type: 'pin/confirm' });
      },
    },
  },
];

test('every room’s guide, step by step', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto('/');
  await hook(page);
  for (const scenario of scenarios) {
    const met = topics.filter((t) => !scenario.topics.includes(t)).map((t) => `guide-${t}`);
    await startOnTheMap(page, scenario.tools, met);
    await dispatch(page, { type: 'room/enter', roomId: scenario.room, stage: scenario.stage ?? 0 });
    await expect.poll(async () => (await state(page)).screen).toBe('room');
    await page.waitForTimeout(500);
    await scenario.setup?.(page);
    const after = [...(scenario.next ?? [])];
    const seen: string[] = [];
    for (let turn = 0; turn < 40; turn += 1) {
      const step = await stepNow(page);
      if (step === null) {
        const next = after.shift();
        if (!next) break;
        await next(page);
        await page.waitForTimeout(150);
        continue;
      }
      // The rings follow the parts on every frame; let the card settle beside them.
      await page.waitForTimeout(450);
      const { card: box, rings } = await layout(page);
      await page.screenshot({
        path: testInfo.outputPath(
          `${scenario.name}-${String(seen.length).padStart(2, '0')}-${step}.png`,
        ),
      });
      expect(rings.length, `${scenario.name} ${step}: rings`).toBeGreaterThan(0);
      if (box) {
        for (const ring of rings) {
          expect(overlapArea(box, ring), `${scenario.name} ${step}: card over its ring`).toBe(0);
        }
      }
      seen.push(step);
      const next = page.locator('.room-guide__next');
      if ((await next.count()) > 0) {
        await next.click();
      } else {
        const move = scenario.moves[step];
        if (!move) throw new Error(`${scenario.name}: nothing moves ${step} on`);
        await move(page);
      }
      await expect.poll(() => stepNow(page)).not.toBe(step);
    }
    const firstUse = (await state(page)).firstUse;
    for (const topic of scenario.topics) {
      expect(firstUse, `${scenario.name}: ${topic} met`).toContain(`guide-${topic}`);
    }
    expect(seen.length, scenario.name).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
});
