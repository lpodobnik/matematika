// Reports the size of the production build and fails only above the soft budget, so a
// change of budget is deliberate (architecture, Performance). Imports nothing from src/.
// Run by Node directly: node scripts/check-size.ts [dir]

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const megabyte = 1024 * 1024;
export const totalBudgetBytes = 30 * megabyte;
export const jsGzipTargetBytes = 1 * megabyte;

export interface SizeReport {
  totalBytes: number;
  jsGzipBytes: number;
  fileCount: number;
}

export function measure(dir: string): SizeReport {
  const report: SizeReport = { totalBytes: 0, jsGzipBytes: 0, fileCount: 0 };
  for (const entry of readdirSync(dir, { recursive: true, encoding: 'utf8' })) {
    const path = join(dir, entry);
    if (!statSync(path).isFile()) continue;
    const bytes = readFileSync(path);
    report.fileCount += 1;
    report.totalBytes += bytes.length;
    if (/\.m?js$/.test(entry)) report.jsGzipBytes += gzipSync(bytes).length;
  }
  return report;
}

export function overBudget(report: SizeReport, budget = totalBudgetBytes): boolean {
  return report.totalBytes > budget;
}

function formatMb(bytes: number): string {
  return `${(bytes / megabyte).toFixed(2)} MB`;
}

if (import.meta.main) {
  const dir = process.argv[2] ?? 'dist';
  const report = measure(dir);
  console.log(
    `Build size: ${formatMb(report.totalBytes)} in ${report.fileCount} files ` +
      `(soft budget ${formatMb(totalBudgetBytes)}); ` +
      `JavaScript gzipped: ${formatMb(report.jsGzipBytes)} (target under ${formatMb(jsGzipTargetBytes)})`,
  );
  if (overBudget(report)) {
    console.error(
      `The build is over the ${formatMb(totalBudgetBytes)} budget. Change the budget on purpose or shrink the build.`,
    );
    process.exit(1);
  }
}
