import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AppScreen } from '@/app/App';
import { ToBeContinued } from '@/app/ToBeContinued';
import { hr } from '@/content/text/hr';

// @pixi/react doesn't load under Node; the scene itself is checked in the browser.
vi.mock('@/ui/scene/SceneRoot', () => ({ SceneRoot: () => null }));

const css = readFileSync(new URL('./app.css', import.meta.url), 'utf8');

describe('App screens (story 1.13)', () => {
  it('shows a room in play: the scene area and the notebook', () => {
    const html = renderToString(<AppScreen screen="room" />);
    expect(html).toContain('scene-area');
    expect(html).toContain(hr.notebook.label);
    expect(html).not.toContain(hr.app.toBeContinued);
  });

  it('shows "to be continued" in place of the scene and the notebook after room 4', () => {
    const html = renderToString(<AppScreen screen="continued" />);
    expect(html).toContain(hr.app.toBeContinued);
    expect(html).not.toContain('scene-area');
    expect(html).not.toContain(hr.notebook.label);
    expect(html).toContain('portrait-overlay');
  });
});

describe('the "to be continued" screen', () => {
  it('says only that the story goes on, from hr.ts: no stars, scores or praise', () => {
    const html = renderToString(<ToBeContinued />);
    expect(html).toContain(hr.app.toBeContinued);
    const text = html.replace(/<[^>]*>/g, '');
    expect(text).toBe(hr.app.toBeContinued);
    expect(html).not.toMatch(/star|score|correct|button/i);
  });

  it('fills the screen in grey ink on paper, like the rest of the blueprint', () => {
    const rule = css.match(/\n\.continued\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/background:\s*var\(--paper\)/);
    expect(rule).toMatch(/color:\s*var\(--ink\)/);
    expect(rule).toMatch(/flex:\s*1 1 auto/);
  });
});
