import { describe, expect, it } from 'vitest';
import { thousandsSeparator } from '@/math/format';
import { fitScene } from '@/ui/scene/fit-scene';
import {
  dialLabelLayout,
  dialLabelText,
  dialLabelTop,
  nudgeOffset,
} from '@/ui/scene/scale/dial-label';
import { dialLayout } from '@/ui/scene/scale/dial-layout';

const tablet = fitScene(1280 - 0.32 * 1280, 800).scale;
const phone = fitScene(640, 360).scale;

describe('the slider’s x label (story 1.15)', () => {
  it('reads x = 9 while he explores, and x = ? while the scale acts out', () => {
    expect(dialLabelText(9)).toBe('x = 9');
    expect(dialLabelText(0)).toBe('x = 0');
    expect(dialLabelText(12_500)).toBe(`x = 12${thousandsSeparator}500`);
    expect(dialLabelText(null)).toBe('x = ?');
  });

  it.each([
    ['the tablet', tablet],
    ['640 × 360', phone],
  ])('sits right above the knob at least 20 CSS px on %s, wide enough for its text', (_, scale) => {
    const layout = dialLayout(scale, 10);
    for (const text of [dialLabelText(5), dialLabelText(30), dialLabelText(null)]) {
      const label = dialLabelLayout(layout, text, scale);
      expect(label.fontSize * scale).toBeGreaterThanOrEqual(20);
      expect(label.knobTop).toBeCloseTo(-layout.knob.height / 2);
      expect(label.bottom).toBeLessThan(label.knobTop);
      expect(label.top).toBeCloseTo(label.bottom - label.height);
      expect(label.height).toBeGreaterThan(label.fontSize);
      expect(label.width).toBeGreaterThan([...text].length * 0.55 * label.fontSize);
      expect(dialLabelTop(layout, scale)).toBeLessThanOrEqual(label.top + 1e-9);
    }
  });

  it('nudges the knob one notch over and back, starting and ending at rest', () => {
    expect(nudgeOffset(0, 40)).toBe(0);
    expect(nudgeOffset(0.5, 40)).toBeCloseTo(40);
    expect(nudgeOffset(1, 40)).toBeCloseTo(0);
    expect(nudgeOffset(0.25, 40)).toBeGreaterThan(0);
    expect(nudgeOffset(0.5, -40)).toBeCloseTo(-40);
    expect(nudgeOffset(-1, 40)).toBe(0);
    expect(nudgeOffset(2, 40)).toBeCloseTo(0);
  });
});
