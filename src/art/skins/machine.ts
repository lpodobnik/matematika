// Placeholder skin for a room's machine: grey ink on paper, drawn in code (architecture,
// Asset Management). Every machine uses it until its own skin arrives (epic 2's style
// guide, epic 6's final art). It is a door in a frame that rises with the machine's
// progress (the door lift's "door rises partway"), so progress shows continuously.
//
//   frame    two posts, a sill, and a housing at the top the door rises into
//   door     a panel of planks, drawn from its top edge down
//   jam      a wedge driven in beside the door and steam lines: shape as well as colour (NFR4)
//
// The machine is drawn with its origin at the opening's top-left corner.

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';

export interface MachineShape {
  /** The opening the door closes. */
  width: number;
  height: number;
  /** The housing above the opening, and the posts either side. */
  housing: number;
  post: number;
}

const ink = { width: 4, color: palette.ink };
const fineInk = { width: 2, color: palette.ink, alpha: 0.6 };
const heavyFill = { color: palette.ink, alpha: 0.16 };
const lightFill = { color: palette.paper };
const jamInk = { width: 6, color: palette.jam };

const planks = 5;

export const machineSkin = {
  /** The frame around the opening. */
  frame(g: Graphics, shape: MachineShape): void {
    g.clear();
    const { width, height, housing, post } = shape;
    g.rect(-post, 0, post, height).fill(heavyFill).stroke(ink);
    g.rect(width, 0, post, height).fill(heavyFill).stroke(ink);
    g.rect(-post * 1.5, height, width + post * 3, post * 0.6)
      .fill(heavyFill)
      .stroke(ink);
    g.roundRect(-post * 1.5, -housing, width + post * 3, housing, 8)
      .fill(lightFill)
      .stroke(ink);
    // Two pulleys on the housing, for the door's chains.
    for (const x of [width * 0.25, width * 0.75]) {
      g.circle(x, -housing / 2, housing * 0.28)
        .fill(lightFill)
        .stroke(fineInk);
    }
  },

  /** The opening's back wall, seen once the door rises. */
  opening(g: Graphics, shape: MachineShape): void {
    g.clear();
    g.rect(0, 0, shape.width, shape.height).fill({ color: palette.ink, alpha: 0.08 });
  },

  /** The door, from its top edge (y = 0) down to its bottom (y = height). */
  door(g: Graphics, shape: MachineShape): void {
    g.clear();
    const { width, height } = shape;
    g.rect(0, 0, width, height).fill(lightFill).stroke(ink);
    for (let i = 1; i < planks; i += 1) {
      g.moveTo((width * i) / planks, 6).lineTo((width * i) / planks, height - 6);
    }
    g.stroke(fineInk);
    g.moveTo(8, height * 0.3)
      .lineTo(width - 8, height * 0.3)
      .moveTo(8, height * 0.7)
      .lineTo(width - 8, height * 0.7)
      .stroke(ink);
  },

  /** The opening's outline, for masking the door to it. */
  mask(g: Graphics, shape: MachineShape): void {
    g.clear();
    g.rect(0, 0, shape.width, shape.height).fill({ color: 0xffffff });
  },

  /** A jammed machine: a wedge driven in at the door's side, and steam puffing out. */
  jam(g: Graphics, shape: MachineShape): void {
    g.clear();
    const { width, height, post } = shape;
    const y = height * 0.62;
    g.poly([
      width - 4,
      y - 36,
      width + post + 16,
      y - 10,
      width + post + 16,
      y + 10,
      width - 4,
      y + 36,
    ])
      .fill({ color: palette.jam, alpha: 0.25 })
      .stroke(jamInk);
    for (const [dx, dy] of [
      [0, -64],
      [22, -44],
      [34, -12],
    ] as const) {
      const x = width + post + 6 + dx;
      const top = y + dy;
      g.moveTo(x, top)
        .bezierCurveTo(x + 14, top - 10, x - 14, top - 24, x, top - 34)
        .stroke({ ...jamInk, width: 4 });
    }
  },
};
