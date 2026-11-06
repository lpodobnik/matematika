import '@/ui/common/goal-banner.css';
import type { RefObject } from 'react';
import { hr } from '@/content/text/hr';
import { goalView } from '@/room/goal';
import { useGame } from '@/store/store';
import { useAreaSize } from '@/ui/common/use-area-size';
import { fitScene } from '@/ui/scene/fit-scene';
import { goalBannerFits, goalBannerHeight } from '@/ui/scene/scale/goal-card-layout';

interface Props {
  /** The scene area, to find the band the scene leaves above it. */
  area: RefObject<HTMLElement | null>;
}

/**
 * The goal as a large banner (story 1.16, after Luka: "the small cilj x sam in the corner
 * is not noticeable"): while the tray is offered, `Cilj` with a miniature scale (one x-gear
 * alone on one pan, a weight marked `?` on the other) and "x sam na jednoj strani", centred
 * in the band above the scene, where nothing else is. It drops in when the tray appears,
 * and when the pans match it (room/goal.ts) its frame grows heavier, a tick appears and it
 * lights, with a short bump. Where the scene leaves no band tall enough (a phone), the
 * scene's own small card shows instead (GoalCard.tsx; `goalBannerFits`). It takes no
 * touches.
 */
export function GoalBanner({ area }: Props) {
  const matched = useGame((s) => goalView(s.room, s.save.progress.tools)?.matched ?? null);
  const size = useAreaSize(area);
  if (matched === null || !size) return null;
  const band = fitScene(size.width, size.height).y;
  if (!goalBannerFits(band)) return null;
  return <GoalBannerView matched={matched} top={(band - goalBannerHeight) / 2} />;
}

interface ViewProps {
  matched: boolean;
  /** Its top, in CSS px from the scene area's top: centred in the band. */
  top: number;
}

/** The banner itself, from props only. */
export function GoalBannerView({ matched, top }: ViewProps) {
  return (
    <div
      className="goal-banner"
      data-matched={matched}
      style={{ top, height: goalBannerHeight }}
      role="status"
      aria-label={`${hr.goal.heading}: ${hr.goal.target}`}
    >
      <span className="goal-banner__heading">{hr.goal.heading}</span>
      <svg className="goal-banner__scale" viewBox="0 0 150 76" aria-hidden="true">
        {/* The stand and the level beam. */}
        <path d="M75 44 L64 72 H86 Z" />
        <path d="M16 44 H134" />
        {/* The left pan, with one x-gear alone on it. */}
        <path d="M2 44 H46" className="goal-banner__pan" />
        <circle cx="24" cy="25" r="16" className="goal-banner__gear" />
        <text x="24" y="32" textAnchor="middle">
          x
        </text>
        {/* The right pan, with one weight marked ?. */}
        <path d="M104 44 H148" className="goal-banner__pan" />
        <path d="M110 42 L115 12 H137 L142 42 Z" className="goal-banner__weight" />
        <text x="126" y="36" textAnchor="middle">
          ?
        </text>
      </svg>
      <span className="goal-banner__target">{hr.goal.target}</span>
      {matched && (
        <svg className="goal-banner__tick" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 13 L10 19 L20 6" />
        </svg>
      )}
    </div>
  );
}
