// Generates one image with FLUX.2 [max] on fal.ai from a job file, converts it to WebP with
// sharp, and records it in art-src/CREDITS.md (art bible, "Prompt template" and "Image sizes").
//
//   node art-src/tools/fal-generate.mjs <job.json> <originals-dir>
//
// job.json: { name, seed, size: { width, height }, slots: { subject, camera, composition,
//             state, background }, references?: [path, ...], reserve?: true,
//             style?: 'v1' | 'v2' | 'v3' | 'v4' }
//
// A job without `style` gets the newest block (LATEST_STYLE), never an old one, and CREDITS
// records the key that was used.
//
// The key comes only from process.env.FAL_KEY. It is never printed, logged or written.
// The script refuses to run past the cap: 30 images in all, and 24 unless the job says
// reserve: true (6 are kept for review fixes).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import sharp from 'sharp';

const CAP = 30;
const RESERVE = 6;
const MODEL = 'FLUX.2 [max]';
const TEXT_ENDPOINT = 'fal-ai/flux-2-max';
const EDIT_ENDPOINT = 'fal-ai/flux-2-max/edit';
const CREDITS = resolve('art-src/CREDITS.md');
const TESTS = resolve('art-src/tests');
const MAX_SIDE = 1600;
const MAX_BYTES = 300 * 1000;

// The fixed style block. A new version gets a new key; old keys stay so CREDITS rows replay.
export const STYLE = {
  v1: [
    'Hand-drawn illustration like a page from an inventor’s sketchbook that has come to life.',
    'Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours,',
    'thinner interior lines, light parallel hatching for shade, a few faint construction lines.',
    'Loose transparent watercolour washes inside the lines, flat and calm, with the paper showing through.',
    'Warm cream paper ground (#F4EFE3), clean and even, with no stains, tears, border or frame.',
    'Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F),',
    'dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A),',
    'everything else in soft greys of the ink. Brass and copper are the most saturated colours in the picture.',
    'Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting.',
    'Clockwork and steam technology in a timeless Central European town with a Croatian character; no electricity.',
    'Friendly and a little whimsical, like Machinarium, never grim.',
    'The image contains no text, no letters, no numbers, no labels, no signature and no logo; every dial, plate and sign is blank.',
  ].join(' '),
  // v2: t01 signed its corner and had heavy paper speckle, which costs WebP size and
  // fights the paper shader. Same block, with the ground and the corners spelled out.
  v2: [
    'Hand-drawn illustration like a page from an inventor’s sketchbook that has come to life.',
    'Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours,',
    'thinner interior lines, light parallel hatching for shade, a few faint construction lines.',
    'Loose transparent watercolour washes inside the lines, flat and calm, with the paper showing through.',
    'Smooth warm cream paper ground (#F4EFE3), clean and even, with no grain, speckles, stains, tears, border or frame.',
    'Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F),',
    'dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A),',
    'everything else in soft greys of the ink. Brass and copper are the most saturated colours in the picture.',
    'Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting.',
    'Clockwork and steam technology in a timeless Central European town with a Croatian character; no electricity.',
    'Friendly and a little whimsical, like Machinarium, never grim.',
    'The image contains no text, no letters, no numbers, no labels and no logo; every dial, plate and sign is blank.',
    'No artist’s signature, initials or monogram anywhere, and all four corners are empty paper.',
  ].join(' '),
  // v3: v2 still signed t02 and t03 (with digits), drew a border on t05, an antenna on t03,
  // and the references brought rough paper grain. "Sketchbook page" invites signatures and
  // margins, so the block now calls the image game art and names the modern objects to leave out.
  v3: [
    'Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life.',
    'Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours,',
    'thinner interior lines, light parallel hatching for shade, a few faint construction lines.',
    'Loose transparent watercolour washes inside the lines, flat and calm.',
    'Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains,',
    'and no border, frame or margin line.',
    'Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F),',
    'dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A),',
    'everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture.',
    'Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting.',
    'Clockwork and steam technology in a timeless Central European town with a Croatian character, before electricity:',
    'no wires, antennas, light bulbs, cars or other modern objects.',
    'Friendly and a little whimsical, like Machinarium, never grim.',
    'The image contains no text, no letters, no numbers, no labels and no logo; every dial, plate and sign is blank.',
    'No signature, initials, monogram or date anywhere; all four corners are empty.',
  ].join(' '),
  // v4: "clockwork" drew clock faces with numerals on t02 and t08, so the technology line
  // now says gears and steam, and clock faces are named among the things left out.
  v4: [
    'Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life.',
    'Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours,',
    'thinner interior lines, light parallel hatching for shade, a few faint construction lines.',
    'Loose transparent watercolour washes inside the lines, flat and calm.',
    'Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains,',
    'and no border, frame or margin line.',
    'Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F),',
    'dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A),',
    'everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture.',
    'Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting.',
    'Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity:',
    'no wires, antennas, light bulbs, cars or other modern objects.',
    'Friendly and a little whimsical, like Machinarium, never grim.',
    'The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank.',
    'No signature, initials, monogram or date anywhere; all four corners are empty.',
  ].join(' '),
};

const REFERENCE_LINE = {
  1: 'Match the drawing style of image 1 exactly: the same ink line weight, hatching, watercolour washes, paper colour and palette. Do not copy its subject.',
  2: 'Match the drawing style of image 1 exactly: the same ink line weight, hatching, watercolour washes, paper colour and palette. Use image 2 for the design of the subject. Do not copy the subject of image 1.',
};

/** The newest style block: keys are added in order, so it is the last one. */
export const LATEST_STYLE = Object.keys(STYLE).at(-1);

/** The style block a job uses: its own `style`, or the newest when it names none. */
export function styleKey(job) {
  const key = job.style ?? LATEST_STYLE;
  if (!Object.hasOwn(STYLE, key)) throw new Error(`Unknown style block ${key}`);
  return key;
}

export function buildPrompt(job) {
  const s = job.slots;
  const style = STYLE[styleKey(job)];
  const refs = job.references?.length ?? 0;
  const parts = [
    refs ? (s.reference ?? REFERENCE_LINE[Math.min(refs, 2)]) : '',
    s.subject,
    s.camera,
    s.composition,
    s.state,
    style,
    s.background ?? '',
  ];
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function readCount() {
  const text = readFileSync(CREDITS, 'utf8');
  const m = text.match(/images generated: (\d+)\/30/);
  if (!m) throw new Error('CREDITS.md has no "images generated: N/30" line');
  return Number(m[1]);
}

async function toDataUri(path) {
  // References go in at about 1 MP: enough for style, and input megapixels are billed.
  const buf = await sharp(path)
    .resize({ width: 1280, height: 1280, fit: 'inside' })
    .jpeg({ quality: 88 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

function authHeaders() {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY is not set');
  return { Authorization: `Key ${key}`, 'Content-Type': 'application/json' };
}

async function call(endpoint, input) {
  const submit = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!submit.ok) throw new Error(`submit ${submit.status}: ${(await submit.text()).slice(0, 500)}`);
  const { status_url: statusUrl, response_url: responseUrl } = await submit.json();
  const started = Date.now();
  for (;;) {
    await new Promise((r) => setTimeout(r, 2500));
    const st = await fetch(statusUrl, { headers: authHeaders() });
    if (!st.ok) throw new Error(`status ${st.status}: ${(await st.text()).slice(0, 500)}`);
    const body = await st.json();
    if (body.status === 'COMPLETED') break;
    if (Date.now() - started > 10 * 60 * 1000) throw new Error('timed out after 10 minutes');
  }
  const res = await fetch(responseUrl, { headers: authHeaders() });
  if (!res.ok) throw new Error(`result ${res.status}: ${(await res.text()).slice(0, 500)}`);
  return res.json();
}

async function toWebp(input) {
  const meta = await sharp(input).metadata();
  let side = Math.min(MAX_SIDE, Math.max(meta.width, meta.height));
  for (;;) {
    for (let quality = 82; quality >= 46; quality -= 6) {
      const out = await sharp(input)
        .resize({ width: side, height: side, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer({ resolveWithObject: true });
      if (out.data.length <= MAX_BYTES) return { ...out, quality };
    }
    side = Math.round(side * 0.9);
  }
}

async function main() {
  const [jobPath, originalsDir] = process.argv.slice(2);
  if (!jobPath || !originalsDir) throw new Error('usage: fal-generate.mjs <job.json> <originals-dir>');
  const job = JSON.parse(readFileSync(jobPath, 'utf8'));
  const count = readCount();
  if (count >= CAP) throw new Error(`cap reached: ${count}/${CAP}`);
  if (count >= CAP - RESERVE && !job.reserve) {
    throw new Error(`${count}/${CAP} used; the last ${RESERVE} are reserved (set reserve: true)`);
  }
  const n = count + 1;
  const nn = String(n).padStart(2, '0');
  const prompt = buildPrompt(job);
  const refs = job.references ?? [];
  const endpoint = refs.length ? EDIT_ENDPOINT : TEXT_ENDPOINT;
  const input = {
    prompt,
    seed: job.seed,
    image_size: job.size,
    output_format: 'png',
    safety_tolerance: '2',
  };
  if (refs.length) input.image_urls = await Promise.all(refs.map(toDataUri));

  console.log(`#${nn} ${job.name}: ${endpoint}, seed ${job.seed}, ${job.size.width}x${job.size.height}, refs ${refs.length}`);
  const result = await call(endpoint, input);
  // Count the image as soon as fal returns it, so a later failure can't hide it from the cap.
  writeFileSync(
    CREDITS,
    readFileSync(CREDITS, 'utf8').replace(/images generated: \d+\/30/, `images generated: ${n}/30`),
  );
  const image = result.images?.[0];
  if (!image?.url) throw new Error(`no image in result: ${JSON.stringify(result).slice(0, 300)}`);
  const download = await fetch(image.url);
  if (!download.ok) throw new Error(
      `image download ${download.status} from ${image.url} (the image is counted; fetch it by hand)`,
    );
  const png = Buffer.from(await download.arrayBuffer());

  mkdirSync(originalsDir, { recursive: true });
  const original = join(originalsDir, `${job.name}.t${nn}.png`);
  writeFileSync(original, png);
  const webp = await toWebp(png);
  const file = `${job.name}.t${nn}.webp`;
  writeFileSync(join(TESTS, file), webp.data);

  const date = new Date().toISOString().slice(0, 10);
  const refNames = refs.map((r) => `\`${basename(r)}\``).join(', ') || 'none';
  const entry = [
    '',
    `### ${nn}. \`tests/${file}\``,
    '',
    `- Model: ${MODEL}, fal.ai endpoint \`${endpoint}\``,
    `- Seed: ${result.seed ?? job.seed}`,
    `- Generated at ${job.size.width} × ${job.size.height} PNG; saved as WebP ${webp.info.width} × ${webp.info.height}, quality ${webp.quality}, ${Math.round(webp.data.length / 1000)} KB`,
    `- References: ${refNames}`,
    `- Style block: ${styleKey(job)}`,
    `- Date: ${date}`,
    '- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs',
    `- Notes: ${job.notes ?? ''}`,
    '- Prompt:',
    '',
    '  ```text',
    `  ${prompt}`,
    '  ```',
    '',
  ].join('\n');
  const credits = readFileSync(CREDITS, 'utf8');
  writeFileSync(CREDITS, `${credits.trimEnd()}\n${entry}`);
  console.log(`saved art-src/tests/${file} (${webp.info.width}x${webp.info.height}, q${webp.quality}, ${Math.round(webp.data.length / 1000)} KB); original ${original}`);
  console.log(`images generated: ${n}/30`);
}

if (import.meta.main) {
  main().catch((err) => {
    // Error text comes from fal's response bodies or from this script, never from the headers.
    console.error(`failed: ${err.message}`);
    process.exit(1);
  });
}
