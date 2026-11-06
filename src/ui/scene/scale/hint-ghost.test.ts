import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import {
  frameGhost,
  ghostAlpha,
  ghostLoop,
  knobGhost,
  type PiecePath,
  pieceGhost,
  slideReach,
} from '@/ui/scene/scale/hint-ghost';

describe('the hint’s ghosts (story 1.16)', () => {
  it('runs a ghost, pauses, and runs it again', () => {
    expect(ghostLoop(0)).toBe(0);
    expect(ghostLoop(tuning.hintGhostMs / 2)).toBeCloseTo(0.5);
    expect(ghostLoop(tuning.hintGhostMs + 1)).toBeNull();
    expect(ghostLoop(tuning.hintGhostMs + tuning.hintGhostPauseMs + 1)).toBeCloseTo(
      1 / tuning.hintGhostMs,
    );
    expect(ghostLoop(-5)).toBe(0);
    expect(ghostLoop(Number.NaN)).toBe(0);
  });

  it('moves the knob’s ghost out the right way and back, faint', () => {
    expect(knobGhost(0, 50)).toMatchObject({ x: 0, alpha: 0 });
    expect(knobGhost(0.5, 50)).toMatchObject({ x: 50, alpha: ghostAlpha });
    expect(knobGhost(0.5, -50).x).toBe(-50);
    expect(knobGhost(1, 50)).toMatchObject({ x: 0, alpha: 0 });
    for (let t = 0; t <= 1; t += 0.05) {
      expect(knobGhost(t, 50).alpha).toBeLessThanOrEqual(ghostAlpha);
    }
  });

  it('goes two notches, or as far as the dial goes', () => {
    expect(slideReach(1, 0, 6, 2)).toBe(2);
    expect(slideReach(1, 5, 6, 2)).toBe(1);
    expect(slideReach(1, 6, 6, 2)).toBe(0);
    expect(slideReach(-1, 6, 6, 2)).toBe(-2);
    expect(slideReach(-1, 1, 6, 2)).toBe(-1);
  });

  it('lifts the tray piece’s ghost from the tray, over the scale, then one copy onto each pan', () => {
    const path: PiecePath = {
      from: { x: 1400, y: 200 },
      rise: 40,
      over: { x: 800, y: 380 },
      pans: [
        { x: 300, y: 560 },
        { x: 1300, y: 560 },
      ],
    };
    const [start] = pieceGhost(0, path);
    expect(start).toMatchObject({ x: 1400, y: 200, alpha: 0 });
    const [risen] = pieceGhost(0.2, path);
    expect(risen).toMatchObject({ x: 1400, y: 160, alpha: ghostAlpha });
    const [over] = pieceGhost(0.549, path);
    expect(over?.x).toBeCloseTo(800, 0);
    const landed = pieceGhost(0.85, path);
    expect(landed).toEqual([
      { x: 300, y: 560, alpha: ghostAlpha },
      { x: 1300, y: 560, alpha: ghostAlpha },
    ]);
    expect(pieceGhost(1, path).map((copy) => copy.alpha)).toEqual([0, 0]);
  });

  it('glides the splitter frame’s ghost from its holder over the scale, and fades it', () => {
    const from = { x: 150, y: 40 };
    const to = { x: 680, y: 400 };
    expect(frameGhost(0, from, to)).toMatchObject({ x: 150, y: 40, alpha: 0 });
    expect(frameGhost(0.7, from, to)).toMatchObject({ x: 680, y: 400, alpha: ghostAlpha });
    expect(frameGhost(1, from, to).alpha).toBe(0);
  });
});

// Story 1.16 review: the knob's ghost assumed the track hadn't scrolled. It now reads the
// track's scroll as the dial keeps it, shared through the scene copy, on every frame.
describe('the knob’s ghost on a scrolled track (story 1.16 review)', () => {
  const ghost = readFileSync(new URL('./HintGhost.tsx', import.meta.url), 'utf8');
  const dial = readFileSync(new URL('./Dial.tsx', import.meta.url), 'utf8');
  const scene = readFileSync(new URL('../SceneRoot.tsx', import.meta.url), 'utf8');

  it('stands on the knob as the dial has scrolled the track', () => {
    expect(ghost).toContain('knobAt(layout, at, scroll.current)');
    expect(ghost).not.toContain('followScroll(layout, 0');
    expect(dial).toContain('const scrollRef = scroll ?? ownScroll;');
    expect(scene).toContain(
      '<Dial sceneScale={copyScale} scroll={dialScroll} plateLayer={plateLayer} />',
    );
    expect(scene).toContain('<HintGhost sceneScale={copyScale} dialScroll={dialScroll} />');
  });
});
