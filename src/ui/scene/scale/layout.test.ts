import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  balloonEmblem,
  balloonParts,
  balloonSlice,
  gearSlice,
  type PieceShape,
  scaleSkin,
  slicedBody,
  sliceTag,
  tagOverlap,
} from '@/art/skins/scale';
import { r01 } from '@/content/rooms/r01-door-lift';
import { enterRoom } from '@/room/room';
import { type PieceView, scaleView } from '@/room/scale';
import type { RoomState } from '@/room/types';
import { fitScene } from '@/ui/scene/fit-scene';
import { dialLayout } from '@/ui/scene/scale/dial-layout';
import {
  balloonWidth,
  baseLabelSize,
  beamPose,
  grabArea,
  labelFontSize,
  labelWidth,
  layoutPan,
  minNumberCssPx,
  type PieceBox,
  pieceSize,
  pieceText,
  readoutBox,
  scaleGeometry,
  tagTextWidth,
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
  // The label sizes on the tablet beside the notebook and at 640 × 360 (see labelFontSize).
  const fontSizes = [baseLabelSize, labelFontSize(fitScene(400, 360).scale), 80];

  /** A label's box, centred on its spot, as wide as labelWidth says and a font size tall. */
  function textBox(spot: { x: number; y: number }, width: number, fontSize: number) {
    return {
      x0: spot.x - width / 2,
      x1: spot.x + width / 2,
      y0: spot.y - fontSize / 2,
      y1: spot.y + fontSize / 2,
    };
  }

  function shapeOf(piece: PieceView, fontSize: number): PieceShape {
    const size = pieceSize(piece, fontSize);
    const large = (piece.kind === 'gear' || piece.kind === 'spring') && piece.count > 1n;
    return { kind: piece.kind, ...size, large };
  }

  it('fits every label inside its piece', () => {
    const pieces = [
      ...leftPieces('27x + x : 3 + 5 905 − 7 = 9'),
      ...leftPieces('2 · 9 + 7 = 25'),
      ...leftPieces('20 − x = 6'),
      ...leftPieces('20 − x : 2 = 6'),
      ...leftPieces('20 − 27x = 6'),
      ...leftPieces('14x : 3 + x : 2 = 6'),
    ];
    for (const fontSize of fontSizes) {
      for (const piece of pieces) {
        const size = pieceSize(piece, fontSize);
        const shape = shapeOf(piece, fontSize);
        const text = textBox(
          scaleSkin.labelSpot(shape),
          labelWidth(pieceText(piece), fontSize),
          fontSize,
        );
        const label = `${piece.key} at ${fontSize}`;
        expect(text.x0, label).toBeGreaterThanOrEqual(-size.width / 2);
        expect(text.x1, label).toBeLessThanOrEqual(size.width / 2);
        expect(text.y0, label).toBeGreaterThanOrEqual(-size.height);
        expect(text.y1, label).toBeLessThanOrEqual(0);
        // A balloon's label is in its balloon, above its knot.
        if (shape.kind === 'float' || shape.kind === 'spring') {
          const balloon = balloonParts(shape);
          expect(text.y0, label).toBeGreaterThan(balloon.top);
          expect(text.y1, label).toBeLessThan(balloon.bottom);
        }
      }
    }
  });

  it('labels a spring’s balloon with its minus, `−x` or `−27x` (story 1.15)', () => {
    const [, small] = leftPieces('20 − x = 6');
    const [, large] = leftPieces('20 − 27x = 6');
    if (!small || !large) throw new Error('expected a weight and a spring');
    expect(small.kind).toBe('spring');
    expect(large.kind).toBe('spring');
    // Lane B labels a spring `−x` itself; the drawing never doubles the minus.
    expect(pieceText({ kind: 'spring', label: 'x' })).toBe('−x');
    expect(pieceText({ kind: 'spring', label: '27x' })).toBe('−27x');
    expect(pieceText({ kind: 'spring', label: '−x' })).toBe('−x');
    expect(pieceText(large)).toBe('−27x');
    expect(pieceText(small)).toBe('−x');
    expect(pieceText({ kind: 'gear', label: 'x' })).toBe('x');
    expect(pieceText({ kind: 'float', label: '−6' })).toBe('−6');
  });

  it('makes every minus the same balloon, a large one larger, with a gear emblem (story 1.15)', () => {
    const [, float] = leftPieces('20 − 6 = 6');
    const [, spring] = leftPieces('20 − x = 6');
    const [, large] = leftPieces('20 − 27x = 6');
    if (!float || !spring || !large) throw new Error('expected balloons');
    for (const fontSize of fontSizes) {
      const a = pieceSize(float, fontSize);
      const b = pieceSize(spring, fontSize);
      expect(a.width).toBeGreaterThanOrEqual(fontSize * balloonWidth);
      expect(b.width).toBeGreaterThanOrEqual(fontSize * balloonWidth);
      expect(pieceSize(large, fontSize).width).toBeGreaterThan(b.width);
      expect(pieceSize(large, fontSize).height).toBeGreaterThan(b.height);
      const emblem = balloonEmblem(shapeOf(spring, fontSize));
      expect(emblem.radius * 2).toBeGreaterThan(fontSize * 0.5);
    }
  });

  it('makes a large gear larger than a small one', () => {
    const [large, small] = leftPieces('13x + x = 9');
    if (!large || !small) throw new Error('expected two pieces');
    expect(pieceSize(large, 44).width).toBeGreaterThan(pieceSize(small, 44).width);
  });

  it('draws x : n as one slice of n with no divider under it, larger than a small gear (story 1.14)', () => {
    // Before story 1.14 the gear stood on a small divider gear, 3.5 label sizes tall in all.
    const [sliced, small] = leftPieces('x : 3 + x = 9');
    if (!sliced || !small) throw new Error('expected two pieces');
    for (const fontSize of fontSizes) {
      const size = pieceSize(sliced, fontSize);
      const body = slicedBody(shapeOf(sliced, fontSize));
      expect(size.slices).toBe(3);
      // The ghost gear is as tall as the piece: nothing stands under it.
      expect(body.width).toBeCloseTo(size.height);
      expect(size.height).toBeLessThan(fontSize * 3.5);
      expect(body.width).toBeGreaterThan(pieceSize(small, fontSize).width);
      // Its tag hangs beside it, inside the piece's box.
      expect(size.width).toBeCloseTo(body.width + size.tagWidth * (1 - tagOverlap));
      expect(pieceSize(small, fontSize)).toMatchObject({ slices: 0, tagWidth: 0, tagHeight: 0 });
    }
  });

  it('hangs the tag `: n` beside the slice, inside the piece, clear of the x and the slice', () => {
    const pieces = [
      ...leftPieces('x : 2 + x : 3 + 14x : 3 = 6'),
      ...leftPieces('20 − x : 2 = 6'),
      ...leftPieces('20 − x : 9 = 6'),
      ...leftPieces('x : 9 = 6'),
    ].filter((piece) => piece.divisorLabel !== null);
    expect(pieces.map((piece) => piece.divisorLabel)).toEqual([
      ': 2',
      ': 3',
      ': 3',
      ': 2',
      ': 9',
      ': 9',
    ]);
    const inside = (point: { x: number; y: number }, box: ReturnType<typeof textBox>) =>
      point.x > box.x0 && point.x < box.x1 && point.y > box.y0 && point.y < box.y1;
    const apart = (a: ReturnType<typeof textBox>, b: ReturnType<typeof textBox>) =>
      a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0;
    for (const fontSize of fontSizes) {
      for (const piece of pieces) {
        const shape = shapeOf(piece, fontSize);
        const label = `${piece.key} ${piece.divisorLabel} at ${fontSize}`;
        const tag = sliceTag(shape);
        const tagBox = textBox(tag, tag.width, tag.height);
        // The tag's text fits on it, right of its hole.
        const text = textBox(
          scaleSkin.tagSpot(shape),
          tagTextWidth(piece.divisorLabel ?? '', fontSize),
          fontSize,
        );
        expect(text.x0, label).toBeGreaterThanOrEqual(tagBox.x0 + tag.height * 0.32);
        expect(text.x1, label).toBeLessThanOrEqual(tagBox.x1);
        expect(fontSize, label).toBeLessThan(tag.height);
        // The tag is inside the piece's box, above the pan.
        expect(tagBox.x0, label).toBeGreaterThanOrEqual(-shape.width / 2 - 1e-9);
        expect(tagBox.x1, label).toBeLessThanOrEqual(shape.width / 2 + 1e-9);
        expect(tagBox.y0, label).toBeGreaterThanOrEqual(-shape.height - 1e-9);
        expect(tagBox.y1, label).toBeLessThanOrEqual(0);
        // It never covers x, nor the middle of the solid slice, so the slice shows.
        const x = textBox(
          scaleSkin.labelSpot(shape),
          labelWidth(pieceText(piece), fontSize),
          fontSize,
        );
        expect(apart(x, tagBox), label).toBe(true);
        if (shape.kind === 'gear') {
          const { centre, radius } = gearSlice(shape);
          expect(inside({ x: centre.x, y: centre.y + radius * 0.6 }, tagBox), label).toBe(false);
        } else {
          // Story 1.15: a divided spring is a balloon cut like the gear, its bottom slice solid.
          const { parts } = balloonSlice(shape);
          const middle = { x: parts.centre.x, y: (parts.centre.y + parts.bottom) / 2 };
          expect(inside(middle, tagBox), label).toBe(false);
        }
      }
    }
  });

  // Story 1.15 rewrites 1.14's "4 label sizes tall, arrow on top": the balloon is bigger, the
  // arrow is gone, and the whole piece is no taller than 1.14's.
  it('floats a bigger balloon well above the pan, in a box no taller than 1.14’s', () => {
    const [weight, float] = leftPieces('9 − 6 = 3');
    if (!weight || !float) throw new Error('expected a weight and a float');
    expect(float.label).toBe('−6');
    for (const fontSize of fontSizes) {
      const size = pieceSize(float, fontSize);
      expect(size.width).toBeLessThanOrEqual(pieceSize(weight, fontSize).width + fontSize);
      expect(size.width).toBeGreaterThan(fontSize * 1.8);
      expect(size.height).toBeLessThanOrEqual(fontSize * 4);
      // Its number sits in its balloon, which floats on its string above the pan.
      const balloon = balloonParts({ kind: 'float', ...size, large: false });
      expect(balloon.bottom - balloon.top).toBeGreaterThan(fontSize * 1.72);
      const text = textBox(balloon.centre, labelWidth(float.label, fontSize), fontSize);
      expect(text.y0).toBeGreaterThan(balloon.top);
      expect(text.y1).toBeLessThan(balloon.bottom);
      expect(balloon.knot).toBeLessThanOrEqual(-fontSize * 0.5);
    }
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

  it('ties balloons side by side in a bunch, the rest nestled above, strings to the pan (story 1.15)', () => {
    // On the tablet and at 640 × 360 (56: see labelFontSize).
    for (const fontSize of [baseLabelSize, labelFontSize(fitScene(640, 360).scale)]) {
      // 135 − 5x: a weight and five balloons; side by side they would need a second row.
      const pieces = leftPieces('135 − 5x = 100');
      const boxes = layoutPan(pieces, fontSize);
      expect(boxes.map((b) => b.key)).toEqual(pieces.map((p) => p.key));
      const [weight, ...balloons] = boxes;
      if (!weight) throw new Error('no weight');
      // Everything stands on the pan in one row, within the pan's width.
      for (const box of boxes) {
        expect(box.y).toBe(0);
        expect(box.x - box.width / 2).toBeGreaterThanOrEqual(-scaleGeometry.panWidth / 2 - 1e-9);
        expect(box.x + box.width / 2).toBeLessThanOrEqual(scaleGeometry.panWidth / 2 + 1e-9);
      }
      const ground = balloons.filter((b) => b.string === fontSize * 0.5);
      const above = balloons.filter((b) => b.string > fontSize * 0.5);
      expect(ground.length).toBeGreaterThanOrEqual(2);
      expect(above.length).toBeGreaterThan(0);
      // A balloon above floats on a longer string, by as much as it rises: the same balloon.
      const base = ground[0];
      if (!base) throw new Error('no balloon');
      for (const up of above) {
        expect(up.height - up.string).toBeCloseTo(base.height - base.string);
      }
      // The first one above floats in the gap between the first two below.
      const [first, second] = ground;
      const nestled = above[0];
      if (!first || !second || !nestled) throw new Error('no bunch');
      expect(nestled.x).toBeCloseTo((first.x + second.x) / 2);
      // Every balloon's label stays clear of every other's.
      const labelAt = (b: PieceBox) => {
        const shape = { kind: 'spring' as const, ...b, large: false };
        const spot = scaleSkin.labelSpot(shape);
        return { x: b.x + spot.x, y: b.y + spot.y };
      };
      for (const [i, a] of balloons.entries()) {
        for (const b of balloons.slice(i + 1)) {
          const p = labelAt(a);
          const q = labelAt(b);
          const apart =
            Math.abs(p.x - q.x) >= labelWidth('−x', fontSize) || Math.abs(p.y - q.y) >= fontSize;
          expect(apart, `${a.key} ${b.key}`).toBe(true);
        }
      }
      // So a pan of five balloons is far lower than two rows of them.
      const top = Math.max(...boxes.map((b) => b.height - b.y));
      expect(top).toBeLessThan(2 * (base.height + scaleGeometry.gap));
      if (fontSize === baseLabelSize) expect(top).toBeLessThanOrEqual(fontSize * 4.3);
    }
  });

  it('lays one balloon or two side by side, as before', () => {
    const one = layoutPan(leftPieces('20 − x = 6'), baseLabelSize);
    expect(one.map((b) => b.string)).toEqual([0, baseLabelSize * 0.5]);
    const two = layoutPan(leftPieces('20 − 2x = 6'), baseLabelSize);
    expect(two.filter((b) => b.string > 0).map((b) => b.string)).toEqual([
      baseLabelSize * 0.5,
      baseLabelSize * 0.5,
    ]);
    expect(new Set(two.map((b) => b.y))).toEqual(new Set([0]));
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

describe('grabArea', () => {
  it('is the piece’s own box, from its bottom centre, grown to the smallest grab size', () => {
    expect(grabArea(100, 88, 60)).toEqual({ x: -50, y: -88, width: 100, height: 88 });
    expect(grabArea(40, 40, 90)).toEqual({ x: -45, y: -65, width: 90, height: 90 });
  });
});
