// The tilt as a spring (Motion), so the pans swing to a new angle, overshoot a little and
// settle, like a real balance. Each frame's angle goes to `onChange`, which writes it to
// Pixi objects through refs, never through React state (architecture, Animation).

import { springValue } from 'motion';

/** A little bounce, settled in about a second. */
export const tiltSpringOptions = { stiffness: 120, damping: 14, mass: 1 } as const;

export interface TiltSpring {
  /** Springs toward a new tilt, keeping the current speed. */
  setTarget(tilt: number): void;
  /** The tilt drawn right now. */
  current(): number;
  destroy(): void;
}

export function createTiltSpring(onChange: (tilt: number) => void, initial = 0): TiltSpring {
  const value = springValue(initial, tiltSpringOptions);
  const unsubscribe = value.on('change', onChange);
  return {
    setTarget: (tilt) => value.set(tilt),
    current: () => value.get(),
    destroy: () => {
      unsubscribe();
      value.destroy();
    },
  };
}
