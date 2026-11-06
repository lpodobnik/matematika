// Placeholder skin for the steam effect: one soft puff of grey ink, drawn once in code and
// turned into the texture every particle shares (ui/scene/effects/Steam.tsx). No colour:
// colour comes only with a restarted machine (NFR12).
//
//   puff   rings of ink, faint at the edge and denser at the centre, centred on its origin

import type { Graphics } from 'pixi.js';
import { palette } from '@/art/palette';

/** From the edge in: each ring's radius as a share of the puff's, and its ink. */
const rings = [
  { share: 1, alpha: 0.12 },
  { share: 0.78, alpha: 0.14 },
  { share: 0.52, alpha: 0.18 },
] as const;

export const steamSkin = {
  /** A puff of steam of the given radius, centred on its origin. */
  puff(g: Graphics, radius: number): void {
    g.clear();
    for (const { share, alpha } of rings) {
      g.circle(0, 0, radius * share).fill({ color: palette.ink, alpha });
    }
  },
};
