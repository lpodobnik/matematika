import { describe, expect, it } from 'vitest';
import { confirmSize, confirmSpot } from '@/ui/common/scene-spots';
import { pressHandle, shownAside } from '@/ui/notebook/notebook-aside';

describe('the phone notebook while a pin waits (story 1.14 review fix)', () => {
  it('shows pushed aside while a pin waits, without changing his choice', () => {
    expect(shownAside(false, null, null)).toBe(false);
    expect(shownAside(false, 'r03.0', null)).toBe(true);
    expect(shownAside(true, null, null)).toBe(true);
    // Once the pin is confirmed it shows as he had it.
    expect(shownAside(false, null, 'r03.0')).toBe(false);
  });

  it('lets him bring it back over a waiting pin, for that pin only', () => {
    const back = pressHandle({ choice: false, broughtBack: null }, 'r03.0');
    expect(back).toEqual({ choice: false, broughtBack: 'r03.0' });
    expect(shownAside(back.choice, 'r03.0', back.broughtBack)).toBe(false);
    // The next pin pushes it aside again.
    expect(shownAside(back.choice, 'r03.1', back.broughtBack)).toBe(true);
    // Pushed aside again during the same pin, his choice still stays.
    const again = pressHandle(back, 'r03.0');
    expect(again).toEqual({ choice: false, broughtBack: null });
    expect(shownAside(again.choice, 'r03.0', again.broughtBack)).toBe(true);
  });

  it('brings it back as his choice when he had pushed it aside himself', () => {
    const back = pressHandle({ choice: true, broughtBack: null }, 'r04.0');
    expect(back).toEqual({ choice: false, broughtBack: 'r04.0' });
    expect(shownAside(back.choice, 'r04.0', back.broughtBack)).toBe(false);
  });

  it('slides as he asks when no pin waits', () => {
    expect(pressHandle({ choice: false, broughtBack: null }, null)).toEqual({
      choice: true,
      broughtBack: null,
    });
    expect(pressHandle({ choice: true, broughtBack: null }, null)).toEqual({
      choice: false,
      broughtBack: null,
    });
  });

  it('so at 640 × 360, Potvrdi in the corner under the notebook is on the visible scene', () => {
    // The phone notebook covers the area's right 45 % (notebook.css) unless it is aside.
    const area = { width: 640, height: 360 };
    const spot = confirmSpot(area, null);
    expect(spot.left + confirmSize.width).toBeGreaterThan(640 - 0.45 * 640);
    expect(shownAside(false, 'pin', null)).toBe(true);
    expect(spot.left + confirmSize.width).toBeLessThanOrEqual(area.width);
  });
});
