// The machine's progress as a spring (Motion), so a committed line moves the door with a
// little give rather than in a jump. Each frame's value goes to `onChange`, which writes it
// to Pixi objects through refs, never through React state (architecture, Animation). The
// drawn value stays within 0–1, so the door never sinks below its sill or rises past its
// housing.

import { springValue } from 'motion';

/** Slower than the pans: the machine is heavy. Settles in about a second and a half. */
export const progressSpringOptions = { stiffness: 50, damping: 12, mass: 1 } as const;

export interface ProgressSpring {
  /** Springs toward a new progress, keeping the current speed. */
  setTarget(progress: number): void;
  /** The progress drawn right now, within 0–1. */
  current(): number;
  destroy(): void;
}

function clamp(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

export function createProgressSpring(
  onChange: (progress: number) => void,
  initial = 0,
): ProgressSpring {
  const value = springValue(initial, progressSpringOptions);
  const unsubscribe = value.on('change', (progress) => onChange(clamp(progress)));
  return {
    setTarget: (progress) => value.set(progress),
    current: () => clamp(value.get()),
    destroy: () => {
      unsubscribe();
      value.destroy();
    },
  };
}
