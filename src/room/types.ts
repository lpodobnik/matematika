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

/**
 * What an `effect` pin's options say will happen as x grows (story 1.15): the whole scale
 * tilts left (its left side goes down), or right. They are also the keys of their text in
 * `hr.pin.options`.
 */
export type EffectOption = 'tilt-left' | 'tilt-right';

export type PinSpec =
  | { kind: 'level-x'; beyondDial?: true } // where it levels
  | { kind: 'x-hidden' } // compare: x before anything moves
  | { kind: 'wrong-line' } // find the mistake
  | { kind: 'story-choice' }
  | { kind: 'range'; bounds: number[] } // room 11: under 100, 100–300, over 300
  | { kind: 'next-dot' } // the drum
  // predict what a change does; options are text keys. Like every pin, it resolves on
  // confirm, and the machine tests it (room/pin.ts; story 1.14).
  | { kind: 'effect'; options: EffectOption[] };

/** Where he put the pin: an x on the track, a line, an option, or a range's bucket. */
export type PinValue =
  | { kind: 'x'; x: number }
  | { kind: 'line'; index: number }
  | { kind: 'choice'; index: number }
  | { kind: 'bucket'; index: number };

/**
 * The prediction pin once he has put it somewhere (Pattern 2): it moves until he confirms
 * it (`locked`), and resolves once, as he confirms it (or, as a safety, when the stage locks).
 */
export interface PinState {
  value: PinValue;
  locked: boolean;
  resolved: boolean;
}

/**
 * The one-time handover tags (story 1.15; room/handover.ts), in the order he meets them: each
 * names the step its tag tells him to take next.
 */
export type HandoverId = 'dial' | 'write' | 'check' | 'tray' | 'balance-goal' | 'splitter';

/**
 * What he has met, so each shows only the first time (Pattern 2, First use): the controls
 * that wiggle once, the first time the game offers them (`pin`, `tray`, `splitter`), and
 * the handover steps he has taken (`handover-dial`, …; room/handover.ts). A handover's id
 * is its own, since the tray is met as it is offered and its handover only once he uses it.
 */
export type FirstUseId = 'pin' | 'tray' | 'splitter' | `handover-${HandoverId}`;

/** What the tray holds (Pattern 1, Balance moves): weights and floats only, never gears or springs. */
export type TrayKind = 'weight' | 'float';

/** The numbers set on the tray's weight and float, each 1–`tuning.trayMaxNumber`. */
export type TrayNumbers = Record<TrayKind, number>;

/** Pattern 2's hint ladder: 0 is none; 1 wiggles the piece he can move. Levels 2–4 come in epic 2. */
export type HintLevel = 0 | 1 | 2 | 3 | 4;

/** Pattern 2: arrive → poke (if pokeNotches) → pin (if pin) → open → locked → restart → done. */
export type Phase = 'arrive' | 'poke' | 'pin' | 'open' | 'locked' | 'restart' | 'done';

/** A committed notebook line (Data Architecture). Line 0, the stage equation, is `given`. */
export interface NotebookLine {
  tokens: Token[];
  source: 'given' | 'typed' | WayId;
  verdict: Verdict;
}

/**
 * Pattern 2: a wrong line jams the machine until he edits it. A split that doesn't divide
 * evenly is refused, never jammed (story 1.15).
 */
export type Jam = { kind: 'line' };

/**
 * What the stage remembers about Balance, so the tray and the splitter appear one at a
 * time (story 1.15; room/tray.ts, room/splitter.ts). Kept by reset: a tool once offered
 * in a stage stays.
 */
export interface BalanceMemory {
  /** Balance moves made this stage: tray drops, drag-offs and even splits. */
  moves: number;
  /** His dial has stood at its maximum this stage with the pans not level. */
  dialMaxed: boolean;
  /** He had met the tray before this stage (`save.progress.firstUse`; the root reducer). */
  trayMet: boolean;
  /** A Balance move left one side holding only x pieces, more than one x. */
  splitterSeen: boolean;
}

/**
 * The stage in play: the part of Pattern 2's `StageState` that the scale, the dial, the
 * pin, the notebook, the machine and the room's phases need so far. Story 1.15 adds
 * `lastActionAt` for the handover tags; epic 2 adds the rest of the hints, epic 4 the
 * drum. Paying for a right prediction is the root reducer's, in
 * `save.economy.paidPredictions` (story 1.14).
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
   * The last committed line, or where Balance moves left it (the tray and the splitter act
   * on both sides at once). Writing a line replaces it with the line's layout. While a line
   * jam is set the scale acts out the jammed draft instead.
   */
  pans: Equation;
  /** The numbers on the tray's weight and float (room/tray.ts); kept by reset. */
  tray: TrayNumbers;
  /**
   * The parts the splitter is set to, `tuning.splitterMinParts`–`splitterMaxParts`
   * (room/splitter.ts); kept by reset.
   */
  splitter: number;
  /** What the stage remembers about Balance, for offering its tools (story 1.15). */
  balance: BalanceMemory;
  /**
   * The scale acts out: from a committed line or a Balance move (story 1.15) until he turns
   * the dial. The pans are weighed at the stage's solution, so they hang level, with no
   * readouts; the gears show `x` either way.
   */
  actingOut: boolean;
  dialX: number;
  /** The part of the dial he can reach: the poke window until the pin is locked, then the full range. */
  dialOpen: { min: number; max: number };
  /** The prediction pin, once he has put it somewhere; null before (room/pin.ts). */
  pin: PinState | null;
  /** Pattern 2's hint level. Only the first-use wiggle sets it in epic 1 (room/first-use.ts). */
  hintLevel: HintLevel;
  /**
   * ctx.now at his last action in this stage that did something, or as the stage arrived;
   * null until the root reducer stamps it (room/handover.ts). The clock reads it.
   */
  lastActionAt: number | null;
  /**
   * `tuning.hintIdleMs` passed without an action of his in the stage: the current handover
   * step's tag shows again, met or not, until he acts (story 1.15).
   */
  idle: boolean;
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
