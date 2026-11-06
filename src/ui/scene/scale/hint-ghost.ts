// The hint's ghosts (story 1.16): the second press of the hint button shows the exact next
// move in the scene as a ghost, presentation only, with no store change and no event.
// Where each ghost goes and how it fades, at a share t (0–1) of its way; HintGhost.tsx draws
// them and runs them again after a pause for as long as the hint shows.
//
//   knob    the dial's knob, faint, goes two notches the right way and back
//   piece   the tray piece, faint, rises from the tray, glides over the scale, splits into
//           one copy per pan (one copy goes to each side), and fades on them
//   frame   the splitter's divider frame, faint, glides from its holder over the scale,
//           and fades there

import { tuning } from '@/config/tuning';
import type { Point } from '@/ui/scene/scale/layout';

/** How strong a ghost is at its strongest: clearly not a real piece. */
export const ghostAlpha = 0.55;

/** One copy of a ghost: where it is, and how strong. */
export interface GhostCopy {
  x: number;
  y: number;
  alpha: number;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/** Eased in and out, 0 to 1. */
function ease(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** The share of a part of the way, from `from` to `to` of t. */
function part(t: number, from: number, to: number): number {
  return clamp01((t - from) / (to - from));
}

/**
 * Where a ghost is in its loop, `elapsedMs` after the press: its share of the way, or null
 * during the pause before it shows again.
 */
export function ghostLoop(
  elapsedMs: number,
  showMs: number = tuning.hintGhostMs,
  pauseMs: number = tuning.hintGhostPauseMs,
): number | null {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0;
  const at = elapsedMs % (showMs + pauseMs);
  return at <= showMs ? at / showMs : null;
}

/**
 * How far the knob's ghost is from the knob at t: out to `reach` (scene units, negative to
 * the left) and back, eased, holding a moment at the far end. It fades in and out with it.
 */
export function knobGhost(t: number, reach: number): GhostCopy {
  const out = ease(part(t, 0, 0.4));
  const back = ease(part(t, 0.6, 1));
  const fade = Math.min(part(t, 0, 0.1), 1 - part(t, 0.9, 1));
  return { x: reach * (out - back), y: 0, alpha: ghostAlpha * fade };
}

/** Where a tray piece's ghost goes: from the tray, over the scale, onto each pan. */
export interface PiecePath {
  /** The piece on the tray (its bottom centre). */
  from: Point;
  /** How far it rises out of the tray first. */
  rise: number;
  /** Over the scale, where it splits. */
  over: Point;
  /** Each pan's surface: one copy goes to each. */
  pans: readonly [Point, Point];
}

/** The tray piece's ghost at t: one copy, then two, one onto each pan, fading there. */
export function pieceGhost(t: number, path: PiecePath): GhostCopy[] {
  const up = { x: path.from.x, y: path.from.y - path.rise };
  const fadeIn = part(t, 0, 0.1);
  if (t < 0.55) {
    const at =
      t < 0.2
        ? lerp(path.from, up, ease(part(t, 0, 0.2)))
        : lerp(up, path.over, ease(part(t, 0.2, 0.55)));
    return [{ ...at, alpha: ghostAlpha * fadeIn }];
  }
  const split = ease(part(t, 0.55, 0.85));
  const alpha = ghostAlpha * (1 - part(t, 0.85, 1));
  return path.pans.map((pan) => ({ ...lerp(path.over, pan, split), alpha }));
}

/** The splitter frame's ghost at t, by its top-left corner: from its holder over the scale. */
export function frameGhost(t: number, from: Point, to: Point): GhostCopy {
  const at = lerp(from, to, ease(part(t, 0.05, 0.6)));
  const alpha = ghostAlpha * Math.min(part(t, 0, 0.1), 1 - part(t, 0.8, 1));
  return { ...at, alpha };
}

/**
 * The knob ghost's reach, in notches: `notches` the way of `direction`, as far as the dial
 * goes from notch `at` of `count`; 0 at the dial's end.
 */
export function slideReach(direction: 1 | -1, at: number, count: number, notches: number): number {
  const room = direction > 0 ? count - at : at;
  return direction * Math.max(0, Math.min(notches, room));
}
