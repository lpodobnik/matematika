import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { hr } from '@/content/text/hr';
import { PartsCounter, PartsCounterView } from '@/ui/common/PartsCounter';

const css = readFileSync(new URL('./common.css', import.meta.url), 'utf8');

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
}

function px(declarations: string, property: string): number {
  const value = declarations.match(new RegExp(`(?:^|[\\s;])${property}:\\s*(\\d+)px;`))?.[1];
  return Number(value ?? Number.NaN);
}

describe('the parts counter (story 1.14)', () => {
  it('shows a cog on a plate and his parts, read out from hr.ts', () => {
    const html = renderToString(<PartsCounterView shown={4} visible={true} flight={null} />);
    expect(html).toContain('class="parts-counter"');
    expect(html).toContain('<svg');
    expect(html).toContain(`aria-label="${hr.parts.label}: 4"`);
    expect(html).toContain('>4</span>');
  });

  it('writes big numbers in school notation', () => {
    const html = renderToString(<PartsCounterView shown={1200} visible={true} flight={null} />);
    expect(html).toContain('>1 200</span>');
  });

  it('shows nothing before he has parts or a pin is on screen', () => {
    expect(renderToString(<PartsCounterView shown={0} visible={false} flight={null} />)).toBe('');
    expect(renderToString(<PartsCounter area={{ current: null }} />)).toBe('');
  });

  it('sends a +2 from the pin’s head to the counter, and no praise, only parts (NFR13)', () => {
    const flight = {
      amount: 2,
      from: { x: 400, y: 280, radius: 20, centreX: 320 },
      area: { width: 640, height: 360 },
    };
    const html = renderToString(<PartsCounterView shown={0} visible={true} flight={flight} />);
    expect(html).toContain('class="parts-fly"');
    expect(html).toContain('>+<!-- -->2</span>');
    expect(html).toContain('left:400px');
    expect(html).toContain('top:260px');
    // From (400, 260) to the counter's icon, 34 px in from the area's bottom-left corner.
    expect(html).toContain('--parts-dx:-366px');
    expect(html).toContain('--parts-dy:66px');
    expect(html).not.toMatch(/★|☆|✓|✔|%/);
  });

  it('is in the scene area’s bottom-left corner, with its number at least 20 CSS px', () => {
    const counter = rule('.parts-counter');
    expect(px(counter, 'bottom')).toBe(8);
    expect(px(counter, 'left')).toBe(8);
    expect(px(counter, 'font-size')).toBeGreaterThanOrEqual(20);
    expect(counter).toContain('pointer-events: none');
  });
});
