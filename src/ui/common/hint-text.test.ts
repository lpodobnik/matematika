import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import type { HintView } from '@/room/hint';
import { hintSpot } from '@/ui/common/hint-text';

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
    expect(hintSpot(view({ move: { kind: 'check', x: 9 } }))).toEqual({
      place: 'notebook',
      text: hr.hint.check('9'),
    });
    expect(hintSpot(view({ move: { kind: 'pin' } }))).toEqual({ place: 'pin' });
  });
});
