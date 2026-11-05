import { describe, expect, it, vi } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { TOKENS } from '@/math/tokens';
import { enterRoom } from '@/room/room';
import type { RoomSpec, StageSpec } from '@/room/types';
import { reduce } from '@/store/reducer';
import type { GameState } from '@/store/types';
import { keyFromKeyboard } from '@/ui/notebook/keyboard';
import { keyAction, keyKind, PAD_ROWS, primaryPress, tokenLabel } from '@/ui/notebook/pad-keys';

const ctx = { now: 0, rng: { next: () => 0 } };

describe('the number pad', () => {
  const keys = PAD_ROWS.flat();

  it('has every pad token, delete and enter, once each: 20 keys in 4 rows of 5', () => {
    expect(PAD_ROWS).toHaveLength(4);
    expect(PAD_ROWS.every((row) => row.length === 5)).toBe(true);
    expect([...keys].sort()).toEqual([...TOKENS, 'delete', 'enter'].sort());
  });

  it('labels its keys in school notation: −, · and :', () => {
    expect(tokenLabel('−')).toBe('−');
    expect(tokenLabel('·')).toBe('·');
    expect(tokenLabel(':')).toBe(':');
    expect(tokenLabel('x')).toBe('x');
    expect(tokenLabel('7')).toBe('7');
  });

  it('sorts keys by kind, for their look', () => {
    expect(keys.map(keyKind)).toEqual([
      ...['digit', 'digit', 'digit', 'bracket', 'bracket'],
      ...['digit', 'digit', 'digit', 'operator', 'operator'],
      ...['digit', 'digit', 'digit', 'operator', 'operator'],
      ...['digit', 'x', 'operator', 'delete', 'enter'],
    ]);
  });

  it('sends notebook/type for a token, notebook/delete and notebook/enter', () => {
    expect(keyAction('7')).toEqual({ type: 'notebook/type', token: '7' });
    expect(keyAction('·')).toEqual({ type: 'notebook/type', token: '·' });
    expect(keyAction('delete')).toEqual({ type: 'notebook/delete' });
    expect(keyAction('enter')).toEqual({ type: 'notebook/enter' });
  });
});

describe('primaryPress', () => {
  it('acts as the finger lands, with the default prevented', () => {
    const act = vi.fn();
    const event = { button: 0, preventDefault: vi.fn() };
    primaryPress(event, act);
    expect(act).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it("ignores a mouse's other buttons", () => {
    const act = vi.fn();
    for (const button of [1, 2]) primaryPress({ button, preventDefault: vi.fn() }, act);
    expect(act).not.toHaveBeenCalled();
  });
});

describe('the pad and the keyboard write the same line', () => {
  // Room 1 with a blank page, so he writes whole lines (room 1 itself fills blanks).
  const firstStage = r01.stages[0] as StageSpec;
  const freeRoom: RoomSpec = { ...r01, stages: [{ ...firstStage, fading: { try: 'blank' } }] };

  function play(keys: readonly Parameters<typeof keyAction>[0][]): GameState {
    let state: GameState = {
      room: enterRoom(freeRoom).room,
      ui: { screen: 'room', notebookAside: false },
    };
    for (const key of keys) state = reduce(state, keyAction(key), ctx).state;
    return state;
  }

  it('commits x = 9 − 4 from pad keys and from typed keys alike', () => {
    const padKeys = ['x', '=', '9', '−', '4', 'enter'] as const;
    const typedKeys = ['x', '=', '9', '-', '4', 'Enter'].map((name) =>
      keyFromKeyboard({ key: name, ctrlKey: false, metaKey: false, altKey: false }),
    );
    expect(typedKeys).not.toContain(null);
    const byPad = play(padKeys).room?.stage.lines;
    const byKeyboard = play(typedKeys as (typeof padKeys)[number][]).room?.stage.lines;
    expect(byPad).toHaveLength(2);
    expect(byKeyboard).toEqual(byPad);
  });

  it('commits 2 · 9 typed as * on the keyboard', () => {
    const typed = ['2', '*', '9', '/', '3'].map((name) =>
      keyFromKeyboard({ key: name, ctrlKey: false, metaKey: false, altKey: false }),
    );
    expect(typed).toEqual(['2', '·', '9', ':', '3']);
  });
});
