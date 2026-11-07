import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AppScreen } from '@/app/App';
import { hr } from '@/content/text/hr';

// @pixi/react doesn't load under Node; the scene itself is checked in the browser.
vi.mock('@/ui/scene/SceneRoot', () => ({ SceneRoot: () => null }));

describe('App screens (story 1.13)', () => {
  it('shows a room in play: the scene area and the notebook', () => {
    const html = renderToString(<AppScreen screen="room" />);
    expect(html).toContain('scene-area');
    expect(html).toContain(hr.notebook.label);
    expect(html).not.toContain(hr.app.toBeContinued);
  });

  it('shows the town in place of the scene and the notebook (stories 2.2, 5.0)', () => {
    const html = renderToString(<AppScreen screen="map" />);
    expect(html).toContain('town__board');
    expect(html).toContain(hr.town.map);
    expect(html).not.toContain('scene-area');
    expect(html).not.toContain(hr.notebook.label);
    expect(html).toContain('portrait-overlay');
  });
});

describe('the opening (story 5.0)', () => {
  it('shows its first panel, its skip, and nothing of a room', () => {
    const html = renderToString(<AppScreen screen="opening" />);
    expect(html).toContain(hr.opening.panels[0]);
    expect(html).toContain(hr.opening.skip);
    expect(html).not.toContain('scene-area');
  });
});

describe('the loading screen (story 2.1)', () => {
  it('shows a gear and a bar filled as far as the assets have loaded, in place of the room', () => {
    const html = renderToString(<AppScreen screen="loading" loaded={0.25} />);
    expect(html).toContain('loading__gear');
    expect(html).toContain('aria-valuenow="25"');
    expect(html).toContain('width:25%');
    expect(html).toContain(`aria-label="${hr.app.loading}"`);
    expect(html).not.toContain('scene-area');
  });

  it('matches the gear index.html shows before the code has loaded', () => {
    const index = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    const html = renderToString(<AppScreen screen="loading" loaded={0} />);
    const gear = html.match(/<path d="([^"]+)"/)?.[1];
    expect(gear).toBeTruthy();
    expect(index).toContain(`d="${gear}"`);
  });
});
