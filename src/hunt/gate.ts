// The foundry gate (story 7.3; architecture, The gate and the switch). `city/reach.ts` keeps it
// sealed on the map; whether it opens is decided here. Opening is a ratchet: the dev panel's
// wake empties the lairs, and that must never shut it on his progress.

import type { HuntSave } from '@/hunt/types';
import { check } from '@/math/check';
import type { Equation } from '@/math/expr';
import { formatTokens } from '@/math/format';
import { parse } from '@/math/parse';
import type { Token } from '@/math/tokens';

export type GateState = 'sealed' | 'waiting' | 'ready' | 'opened';

export interface GateFacts {
  roomsDone: readonly string[];
  /** Whether he has ever beaten the boss: the record stays after it rewinds. */
  bossBeaten: boolean;
  hunt: Pick<HuntSave, 'gateOpened'>;
}

export function gateState({ roomsDone, bossBeaten, hunt }: GateFacts, on: boolean): GateState {
  if (!on) return 'sealed';
  if (hunt.gateOpened) return 'opened';
  return roomsDone.includes('r13') && bossBeaten ? 'ready' : 'waiting';
}

/** The plate on the door. Part 1's own checker judges it, so nothing new is needed here. */
export const gateEquation = '5 · x = 40';

/** The scene: the plate, then the empty foundry, then naming the little one. */
export type GatePhase = 'solve' | 'foundry' | 'name';

export interface GateScene {
  phase: GatePhase;
  /** What he has written so far, in order. */
  lines: string[];
  draft: Token[];
  /** A knock back from behind the door: his last line was wrong. */
  knockedBack: boolean;
  /** A line that didn't read: refused, with a wiggle. */
  refused: boolean;
}

export function newGateScene(): GateScene {
  return { phase: 'solve', lines: [], draft: [], knockedBack: false, refused: false };
}

export function gateScene(value: unknown): GateScene | null {
  if (typeof value !== 'object' || value === null) return null;
  const scene = value as Partial<GateScene>;
  if (scene.phase !== 'solve' && scene.phase !== 'foundry' && scene.phase !== 'name') return null;
  return {
    phase: scene.phase,
    lines: Array.isArray(scene.lines) ? scene.lines.filter((l) => typeof l === 'string') : [],
    draft: Array.isArray(scene.draft) ? (scene.draft as Token[]) : [],
    knockedBack: scene.knockedBack === true,
    refused: scene.refused === true,
  };
}

/** The draft's tokens, typed or deleted. */
export function gateType(scene: GateScene, token: Token, maxTokens: number): GateScene {
  if (scene.phase !== 'solve' || scene.draft.length >= maxTokens) return scene;
  return { ...scene, draft: [...scene.draft, token], knockedBack: false, refused: false };
}

export function gateDelete(scene: GateScene): GateScene {
  if (scene.phase !== 'solve' || scene.draft.length === 0) return scene;
  return { ...scene, draft: scene.draft.slice(0, -1), knockedBack: false, refused: false };
}

/**
 * His line goes in. `x = 8` and then the check line `5 · 8 = 40`, as in rooms: the check line
 * opens the door. A wrong line gets a knock back, at no cost.
 */
export function gateEnter(scene: GateScene): GateScene {
  if (scene.phase !== 'solve' || scene.draft.length === 0) return scene;
  const lines = [gateEquation, ...scene.lines].flatMap((line): Equation[] => {
    const parsed = parse(line);
    return parsed.ok ? [parsed.equation] : [];
  });
  const verdict = check(lines, scene.draft);
  const line = formatTokens(scene.draft);
  switch (verdict.kind) {
    case 'wrong':
      return { ...scene, draft: [], knockedBack: true, refused: false };
    case 'answer':
    case 'valid':
      return {
        ...scene,
        lines: scene.lines.includes(line) ? scene.lines : [...scene.lines, line],
        draft: [],
        knockedBack: false,
      };
    case 'check':
      return { ...scene, phase: 'foundry', lines: [...scene.lines, line], draft: [] };
    default:
      return { ...scene, refused: true, knockedBack: false };
  }
}
