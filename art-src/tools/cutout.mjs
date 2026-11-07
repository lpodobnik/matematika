// Cuts a figure out of its flat background (story 5.0): every pixel joined to the image's
// border through pixels close to the border's colour becomes transparent, with a soft
// one-pixel edge, and the result is trimmed to the figure and saved as WebP with alpha.
//
//   node art-src/tools/cutout.mjs <in> <out.webp> [height] [tolerance]
//
// `height` scales the figure to that many pixels tall (default: as it is); `tolerance` is the
// largest colour distance from the background that still counts as background (default 34).
// Only flood fill from the border, so cream inside the figure (a shirt, a highlight) stays.

import sharp from 'sharp';

const [input, output, heightArg, tolArg] = process.argv.slice(2);
if (!input || !output) throw new Error('usage: cutout.mjs <in> <out.webp> [height] [tolerance]');
const tolerance = Number(tolArg ?? 34);

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const at = (x, y) => (y * w + x) * 4;

// The background colour: the median of the border pixels.
const border = [];
for (let x = 0; x < w; x += 4) border.push(at(x, 0), at(x, h - 1));
for (let y = 0; y < h; y += 4) border.push(at(0, y), at(w - 1, y));
const median = (channel) => {
  const values = border.map((i) => data[i + channel]).sort((a, b) => a - b);
  return values[values.length >> 1];
};
const bg = [median(0), median(1), median(2)];
const distance = (i) =>
  Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);

// Flood fill from every border pixel close to the background.
const isBg = new Uint8Array(w * h);
const stack = [];
const push = (x, y) => {
  const p = y * w + x;
  if (isBg[p] || distance(p * 4) > tolerance) return;
  isBg[p] = 1;
  stack.push(p);
};
for (let x = 0; x < w; x += 1) {
  push(x, 0);
  push(x, h - 1);
}
for (let y = 0; y < h; y += 1) {
  push(0, y);
  push(w - 1, y);
}
while (stack.length > 0) {
  const p = stack.pop();
  const x = p % w;
  const y = (p - x) / w;
  if (x > 0) push(x - 1, y);
  if (x < w - 1) push(x + 1, y);
  if (y > 0) push(x, y - 1);
  if (y < h - 1) push(x, y + 1);
}

// Pockets of background the figure encloses (between the legs, inside a bent arm, behind a
// pole) don't touch the border. Any patch of near-background colour at least `pocket`
// pixels big goes too, below the head only (a pale face is close to the paper); a stricter
// tolerance keeps cream cloth and highlights.
const pocketTolerance = tolerance * 0.75;
const pocket = Math.round(w * h * 0.0002);
const seen = new Uint8Array(w * h);
for (let start = Math.floor(h * 0.3) * w; start < w * h; start += 1) {
  if (isBg[start] || seen[start] || distance(start * 4) > pocketTolerance) continue;
  const patch = [start];
  seen[start] = 1;
  for (let k = 0; k < patch.length; k += 1) {
    const p = patch[k];
    const x = p % w;
    const near = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w];
    for (const n of near) {
      if (n < h * 0.3 * w || n >= w * h || seen[n] || isBg[n] || distance(n * 4) > pocketTolerance) {
        continue;
      }
      seen[n] = 1;
      patch.push(n);
    }
  }
  if (patch.length >= pocket) for (const p of patch) isBg[p] = 1;
}

// The ground shadow under the feet is a speckled light wash: in the bottom eighth, any light
// pixel (boots and trousers are dark) grown from what is already background.
const luminance = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
const light = (p) => luminance(p * 4) > 150;
for (let pass = 0; pass < 4; pass += 1) {
  for (let y = Math.floor(h * 0.875); y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const p = y * w + x;
      if (isBg[p] || !light(p)) continue;
      if ((x > 0 && isBg[p - 1]) || (x < w - 1 && isBg[p + 1]) || isBg[p - w] || (y < h - 1 && isBg[p + w])) {
        isBg[p] = 1;
      }
    }
    for (let x = w - 1; x >= 0; x -= 1) {
      const p = y * w + x;
      if (isBg[p] || !light(p)) continue;
      if ((x > 0 && isBg[p - 1]) || (x < w - 1 && isBg[p + 1]) || isBg[p - w] || (y < h - 1 && isBg[p + w])) {
        isBg[p] = 1;
      }
    }
  }
}

// Alpha: 0 on the background, half on a figure pixel touching it (a soft edge), else full.
let minX = w;
let minY = h;
let maxX = 0;
let maxY = 0;
for (let y = 0; y < h; y += 1) {
  for (let x = 0; x < w; x += 1) {
    const p = y * w + x;
    if (isBg[p]) {
      data[p * 4 + 3] = 0;
      continue;
    }
    const edge =
      (x > 0 && isBg[p - 1]) ||
      (x < w - 1 && isBg[p + 1]) ||
      (y > 0 && isBg[p - w]) ||
      (y < h - 1 && isBg[p + w]);
    data[p * 4 + 3] = edge ? 140 : 255;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
}
if (maxX < minX) throw new Error('nothing left after the cut');

let image = sharp(data, { raw: { width: w, height: h, channels: 4 } }).extract({
  left: minX,
  top: minY,
  width: maxX - minX + 1,
  height: maxY - minY + 1,
});
if (heightArg) image = sharp(await image.png().toBuffer()).resize({ height: Number(heightArg) });
const out = await image.webp({ quality: 86, alphaQuality: 90, effort: 6 }).toBuffer({ resolveWithObject: true });
await sharp(out.data).toFile(output);
console.log(`${output}: ${out.info.width}x${out.info.height}, ${Math.round(out.data.length / 1000)} KB, background rgb(${bg.join(', ')})`);
