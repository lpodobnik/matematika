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
