import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { palette } from '@/art/palette';

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));
const read = (relative: string) => readFileSync(path(relative), 'utf8');
const hex = (value: number) => `#${value.toString(16).padStart(6, '0')}`;
const camel = (kebab: string) => kebab.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** WCAG relative luminance of a 0xRRGGBB colour. */
function luminance(value: number): number {
  const channel = (shift: number) => {
    const c = ((value >> shift) & 0xff) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
}

const contrast = (a: number, b: number) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

/** The art bible's Palette table, token by token: names in the first column, colours in the second. */
function bibleTable(): Map<string, string> {
  const bible = read('../../_bmad-output/art-bible.md');
  const section = bible.slice(bible.indexOf('## Palette'), bible.indexOf('## Line, ink'));
  const table = new Map<string, string>();
  for (const row of section.split('\n').filter((line) => line.startsWith('| `'))) {
    const [, names = '', colours = ''] = row.split('|');
    const tokens = [...names.matchAll(/`([a-z][A-Za-z]*)`/g)].map((m) => m[1] as string);
    const values = [...colours.matchAll(/`(#[0-9A-Fa-f]{6})`/g)].map((m) =>
      (m[1] as string).toLowerCase(),
    );
    expect(values, row).toHaveLength(tokens.length);
    for (const [i, token] of tokens.entries()) table.set(token, values[i] as string);
  }
  return table;
}

/** Every CSS file under src, with its path. */
function cssFiles(): { file: string; source: string }[] {
  const root = path('..');
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .map((entry) => entry.replaceAll('\\', '/'))
    .filter((file) => file.endsWith('.css'))
    .map((file) => ({ file, source: readFileSync(`${root}/${file}`, 'utf8') }));
}

describe('the palette (story 2.12)', () => {
  it('keeps every colour token in app.css in step with palette.ts', () => {
    const css = read('../app/app.css');
    const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
    const tokens = [...root.matchAll(/--([a-z][a-z-]*):\s*(#[0-9a-f]{3,8})\s*;/gi)];
    expect(tokens.length).toBeGreaterThanOrEqual(7);
    for (const [, name = '', value = ''] of tokens) {
      const key = camel(name);
      expect(key in palette, `--${name} is not a palette token`).toBe(true);
      expect(value.toLowerCase(), `--${name}`).toBe(hex(palette[key as keyof typeof palette]));
    }
  });

  it('writes no colour into the UI’s CSS but through the tokens', () => {
    for (const { file, source } of cssFiles()) {
      const body =
        file === 'app/app.css'
          ? source.slice(source.indexOf('}', source.indexOf(':root')) + 1)
          : source;
      const code = body.replace(/\/\*[\s\S]*?\*\//g, '');
      expect(code.match(/#[0-9a-f]{3,8}\b|\b(rgb|rgba|hsl|hsla)\(/gi), file).toBeNull();
    }
  });

  it('matches the art bible’s Palette table, token for token', () => {
    const table = bibleTable();
    expect([...table.keys()].sort()).toEqual(Object.keys(palette).sort());
    for (const [name, value] of Object.entries(palette))
      expect(table.get(name), name).toBe(hex(value));
  });

  it('reads ink at 7 : 1 on paper and at 4.5 : 1 or more on the shade and the table', () => {
    expect(contrast(palette.ink, palette.paper)).toBeGreaterThanOrEqual(7);
    expect(contrast(palette.ink, palette.paperShade)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.ink, palette.table)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.ink, palette.lampWash)).toBeGreaterThanOrEqual(4.5);
  });
});
