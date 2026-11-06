import { describe, expect, it } from 'vitest';
import { rooms } from '@/content/rooms';
import { hr } from '@/content/text/hr';
import { notchCount } from '@/room/dial';
import { touchMachine } from '@/room/phases';
import { pinTrack, pinView, slotCount } from '@/room/pin';
import { enterRoom } from '@/room/room';
import type { RoomSpec, StageSpec } from '@/room/types';
import { fitScene, sceneSize } from '@/ui/scene/fit-scene';
import { type Box, dialLayout } from '@/ui/scene/scale/dial-layout';
import { labelFontSize } from '@/ui/scene/scale/layout';
import { pinLayout } from '@/ui/scene/scale/pin-layout';
import {
  pinTagGeometry,
  pinTagLayout,
  resetCorner,
  tagFontSize,
  tagObstacles,
  wrapWords,
} from '@/ui/scene/scale/pin-tag-layout';

// The 1280 × 800 tablet with the notebook beside the scene, and 640 × 360, where the scene
// fills the screen and the notebook slides over it (as in pin-layout.test.ts).
const tabletFit = fitScene(1280 - 0.32 * 1280, 800);
const phoneFit = fitScene(640, 360);
const tablet = tabletFit.scale;
const phone = phoneFit.scale;
const fitOf = (scale: number) => (scale === tablet ? tabletFit : phoneFit);

/**
 * Room 4 as it was until story 1.16, with its "where it levels" pin beyond its dial of
 * 0–6: no room 1–4 has one now, but later rooms do (GDD: room 8), so its tag stays checked.
 */
const pinnedWheel: RoomSpec = {
  ...(rooms[3] as RoomSpec),
  stages: [
    {
      ...((rooms[3] as RoomSpec).stages[0] as StageSpec),
      dial: { min: 0, max: 6, step: 1 },
      pokeNotches: 4,
      pin: { kind: 'level-x', beyondDial: true },
    },
  ],
};

/** Every stage of rooms 1–4 with a pin, then the pinned wheel, and its tag at a scale. */
function stagesWithPins(): { spec: RoomSpec; stage: number }[] {
  return [
    ...rooms.flatMap((spec) =>
      spec.stages.flatMap((stage, index) => (stage.pin ? [{ spec, stage: index }] : [])),
    ),
    { spec: pinnedWheel, stage: 0 },
  ];
}

function tagFor(spec: RoomSpec, stage: number, scale: number) {
  const stageSpec = spec.stages[stage];
  if (!stageSpec || stageSpec.dial === 'locked') throw new Error('no dial');
  const track = pinTrack(stageSpec);
  if (!track) throw new Error('no pin');
  const view = pinView(touchMachine(enterRoom(spec, stage).room)?.room ?? null);
  if (!view) throw new Error('no pin view');
  const slots = slotCount(track);
  const dial = dialLayout(scale, notchCount(stageSpec.dial));
  const pin = pinLayout(dial, { kind: track.kind, slots }, labelFontSize(scale));
  const reset = resetCorner(scale, fitOf(scale));
  const obstacles = tagObstacles(spec, stage, pin, slots, labelFontSize(scale), reset);
  const tag = pinTagLayout(hr.pin.questions[view.question], scale, pin, obstacles);
  return { tag, obstacles, pin };
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

describe('wrapWords', () => {
  it('breaks between words, never inside one', () => {
    // Croatian text stays in hr.ts (architecture.test.ts), so plain words stand in here.
    expect(wrapWords('Where will the scale balance?', 15)).toEqual([
      'Where will the',
      'scale balance?',
    ]);
    expect(wrapWords('a bb ccc', 100)).toEqual(['a bb ccc']);
    expect(wrapWords('balance?', 4)).toEqual(['balance?']);
    expect(wrapWords(hr.pin.questions['level-x'], 26)).toHaveLength(3);
    expect(wrapWords('  ', 10)).toEqual([]);
  });
});

describe('pinTagLayout (story 1.14)', () => {
  it('sets the question at least 20 CSS px at any scale', () => {
    for (const scale of [tablet, phone, 0.25, 0.9, 1]) {
      expect(tagFontSize(scale) * scale).toBeGreaterThanOrEqual(20);
    }
  });

  it.each([
    ['the tablet', tablet],
    ['640 × 360', phone],
  ])('never covers the pans, the dial, the pin or the machine in rooms 1–4 on %s', (_, scale) => {
    const stages = stagesWithPins();
    // Story 1.16: room 4 has no pin; r04.0 is the pinned wheel, as room 4 was.
    expect(stages.map(({ spec, stage }) => `${spec.id}.${stage}`)).toEqual([
      'r03.0',
      'r03.1',
      'r05.0',
      'r05.1',
      'r04.0',
    ]);
    expect(rooms[3]?.stages[0]?.pin).toBeUndefined();
    for (const { spec, stage } of stages) {
      const { tag, obstacles } = tagFor(spec, stage, scale);
      const hits = obstacles.filter((o) => overlaps(tag.box, o));
      expect(hits, `${spec.id}.${stage}`).toEqual([]);
      expect(tag.box.x).toBeGreaterThanOrEqual(0);
      expect(tag.box.y).toBeGreaterThanOrEqual(0);
      expect(tag.box.x + tag.box.width).toBeLessThanOrEqual(sceneSize.width);
      expect(tag.box.y + tag.box.height).toBeLessThanOrEqual(sceneSize.height);
      expect(tag.tie.y).toBeGreaterThanOrEqual(0);
    }
  });

  it('hangs on the holder where the pans leave room, and fits every line in the card', () => {
    for (const scale of [tablet, phone]) {
      for (const { spec, stage } of stagesWithPins()) {
        const { tag, pin } = tagFor(spec, stage, scale);
        const { charWidth } = pinTagGeometry;
        for (const line of tag.lines) {
          expect([...line].length * charWidth * tag.fontSize).toBeLessThan(tag.box.width);
        }
        expect(tag.lines.length * tag.lineHeight).toBeLessThan(tag.box.height);
        if (tag.spot === 'holder') {
          // Right above the holder, its string straight down to the cradle.
          expect(tag.box.y + tag.box.height).toBeLessThan(pin.hitArea.y);
          expect(Math.abs(tag.tie.x - pin.holderX)).toBeLessThan(pin.headRadius * 1.5);
          expect(tag.hole.x).toBeCloseTo(tag.tie.x);
          expect(tag.tie.x).toBeGreaterThan(tag.box.x);
          expect(tag.tie.x).toBeLessThan(tag.box.x + tag.box.width);
        } else {
          expect(tag.tie.y).toBeLessThan(tag.box.y);
        }
      }
    }
  });

  it('hangs on the holder on the tablet where the pans are up, and on the wall where x sinks', () => {
    const [, , r03] = rooms as RoomSpec[];
    if (!r03) throw new Error('room 3');
    expect(tagFor(r03, 0, tablet).tag.spot).toBe('holder');
    expect(tagFor(pinnedWheel, 0, tablet).tag.spot).toBe('holder');
    // Room 3, stage 2: 20 − x weighs 20 at x = 0, so the left pan hangs down over the holder.
    expect(tagFor(r03, 1, tablet).tag.spot).toBe('wall');
  });

  it('keeps clear of the reset control and the hint button under it in the area’s corner', () => {
    const onPhone = resetCorner(phone, phoneFit);
    expect(onPhone.x).toBeCloseTo(-phoneFit.x / phone);
    expect(onPhone.y).toBeCloseTo(0);
    expect(onPhone.width * phone).toBeCloseTo(72);
    // Story 1.16: the hint button, 72 CSS px down and 56 tall, with a gap below it.
    expect(onPhone.height * phone).toBeCloseTo(136);
    // On the tablet the scene is letterboxed below the reset control; the hint button reaches
    // just past the scene's top edge.
    const corner = resetCorner(tablet, tabletFit);
    expect((corner.y + corner.height) * tablet).toBeLessThanOrEqual(8 + 1e-9);
  });
});
