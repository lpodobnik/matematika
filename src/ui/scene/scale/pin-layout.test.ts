import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { fitScene, sceneSize } from '@/ui/scene/fit-scene';
import { dialGeometry, dialLayout, minHitCssPx } from '@/ui/scene/scale/dial-layout';
import { labelFontSize, scaleGeometry } from '@/ui/scene/scale/layout';
import {
  pinGeometry,
  pinLayout,
  pinWiggle,
  pinWiggleMs,
  placeWord,
  placeX,
} from '@/ui/scene/scale/pin-layout';

// A 1280 × 800 tablet with the notebook beside the scene, and the 640 × 360 phone layout,
// where the notebook slides over it (as in dial-layout.test.ts).
const tablet = fitScene(1280 - 0.32 * 1280, 800).scale;
const phone = fitScene(640, 360).scale;
const smallBeside = fitScene(640 - 240, 360).scale;

/** Room 3's first stage: dial 6–20 (14 notches), an x pin over the same 15 places. */
function roomThree(scale: number) {
  const dial = dialLayout(scale, 14);
  return { dial, pin: pinLayout(dial, { kind: 'x', slots: 15 }, labelFontSize(scale)) };
}

describe('pinLayout', () => {
  it("stands an x pin's places over the dial's notches, 24 CSS px apart", () => {
    for (const scale of [tablet, phone]) {
      const { dial, pin } = roomThree(scale);
      expect(pin.aligned).toBe(true);
      expect(pin.originX).toBeCloseTo(dial.originX);
      expect(pin.spacing).toBeCloseTo(dial.spacing);
      expect(pin.slotPx).toBeCloseTo(tuning.dialNotchPx);
      expect(placeX(pin, 8)).toBeCloseTo(dial.originX + 8 * dial.spacing);
    }
  });

  it("carries on past the dial's end for a pin beyond the dial (room 4: dial 0–6, pin 0–12)", () => {
    for (const scale of [tablet, phone]) {
      const dial = dialLayout(scale, 6);
      const pin = pinLayout(dial, { kind: 'x', slots: 13 }, labelFontSize(scale));
      expect(pin.aligned).toBe(true);
      expect(placeX(pin, 6)).toBeCloseTo(dial.originX + dial.length);
      expect(placeX(pin, 12)).toBeLessThanOrEqual(dial.window.x + dial.window.width);
    }
  });

  it('spreads the places across the window when the dial scrolls, so every place can be reached', () => {
    const { dial, pin } = roomThree(smallBeside);
    expect(dial.scrolls).toBe(true);
    expect(pin.aligned).toBe(false);
    expect(placeX(pin, 0)).toBeGreaterThanOrEqual(dial.window.x);
    expect(placeX(pin, 14)).toBeLessThanOrEqual(dial.window.x + dial.window.width);
    expect(pin.slotPx).toBeGreaterThan(0);
  });

  // Story 1.15: the flag's cloth, not its pole, is what is centred under the scale.
  it("sets a choice pin's two options wide apart, their cloths centred under the scale", () => {
    const dial = dialLayout(tablet, 20);
    const pin = pinLayout(dial, { kind: 'choice', slots: 2 }, labelFontSize(tablet));
    expect(pin.slotPx).toBeCloseTo(pinGeometry.choiceSpacingPx);
    expect((placeX(pin, 0) + placeX(pin, 1)) / 2 + pin.headX).toBeCloseTo(dialGeometry.centerX);
    expect(pin.aligned).toBe(false);
  });

  it("sets a choice pin's words beside its flags, on the outer sides, clear of the stand", () => {
    for (const scale of [tablet, phone]) {
      const dial = dialLayout(scale, 20);
      const pin = pinLayout(dial, { kind: 'choice', slots: 2 }, labelFontSize(scale));
      const [left, right] = [placeWord(pin, 0, 6), placeWord(pin, 1, 5)];
      if (!left || !right) throw new Error('no words');
      for (const word of [left, right]) {
        expect(word.height * scale).toBeGreaterThanOrEqual(20);
        // Level with the cloth, above the knob.
        expect(word.y + word.height / 2).toBeCloseTo(pin.headY);
        expect(word.y + word.height).toBeLessThan(dial.trackY - dial.knob.height / 2);
        expect(word.x).toBeGreaterThanOrEqual(0);
        expect(word.x + word.width).toBeLessThanOrEqual(sceneSize.width);
      }
      // Left of the left flag's pole, right of the right flag's cloth.
      expect(left.x + left.width).toBeLessThan(placeX(pin, 0));
      expect(right.x).toBeGreaterThan(placeX(pin, 1) + pin.headX + pin.headRadius);
      // Clear of the holder, left of the first place.
      expect(left.x).toBeGreaterThan(placeX(pin, null) + pin.headX + pin.headRadius);
      // The words and the flags' cloths are clear of the stand's foot, 320 wide under the pivot.
      const foot = { left: scaleGeometry.pivot.x - 160, right: scaleGeometry.pivot.x + 160 };
      expect(left.x + left.width).toBeLessThan(foot.left);
      expect(right.x).toBeGreaterThan(foot.right);
      expect(placeX(pin, 0) + pin.headX + pin.headRadius).toBeLessThan(foot.left);
      expect(placeX(pin, 1) + pin.headX - pin.headRadius).toBeGreaterThan(foot.right);
      // The holder's bracket stays in the scene.
      expect(placeX(pin, null) - pin.headRadius * 0.55 - pin.lineWidth * 2).toBeGreaterThanOrEqual(
        0,
      );
    }
  });

  it('keeps the holder left of the first place, clear of it, inside the scene', () => {
    for (const scale of [tablet, phone, smallBeside]) {
      for (const view of [
        { kind: 'x', slots: 15 },
        { kind: 'choice', slots: 2 },
      ] as const) {
        const pin = pinLayout(dialLayout(scale, 14), view, labelFontSize(scale));
        expect(pin.holderPx).toBeLessThanOrEqual(-pinGeometry.holderGapPx);
        expect(placeX(pin, null)).toBeLessThan(placeX(pin, 0));
        expect(placeX(pin, null) + pin.hitArea.x).toBeGreaterThanOrEqual(-1e-9);
      }
    }
  });

  it('stands the head above the knob, under the stand, with its tip on the track', () => {
    for (const scale of [tablet, phone]) {
      const { dial, pin } = roomThree(scale);
      expect(pin.tipY).toBeCloseTo(dial.trackY - dial.tickHeight / 2);
      expect(pin.headY + pin.headRadius).toBeLessThan(dial.trackY - dial.knob.height / 2);
      expect(pin.headY - pin.headRadius).toBeGreaterThan(scaleGeometry.pivot.y);
      expect(pin.headY + pin.headRadius).toBeLessThan(sceneSize.height);
    }
  });

  it('gives the flag a hit area of at least 48 CSS px round its cloth that stops above the knob', () => {
    for (const scale of [tablet, phone, smallBeside]) {
      const { dial, pin } = roomThree(scale);
      // Centred on the cloth, right of the pole (story 1.15).
      expect(pin.hitArea.x + pin.hitArea.width / 2).toBeCloseTo(pin.headX);
      expect(pin.hitArea.x).toBeLessThanOrEqual(pin.headX - pin.headRadius);
      expect(pin.hitArea.x + pin.hitArea.width).toBeGreaterThanOrEqual(pin.headX + pin.headRadius);
      expect(pin.hitArea.width * scale).toBeGreaterThanOrEqual(minHitCssPx - 1e-9);
      expect(pin.hitArea.height * scale).toBeGreaterThanOrEqual(minHitCssPx - 1e-9);
      expect(pin.hitArea.y + pin.hitArea.height).toBeLessThan(dial.trackY - dial.knob.height / 2);
      expect(pin.hitArea.y).toBeLessThanOrEqual(pin.headY - pin.headRadius);
      expect(pin.hitArea.y).toBeGreaterThan(0);
    }
  });

  it('fits a two-digit number in the head at 20 CSS px or more', () => {
    for (const scale of [tablet, phone]) {
      const fontSize = labelFontSize(scale);
      const { pin } = roomThree(scale);
      expect(fontSize * scale).toBeGreaterThanOrEqual(20);
      expect(pin.headRadius * 2).toBeGreaterThan(2 * 0.62 * fontSize);
    }
  });

  it('refuses a pin with no places', () => {
    expect(() => pinLayout(dialLayout(tablet, 10), { kind: 'x', slots: 0 }, 44)).toThrow();
  });
});

describe('the wiggle and the reveal', () => {
  it('wiggles a few times, dying away, and ends where it started', () => {
    expect(pinWiggle(0, 20)).toBe(0);
    expect(pinWiggle(1, 20)).toBeCloseTo(0);
    const swings = Array.from({ length: 101 }, (_, i) => pinWiggle(i / 100, 20));
    expect(Math.max(...swings)).toBeGreaterThan(5);
    expect(Math.max(...swings.map(Math.abs))).toBeLessThanOrEqual(20);
    expect(pinWiggleMs).toBeGreaterThan(0);
  });

  it('weighs a pin beyond the dial briefly, well under the time a stage lock plays', () => {
    // Story 1.14: the reveal is now `tuning.pinRevealMs`, for right pins beyond the dial too.
    expect(tuning.pinRevealMs).toBeGreaterThan(500);
    expect(tuning.pinRevealMs).toBeLessThan(tuning.presentationTimeoutMs);
  });
});
