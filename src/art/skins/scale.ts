// Placeholder skin for the scale and its pieces: grey ink on paper, drawn in code
// (architecture, Asset Management). Epic 6 replaces it. Every piece kind has its own shape,
// so none is told apart by colour alone (NFR4):
//
//   weight   a trapezoid block with a handle          float    a balloon on a tether
//   gear     a toothed wheel (more teeth when large)  spring   a coil under a cap
//   divider  a small toothed wheel under a gear or spring
//
// Pieces are drawn with their origin at the bottom centre, rising into negative y.

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';
import type { PieceKind } from '@/room/pieces';

const ink = { width: 4, color: palette.ink };
const fineInk = { width: 2, color: palette.ink, alpha: 0.6 };
const heavyFill = { color: palette.ink, alpha: 0.16 };
const lightFill = { color: palette.paper };

/** Where a piece's label is centred, from its bottom centre. */
export interface LabelSpot {
  x: number;
  y: number;
}

/** A piece's size and kind, as laid out on its pan. */
export interface PieceShape {
  kind: PieceKind;
  width: number;
  height: number;
  /** Height of the divider at the bottom, 0 for none. */
  dividerHeight: number;
  /** A large gear or spring, standing for more than 12 x. */
  large: boolean;
}

const floatTether = 0.22;
const springCap = 0.56;

function toothedWheel(g: Graphics, cx: number, cy: number, radius: number, teeth: number): void {
  const points: number[] = [];
  const steps = teeth * 4;
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    const r = i % 4 < 2 ? radius : radius * 0.84;
    points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  g.poly(points, true).fill(lightFill).stroke(ink);
  g.circle(cx, cy, radius * 0.62).stroke(fineInk);
}

export const scaleSkin = {
  /** The fixed stand: foot, post and pivot, with tick marks every 5° above the pivot. */
  stand(g: Graphics, pivot: { x: number; y: number }, floorY: number): void {
    g.clear();
    g.rect(pivot.x - 160, floorY, 320, 26)
      .fill(heavyFill)
      .stroke(ink);
    g.poly([
      pivot.x - 22,
      floorY,
      pivot.x - 12,
      pivot.y,
      pivot.x + 12,
      pivot.y,
      pivot.x + 22,
      floorY,
    ])
      .fill(lightFill)
      .stroke(ink);
    for (let degrees = -15; degrees <= 15; degrees += 5) {
      const angle = ((degrees - 90) * Math.PI) / 180;
      const inner = degrees === 0 ? 92 : 100;
      g.moveTo(pivot.x + inner * Math.cos(angle), pivot.y + inner * Math.sin(angle)).lineTo(
        pivot.x + 116 * Math.cos(angle),
        pivot.y + 116 * Math.sin(angle),
      );
    }
    g.stroke(ink);
  },

  /** The beam, centred on the pivot, with a needle that points straight up when level. */
  beam(g: Graphics, halfLength: number): void {
    g.clear();
    g.moveTo(0, 0)
      .lineTo(0, -96)
      .stroke({ ...ink, width: 5 });
    g.roundRect(-halfLength, -10, halfLength * 2, 20, 10)
      .fill(lightFill)
      .stroke(ink);
    g.circle(0, 0, 16).fill(heavyFill).stroke(ink);
  },

  /** A pan: its surface at y = 0, on a post down to the beam's end. */
  pan(g: Graphics, width: number, postHeight: number): void {
    g.clear();
    g.rect(-6, 0, 12, postHeight).fill(lightFill).stroke(ink);
    g.poly([-width / 2, 0, width / 2, 0, width / 2 - 24, 18, -width / 2 + 24, 18])
      .fill(heavyFill)
      .stroke(ink);
  },

  /** Draws one piece, with its divider when it has one. */
  piece(g: Graphics, shape: PieceShape): void {
    g.clear();
    const { kind, width, height, dividerHeight } = shape;
    if (kind === 'weight') {
      const body = height * 0.8;
      g.circle(0, -body, height * 0.14).stroke({ ...ink, width: 6 });
      g.poly([-width / 2, 0, width / 2, 0, (width * 0.78) / 2, -body, (-width * 0.78) / 2, -body])
        .fill(heavyFill)
        .stroke(ink);
      return;
    }
    if (kind === 'float') {
      const tether = height * floatTether;
      const balloon = height - tether;
      g.moveTo(0, 0).lineTo(0, -tether).stroke(fineInk);
      g.ellipse(0, -tether - balloon / 2, width / 2, balloon / 2)
        .fill(lightFill)
        .stroke(ink);
      // A small arrow under the balloon: it pulls the pan up.
      g.poly([-9, -tether + 2, 9, -tether + 2, 0, -tether - 10], true).fill({ color: palette.ink });
      return;
    }
    if (dividerHeight > 0) toothedWheel(g, 0, -dividerHeight / 2, dividerHeight / 2, 8);
    if (kind === 'gear') {
      toothedWheel(g, 0, -dividerHeight - width / 2, width / 2, shape.large ? 18 : 10);
      return;
    }
    const body = height - dividerHeight;
    const cap = body * springCap;
    const coil = body - cap;
    const turns = 5;
    g.moveTo(0, -dividerHeight);
    for (let i = 1; i <= turns * 2; i += 1) {
      const x = i === turns * 2 ? 0 : (i % 2 === 0 ? -1 : 1) * width * 0.3;
      g.lineTo(x, -dividerHeight - (coil * i) / (turns * 2));
    }
    g.stroke(ink);
    g.roundRect(-width / 2, -height, width, cap, cap / 2)
      .fill(lightFill)
      .stroke(ink);
    if (shape.large)
      g.roundRect(-width / 2 + 8, -height + 8, width - 16, cap - 16, cap / 2).stroke(fineInk);
  },

  /** Where a piece's number is centred. */
  labelSpot(shape: PieceShape): LabelSpot {
    const { kind, width, height, dividerHeight } = shape;
    if (kind === 'weight') return { x: 0, y: -(height * 0.8) / 2 };
    if (kind === 'float') {
      const tether = height * floatTether;
      return { x: 0, y: -tether - (height - tether) / 2 };
    }
    if (kind === 'gear') return { x: 0, y: -dividerHeight - width / 2 };
    return { x: 0, y: -height + ((height - dividerHeight) * springCap) / 2 };
  },

  /** Where the divider's number is centred. */
  dividerSpot(shape: PieceShape): LabelSpot {
    return { x: 0, y: -shape.dividerHeight / 2 };
  },
};
