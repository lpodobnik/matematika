import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import { tokenFromChar } from '@/math/tokens';
import type { HintView } from '@/room/hint';
import type { Action } from '@/store/actions';
import { initialGameState } from '@/store/reducer';
import { createGameStore } from '@/store/store';
import { hintSpot, notebookRefusal, sceneTag } from '@/ui/common/hint-text';

function view(partial: Partial<HintView>): HintView {
  return { level: 2, step: 'dial', move: null, presses: 2, ...partial };
}

describe('where the hint’s tag hangs and what it says (story 1.16)', () => {
  it('hangs the first press’s step where its handover tag hangs, with its text', () => {
    expect(hintSpot(view({ level: 1, step: 'dial' }))).toEqual({
      place: 'scene',
      about: 'dial',
      text: hr.handover.dial,
    });
    expect(hintSpot(view({ level: 1, step: 'splitter' }))).toMatchObject({
      place: 'scene',
      about: 'splitter',
    });
    expect(hintSpot(view({ level: 1, step: 'write' }))).toEqual({
      place: 'notebook',
      text: hr.handover.write,
    });
    expect(hintSpot(view({ level: 1, step: 'pin' }))).toEqual({ place: 'pin' });
  });

  it('names the slider’s way by the knob', () => {
    expect(hintSpot(view({ move: { kind: 'slide', direction: 1 } }))).toEqual({
      place: 'scene',
      about: 'dial',
      text: hr.hint.slide.right,
    });
    expect(hintSpot(view({ move: { kind: 'slide', direction: -1 } }))).toMatchObject({
      text: hr.hint.slide.left,
    });
  });

  it('names the tray piece with its number, and the splitter’s parts', () => {
    expect(hintSpot(view({ move: { kind: 'tray', piece: 'float', amount: 5 } }))).toEqual({
      place: 'scene',
      about: 'tray',
      text: hr.hint.take('5', '−5'),
    });
    expect(hintSpot(view({ move: { kind: 'tray', piece: 'weight', amount: 12 } }))).toMatchObject({
      text: hr.hint.add('12', '12'),
    });
    expect(hintSpot(view({ move: { kind: 'split', parts: 2 } }))).toEqual({
      place: 'scene',
      about: 'splitter',
      text: hr.hint.split('2'),
    });
  });

  it('writes the answer and the check line at the notebook, in school notation', () => {
    expect(hintSpot(view({ move: { kind: 'answer', x: 9 } }))).toEqual({
      place: 'notebook',
      text: hr.hint.answer('x = 9'),
    });
    // On a blank page; a check line with x blanked asks only for the number (below).
    expect(hintSpot(view({ move: { kind: 'check', x: 9, template: false } }))).toEqual({
      place: 'notebook',
      text: hr.hint.check('9'),
    });
    expect(hintSpot(view({ move: { kind: 'pin' } }))).toEqual({ place: 'pin' });
  });
});

describe('the hint’s tags after the review of story 1.16', () => {
  it('says the line doesn’t hold, then to delete it, both at the notebook with the delete key', () => {
    expect(hintSpot(view({ level: 1, step: 'jam' }))).toEqual({
      place: 'notebook',
      text: hr.hint.jam.what,
      key: 'delete',
    });
    expect(hintSpot(view({ step: 'jam', move: { kind: 'jam' } }))).toEqual({
      place: 'notebook',
      text: hr.hint.jam.fix,
      key: 'delete',
    });
  });

  it('asks only for the number when the check line is a template', () => {
    expect(hintSpot(view({ move: { kind: 'check', x: 9, template: true } }))).toEqual({
      place: 'notebook',
      text: hr.hint.checkBlank('9'),
    });
  });
});

// Story 1.16 review: the refusal's tag at the notebook and a scene tag showed at once.
describe('one tag at a time with the refusal’s (story 1.16 review)', () => {
  it('hangs no scene tag while the refusal’s shows, until his next action; a hint takes its place', () => {
    const initial = initialGameState();
    const store = createGameStore({
      makeCtx: () => ({ now: 1000, rng: { next: () => 0.5 } }),
      initialState: {
        ...initial,
        save: {
          ...initial.save,
          progress: { roomsDone: [], started: [], onMap: false, tools: ['balance'], firstUse: [] },
        },
      },
    });
    const act = (action: Action) => store.getState().dispatch(action);
    const write = (text: string) => {
      for (const char of text) {
        const token = tokenFromChar(char);
        if (token) act({ type: 'notebook/type', token });
      }
      act({ type: 'notebook/enter' });
    };
    act({ type: 'room/enter', roomId: 'r04' });
    act({ type: 'machine/touch' });
    for (let x = 1; x <= 6; x += 1) act({ type: 'dial/set', x });
    expect(sceneTag(store.getState())).toBe('handover');
    write('x=9');
    expect(notebookRefusal(store.getState())).toBe('simplify');
    expect(sceneTag(store.getState())).toBeNull();
    // A press of the hint button: its tag shows, in the refusal's place at the notebook.
    act({ type: 'hint/press' });
    expect(sceneTag(store.getState())).toBe('hint');
    expect(notebookRefusal(store.getState())).toBeNull();
    // His next action ends the hint and takes the refusal down: the scene's tag is back.
    act({ type: 'dial/set', x: 5 });
    expect(notebookRefusal(store.getState())).toBeNull();
    expect(sceneTag(store.getState())).toBe('handover');
  });
});
