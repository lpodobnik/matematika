// Fading (architecture Pattern 1; GDD, Notebook): each way has a line mode per room. With
// Try values `blanks`, the notebook starts with `x = ☐` and the check line with x blanked
// (`☐ + 4 = 9`), and pad input fills only the current blank. With `blank` he writes every
// line. Balance and Undo blanks (`2x = ☐` after a move) join with their ways.

import { assert } from '@/lib/assert';
import { BLANK, blankOutX, type LineToken, tokenize } from '@/math/tokens';
import type { StageSpec } from '@/room/types';

/** The answer line to fill: `x = ☐`. */
export const answerTemplate: readonly LineToken[] = ['x', '=', BLANK];

/** The check line with x blanked: `x + 4 = 9` gives `☐ + 4 = 9`, `3x = 12` gives `3 · ☐ = 12`. */
export function checkTemplate(stage: StageSpec, machine: number): LineToken[] {
  const spec = stage.machines[machine];
  assert(spec, `the stage has no machine ${machine}`);
  const tokenized = tokenize(spec.equation);
  assert(tokenized.ok, `the machine's equation isn't in pad tokens: ${spec.equation}`);
  return blankOutX(tokenized.tokens);
}

/**
 * The lines with blanks a stage opens with: with Try values `blanks`, the answer line and
 * the check line, in that order; otherwise none, and he writes freely.
 */
export function openingTemplates(stage: StageSpec, machine: number): LineToken[][] {
  if (stage.fading.try !== 'blanks') return [];
  return [[...answerTemplate], checkTemplate(stage, machine)];
}
