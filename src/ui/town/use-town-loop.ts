import { useEffect, useRef } from 'react';
import type { Point } from '@/city/walk';
import { place } from '@/ui/town/town-geometry';

/** Walking speed, in town units a second. */
const SPEED = 320;
/** The automaton's speed, slower than his. */
const PATROL_SPEED = 60;

/** The automaton at the start of its round. */
export const botAt = (patrol: readonly Point[]) => ({
  at: patrol[0] ?? { x: 0, y: 0 },
  target: 1,
  dir: 1,
  facing: -1 as 1 | -1,
});

interface LoopArgs<Errand> {
  start: Point;
  patrol: readonly Point[];
  /** The way his picture faces: it is mirrored only to face the other way. */
  picture(): 1 | -1;
  /** While the map, the story or the panels are open, nothing moves. */
  paused: boolean;
  onStopped(): void;
  onArrive(job: Errand | null): void;
  /** Runs on every frame in every street, after he has moved (the little one, story 7.4). */
  onFrame?(dt: number, me: Point): void;
}

/**
 * One loop moves him along his path and the automaton along its round. Everything here changes
 * every frame, so it goes through refs and the elements, never through React state (rule 6).
 */
export function useTownLoop<Errand>({
  start,
  patrol: round,
  picture,
  paused,
  onStopped,
  onArrive,
  onFrame,
}: LoopArgs<Errand>) {
  const path = useRef<Point[]>([]);
  const errand = useRef<Errand | null>(null);
  const meRef = useRef(start);
  const meFacing = useRef<1 | -1>(1);
  const meEl = useRef<HTMLDivElement>(null);
  const botRef = useRef(botAt(round));
  const botEl = useRef<HTMLButtonElement>(null);
  const patrol = useRef(round);
  patrol.current = round;
  // The latest callbacks, so that a render never restarts the loop.
  const latest = useRef({ picture, onStopped, onArrive, onFrame });
  latest.current = { picture, onStopped, onArrive, onFrame };

  useEffect(() => {
    if (paused) return;
    let frame = 0;
    let last = performance.now();
    const moveHim = (dt: number) => {
      const next = path.current[0];
      if (!next) return;
      const at = meRef.current;
      const dx = next.x - at.x;
      const dy = next.y - at.y;
      const d = Math.hypot(dx, dy);
      const step = SPEED * dt;
      if (Math.abs(dx) > 2) meFacing.current = dx > 0 ? 1 : -1;
      if (d <= step) {
        path.current.shift();
        meRef.current = next;
        if (path.current.length === 0) {
          latest.current.onStopped();
          const job = errand.current;
          errand.current = null;
          latest.current.onArrive(job);
        }
      } else {
        meRef.current = { x: at.x + (dx / d) * step, y: at.y + (dy / d) * step };
      }
      place(meEl.current, meRef.current, meFacing.current, latest.current.picture());
    };
    const moveAutomaton = (dt: number) => {
      const b = botRef.current;
      const target = patrol.current[b.target];
      if (!target) return;
      const bx = target.x - b.at.x;
      const by = target.y - b.at.y;
      const bd = Math.hypot(bx, by);
      const bstep = PATROL_SPEED * dt;
      if (bd <= bstep) {
        b.at = target;
        if (b.target + b.dir < 0 || b.target + b.dir >= patrol.current.length) b.dir = -b.dir;
        b.target += b.dir;
      } else {
        b.at = { x: b.at.x + (bx / bd) * bstep, y: b.at.y + (by / bd) * bstep };
        if (Math.abs(bx) > 2) b.facing = bx > 0 ? 1 : -1;
      }
      place(botEl.current, b.at, b.facing);
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      moveHim(dt);
      latest.current.onFrame?.(dt, meRef.current);
      moveAutomaton(dt);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused]);

  return { path, errand, meRef, meFacing, meEl, botRef, botEl };
}
