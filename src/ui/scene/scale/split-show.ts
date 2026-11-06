// What the scale shows when the splitter is dropped over it (story 1.15), with no React or
// Pixi in it, so it can be tested on its own:
//
// - even     each side's pieces separate into n equal groups, every group but the first
//            fades away, and the one left slides to the middle, where the side's result
//            then stands (the store already holds it)
// - uneven   the pieces start to separate, what is left over lifts out of line (`23` by 2
//            leaves a weight of 1), and they slide back together; nothing changes
//
// The splitter starts a show (`play`) from the pans as they were when it was let go
// (room/splitter.ts, `splitGroups`); the scale draws it in place of the pans' pieces until
// it has played (`end`). Only a play and an end notify, never a frame.

import type { SplitGroups } from '@/room/splitter';

export interface SplitShow {
  id: number;
  groups: SplitGroups;
}

export interface SplitShowChannel {
  /** Shows a split from the pans as they were when the splitter was let go. */
  play(groups: SplitGroups): void;
  current(): SplitShow | null;
  /** The show with this id has played; a stale id does nothing. */
  end(id: number): void;
  subscribe(listener: () => void): () => void;
}

export function createSplitShow(): SplitShowChannel {
  let show: SplitShow | null = null;
  let next = 1;
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of [...listeners]) listener();
  };
  return {
    play(groups) {
      show = { id: next, groups };
      next += 1;
      notify();
    },
    current: () => show,
    end(id) {
      if (show?.id !== id) return;
      show = null;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** How long each kind of show plays, in ms. */
export const splitShowMs = { even: 1000, uneven: 1400 } as const;

/** How far an uneven split separates, as a share of an even one's spread. */
export const unevenSpread = 0.6;

/** Where a show is at a moment: how far apart its groups are, and what has faded or lifted. */
export interface SplitPose {
  /** 0: the groups packed together, as the pieces stood; 1: fully apart. */
  spread: number;
  /** The groups after the first: 1 shown, 0 faded away (an even split). */
  othersAlpha: number;
  /** The first group's way to the middle, 0 to 1 (an even split, at the end). */
  toMiddle: number;
  /** How far the leftover has lifted out of line, 0 to 1 (an uneven split). */
  leftoverLift: number;
}

function clamp(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/** Eases in and out, so the groups start and stop gently. */
function ease(t: number): number {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
}

/** The pose at `t`, 0 to 1 of the show's time. */
export function splitPose(t: number, even: boolean): SplitPose {
  if (even) {
    return {
      spread: ease(t / 0.4),
      othersAlpha: 1 - ease((t - 0.45) / 0.3),
      toMiddle: ease((t - 0.75) / 0.2),
      leftoverLift: 0,
    };
  }
  const out = ease(t / 0.3);
  const back = ease((t - 0.7) / 0.3);
  return {
    spread: unevenSpread * (out - back),
    othersAlpha: 1,
    toMiddle: 0,
    leftoverLift: out - back,
  };
}

/**
 * Where each group's centre stands, and the leftover's, from the pan's centre: packed side
 * by side `gap` apart at spread 0, `spreadGap` further apart each at spread 1, with the
 * leftover last. With `toMiddle` at 1 the first group stands at the middle.
 */
export function groupCentres(
  widths: readonly number[],
  leftover: number,
  gap: number,
  spreadGap: number,
  pose: Pick<SplitPose, 'spread' | 'toMiddle'>,
): { groups: number[]; leftover: number } {
  const step = gap + spreadGap * pose.spread;
  const items = leftover > 0 ? [...widths, leftover] : [...widths];
  const total = items.reduce((sum, width) => sum + width, 0) + step * (items.length - 1);
  let left = -total / 2;
  const centres = items.map((width) => {
    const centre = left + width / 2;
    left += width + step;
    return centre;
  });
  const groups = centres.slice(0, widths.length);
  const first = groups[0];
  if (first !== undefined) groups[0] = first * (1 - pose.toMiddle);
  return { groups, leftover: leftover > 0 ? (centres.at(-1) ?? 0) : 0 };
}
