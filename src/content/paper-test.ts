// Equations that must never appear in a room (GDD, Puzzle Progression, Difficulty pacing;
// architecture, Room Data): the paper test he takes before he plays and again afterwards
// measures whether understanding carries over, so a room must not rehearse it. Content
// tests compare every room's equations with these, up to swapped sides and commuted terms.
//
// Seeded with the brief's paper test (brief addendum, Understanding test). The test's
// "after" version uses new numbers, and the textbook exercises 21 and 24 it names aren't
// written out in the brief; both join here when the paper test is ready (epic 6).
export const paperTest: readonly string[] = [
  // 1. Compare without calculating.
  '47 + 38 = 46 + 39',
  // 2. Predict: the 20 becomes 23.
  '3x + 2 = 20',
  '3x + 2 = 23',
  // 3. Find the mistake: "3x + 2 = 20, so 3x = 22".
  '3x = 22',
  // 4. Go both ways: a story for it.
  '2x + 7 = 25',
];

/**
 * Part 2's paper test (GDD, Paper test for this part; brief addendum, Understanding test: natural
 * numbers). The same four task types, before he plays part 2 and again after it with new numbers.
 * Luka's printable page is `_bmad-output/paper-test-drugi-dio.md`. What each version uses must
 * never appear in a lead, so the test measures what carried over, not what was rehearsed:
 * `content/leads/paper-test.test.ts` looks for every one of these in every lead.
 */
export const paperTestPart2: Readonly<Record<'before' | 'after', readonly string[]>> = {
  before: [
    // 1. Compare without calculating.
    '73 · 58 + 27 · 58',
    '100 · 58',
    '6 · 10³ + 9 · 10²',
    // 2. Predict: one addend grows by 38, the other by 15; brackets round 6 · 2.
    '48 : 6 · 2',
    '48 : (6 · 2)',
    // 3. Find the mistake.
    '6 + 4 · 2 = 20',
    '50 : 8 = 5',
    // 4. Go both ways: a story, then one expression for 12 boys and 15 girls, 5 notebooks each.
    '4 · (6 + 3)',
    '(12 + 15) · 5',
  ],
  after: [
    '64 · 37 + 36 · 37',
    '100 · 37',
    '8 · 10³ + 7 · 10²',
    '36 : 3 · 2',
    '36 : (3 · 2)',
    '5 + 3 · 4 = 32',
    '60 : 7 = 7',
    '3 · (5 + 4)',
    '(14 + 13) · 4',
  ],
};
