import { useApplication } from '@pixi/react';
import type { Container, Ticker } from 'pixi.js';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { bobOffset, bobPhase, stringStretch } from '@/ui/scene/scale/balloon-bob';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function reducedMotionNow(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.(reducedMotionQuery).matches === true;
}

/** Whether the device asks for reduced motion, kept up to date if the setting changes. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(reducedMotionNow);
  useEffect(() => {
    const query =
      typeof window === 'undefined' ? undefined : window.matchMedia?.(reducedMotionQuery);
    if (!query) return;
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * Bobs a balloon (story 1.15): every frame, on the app's ticker, its body's container moves
 * a few scene units up and down and its string's is stretched to stay tied to it and to the
 * pan (balloon-bob.ts). Transforms only, never a redraw or a React render (rule 6). Off when
 * `active` is false, and still under `prefers-reduced-motion`. Layout effects, so the ticker
 * callback is removed while the app still exists (as in Steam.tsx).
 */
export function useBalloonBob(active: boolean, key: string, knot: number) {
  const { app, isInitialised } = useApplication();
  const bodyRef = useRef<Container>(null);
  const stringRef = useRef<Container>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const string = stringRef.current;
    if (!isInitialised || !active || !body || !string) return;
    const phase = bobPhase(key);
    const place = (timeMs: number) => {
      if (body.destroyed || string.destroyed) return;
      const offset = bobOffset(timeMs, phase, reduced);
      body.y = offset;
      string.scale.y = stringStretch(knot, offset);
    };
    if (reduced) {
      place(0);
      return;
    }
    const { ticker } = app;
    const onFrame = (frame: Ticker) => place(frame.lastTime);
    place(ticker.lastTime);
    ticker.add(onFrame);
    return () => {
      ticker.remove(onFrame);
      place(Number.NaN);
    };
  }, [app, isInitialised, active, key, knot, reduced]);

  return { bodyRef, stringRef };
}
