import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  buildPrompt,
  type Job,
  LATEST_STYLE,
  STYLE,
  styleKey,
} from '../art-src/tools/fal-generate.mjs';
import { greyPixel } from '../art-src/tools/grey-preview.mjs';
import { CHECKS, measureZone } from '../art-src/tools/quiet-zone.mjs';
import { bandsOf, HEIGHT, refitImage, refitted, WIDTH } from '../art-src/tools/refit.mjs';
import { palette } from '../src/art/palette';
import { sceneZones } from '../src/art/scene-zones';

const job: Job = {
  name: 'backdrop-r01-door-lift',
  seed: 1101,
  size: { width: 1920, height: 1200 },
  slots: { subject: 'A room backdrop.', camera: 'Frontal.' },
};

describe('fal-generate style block', () => {
  it('defaults to the newest block, never to v1', () => {
    expect(LATEST_STYLE).toBe(Object.keys(STYLE).at(-1));
    expect(LATEST_STYLE).not.toBe('v1');
    expect(styleKey(job)).toBe(LATEST_STYLE);
    const prompt = buildPrompt(job);
    expect(prompt).toContain(STYLE[LATEST_STYLE]);
    // v1's wording draws clock faces and invites signatures (art bible, "Words that misfire").
    expect(prompt).not.toContain('Clockwork');
    expect(prompt).not.toContain('sketchbook');
  });

  it('keeps an explicit block, so old CREDITS entries replay', () => {
    expect(styleKey({ style: 'v1' })).toBe('v1');
    expect(buildPrompt({ ...job, style: 'v1' })).toContain(STYLE.v1);
  });

  it('refuses an unknown block before anything is sent', () => {
    expect(() => buildPrompt({ ...job, style: 'v9' })).toThrow('Unknown style block v9');
    expect(() => styleKey({ style: 'toString' })).toThrow('Unknown style block');
  });
});

describe('quiet-zone check', () => {
  const width = 1600;
  const height = 1000;
  const paper = [0xf4, 0xef, 0xe3];
  const ink = [0x3d, 0x4b, 0x5c];

  function page(): Uint8Array {
    const rgb = new Uint8Array(width * height * 3);
    for (let i = 0; i < width * height; i += 1) rgb.set(paper, i * 3);
    return rgb;
  }

  function fill(rgb: Uint8Array, x0: number, y0: number, x1: number, y1: number): void {
    for (let y = y0; y < y1; y += 1)
      for (let x = x0; x < x1; x += 1) rgb.set(ink, (y * width + x) * 3);
  }

  it('passes plain paper', () => {
    const m = measureZone(page(), sceneZones.panLeft, 0.15);
    expect(m.inkShare).toBe(0);
    expect(m.busy).toEqual([]);
    // 520 × 560 in 40 × 40 cells.
    expect(m.cells).toBe(13 * 14);
  });

  it('finds an object in a pan zone and nowhere else', () => {
    const rgb = page();
    // A door post standing where the left pan swings.
    fill(rgb, 400, 400, 440, 520);
    const left = measureZone(rgb, sceneZones.panLeft, 0.15);
    expect(left.busy).toEqual([
      { x0: 400, y0: 400, x1: 440, y1: 440 },
      { x0: 400, y0: 440, x1: 440, y1: 480 },
      { x0: 400, y0: 480, x1: 440, y1: 520 },
    ]);
    expect(measureZone(rgb, sceneZones.panRight, 0.15).busy).toEqual([]);
  });

  it('ignores thin wall joints', () => {
    const rgb = page();
    // One ink line across every course of stone.
    for (let y = sceneZones.panLeft.y0 + 20; y < sceneZones.panLeft.y1; y += 40)
      fill(rgb, sceneZones.panLeft.x0, y, sceneZones.panLeft.x1, y + 1);
    const check = CHECKS.backdrop[0];
    if (!check) throw new Error('no backdrop check');
    const m = measureZone(rgb, check.zone, check.busyCell);
    expect(m.busy).toEqual([]);
    expect(m.inkShare).toBeLessThanOrEqual(check.inkShare);
  });

  it("checks the zones the scale's layout needs", () => {
    for (const kind of ['backdrop', 'housing'] as const) {
      const zones = CHECKS[kind].map((check) => check.zone);
      expect(zones).toEqual([
        sceneZones.panLeft,
        sceneZones.panRight,
        sceneZones.opening,
        sceneZones.dial,
      ]);
    }
  });
});

describe('refit (story 2.12)', () => {
  it('maps source bands onto target bands', () => {
    const bands = bandsOf('0,200,730,1000:0,200,800,1000', HEIGHT);
    expect(bands).toEqual([
      { from: 0, to: 200, at: 0, size: 200 },
      { from: 200, to: 730, at: 200, size: 600 },
      { from: 730, to: 1000, at: 800, size: 200 },
    ]);
    expect(refitted(bands, 100)).toBe(100);
    expect(refitted(bands, 730)).toBe(800);
    expect(refitted(bands, 1000)).toBe(1000);
    expect(refitted(bands, 465)).toBe(500);
  });

  it('refuses edges that skip the ends, go back or differ in number', () => {
    expect(() => bandsOf('0,730,1000:0,800', HEIGHT)).toThrow(/same length/);
    expect(() => bandsOf('10,730,1000:0,800,1000', HEIGHT)).toThrow(/from 0/);
    expect(() => bandsOf('0,730,1600:0,800,1600', HEIGHT)).toThrow(/from 0/);
    expect(() => bandsOf('0,800,730,1000:0,200,800,1000', HEIGHT)).toThrow(/increase/);
    expect(() => bandsOf('0,1.5,1600:0,2,1600', WIDTH)).toThrow(/whole/);
    expect(() => bandsOf('0,800,1600', WIDTH)).toThrow(/same length/);
    expect(() => bandsOf('0,1000:0,1000:0,1000', HEIGHT)).toThrow(/two edge lists/);
    expect(() => refitted(bandsOf('0,1000:0,1000', HEIGHT), 1200)).toThrow(/outside/);
  });

  it('moves a line on the image where the bands say, in y and in x', async () => {
    // White, with one black row at y 730 and one black column at x 600.
    const rgb = Buffer.alloc(WIDTH * HEIGHT * 3, 255);
    const black = (x: number, y: number) =>
      rgb.fill(0, (y * WIDTH + x) * 3, (y * WIDTH + x) * 3 + 3);
    for (let x = 0; x < WIDTH; x += 1) black(x, 730);
    for (let y = 0; y < HEIGHT; y += 1) black(600, y);
    const input = await sharp(rgb, { raw: { width: WIDTH, height: HEIGHT, channels: 3 } })
      .png()
      .toBuffer();
    const out = await refitImage(input, {
      y: '0,200,730,1000:0,200,800,1000',
      x: '0,600,1600:0,500,1600',
    });
    const { data } = await sharp(out).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const darkest = (value: (i: number) => number, n: number) => {
      let best = 0;
      for (let i = 1; i < n; i += 1) if (value(i) < value(best)) best = i;
      return best;
    };
    const row = darkest((y) => data[(y * WIDTH + 100) * 3] ?? 255, HEIGHT);
    const column = darkest((x) => data[(50 * WIDTH + x) * 3] ?? 255, WIDTH);
    expect(Math.abs(row - 800)).toBeLessThanOrEqual(1);
    expect(Math.abs(column - 500)).toBeLessThanOrEqual(1);
  });
});

describe('grey preview (story 2.12)', () => {
  it('maps paper to paper, black to ink and keeps value order', () => {
    const rgbOf = (value: number) => [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
    expect(greyPixel(255, 255, 255)).toEqual(rgbOf(palette.paper));
    expect(greyPixel(0, 0, 0)).toEqual(rgbOf(palette.ink));
    const brass = greyPixel(0xb8, 0x89, 0x3a);
    const iron = greyPixel(0x59, 0x61, 0x6b);
    expect(brass[1]).toBeGreaterThan(iron[1]);
  });
});
