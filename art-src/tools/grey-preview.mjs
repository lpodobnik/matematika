// A preview of an image in the grey state (art bible, "Restored colour against the grey
// state"): each pixel's luminance mapped onto the ink → paper ramp, as the game's shader will
// do at amount 1. Review every image with it: forms must still read by value alone.
//
//   node art-src/tools/grey-preview.mjs <out-dir> <image> [<image> ...]
//
// It writes <name>.grey.png into the out-dir.

import { mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import sharp from 'sharp';
import { palette } from '../../src/art/palette.ts';

const rgbOf = (value) => [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
const INK = rgbOf(palette.ink);
const PAPER = rgbOf(palette.paper);
const PAPER_HEX = `#${palette.paper.toString(16).padStart(6, '0')}`;

/** One pixel in the grey state: its luminance on the ink → paper ramp. */
export function greyPixel(r, g, b) {
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return INK.map((ink, c) => Math.round(ink + (PAPER[c] - ink) * l));
}

async function preview(outDir, path) {
  // A cut-out's transparent pixels are shown on paper; a one-channel image becomes RGB.
  const { data, info } = await sharp(path)
    .flatten({ background: PAPER_HEX })
    .toColourspace('srgb')
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    const [r, g, b] = greyPixel(data[i], data[i + 1], data[i + 2]);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  const out = join(outDir, basename(path).replace(/\.[^.]+$/, '.grey.png'));
  await sharp(data, { raw: info }).png().toFile(out);
  console.log(`wrote ${out}`);
}

async function main() {
  const [outDir, ...images] = process.argv.slice(2);
  if (!outDir || images.length === 0) {
    throw new Error('usage: grey-preview.mjs <out-dir> <image> [<image> ...]');
  }
  mkdirSync(outDir, { recursive: true });
  for (const image of images) await preview(outDir, image);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(`failed: ${err.message}`);
    process.exit(1);
  });
}
