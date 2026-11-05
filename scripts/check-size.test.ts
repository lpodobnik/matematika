import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { measure, overBudget, totalBudgetBytes } from './check-size';

const dir = mkdtempSync(join(tmpdir(), 'check-size-'));
mkdirSync(join(dir, 'assets'));
writeFileSync(join(dir, 'index.html'), 'x'.repeat(100));
writeFileSync(join(dir, 'assets', 'index.js'), 'const a = 1;\n'.repeat(1000));
writeFileSync(join(dir, 'assets', 'paper.webp'), Buffer.alloc(2048));

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('check-size', () => {
  it('adds up every file in the build, nested ones included', () => {
    const report = measure(dir);
    expect(report.fileCount).toBe(3);
    expect(report.totalBytes).toBe(100 + 13 * 1000 + 2048);
  });

  it('measures JavaScript gzipped', () => {
    const report = measure(dir);
    expect(report.jsGzipBytes).toBeGreaterThan(0);
    expect(report.jsGzipBytes).toBeLessThan(13 * 1000);
  });

  it('fails only above the 30 MB soft budget', () => {
    expect(totalBudgetBytes).toBe(30 * 1024 * 1024);
    expect(overBudget({ totalBytes: totalBudgetBytes, jsGzipBytes: 0, fileCount: 1 })).toBe(false);
    expect(overBudget({ totalBytes: totalBudgetBytes + 1, jsGzipBytes: 0, fileCount: 1 })).toBe(
      true,
    );
  });
});
