// Fading (architecture Pattern 1; GDD, Notebook): each way has a line mode per room. With
// Try values `blanks`, the notebook starts with `x = ☐` and the check line with x blanked
// (`☐ + 4 = 9`), and pad input fills only the current blank. With `blank` he writes every
// line. With Balance `auto` the lines appear as he moves and he writes the last two (GDD,
// Fading): story 1.16 gives him those two as blanks once x is alone on the pans, `x = ☐`
// and then the check line (`lastLines`). Balance and Undo blanks (`2x = ☐` after a move)
// join with their ways.

import { assert } from '@/lib/assert';
import type { Equation } from '@/math/expr';
import { toLinear } from '@/math/linear';
import * as q from '@/math/rational';
import {
  BLANK,
  blankOutX,
  fillBlanks,
  isDigit,
  type LineToken,
  type Token,
  tokenize,
} from '@/math/tokens';
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
 * x is alone on the pans (story 1.16): one side is a single x with nothing else on it, and
 * the other holds no x: `x = 9`, `9 = x`, or a split's line, `2x : 2 = 18 : 2`, which the
 * scale shows as one gear against a 9.
 */
export function xAlone(pans: Equation): boolean {
  const left = toLinear(pans.left);
  const right = toLinear(pans.right);
  if (left.kind !== 'linear' || right.kind !== 'linear') return false;
  const alone = (side: { a: q.Rational; b: q.Rational }) =>
    q.equals(side.a, q.one) && q.isZero(side.b);
  return (alone(left) && q.isZero(right.a)) || (alone(right) && q.isZero(left.a));
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
 * What fills a template's one blank in a whole line: the numerals there, when the line is
 * the template with only numerals in the blank; null otherwise.
 */
function blankIn(template: readonly LineToken[], line: readonly Token[]): Token[] | null {
  const at = template.indexOf(BLANK);
  if (at < 0) return null;
  const after = template.length - at - 1;
  const fill = line.slice(at, line.length - after);
  const fits =
    fill.length > 0 &&
    fill.every(isDigit) &&
    template.slice(0, at).every((token, i) => token === line[i]) &&
    template.slice(at + 1).every((token, i) => token === line[line.length - after + i]);
  return fits ? fill : null;
}

/**
 * The draft when the lines to fill change from `before` to `after`: what he had written,
 * as a whole line, carried into the new blank when it fits there (a refused `x = 9`
 * becomes the 9 in `x = ☐`), or out of the old blank as free text (`x = ☐` with 9 in it
 * becomes `x = 9` when x is no longer alone); otherwise cleared.
 */
function carriedDraft(
  draft: readonly Token[],
  before: readonly (readonly LineToken[])[],
  after: readonly (readonly LineToken[])[],
): Token[] {
  const [from] = before;
  const [to] = after;
  const line = from ? (draft.length > 0 ? fillBlanks(from, draft) : []) : [...draft];
  if (!to) return line;
  return blankIn(to, line) ?? [];
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
