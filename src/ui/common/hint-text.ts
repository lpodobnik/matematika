// Where the hint button's tag hangs and what it says (story 1.16): room/hint.ts decides the
// step and the move, hr.ts holds the words, and math/format.ts writes the numbers. Shared by
// the scene, which hangs the tags about the dial, the tray and the splitter, and the
// notebook, which hangs the ones about writing.

import { hr } from '@/content/text/hr';
import { inverseOf, linkText } from '@/math/chain';
import { add, div, maxNumber, num, sub, xVar } from '@/math/expr';
import { formatEquation, formatNumber } from '@/math/format';
import * as q from '@/math/rational';
import { type HintMove, type HintView, hintView } from '@/room/hint';
import { refusalView } from '@/room/notebook';
import { numberPieceLabel } from '@/room/pieces';
import { xLabel } from '@/room/scale';
import type { Refusal } from '@/room/types';
import type { GameState } from '@/store/types';
import { isSceneHandover, type SceneHandover } from '@/ui/scene/scale/handover-tag-layout';

/** Where the hint's tag hangs, and its text. */
export type HintSpot =
  /** In the scene, as the handover tag about `about` hangs (handover-tag-layout.ts). */
  | { place: 'scene'; about: SceneHandover; text: string }
  /**
   * At the notebook, where the line to write pulses; `key` names a pad key that pulses
   * with it (the delete key while the machine is jammed, story 1.16 review).
   */
  | { place: 'notebook'; text: string; key?: 'delete' }
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
      if (move.piece === 'gear') {
        const gears = xLabel('gear', BigInt(move.amount));
        return { place: 'scene', about: 'tray', text: hr.hint.addGear(gears) };
      }
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
    case 'check': {
      const n = formatNumber(move.x);
      return { place: 'notebook', text: move.template ? hr.hint.checkBlank(n) : hr.hint.check(n) };
    }
    case 'pin':
      return { place: 'pin' };
    case 'jam':
      return { place: 'notebook', text: hr.hint.jam.fix, key: 'delete' };
    case 'take-off':
      return { place: 'scene', about: 'tray', text: hr.hint.takeOff(formatNumber(move.amount)) };
    case 'blank':
      return { place: 'notebook', text: hr.hint.blank(formatNumber(move.value)) };
    case 'story':
      return { place: 'notebook', text: hr.hint.story(move.line) };
    case 'chain': {
      // The link he taps is the inverse's inverse (`n − ☐` undoes itself).
      const inverse = { op: move.op, n: move.n };
      return {
        place: 'notebook',
        text: hr.hint.chain(linkText(inverseOf(inverse)), linkText(inverse)),
      };
    }
  }
}

/** Where the hint shows, and what it says: the step's own tag, or the second press's move. */
export function hintSpot(view: HintView): HintSpot {
  if (view.move) return moveSpot(view.move);
  if (view.step === 'pin') return { place: 'pin' };
  if (view.step === 'jam') return { place: 'notebook', text: hr.hint.jam.what, key: 'delete' };
  if (view.step === 'blank') return { place: 'notebook', text: hr.hint.blankWhat };
  const text = hr.handover[view.step];
  return isSceneHandover(view.step)
    ? { place: 'scene', about: view.step, text }
    : { place: 'notebook', text };
}

/**
 * Where the hint shows in the game as it is: as `hintSpot` says, except that a line pin's
 * question (room 7) hangs at the notebook, where the pin is, not in the scene.
 */
function spotIn(state: Pick<GameState, 'room' | 'save' | 'ui'>, view: HintView): HintSpot {
  const spot = hintSpot(view);
  if (spot.place !== 'pin' || !state.room) return spot;
  if (state.room.stage.planted) return { place: 'notebook', text: hr.pin.questions['wrong-line'] };
  // Story 4.5: a story pin's question hangs at the notebook too, where the stories are.
  const stage = state.room.spec.stages[state.room.stageIndex];
  if (stage?.pin?.kind === 'story-choice' || stage?.pin?.kind === 'range') {
    return { place: 'notebook', text: hr.pin.questions[stage.pin.kind] };
  }
  return spot;
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
  return view ? spotIn(state, view).place : null;
}

/** The hint's text at the notebook now, or null: a primitive, for a selector. */
export function notebookHint(state: Pick<GameState, 'room' | 'save' | 'ui'>): string | null {
  const view = hintOf(state);
  if (!view) return null;
  const spot = spotIn(state, view);
  return spot.place === 'notebook' ? spot.text : null;
}

/**
 * The kind of the move the hint shows now, or null (story 4.1: the chain's last link pulses
 * for a `chain` move, and also for the `chain` step's tag): a primitive, for a selector.
 */
export function hintMoveKind(state: Pick<GameState, 'room' | 'save' | 'ui'>): string | null {
  const view = hintOf(state);
  if (!view) return null;
  if (view.move) return view.move.kind;
  return view.step === 'chain' ? 'chain' : null;
}

/** The pad key the hint pulses now, or null: a primitive, for a selector. */
export function hintKey(state: Pick<GameState, 'room' | 'save' | 'ui'>): 'delete' | null {
  const view = hintOf(state);
  if (!view) return null;
  const spot = spotIn(state, view);
  return spot.place === 'notebook' ? (spot.key ?? null) : null;
}

/**
 * The refusal whose tag hangs at the notebook now, or null (story 1.16 review): none while
 * the hint shows, since a hint can only be pressed after the refusal (the refused enter
 * ends any hint), and its tag takes the refusal's place.
 */
export function notebookRefusal(state: Pick<GameState, 'room' | 'save' | 'ui'>): Refusal | null {
  return hintOf(state) === null ? refusalView(state.room) : null;
}

/**
 * Which tag the scene hangs now (story 1.16: one tag at a time): the hint's while it shows;
 * else none while the refusal's tag hangs at the notebook, which stays up only until his
 * next action (story 1.16 review; room/notebook.ts, `withoutRefusal`); else the handover's
 * (HandoverTag.tsx decides whether one applies). A hint pressed after a refusal takes its
 * place at the notebook too (Notebook.tsx).
 */
export function sceneTag(
  state: Pick<GameState, 'room' | 'save' | 'ui'>,
): 'hint' | 'handover' | null {
  if (hintOf(state) !== null) return 'hint';
  return refusalView(state.room) === null ? 'handover' : null;
}

/**
 * Level 3 of the help ladder (story 2.7): for a move on the machine, the line it will write,
 * with blanks for its numbers (`2x + 5 − □ = 23 − □`). Null otherwise: a primitive, for a
 * selector.
 */
export function helpStructure(state: Pick<GameState, 'room' | 'save' | 'ui'>): string | null {
  const view = hintOf(state);
  if (!view || view.level < 3 || !view.move || !state.room) return null;
  const { move } = view;
  if (move.kind !== 'tray' && move.kind !== 'split') return null;
  const { left, right } = state.room.stage.pans;
  // A stand-in number for the blank, written as the machine writes the line, then swapped.
  const blank = num(maxNumber);
  const apply = move.kind === 'split' ? div : move.piece === 'float' ? sub : add;
  const line = formatEquation({ left: apply(left, blank), right: apply(right, blank) });
  return line.split(formatNumber(maxNumber)).join('□');
}

/**
 * Level 4 (story 2.7): the same kind of equation with other numbers, solved line by line,
 * as one string of lines joined by newlines (a primitive, for a selector); null otherwise.
 */
export function helpExample(state: Pick<GameState, 'room' | 'save' | 'ui'>): string | null {
  const view = hintOf(state);
  if (!view?.example) return null;
  return view.example.map(formatEquation).join('\n');
}
