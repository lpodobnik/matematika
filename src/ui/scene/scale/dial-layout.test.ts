import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { fitScene, sceneSize } from '@/ui/scene/fit-scene';
import {
  clampNotch,
  type DialLayout,
  dialGeometry,
  dialLayout,
  followScroll,
  knobAt,
  minHitCssPx,
} from '@/ui/scene/scale/dial-layout';
import { scaleGeometry } from '@/ui/scene/scale/layout';

// A 1280 × 800 tablet: the notebook takes 32 %, the scene gets 870 × 800.
const tablet = fitScene(1280 - 0.32 * 1280, 800).scale;
// 640 × 360, the smallest supported viewport: the notebook (240 px) beside the scene, and
// the phone layout, where it slides over the scene (story 1.6).
const smallBeside = fitScene(640 - 240, 360).scale;
const smallOver = fitScene(640, 360).scale;

/** Where the knob shows in the scene for a knob offset and scroll. */
function knobSceneX(layout: DialLayout, offset: number, scroll: number): number {
  return layout.originX - scroll + offset;
}

describe('dialLayout', () => {
  it('puts the notches 24 CSS px apart at any scale (fast-check)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.2, max: 3, noNaN: true }),
        fc.integer({ min: 0, max: 40 }),
        (scale, notches) => {
          const layout = dialLayout(scale, notches);
          expect(layout.spacing * scale).toBeCloseTo(tuning.dialNotchPx);
          expect(layout.length).toBeCloseTo(notches * layout.spacing);
        },
      ),
    );
  });

  it("lays room 1's 10 notches out on the tablet, centred, without scrolling", () => {
    const layout = dialLayout(tablet, 10);
    expect(layout.notches).toBe(10);
    expect(layout.spacing * tablet).toBeCloseTo(24);
    expect(layout.scrolls).toBe(false);
    expect(layout.maxScroll).toBe(0);
    expect(layout.originX + layout.length / 2).toBeCloseTo(dialGeometry.centerX);
  });

  it('sits under the stand, inside the scene', () => {
    for (const scale of [tablet, smallBeside, smallOver]) {
      const layout = dialLayout(scale, 10);
      expect(layout.trackY).toBeGreaterThan(scaleGeometry.floorY + 26);
      expect(layout.trackY + layout.knob.height / 2).toBeLessThanOrEqual(sceneSize.height);
      expect(layout.window.x).toBeGreaterThanOrEqual(0);
      expect(layout.window.x + layout.window.width).toBeLessThanOrEqual(sceneSize.width);
    }
  });

  it.each([
    ['640 × 360 beside the notebook', smallBeside],
    ['640 × 360 under the notebook', smallOver],
    ['the tablet', tablet],
  ])('has a hit area at least 48 CSS px tall and wide on %s', (_, scale) => {
    const { hitArea } = dialLayout(scale, 10);
    expect(hitArea.height * scale).toBeGreaterThanOrEqual(minHitCssPx);
    expect(hitArea.width * scale).toBeGreaterThanOrEqual(minHitCssPx);
    expect(hitArea.y).toBeGreaterThanOrEqual(0);
    expect(hitArea.y + hitArea.height).toBeLessThanOrEqual(sceneSize.height);
  });

  it('keeps 48 CSS px for any scale down to the smallest viewport (fast-check)', () => {
    fc.assert(
      fc.property(fc.double({ min: smallBeside, max: 3, noNaN: true }), (scale) => {
        const { hitArea } = dialLayout(scale, 10);
        expect(hitArea.height * scale).toBeGreaterThanOrEqual(minHitCssPx - 1e-9);
      }),
    );
  });

  it("covers the whole track and the knob, but never reaches the pans' beam", () => {
    const lowestBeamEnd =
      scaleGeometry.pivot.y + scaleGeometry.beamHalfLength * Math.sin((15 * Math.PI) / 180);
    for (const scale of [tablet, smallBeside, smallOver]) {
      for (const notches of [6, 10, 20, 30]) {
        const layout = dialLayout(scale, notches);
        const { hitArea, knob } = layout;
        expect(hitArea.y).toBeGreaterThan(lowestBeamEnd);
        expect(hitArea.y).toBeLessThanOrEqual(layout.trackY - knob.height / 2);
        expect(hitArea.x).toBeLessThanOrEqual(layout.window.x);
        expect(hitArea.x + hitArea.width).toBeGreaterThanOrEqual(
          layout.window.x + layout.window.width,
        );
      }
    }
  });

  it('draws the knob at least 40 CSS px tall, so it shows on a phone', () => {
    for (const scale of [tablet, smallBeside, smallOver]) {
      expect(dialLayout(scale, 10).knob.height * scale).toBeGreaterThanOrEqual(40);
    }
  });

  it('keeps the knob fully inside the window at both ends when the track fits', () => {
    for (const scale of [tablet, smallBeside, smallOver]) {
      const layout = dialLayout(scale, 10);
      if (layout.scrolls) continue;
      const { window, knob } = layout;
      expect(layout.originX - knob.width / 2).toBeGreaterThanOrEqual(window.x);
      expect(layout.originX + layout.length + knob.width / 2).toBeLessThanOrEqual(
        window.x + window.width,
      );
    }
  });

  it('scrolls only when the range is wider than the window', () => {
    // Room 1 (10 notches) fits everywhere; room 3's 0–20 fits on the tablet but not at
    // 640 × 360 beside the notebook; room 11's 0–30 needs it there too.
    expect(dialLayout(smallBeside, 10).scrolls).toBe(false);
    expect(dialLayout(tablet, 20).scrolls).toBe(false);
    expect(dialLayout(smallBeside, 20).scrolls).toBe(true);
    expect(dialLayout(smallBeside, 30).scrolls).toBe(true);
    const wide = dialLayout(smallBeside, 30);
    expect(wide.maxScroll).toBeCloseTo(wide.length - wide.viewLength);
  });

  it('refuses a scene that is not laid out yet', () => {
    expect(() => dialLayout(0, 10)).toThrow(/laid out/);
    expect(() => dialLayout(Number.NaN, 10)).toThrow(/laid out/);
    expect(() => dialLayout(0.5, 2.5)).toThrow(/notch count/);
  });
});

// Story 1.16 review: the knob's ghost worked the scroll out as if the track hadn't
// scrolled yet, so on a track he had scrolled it stood off the knob.
describe('knobAt', () => {
  it('stands where the dial draws the knob, on the track as it has scrolled', () => {
    const layout = dialLayout(smallBeside, 30);
    expect(layout.scrolls).toBe(true);
    // He drags the knob to the end, then back to notch 20: the track stays scrolled.
    let scroll = 0;
    for (let notch = 0; notch <= 30; notch += 1) {
      scroll = followScroll(layout, scroll, notch * layout.spacing);
    }
    for (let notch = 30; notch >= 20; notch -= 1) {
      scroll = followScroll(layout, scroll, notch * layout.spacing);
    }
    const offset = 20 * layout.spacing;
    expect(knobAt(layout, 20, scroll)).toEqual({
      x: knobSceneX(layout, offset, scroll),
      y: layout.trackY,
    });
    // Worked out from an unscrolled track, it would stand elsewhere.
    const fresh = followScroll(layout, 0, offset);
    expect(Math.abs(knobAt(layout, 20, fresh).x - knobAt(layout, 20, scroll).x)).toBeGreaterThan(
      layout.spacing,
    );
  });
});

describe('followScroll', () => {
  it('never scrolls a track that fits', () => {
    const layout = dialLayout(tablet, 10);
    expect(followScroll(layout, 0, layout.length)).toBe(0);
    expect(followScroll(layout, 50, 0)).toBe(0);
  });

  it('leaves the track still while the knob moves in the middle of the window', () => {
    const layout = dialLayout(smallBeside, 30);
    const middle = layout.viewLength / 2;
    expect(followScroll(layout, 0, middle)).toBe(0);
    expect(followScroll(layout, 0, middle + layout.spacing)).toBe(0);
  });

  it('keeps the knob in the window, with the track inside its ends (fast-check)', () => {
    const layout = dialLayout(smallBeside, 30);
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0, max: 1, noNaN: true }), { minLength: 1, maxLength: 40 }),
        (fractions) => {
          let scroll = 0;
          for (const fraction of fractions) {
            const offset = fraction * layout.length;
            scroll = followScroll(layout, scroll, offset);
            expect(scroll).toBeGreaterThanOrEqual(0);
            expect(scroll).toBeLessThanOrEqual(layout.maxScroll + 1e-9);
            const x = knobSceneX(layout, offset, scroll);
            expect(x - layout.knob.width / 2).toBeGreaterThanOrEqual(layout.window.x - 1e-9);
            expect(x + layout.knob.width / 2).toBeLessThanOrEqual(
              layout.window.x + layout.window.width + 1e-9,
            );
          }
        },
      ),
    );
  });

  it('scrolls to show the last notch at the far end, and the first at the start', () => {
    const layout = dialLayout(smallBeside, 30);
    expect(followScroll(layout, 0, layout.length)).toBeCloseTo(layout.maxScroll);
    expect(followScroll(layout, layout.maxScroll, 0)).toBe(0);
  });
});

describe('clampNotch (story 1.14)', () => {
  const dial = { min: 6, max: 20, step: 1, x: 6, heldByPin: false };

  it("grips the first notch past the poke window, and nothing once it's open", () => {
    expect(clampNotch({ ...dial, openMax: 9 })).toBe(4);
    expect(clampNotch({ ...dial, openMax: 20 })).toBeNull();
    expect(clampNotch({ min: 0, max: 30, step: 3, x: 0, heldByPin: false, openMax: 9 })).toBe(4);
  });

  it('grips the notch just past the knob while a waiting pin holds the dial still', () => {
    const held = { min: 0, max: 20, step: 1, x: 0, heldByPin: true, openMax: 20 };
    expect(clampNotch(held)).toBe(1);
    expect(clampNotch({ ...held, x: 20 })).toBeNull();
    expect(clampNotch({ ...held, heldByPin: false })).toBeNull();
  });
});
