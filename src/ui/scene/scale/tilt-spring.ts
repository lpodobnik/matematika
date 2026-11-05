// The tilt as a spring (Motion), so the pans swing to a new angle, overshoot a little and
// settle, like a real balance. Each frame's angle goes to `onChange`, which writes it to
// Pixi objects through refs, never through React state (architecture, Animation).
//
// The tilt is clamped at ±`tuning.tiltMax` (GDD, The scale), and the spring's overshoot
// must not carry the beam past it: a swing to 15° would otherwise peak near 16° and one
// from −15° to 15° near 17°. So the drawn angle is clamped too, like a real end stop, and
// the swing stays springy inside the range.

import { springValue } from 'motion';
import { tuning } from '@/config/tuning';

/** A little bounce, settled in about a second. */
export const tiltSpringOptions = { stiffness: 120, damping: 14, mass: 1 } as const;

export interface TiltSpring {
  /** Springs toward a new tilt, keeping the current speed. */
  setTarget(tilt: number): void;
  /** The tilt drawn right now, never beyond ±`tuning.tiltMax`. */
  current(): number;
  destroy(): void;
}

function clamp(tilt: number): number {
  return Math.max(-tuning.tiltMax, Math.min(tuning.tiltMax, tilt));
}

export function createTiltSpring(onChange: (tilt: number) => void, initial = 0): TiltSpring {
  const value = springValue(initial, tiltSpringOptions);
  const unsubscribe = value.on('change', (tilt) => onChange(clamp(tilt)));
  return {
    setTarget: (tilt) => value.set(tilt),
    current: () => clamp(value.get()),
    destroy: () => {
      unsubscribe();
      value.destroy();
    },
  };
}
