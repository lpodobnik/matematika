// Tuning numbers from the GDD and the architecture. The GDD calls them all provisional
// until playtesting, so they live in this one object (architecture, Configuration).

export const tuning = {
  /**
   * Part 2 (GDD, Part 2: The Trail) is open: Luka switched it on for his son on 2026-11-18.
   * `main` deploys to his live save, and `hunt/switch.test.ts` pins this, so closing it again is
   * a deliberate change of two lines.
   */
  part2: { live: true },
  /** Part 2's scenes: an idle spell before help rises. A showing waits for his Dalje. */
  hunt: { idleMs: 60_000 },
  /** The little one following him (city/follow.ts): its gap, top speed and trail spacing. */
  follow: { gap: 96, speed: 400, spacing: 14, shyWithin: 240, beside: 72 },
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
  /** Story 1.14: until the check line, a latch holds the door, so lines lift it only this
   * share of its travel (the door shows progress × this). The lock slides the latch out,
   * then the door rises all the way. */
  doorLiftBeforeLock: 0.3,
  /** Architecture, Which x the pans show: a wrong line acted out tips the pans at least
   * this many degrees, so a near miss still shows. */
  jamMinTilt: 4,
  /** Architecture, Pattern 2 (Restart): a stage's lock or a room's restart that the UI
   * never reports done ends after this long, so a missed animation event never strands the
   * game. Longer than either animation (ui/scene/machine/layout.ts). */
  presentationTimeoutMs: 8000,
  /** Architecture, Pattern 2 (Resolution; story 1.14): on confirm the machine tests the
   * pin by turning the dial itself, one notch this often (a direction pin turns it all the
   * way to the dial's maximum: room 3's 20 notches take 2.4 s)… */
  pinTestNotchMs: 120,
  /** …and a pin beyond the dial has the pans weigh its x for this long instead. */
  pinRevealMs: 1600,
  /** GDD, Prediction: a right pin pays this many parts, once per stage. */
  predictionParts: 2,
  /** Architecture, Balance moves: the tray's weight and float are numbered 1 to this. */
  trayMaxNumber: 99,
  /** The tray's − and + repeat when held: the first repeat after this long… */
  trayRepeatDelayMs: 450,
  /** …then one step this often, until he lets go. The splitter's − and + repeat the same way. */
  trayRepeatMs: 110,
  /** Story 1.15 (GDD, Player Assistance): this long without an action of his in a stage,
   * and the current handover step's tag shows again, met or not. */
  hintIdleMs: 60_000,
  /** Story 2.7 (GDD, Player Assistance): this many jams in a row, and help climbs a level. */
  helpJams: 3,
  /** Story 1.15: until he first turns a dial, its knob nudges one notch right and back by
   * itself this often (presentation only)… */
  dialNudgeMs: 4000,
  /** …each nudge taking this long, there and back. */
  dialNudgeLengthMs: 600,
  /** Story 1.16: the hint button's second press shows the next move as a ghost (presentation
   * only): a knob, a tray piece or the splitter frame, its whole way taking this long… */
  hintGhostMs: 2400,
  /** …then shown again after this pause, for as long as the hint shows. */
  hintGhostPauseMs: 1200,
  /** The knob's ghost goes this many notches the right way, and back. */
  hintSlideNotches: 2,
  /** Architecture, Balance moves: the splitter is set to this many parts at the fewest (a
   * stage arrives with it)… */
  splitterMinParts: 2,
  /** …and this many at the most. */
  splitterMaxParts: 30,
  /** Architecture, Performance (Quality): the frame-time test starts timing this long after
   * the scene's first frame, so mount and texture-upload spikes don't count… */
  qualitySettleMs: 1000,
  /** …and times frames for this long, with all effects on. */
  qualityTestMs: 2000,
  /** The test judges the frame time at this percentile. */
  qualityPercentile: 95,
  /** Up to this frame time at the percentile gives `high`… */
  qualityHighMs: 18,
  /** …up to this one `medium`, and anything slower `low`. */
  qualityMediumMs: 25,
  /** GDD, Automaton fights. */
  fight: {
    /** Faces on each die. */
    dieSides: 6,
    /** Dice rolled each round without the 4th-die upgrade. */
    dice: 3,
    /** Dents he can take; the dent that empties the hull loses the fight. */
    hull: 3,
    /** Steam at the start of a fight. */
    steam: 10,
    /** Steam each blow costs. */
    steamPerBlow: 1,
    /** Armour landing on exactly 0 multiplies the reward by this. */
    cleanCutMultiplier: 2,
    /** Losing drops 1 / pileDivisor of his unspent parts, rounded down. */
    pileDivisor: 4,
    /** A beaten automaton rewinds this long after the win (ADR-13). */
    lairRewindMinutes: 5,
    /**
     * Each win against an automaton brings it back a level up, to this one (Luka, 2026-11-18:
     * his son grinds them). The level is the power the blade and charge dice are raised to:
     * level 2 squares them, `a² · x + b²`, level 3 cubes them. Armour per level is the lair's
     * (content/lairs.ts, set by simulation), and a win pays its reward times the level.
     */
    levels: 3,
  },
  /** GDD, Automaton fights: the three upgrades, their costs in parts and what they add. */
  upgrades: {
    'fourth-die': { cost: 30, dice: 1, steam: 0, hull: 0 },
    steam: { cost: 10, dice: 0, steam: 3, hull: 0 },
    hull: { cost: 20, dice: 0, steam: 0, hull: 1 },
    /** Part 2 (GDD, Fights in part 2): a strike can be `a · (x + b)`, on sale after the coat. */
    brackets: { cost: 30, dice: 0, steam: 0, hull: 0 },
  },
  /** Part 2 (GDD, The little one; Economy in part 2): what Faust sells for the little one. */
  gear: { lamp: 15, magnet: 25, 'long-hook': 20 },
  looks: {
    'paint-brass': 5,
    'paint-red': 5,
    'paint-blue': 5,
    'hat-cap': 8,
    'hat-top': 10,
    'hat-chef': 12,
  },
  /** Parts in each of Kristijan's caches (GDD, Exploration: secrets). */
  secretParts: 5,
} as const;
