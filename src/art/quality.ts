// Which effects each quality setting keeps (architecture, Performance; Consistency Rules,
// Effects: every effect has a quality switch). As the setting drops, effects switch off in a
// fixed order: bloom first, then particles, then shaders. `high` keeps them all, `medium`
// drops bloom, and `low`, the last setting, drops the rest. Epic 1 has one effect, the
// placeholder steam (particles); bloom and the shaders join with the final art (epic 6).
// The setting itself is picked in store/quality.ts.

import type { Quality } from '@/store/quality';

export type VisualEffect = 'bloom' | 'particles' | 'shaders';

/** The order effects switch off in as the setting drops. */
export const effectsOffOrder: readonly VisualEffect[] = ['bloom', 'particles', 'shaders'];

/** How many effects, from the front of `effectsOffOrder`, each setting switches off. */
const switchedOff: Readonly<Record<Quality, number>> = { high: 0, medium: 1, low: 3 };

export type EffectSwitches = Readonly<Record<VisualEffect, boolean>>;

/** Which effects run at a setting. */
export function effectsAt(quality: Quality): EffectSwitches {
  const off = new Set(effectsOffOrder.slice(0, switchedOff[quality]));
  return {
    bloom: !off.has('bloom'),
    particles: !off.has('particles'),
    shaders: !off.has('shaders'),
  };
}
