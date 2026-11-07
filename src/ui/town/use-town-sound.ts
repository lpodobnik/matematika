import { useEffect } from 'react';
import type { AreaId } from '@/content/town';
import { useGame } from '@/store/store';

/**
 * Story 6.2: tells the store which street the town shows, and that it shows none once the
 * town goes, so the restored machines' loops follow him (store/effects/audio.ts): the
 * street's own loud, the rest of the district quiet. ui never reaches the audio itself.
 */
export function useTownSound(areaId: AreaId) {
  const dispatch = useGame((s) => s.dispatch);
  useEffect(() => {
    dispatch({ type: 'town/area', area: areaId });
    return () => dispatch({ type: 'town/area', area: null });
  }, [dispatch, areaId]);
}
