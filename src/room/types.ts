// Room data and room state (architecture, Data Architecture and Pattern 2). Rooms are
// data: authored rooms, rooms built in the workshop and friends' rooms all use RoomSpec
// and the same engine, with no per-room code.

import type { Verdict } from '@/math/check';
import type { Equation } from '@/math/expr';
import type { LineToken, Token } from '@/math/tokens';

/** Every authored room's id, in play order (the save checks the ids it reads against it). */
export const roomIds = [
  'r01',
  'r02',
  'r03',
  'r04',
  'r05',
  'r06',
  'r07',
  'r08',
  'r09',
  'r10',
  'r11',
  'r12',
  'r13',
] as const;

export type RoomId = (typeof roomIds)[number];

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
export const toolIds = ['balance', 'workshop', 'chain', 'drum'] as const;

/**
 * The ideas of the rooms that an explanation card names as school does (story 2.6): level
 * means equal, the same step per notch, a prediction, Balance, a split, judging without
 * adding, finding a mistake; and from epic 4, inverse operations (room 8) and x taken
 * away (room 9).
 */
export const ideaIds = [
  'equal',
  'notch',
  'prediction',
  'balance',
  'split',
  'compare',
  'mistake',
  'inverse',
  'take-away',
  'story',
  'simplify',
  'linked',
  'linear',
] as const;
export type IdeaId = (typeof ideaIds)[number];
export type ToolId = (typeof toolIds)[number];
export const wayIds = ['try', 'balance', 'undo'] as const;
export type WayId = (typeof wayIds)[number];
export type FadingMode = 'auto' | 'blanks' | 'blank';

export interface RoomSpec {
  id: RoomId | `built-${string}`;
  /** Which skin: 'door-lift', 'street-lamps', … */
  machine: MachineId;
  /** Design note in English: what x is here. Shown only through the skin, never as text. */
  xMeaning: string;
  stages: StageSpec[];
  earns: ToolId | null;
  /**
   * The ideas this room uses (story 2.6, FR34): the first room he finishes with an idea
   * explains it, on its story card. None for built and friends' rooms.
   */
  ideas?: readonly IdeaId[];
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
  /**
   * Story 4.6, too slow to drag (room 11): the track moves this many units per notch, and
   * − and + step one `step` at a time, so the slider still reaches every x (GDD).
   */
  coarse?: number;
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
  /** Story 4.2: the tray also holds an x-gear (GDD room 9: from here on). */
  trayGear?: true;
  /**
   * Story 4.7, a linked machine (room 12): this stage's equation holds the answer of stage
   * `from` as a weight, where `template` has ☐ (room/linked.ts).
   */
  fed?: { from: number; template: string };
  /**
   * Story 4.5, a story stage (room 10): `build`, a story he writes as the stage's equation
   * before the pans fill; or `options`, the stories a `story-choice` pin chooses among, each
   * with the equation it tells (content tests: exactly one is the stage's).
   */
  story?: { build?: StoryKey; options?: { key: StoryKey; equation: string }[] };
  drum?: true;
}

/** The stories of story stages (story 4.5), the keys of their text in `hr.stories`. */
export const storyKeys = ['wrench', 'five-cogs', 'box-two-cogs', 'box-nineteen'] as const;
export type StoryKey = (typeof storyKeys)[number];

/**
 * What an `effect` pin's options say will happen as x grows (story 1.15): the whole scale
 * tilts left (its left side goes down), or right. They are also the keys of their text in
 * `hr.pin.options`.
 */
export type EffectOption = 'tilt-left' | 'tilt-right';

export type PinSpec =
  | { kind: 'level-x'; beyondDial?: true } // where it levels
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
 * names the step its tag tells him to take next. Story 1.16 adds `answer`: x is alone on
 * the pans, so he writes how much x is.
 */
export const handoverIds = [
  'story',
  'dial',
  'rewrite',
  'write',
  'answer',
  'check',
  'tray',
  'balance-goal',
  'splitter',
  'chain',
] as const;

export type HandoverId = (typeof handoverIds)[number];

/**
 * What he has met, so each shows only the first time (Pattern 2, First use): the controls
 * that wiggle once, the first time the game offers them (`pin`, `tray`, `splitter`), and
 * the handover steps he has taken (`handover-dial`, …; room/handover.ts). A handover's id
 * is its own, since the tray is met as it is offered and its handover only once he uses it.
 * `fight-guide` is the guided first fight (fight/guide.ts), met once he has gone through it.
 */
export type FirstUseId = 'pin' | 'tray' | 'splitter' | 'fight-guide' | `handover-${HandoverId}`;

/**
 * What the tray holds (Pattern 1, Balance moves): weights and floats, and from room 9 an
 * x-gear (story 4.2; GDD room 9), which adds as many x as its stepper says to both sides.
 */
export type TrayKind = 'weight' | 'float' | 'gear';

/** The numbers set on the tray's weight and float, and its gear's count, each 1–`tuning.trayMaxNumber`. */
export type TrayNumbers = Record<TrayKind, number>;

/**
 * Pattern 2's hint ladder: 0 is none; 1 the tag and the wiggle; 2 the next move; 3 the line a
 * machine move writes, with blanks; 4 a worked example (room/help.ts, story 2.7).
 */
export type HintLevel = 0 | 1 | 2 | 3 | 4;

/** Pattern 2: arrive → poke (if pokeNotches) → pin (if pin) → open → locked → restart → done. */
export type Phase = 'arrive' | 'poke' | 'pin' | 'open' | 'locked' | 'restart' | 'done';

/** A committed notebook line (Data Architecture). Line 0, the stage equation, is `given`. */
export interface NotebookLine {
  tokens: Token[];
  /** `logbook`: someone else's line the stage opens with (room 7, story 2.10). */
  source: 'given' | 'typed' | 'logbook' | WayId;
  verdict: Verdict;
}

/**
 * Pattern 2: a wrong line jams the machine until he edits it. A split that doesn't divide
 * evenly is refused, never jammed (story 1.15).
 */
export type Jam = {
  kind: 'line';
  /**
   * Story 4.1: the jam is a gear chain run's wrong move, and these are the pans from before
   * it: an edit takes the whole move back and returns the pans here (with Undo `blank`, the
   * pans are ahead of the committed lines).
   */
  back?: Equation;
};

/**
 * Why enter refused a line with a tag, beyond the wiggle (story 1.16): `simplify`, an answer
 * line before the pans are simplified, in a stage that Try values can't finish
 * (room/notebook.ts, `answerAllowed`). Its text is in hr.ts (`hr.refusal`).
 */
export type Refusal = 'simplify' | 'story';

/**
 * What the stage remembers about Balance, so the tray and the splitter appear one at a
 * time (story 1.15; room/tray.ts, room/splitter.ts). Kept by reset: a tool once offered
 * in a stage stays.
 */
export interface BalanceMemory {
  /** Balance moves made this stage: tray drops, drag-offs and even splits. */
  moves: number;
  /**
   * The dial has stood at its maximum this stage with the pans not level: his notch, or the
   * machine's pin test leaving it there (room/dial.ts, `dialMaxedAt`).
   */
  dialMaxed: boolean;
  /** He had met the tray before this stage (`save.progress.firstUse`; the root reducer). */
  trayMet: boolean;
  /**
   * The splitter has been offered this stage (room/splitter.ts, `rememberSplitter`), so it
   * stays after a reset takes away the line or the pans that offered it.
   */
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
  /**
   * Why enter last refused a line with a tag (story 1.16), until he edits the draft or
   * enters again; null for none. The tag shows only while the reason still holds.
   */
  refusal: Refusal | null;
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
   * The slider's x: the only x (story 1.16). The pans are always weighed at it, after a
   * written line and a Balance move too; story 1.15's acting out at the stage's solution
   * is gone.
   */
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
   * The help ladder's level in this stage (story 2.7, room/help.ts): it climbs after
   * `tuning.hintIdleMs` without an action of his, and every `tuning.helpJams` jams in a
   * row; a line that moves him on takes it back to 0. Never saved or recorded.
   */
  help: HintLevel;
  /** ctx.now when help last climbed, so it climbs again only after another idle spell. */
  helpAt: number | null;
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
  /**
   * Find the mistake (story 2.10, room/logbook.ts): the logbook's wrong line, shown after
   * the committed lines but never committed, until found; null in any other stage.
   */
  planted: PlantedLine | null;
  /** The written line he tapped onto the scale, by its number, or null for the pans' own. */
  shownLine: number | null;
  /** He has tapped a line onto the scale in this stage (the tap's tag goes). */
  linesTapped: boolean;
  /**
   * Story 4.8: every x the slider has stood at in the stage, his notches and the machine's
   * pin test, for the recording drum's dots (room/drum.ts). Kept by reset; never saved.
   */
  tried: number[];
}

/** The logbook's wrong line in a find-the-mistake stage (room/logbook.ts). */
export interface PlantedLine {
  tokens: Token[];
  /** Its number in the notebook: after the committed lines it comes after. */
  line: number;
  /** He has found it (the mistake pin is tested): it is struck through, and he rewrites it. */
  found: boolean;
}

export interface RoomState {
  spec: RoomSpec;
  /** Index into spec.stages. */
  stageIndex: number;
  stage: StageState;
}
