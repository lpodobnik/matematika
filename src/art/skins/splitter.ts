// Placeholder skin for the splitter: grey ink on paper, drawn in code (architecture, Asset
// Management). Epic 6 replaces it. Its − and + buttons are the tray's (traySkin.button).
//
//   holder   a shallow rack in the scene's top-left corner, like the tray's shelf; the
//            frame's − and + sit on it, at the frame's end
//   frame    a divider frame (story 1.15): a box split by walls into n equal compartments,
//            under a tag that carries its number as `: n`, so it looks like what it does.
//            The number of compartments is the shape, never colour (NFR4)
//
// The holder is drawn in scene coordinates; a frame with its origin at its top-left corner.

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

export interface FrameShape {
  width: number;
  height: number;
  /** 2–9: the frame is walled into this many equal compartments. */
  parts: number;
  lineWidth: number;
}

export interface TagBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The tag on top of the frame, centred, that carries its number as `: n`. */
export function frameTag(shape: Pick<FrameShape, 'width' | 'height'>): TagBox {
  const height = shape.height * 0.38;
  const width = Math.min(shape.width, height * 2.1);
  return { x: (shape.width - width) / 2, y: 0, width, height };
}

/** The frame's box of compartments, under its tag. */
export function frameBody(shape: Pick<FrameShape, 'width' | 'height' | 'lineWidth'>): TagBox {
  const top = frameTag(shape).height - shape.lineWidth;
  return { x: 0, y: top, width: shape.width, height: shape.height - top };
}

/** Where the walls between the frame's compartments stand, from its left edge: n − 1 of them. */
export function wallXs(shape: Pick<FrameShape, 'width' | 'parts'>): number[] {
  const xs: number[] = [];
  for (let i = 1; i < shape.parts; i += 1) xs.push((i * shape.width) / shape.parts);
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

  /** The frame: a box walled into its compartments, open at the top, under its tag. */
  frame(g: Graphics, shape: FrameShape): void {
    g.clear();
    const { width, lineWidth } = shape;
    const ink = { width: lineWidth, color: palette.ink };
    const body = frameBody(shape);
    const floor = Math.min(body.height * 0.18, lineWidth * 4);
    g.rect(0, body.y, width, body.height).fill(lightFill).stroke(ink);
    // The floor the compartments stand on.
    g.rect(lineWidth / 2, body.y + body.height - floor, width - lineWidth, floor).fill(heavyFill);
    for (const x of wallXs(shape)) {
      g.moveTo(x, body.y)
        .lineTo(x, body.y + body.height)
        .stroke(ink);
    }
    const tag = frameTag(shape);
    g.roundRect(tag.x, tag.y, tag.width, tag.height, 8).fill(lightFill).stroke(ink);
  },
};
