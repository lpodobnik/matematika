import { describe, expect, it } from 'vitest';
import { r04 } from '@/content/rooms/r04-water-wheel';
import { hr } from '@/content/text/hr';
import { setDial } from '@/room/dial';
import { goalView } from '@/room/goal';
import { touchMachine } from '@/room/phases';
import { confirmPin, setPin } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import { splitBothPans } from '@/room/splitter';
import { dropOnScale, stepTray } from '@/room/tray';
import type { RoomSpec, RoomState, StageSpec, ToolId, TrayKind } from '@/room/types';
import { fitScene, sceneSize } from '@/ui/scene/fit-scene';
import type { Box } from '@/ui/scene/scale/dial-layout';
import {
  controlBoxes,
  goalCardBounds,
  goalCardLayout,
  goalCardObstacles,
} from '@/ui/scene/scale/goal-card-layout';
import {
  handoverAnchor,
  handoverObstacles,
  handoverTagLayout,
  type SceneHandover,
} from '@/ui/scene/scale/handover-tag-layout';
import { resetCorner } from '@/ui/scene/scale/pin-tag-layout';

// The 1280 × 800 tablet with the notebook beside the scene, and 640 × 360, where the scene
// fills the screen and the notebook slides over it (as in handover-tag-layout.test.ts).
const tabletFit = fitScene(1280 - 0.32 * 1280, 800);
const phoneFit = fitScene(640, 360);
const screens = [
  ['the tablet', tabletFit],
  ['640 × 360', phoneFit],
] as const;
const balance: ToolId[] = ['balance'];

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

/** Room 4 as story 1.16 plays it: no pin, no poke window (lane A takes them away). */
const pinless: RoomSpec = (() => {
  const { pin: _pin, pokeNotches: _poke, ...stage } = r04.stages[0] as StageSpec;
  return { ...r04, stages: [stage] };
})();

/** The stage opened, its pin (if any) confirmed at 9, and the dial at its end: the tray is offered. */
function opened(spec: RoomSpec): RoomState {
  let room = step(touchMachine(enterRoom(spec).room)).room;
  if (room.stage.phase === 'poke') {
    room = step(confirmPin(step(setPin(room, { kind: 'x', x: 9 })).room)).room;
  }
  for (let x = room.stage.dialX + 1; x <= 6; x += 1) room = step(setDial(room, x)).room;
  return room;
}

function dropped(room: RoomState, kind: TrayKind, n: number): RoomState {
  let current = room;
  while (current.stage.tray[kind] !== n) {
    const by = current.stage.tray[kind] < n ? 1 : -1;
    current = step(stepTray(current, balance, kind, by)).room;
  }
  return step(dropOnScale(current, balance, kind)).room;
}

const atX = (room: RoomState, x: number): RoomState =>
  room.stage.dialX === x ? room : step(setDial(room, x)).room;

/** Every situation of room 4 the card stands in: each Balance step, at each x the dial reaches. */
function situations(spec: RoomSpec): { name: string; room: RoomState }[] {
  const open = opened(spec);
  const twoX = dropped(open, 'float', 5);
  const stages = [
    ['2x + 5 = 23', open],
    ['2x + 2 = 20', dropped(open, 'float', 3)],
    ['2x + 8 = 26', dropped(open, 'weight', 3)],
    ['2x = 18', twoX],
    ['x = 9', step(splitBothPans(twoX, balance)).room],
  ] as const;
  const list: { name: string; room: RoomState }[] = [];
  for (const [name, room] of stages) {
    for (let x = 0; x <= 6; x += 1) list.push({ name: `${name} x=${x}`, room: atX(room, x) });
  }
  return list;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** The tags that can hang while the card stands: each scene handover's, and the hint's moves. */
const tagTexts: [SceneHandover, string][] = [
  ['dial', hr.handover.dial],
  ['dial', hr.hint.slide.right],
  ['tray', hr.handover.tray],
  ['tray', hr.hint.take('5', '−5')],
  ['tray', hr.hint.add('5', '5')],
  ['balance-goal', hr.handover['balance-goal']],
  ['splitter', hr.handover.splitter],
  ['splitter', hr.hint.split('2')],
];

describe('the goal card in the scene (story 1.16)', () => {
  it('stands in every situation of room 4 where the tray is offered', () => {
    for (const { name, room } of situations(pinless)) {
      expect(goalView(room, balance), name).not.toBeNull();
    }
  });

  it.each(screens)(
    'never covers the pans, the beam, the dial, the tray, the splitter or the HTML controls on %s',
    (_, fit) => {
      for (const spec of [pinless, r04]) {
        for (const { name, room } of situations(spec)) {
          const card = goalCardLayout(hr.goal.label, room, balance, fit.scale, fit);
          if (!card) throw new Error(`${spec.id} ${name}: no place for the card`);
          const { hard } = goalCardObstacles(room, balance, fit.scale, fit);
          expect(
            hard.filter((o) => overlaps(card.bounds, o)),
            name,
          ).toEqual([]);
          expect(card.bounds.x, name).toBeGreaterThanOrEqual(0);
          expect(card.bounds.y, name).toBeGreaterThanOrEqual(0);
          expect(card.bounds.x + card.bounds.width, name).toBeLessThanOrEqual(sceneSize.width);
          expect(card.bounds.y + card.bounds.height, name).toBeLessThanOrEqual(sceneSize.height);
          expect(card.fontSize * fit.scale).toBeGreaterThanOrEqual(20);
        }
      }
    },
  );

  it.each(screens)('stands clear of the machine too, in room 4 on %s', (_, fit) => {
    for (const { name, room } of situations(pinless)) {
      const card = goalCardLayout(hr.goal.label, room, balance, fit.scale, fit);
      if (!card) throw new Error(name);
      const { soft } = goalCardObstacles(room, balance, fit.scale, fit);
      expect(
        soft.filter((o) => overlaps(card.bounds, o)),
        name,
      ).toEqual([]);
    }
  });

  it.each(screens)('stays in one place while he works the stage on %s', (_, fit) => {
    const places = new Set(
      situations(pinless).map(({ room }) =>
        JSON.stringify(goalCardLayout(hr.goal.label, room, balance, fit.scale, fit)?.box),
      ),
    );
    expect(places.size).toBe(1);
  });

  it.each(screens)(
    'never covers a handover tag or a hint’s tag, which keep clear of it, on %s',
    (_, fit) => {
      for (const { name, room } of situations(pinless)) {
        const card = goalCardBounds(room, balance, fit.scale, fit);
        if (!card) throw new Error(name);
        for (const [id, text] of tagTexts) {
          const anchor = handoverAnchor(id, room, fit.scale);
          if (!anchor) continue;
          const obstacles = handoverObstacles(id, room, balance, fit.scale, fit);
          expect(obstacles.hard).toContainEqual(card);
          const tag = handoverTagLayout(text, fit.scale, anchor, obstacles);
          expect(overlaps(tag.box, card), `${name}: ${id}, ${text}`).toBe(false);
        }
      }
    },
    // It lays out every tag in every situation, about 7 s; a full parallel run needs room.
    30_000,
  );

  it('keeps clear of the reset control and the hint button under it, and the parts counter', () => {
    for (const [, fit] of screens) {
      const boxes = controlBoxes(fit.scale, fit);
      expect(boxes).toContainEqual(resetCorner(fit.scale, fit));
      // The parts counter's corner reaches the scene area's bottom-left corner.
      const parts = boxes[1] as Box;
      expect((parts.y + parts.height) * fit.scale + fit.y).toBeCloseTo(
        2 * fit.y + sceneSize.height * fit.scale,
      );
    }
    // The phone's notebook handle, by the area's right edge; the tablet has none.
    expect(controlBoxes(phoneFit.scale, phoneFit)).toHaveLength(3);
    expect(controlBoxes(tabletFit.scale, tabletFit)).toHaveLength(2);
  });

  it('is not in the scene, and keeps nothing clear, before the tray is offered', () => {
    const arrived = enterRoom(pinless).room;
    expect(goalCardBounds(arrived, balance, tabletFit.scale, tabletFit)).toBeNull();
  });
});
