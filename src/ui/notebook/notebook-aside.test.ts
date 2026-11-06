import { describe, expect, it } from 'vitest';
import { r03 } from '@/content/rooms/r03-sluice-gate';
import { r04 } from '@/content/rooms/r04-water-wheel';
import { notchCount } from '@/room/dial';
import { pinTrack, slotCount } from '@/room/pin';
import type { StageSpec } from '@/room/types';
import { confirmSize, confirmSpot, pinHeadSpot } from '@/ui/common/scene-spots';
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

  // Story 1.16 took room 4's pin away; a pin beyond the dial (later rooms) stays covered by
  // room 4's stage with the pin and the dial of 0–6 it had.
  it("so at 640 × 360, Potvrdi on a beyond-dial pin's 9 and room 3's pan-up is on the visible scene", () => {
    // The phone notebook covers the area's right 45 % (notebook.css) unless it is aside.
    const area = { width: 640, height: 360 };
    const notebookLeft = 640 - 0.45 * 640;
    const wheel = r04.stages[0] as StageSpec;
    const pinnedWheel: StageSpec = {
      ...wheel,
      dial: { min: 0, max: 6, step: 1 },
      pin: { kind: 'level-x', beyondDial: true },
    };
    const cases = [
      { stage: pinnedWheel, value: 9 },
      { stage: r03.stages[1], value: 1 },
    ];
    for (const { stage, value } of cases) {
      const track = stage ? pinTrack(stage) : null;
      if (!stage || !track || stage.dial === 'locked') throw new Error('no pin');
      const pin = { kind: track.kind, slots: slotCount(track), slot: value };
      const head = pinHeadSpot(area, 1, notchCount(stage.dial), pin);
      if (!head) throw new Error('no head');
      const spot = confirmSpot(head, track.kind, area);
      // It would sit under the notebook, were the notebook not shown aside while the pin waits.
      expect(spot.left + confirmSize.width).toBeGreaterThan(notebookLeft);
      expect(shownAside(false, 'pin', null)).toBe(true);
      expect(spot.left + confirmSize.width).toBeLessThanOrEqual(area.width);
    }
  });
});
