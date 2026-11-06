import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import { GoalBanner, GoalBannerView } from '@/ui/common/GoalBanner';
import { fitScene } from '@/ui/scene/fit-scene';
import { goalBannerFits, goalBannerHeight } from '@/ui/scene/scale/goal-card-layout';

describe('the goal banner (story 1.16, after Luka: the corner card went unnoticed)', () => {
  it('reads Cilj and what it asks for, with the miniature scale, and no tick until matched', () => {
    const html = renderToString(<GoalBannerView matched={false} top={20} />);
    expect(html).toContain(hr.goal.heading);
    expect(html).toContain(hr.goal.target);
    expect(html).toContain('goal-banner__scale');
    expect(html).not.toContain('goal-banner__tick');
    expect(html).toContain(`height:${goalBannerHeight}px`);
  });

  it('shows a tick and says so in its state once the pans match', () => {
    const html = renderToString(<GoalBannerView matched={true} top={20} />);
    expect(html).toContain('goal-banner__tick');
    expect(html).toContain('data-matched="true"');
  });

  it('fits the band above the scene on the tablet and on a computer, not on a phone', () => {
    // The tablet at 1280 × 800 with the notebook beside the scene, Luka's 1422 × 976 window.
    expect(goalBannerFits(fitScene(1280 - 0.32 * 1280, 800).y)).toBe(true);
    expect(goalBannerFits(fitScene(982, 976).y)).toBe(true);
    // A phone at 640 × 360: the scene fills the height, and the scene's own card shows.
    expect(goalBannerFits(fitScene(640, 360).y)).toBe(false);
  });

  it('renders nothing before the area is measured', () => {
    expect(renderToString(<GoalBanner area={{ current: null }} />)).toBe('');
  });
});
