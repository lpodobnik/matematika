import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r03 } from '@/content/rooms/r03-sluice-gate';
import { r04 } from '@/content/rooms/r04-water-wheel';
import { touchMachine } from '@/room/phases';
import { enterRoom } from '@/room/room';
import type { RoomSpec, RoomState, ToolId } from '@/room/types';
import {
  cardGapPx,
  placeGuideCard,
  type Rect,
  ringRect,
  sceneAvoidBoxes,
  sceneBoxInArea,
  sceneScaleIn,
  sceneTargetBoxes,
} from '@/ui/common/guide-spots';
import { fitScene } from '@/ui/scene/fit-scene';

const tablet = { width: 868, height: 800 };
const phone = { width: 640, height: 360 };

function touched(spec: RoomSpec): RoomState {
  const { room } = enterRoom(spec);
  return touchMachine(room)?.room ?? room;
}

function scene(room: RoomState, area: { width: number; height: number }, tools: ToolId[] = []) {
  const fit = fitScene(area.width, area.height);
  return { room, tools, sceneScale: sceneScaleIn(area, 1), origin: { x: fit.x, y: fit.y } };
}

const inside = (rect: Rect, area: { width: number; height: number }) =>
  rect.left >= -1 &&
  rect.top >= -1 &&
  rect.left + rect.width <= area.width + 1 &&
  rect.top + rect.height <= area.height + 1;

const overlaps = (a: Rect, b: Rect) =>
  a.left < b.left + b.width &&
  b.left < a.left + a.width &&
  a.top < b.top + b.height &&
  b.top < a.top + a.height;

describe('where the room guide’s rings go (story 6.1)', () => {
  it.each([
    ['the tablet', tablet],
    ['a phone', phone],
  ])('finds the slider and each pan inside the scene area, on %s', (_name, area) => {
    const room = touched(r01);
    const at = scene(room, area);
    const [dial] = sceneTargetBoxes('dial', at);
    const pans = sceneTargetBoxes('scale', at);
    expect(dial).toBeDefined();
    expect(pans).toHaveLength(2);
    for (const box of [dial, ...pans]) {
      if (!box) continue;
      const rect = sceneBoxInArea(box, area, 1);
      expect(rect).not.toBeNull();
      if (rect) expect(inside(rect, area)).toBe(true);
    }
    // The slider is under the scale.
    const dialRect = dial ? sceneBoxInArea(dial, area, 1) : null;
    const leftPan = pans[0] ? sceneBoxInArea(pans[0], area, 1) : null;
    expect(dialRect && leftPan && dialRect.top > leftPan.top).toBe(true);
  });

  it('finds the tray and the splitter only as their layouts place them, and the flag while it is offered', () => {
    const room = touched(r04);
    const at = scene(room, phone, ['balance']);
    expect(sceneTargetBoxes('tray', at)).toHaveLength(1);
    expect(sceneTargetBoxes('splitter', at)).toHaveLength(1);
    expect(sceneTargetBoxes('pin', at)).toEqual([]);
    const poking = scene(touched(r03), phone);
    expect(sceneTargetBoxes('pin', poking)).toHaveLength(1);
    expect(sceneAvoidBoxes(poking)).toHaveLength(1);
    expect(sceneAvoidBoxes(at)).toEqual([]);
  });

  it('rings the scene’s small goal card on a phone and on the tabletows', () => {
    const room = touched(r04);
    expect(sceneTargetBoxes('goal', scene(room, phone, ['balance']))).toHaveLength(1);
    expect(
      sceneTargetBoxes('goal', scene(room, { width: 868, height: 800 }, ['balance'])),
    ).toHaveLength(1);
  });

  it('rings nothing in the scene for the notebook’s parts, and nothing before the scene is laid out', () => {
    const at = scene(touched(r01), phone);
    expect(sceneTargetBoxes('pad', at)).toEqual([]);
    expect(sceneTargetBoxes('dial', { ...at, sceneScale: 0 })).toEqual([]);
  });

  it('keeps a ring inside the screen', () => {
    expect(ringRect({ left: -20, top: 10, width: 100, height: 400 }, phone, 6)).toEqual({
      left: 2,
      top: 4,
      width: 84,
      height: 354,
    });
  });
});

describe('where the room guide’s card stands', () => {
  const card = { width: 380, height: 110 };

  it('stands at the top of the scene area when it rings the slider below', () => {
    const region = { left: 0, top: 0, width: 868, height: 800 };
    const dial = { left: 250, top: 550, width: 370, height: 130 };
    const spot = placeGuideCard(region, card, [dial], []);
    expect(spot.top).toBe(cardGapPx);
    expect(spot.left).toBe((868 - 380) / 2);
  });

  it('never covers a ring where it can stand elsewhere, and keeps clear of the controls', () => {
    const region = { left: 0, top: 0, width: 352, height: 360 };
    const small = { width: 280, height: 90 };
    const top = { left: 0, top: 0, width: 352, height: 120 };
    const reset = { left: 8, top: 260, width: 48, height: 48 };
    const spot = placeGuideCard(region, small, [top], [reset]);
    const placed = { ...spot, ...small };
    expect(overlaps(placed, top)).toBe(false);
    expect(overlaps(placed, reset)).toBe(false);
    expect(placed.left + placed.width).toBeLessThanOrEqual(352);
  });

  it('covers as little as it can where every place covers a ring', () => {
    const region = { left: 0, top: 0, width: 300, height: 200 };
    const everywhere = { left: 0, top: 0, width: 300, height: 180 };
    const spot = placeGuideCard(region, { width: 200, height: 80 }, [everywhere], []);
    expect(spot.top).toBe(200 - 80 - cardGapPx);
  });
});
