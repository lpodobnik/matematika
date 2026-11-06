import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { hr } from '@/content/text/hr';
import { HintButton, HintControl } from '@/ui/common/HintButton';
import { fitScene, sceneSize } from '@/ui/scene/fit-scene';
import type { Box } from '@/ui/scene/scale/dial-layout';
import { beamPose, labelFontSize, scaleGeometry } from '@/ui/scene/scale/layout';
import { resetCorner } from '@/ui/scene/scale/pin-tag-layout';
import { splitterLayout } from '@/ui/scene/scale/splitter-layout';

const css = readFileSync(new URL('./hint-button.css', import.meta.url), 'utf8');
const resetCss = readFileSync(new URL('./common.css', import.meta.url), 'utf8');
const phoneQuery = '@media (max-height: 499.98px)';

/** The declarations of the first rule for `selector` in `source` from `from` on. */
function rule(source: string, selector: string, from = 0): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.slice(from).match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`));
  return match?.[1] ?? '';
}

/** A declaration's leading CSS px, as `width: 56px;` or `border: 2px solid …;`. */
function px(declarations: string, property: string): number {
  const value = declarations.match(new RegExp(`(?:^|[\\s;])${property}:\\s*(\\d+)px[\\s;]`))?.[1];
  return Number(value ?? Number.NaN);
}

/** The button's box in CSS px, on the tablet or (under 500 px tall) on a phone. */
function buttonBox(phone: boolean): Box {
  const base = rule(css, '.hint');
  const small = rule(css, '.hint', css.indexOf(phoneQuery));
  const pick = (property: string) => {
    const value = phone ? px(small, property) : Number.NaN;
    return Number.isNaN(value) ? px(base, property) : value;
  };
  return { x: pick('left'), y: pick('top'), width: pick('width'), height: pick('height') };
}

function resetBox(): Box {
  const reset = rule(resetCss, '.reset');
  return {
    x: px(reset, 'left'),
    y: px(reset, 'top'),
    width: px(reset, 'width'),
    height: px(reset, 'height'),
  };
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** A scene box in the scene area's CSS px. */
function onScreen(box: Box, fit: { scale: number; x: number; y: number }): Box {
  return {
    x: fit.x + box.x * fit.scale,
    y: fit.y + box.y * fit.scale,
    width: box.width * fit.scale,
    height: box.height * fit.scale,
  };
}

const screens = [
  ['the tablet, the notebook beside the scene', fitScene(1280 - 0.32 * 1280, 800), false],
  ['a phone at 640 × 360, the notebook over the scene', fitScene(640, 360), true],
] as const;

describe('the hint button (story 1.16)', () => {
  it('is a button named from hr.ts showing `?`, that never takes focus, never an <input>', () => {
    const html = renderToString(<HintControl works shown={false} onPress={vi.fn()} />);
    expect(html).toContain('<button');
    expect(html).toContain(`aria-label="${hr.ui.hint}"`);
    expect(html).toContain('?');
    expect(html).toContain('tabindex="-1"');
    expect(html).not.toContain('<input');
    expect(html).not.toContain('disabled');
  });

  it('shows as off where he can’t act, and its ring heavier while a hint shows', () => {
    const off = renderToString(<HintControl works={false} shown={false} onPress={vi.fn()} />);
    expect(off).toContain('disabled');
    const on = renderToString(<HintControl works shown onPress={vi.fn()} />);
    expect(on).toContain('data-shown="true"');
    expect(rule(css, '.hint:disabled')).toMatch(/opacity:\s*0\.4/);
    expect(px(rule(css, '.hint[data-shown="true"]'), 'border-width')).toBeGreaterThan(
      px(rule(css, '.hint'), 'border'),
    );
  });

  it('is at least 48 CSS px, with no hover state', () => {
    for (const phone of [false, true]) {
      const box = buttonBox(phone);
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
    expect(css).not.toContain(':hover');
  });

  it('draws nothing before a room is entered', () => {
    expect(renderToString(<HintButton />)).toBe('');
  });

  it.each(screens)(
    'stands directly under the reset control, inside the corner the tags keep clear, on %s',
    (_, fit, phone) => {
      const box = buttonBox(phone);
      const reset = resetBox();
      expect(box.y).toBeGreaterThanOrEqual(reset.y + reset.height + 8);
      expect(Math.abs(box.x + box.width / 2 - (reset.x + reset.width / 2))).toBeLessThanOrEqual(4);
      const corner = onScreen(resetCorner(fit.scale, fit), fit);
      expect(box.x).toBeGreaterThanOrEqual(corner.x);
      expect(box.x + box.width).toBeLessThanOrEqual(corner.x + corner.width);
      expect(box.y + box.height).toBeLessThanOrEqual(corner.y + corner.height);
    },
  );

  it.each(screens)(
    'keeps clear of the splitter’s holder and the left pan on %s',
    (_, fit, phone) => {
      const box = buttonBox(phone);
      const holder = splitterLayout(fit.scale, labelFontSize(fit.scale));
      for (const part of [holder.box, holder.grab, holder.up, holder.down]) {
        expect(overlaps(box, onScreen(part, fit))).toBe(false);
      }
      // The left pan at every tilt, with a row of two-number weights standing on it.
      const row = labelFontSize(fit.scale) * 2.6;
      for (const tilt of [-15, -10, -5, 0, 5, 10, 15]) {
        const pan = beamPose(tilt).left;
        const half = scaleGeometry.panWidth / 2;
        const swept = { x: pan.x - half, y: pan.y - row, width: 2 * half, height: row + 22 };
        expect(overlaps(box, onScreen(swept, fit)), `tilt ${tilt}`).toBe(false);
      }
      expect(box.y + box.height).toBeLessThan(fit.y + sceneSize.height * fit.scale);
    },
  );
});
