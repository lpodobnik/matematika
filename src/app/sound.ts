// Story 6.2: the app shell's part of the sound. Browsers start audio only after a user
// gesture, so the first tap anywhere (the opening's first panel, usually) makes the audio
// context; later taps resume it if the system put it to sleep. A finger's pointerdown is not
// a gesture that may start audio (only its pointerup, like touchend, is), so both unlock.
// A tap on a button sounds a soft wooden tap. While the page is hidden the context sleeps,
// to spare the tablet's battery.

import type { AudioEngine } from '@/audio/index';

/** Buttons that make no tap: the town's ground, where a tap is a step, not a press. */
const SILENT_BUTTONS = '.town__ground';

/** Whether a tap at `target` is on a button that sounds. */
export function tapsButton(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false;
  const button = (target as Element).closest('button');
  if (!button || button.disabled) return false;
  return !button.matches(SILENT_BUTTONS);
}

type SoundEngine = Pick<AudioEngine, 'unlock' | 'play' | 'setHidden'>;

/** Listens for taps and for the page being hidden; returns the way to stop listening. */
export function installSound(win: Window, engine: SoundEngine): () => void {
  const onPointer = (event: Event) => {
    engine.unlock();
    if (tapsButton(event.target)) engine.play('tap');
  };
  const onUnlock = () => engine.unlock();
  const onVisibility = () => engine.setHidden(win.document.visibilityState === 'hidden');
  win.addEventListener('pointerdown', onPointer, { capture: true });
  win.addEventListener('pointerup', onUnlock, { capture: true });
  win.addEventListener('keydown', onUnlock, { capture: true });
  win.document.addEventListener('visibilitychange', onVisibility);
  return () => {
    win.removeEventListener('pointerdown', onPointer, { capture: true });
    win.removeEventListener('pointerup', onUnlock, { capture: true });
    win.removeEventListener('keydown', onUnlock, { capture: true });
    win.document.removeEventListener('visibilitychange', onVisibility);
  };
}
