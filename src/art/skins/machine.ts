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
//   latch      a bar across the door's front, with a knob, that holds the door down until the
//              check line; it slides left into a box on the left post to let the door rise
//   keepers    the latch's box on the left post and the staple on the right post it runs in
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
/** The latch bar: darker than the frame, so it reads as a heavy iron bar. */
const barFill = { color: palette.ink, alpha: 0.42 };
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

/** The door's two battens, as shares of its height from its top edge. */
export const doorBattens = [0.3, 0.7] as const;

/** The latch bar while it holds the door, relative to the machine's origin. */
export interface LatchBar {
  /** Its top and bottom edges. */
  top: number;
  bottom: number;
  /** Its ends: inside the left post's box, and through the right post's staple. */
  left: number;
  right: number;
  /** How far left it slides to let the door go: its right end ends inside the left post. */
  travel: number;
}

/**
 * The latch bar across the door's front. It sits where the door's lower batten reaches when
 * the door has risen `liftShare` of its travel, so a latched door rises until that batten
 * is up against the bar: the bar visibly holds it.
 */
export function latchBar(shape: MachineShape, liftShare: number): LatchBar {
  const { width, height, post } = shape;
  const thickness = post * 0.8;
  const bottom = height * (doorBattens[1] - liftShare);
  const left = -post * 0.6;
  const right = width + post * 0.7;
  return { top: bottom - thickness, bottom, left, right, travel: right - left };
}

/** The latch's knob: a short stem up from the bar near its right end, with a ball on top. */
function latchKnob(bar: LatchBar): { x: number; stemTop: number; ball: number } {
  const thickness = bar.bottom - bar.top;
  return {
    x: bar.right - thickness * 3,
    stemTop: bar.top - thickness * 0.7,
    ball: thickness * 0.32,
  };
}

/** The latch's box on the left post, which the bar and its knob slide into. */
export function latchBox(shape: MachineShape, bar: LatchBar) {
  const thickness = bar.bottom - bar.top;
  const knob = latchKnob(bar);
  const x = -shape.post * 1.3;
  const y = knob.stemTop - knob.ball - 3;
  return { x, y, width: shape.post * 0.15 - x, height: bar.bottom + thickness * 0.35 - y };
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
    for (const batten of doorBattens) {
      g.moveTo(8, height * batten).lineTo(width - 8, height * batten);
    }
    g.stroke(ink);
  },

  /**
   * The latch bar holding the door, with its knob: a heavy bar across the door's front,
   * shaded like iron, so a latched door reads as locked by its shape (NFR4). Drawn where it
   * holds the door; it slides out by its container's x.
   */
  latch(g: Graphics, bar: LatchBar): void {
    g.clear();
    const { top, bottom, left, right } = bar;
    const thickness = bottom - top;
    const knob = latchKnob(bar);
    g.rect(knob.x - thickness * 0.16, knob.stemTop, thickness * 0.32, top - knob.stemTop + 2)
      .fill(barFill)
      .stroke(fineInk);
    g.circle(knob.x, knob.stemTop, knob.ball).fill(lightFill).stroke(ink);
    g.roundRect(left, top, right - left, thickness, thickness * 0.3)
      .fill(barFill)
      .stroke(ink);
    g.moveTo(left + 6, (top + bottom) / 2)
      .lineTo(right - 6, (top + bottom) / 2)
      .stroke(fineInk);
  },

  /**
   * What the bar runs in, drawn over it: a box on the left post that it slides into, and a
   * staple on the right post that it passes through while it holds the door.
   */
  keepers(g: Graphics, shape: MachineShape, bar: LatchBar): void {
    g.clear();
    const { width, post } = shape;
    const thickness = bar.bottom - bar.top;
    const box = latchBox(shape, bar);
    g.roundRect(box.x, box.y, box.width, box.height, 4).fill(lightFill).stroke(ink);
    g.rect(box.x + 5, box.y + 5, box.width - 10, box.height - 10).fill(heavyFill);
    g.rect(width + post * 0.15, bar.top - thickness * 0.3, post * 0.7, thickness * 1.6)
      .fill(lightFill)
      .stroke(ink);
  },

  /**
   * Where the latch shows: between the posts' outer edges, with room for its knob. The bar
   * vanishes into its box on the left post as it slides out, instead of sliding past it.
   */
  latchMask(g: Graphics, shape: MachineShape, bar: LatchBar): void {
    g.clear();
    const box = latchBox(shape, bar);
    g.rect(-shape.post, box.y, shape.width + shape.post * 2, box.height).fill({ color: 0xffffff });
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
