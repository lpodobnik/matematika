import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import { RoomGuideView } from '@/ui/common/RoomGuide';

const css = readFileSync(new URL('./room-guide.css', import.meta.url), 'utf8');

const layout = {
  screen: { width: 640, height: 360 },
  rings: [{ left: 100, top: 250, width: 300, height: 100 }],
  card: { left: 180, top: 8 },
};

describe('the room guide’s card (story 6.1)', () => {
  it('says the step in Nikola’s name, with "Dalje" on a step he reads', () => {
    const html = renderToString(
      <RoomGuideView
        text={hr.roomGuide.steps['dial-x']}
        stepId="dial-x"
        waits={false}
        last={false}
        layout={layout}
        onNext={() => {}}
      />,
    );
    expect(html).toContain(hr.story.speakers.nikola);
    expect(html).toContain(hr.roomGuide.steps['dial-x']);
    expect(html).toContain(hr.roomGuide.next);
    expect(html).toContain('room-guide__ring');
    expect(html).toContain(`aria-label="${hr.roomGuide.label}"`);
  });

  it('says "U redu" on a topic’s last step, and "Probaj!" with no button on a step that waits', () => {
    const last = renderToString(
      <RoomGuideView text="x" stepId="hint" waits={false} last layout={layout} onNext={() => {}} />,
    );
    expect(last).toContain(hr.roomGuide.last);
    const waits = renderToString(
      <RoomGuideView text="x" stepId="dial" waits last={false} layout={layout} onNext={() => {}} />,
    );
    expect(waits).toContain(hr.roomGuide.try);
    expect(waits).not.toContain('room-guide__next');
  });

  it('hides the card until it is laid out', () => {
    const html = renderToString(
      <RoomGuideView text="x" stepId="dial" waits last={false} layout={null} onNext={() => {}} />,
    );
    expect(html).toContain('visibility:hidden');
    expect(html).not.toContain('room-guide__dim');
  });

  it('lets touches through the dimming, and keeps its button at least 48 px', () => {
    expect(css).toMatch(/\.room-guide__dim \{[^}]*pointer-events: none/);
    for (const height of css.matchAll(/\.room-guide__next \{[^}]*min-height: (\d+)px/g)) {
      expect(Number(height[1])).toBeGreaterThanOrEqual(48);
    }
  });
});
