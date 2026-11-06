// Shows a backdrop under the live scene (art bible, "The template backdrop"; story 2.12): it
// opens room 1 on a running dev server, turns the dial to each end, and multiplies the
// backdrop under a screenshot of the scene's canvas, so the pans, pieces and tags can be
// checked against the wall. A mock only: the game doesn't draw backdrops yet (epic 6).
//
//   node art-src/tools/scene-mock.mjs <dev-server-url> <backdrop> <out-dir> [<width> <height>]
//
// It writes <name>.mock-x1.webp and <name>.mock-x10.webp into the out-dir, at 1280 × 800 by
// default. Pass the backdrop's grey preview (grey-preview.mjs) to see it as it first shows.

import { mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

async function main() {
  const [url, backdrop, outDir, width = '1280', height = '800'] = process.argv.slice(2);
  if (!url || !backdrop || !outDir) {
    throw new Error('usage: scene-mock.mjs <dev-server-url> <backdrop> <out-dir> [<width> <height>]');
  }
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
    await page.goto(url);
    await page.waitForFunction(() => !document.querySelector('.boot'), null, { timeout: 20_000 });
    await page.evaluate(async () => {
      const loaded = performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .find((name) => new URL(name).pathname === '/src/store/store.ts');
      const m = await import(loaded ?? '/src/store/store.ts');
      window.__d = (action) => m.gameStore.getState().dispatch(action);
    });
    await page.evaluate(() => window.__d({ type: 'room/enter', roomId: 'r01' }));
    await page.evaluate(() => window.__d({ type: 'machine/touch' }));
    const name = basename(backdrop).replace(/(\.grey)?\.[^.]+$/, '');
    for (const x of [1, 10]) {
      await page.evaluate((x) => window.__d({ type: 'dial/set', x }), x);
      await page.waitForTimeout(1500);
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (!box) throw new Error('no scene canvas on the page');
      const shot = await canvas.screenshot();
      const cw = Math.round(box.width);
      const ch = Math.round(box.height);
      // The scene's fit (src/ui/scene/fit-scene.ts): 1600 × 1000, scaled to fit and centred.
      const scale = Math.min(cw / 1600, ch / 1000);
      const sw = Math.round(1600 * scale);
      const sh = Math.round(1000 * scale);
      const under = await sharp(backdrop).resize(sw, sh, { fit: 'fill' }).png().toBuffer();
      const base = await sharp(shot).resize(cw, ch, { fit: 'fill' }).png().toBuffer();
      const out = join(outDir, `${name}.mock-x${x}.webp`);
      await sharp(base)
        .composite([{ input: under, left: Math.round((cw - sw) / 2), top: Math.round((ch - sh) / 2), blend: 'multiply' }])
        .webp({ quality: 76 })
        .toFile(out);
      console.log(`wrote ${out}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(`failed: ${err.message}`);
  process.exit(1);
});
