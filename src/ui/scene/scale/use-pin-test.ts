// Plays the machine's test of a pin he confirms (story 1.14; the frames are pin-test.ts).
// Every part that shows it (the dial's knob, the pans, the pin's light, the parts counter)
// runs this hook on its own: each sees the same confirm in the same store change and keeps
// the same clock, so they stay in step. The frame changes once per notch, never per
// animation frame, like the dial's own dispatches.
//
// The test ends early, for good, when the dial moves in the store: he grabbed the knob, so
// his drag takes over (ui/scene/scale/Dial.tsx), or he turned the dial during the weighing.
// It also ends when the stage changes. Turning the dial back to the test's x never resumes
// it (`nextPlay`).

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGame } from '@/store/store';
import {
  nextChangeMs,
  nextPlay,
  type PinTestFrame,
  type PinTestPlay,
  type PinTestProbe,
  pinTestFrame,
  pinTestProbe,
  playedFrame,
  restingFrame,
} from '@/ui/scene/scale/pin-test';

/** The test's frame now, or the resting frame when none plays. */
export function usePinTest(): PinTestFrame {
  const probe = useGame(useShallow((s) => pinTestProbe(s.room)));
  const previous = useRef<PinTestProbe | null>(probe);
  const [playing, setPlaying] = useState<PinTestPlay | null>(null);

  // A layout effect, so the first frame of the test replaces the store's end state before
  // it is ever drawn, and a test the dial has ended is dropped before the next paint.
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = probe;
    const now = performance.now();
    setPlaying((current) => nextPlay(current, before, probe, now));
  }, [probe]);

  const frame = playedFrame(playing, probe);
  const live = frame !== restingFrame;

  useEffect(() => {
    if (!live || !playing) return;
    const elapsed = performance.now() - playing.startedAt;
    const next = nextChangeMs(playing.test, elapsed);
    if (next === null) {
      setPlaying(null);
      return;
    }
    const timer = setTimeout(() => {
      const now = performance.now() - playing.startedAt;
      setPlaying((current) =>
        current === playing ? { ...playing, frame: pinTestFrame(playing.test, now) } : current,
      );
    }, next - elapsed);
    return () => clearTimeout(timer);
  }, [live, playing]);

  return frame;
}
