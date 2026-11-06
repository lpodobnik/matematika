import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { hr } from '@/content/text/hr';
import { PinConfirm, PinConfirmControl } from '@/ui/common/PinConfirm';

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

describe("the pin's confirm control", () => {
  it('is a button labelled from hr.ts, never an <input>', () => {
    const html = renderToString(<PinConfirmControl option={null} onConfirm={vi.fn()} />);
    expect(html).toContain('<button');
    expect(html).toContain(`aria-label="${hr.pin.confirm}"`);
    expect(html).toContain(`>${hr.pin.confirm}</span>`);
    expect(html).not.toContain('<input');
  });

  it("reads out a choice pin's option in its name", () => {
    const html = renderToString(<PinConfirmControl option="pan-up" onConfirm={vi.fn()} />);
    expect(html).toContain(`aria-label="${hr.pin.confirm}: ${hr.pin.options['pan-up']}"`);
  });

  it('is at least 48 CSS px tall and wide, with no hover state', () => {
    expect(px(rule('.pin-confirm'), 'height')).toBeGreaterThanOrEqual(48);
    expect(px(rule('.pin-confirm'), 'min-width')).toBeGreaterThanOrEqual(48);
    expect(css).not.toContain(':hover');
  });

  it('shows nothing while there is no pin to confirm', () => {
    expect(renderToString(<PinConfirm />)).toBe('');
  });
});
