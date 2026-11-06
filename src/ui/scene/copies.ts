// Story 1.13's tablet profile (NFR1: 60 FPS while dragging the dial in a three-machine
// room). Until linked machines arrive in epic 4, the dev panel can draw the whole scene,
// machine, steam, scale, dial, pin, tray and splitter, as copies side by side inside the
// one 1600 × 1000 logical scene. Each copy is the full scene at 1/count of its size, in a
// row, centred top to bottom, so the copies never overlap and all of them stay on screen.

import { sceneSize } from '@/ui/scene/fit-scene';

/** Where one copy of the scene sits inside the logical scene, and its size. */
export interface CopyPlacement {
  x: number;
  y: number;
  /** The copy's size as a share of the scene's; its CSS px per unit is the scene's times this. */
  scale: number;
}

/** The copies' places, left to right; one copy is the scene itself, unscaled. */
export function copyPlacements(
  count: number,
  size: { width: number; height: number } = sceneSize,
): CopyPlacement[] {
  const copies = Number.isInteger(count) && count > 0 ? count : 1;
  const scale = 1 / copies;
  const y = (size.height - size.height * scale) / 2;
  return Array.from({ length: copies }, (_, index) => ({
    x: size.width * scale * index,
    y,
    scale,
  }));
}
