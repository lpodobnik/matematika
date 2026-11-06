// Fading (architecture Pattern 1; GDD, Notebook): each way has a line mode per room. With
// Try values `blanks`, the notebook starts with `x = ☐` and the check line with x blanked
// (`☐ + 4 = 9`), and pad input fills only the current blank. With `blank` he writes every
// line. With Balance `auto` the lines appear as he moves and he writes the last two (GDD,
// Fading): story 1.16 gives him those two as blanks once x is alone on the pans, `x = ☐`
// and then the check line (`lastLines`); x is alone by the one rule on the pans' pieces
// (room/pieces.ts, `xAlone`). Balance and Undo blanks (`2x = ☐` after a move)
// join with their ways.

import { assert } from '@/lib/assert';
import { BLANK, blankOutX, fillBlanks, type LineToken, type Token, tokenize } from '@/math/tokens';
import { xAlone } from '@/room/pieces';
import type { StageSpec, StageState } from '@/room/types';

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

/**
 * Whether a stage gives him the last two lines as blanks once x is alone (story 1.16):
 * Balance `auto`, where Try values doesn't already open with them (room 4).
 */
export function blanksOnceAlone(stage: StageSpec): boolean {
  return stage.fading.balance === 'auto' && stage.fading.try !== 'blanks';
}

/**
 * The lines with blanks left for him in a stage that gives them once x is alone
 * (`blanksOnceAlone`): none while x isn't alone on the pans; then `x = ☐` and the check
 * line with x blanked (`2 · ☐ + 5 = 23`); after his answer line, the check line alone; none
 * once it is written. Null for any other stage, whose blanks are set as it opens.
 */
export function lastLines(
  stage: StageSpec,
  state: Pick<StageState, 'machine' | 'pans' | 'lines'>,
): LineToken[][] | null {
  if (!blanksOnceAlone(stage)) return null;
  const has = (kind: 'answer' | 'check') => state.lines.some((line) => line.verdict.kind === kind);
  if (has('check')) return [];
  if (has('answer')) return [checkTemplate(stage, state.machine)];
  if (!xAlone(state.pans)) return [];
  return [[...answerTemplate], checkTemplate(stage, state.machine)];
}

function sameLines(
  a: readonly (readonly LineToken[])[],
  b: readonly (readonly LineToken[])[],
): boolean {
  return a.length === b.length && a.every((line, i) => line.join(' ') === b[i]?.join(' '));
}

/**
 * The draft when the lines to fill change from `before` to `after`. New blanks start empty
 * (story 1.16 review: a refused `x = 9` is no longer carried into `x = ☐`, so the blank
 * that appears is his to fill). When the blanks go, what he had in the old blank comes out
 * as free text (`x = ☐` with 9 in it becomes `x = 9` when x is no longer alone).
 */
function carriedDraft(
  draft: readonly Token[],
  before: readonly (readonly LineToken[])[],
  after: readonly (readonly LineToken[])[],
): Token[] {
  const [from] = before;
  if (after.length > 0) return [];
  return from ? (draft.length > 0 ? fillBlanks(from, draft) : []) : [...draft];
}

/**
 * The stage with its last two lines' blanks brought up to date (story 1.16; `lastLines`),
 * after a committed line or a Balance move changes the pans or the lines: they appear once
 * x is alone, and go again if a move leaves x not alone before his answer. The draft
 * follows (`carriedDraft`). The same stage when nothing changes, or in a stage whose blanks
 * are set as it opens.
 */
export function withLastLines(spec: StageSpec, stage: StageState): StageState {
  const wanted = lastLines(spec, stage);
  if (wanted === null || sameLines(wanted, stage.templates)) return stage;
  return { ...stage, templates: wanted, draft: carriedDraft(stage.draft, stage.templates, wanted) };
}
