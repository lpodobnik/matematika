// Story 6.2: the mute control and the town's street for the sound. Muting changes the saved
// settings, so it is written (`SaveChanged`) and the audio effect hears it; the street on
// screen changes no state and only tells the audio effect (`TownAreaShown`).

import { produce } from 'immer';
import type { Reduce } from '@/store/types';

/** The root reducer with the settings' actions over it. */
export function withSettings(inner: Reduce): Reduce {
  return (state, action, ctx) => {
    if (action.type === 'settings/mute') {
      if (state.save.settings.muted === action.muted) return { state, events: [] };
      const next = produce(state, (draft) => {
        draft.save.settings.muted = action.muted;
      });
      return { state: next, events: [{ type: 'SaveChanged' }] };
    }
    if (action.type === 'town/area') {
      return { state, events: [{ type: 'TownAreaShown', area: action.area }] };
    }
    return inner(state, action, ctx);
  };
}
