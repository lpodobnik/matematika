// Where the hint button's tag hangs and what it says (story 1.16): room/hint.ts decides the
// step and the move, hr.ts holds the words, and math/format.ts writes the numbers. Shared by
// the scene, which hangs the tags about the dial, the tray and the splitter, and the
// notebook, which hangs the ones about writing.

import { hr } from '@/content/text/hr';
import { num, xVar } from '@/math/expr';
import { formatEquation, formatNumber } from '@/math/format';
import * as q from '@/math/rational';
import { type HintMove, type HintView, hintView } from '@/room/hint';
import { numberPieceLabel } from '@/room/pieces';
import type { GameState } from '@/store/types';
import { isSceneHandover, type SceneHandover } from '@/ui/scene/scale/handover-tag-layout';

/** Where the hint's tag hangs, and its text. */
export type HintSpot =
  /** In the scene, as the handover tag about `about` hangs (handover-tag-layout.ts). */
  | { place: 'scene'; about: SceneHandover; text: string }
  /** At the notebook, where the line to write pulses. */
  | { place: 'notebook'; text: string }
  /** The pin's own question tag, again. */
  | { place: 'pin' };

/** What the second press's move says, and where. */
function moveSpot(move: HintMove): HintSpot {
  switch (move.kind) {
    case 'slide':
      return {
        place: 'scene',
        about: 'dial',
        text: move.direction > 0 ? hr.hint.slide.right : hr.hint.slide.left,
      };
    case 'tray': {
      const n = formatNumber(move.amount);
      const label = numberPieceLabel({ kind: move.piece, value: q.rational(move.amount) });
      const text = move.piece === 'float' ? hr.hint.take(n, label) : hr.hint.add(n, label);
      return { place: 'scene', about: 'tray', text };
    }
    case 'split':
      return { place: 'scene', about: 'splitter', text: hr.hint.split(formatNumber(move.parts)) };
    case 'answer':
      return {
        place: 'notebook',
        text: hr.hint.answer(formatEquation({ left: xVar(), right: num(move.x) })),
      };
    case 'check':
      return { place: 'notebook', text: hr.hint.check(formatNumber(move.x)) };
    case 'pin':
      return { place: 'pin' };
  }
}

/** Where the hint shows, and what it says: the step's own tag, or the second press's move. */
export function hintSpot(view: HintView): HintSpot {
  if (view.move) return moveSpot(view.move);
  if (view.step === 'pin') return { place: 'pin' };
  const text = hr.handover[view.step];
  return isSceneHandover(view.step)
    ? { place: 'scene', about: view.step, text }
    : { place: 'notebook', text };
}

/** What the hint shows in the game as it is now, or null. */
export function hintOf(state: Pick<GameState, 'room' | 'save' | 'ui'>): HintView | null {
  return hintView(state.room, state.save.progress.tools, state.ui.hint);
}

/** Where the hint shows now, or null; for selectors that need only that. */
export function hintPlace(
  state: Pick<GameState, 'room' | 'save' | 'ui'>,
): HintSpot['place'] | null {
  const view = hintOf(state);
  return view ? hintSpot(view).place : null;
}

/** The hint's text at the notebook now, or null: a primitive, for a selector. */
export function notebookHint(state: Pick<GameState, 'room' | 'save' | 'ui'>): string | null {
  const view = hintOf(state);
  if (!view) return null;
  const spot = hintSpot(view);
  return spot.place === 'notebook' ? spot.text : null;
}
