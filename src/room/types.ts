// Room data and room state (architecture, Data Architecture and Pattern 2). Rooms are
// data: authored rooms, rooms built in the workshop and friends' rooms all use RoomSpec
// and the same engine, with no per-room code.

import type { Verdict } from '@/math/check';
import type { Equation } from '@/math/expr';
import type { LineToken, Token } from '@/math/tokens';

export type RoomId =
  | 'r01'
  | 'r02'
  | 'r03'
  | 'r04'
  | 'r05'
  | 'r06'
  | 'r07'
  | 'r08'
  | 'r09'
  | 'r10'
  | 'r11'
  | 'r12'
  | 'r13';

/** Which skin draws the machine (GDD, Puzzle Progression). */
export type MachineId =
  | 'door-lift'
  | 'street-lamps'
  | 'sluice-gate'
  | 'water-wheel'
  | 'bridge'
  | 'weighing-yard'
  | 'old-logbook'
  | 'tram'
  | 'steam-lift'
  | 'market-scales'
  | 'great-wheel'
  | 'junction'
  | 'clock-tower';

export type Side = 'left' | 'right';
export type ToolId = 'balance' | 'workshop' | 'chain' | 'drum';
export type WayId = 'try' | 'balance' | 'undo';
export type FadingMode = 'auto' | 'blanks' | 'blank';

export interface RoomSpec {
  id: RoomId | `built-${string}`;
  /** Which skin: 'door-lift', 'street-lamps', … */
  machine: MachineId;
  /** Design note in English: what x is here. Shown only through the skin, never as text. */
  xMeaning: string;
  stages: StageSpec[];
  earns: ToolId | null;
  /** Null for built and friends' rooms. */
  mapChange: string | null;
}

export interface MachineSpec {
  /** In school notation; parsed when the room loads. Content tests check every one. */
  equation: string;
}

/** The x dial's range: whole numbers from min to max, one notch per step (GDD, Mechanics). */
export interface DialSpec {
  min: number;
  max: number;
  /** In division forms, the divisor, so every notch is a multiple of it. */
  step: number;
}

export interface StageSpec {
  type: 'solve' | 'compare' | 'predict' | 'mistake' | 'story';
  /** 1–3; later ones may hold a ☐ fed by the previous answer. */
  machines: MachineSpec[];
  dial: DialSpec | 'locked';
  /** Overrides tuning.tiltPerUnit (1°) for this stage. */
  tiltPerUnit?: number;
  /** Number of dial positions open before the pin. */
  pokeNotches?: number | 'all';
  pin?: PinSpec;
  readouts: boolean;
  /** Ways that can finish. */
  ways: WayId[];
  fading: Partial<Record<WayId, FadingMode>>;
  /** Mistake rooms, and planted mistakes. */
  presetLines?: string[];
  /** Room 5: 22 becomes 25. */
  change?: { after: 'locked'; from: number; to: number };
  blinds?: { readouts?: true; stillPans?: true; shortDial?: number };
  drum?: true;
}

export type PinSpec =
  | { kind: 'level-x'; beyondDial?: true } // where it levels
  | { kind: 'x-hidden' } // compare: x before anything moves
  | { kind: 'wrong-line' } // find the mistake
  | { kind: 'story-choice' }
  | { kind: 'range'; bounds: number[] } // room 11: under 100, 100–300, over 300
  | { kind: 'next-dot' } // the drum
  | { kind: 'effect'; options: string[]; resolvesOn: 'first-notch' | 'level' }; // options are text keys

/** Pattern 2: arrive → poke (if pokeNotches) → pin (if pin) → open → locked → restart → done. */
export type Phase = 'arrive' | 'poke' | 'pin' | 'open' | 'locked' | 'restart' | 'done';

/** A committed notebook line (Data Architecture). Line 0, the stage equation, is `given`. */
export interface NotebookLine {
  tokens: Token[];
  source: 'given' | 'typed' | WayId;
  verdict: Verdict;
}

/** Pattern 2: a wrong line jams the machine until he edits it; a split jams until he drags the splitter off. */
export type Jam = { kind: 'line' } | { kind: 'split'; parts: number };

/**
 * The stage in play: the part of Pattern 2's `StageState` that the scale, the dial, the
 * notebook, the machine and the room's phases need so far. Later stories add the pin and
 * hints.
 */
export interface StageState {
  phase: Phase;
  /** Index of the active machine, 0–2. */
  machine: number;
  /** Committed lines only; [0] is the stage equation, read-only. A wrong line is never here. */
  lines: NotebookLine[];
  /**
   * The line he is writing; a wrong line's tokens stay here, marked by `jam`. While
   * `templates` has a line, the draft is what fills that line's blank.
   */
  draft: Token[];
  /**
   * Lines with a blank still to fill (Fading, `blanks`), the current one first: Try values
   * gives `x = ☐` and the check line with x blanked. Empty when he writes freely.
   */
  templates: LineToken[][];
  jam: Jam | null;
  /** How many times enter has refused a line in this stage; the notebook wiggles each time. */
  refused: number;
  /** Jams since the last committed line (hints from epic 2). */
  jamsInARow: number;
  /** 0–1 per machine: 0 is stopped, 1 is running; the skin shows it. */
  machineProgress: number[];
  /**
   * The last committed line plus exploratory moves. Writing a line replaces it with the
   * line's layout. While a line jam is set the scale acts out the jammed draft instead.
   */
  pans: Equation;
  /**
   * True from a committed line until the next exploring action (dial, tray, splitter):
   * the pans are weighed at the stage's solution, with `?` on the gears and no readouts.
   */
  actingOut: boolean;
  dialX: number;
  /** The part of the dial he can reach: the poke window (story 1.9), then the full range. */
  dialOpen: { min: number; max: number };
  /**
   * ctx.now when the machine began presenting the stage's lock or the room's restart (the
   * `locked` and `restart` phases); null in every other phase. The clock ends a presentation
   * the UI never reports done (Pattern 2, Restart).
   */
  presentedAt: number | null;
}

export interface RoomState {
  spec: RoomSpec;
  /** Index into spec.stages. */
  stageIndex: number;
  stage: StageState;
}
