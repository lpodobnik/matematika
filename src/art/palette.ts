// The blueprint palette (art bible, Palette; story 2.12). Images are painted in these colours
// and code-drawn parts are filled with them. The tokens the UI uses are also custom properties
// at the top of src/app/app.css; palette.test.ts keeps the two in step.
//
// A stopped machine is ink on paper; colour, brass and copper come only with a restarted
// machine or part (NFR12). Buildings, stone and water stay muted, so the eye goes to the
// mechanism.
export const palette = {
  /** The image ground and the grey state's lights. */
  paper: 0xf4efe3,
  /** Aged edges of the paper. */
  paperShade: 0xe8e0ce,
  /** The desk round the page. */
  table: 0xd9d2c1,
  /** A sheet laid on the page, in the UI only: speech, explanation cards, an input. */
  sheet: 0xffffff,
  /** Every outline, the grey state's darks, numbers on weights: never black (7.8 : 1 on paper). */
  ink: 0x3d4b5c,
  /** Interior lines and hatching. */
  inkSoft: 0x6b7a8c,
  /** Construction lines and things not reached yet. */
  inkFaint: 0xa7b2be,
  /** Small darkest accents. */
  inkDeep: 0x26303b,
  /** Restored machine metal. */
  brass: 0xb8893a,
  /** Brass's hard highlight streak on the lit edge. */
  brassLight: 0xe2c07a,
  /** Brass's hatching on the shade side. */
  brassDark: 0x7a5a22,
  /** Pipes and valves. */
  copper: 0xb5603a,
  copperDark: 0x7a3a22,
  /** Patina on old pieces, a lens's tint. */
  verdigris: 0x5e9c8f,
  /** Frames and automatons. */
  iron: 0x59616b,
  /** Doors and buckets. */
  wood: 0x8a6a4a,
  /** Walls, very light. */
  stone: 0xd8cfbf,
  /** Terracotta roofs, muted. */
  roof: 0xb9654a,
  /** Still water, pale. */
  water: 0x7fa7b5,
  /**
   * The game's one red: a jammed machine, a wrong line, and the First Automaton's marks.
   * Never the only signal (NFR4).
   */
  jam: 0xa8432f,
  /**
   * A lit lamp and the restart's glow, in code only. A lit lamp also has rays, so colour is
   * never the only signal (NFR4).
   */
  lamp: 0xe0a33a,
  /** A lit lamp's light on paper, in the UI only: the goal banner once the goal is met. */
  lampWash: 0xf3dfb4,
} as const;

export type PaletteToken = keyof typeof palette;
