// Room data and room state (architecture, Data Architecture and Pattern 2). Rooms are
// data: authored rooms, rooms built in the workshop and friends' rooms all use RoomSpec
// and the same engine, with no per-room code.

import type { Equation } from '@/math/expr';

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

export interface StageSpec {
  type: 'solve' | 'compare' | 'predict' | 'mistake' | 'story';
  /** 1–3; later ones may hold a ☐ fed by the previous answer. */
  machines: MachineSpec[];
  dial: { min: number; max: number; step: number } | 'locked';
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

/**
 * The stage in play: the part of Pattern 2's `StageState` that the scale needs so far.
 * Later stories add the notebook lines, draft, jam, machine progress, dial window and pin.
 */
export interface StageState {
  phase: Phase;
  /** Index of the active machine, 0–2. */
  machine: number;
  /** The last committed line plus exploratory moves; the scale draws it. */
  pans: Equation;
  dialX: number;
}

export interface RoomState {
  spec: RoomSpec;
  /** Index into spec.stages. */
  stageIndex: number;
  stage: StageState;
}
