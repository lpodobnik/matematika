// Placeholder skin for a room's machine: grey ink on paper, drawn in code (architecture,
// Asset Management). Every machine uses it until its own skin arrives (epic 2's style
// guide, epic 6's final art). It is a door in a frame that rises with the machine's
// progress (the door lift's "door rises partway"), so progress shows continuously.
//
//   frame      two posts, a sill, and a housing at the top the door rises into
//   pulley     one of the housing's two pulleys, with spokes so it shows turning
//   lamp       a lamp on the housing, one per part of the machine (a room's stage)
//   lampLight  a lit lamp's flame and rays: shape as well as colour (NFR4)
//   door       a panel of planks, drawn from its top edge down
//   jam        a wedge driven in beside the door and steam lines: shape as well as colour (NFR4)
//   vent       a short pipe up out of the housing's top at its left end, where the steam rises
//
// The machine is drawn with its origin at the opening's top-left corner; a pulley and a
// lamp with theirs at their centre.

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';

export interface MachineShape {
  /** The opening the door closes. */
  width: number;
  height: number;
  /** The housing above the opening, and the posts either side. */
  housing: number;
  post: number;
  /** A lamp's glass radius, and the post it stands on, on top of the housing. */
  lamp: number;
  lampPost: number;
  /** The steam vent's pipe width. */
  vent: number;
}

const ink = { width: 4, color: palette.ink };
const fineInk = { width: 2, color: palette.ink, alpha: 0.6 };
const heavyFill = { color: palette.ink, alpha: 0.16 };
const lightFill = { color: palette.paper };
const jamInk = { width: 6, color: palette.jam };
const flame = { color: palette.lamp, alpha: 0.9 };
const rayInk = { width: 4, color: palette.lamp };

const planks = 5;
const spokes = 4;
const rays = 8;

/** A pulley's radius: a little over a quarter of the housing's height. */
export function pulleyRadius(shape: MachineShape): number {
  return shape.housing * 0.28;
}

/** How far a lit lamp's rays reach from its centre. */
export function lampRayReach(shape: MachineShape): number {
  return shape.lamp * 1.75;
}

/**
 * The vent pipe: it stands on the housing's top, one pipe width in from its left end, and
 * rises one pipe width. It stays over the housing, not past its left end, so the splitter's
 * holder in the scene's top-left corner (story 1.11) has the room left of the machine. `x`
 * is its centre line, `base` the housing's top, `top` its top under the lip.
 */
function ventPipe(shape: MachineShape): { x: number; base: number; top: number } {
  const { housing, post, vent } = shape;
  const base = -housing;
  return { x: -post * 1.5 + vent, base, top: base - vent };
}

/** Where steam leaves the vent: the middle of its lip's top. */
export function ventOutlet(shape: MachineShape): { x: number; y: number } {
  const { x, top } = ventPipe(shape);
  return { x, y: top - shape.vent * 0.35 };
}

/** The vent's left edge (its lip), relative to the machine's origin. */
export function ventLeft(shape: MachineShape): number {
  return ventPipe(shape).x - shape.vent * 0.7;
}

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
  },

  /** A pulley for the door's chains, centred on its axle, with spokes that show it turn. */
  pulley(g: Graphics, shape: MachineShape): void {
    g.clear();
    const radius = pulleyRadius(shape);
    g.circle(0, 0, radius).fill(lightFill).stroke(fineInk);
    for (let i = 0; i < spokes; i += 1) {
      const angle = (i * Math.PI) / spokes;
      const dx = Math.cos(angle) * radius * 0.8;
      const dy = Math.sin(angle) * radius * 0.8;
      g.moveTo(-dx, -dy).lineTo(dx, dy);
    }
    g.stroke(fineInk);
    g.circle(0, 0, radius * 0.22).fill({ color: palette.ink, alpha: 0.6 });
  },

  /** An unlit lamp, centred on its glass: a cap, the glass and its post down to the housing. */
  lamp(g: Graphics, shape: MachineShape): void {
    g.clear();
    const { lamp, lampPost } = shape;
    g.rect(-lamp * 0.18, lamp, lamp * 0.36, lampPost)
      .fill(heavyFill)
      .stroke(fineInk);
    g.circle(0, 0, lamp).fill(lightFill).stroke(ink);
    g.roundRect(-lamp * 0.7, -lamp * 1.35, lamp * 1.4, lamp * 0.45, 4)
      .fill(heavyFill)
      .stroke(fineInk);
  },

  /** A lit lamp's flame in its glass, and rays around it. Drawn over the lamp. */
  lampLight(g: Graphics, shape: MachineShape): void {
    g.clear();
    const { lamp } = shape;
    g.circle(0, 0, lamp * 0.72).fill(flame);
    const inner = lamp * 1.2;
    const outer = lampRayReach(shape);
    for (let i = 0; i < rays; i += 1) {
      const angle = (i * 2 * Math.PI) / rays;
      // The rays skip the lamp's post below it.
      if (Math.abs(angle - Math.PI / 2) < 0.1) continue;
      g.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner).lineTo(
        Math.cos(angle) * outer,
        Math.sin(angle) * outer,
      );
    }
    g.stroke(rayInk);
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

  /**
   * The steam vent: a pipe up out of the housing's top, with a lip. Drawn behind the frame,
   * so its foot runs down behind the housing and the pipe reads as coming out of it.
   */
  vent(g: Graphics, shape: MachineShape): void {
    g.clear();
    const { vent } = shape;
    const { x, base, top } = ventPipe(shape);
    g.rect(x - vent / 2, top, vent, base - top + vent / 2)
      .fill(heavyFill)
      .stroke(fineInk);
    g.rect(x - vent * 0.7, top - vent * 0.35, vent * 1.4, vent * 0.35)
      .fill(heavyFill)
      .stroke(fineInk);
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
