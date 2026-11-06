// Plays the machine's test of a pin he confirms (story 1.14; the frames are pin-test.ts).
// Every part that shows it (the dial's knob, the pans, the pin's light, the parts counter)
// runs this hook on its own: each sees the same confirm in the same store change and keeps
// the same clock, so they stay in step. The frame changes once per notch, never per
// animation frame, like the dial's own dispatches.
//
// The test ends early when the dial moves in the store: he grabbed the knob, so his drag
// takes over (ui/scene/scale/Dial.tsx), or he turned the dial during the weighing. It also
// ends when the stage changes.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGame } from '@/store/store';
import {
  nextChangeMs,
  type PinTest,
  type PinTestFrame,
  type PinTestProbe,
  pinTestFrame,
  pinTestOf,
  pinTestProbe,
  restingFrame,
} from '@/ui/scene/scale/pin-test';

interface Playing {
  test: PinTest;
  /** The stage and dial x it plays for: a change of either ends it. */
  stage: string;
  dialX: number;
  startedAt: number;
  frame: PinTestFrame;
}

/** The test's frame now, or the resting frame when none plays. */
export function usePinTest(): PinTestFrame {
  const probe = useGame(useShallow((s) => pinTestProbe(s.room)));
  const previous = useRef<PinTestProbe | null>(probe);
  const [playing, setPlaying] = useState<Playing | null>(null);

  // A layout effect, so the first frame of the test replaces the store's end state before
  // it is ever drawn.
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = probe;
    const test = pinTestOf(before, probe);
    if (!test || !probe) return;
    setPlaying({
      test,
      stage: probe.stage,
      dialX: probe.dialX,
      startedAt: performance.now(),
      frame: pinTestFrame(test, 0),
    });
  }, [probe]);

  const live =
    playing !== null &&
    probe !== null &&
    playing.stage === probe.stage &&
    playing.dialX === probe.dialX &&
    !playing.frame.done;

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
      setPlaying({ ...playing, frame: pinTestFrame(playing.test, now) });
    }, next - elapsed);
    return () => clearTimeout(timer);
  }, [live, playing]);

  return live && playing ? playing.frame : restingFrame;
}
