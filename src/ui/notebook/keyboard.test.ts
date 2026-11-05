import { describe, expect, it, vi } from 'vitest';
import type { NotebookKey } from '@/room/notebook';
import { type KeyLike, keyFromKeyboard, watchKeyboard } from '@/ui/notebook/keyboard';

function key(name: string, mods: Partial<KeyLike> = {}): KeyLike {
  return { key: name, ctrlKey: false, metaKey: false, altKey: false, ...mods };
}

/** A keydown as the browser sends it, with the fields the watch reads. */
function keydown(name: string, fields: Partial<KeyLike> = {}): Event & KeyLike {
  const event = new Event('keydown', { cancelable: true });
  return Object.assign(event, key(name, fields));
}

describe('keyFromKeyboard', () => {
  it.each([
    ...'0123456789'.split('').map((digit): [string, NotebookKey] => [digit, digit as NotebookKey]),
    ['x', 'x'],
    ['X', 'x'],
    ['+', '+'],
    ['-', '−'],
    ['*', '·'],
    ['/', ':'],
    [':', ':'],
    ['=', '='],
    ['(', '('],
    [')', ')'],
    ['Backspace', 'delete'],
    ['Delete', 'delete'],
    ['Enter', 'enter'],
  ])('%s works like the pad: %s', (name, expected) => {
    expect(keyFromKeyboard(key(name))).toBe(expected);
  });

  it('also takes the school signs themselves', () => {
    expect(keyFromKeyboard(key('−'))).toBe('−');
    expect(keyFromKeyboard(key('·'))).toBe('·');
  });

  it.each(['a', 'y', ' ', '.', ',', 'Shift', 'ArrowLeft', 'Tab', 'Escape', 'F5'])(
    'ignores %j',
    (name) => {
      expect(keyFromKeyboard(key(name))).toBeNull();
    },
  );

  it('leaves Ctrl, Cmd and Alt shortcuts to the browser, but types AltGr characters', () => {
    expect(keyFromKeyboard(key('x', { ctrlKey: true }))).toBeNull();
    expect(keyFromKeyboard(key('Enter', { metaKey: true }))).toBeNull();
    expect(keyFromKeyboard(key('5', { altKey: true }))).toBeNull();
    expect(keyFromKeyboard(key('(', { ctrlKey: true, altKey: true }))).toBe('(');
  });

  it('ignores keys while an input method is composing', () => {
    expect(keyFromKeyboard(key('5', { isComposing: true }))).toBeNull();
  });
});

describe('watchKeyboard', () => {
  it('sends each notebook key and keeps the browser from using it', () => {
    const target = new EventTarget();
    const send = vi.fn();
    watchKeyboard(target, send);
    const events = ['2', 'x', '*', 'Backspace', 'Enter'].map((name) => keydown(name));
    for (const event of events) target.dispatchEvent(event);
    expect(send.mock.calls.map(([sent]) => sent)).toEqual(['2', 'x', '·', 'delete', 'enter']);
    expect(events.every((event) => event.defaultPrevented)).toBe(true);
  });

  it('lets other keys through untouched', () => {
    const target = new EventTarget();
    const send = vi.fn();
    watchKeyboard(target, send);
    const tab = keydown('Tab');
    target.dispatchEvent(tab);
    expect(send).not.toHaveBeenCalled();
    expect(tab.defaultPrevented).toBe(false);
  });

  it('leaves keys going into a text field alone (the name dialog, epic 2)', () => {
    const target = new EventTarget();
    const send = vi.fn();
    watchKeyboard(target, send);
    for (const field of [
      { tagName: 'INPUT' },
      { tagName: 'TEXTAREA' },
      { isContentEditable: true },
    ]) {
      const event = keydown('5');
      Object.defineProperty(event, 'target', { value: field });
      target.dispatchEvent(event);
    }
    expect(send).not.toHaveBeenCalled();
  });

  it('skips a key already handled, and stops when asked', () => {
    const target = new EventTarget();
    const send = vi.fn();
    const stop = watchKeyboard(target, send);
    const handled = keydown('5');
    handled.preventDefault();
    target.dispatchEvent(handled);
    expect(send).not.toHaveBeenCalled();
    stop();
    target.dispatchEvent(keydown('5'));
    expect(send).not.toHaveBeenCalled();
  });
});
