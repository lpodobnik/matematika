// The slider's x label and its nudge (story 1.15). His first play showed that nothing said
// the dial was x, so a small plate rides above the knob, following it: `x = 9` while he
// explores, and `x = ?`, dimmed, while the scale acts a line out (a written line, or
// Balance), since then the pans weigh the stage's solution, not the dial's x. Until he first
// turns a dial, the knob nudges one notch right and back by itself (room/handover.ts, the
// `dial` step). Presentation only: which x and whether it acts out come from the store.

import { num, xVar } from '@/math/expr';
import { formatEquation, formatExpr } from '@/math/format';
import { hiddenXLabel } from '@/room/scale';
import type { DialLayout } from '@/ui/scene/scale/dial-layout';
import { labelFontSize, labelWidth } from '@/ui/scene/scale/layout';

/** The label's text: `x = 9`, or `x = ?` while the scale acts out (x null). */
export function dialLabelText(x: number | null): string {
  if (x === null) return `${formatExpr(xVar())} = ${hiddenXLabel}`;
  return formatEquation({ left: xVar(), right: num(x) });
}

/** How faint the label is while the scale acts out. */
export const dimmedLabelAlpha = 0.45;

export interface DialLabelLayout {
  /** At least 20 CSS px (NFR4), as the pieces' numbers. */
  fontSize: number;
  /** The plate, centred over the knob: its width for the text, and its height. */
  width: number;
  height: number;
  /** The plate's top and bottom, from the track's line (negative: above it). */
  top: number;
  bottom: number;
  /** The knob's top, from the track's line, where the plate's pointer reaches. */
  knobTop: number;
}

/**
 * The label's plate for the dial's layout and its text: right above the knob, a gap for
 * its pointer between them, and wide enough for the text with room to spare.
 */
export function dialLabelLayout(layout: DialLayout, text: string, sceneScale: number) {
  const fontSize = labelFontSize(sceneScale);
  const knobTop = -layout.knob.height / 2;
  const height = fontSize * 1.3;
  const bottom = knobTop - layout.lineWidth * 3;
  return {
    fontSize,
    width: labelWidth(text, fontSize) + fontSize * 0.6,
    height,
    top: bottom - height,
    bottom,
    knobTop,
  } satisfies DialLabelLayout;
}

/**
 * The highest the label reaches, from the track's line, whatever x it shows: what a tag
 * keeps clear of above the dial (handover-tag-layout.ts).
 */
export function dialLabelTop(layout: DialLayout, sceneScale: number): number {
  return dialLabelLayout(layout, dialLabelText(null), sceneScale).top;
}

/**
 * The knob's nudge at `t` (0–1 of a nudge): one notch over and back, eased in and out, so
 * it reads as the knob being pushed and settling. `reach` is a notch in scene units,
 * negative to nudge left (the knob at the right end of its reach).
 */
export function nudgeOffset(t: number, reach: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return Math.sin(Math.PI * clamped) ** 2 * reach;
}
