// Placeholder skin for the splitter: grey ink on paper, drawn in code (architecture, Asset
// Management). Epic 6 replaces it. Its − and + buttons are the tray's (traySkin.button).
//
//   holder   a shallow rack in the scene's top-left corner, like the tray's shelf
//   blade    a bar marked into its parts by ticks, under a tag that carries the number of
//            parts. Lying across the pans after a split that jams, it is long, each pan's
//            half is marked into the parts, and it is drawn in the jam's colour, never the
//            only signal: the machine shows its wedge and steam too (NFR4)
//
// The holder is drawn in scene coordinates; a blade with its origin at its top-left corner.

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';

const heavyFill = { color: palette.ink, alpha: 0.08 };
const lightFill = { color: palette.paper };

export interface HolderShape {
  x: number;
  y: number;
  width: number;
  height: number;
  lineWidth: number;
}

export interface BladeShape {
  width: number;
  height: number;
  /** 2–9: the bar is marked into this many equal parts. */
  parts: number;
  /** Marked once over its whole length (in the holder), or once over each pan's half. */
  halves: boolean;
  /** Lying across the pans after a split that jammed the machine. */
  jammed: boolean;
  lineWidth: number;
}

export interface TagBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The tag on top of a blade, centred, that carries the number of parts. */
export function bladeTag(shape: Pick<BladeShape, 'width' | 'height'>): TagBox {
  const height = shape.height * 0.55;
  const width = Math.min(shape.width, shape.height * 0.8);
  return { x: (shape.width - width) / 2, y: 0, width, height };
}

/** Where the ticks between a blade's parts stand, from its left edge. */
export function tickXs(shape: Pick<BladeShape, 'width' | 'parts' | 'halves'>): number[] {
  const sections = shape.halves ? 2 : 1;
  const section = shape.width / sections;
  const xs: number[] = [];
  for (let s = 0; s < sections; s += 1) {
    for (let i = 1; i < shape.parts; i += 1) xs.push(s * section + (i * section) / shape.parts);
  }
  return xs;
}

export const splitterSkin = {
  /** The rack the splitter waits in, with a lip along its bottom. */
  holder(g: Graphics, shape: HolderShape): void {
    g.clear();
    const { x, y, width, height, lineWidth } = shape;
    g.roundRect(x, y, width, height, 14)
      .fill(lightFill)
      .stroke({ width: lineWidth, color: palette.ink });
    const lip = Math.min(18, height * 0.1);
    g.rect(x + lineWidth, y + height - lip, width - lineWidth * 2, lip - lineWidth).fill(heavyFill);
  },

  /** The blade: a bar marked into its parts, under a tag for the number. */
  blade(g: Graphics, shape: BladeShape): void {
    g.clear();
    const { width, height, halves, jammed, lineWidth } = shape;
    const colour = jammed ? palette.jam : palette.ink;
    const ink = { width: lineWidth, color: colour };
    const tag = bladeTag(shape);
    const top = tag.height - lineWidth;
    const bar = height - top;
    g.roundRect(0, top, width, bar, bar * 0.3)
      .fill(lightFill)
      .stroke(ink);
    // The cutting edge along the bottom.
    g.rect(lineWidth, top + bar * 0.62, width - lineWidth * 2, bar * 0.38 - lineWidth).fill(
      heavyFill,
    );
    const tick = { width: lineWidth * 0.75, color: colour, alpha: 0.8 };
    for (const x of tickXs(shape)) {
      g.moveTo(x, top + lineWidth)
        .lineTo(x, top + bar - lineWidth)
        .stroke(tick);
    }
    if (halves) {
      g.moveTo(width / 2, top)
        .lineTo(width / 2, top + bar)
        .stroke(ink);
    }
    g.roundRect(tag.x, tag.y, tag.width, tag.height, 8).fill(lightFill).stroke(ink);
  },
};
