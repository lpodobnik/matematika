import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { enterRoom } from '@/room/room';
import { type PieceView, scaleView } from '@/room/scale';
import type { RoomState } from '@/room/types';
import { fitScene } from '@/ui/scene/fit-scene';
import { dialLayout } from '@/ui/scene/scale/dial-layout';
import {
  baseLabelSize,
  beamPose,
  labelFontSize,
  labelWidth,
  layoutPan,
  minNumberCssPx,
  type PieceBox,
  pieceSize,
  readoutBox,
  scaleGeometry,
} from '@/ui/scene/scale/layout';

function roomWith(equation: string): RoomState {
  const first = r01.stages[0];
  if (!first) throw new Error('room 1 has no stage');
  return enterRoom({ ...r01, stages: [{ ...first, machines: [{ equation }] }] }).room;
}

function leftPieces(equation: string): PieceView[] {
  return scaleView(roomWith(equation)).left.pieces;
}

function overlaps(a: PieceBox, b: PieceBox): boolean {
  const apart =
    a.x + a.width / 2 <= b.x - b.width / 2 ||
    b.x + b.width / 2 <= a.x - a.width / 2 ||
    a.y <= b.y - b.height ||
    b.y <= a.y - a.height;
  return !apart;
}

describe('beamPose', () => {
  it('holds both pans at the same height when level', () => {
    const pose = beamPose(0);
    expect(pose.rotation).toBeCloseTo(0);
    expect(pose.left.y).toBeCloseTo(pose.right.y);
    expect(pose.right.x - pose.left.x).toBeCloseTo(2 * scaleGeometry.beamHalfLength);
  });

  it('lowers the heavier side: positive tilt is the left side heavier', () => {
    const leftHeavy = beamPose(5);
    expect(leftHeavy.left.y).toBeGreaterThan(leftHeavy.right.y);
    const rightHeavy = beamPose(-5);
    expect(rightHeavy.right.y).toBeGreaterThan(rightHeavy.left.y);
  });

  it("shows room 1 at the dial's start with its right pan lower", () => {
    const pose = beamPose(scaleView(enterRoom(r01).room).tilt);
    expect(pose.right.y).toBeGreaterThan(pose.left.y);
  });

  it('turns the beam about the pivot by the tilt', () => {
    const pose = beamPose(15);
    const drop = 2 * scaleGeometry.beamHalfLength * Math.sin((15 * Math.PI) / 180);
    expect(pose.left.y - pose.right.y).toBeCloseTo(drop);
    expect((pose.left.y + pose.right.y) / 2).toBeCloseTo(
      scaleGeometry.pivot.y - scaleGeometry.postHeight,
    );
  });

  it('keeps the pans, at the largest tilt, inside the scene and above the floor', () => {
    for (const tilt of [-15, 15]) {
      const pose = beamPose(tilt);
      for (const pan of [pose.left, pose.right]) {
        expect(pan.x - scaleGeometry.panWidth / 2).toBeGreaterThan(0);
        expect(pan.x + scaleGeometry.panWidth / 2).toBeLessThan(1600);
        expect(pan.y).toBeLessThan(scaleGeometry.floorY);
      }
    }
  });
});

describe('labelFontSize', () => {
  it('uses the base size on the tablet beside the notebook, at least 20 CSS px', () => {
    // A 1280 × 800 tablet: the notebook takes 32 %, the scene gets 870 × 800.
    const { scale } = fitScene(1280 - 0.32 * 1280, 800);
    expect(labelFontSize(scale)).toBe(baseLabelSize);
    expect(labelFontSize(scale) * scale).toBeGreaterThanOrEqual(minNumberCssPx);
  });

  it('grows on a small viewport so numbers never show below 20 CSS px (fast-check)', () => {
    fc.assert(
      fc.property(fc.double({ min: 0.05, max: 4, noNaN: true }), (scale) => {
        expect(labelFontSize(scale) * scale).toBeGreaterThanOrEqual(minNumberCssPx);
        expect(labelFontSize(scale)).toBeGreaterThanOrEqual(baseLabelSize);
      }),
    );
    // 640 × 360 with the notebook beside the scene (240 px): 400 × 360.
    const { scale } = fitScene(400, 360);
    expect(labelFontSize(scale) * scale).toBeGreaterThanOrEqual(minNumberCssPx);
  });

  it('falls back to the base size before the scene has a size', () => {
    expect(labelFontSize(0)).toBe(baseLabelSize);
    expect(labelFontSize(Number.NaN)).toBe(baseLabelSize);
    expect(labelFontSize(Number.POSITIVE_INFINITY)).toBe(baseLabelSize);
  });
});

describe('pieceSize', () => {
  it('fits every label inside its piece', () => {
    const pieces = [
      ...leftPieces('27x + x : 3 + 5 905 − 7 = 9'),
      ...leftPieces('2 · 9 + 7 = 25'),
      ...leftPieces('20 − x = 6'),
    ];
    for (const fontSize of [44, 80]) {
      for (const piece of pieces) {
        const size = pieceSize(piece, fontSize);
        expect(labelWidth(piece.label, fontSize), piece.key).toBeLessThan(size.width);
        expect(fontSize, piece.key).toBeLessThan(size.height - size.dividerHeight);
      }
    }
  });

  it('makes a large gear larger than a small one, and gives a divider room under its gear', () => {
    const [large, onDivider, small] = leftPieces('13x + x : 3 + x = 9');
    if (!large || !onDivider || !small) throw new Error('expected three pieces');
    expect(pieceSize(large, 44).width).toBeGreaterThan(pieceSize(small, 44).width);
    expect(pieceSize(onDivider, 44).dividerHeight).toBeGreaterThan(0);
    expect(pieceSize(small, 44).dividerHeight).toBe(0);
  });
});

describe('layoutPan', () => {
  it("puts room 1's left pan in one centred row", () => {
    const boxes = layoutPan(leftPieces('x + 4 = 9'), baseLabelSize);
    expect(boxes.map((b) => b.key)).toEqual(['left-gear-0', 'left-weight-0']);
    expect(boxes.every((b) => b.y === 0)).toBe(true);
    const leftEdge = Math.min(...boxes.map((b) => b.x - b.width / 2));
    const rightEdge = Math.max(...boxes.map((b) => b.x + b.width / 2));
    expect(leftEdge).toBeCloseTo(-rightEdge);
  });

  it('stacks rows upward, keeps every row within the pan and never overlaps pieces', () => {
    for (const equation of ['12x + 5 = 9', '3x + 2 · 9 + 4 + 7 = 9', '2x + 5 = 23']) {
      for (const fontSize of [baseLabelSize, 80]) {
        const boxes = layoutPan(leftPieces(equation), fontSize);
        for (const box of boxes) {
          expect(box.x - box.width / 2).toBeGreaterThanOrEqual(-scaleGeometry.panWidth / 2 - 1e-9);
          expect(box.x + box.width / 2).toBeLessThanOrEqual(scaleGeometry.panWidth / 2 + 1e-9);
          expect(box.y).toBeLessThanOrEqual(0);
        }
        for (const [i, a] of boxes.entries()) {
          for (const b of boxes.slice(i + 1))
            expect(overlaps(a, b), `${a.key} ${b.key}`).toBe(false);
        }
      }
    }
  });

  it('keeps 12 gears on the pan in several rows', () => {
    const boxes = layoutPan(leftPieces('12x = 9'), baseLabelSize);
    expect(boxes).toHaveLength(12);
    expect(new Set(boxes.map((b) => b.y)).size).toBeGreaterThan(1);
  });

  it('gives a piece wider than the pan a row of its own', () => {
    const wide = leftPieces('9 999 999 + 9 999 999 + x = 9');
    const boxes = layoutPan(wide, 200);
    expect(new Set(boxes.map((b) => b.y)).size).toBe(boxes.length);
  });
});

describe('readoutBox', () => {
  // The tablet beside the notebook, then 640 × 360 with the notebook beside the scene.
  const screens = [fitScene(1280 - 0.32 * 1280, 800).scale, fitScene(400, 360).scale].map(
    (scale) => ({ scale, fontSize: labelFontSize(scale) }),
  );
  // Rooms 1–4 reach 23; room 11's 5 905 must fit on the tablet.
  const labelsFor = (fontSize: number) =>
    fontSize === baseLabelSize ? ['0', '9', '23', '120', '5\u202f905'] : ['0', '9', '23', '120'];

  it("hangs each side's readout under the outer half of its own pan", () => {
    const left = readoutBox('left', '4', baseLabelSize);
    const right = readoutBox('right', '9', baseLabelSize);
    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeGreaterThan(0);
    expect(right.x).toBe(-left.x);
    // Under the dish, which is 18 units deep.
    expect(left.y - left.height / 2).toBeGreaterThan(18);
  });

  it('fits its number, and keeps clear of the post and the beam', () => {
    for (const { fontSize } of screens) {
      for (const label of labelsFor(fontSize)) {
        const box = readoutBox('left', label, fontSize);
        expect(labelWidth(label, fontSize), label).toBeLessThan(box.width);
        expect(fontSize).toBeLessThan(box.height);
        expect(box.x + box.width / 2, `${label} at ${fontSize}`).toBeLessThan(-6);
      }
    }
  });

  it('stays inside the scene, and above the dial, at the largest tilt', () => {
    for (const { scale, fontSize } of screens) {
      const dial = dialLayout(scale, 20);
      const dialTop = dial.trackY - Math.max(dial.knob.height, dial.tickHeight * 2) / 2;
      for (const tilt of [-15, 15]) {
        const pose = beamPose(tilt);
        for (const label of labelsFor(fontSize)) {
          const left = readoutBox('left', label, fontSize);
          const right = readoutBox('right', label, fontSize);
          expect(pose.left.x + left.x - left.width / 2).toBeGreaterThan(0);
          expect(pose.right.x + right.x + right.width / 2).toBeLessThan(1600);
          for (const [pan, box] of [
            [pose.left, left],
            [pose.right, right],
          ] as const) {
            expect(pan.y + box.y + box.height / 2).toBeLessThan(dialTop);
          }
        }
      }
    }
  });
});
