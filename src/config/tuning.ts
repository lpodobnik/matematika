// Tuning numbers from the GDD and the architecture. The GDD calls them all provisional
// until playtesting, so they live in this one object (architecture, Configuration).

export const tuning = {
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
    lairRewindMinutes: 15,
  },
  /** GDD, Automaton fights: the three upgrades, their costs in parts and what they add. */
  upgrades: {
    'fourth-die': { cost: 40, dice: 1, steam: 0, hull: 0 },
    steam: { cost: 20, dice: 0, steam: 3, hull: 0 },
    hull: { cost: 30, dice: 0, steam: 0, hull: 1 },
  },
} as const;
