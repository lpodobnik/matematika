# Story 1.3: Judge a written line

Status: review

## Story

As Luka,
I want every written line judged by its solution,
so that any correct line, including skipped steps, is accepted and every wrong one is caught.

**Covers:** FR16–FR19 (judging); NFR11; architecture Pattern 1 (checker rules, progress, `moves`, `steps`).

## Acceptance Criteria

1. **Given** a stage equation and its committed lines **When** a line is checked **Then** the verdict is `incomplete`, `nonlinear`, `aside`, `wrong`, `valid` (with `move` and `progress`), `answer` or `check`, by the architecture's checker rules
2. **Given** the stage `2x + 7 = 25` **When** lines are checked **Then** `2x = 18`, `2x = 25 − 7`, `x = 18 : 2` and `x = 9` (a skipped step) are accepted, and `9 = x` is `answer` **And** `2x = 32`, `x = 16` and `2 + x = 25` are `wrong` **And** `2x + 8 = 26` is `valid` with `progress: false` **And** `x = 18 : 0`, `2x = 25 − 7 = 18` and `x3 = 9` are `incomplete`
3. **Given** the answer line `x = 9` has been written **When** the next line is checked **Then** `2 · 9 + 7 = 25` and `9 · 2 + 7 = 25` are `check`, `25 = 25` is `aside` and `2 · 8 + 7 = 25` is `wrong`
4. **Given** the answer line has not been written yet **When** `2 · 9 + 7 = 25` is checked **Then** it is `aside`
5. **Given** the chain `2x + 7 = 25` → `2x = 25 − 7` → `2x = 18` → `x = 18 : 2` → `x = 9` **When** progress is measured with the tuple (terms on the x side, coefficient not 1, operators on the number side) **Then** every step makes progress
6. **Given** `src/math/steps.ts` **When** asked for the next step of an equation by Try values or Balance **Then** it returns the canonical next line (Balance for `2x + 5 = 23`: `2x = 18`, then `x = 9`)
7. **Given** `src/math/lines.table.ts`, a named list of rows (stage, line, expected verdict) **When** `lines.table.test.ts` runs **Then** every row passes, including rows for rooms 1–4 (both stages of rooms 2 and 3) and every line of room 4's worked sequence
8. **Given** random equations (fast-check) **When** a solution-preserving step is applied (the same number added to both sides, both sides multiplied by a whole number other than 0, a side evaluated) **Then** the line is accepted, and changing one number on one side only is rejected

## Tasks / Subtasks

- [x] `src/math/moves.ts`: `Side`, `Term`, `Move`; progress tuple (`complexity`, `makesProgress`); `classifyMove` (AC: 1, 5)
- [x] `src/math/check.ts`: `Verdict`, `check(lines, line)` by checker rules 1–5; `stageSolution`, `isAnswerLine`, `checkLineFor`, `isCheckLine` (AC: 1–4)
- [x] `src/math/steps.ts`: `nextStep` and `canonicalSolution` for Try values and Balance (AC: 6)
- [x] `src/math/lines.table.ts` and `lines.table.test.ts`: the AC lines, checker-rule edge cases, rooms 1–4 (AC: 7)
- [x] Property tests with fast-check in `check.test.ts` and `steps.test.ts` (AC: 8)
- [x] `npm run check && npm test && npm run build` green

## Dev Notes

- **Pattern 1, checker rules** (architecture, Novel Patterns): 1 parse failures and division by zero are `incomplete`, then `nonlinear`; 2 a line with no x is `check` only if true, after the answer line and equal to the stage with n put in (up to factor order, commuted terms, swapped sides), otherwise `aside` if true and `wrong` if false; 3 a line with x is correct only with one solution equal to the stage's; 4 bare `x = n` / `n = x` is `answer`; 5 any other correct line is `valid` with `move` and `progress`.
- **Progress tuple** (Pattern 1, Progress): `(terms on the x side, 1 if x's coefficient isn't 1, operators on the number side)`, lexicographic, compared with the previous committed line. Machine progress (0.2 per step, 0.9, 1) belongs to the stage reducer (story 1.7), not here.
- **Types** used as given in the architecture: `Verdict` (Pattern 1), `Move`, `Term`, `Side` (Pattern 1 and Data Architecture).
- **Built on story 1.2:** `parse` (typed failures), `solve` / `toLinear` (division by zero wins over nonlinear), `substituteEquation`, `sameEquation` (structural comparison), `formatEquation`.
- **Boundaries:** `math/` is pure: imports only other `math/` modules and `@/lib/assert`; tests may use `vitest`, `fast-check`. No time or randomness. `src/architecture.test.ts` and Biome enforce it.
- **Naming:** kebab-case files with tests next to them; `LINE_TABLE` is UPPER_SNAKE as a module-level literal table (Naming Conventions).
- **Testing Strategy:** the line-checker table is the GDD's technical metric; every change to `math/` adds rows to it (project-context.md).
- **Not in this story:** the notebook and `notebook/enter` (1.6), acting out, jams and machine progress (1.7), room content files (1.4, 1.8), Undo steps and `chain.ts` (epic 4), `forms.ts` (epic 5).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **`check(lines, line)`:** `lines[0]` is the stage equation and the rest are committed lines; `line` is pad tokens, text or an `Equation` from the pans (the architecture's data flow feeds both into `check()`). "After the answer line" means any committed line is a bare `x = n` or `n = x`.
- **Terms are counted as written**, along the + and − chain, with a bracketed group as one term. So `2x + 7 − 7 = 25 − 7` is valid but makes no progress (3,1,1 against 2,1,0); the next `2x = 18` does. Counting after combining like terms would make it progress; the architecture's wording reads as written.
- **Progress compares with the previous committed line**, as the architecture says, so a longer valid line followed by a shorter one counts as progress again. Harmless: machine progress caps at 0.8 before the answer, and nothing is scored.
- **Lines with x on both sides** (outside the MVP, but he can write `2x + 7 = x + 16`) are judged like any line; their tuple is (terms on both sides, 1, 0). Lines with no x get (0, 0, operators).
- **Move classification**, in order: `none` (same up to commuted terms), `swap`, `evaluate`, `add-both` / `move-across`, `split-both`, `compound`. `add-both` carries the piece put on both pans (`2x + 7 = 25` → `2x = 18` is a float 7); `move-across` carries the piece that left, as it was on its pan (→ `2x = 25 − 7` is the weight 7), and needs one side to lose a term while the other shows the change written out. Multiplying both sides is `compound`, because the architecture's `Move` has no such kind. `x = 18 : 2` after `2x = 18` is `split-both` (the pans show the same).
- **A change by part of an x** is a `Term` with `divisor` (`x : 3` on both pans); a change by a fraction of a number is `compound`, since no weight holds a fraction.
- **Type homes:** `Side`, `Term` and `Move` live in `math/moves.ts`, and `WayId` in `math/steps.ts`, as their first users; `room/` doesn't exist yet. Later stories import them from there.
- **`steps.ts` covers Try values and Balance only** (`StepWay`); Undo comes with `chain.ts` in epic 4. After the answer line the next step is the check line, then `null`.
- **Balance steps use one drop and one split**, as in the architecture's room 4 sequence: the number off the x side, then the splitter by the whole coefficient. The tray's 1–99 and the splitter's 2–9 are not applied here; story 1.13's content tests can check them with `classifyMove` on each step. Epic 5's builder (coefficients up to 99, numbers up to 9 999) will need multi-drop and multi-split steps.
- **Contradiction for epic 4 (not resolved here):** with a tray of weights and floats only, Balance can't finish when x is subtracted (springs) or divided, so `nextStep` returns `null` for `20 − x = 6` and `x : 3 = 5`. Rooms 1–4 don't need it (rooms 2 and 3 finish by Try values), but the GDD lists Balance as a finishing way for room 9 (`135 − 5x = 100`, "All three") and room 11 (`5 905 − 27x = 316`, "Balance, Undo"). The pans can reach `35 − 5x = 0`, then `7 − x = 0`, but never `x = 7`. Epic 4 needs a rule.
- **`stageSolution` asserts** a stage has one whole-number solution from 0 to 9 999 999: content tests guarantee it, so anything else is a programmer error.
- **Smaller calls:** `1x = 9` is `valid`, not `answer` (the answer is a bare x); writing `x = 9` again after the answer is `answer` again; a valid line after the answer is accepted without progress, and the check line still counts; a line repeating the previous one is `valid` with move `none` and no progress.
- **The line table** is `LINE_TABLE`, named groups of rows (`stage`, optional `before` lines, `line`, expected `verdict`, and for valid lines `progress` and optionally `move`). The test checks every `before` line is accepted in turn, so a row can't rest on an impossible notebook. It also resolves story 1.2's note that `lines.table.ts` was missing.

### Completion Notes

- `check` follows the five rules in order and never throws on user input (2,000 random pad sequences); `stageSolution` is the only assertion, on content.
- Every AC line is a row in the table's first group; a second group covers each checker rule's edge cases (every parse failure, division by zero over nonlinear, no solution, every number, leading zeros, order of operations, brackets, x on both sides, check-line order).
- Rooms 1–4: per stage, the canonical solution of each way from `steps.ts` (asserted against `canonicalSolution` in `steps.test.ts`), skipped steps, misconceptions as wrong lines (`3 + x = 12`, `x = 23 − 5 : 2`, `x = 26` for `20 − x = 6`), and room 4's worked sequence plus the 1.10 and 1.11 paths.

### Test Results

- `npm run check`: 52 files, no errors.
- `npm test`: 21 files, 446 tests passing (188 new in 4 files: `lines.table` 137, `check` 17, `moves` 14, `steps` 20). Property tests re-run six times with fresh seeds, all green.
  - AC1–4: `lines.table.test.ts` rows for every AC line, plus `check.test.ts` for verdict shapes, input forms (tokens, text, `Equation`, keyboard stand-ins) and check-line order.
  - AC5: `moves.test.ts` checks the tuples (2,1,0), (1,1,1), (1,1,0), (1,0,1), (1,0,0) and that each step makes progress.
  - AC6: `steps.test.ts`: Balance `2x + 5 = 23` → `2x = 18` → `x = 9` → `2 · 9 + 5 = 23` → `null`; Try values; canonical solutions of rooms 1–4.
  - AC7: 134 rows in 8 groups, including both stages of rooms 2 and 3 and every line of room 4's worked sequence; each stage has a check line and at least two wrong lines.
  - AC8: fast-check over four stage forms (`ax + b = c`, `ax − b = c`, `b − ax = c`, `x : a = c`): the same number added or taken on both sides, both sides times 1–99 and a side evaluated are `valid`; `x = n` then the check line pass; one number changed on one side, or different numbers added to each side, is `wrong`. Canonical Try values and Balance solutions pass the checker line by line.
- `npm run build`: clean; 0.85 MB in 9 files, JavaScript 0.25 MB gzipped (unchanged: nothing in the app imports the checker yet).

### File List

- `src/math/check.ts`, `src/math/check.test.ts`
- `src/math/moves.ts`, `src/math/moves.test.ts`
- `src/math/steps.ts`, `src/math/steps.test.ts`
- `src/math/lines.table.ts`, `src/math/lines.table.test.ts`
- `_bmad-output/implementation-artifacts/1-3-judge-a-written-line.md` (this file)
