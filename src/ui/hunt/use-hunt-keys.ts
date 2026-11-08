import { useEffect, useRef } from 'react';
import { isSToken } from '@/math/statement-tokens';
import type { HuntKey } from '@/ui/hunt/StatementPad';

const stand: Readonly<Record<string, HuntKey>> = {
  '-': '−',
  '*': '·',
  '/': ':',
  X: 'x',
  Enter: 'enter',
  Backspace: 'delete',
};

/** A computer's keys, as the pad's. The tablet has none, so this is for Luka and for tests. */
export function useHuntKeys(onKey: (key: HuntKey) => void) {
  const latest = useRef(onKey);
  latest.current = onKey;
  useEffect(() => {
    const listen = (event: KeyboardEvent) => {
      const key = stand[event.key] ?? event.key;
      if (key === 'enter' || key === 'delete' || isSToken(key)) latest.current(key);
    };
    window.addEventListener('keydown', listen);
    return () => window.removeEventListener('keydown', listen);
  }, []);
}
