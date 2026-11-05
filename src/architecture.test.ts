import { readdirSync, readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Enforces the architecture's Architectural Boundaries table by scanning import
// statements and .tsx files (JSX imports react/jsx-runtime implicitly), plus the rule that
// no Croatian letters appear in ui/ or app/.
// Type-only imports count too: a pure folder must not even name a forbidden module.

const pureFolders = [
  'math',
  'room',
  'fight',
  'city',
  'economy',
  'workshop',
  'links',
  'playlog',
] as const;
const pixiPackages = ['pixi.js', '@pixi/react', 'pixi-filters'];
const croatianLetters = /[čćđšžČĆĐŠŽ]/;

interface SourceFile {
  /** Path relative to src/, with forward slashes, e.g. `math/check.ts`. */
  path: string;
  source: string;
}

interface Violation {
  file: string;
  rule: string;
  detail: string;
}

interface ImportRef {
  specifier: string;
  typeOnly: boolean;
  /** `import('…')` or `require('…')`: loaded when the code runs, not with the file. */
  dynamic: boolean;
}

type Target =
  | { kind: 'package'; name: string }
  | { kind: 'internal'; path: string }
  | { kind: 'outside'; specifier: string };

const importPatterns: {
  pattern: RegExp;
  typeGroup: number | null;
  specGroup: number;
  dynamic?: true;
}[] = [
  // import x from '…', import { a, b } from '…', import type { T } from '…', multi-line too
  {
    pattern: /(?:^|[\s;])import\s+(type\s+)?[^'";]*?\sfrom\s*['"]([^'"]+)['"]/g,
    typeGroup: 1,
    specGroup: 2,
  },
  // export { a } from '…', export * from '…', export type { T } from '…'
  {
    pattern: /(?:^|[\s;])export\s+(type\s+)?[^'";]*?\sfrom\s*['"]([^'"]+)['"]/g,
    typeGroup: 1,
    specGroup: 2,
  },
  // import '…' (side effects only)
  { pattern: /(?:^|[\s;])import\s*['"]([^'"]+)['"]/g, typeGroup: null, specGroup: 1 },
  // import('…') and require('…')
  {
    pattern: /(?:\bimport|\brequire)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    typeGroup: null,
    specGroup: 1,
    dynamic: true,
  },
];

function findImports(source: string): ImportRef[] {
  const refs: ImportRef[] = [];
  for (const { pattern, typeGroup, specGroup, dynamic } of importPatterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[specGroup];
      if (specifier === undefined) continue;
      refs.push({
        specifier,
        typeOnly: typeGroup !== null && match[typeGroup] !== undefined,
        dynamic: dynamic === true,
      });
    }
  }
  return refs;
}

function resolveTarget(fromPath: string, specifier: string): Target {
  if (specifier.startsWith('@/')) return { kind: 'internal', path: specifier.slice(2) };
  if (specifier.startsWith('.')) {
    const path = posix.normalize(posix.join(posix.dirname(fromPath), specifier));
    return path.startsWith('..') ? { kind: 'outside', specifier } : { kind: 'internal', path };
  }
  const parts = specifier.split('/');
  const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? specifier);
  return { kind: 'package', name };
}

function topFolder(path: string): string {
  return path.split('/')[0] ?? path;
}

function isUnder(path: string, folder: string): boolean {
  return path === folder || path.startsWith(`${folder}/`);
}

function isPure(path: string): boolean {
  return (pureFolders as readonly string[]).includes(topFolder(path));
}

function isTest(path: string): boolean {
  return /\.test\.tsx?$/.test(path);
}

function describeTarget(target: Target): string {
  if (target.kind === 'package') return target.name;
  if (target.kind === 'internal') return `src/${target.path}`;
  return target.specifier;
}

function checkPureImport(file: string, target: Target): string | null {
  const test = isTest(file);
  if (target.kind === 'package') {
    if (target.name === 'immer') return null;
    if (test && (target.name === 'vitest' || target.name === 'fast-check')) return null;
    if (test && target.name.startsWith('node:')) return null;
    return 'pure folders may import only immer from packages';
  }
  if (target.kind === 'outside') return 'pure folders may not import from outside src/';
  const top = topFolder(target.path);
  if (isPure(target.path) || top === 'config' || top === 'lib') return null;
  if (test && top === 'content') return null;
  return 'pure folders may import only pure folders, config and lib';
}

function checkUiImport(file: string, target: Target): string | null {
  if (target.kind === 'package') {
    if (pixiPackages.includes(target.name) && !isUnder(file, 'ui/scene')) {
      return 'only ui/scene may import Pixi';
    }
    return null;
  }
  if (target.kind !== 'internal') return null;
  if (isUnder(target.path, 'save') || isUnder(target.path, 'audio')) {
    return 'ui may not import save or audio directly';
  }
  if (isUnder(target.path, 'store/effects')) return 'ui may not import effects directly';
  return null;
}

function checkStoreImport(target: Target): string | null {
  if (target.kind === 'internal' && (isUnder(target.path, 'ui') || isUnder(target.path, 'app'))) {
    return 'store may not import ui or app';
  }
  return null;
}

function checkContentImport(file: string, ref: ImportRef, target: Target): string | null {
  if (isTest(file)) return null;
  if (target.kind === 'internal' && isUnder(target.path, 'content')) return null;
  if (ref.typeOnly && target.kind === 'internal' && isPure(target.path)) return null;
  return 'content may import only other content, and types from pure folders';
}

/**
 * The dev panel is in development builds only (architecture, Debug Tools): outside dev/,
 * only a dynamic import in a file that checks `import.meta.env.DEV` may reach it, so a
 * production build drops it. Tests may import it.
 */
function checkDevReach(file: string, source: string, ref: ImportRef, target: Target) {
  if (target.kind !== 'internal' || !isUnder(target.path, 'dev')) return null;
  if (isUnder(file, 'dev') || isTest(file)) return null;
  if (ref.dynamic && source.includes('import.meta.env.DEV')) return null;
  return 'dev/ loads only on demand, behind import.meta.env.DEV';
}

/** The rules of the folder the importing file is in; dev/ keeps the rest of ui's. */
function checkFolder(file: string, ref: ImportRef, target: Target): string | null {
  if (isPure(file)) return checkPureImport(file, target);
  if (isUnder(file, 'ui') || isUnder(file, 'dev')) return checkUiImport(file, target);
  if (isUnder(file, 'store')) return checkStoreImport(target);
  if (isUnder(file, 'content')) return checkContentImport(file, ref, target);
  return null;
}

function findViolations(files: SourceFile[]): Violation[] {
  const violations: Violation[] = [];
  for (const { path, source } of files) {
    const showsText = isUnder(path, 'ui') || isUnder(path, 'app') || isUnder(path, 'dev');
    if (showsText && croatianLetters.test(source)) {
      violations.push({
        file: path,
        rule: 'Croatian text lives only in src/content/text/hr.ts',
        detail: `contains "${source.match(croatianLetters)?.[0]}"`,
      });
    }
    if (!/\.tsx?$/.test(path)) continue;
    // With "jsx": "react-jsx", JSX compiles to an import of react/jsx-runtime that never
    // appears in the source, so the import scan alone would miss it.
    if (path.endsWith('.tsx') && (isPure(path) || (isUnder(path, 'content') && !isTest(path)))) {
      violations.push({
        file: path,
        rule: 'pure folders and content hold no JSX (it imports react/jsx-runtime)',
        detail: 'is a .tsx file',
      });
    }
    for (const ref of findImports(source)) {
      const target = resolveTarget(path, ref.specifier);
      const rule = checkDevReach(path, source, ref, target) ?? checkFolder(path, ref, target);
      if (rule) violations.push({ file: path, rule, detail: `imports ${describeTarget(target)}` });
    }
  }
  return violations;
}

function readSourceTree(dir: string): SourceFile[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .map((entry) => entry.replaceAll('\\', '/'))
    .filter((path) => /\.(tsx?|css)$/.test(path))
    .map((path) => ({ path, source: readFileSync(`${dir}/${path}`, 'utf8') }));
}

const one = (path: string, source: string) => findViolations([{ path, source }]);

describe('architecture boundaries: fixtures', () => {
  describe.each(pureFolders)('a file in %s/', (folder) => {
    it.each([
      ["import { useState } from 'react';", 'react'],
      ["import { Application } from 'pixi.js';", 'pixi.js'],
      ["import { create } from 'zustand';", 'zustand'],
      ["import { animate } from 'motion';", 'motion'],
      ["import { Dial } from '@/ui/scene/scale/Dial';", 'src/ui/scene/scale/Dial'],
      ["import { useGame } from '@/store/store';", 'src/store/store'],
      ["import { loadSave } from '../save/storage';", 'src/save/storage'],
      ["import { engine } from '@/audio/engine';", 'src/audio/engine'],
    ])('fails when it imports: %s', (source, target) => {
      expect(one(`${folder}/sample.ts`, source)).toEqual([
        expect.objectContaining({ file: `${folder}/sample.ts`, detail: `imports ${target}` }),
      ]);
    });

    it('may import immer, config, lib and other pure folders', () => {
      const source = [
        "import { produce } from 'immer';",
        "import { tuning } from '@/config/tuning';",
        "import { assert } from '../lib/assert';",
        "import { parse } from '@/math/parse';",
        "import type { RoomSpec } from '@/room/types';",
      ].join('\n');
      expect(one(`${folder}/sample.ts`, source)).toEqual([]);
    });

    it('fails when it holds JSX, which imports react/jsx-runtime unseen', () => {
      expect(one(`${folder}/Board.tsx`, 'export const B = () => <b />;')).toEqual([
        expect.objectContaining({ file: `${folder}/Board.tsx`, detail: 'is a .tsx file' }),
      ]);
      expect(one(`${folder}/board.test.tsx`, "it('draws', () => <b />);")).toHaveLength(1);
    });
  });

  it('keeps JSX out of content, but not out of ui, app or content tests', () => {
    expect(one('content/rooms/r01.tsx', 'export const r = <b />;')).toHaveLength(1);
    expect(one('content/rooms/rooms.test.tsx', "it('lists', () => <b />);")).toEqual([]);
    expect(one('ui/notebook/Notebook.tsx', 'export const N = () => <b />;')).toEqual([]);
    expect(one('app/App.tsx', 'export const A = () => <b />;')).toEqual([]);
  });

  it('catches type-only, re-exported, side-effect, dynamic and multi-line imports', () => {
    const forms = [
      "import type { ReactNode } from 'react';",
      "export { useGame } from '@/store/store';",
      "export type { Save } from '@/save/schema';",
      "import 'pixi.js';",
      "const audio = await import('@/audio/engine');",
      "import {\n  useEffect,\n  useState,\n} from 'react';",
    ];
    for (const source of forms) {
      expect(one('math/sample.ts', source), source).toHaveLength(1);
    }
  });

  it('lets tests in pure folders use vitest, fast-check, node and content', () => {
    const source = [
      "import { describe, it } from 'vitest';",
      "import fc from 'fast-check';",
      "import { readFileSync } from 'node:fs';",
      "import { rooms } from '@/content/rooms';",
    ].join('\n');
    expect(one('links/room-codec.test.ts', source)).toEqual([]);
    expect(one('links/room-codec.ts', source)).toHaveLength(4);
  });

  it.each([
    ['ui/notebook/LineView.tsx', 'const label = "Ispočetka";', 'č'],
    ['ui/common/Mute.tsx', '// ćao', 'ć'],
    ['ui/scene/map/City.tsx', "const city = 'Međugorje';", 'đ'],
    ['app/App.tsx', "const word = 'šalica';", 'š'],
    ['app/ErrorBoundary.tsx', "const word = 'žaba';", 'ž'],
    ['app/app.css', '/* ŽUTO */', 'Ž'],
  ])('fails when %s contains a Croatian letter', (path, source, letter) => {
    expect(one(path, source)).toEqual([
      expect.objectContaining({ file: path, detail: `contains "${letter}"` }),
    ]);
  });

  it('allows Croatian letters in the text module and outside ui and app', () => {
    expect(one('content/text/hr.ts', "export const hr = { reset: 'Ispočetka' };")).toEqual([]);
    expect(one('math/format.ts', "// 'čćđšž'")).toEqual([]);
  });

  it('keeps Pixi inside ui/scene', () => {
    const source =
      "import { Graphics } from 'pixi.js';\nimport { Application } from '@pixi/react';";
    expect(one('ui/scene/scale/Pan.tsx', source)).toEqual([]);
    expect(one('ui/notebook/Notebook.tsx', source)).toHaveLength(2);
  });

  it('keeps ui away from save, audio and effects', () => {
    expect(one('ui/common/Mute.tsx', "import { engine } from '@/audio/engine';")).toHaveLength(1);
    expect(one('ui/luka/LukaView.tsx', "import { readSave } from '@/save/storage';")).toHaveLength(
      1,
    );
    expect(one('ui/common/X.tsx', "import { save } from '@/store/effects/save';")).toHaveLength(1);
    expect(one('ui/common/X.tsx', "import { useGame } from '@/store/store';")).toEqual([]);
  });

  it('reaches dev/ only on demand, behind import.meta.env.DEV', () => {
    const guarded =
      "const Dev = import.meta.env.DEV ? lazy(() => import('@/dev/DevPanel')) : null;";
    expect(one('app/App.tsx', guarded)).toEqual([]);
    expect(one('app/App.tsx', "const Dev = lazy(() => import('@/dev/DevPanel'));")).toHaveLength(1);
    expect(one('app/App.tsx', "import DevPanel from '@/dev/DevPanel';")).toHaveLength(1);
    expect(one('store/reducer.ts', "import { jump } from '../dev/jump';")).toHaveLength(1);
    expect(one('dev/DevPanel.tsx', "import { devReadout } from '@/dev/dev-view';")).toEqual([]);
    expect(one('dev/DevPanel.test.tsx', "import DevPanel from '@/dev/DevPanel';")).toEqual([]);
  });

  it('keeps dev/ to the rules of ui: no Pixi, save or audio, and no Croatian text', () => {
    expect(one('dev/DevPanel.tsx', "import { Graphics } from 'pixi.js';")).toHaveLength(1);
    expect(one('dev/DevPanel.tsx', "import { readSave } from '@/save/storage';")).toHaveLength(1);
    expect(one('dev/DevPanel.tsx', "import { useGame } from '@/store/store';")).toEqual([]);
    expect(one('dev/DevPanel.tsx', "const label = 'Ispočetka';")).toHaveLength(1);
  });

  it('keeps store away from ui', () => {
    expect(one('store/store.ts', "import { Dial } from '../ui/scene/scale/Dial';")).toHaveLength(1);
    expect(one('store/store.ts', "import { check } from '@/math/check';")).toEqual([]);
  });

  it('lets content import only types from pure folders', () => {
    expect(one('content/rooms/r01.ts', "import type { RoomSpec } from '@/room/types';")).toEqual(
      [],
    );
    expect(one('content/rooms/r01.ts', "import { parse } from '@/math/parse';")).toHaveLength(1);
    expect(one('content/rooms/index.ts', "import { r01 } from './r01-door-lift';")).toEqual([]);
  });
});

describe('architecture boundaries: this project', () => {
  it('has no violations in src/', () => {
    const srcDir = fileURLToPath(new URL('.', import.meta.url));
    const files = readSourceTree(srcDir);
    expect(files.length).toBeGreaterThan(0);
    expect(findViolations(files)).toEqual([]);
  });
});
