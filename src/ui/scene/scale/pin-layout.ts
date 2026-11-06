// Where the prediction pin sits in the 1600 × 1000 logical scene (architecture, Pattern 2,
// Pin; Consistency Rules: Gesture sizes). Presentation only: where the pin can go and
// where it is come from room/pin.ts.
//
// The pin stands on the dial's band: its tip touches the dial's track line and its head,
// carrying its number, rides above the knob. An x pin's places line up with the dial's
// notches, so the pin stands over the notch it predicts; a pin that goes beyond the dial
// carries on past the dial's last notch. A choice pin has its options side by side under
// the scale. It waits in a holder left of its first place until he drags it on.
//
// Sizes are in CSS px where they are gestures: an x pin's places are as far apart as the
// dial's notches (24 CSS px), and the pin's hit area is at least 48 CSS px.

import { assert } from '@/lib/assert';
import type { PinView } from '@/room/pin';
import { type Box, type DialLayout, dialGeometry, minHitCssPx } from '@/ui/scene/scale/dial-layout';

export const pinGeometry = {
  /** Between the knob's top and the bottom of the pin's head (and its hit area), in scene units. */
  gap: 12,
  /** Between a choice pin's places, in CSS px: wide apart, as they mean opposite things. */
  choiceSpacingPx: 160,
  /** The holder is at least this far left of the first place, in CSS px. */
  holderGapPx: 72,
  /** The head's radius, as a share of the label size, so a two-digit number fits. */
  headScale: 0.95,
} as const;

export interface PinLayout {
  /** Scene units per CSS px. */
  unitsPerPx: number;
  /** CSS px of drag between places. */
  slotPx: number;
  /** Scene x of place 0, and scene units between places. */
  originX: number;
  spacing: number;
  /** The holder, in CSS px from place 0 (negative: to the left), and its scene x. */
  holderPx: number;
  holderX: number;
  /** Where the pin's tip touches: the top of the dial's ticks. */
  tipY: number;
  /** The head's centre and radius. */
  headY: number;
  headRadius: number;
  /** Where a drag can start, around the pin's head; relative to the pin's own x. */
  hitArea: Box;
  /** The places stand over the dial's notches, so places past the dial's end can be marked. */
  aligned: boolean;
  /** The track line's y, for the marks of places beyond the dial. */
  trackY: number;
  tickHeight: number;
  lineWidth: number;
}

interface Places {
  spacing: number;
  originX: number;
  aligned: boolean;
}

/**
 * Where the places go. `holderRoom` is how far left of place 0 the holder and half its hit
 * area reach, in scene units, for a given spacing: the places keep that much room from the
 * scene's left edge, so the holder can always be grabbed.
 */
function placeSpacing(
  view: Pick<PinView, 'kind' | 'slots'>,
  dial: DialLayout,
  hitHalf: number,
): Places {
  const span = view.slots - 1;
  const { unitsPerPx } = dial;
  if (view.kind === 'choice') {
    // Centred under the scale; narrower only if the holder would leave the scene.
    const widest = (dialGeometry.centerX - hitHalf) / (span / 2 + 0.75);
    const spacing = Math.min(pinGeometry.choiceSpacingPx * unitsPerPx, widest);
    return { spacing, originX: dialGeometry.centerX - (spacing * span) / 2, aligned: false };
  }
  // An x pin's holder sits holderGapPx left of place 0 (its places are never more than
  // 24 CSS px apart, so 0.75 of a place is always less).
  const minOrigin = hitHalf + pinGeometry.holderGapPx * unitsPerPx;
  const windowLeft = dial.window.x + (dial.window.width - dial.viewLength) / 2;
  const right = windowLeft + dial.viewLength;
  // In step with the dial's notches while the dial fits its window and the pin's places
  // fit it too; otherwise spread evenly across what is left of the window (the dial's track
  // then scrolls, so its notches can't be followed).
  const fits = dial.originX >= minOrigin && dial.originX + span * dial.spacing <= right;
  if (!dial.scrolls && fits) {
    return { spacing: dial.spacing, originX: dial.originX, aligned: true };
  }
  const left = Math.max(windowLeft, minOrigin);
  const spacing = span > 0 ? Math.min(dial.spacing, (right - left) / span) : dial.spacing;
  return { spacing, originX: left + (right - left - spacing * span) / 2, aligned: false };
}

/**
 * The pin's layout for the dial's layout (which carries the scene's scale) and the pin's
 * kind and number of places, with labels at `fontSize` scene units.
 */
export function pinLayout(
  dial: DialLayout,
  view: Pick<PinView, 'kind' | 'slots'>,
  fontSize: number,
): PinLayout {
  assert(view.slots >= 1, 'a pin has at least one place');
  const { unitsPerPx } = dial;
  const headRadius = fontSize * pinGeometry.headScale;
  // The hit area covers the head, from just above the knob, and is at least 48 CSS px.
  const hitSize = Math.max(headRadius * 2 + pinGeometry.gap, minHitCssPx * unitsPerPx);
  const { spacing, originX, aligned } = placeSpacing(view, dial, hitSize / 2);
  const slotPx = spacing / unitsPerPx;
  const holderPx = -Math.max(pinGeometry.holderGapPx, slotPx * 0.75);
  const knobTop = dial.trackY - dial.knob.height / 2;
  const headY = knobTop - pinGeometry.gap - headRadius;
  const hitBottom = knobTop - pinGeometry.gap / 2;
  return {
    unitsPerPx,
    slotPx,
    originX,
    spacing,
    holderPx,
    holderX: originX + holderPx * unitsPerPx,
    tipY: dial.trackY - dial.tickHeight / 2,
    headY,
    headRadius,
    hitArea: { x: -hitSize / 2, y: hitBottom - hitSize, width: hitSize, height: hitSize },
    aligned,
    trackY: dial.trackY,
    tickHeight: dial.tickHeight,
    lineWidth: dial.lineWidth,
  };
}

/** The scene x of a place, or of the holder (null). */
export function placeX(layout: PinLayout, slot: number | null): number {
  return slot === null ? layout.holderX : layout.originX + slot * layout.spacing;
}

/** How long the pin wiggles when it is offered for the first time (hint level 1). */
export const pinWiggleMs = 700;

/**
 * The first-use wiggle, sideways in scene units at `t` from 0 to 1: a few swings that
 * die away, ending where it started.
 */
export function pinWiggle(t: number, reach: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return Math.sin(clamped * Math.PI * 6) * (1 - clamped) * reach;
}

/** How long the pans show a wrong x pin's own tilt before they go back to the dial's x. */
export const pinRevealMs = 1600;
