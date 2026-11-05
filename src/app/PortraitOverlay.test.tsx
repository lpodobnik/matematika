import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PortraitOverlay } from '@/app/PortraitOverlay';
import { hr } from '@/content/text/hr';

const css = readFileSync(new URL('./app.css', import.meta.url), 'utf8');

describe('PortraitOverlay', () => {
  it('asks to turn the device, with its text from hr.ts', () => {
    const html = renderToString(<PortraitOverlay />);
    expect(html).toContain('portrait-overlay');
    expect(html).toContain(hr.app.turnToLandscape);
  });

  it('is hidden by default and shown only in portrait', () => {
    expect(css).toMatch(/\.portrait-overlay\s*\{\s*display:\s*none;\s*\}/);
    const portrait = css.match(/@media \(orientation: portrait\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(portrait).toMatch(/\.portrait-overlay\s*\{[^}]*display:\s*flex;/);
    expect(portrait).toMatch(/position:\s*fixed;/);
  });
});
