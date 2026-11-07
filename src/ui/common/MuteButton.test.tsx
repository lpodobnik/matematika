import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { hr } from '@/content/text/hr';
import { MuteControl } from '@/ui/common/MuteButton';

const css = readFileSync(new URL('./mute-button.css', import.meta.url), 'utf8');

function px(property: string): number {
  const block = css.match(/(?:^|\n)\.mute-button\s*\{([^}]*)\}/)?.[1] ?? '';
  return Number(
    block.match(new RegExp(`(?:^|[\\s;])${property}:\\s*(\\d+)px;`))?.[1] ?? Number.NaN,
  );
}

describe('the mute control (story 6.2)', () => {
  it('is a toggle button named from hr.ts, pressed while muted', () => {
    const on = renderToString(<MuteControl muted={false} onToggle={vi.fn()} />);
    expect(on).toContain('<button');
    expect(on).toContain(`aria-label="${hr.ui.mute}"`);
    expect(on).toContain('aria-pressed="false"');
    const off = renderToString(<MuteControl muted onToggle={vi.fn()} />);
    expect(off).toContain('aria-pressed="true"');
    expect(off).toContain('mute-button__off');
  });

  it('is at least 48 CSS px, fixed to the window, with no hover state', () => {
    expect(px('width')).toBeGreaterThanOrEqual(48);
    expect(px('height')).toBeGreaterThanOrEqual(48);
    expect(css).toMatch(/position:\s*fixed/);
    expect(css).not.toContain(':hover');
    // The phone's smaller size still meets the 48 px minimum.
    const phone = css.slice(css.indexOf('@media (max-height: 499.98px)'));
    for (const size of phone.matchAll(/(?:width|height):\s*(\d+)px/g)) {
      expect(Number(size[1])).toBeGreaterThanOrEqual(48);
    }
  });
});
