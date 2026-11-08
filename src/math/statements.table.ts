// Every form of part 2's notebook, true, false and refused (story 8.1). The table is the spec:
// `math/truth.test.ts` runs it, and a new form joins here first.

import type { TruthContext } from '@/math/truth';

export interface StatementRow {
  line: string;
  /** `refused` doesn't read at all; the others read, and are judged. */
  verdict: 'true' | 'false' | 'refused';
  context?: TruthContext;
}

export const statementTable: readonly StatementRow[] = [
  // Belonging.
  { line: '10 ∈ N', verdict: 'true' },
  { line: '0 ∉ N', verdict: 'true' },
  { line: '0 ∈ N₀', verdict: 'true' },
  { line: '0 ∈ N', verdict: 'false' },
  { line: '3 ∉ N', verdict: 'false' },
  { line: '0 ∉ N₀', verdict: 'false' },
  { line: '∈ N', verdict: 'refused' },
  { line: '3 ∈', verdict: 'refused' },
  // Sums, with working on either side.
  { line: '7 · 2 + 1 = 15', verdict: 'true' },
  { line: '7 · 2 + 1 = 14 + 1', verdict: 'true' },
  { line: '7 · 2 + 1 = 16', verdict: 'false' },
  { line: '423 − 37 − 54 = 423 − 91 = 332', verdict: 'true' },
  { line: '423 − 37 − 54 = 423 − 91 = 333', verdict: 'false' },
  { line: '100 − 20 · 3 + 10 : 2 = 45', verdict: 'true' },
  { line: '100 − 20 · 3 + 10 : 2 = 125', verdict: 'false' },
  { line: '5 : 0 = 5', verdict: 'false' },
  { line: '0 : 3 = 0', verdict: 'true' },
  { line: '15', verdict: 'refused' },
  { line: '7 · 2 + 1', verdict: 'refused' },
  { line: '7 · = 15', verdict: 'refused' },
  // A line that goes on from the one before.
  { line: '= 100 − 60 + 5', verdict: 'true', context: { previous: { n: 45n, d: 1n } } },
  { line: '= 46', verdict: 'false', context: { previous: { n: 45n, d: 1n } } },
  { line: '= 45', verdict: 'false' },
  // A letter for a number.
  { line: 'n + 1 = 1 000', verdict: 'true', context: { vars: { n: 999 } } },
  { line: 'n + 1 = 1 000', verdict: 'false', context: { vars: { n: 998 } } },
  { line: 'n + 1 = 1 000', verdict: 'false' },
  // Powers and expanded form.
  { line: '10⁶ = 1 000 000', verdict: 'true' },
  { line: '10⁶ = 100 000', verdict: 'false' },
  { line: '34 072 = 3 · 10⁴ + 4 · 10³ + 7 · 10 + 2', verdict: 'true' },
  { line: '34 072 = 3 · 10⁴ + 4 · 10² + 7 · 10 + 2', verdict: 'false' },
  // Naming a point.
  { line: 'A = 25', verdict: 'true', context: { points: { A: 25 } } },
  { line: 'A = 30', verdict: 'false', context: { points: { A: 25 } } },
  { line: 'A = 25', verdict: 'false' },
  { line: 'A = ', verdict: 'refused' },
  // Comparisons and ranges.
  { line: '230 < x < 240', verdict: 'true' },
  { line: '230 < x < 240', verdict: 'true', context: { vars: { x: 232 } } },
  { line: '230 < x < 240', verdict: 'false', context: { vars: { x: 230 } } },
  { line: '230 ≤ x < 240', verdict: 'true', context: { vars: { x: 230 } } },
  { line: '240 > x > 230', verdict: 'true', context: { vars: { x: 231 } } },
  { line: '5 < x < 6', verdict: 'false' },
  { line: 'x ≥ 3', verdict: 'true', context: { vars: { x: 3 } } },
  { line: 'x ≠ 5', verdict: 'true', context: { vars: { x: 4 } } },
  { line: 'x ≠ 5', verdict: 'false', context: { vars: { x: 5 } } },
  { line: '5 ≠ x', verdict: 'refused' },
  { line: '3 < 5', verdict: 'refused' },
  { line: '3 < x > 5', verdict: 'refused' },
  // Lists.
  { line: '{232, 234, 236, 238}', verdict: 'true' },
  {
    line: '{232, 234, 236, 238}',
    verdict: 'true',
    context: { list: [238, 236, 234, 232] },
  },
  { line: '{232, 234}', verdict: 'false', context: { list: [232, 234, 236] } },
  { line: '{232, 232}', verdict: 'false' },
  { line: '{232, }', verdict: 'refused' },
  { line: '{232', verdict: 'refused' },
  // Approximately: rounded at some place, using the next digit alone.
  { line: '334 ≈ 330', verdict: 'true' },
  { line: '334 ≈ 300', verdict: 'true' },
  { line: '335 ≈ 340', verdict: 'true' },
  { line: '334 ≈ 340', verdict: 'false' },
  { line: '18 499 000 ≈ 18 000 000', verdict: 'true' },
  { line: '18 499 000 ≈ 19 000 000', verdict: 'false' },
  { line: '≈ 330', verdict: 'refused' },
  // Remainders.
  { line: '100 : 7 = 14 ost. 2', verdict: 'true' },
  { line: '55 : 9 = 6 ost. 1', verdict: 'true' },
  { line: '55 : 9 = 5 ost. 10', verdict: 'false' },
  { line: '100 : 7 = 14 ost. 3', verdict: 'false' },
  { line: '5 : 0 = 0 ost. 5', verdict: 'false' },
  { line: '100 : 7 = ost. 2', verdict: 'refused' },
  // All brackets, each closing with its own kind.
  { line: '(3 + 4) · 3 + 3 = 24', verdict: 'true' },
  { line: '2 · [3 + (4 − 1)] = 12', verdict: 'true' },
  { line: '{2 + [3 · (4 − 1)]} · 2 = 22', verdict: 'true' },
  { line: '(3 + 4] · 3 = 21', verdict: 'refused' },
  { line: '(3 + 4 · 3 = 15', verdict: 'refused' },
  // Distributivity.
  { line: '409 · 86 − 309 · 86 = (409 − 309) · 86 = 8 600', verdict: 'true' },
  { line: '5 · (3 + 4) = 5 · 3 + 5 · 4', verdict: 'true' },
  { line: '5 · (3 + 4) = 5 · 3 + 4', verdict: 'false' },
  // The mean.
  { line: 'x̄ = (6 + 14) : 2 = 10', verdict: 'true' },
  { line: 'x̄ = (6 + 14) : 2 = 11', verdict: 'false' },
  { line: 'x̄ = (6 + 14) : 2', verdict: 'true', context: { mean: 10 } },
  { line: 'x̄ = (6 + 14) : 2', verdict: 'false', context: { mean: 9 } },
  { line: 'x̄', verdict: 'refused' },
  // Too long, or nothing.
  { line: '1 000 000 000 000 000 = 1', verdict: 'refused' },
  { line: '', verdict: 'refused' },
];
