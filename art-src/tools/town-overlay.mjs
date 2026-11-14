// Draws each street's picture with its ground, holes, doors and ways over it, to check the
// map of a street against its painting. Run from the repo root with the dev server on 5290:
//
//   node art-src/tools/town-overlay.mjs <outDir> u1 u2 ...
import { chromium } from '@playwright/test';

const out = process.argv[2];
const areas = process.argv.slice(3);
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5290/');
await page.waitForTimeout(1500);
for (const id of areas) {
  await page.evaluate(async (areaId) => {
    const find = (p) =>
      performance
        .getEntriesByType('resource')
        .map((e) => e.name)
        .find((n) => new URL(n).pathname === p) ?? p;
    const { town } = await import(find('/src/content/town.ts'));
    const art = await import(find('/src/ui/town/art.ts'));
    const area = town.areas[areaId];
    const src = art.areaArt(areaId, []);
    const poly = (points) => points.map((p) => `${p.x},${p.y}`).join(' ');
    const rect = (r, colour) =>
      `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${colour}" fill-opacity="0.25" stroke="${colour}" stroke-width="3"/>`;
    const dot = (p, colour, label) =>
      `<circle cx="${p.x}" cy="${p.y}" r="12" fill="${colour}"/><text x="${p.x + 14}" y="${p.y + 6}" font-size="26" fill="${colour}" stroke="white" stroke-width="1">${label}</text>`;
    const holes = area.ground.holes ?? [];
    const outline = area.ground.outline ?? area.ground.points ?? area.ground;
    document.body.innerHTML = `<div style="position:relative;width:1600px;height:1000px">
      <img src="${src}" style="position:absolute;inset:0;width:1600px;height:1000px">
      <svg viewBox="0 0 1600 1000" style="position:absolute;inset:0;width:1600px;height:1000px">
        <polygon points="${poly(outline)}" fill="lime" fill-opacity="0.18" stroke="lime" stroke-width="4"/>
        ${holes.map((h) => `<ellipse cx="${h.x}" cy="${h.y}" rx="${h.rx}" ry="${h.ry}" fill="red" fill-opacity="0.3" stroke="red" stroke-width="3"/>`).join('')}
        ${(area.spots ?? []).map((s) => rect(s.area, 'blue') + dot(s.stand, 'blue', s.lead)).join('')}
        ${area.exits.map((e) => rect(e.area, 'orange') + dot(e.stand, 'orange', `to ${e.to}`)).join('')}
        ${dot(area.arrive, 'purple', 'arrive')}
      </svg></div>`;
    document.body.style.margin = '0';
  }, id);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/overlay-${id}.png` });
}
await browser.close();
