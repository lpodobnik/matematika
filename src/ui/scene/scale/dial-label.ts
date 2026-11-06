// The slider's x label and its nudge (story 1.15). His first play showed that nothing said
// the dial was x, so a small plate rides above the knob, following it, and reads the x the
// pans are weighed at: always the dial's, `x = 9` (story 1.16: the slider is the only x;
// 1.15's `x = ?`, dimmed while the pans weighed the stage's solution, is gone). Until he
// first turns a dial, the knob nudges one notch right and back by itself
// (room/handover.ts, the `dial` step). Presentation only: which x comes from the store.

import { num, xVar } from '@/math/expr';
import { formatEquation } from '@/math/format';
import type { DialLayout } from '@/ui/scene/scale/dial-layout';
import { labelFontSize, labelWidth } from '@/ui/scene/scale/layout';

/** The label's text: `x = 9`. */
export function dialLabelText(x: number): string {
  return formatEquation({ left: xVar(), right: num(x) });
}

/**
 * The x the plate shows, from the machine's pin test (use-pin-test.ts) and the dial's x
 * (null with no dial): the x the pans are weighed at, so there is only ever one x.
 * - while the machine turns the dial to test a pin, the x it has turned to;
 * - while the pans weigh the x of a pin beyond the dial (no room 1–4 has one), that x;
 * - else the dial's x.
 */
export function dialLabelX(
  test: { dialX: number | null; weighX: number | null },
  dialX: number | null,
): number | null {
  return test.dialX ?? test.weighX ?? dialX;
}

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
 * The highest the label reaches, from the track's line, whatever x it shows (its height
 * doesn't depend on the text): what a tag keeps clear of above the dial
 * (handover-tag-layout.ts).
 */
export function dialLabelTop(layout: DialLayout, sceneScale: number): number {
  return dialLabelLayout(layout, dialLabelText(0), sceneScale).top;
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
