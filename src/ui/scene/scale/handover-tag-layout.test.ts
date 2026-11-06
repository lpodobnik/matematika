import { describe, expect, it } from 'vitest';
import { rooms } from '@/content/rooms';
import { r04 } from '@/content/rooms/r04-water-wheel';
import { hr } from '@/content/text/hr';
import { parse } from '@/math/parse';
import { tokenize } from '@/math/tokens';
import { setDial } from '@/room/dial';
import { touchMachine } from '@/room/phases';
import { confirmPin, pinTrack, setPin, slotValue } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import type { RoomSpec, RoomState, ToolId } from '@/room/types';
import { fitScene, sceneSize } from '@/ui/scene/fit-scene';
import type { Box } from '@/ui/scene/scale/dial-layout';
import {
  handoverAnchor,
  handoverObstacles,
  handoverTagGeometry,
  handoverTagLayout,
  isSceneHandover,
  type SceneHandover,
  wrapTagText,
} from '@/ui/scene/scale/handover-tag-layout';

// The 1280 × 800 tablet with the notebook beside the scene, and 640 × 360, where the scene
// fills the screen and the notebook slides over it (as in pin-tag-layout.test.ts).
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

/** A stage open for writing: touched, and its pin (if any) confirmed at its first place. */
function openStage(spec: RoomSpec, stage: number): RoomState {
  const room = step(touchMachine(enterRoom(spec, stage).room)).room;
  const stageSpec = spec.stages[stage];
  const track = stageSpec ? pinTrack(stageSpec) : null;
  if (!track) return room;
  return step(confirmPin(step(setPin(room, slotValue(track, 0))).room)).room;
}

/** The stage with the dial at x, wherever the stage left it. */
function atX(room: RoomState, x: number): RoomState {
  return room.stage.dialX === x ? room : step(setDial(room, x)).room;
}

/** Every x the dial reaches in the stage. */
function reachable(room: RoomState): number[] {
  const { dialOpen } = room.stage;
  const dial = room.spec.stages[room.stageIndex]?.dial;
  if (!dial || dial === 'locked') return [];
  const xs: number[] = [];
  for (let x = dialOpen.min; x <= dialOpen.max; x += dial.step) xs.push(x);
  return xs;
}

/** Balance moves wrote these lines (Balance `auto`); the last is on the pans, at the dial's x. */
function balancedTo(room: RoomState, ...lines: string[]): RoomState {
  let { stage } = room;
  for (const text of lines) {
    const tokens = tokenize(text);
    const parsed = parse(text);
    if (!tokens.ok || !parsed.ok) throw new Error(text);
    stage = {
      ...stage,
      lines: [
        ...stage.lines,
        {
          tokens: tokens.tokens,
          source: 'balance',
          verdict: { kind: 'valid', move: { kind: 'none' }, progress: true },
        },
      ],
      pans: parsed.equation,
    };
  }
  return { ...room, stage };
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** Each scene handover in each situation of rooms 1–4 it can show in. */
function situations(): { name: string; id: SceneHandover; room: RoomState; tools: ToolId[] }[] {
  const list: { name: string; id: SceneHandover; room: RoomState; tools: ToolId[] }[] = [];
  for (const spec of rooms) {
    spec.stages.forEach((stageSpec, index) => {
      if (stageSpec.dial === 'locked') return;
      const open = openStage(spec, index);
      for (const x of reachable(open)) {
        list.push({
          name: `${spec.id}.${index} x=${x}`,
          id: 'dial',
          room: atX(open, x),
          tools: [],
        });
      }
    });
  }
  const wheel = openStage(r04, 0);
  for (const x of reachable(wheel)) {
    list.push({ name: `r04 tray x=${x}`, id: 'tray', room: atX(wheel, x), tools: balance });
  }
  for (const line of ['2x + 8 = 26', '2x + 2 = 20', '2x + 20 = 38', '2x + 1 = 19']) {
    list.push({
      name: `r04 goal ${line}`,
      id: 'balance-goal',
      room: balancedTo(wheel, line),
      tools: balance,
    });
  }
  for (const line of ['2x = 18', '18 = 2x']) {
    list.push({
      name: `r04 splitter ${line}`,
      id: 'splitter',
      room: balancedTo(wheel, line),
      tools: balance,
    });
  }
  return list;
}

function tagFor(id: SceneHandover, room: RoomState, tools: ToolId[], fit: typeof tabletFit) {
  const anchor = handoverAnchor(id, room, fit.scale);
  if (!anchor) throw new Error('no anchor');
  const obstacles = handoverObstacles(id, room, tools, fit.scale, fit);
  return { tag: handoverTagLayout(hr.handover[id], fit.scale, anchor, obstacles), obstacles };
}

describe('wrapTagText', () => {
  it('breaks between words, and never starts a line with a dash', () => {
    // Croatian text stays in hr.ts (architecture.test.ts), so plain words stand in here.
    expect(wrapTagText('Move it – so x changes.', 9)).toEqual(['Move it –', 'so x', 'changes.']);
    expect(wrapTagText('a bb ccc', 100)).toEqual(['a bb ccc']);
    expect(wrapTagText('  ', 10)).toEqual([]);
    for (const text of Object.values(hr.handover)) {
      for (const wrap of handoverTagGeometry.wraps) {
        const lines = wrapTagText(text, wrap);
        expect(lines.join(' ')).toBe(text);
        for (const line of lines) expect(line.startsWith('–'), line).toBe(false);
      }
    }
  });
});

describe('handover tags in the scene (story 1.15)', () => {
  it('hangs only the scene handovers; write and check hang at the notebook', () => {
    expect(isSceneHandover('dial')).toBe(true);
    expect(isSceneHandover('balance-goal')).toBe(true);
    expect(isSceneHandover('write')).toBe(false);
    expect(isSceneHandover('check')).toBe(false);
    expect(isSceneHandover(null)).toBe(false);
  });

  it.each(screens)(
    'never covers the pans, the dial, the pin or the tools in rooms 1–4 on %s',
    (_, fit) => {
      for (const { name, id, room, tools } of situations()) {
        const { tag, obstacles } = tagFor(id, room, tools, fit);
        expect(
          obstacles.hard.filter((o) => overlaps(tag.box, o)),
          name,
        ).toEqual([]);
        expect(tag.box.x, name).toBeGreaterThanOrEqual(0);
        expect(tag.box.y, name).toBeGreaterThanOrEqual(0);
        expect(tag.box.x + tag.box.width, name).toBeLessThanOrEqual(sceneSize.width);
        expect(tag.box.y + tag.box.height, name).toBeLessThanOrEqual(sceneSize.height);
        expect(tag.fontSize * fit.scale).toBeGreaterThanOrEqual(20);
        for (const line of tag.lines) {
          expect([...line].length * handoverTagGeometry.charWidth * tag.fontSize).toBeLessThan(
            tag.box.width,
          );
        }
      }
    },
  );

  it.each(screens)(
    'hangs each tag on a short string clear of the pans, or from a nail, on %s',
    (_, fit) => {
      for (const { name, id, room, tools } of situations()) {
        const { tag, obstacles } = tagFor(id, room, tools, fit);
        if (tag.nail) {
          expect(tag.tie.y, name).toBeLessThan(tag.box.y);
          continue;
        }
        const length = Math.hypot(tag.tie.x - tag.hole.x, tag.tie.y - tag.hole.y);
        expect(length, name).toBeLessThanOrEqual(3 * tag.fontSize);
        for (let i = 1; i < 20; i += 1) {
          const point = {
            x: tag.hole.x + ((tag.tie.x - tag.hole.x) * i) / 20,
            y: tag.hole.y + ((tag.tie.y - tag.hole.y) * i) / 20,
          };
          const hit = obstacles.hard.find(
            (o) =>
              point.x > o.x && point.x < o.x + o.width && point.y > o.y && point.y < o.y + o.height,
          );
          expect(hit, name).toBeUndefined();
        }
      }
    },
  );

  it('ties room 1’s dial tag to the knob’s label from right above it, on the tablet', () => {
    const room = openStage(rooms[0] as RoomSpec, 0);
    const { tag } = tagFor('dial', room, [], tabletFit);
    expect(tag.nail).toBe(false);
    expect(tag.tie).toEqual(handoverAnchor('dial', room, tabletFit.scale)?.point);
    expect(tag.box.y + tag.box.height).toBeLessThan(tag.tie.y);
    expect(tag.coversMachine).toBe(false);
  });

  it('ties the tray and splitter tags to their tools, and nails the goal above the scale', () => {
    const wheel = openStage(r04, 0);
    for (const fit of [tabletFit, phoneFit]) {
      expect(tagFor('tray', wheel, balance, fit).tag.nail).toBe(false);
      expect(tagFor('splitter', balancedTo(wheel, '2x = 18'), balance, fit).tag.nail).toBe(false);
      const goal = tagFor('balance-goal', balancedTo(wheel, '2x + 8 = 26'), balance, fit).tag;
      expect(goal.nail).toBe(true);
    }
    // On the tablet the tray's tag stays clear of the machine. (Lane B's taller tray, with
    // + and − on its pieces, leaves no room under the shelf, so the tag may hang above it.)
    const tray = tagFor('tray', wheel, balance, tabletFit).tag;
    expect(tray.coversMachine).toBe(false);
  });
});
