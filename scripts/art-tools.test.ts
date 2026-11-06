import { describe, expect, it } from 'vitest';
import {
  buildPrompt,
  type Job,
  LATEST_STYLE,
  STYLE,
  styleKey,
} from '../art-src/tools/fal-generate.mjs';
import { CHECKS, measureZone } from '../art-src/tools/quiet-zone.mjs';
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
