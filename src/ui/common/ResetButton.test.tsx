import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { hr } from '@/content/text/hr';
import { ResetButton, ResetControl } from '@/ui/common/ResetButton';

const css = readFileSync(new URL('./common.css', import.meta.url), 'utf8');

/** The declarations of the first rule for `selector`. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
}

function px(declarations: string, property: string): number {
  const value = declarations.match(new RegExp(`(?:^|[\\s;])${property}:\\s*(\\d+)px;`))?.[1];
  return Number(value ?? Number.NaN);
}

describe('the reset control', () => {
  it('is a button named from hr.ts, never an <input>', () => {
    const html = renderToString(<ResetControl works onReset={vi.fn()} />);
    expect(html).toContain('<button');
    expect(html).toContain(`aria-label="${hr.ui.reset}"`);
    expect(html).not.toContain('<input');
    expect(html).not.toContain('disabled');
  });

  it('shows as off while reset does nothing (locked or restarting)', () => {
    const html = renderToString(<ResetControl works={false} onReset={vi.fn()} />);
    expect(html).toContain('disabled');
    expect(rule('.reset:disabled')).toMatch(/opacity:\s*0\.4/);
  });

  it('is at least 48 CSS px, with no hover state', () => {
    expect(px(rule('.reset'), 'width')).toBeGreaterThanOrEqual(48);
    expect(px(rule('.reset'), 'height')).toBeGreaterThanOrEqual(48);
    expect(css).not.toContain(':hover');
  });

  it('draws nothing before a room is entered', () => {
    expect(renderToString(<ResetButton />)).toBe('');
  });
});
