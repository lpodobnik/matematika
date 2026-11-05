# Story 1.2: Read, solve and write equations

Status: done

## Story

As Luka,
I want equations parsed, solved exactly and written in school notation,
so that the scale, notebook and checker all work from one model.

**Covers:** basis for FR16 and NFR11; NFR9 (notation); architecture Pattern 1 (`tokens`, `parse`, `expr`, `rational`, `linear`, `format`).

## Acceptance Criteria

1. **Given** number-pad tokens or a string in school notation **When** it is parsed **Then** the result is an `Equation`, or `{ ok: false, reason }`, and nothing throws **And** `2x + 7 = 25`, `x : 3 = 5`, `20 − x = 6`, `2 · 9 + 7 = 25`, `9 = x` and `5 905 − 27x = 316` parse **And** `2x + = 25`, `= 9`, `x =`, `−x = 14`, `2x = 25 − 7 = 18`, `x3 = 12` and a number above 9 999 999 don't
2. **Given** a parsed equation **When** it is read **Then** `3x` and `3 · x` are both multiplication, `:` is division, brackets group and spaces are ignored
3. **Given** a side of an equation **When** `toLinear` runs **Then** it returns an exact `a·x + b` with reduced `BigInt` fractions, or `nonlinear` for `x · x` and `18 : x`, or a division-by-zero result for `18 : 0`, with no thrown error **And** a chain such as `9 999 999 · 9 999 999 · 9 999 999` stays exact
4. **Given** an equation **When** `solve` runs **Then** `2x + 7 = 25` gives 9, `x + 1 = x + 2` gives no solution and `2x = 2x` gives every number
5. **Given** an equation or number **When** `format` runs **Then** it writes `·` (U+00B7), `:`, `−` (U+2212), `3x` without a dot, and thousands from 1 000 with U+202F (`5905` → `5 905`)
6. **Given** random whole-number equations `ax + b = c` with whole-number solutions (fast-check) **When** each is formatted and parsed again **Then** it round-trips, and `solve` returns its solution

## Tasks / Subtasks

- [x] `src/lib/assert.ts` for programmer errors (architecture, Error Handling)
- [x] `src/math/tokens.ts`: the pad's tokens and `tokenize` for strings (AC: 1, 2)
- [x] `src/math/expr.ts`: `Expr`, `Equation`, `substitute`, `hasX`, structural comparison (AC: 2)
- [x] `src/math/parse.ts`: tokens or text to `Equation`, typed failures, never throws (AC: 1, 2)
- [x] `src/math/rational.ts`: reduced `BigInt` fractions (AC: 3)
- [x] `src/math/linear.ts`: `toLinear` and `solve` (AC: 3, 4)
- [x] `src/math/format.ts`: school notation (AC: 5)
- [x] Tests next to each file, including fast-check properties (AC: 1–6)
- [x] `npm run check && npm test && npm run build` green

## Dev Notes

- **Pattern 1** (architecture, Novel Patterns): module responsibilities and the `Expr` / `Equation` types are used as given. `mul` covers implicit `3x`; `div` is `:`. Number literals are whole numbers 0–9 999 999.
- **Checker rule 1** sets what doesn't parse: more than one `=`, x followed by a digit, a leading minus, numbers above 9 999 999. Division by zero parses; `toLinear` reports it, and story 1.3 turns it into `incomplete`. Leading zeros are allowed; brackets parse.
- **Error handling:** user input gives typed results (`{ ok: false, reason }`), never a throw. Programmer errors go through `assert` in `src/lib/assert.ts`.
- **Boundaries:** `math/` is a pure folder: it may import only `immer`, other pure folders, `config` and `lib`; tests may also use `vitest`, `fast-check` and `node:*`. `src/architecture.test.ts` and Biome enforce it. No `Date.now()` or `Math.random()`.
- **Notation** (Consistency Rules): only `math/format.ts` formats equations and numbers: `·` U+00B7, `:`, `−` U+2212, U+202F as the thousands separator from 1 000. The parser ignores spaces. The physical keyboard maps `*` → `·`, `/` → `:`, `-` → `−`, `X` → x.
- **Naming:** kebab-case `.ts` files, tests next to the source, camelCase functions, `@/` imports.
- **Not in this story:** `check.ts`, `moves.ts`, `steps.ts` and `lines.table.ts` (story 1.3); `chain.ts` (epic 4); `forms.ts` (epic 5).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **Implicit multiplication only for a number written straight before x.** `3x` is one factor, so `12 : 3x` divides by 3x and `2 · 3x` is 2 · (3x). `2(x + 1)`, `x x` and `(x)2` are refused (`missing-operator`); no room needs them.
- **A leading plus is refused like a leading minus** (`+x = 3` gives `missing-operand`).
- **Typed parse reasons:** `unknown-symbol`, `too-long`, `no-equals`, `too-many-equals`, `empty-side`, `missing-operand`, `missing-operator`, `leading-minus`, `digit-after-x`, `unbalanced-brackets`, `number-too-big`. Story 1.3 maps them all to `incomplete`; the notebook may later use them for hints.
- **A 500-token limit (`too-long`)** keeps recursion shallow for any input, such as a hostile room link in epic 5. A notebook line is far shorter.
- **Text input takes the keyboard stand-ins** (`*`, `/`, `-`, `X`) and ignores every kind of whitespace, so room files may be written in ASCII. Pad tokens are the school signs themselves (`−`, `·`), and `tokenFromChar` is the one map for both the text parser and the physical keyboard (story 1.6).
- **Structural comparison is built now,** because the architecture puts it in `expr.ts`: chains of + and − (or ·) are flattened along their left spine and compared as sorted terms; a bracketed group on the right stays one term (`20 − (5 − 3)` is not `20 − 5 + 3`); division doesn't commute; sides may swap. Story 1.3 uses it for check lines.
- **Nonlinear is judged by value:** `0 · x` and `(x − x) · x` are linear (0); `x · x`, `18 : x` and `18 : (x + 1)` are not. A divisor that is 0, such as `18 : (x − x)`, is division by zero. When a line has both, division by zero wins, wherever it is (changed in review; see Review).
- **`solve` lives in `linear.ts`** (the architecture names no module for it) and returns `one`, `none`, `every`, `nonlinear` or `division-by-zero`.
- **`format` writes brackets only where the tree needs them,** including around an equal operation on the right (`20 + (5 − 3)`), so format then parse always gives back the same tree. `3 · x` comes out as `3x`; `x · 3` stays as it is. Negative numbers (never in a line; possible in later readouts) get `−` U+2212.
- **Thousands are grouped from 1 000, four-digit numbers included,** as the criterion and the GDD's `5 905` say.
- **No `lines.table.ts` yet.** `project-context.md` says every change to `math/` adds rows there, but the table holds checker verdicts, and story 1.3 creates it with `check.ts` (its criteria). This story's cases are in each module's own test. Following the architecture, where the table belongs to the checker.
- **`src/lib/assert.ts` added** (architecture: `lib/` holds assert) for programmer errors only: a zero denominator, a literal that isn't a whole number from 0 to 9 999 999.
- **`biome.json` force-ignores `.claude`** (`"!!.claude"` in `files.includes`). The workflow's lane worktrees in `.claude/worktrees/` each carry a `biome.json`, and `biome ci .` stopped in the main checkout with "Found a nested root configuration". `.claude/` is never app code.
- **Invisible characters in source are escapes** (`\u202f`, `\u00a0`); `−` and `·` are written as themselves, and a test checks their code points.

### Completion Notes

- `src/math/` holds `tokens`, `parse`, `expr`, `rational`, `linear` and `format`, with tests next to each. All are pure: they import only each other and `@/lib/assert`.
- `parse` turns failures into typed results through one private error class caught at the boundary; any other error is rethrown as a programmer error. Property tests feed it 2,000 random token sequences and 2,000 random strings (pad characters and arbitrary UTF-16).
- `rational` keeps every value reduced with a positive denominator, so `toEqual` compares fractions exactly; `toLinear` and `solve` never divide by a zero they haven't checked.
- `format` is the only place that writes `·`, `−` and U+202F.

### Test Results

- `npm run check`: 44 files, no errors (after the `.claude` force-ignore; `biome ci src scripts` was clean before it too).
- `npm test`: 17 files, 254 tests passing (118 new in 7 files: `tokens`, `parse`, `expr`, `rational`, `linear`, `format`, `assert`).
  - AC1: the six lines parse to the expected trees; the seven refusals give `missing-operand`, `empty-side` (twice), `leading-minus`, `too-many-equals`, `digit-after-x` and `number-too-big`; pad tokens parse like text; random tokens and strings never throw.
  - AC2: `3x` = `3 · x`, `:` is division, brackets and precedence, spaces of every kind ignored.
  - AC3: exact `a·x + b` with reduced fractions (`x : 4 + 6 : 4` is 1/4 · x + 3/2), `nonlinear`, `division-by-zero`, the `9 999 999` chain exact; a property test checks `toLinear` against substitution on random trees.
  - AC4: 9, no solution, every number (plus `5 905 − 27x = 316` gives 207).
  - AC5: `·` U+00B7, `−` U+2212, `3x`, `5 905` with U+202F, checked by code point.
  - AC6: 1,000 random `ax + b = c` (a 1–99, x and b 0–9 999) round-trip and solve to x; 1,000 random trees of any shape round-trip too.
- `npm run build`: `tsc --noEmit` clean; 0.85 MB in 9 files, JavaScript 0.25 MB gzipped (no change: nothing imports `math/` yet).

### File List

- `src/math/tokens.ts`, `src/math/tokens.test.ts`
- `src/math/parse.ts`, `src/math/parse.test.ts`
- `src/math/expr.ts`, `src/math/expr.test.ts`
- `src/math/rational.ts`, `src/math/rational.test.ts`
- `src/math/linear.ts`, `src/math/linear.test.ts`
- `src/math/format.ts`, `src/math/format.test.ts`
- `src/lib/assert.ts`, `src/lib/assert.test.ts`
- `biome.json` (modified: `"!!.claude"`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified), this story file

## Review

Reviewed once; the fixes were applied in one pass with no second review.

### Finding (fixed)

- **Bug: nonlinear hid division by zero** (`src/math/linear.ts`). `toLinear` and `solve` returned whichever problem came first from the left, so `x · x + 18 : 0`, `x · x : 0` and `x · x = 18 : 0` gave `nonlinear`. The architecture's checker rule 1 lists division by zero among the `incomplete` cases of the parse step, before it says "A line that isn't linear is `nonlinear`", so story 1.3 needs division by zero to win.
  - **Fix:** `toLinear` now works out both operands before it decides. Division by zero comes first: a divisor that is exactly 0 is division by zero whatever the dividend is (`x · x : 0`, `18 : x : 0`), and a division by zero in either operand wins. Only after that does a nonlinear operand make the side nonlinear. `solve` works out both sides, then applies the same order. The earlier Calls entry ("the first one from the left is reported") is corrected above.
  - **Tests** (`src/math/linear.test.ts`): `toLinear` on `x · x + 18 : 0`, `18 : 0 + x · x`, `x · x : 0`, `18 : x : 0`, `x · x : (x − x)`, `(x · x) · (18 : 0)` and `18 : x + 2 : (5 − 5)`; `solve` on `x · x = 18 : 0`, `18 : 0 = x · x`, `x · x + 18 : 0 = 4` and `x · x : 0 = 4`. Two fast-check properties (500 random trees each) check that `e : 0`, `e + 18 : 0`, `18 : 0 + e`, and an equation with `18 : 0` on either side all give `division-by-zero`, whatever `e` is. All four new tests failed against the old `linear.ts` and pass now.

### Minor notes (not fixed, for Luka)

- `project-context.md` says every change to `math/` adds rows to `src/math/lines.table.ts`, but the file was not created. Both this story file and epics.md put it in story 1.3, so the documents disagree with each other; update the project-context wording or add the rows in 1.3.
- In `src/math/expr.ts`, structural comparison flattens chains only along the left spine. So `2 · 3x` and `3x · 2` compare as different, and so do `(9 + 2) + 7` and `7 + (9 + 2)`, although each pair differs only in order. None of epic 1's check-line forms hit this.
- `toText` in `src/math/rational.ts` writes `-7/2` with an ASCII minus and a slash, outside `format.ts`. That is fine for tests and the dev panel, but it must never reach the child (rule 7).
- `12 : 3x` parses as 12 : (3x), and `format` writes it back without brackets. A 5th grader may read it as (12 : 3) · x. Writing `12 : (3x)` for a coefficient term on the right of `:` would still give back the same tree.
- The reviewer ran the test suite once (vitest: 17 files, 254 tests, all passing) and did not re-run `npm run check` or `npm run build`. After the fix, all three were run; results below.

### Checks after the review fixes

- `npm run check`: 44 files, no errors.
- `npm test`: 17 files, 258 tests passing (4 new in `src/math/linear.test.ts`).
- `npm run build`: clean; 0.85 MB in 9 files, JavaScript 0.25 MB gzipped (unchanged).
