// Part 2's layer of the store (architecture, Pattern 7), over the rest as the fights' layer is.
// The rules themselves are in `hunt/`, which is pure.

import { produce } from 'immer';
import type { Reduce } from '@/store/types';

export function withHunt(inner: Reduce): Reduce {
  return (state, action, ctx) => {
    switch (action.type) {
      case 'dev/preview':
        return {
          state: produce(state, (draft) => {
            draft.ui.preview = true;
          }),
          events: [],
        };
    }
    return inner(state, action, ctx);
  };
}
