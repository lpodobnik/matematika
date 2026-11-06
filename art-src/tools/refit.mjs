// Refits a backdrop to the scene zones by resizing bands of it (art bible, "The template
// backdrop"; story 2.12). Words place a backdrop's wall top and ground line only roughly, so
// a generated image is fixed here instead of being regenerated: each band between two source
// edges is resized to lie between the matching target edges. Every edge list starts at 0 and
// ends at the image's size, in scene units of the 1600 × 1000 scene.
//
//   node art-src/tools/refit.mjs <in> <out> --y 0,200,730,1000:0,200,800,1000 [--x ...]
//
// The output is a 1600 × 1000 WebP at the quality of the test images. Record every refit in
// art-src/CREDITS.md with its bands, then run quiet-zone.mjs on the result.

import sharp from 'sharp';

export const WIDTH = 1600;
export const HEIGHT = 1000;

/**
 * The bands of one axis, from `source:target` edge lists such as "0,200,730,1000:0,200,800,1000".
 * Throws when the lists differ in length, don't run from 0 to `size`, or don't strictly increase.
 */
export function bandsOf(spec, size) {
  const lists = spec.split(':');
  const [source, target] = lists.map((list) => list.split(',').map(Number));
  if (
    lists.length !== 2 ||
    !source ||
    !target ||
    source.length !== target.length ||
    source.length < 2
  ) {
    throw new Error(`bands "${spec}": give two edge lists of the same length, source:target`);
  }
  for (const edges of [source, target]) {
    if (edges.some((edge) => !Number.isInteger(edge))) {
      throw new Error(`bands "${spec}": edges must be whole numbers`);
    }
    if (edges[0] !== 0 || edges.at(-1) !== size) {
      throw new Error(`bands "${spec}": edges must run from 0 to ${size}`);
    }
    if (edges.some((edge, i) => i > 0 && edge <= edges[i - 1])) {
      throw new Error(`bands "${spec}": edges must increase`);
    }
  }
  return source.slice(1).map((end, i) => ({
    from: source[i],
    to: end,
    at: target[i],
    size: target[i + 1] - target[i],
  }));
}

/** Where a source coordinate lands after the refit (for checks and the CREDITS note). */
export function refitted(bands, value) {
  const band = bands.find((b) => value >= b.from && value <= b.to);
  if (!band) throw new Error(`${value} is outside the image`);
  return band.at + ((value - band.from) / (band.to - band.from)) * band.size;
}

/** Refits an image (any format sharp reads) to 1600 × 1000; returns a PNG buffer. */
export async function refitImage(input, { y, x } = {}) {
  let image = await sharp(input)
    .resize(WIDTH, HEIGHT, { fit: 'fill' })
    .removeAlpha()
    .png()
    .toBuffer();
  if (y) image = await refitAxis(image, bandsOf(y, HEIGHT), 'y');
  if (x) image = await refitAxis(image, bandsOf(x, WIDTH), 'x');
  return image;
}

async function refitAxis(image, bands, axis) {
  const parts = [];
  for (const band of bands) {
    const region =
      axis === 'y'
        ? { left: 0, top: band.from, width: WIDTH, height: band.to - band.from }
        : { left: band.from, top: 0, width: band.to - band.from, height: HEIGHT };
    const size =
      axis === 'y' ? { width: WIDTH, height: band.size } : { width: band.size, height: HEIGHT };
    const input = await sharp(image)
      .extract(region)
      .resize({ ...size, fit: 'fill', kernel: 'lanczos3' })
      .png()
      .toBuffer();
    parts.push({ input, left: axis === 'y' ? 0 : band.at, top: axis === 'y' ? band.at : 0 });
  }
  return sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#f4efe3' } })
    .composite(parts)
    .png()
    .toBuffer();
}

async function main() {
  const usage = 'usage: refit.mjs <in> <out.webp> --y <source:target> [--x <source:target>]';
  const [input, output, ...rest] = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < rest.length; i += 2) {
    const flag = rest[i];
    if ((flag !== '--y' && flag !== '--x') || rest[i + 1] === undefined) throw new Error(usage);
    options[flag.slice(2)] = rest[i + 1];
  }
  if (!input || !output?.endsWith('.webp') || (!options.y && !options.x)) throw new Error(usage);
  const image = await refitImage(input, options);
  await sharp(image).webp({ quality: 76 }).toFile(output);
  console.log(`wrote ${output}`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(`failed: ${err.message}`);
    process.exit(1);
  });
}
