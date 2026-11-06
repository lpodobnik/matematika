// Where images must leave room for the parts drawn in code, in the 1600 × 1000 scene
// (art bible, "Camera and perspective" and "Housings frame the code-drawn scale").
//
// These are art targets read off the scale's layout in src/ui/scene/scale/layout.ts, which
// wins: scene-zones.test.ts fails when the scale moves out of them, and then these numbers
// and the art bible change together. This file imports nothing, so art-src/tools/quiet-zone.mjs
// can load it with Node directly.

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// On the tablet the pans and their pieces sweep x 65–1535 and y 243–739 for every GDD room
// (the test measures it); the zones add a margin of 20–40 round that.
export const sceneZones = {
  /** The backdrop's top band runs down to here (the top fifth): wall top, roofs, chimneys. */
  wallTop: 200,
  /** The wall's foot, with the ground below it (the bottom fifth). It may sit a little
   * higher, down to the pan zones' bottom, but the stand's foot must stand on the ground. */
  groundLine: 800,
  /** Plain wall behind the left pan and its pieces, at any tilt. */
  panLeft: { x0: 40, y0: 200, x1: 560, y1: 760 },
  /** Plain wall behind the right pan and its pieces, at any tilt. */
  panRight: { x0: 1040, y0: 200, x1: 1560, y1: 760 },
  /** The machine bay between the pans: the housing's whole footprint. */
  bay: { x0: 560, y0: 80, x1: 1040, y1: 850 },
  /** Inside the housing's columns: empty in every image, for the stand and the room's
   * moving part (door, gate, wheel), which the code draws. */
  opening: { x0: 600, y0: 200, x1: 1000, y1: 760 },
  /** Plain ground under the stand's foot, for the dial. */
  dial: { x0: 300, y0: 860, x1: 1300, y1: 1000 },
} as const satisfies Record<string, Rect | number>;
