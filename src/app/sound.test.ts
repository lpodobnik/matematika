import { describe, expect, it } from 'vitest';
import { installSound, tapsButton } from '@/app/sound';

/** A stand-in element: what `closest('button')` finds, and whether it is the town's ground. */
function target(button: { disabled?: boolean; ground?: boolean } | null) {
  const found = button && {
    disabled: button.disabled ?? false,
    matches: (selector: string) => selector === '.town__ground' && button.ground === true,
  };
  return { closest: () => found } as unknown as EventTarget;
}

describe('the tap on a button (story 6.2)', () => {
  it('taps for an enabled button, not for the town ground, a disabled button or no button', () => {
    expect(tapsButton(target({}))).toBe(true);
    expect(tapsButton(target({ ground: true }))).toBe(false);
    expect(tapsButton(target({ disabled: true }))).toBe(false);
    expect(tapsButton(target(null))).toBe(false);
    expect(tapsButton(null)).toBe(false);
    expect(tapsButton({} as EventTarget)).toBe(false);
  });
});

describe('the unlock on the first tap (story 6.2)', () => {
  function fakeWindow() {
    const listeners = new Map<string, (event: Event) => void>();
    const docListeners = new Map<string, () => void>();
    const doc = {
      visibilityState: 'visible',
      addEventListener: (type: string, fn: () => void) => docListeners.set(type, fn),
      removeEventListener: (type: string) => docListeners.delete(type),
    };
    const win = {
      document: doc,
      addEventListener: (type: string, fn: (event: Event) => void) => listeners.set(type, fn),
      removeEventListener: (type: string) => listeners.delete(type),
    };
    return { win: win as unknown as Window, doc, listeners, docListeners };
  }

  it('unlocks on a tap or a key, taps for buttons, and sleeps while hidden', () => {
    const calls: string[] = [];
    const f = fakeWindow();
    const stop = installSound(f.win, {
      unlock: () => calls.push('unlock'),
      play: (sound) => calls.push(sound),
      setHidden: (hidden) => calls.push(hidden ? 'hidden' : 'shown'),
    });
    f.listeners.get('pointerdown')?.({ target: target({}) } as unknown as Event);
    f.listeners.get('pointerdown')?.({ target: target(null) } as unknown as Event);
    f.listeners.get('pointerup')?.({} as Event);
    f.listeners.get('keydown')?.({} as Event);
    f.doc.visibilityState = 'hidden';
    f.docListeners.get('visibilitychange')?.();
    expect(calls).toEqual(['unlock', 'tap', 'unlock', 'unlock', 'unlock', 'hidden']);
    stop();
    expect(f.listeners.size).toBe(0);
    expect(f.docListeners.size).toBe(0);
  });
});
