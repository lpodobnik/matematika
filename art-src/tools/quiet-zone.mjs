// Checks that a backdrop or housing leaves the scene's quiet zones empty, and writes an
// overlay PNG that shows the zones and every busy cell (art bible, "Review every image").
// The zones come from src/art/scene-zones.ts, which follows the scale's layout in code.
//
//   node art-src/tools/quiet-zone.mjs <backdrop|housing> <out-dir> <image> [<image> ...]
//
// An image is scaled to the 1600 × 1000 scene and cut into 40 × 40 cells. A pixel counts as
// ink when its luminance is under 0.45 (the ink and the darkest washes; the stone, plaster
// and paper washes are lighter). A cell is busy when more than BUSY_CELL of it is ink. A
// zone fails when more than BUSY_SHARE of its cells are busy or more than INK_SHARE of its
// pixels are ink. Calibrated on t01: its plain wall has 1 % ink and no cell above 7 %, while
// its door and chains have 24 % and cells above 50 %. The check finds objects, not style:
// look at the overlay as well. Exit code 1 when any image fails.

import { mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import sharp from 'sharp';
import { sceneZones } from '../../src/art/scene-zones.ts';

const WIDTH = 1600;
const HEIGHT = 1000;
const CELL = 40;
const INK_LUMINANCE = 0.45;

/** Per kind: the zones that must stay empty, and how strict each one is. */
export const CHECKS = {
  backdrop: [
    { name: 'pan zone, left', zone: sceneZones.panLeft, busyCell: 0.15, busyShare: 0.02, inkShare: 0.03 },
    { name: 'pan zone, right', zone: sceneZones.panRight, busyCell: 0.15, busyShare: 0.02, inkShare: 0.03 },
    { name: 'opening', zone: sceneZones.opening, busyCell: 0.15, busyShare: 0.02, inkShare: 0.03 },
    // Paving has joints everywhere, so the ground only fails on objects and dense cobbles.
    { name: 'dial ground', zone: sceneZones.dial, busyCell: 0.3, busyShare: 0.05, inkShare: 0.12 },
  ],
  housing: [
    { name: 'pan zone, left', zone: sceneZones.panLeft, busyCell: 0.05, busyShare: 0.01, inkShare: 0.01 },
    { name: 'pan zone, right', zone: sceneZones.panRight, busyCell: 0.05, busyShare: 0.01, inkShare: 0.01 },
    { name: 'opening', zone: sceneZones.opening, busyCell: 0.05, busyShare: 0.01, inkShare: 0.01 },
    { name: 'dial ground', zone: sceneZones.dial, busyCell: 0.05, busyShare: 0.01, inkShare: 0.01 },
  ],
};

/**
 * Measures one zone of an RGB image of WIDTH × HEIGHT. Returns the share of ink pixels, the
 * busy cells (as rectangles) and the number of cells.
 */
export function measureZone(rgb, zone, busyCell) {
  let ink = 0;
  let pixels = 0;
  let cells = 0;
  const busy = [];
  for (let cy = zone.y0; cy < zone.y1; cy += CELL) {
    for (let cx = zone.x0; cx < zone.x1; cx += CELL) {
      const x1 = Math.min(cx + CELL, zone.x1);
      const y1 = Math.min(cy + CELL, zone.y1);
      let cellInk = 0;
      for (let y = cy; y < y1; y += 1) {
        for (let x = cx; x < x1; x += 1) {
          const i = (y * WIDTH + x) * 3;
          const luminance = (0.2126 * rgb[i] + 0.7152 * rgb[i + 1] + 0.0722 * rgb[i + 2]) / 255;
          if (luminance < INK_LUMINANCE) cellInk += 1;
        }
      }
      const size = (x1 - cx) * (y1 - cy);
      ink += cellInk;
      pixels += size;
      cells += 1;
      if (cellInk / size > busyCell) busy.push({ x0: cx, y0: cy, x1, y1 });
    }
  }
  return { inkShare: ink / pixels, busy, cells };
}

function rectSvg({ x0, y0, x1, y1 }, attrs) {
  return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" ${attrs}/>`;
}

async function checkImage(kind, outDir, path) {
  const { data } = await sharp(path)
    .resize(WIDTH, HEIGHT, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let failed = false;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">`;
  const lines = [];
  for (const check of CHECKS[kind]) {
    const m = measureZone(data, check.zone, check.busyCell);
    const busyShare = m.busy.length / m.cells;
    const ok = busyShare <= check.busyShare && m.inkShare <= check.inkShare;
    if (!ok) failed = true;
    lines.push(
      `  ${ok ? 'ok  ' : 'FAIL'} ${check.name}: ink ${(m.inkShare * 100).toFixed(1)} % (max ${check.inkShare * 100}), busy cells ${m.busy.length}/${m.cells} (max ${Math.floor(check.busyShare * m.cells)})`,
    );
    for (const cell of m.busy) svg += rectSvg(cell, 'fill="#ff0000" fill-opacity="0.35"');
    svg += rectSvg(check.zone, `fill="none" stroke="${ok ? '#0060ff' : '#ff0000'}" stroke-width="5"`);
  }
  svg += '</svg>';
  const base = await sharp(data, { raw: { width: WIDTH, height: HEIGHT, channels: 3 } })
    .png()
    .toBuffer();
  const out = join(outDir, basename(path).replace(/\.[^.]+$/, '.zones.png'));
  await sharp(base).composite([{ input: Buffer.from(svg) }]).png().toFile(out);
  console.log(`${failed ? 'FAIL' : 'ok  '} ${basename(path)} (${kind}); overlay ${out}`);
  for (const line of lines) console.log(line);
  return !failed;
}

async function main() {
  const [kind, outDir, ...images] = process.argv.slice(2);
  if (!CHECKS[kind] || !outDir || images.length === 0) {
    throw new Error('usage: quiet-zone.mjs <backdrop|housing> <out-dir> <image> [<image> ...]');
  }
  mkdirSync(outDir, { recursive: true });
  let allOk = true;
  for (const image of images) {
    if (!(await checkImage(kind, outDir, image))) allOk = false;
  }
  if (!allOk) process.exitCode = 1;
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(`failed: ${err.message}`);
    process.exit(1);
  });
}
