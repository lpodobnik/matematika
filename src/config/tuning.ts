// Tuning numbers from the GDD and the architecture. The GDD calls them all provisional
// until playtesting, so they live in this one object (architecture, Configuration).

export const tuning = {
  /** GDD, The scale: degrees of tilt per unit of difference between the sides. A stage
   * with big numbers overrides it with its own `tiltPerUnit`. */
  tiltPerUnit: 1,
  /** GDD, The scale: the tilt is clamped at ±15°. */
  tiltMax: 15,
  /** GDD, Piece kit: above this many x-gears (or springs) in one term, one large gear
   * shows the count instead. */
  maxSmallGears: 12,
  /** GDD, Controls and Input: the x dial moves one notch per 24 CSS px of drag. */
  dialNotchPx: 24,
  /** The most pad tokens a draft line holds; further keys are ignored. Room 11's check
   * line `5 905 − 27 · 207 = 316` is 15, so this only stops runaway typing. */
  draftMaxTokens: 40,
  /** Architecture, Machine progress: each valid line with progress moves the machine
   * this much, from 0 (stopped) toward 1 (running)… */
  progressStep: 0.2,
  /** …up to this much before the answer line… */
  progressCap: 0.8,
  /** …which sets this; the check line sets 1 and locks the machine. */
  progressAnswer: 0.9,
  /** Architecture, Which x the pans show: a wrong line acted out tips the pans at least
   * this many degrees, so a near miss still shows. */
  jamMinTilt: 4,
} as const;
