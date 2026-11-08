import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import { tokenFromChar } from '@/math/tokens';
import { guideMet } from '@/room/guide';
import type { HintView } from '@/room/hint';
import { guideTopicIds } from '@/room/types';
import type { Action } from '@/store/actions';
import { initialGameState } from '@/store/reducer';
import { createGameStore } from '@/store/store';
import {
  hintSpot,
  notebookHint,
  notebookRefusal,
  pinHowText,
  sceneTag,
} from '@/ui/common/hint-text';

function view(partial: Partial<HintView>): HintView {
  return { level: 2, step: 'dial', move: null, presses: 2, example: null, ...partial };
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
    expect(hintSpot(view({ move: { kind: 'answer', x: 9, template: false } }))).toEqual({
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
          progress: {
            roomsDone: [],
            started: [],
            onMap: false,
            told: [],
            ideasSeen: [],
            tornPages: [],
            introSeen: true,
            tools: ['balance'],
            // Story 6.1: Nikola's guides are read, so the handover tags show as before.
            firstUse: guideTopicIds.map(guideMet),
          },
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

describe('the hint at room 7’s line pin (story 2.10 review)', () => {
  it('hangs the pin’s question at the notebook, where the line pin is', () => {
    const store = createGameStore({ effects: [] });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r07' });
    store.getState().dispatch({ type: 'machine/touch' });
    store.getState().dispatch({ type: 'hint/press' });
    expect(notebookHint(store.getState())).toBe(hr.pin.questions['wrong-line']);
  });
});

// Story 6.1: Nikola's card says the step while his guide talks, so no handover tag hangs.
describe('the scene’s tag while a room guide shows (story 6.1)', () => {
  it('hangs no handover tag while the guide shows, and the hint’s tag when he asks', () => {
    const initial = initialGameState();
    const store = createGameStore({
      makeCtx: () => ({ now: 1000, rng: { next: () => 0.5 } }),
      initialState: {
        ...initial,
        save: { ...initial.save, progress: { ...initial.save.progress, introSeen: true } },
      },
    });
    const act = (action: Action) => store.getState().dispatch(action);
    act({ type: 'room/enter', roomId: 'r01' });
    expect(store.getState().ui.screen).toBe('room');
    expect(sceneTag(store.getState())).toBeNull();
    act({ type: 'hint/press' });
    expect(sceneTag(store.getState())).toBe('hint');
  });
});

// Story 6.1: the hint's second press while a pin is offered says how to place it and confirm
// it, not the pin's question again.
describe('the hint’s second press while a pin is offered (story 6.1)', () => {
  function pinned(roomId: 'r03' | 'r07') {
    const initial = initialGameState();
    const store = createGameStore({
      makeCtx: () => ({ now: 1000, rng: { next: () => 0.5 } }),
      initialState: {
        ...initial,
        save: {
          ...initial.save,
          progress: {
            ...initial.save.progress,
            introSeen: true,
            tools: ['balance', 'workshop'],
            firstUse: guideTopicIds.map(guideMet),
          },
        },
      },
    });
    const act = (action: Action) => store.getState().dispatch(action);
    act({ type: 'room/enter', roomId });
    act({ type: 'machine/touch' });
    return { store, act };
  }

  it('room 3: the flag’s tag asks its question, then says to drag the flag and tap Potvrdi', () => {
    const { store, act } = pinned('r03');
    act({ type: 'hint/press' });
    expect(pinHowText(store.getState())).toBeNull();
    act({ type: 'hint/press' });
    expect(pinHowText(store.getState())).toBe(hr.hint.pinHow['level-x']);
  });

  it('room 7: the logbook’s tag says to flag the wrong line and confirm', () => {
    const { store, act } = pinned('r07');
    act({ type: 'hint/press' });
    expect(notebookHint(store.getState())).toBe(hr.pin.questions['wrong-line']);
    act({ type: 'hint/press' });
    expect(notebookHint(store.getState())).toBe(hr.hint.pinHow['wrong-line']);
  });
});
