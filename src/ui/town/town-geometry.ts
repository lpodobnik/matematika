import type { Point } from '@/city/walk';
import { type Rect, type TownPlace, town } from '@/content/town';
import type { RoomId } from '@/room/types';

export const pct = (p: Point) => ({
  left: `${(p.x / town.width) * 100}%`,
  top: `${(p.y / town.height) * 100}%`,
});

/**
 * Moves a figure to `at`, facing `facing` (1 right, -1 left), in front of what stands behind.
 * `picture` is the way its picture faces: it is mirrored only to face the other way.
 */
export function place(el: HTMLElement | null, at: Point, facing: 1 | -1, picture: 1 | -1 = -1) {
  if (!el) return;
  el.style.left = `${(at.x / town.width) * 100}%`;
  el.style.top = `${(at.y / town.height) * 100}%`;
  el.style.zIndex = String(Math.round(at.y));
  const img = el.firstElementChild as HTMLElement | null;
  if (img) img.style.transform = `scaleX(${facing * picture})`;
}

/**
 * The colour layer's mask: a soft circle of colour over each restored place. The room just
 * restored blooms open (town.css, `town-bloom`).
 */
export function bloomMask(
  restored: readonly Pick<TownPlace, 'bloom'>[],
  fresh: RoomId | null,
): string {
  if (restored.length === 0) return 'linear-gradient(transparent, transparent)';
  return restored
    .map((place) => {
      const { x, y, r } = place.bloom;
      const radius =
        'node' in place && place.node === fresh ? 'var(--bloom)' : `${(r / town.width) * 100}cqw`;
      return `radial-gradient(circle ${radius} at ${(x / town.width) * 100}% ${(y / town.height) * 100}%, #000 62%, transparent 100%)`;
    })
    .join(', ');
}

export const sameRect = (a: Rect, b: Rect) =>
  a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

/** A tap area's place over the board, in percent. */
export function rectStyle(rect: Rect) {
  return {
    left: `${(rect.x / town.width) * 100}%`,
    top: `${(rect.y / town.height) * 100}%`,
    width: `${(rect.w / town.width) * 100}%`,
    height: `${(rect.h / town.height) * 100}%`,
  };
}
