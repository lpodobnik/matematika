import { describe, expect, it } from 'vitest';
import { type Rect, sceneZones } from '@/art/scene-zones';
import { rooms } from '@/content/rooms';
import { r01 } from '@/content/rooms/r01-door-lift';
import { enterRoom } from '@/room/room';
import { scaleView } from '@/room/scale';
import { sceneSize } from '@/ui/scene/fit-scene';
import { baseLabelSize, beamPose, layoutPan, scaleGeometry } from '@/ui/scene/scale/layout';

// Every equation in the GDD's Puzzle Progression table (room 12's ☐ given its value), so
// the zones hold for rooms that have no RoomSpec yet.
const gddEquations = [
  'x + 4 = 9',
  '3x = 12',
  'x : 3 = 5',
  'x − 6 = 8',
  '20 − x = 6',
  '2x + 5 = 23',
  '3x + 4 = 22',
  '3x + 4 = 25',
  'x + 56 = 58 + 27',
  '3x − 1 = 17',
  '3x = 18',
  '4x + 9 = 41',
  '135 − 5x = 100',
  '60 + 3x = 90',
  '5 + 2x = 19',
  '5 905 − 27x = 316',
  '2x + 3 = 11',
  '3x + 5 = 19',
  '3x + 5 = 20',
  '50 − 4x = 34',
];

const roomEquations = rooms.flatMap((room) =>
  room.stages.flatMap((stage) => stage.machines.map((machine) => machine.equation)),
);

const tilts = [-15, -10, -5, 0, 5, 10, 15];

function viewOf(equation: string) {
  const first = r01.stages[0];
  if (!first) throw new Error('room 1 has no stage');
  return scaleView(enterRoom({ ...r01, stages: [{ ...first, machines: [{ equation }] }] }).room);
}

function inside(box: Rect, zone: Rect): boolean {
  return box.x0 >= zone.x0 && box.x1 <= zone.x1 && box.y0 >= zone.y0 && box.y1 <= zone.y1;
}

function overlap(a: Rect, b: Rect): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

/** The pan's tray (18 below its surface, as the skin draws it) and every piece on it. */
function panExtent(centre: { x: number; y: number }, boxes: ReturnType<typeof layoutPan>): Rect {
  const half = scaleGeometry.panWidth / 2;
  const top = Math.min(0, ...boxes.map((b) => b.y - b.height));
  return { x0: centre.x - half, y0: centre.y + top, x1: centre.x + half, y1: centre.y + 18 };
}

describe('sceneZones', () => {
  it('lie inside the scene', () => {
    for (const zone of [
      sceneZones.panLeft,
      sceneZones.panRight,
      sceneZones.bay,
      sceneZones.opening,
      sceneZones.dial,
    ]) {
      expect(zone.x0).toBeGreaterThanOrEqual(0);
      expect(zone.y0).toBeGreaterThanOrEqual(0);
      expect(zone.x1).toBeLessThanOrEqual(sceneSize.width);
      expect(zone.y1).toBeLessThanOrEqual(sceneSize.height);
    }
  });

  it("hold every room's pans and pieces at any tilt on the tablet, clear of the bay", () => {
    for (const equation of [...new Set([...gddEquations, ...roomEquations])]) {
      const view = viewOf(equation);
      const left = layoutPan(view.left.pieces, baseLabelSize);
      const right = layoutPan(view.right.pieces, baseLabelSize);
      for (const tilt of tilts) {
        const pose = beamPose(tilt);
        const leftPan = panExtent(pose.left, left);
        const rightPan = panExtent(pose.right, right);
        const label = `${equation} at ${tilt}°`;
        expect(inside(leftPan, sceneZones.panLeft), label).toBe(true);
        expect(inside(rightPan, sceneZones.panRight), label).toBe(true);
        expect(overlap(leftPan, sceneZones.bay), label).toBe(false);
        expect(overlap(rightPan, sceneZones.bay), label).toBe(false);
      }
    }
  });

  it("keep the beam's ends, 20 thick as the skin draws them, inside the pan zones", () => {
    for (const tilt of tilts) {
      const { rotation } = beamPose(tilt);
      const drop = scaleGeometry.beamHalfLength * Math.abs(Math.sin(rotation));
      const lowest = scaleGeometry.pivot.y + drop + 10;
      const highest = scaleGeometry.pivot.y - drop - 10;
      expect(lowest).toBeLessThanOrEqual(sceneZones.panLeft.y1);
      expect(highest).toBeGreaterThanOrEqual(sceneZones.panLeft.y0);
      expect(sceneZones.panLeft.y1).toBeLessThanOrEqual(sceneZones.groundLine);
    }
  });

  it('match the sweep the art bible quotes: x 65–1535 and y 243–739 on the tablet', () => {
    const sweep = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    const grow = (box: Rect) => {
      sweep.x0 = Math.min(sweep.x0, box.x0);
      sweep.y0 = Math.min(sweep.y0, box.y0);
      sweep.x1 = Math.max(sweep.x1, box.x1);
      sweep.y1 = Math.max(sweep.y1, box.y1);
    };
    for (const equation of [...new Set([...gddEquations, ...roomEquations])]) {
      const view = viewOf(equation);
      const left = layoutPan(view.left.pieces, baseLabelSize);
      const right = layoutPan(view.right.pieces, baseLabelSize);
      for (const tilt of tilts) {
        const pose = beamPose(tilt);
        grow(panExtent(pose.left, left));
        grow(panExtent(pose.right, right));
        const drop = scaleGeometry.beamHalfLength * Math.abs(Math.sin(pose.rotation));
        grow({ x0: 800, y0: scaleGeometry.pivot.y - drop - 10, x1: 800, y1: 600 + drop + 10 });
      }
    }
    expect(Math.round(sweep.x0)).toBe(65);
    expect(Math.round(sweep.x1)).toBe(1535);
    expect(Math.round(sweep.y0)).toBe(243);
    expect(Math.round(sweep.y1)).toBe(739);
  });

  it("put the stand in the housing's opening, its foot on the ground and the dial below it", () => {
    const { pivot, floorY } = scaleGeometry;
    const { opening, bay, dial, groundLine } = sceneZones;
    expect(pivot.x).toBe((opening.x0 + opening.x1) / 2);
    expect(pivot.y).toBeGreaterThan(opening.y0);
    expect(pivot.y).toBeLessThan(opening.y1);
    // The skin's foot: 320 wide and 26 tall, its top at floorY.
    const foot = { x0: pivot.x - 160, y0: floorY, x1: pivot.x + 160, y1: floorY + 26 };
    expect(inside(foot, bay)).toBe(true);
    expect(foot.y0).toBeGreaterThanOrEqual(groundLine);
    expect(dial.y0).toBeGreaterThan(foot.y1);
    expect(overlap(dial, sceneZones.panLeft)).toBe(false);
    expect(overlap(dial, sceneZones.panRight)).toBe(false);
  });
});
