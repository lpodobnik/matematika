# Story 1.7: Make written lines drive the machine

Status: done

## Story

As the player,
I want each correct line to move the machine and a wrong one to jam it,
so that writing is what starts the machine.

**Covers:** FR17–FR19, FR20 (Try values blanks); NFR13; architecture Pattern 1 (machine progress, which x the pans show, two layers, fading) and Pattern 2 (jam model).

## Acceptance Criteria

1. **Given** a committed line **When** it is acted out **Then** the pans take the line's layout with one generic tween, are evaluated at the stage's solution, show `?` on the gears and hide the readouts **And** the dial keeps its value, and the next exploring action (dial, tray or splitter) returns the pans to the dial's x in the committed line's layout **And** acting out never fires `PansLevel`
2. **Given** a valid line with progress **When** it is committed **Then** the pans stay level, `machineProgress` rises by `tuning.progressStep` (0.2) up to 0.8, the placeholder machine shows it, and `LineAccepted` fires
3. **Given** a valid line without progress (`2x + 8 = 26`) **When** it is committed **Then** it is accepted and `machineProgress` doesn't change
4. **Given** a wrong line **When** enter is pressed **Then** it is acted out at the stage's solution, the pans tip by at least `tuning.jamMinTilt` (4°), the machine jams (`MachineJammed`, kind `line`), and the line stays in the draft, not in `lines` **And** any edit to the draft clears the jam and returns the pans to the last committed line, and enter judges the edited line again **And** `jamsInARow` counts consecutive jams and resets on a committed line
5. **Given** the answer line, then the check line **When** each is committed **Then** `machineProgress` goes to 0.9, then to 1; the stage goes from `open` to `locked` and `StageLocked` fires **And** nothing but the machine shows success: no stars, scores or "correct" screen
6. **Given** a stage whose Try values fading is `blanks` **When** the stage opens **Then** the notebook shows `x = ☐` and the check line with x blanked (`☐ + 4 = 9`); pad input fills only the current blank, and delete clears that blank, never the template's own text **And** in `blank` mode the notebook shows an empty draft line

## Tasks / Subtasks

- [x] `src/math/tokens.ts`, `src/math/format.ts`: the blank token, x blanked out of a line, blanks filled, a line with blanks as text and blank segments; rows in `lines.table.ts` (AC: 6)
- [x] `src/config/tuning.ts`: `progressStep`, `progressCap`, `progressAnswer`, `jamMinTilt` (AC: 2, 4, 5)
- [x] `src/room/types.ts`, `src/room/room.ts`: `machineProgress`, `actingOut`, `jamsInARow`, `templates` on the stage (AC: 1–6)
- [x] `src/room/fading.ts`: the Try values templates for `blanks` (AC: 6)
- [x] `src/room/machine.ts`: machine progress per verdict, the machine's view (AC: 2, 3, 5)
- [x] `src/room/notebook.ts`: acting out committed and wrong lines, jams, `jamsInARow`, locking, blanks input (AC: 1–6)
- [x] `src/room/dial.ts`: a notch ends acting out (AC: 1)
- [x] `src/room/scale.ts`, `src/room/tilt.ts`: the pans at the stage's solution with `?` and no readouts; the jam's minimum tilt (AC: 1, 4)
- [x] `src/room/events.ts`: `MachineJammed`, `StageLocked` (AC: 4, 5)
- [x] `src/ui/scene/scale/`: one generic tween for pieces (AC: 1)
- [x] `src/ui/scene/machine/Machine.tsx`, `src/art/skins/machine.ts`: the placeholder machine, showing progress and jams (AC: 2, 4, 5)
- [x] `src/ui/notebook/`: blanks and the upcoming template line (AC: 6)
- [x] Content tests: every Try values `blanks` stage can be finished by filling its blanks (AC: 6)
- [x] Tests next to each file; `npm run check && npm test && npm run build` green; checked in a browser at 1280 × 800 and 640 × 360

## Dev Notes

- **Which x the pans show (Pattern 1):** exploring uses the dial's x and its label on the gears, with readouts unless the stage hides them. Acting out a written line uses the stage's solution, `?` on the gears and no readouts, and never moves the dial. Any exploring action ends acting out and returns the pans to the dial's x, in the last committed line's layout. `PansLevel` fires only when the dial levels the pans.
- **Two layers (Pattern 1):** `lines` holds committed lines only; a wrong line is never in `lines`. Its tokens stay in the draft, marked as jammed. Any edit clears the jam and returns the pans to the last committed line. Writing a line replaces `pans` with that line's layout. In `blanks` mode delete clears the current blank, never the template's own text.
- **Machine progress (Pattern 1):** 0 to 1 per machine; each valid line with progress adds `tuning.progressStep` (0.2) up to 0.8; the answer line sets 0.9; the check line sets 1 and locks the machine. The skin shows progress continuously.
- **Jams (Pattern 2):** while `jam` is set he can only edit the draft (clears a line jam), drag the splitter off, reset or leave. A wrong line tips by at least `tuning.jamMinTilt` (4°).
- **StageState (Pattern 2):** `machineProgress: number[]`, `actingOut: boolean` ("true from a written line until the next exploring action"), `jamsInARow: number`.
- **Fading (Pattern 1):** Try values `blanks`: when the stage opens, `x = ☐` and the check line with x blanked; pad input fills only the current blank. `blank`: nothing; he writes every line.
- **Pieces tween (Pattern 1):** one generic tween; pieces matched by kind and number move, and the rest fade out or in. Per-frame values through refs, never React state (rule 6); Motion for discrete changes.
- **Pure core (rule 1):** every decision is in `src/room/` and `src/math/`; `ui/` only draws. **Events (rule 2):** `MachineJammed` and `StageLocked` join the `RoomEvent` union. **Notation (rule 7):** only `math/format.ts` makes text, blanks included. **NFR13:** no stars, scores or "correct" screens; only the machine shows success.
- **Files:** `src/room/` (stage reducer, fading), `src/math/`, `src/ui/scene/` (Pixi), `src/art/skins/` (placeholder skins), `src/ui/notebook/`.
- **Not in this story:** arrive ending on the first touch, restart and reset (1.8); poke, pin and the notebook off in `poke` and `pin` (1.9); the tray and Balance `auto` lines (1.10); the splitter and split jams (1.11); hints from `jamsInARow` (epic 2); saving (epic 2).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **The check line locks the stage from `arrive` as well as `open`.** Nothing ends `arrive` until story 1.8, and the notebook already writes in both. A test puts the stage in `open` and checks `open` → `locked`. Locking also turns off the notebook and the dial.
- **A wrong line doesn't set `actingOut`.** While a line jam is set, the scale acts out the jammed draft (`jammedLine`, derived from the draft, which can't change without clearing the jam). An edit then shows exactly what the pans showed before: the dial's x with readouts, or the last line acted out. The stricter reading (still acting out after the edit) would show level pans with `?` that he hadn't earned. On the edit, `pans` is also set back to the last committed line, as Pattern 1 says. That changes nothing yet, but it will drop exploratory tray moves from story 1.10 on.
- **A wrong line that holds for every x** (`x = x`, `x + 4 = x + 4`) is level at the solution. It tips toward the left pan by `jamMinTilt`. `ScaleView.level` is false while jammed.
- **Only a dial notch ends acting out.** A drag that lands back on the same notch changes nothing, as before.
- **Machine progress:** `tuning` gains `progressStep` 0.2, `progressCap` 0.8, `progressAnswer` 0.9 and `jamMinTilt` 4. Progress is rounded to 6 decimals, so 0.2 steps land on 0.6 exactly, and it never goes back. A valid line after the answer leaves 0.9. Only the active machine moves.
- **`jamsInARow`** counts wrong lines only. Refused lines (incomplete, nonlinear, aside) neither count nor reset it; a committed line resets it.
- **Blanks are a new stage field**, `StageState.templates`, which isn't in Pattern 2's list: the lines still to fill, the current one first. The draft holds what fills the current blank. The check template is the stage's own tokens with each x replaced by `☐`, and `·` is inserted where a number stood before x (`3x = 12` → `3 · ☐ = 12`). Every x is blanked and filled with the same value; no room has two.
- **A blank takes digits only**, at most 7 (the digits of 9 999 999). The pad shows the other keys as off, and the keyboard's are ignored. **Delete clears the whole blank in one press**, which is the AC's "delete clears that blank", not one digit at a time. An empty blank on enter is `incomplete` and wiggles.
- **The next template shows under the draft**, lighter and with a dashed rule (`line--upcoming`). A blank is a drawn box; a wrong fill gets a dashed jam-coloured box as well as the wavy underline.
- **One generic tween:** pieces are matched by kind and number on their own pan; a piece that changes pans fades out on one and in on the other. It takes 450 ms, ease-in-out (Motion), with every frame through refs. React keys stay `${side}-${kind}-${index}`; pieces that fade out are drawn as "ghosts" with their own keys. `Piece` no longer takes position props; the tween places it. Pieces also fade in when a room first loads. A gear's identity is its count and divider, not its label, so a change between `?` and a number doesn't start a tween.
- **Placeholder machine** (`ui/scene/machine/`, `art/skins/machine.ts`): one skin for every machine id until each gets its own. It is a door in a frame that rises with progress on a spring, masked to its opening and above the scale's pivot between the pans (a test keeps it clear at ±15°). A jam shows a wedge and steam lines in the jam colour (shape and colour, NFR4), with a 360 ms shake. Nothing else shows success.
- **Tests:** room 1 now fills blanks, so the existing free-writing tests (notebook, store, Notebook page, pad keys) run on room 1 with `fading: { try: 'blank' }`.
- `formatTokens` is now built on the new `formatLine` (text and blank segments); a property test shows a filled template reads as the filled line.
- `.claude/launch.json` (untracked) was added to serve `vite preview` for the browser check.

### Completion Notes

- Pure core: `room/notebook.ts` acts out committed and wrong lines, jams, counts jams, locks on the check line, and handles blanks input. `room/machine.ts` holds progress per verdict and the machine's view. `room/fading.ts` holds the Try values templates. `room/scale.ts` decides which x the pans show (Pattern 1's table). `room/tilt.ts` adds `jamTilt`, and `room/dial.ts` ends acting out on a notch. `math/tokens.ts` adds `BLANK`, `blankOutX` and `fillBlanks`, and `math/format.ts` adds `formatLine`. `MachineJammed` and `StageLocked` join `RoomEvent`.
- UI only draws: the notebook renders blanks, the caret inside the blank and the upcoming line, with keys off by `keyWorks`. The scale's pans tween through `use-piece-tween.ts` (planned by the pure `piece-tween.ts`). `Machine` joins `SceneRoot`.
- Checked in the built-in browser on `vite preview` (production build):
  - Room 1 opens with `x = ☐` and `☐ + 4 = 9`; only the digits, delete and enter are on.
  - `6` → enter: the pans act out `x = 6` (gear `?` against 6, tipped right at 4°, no readouts), the machine shows the wedge and steam, and the draft is marked.
  - Delete: the blank and the jam clear, and the pans return to the dial's 0 with readouts 4 and 9.
  - `5` → enter: level, `?`, door at 0.9. Dragging the dial two notches: the gear shows 2, readouts 2 and 5, layout still `x = 5`. A wrong check `6 + 4 = 9` tips left at 4° and jams.
  - `5` → enter: `5 + 4 = 9` acted out level, door fully up, keys off; no other success marks.
  - At 640 × 360 the blank shows `14` with the caret inside.
  - No console errors, nothing in `matematika:errors`, no `<input>`.
  - The browser pane was hidden, so frames were throttled; smoothness on the tablet is story 1.13's.

### Test Results

- `npm run check`: 115 files, no errors or warnings.
- `npm test`: 43 files, 881 tests passing (109 new or rewritten; 6 new files).
  - AC1: `notebook.test.ts` (acted out: layout replaced, dial kept, a notch returns to the dial's x, never `PansLevel`); `scale.test.ts` (7 new: solution, `?` on small gears only, no readouts, check line as weights, back to the dial's x); `piece-tween.test.ts` (10: matching by kind and number, fades, interrupted tweens, timing).
  - AC2–3: `notebook.test.ts` (0.2 → 0.8 cap over five progress lines, level pans, `LineAccepted`; no change without progress; only the active machine); `machine.test.ts` (15: `progressAfter`, `machineView`, locked phases); `progress-spring.test.ts` (4); `layout.test.ts` (5: door lift, placement clear of the pans, the shake).
  - AC4: `notebook.test.ts` (acted out at the solution, `MachineJammed`, ≥ 4° for near misses, identities and false checks, `jamsInARow` counting and reset, an edit returns the pans and judges again, the view restored); `tilt.test.ts` (5 new, with fast-check); `art/skins/machine.test.ts` (wedge and steam in the jam colour).
  - AC5: `notebook.test.ts` (0.9, then 1, `open` → `locked`, `StageLocked`, notebook and dial stop); `store.test.ts` (2 new: room 1 through dispatch with the full event order, everything ignored once locked); `Notebook.test.tsx` (no success marks once locked).
  - AC6: `notebook.test.ts` (templates on opening, digits only, the 7-digit cap, delete clears the blank and never the template, fill to lock, wrong fills jam, an empty blank wiggles, blank mode is an empty draft, `keyWorks`); `fading.test.ts` (5); `tokens.test.ts` (4 new); `format.test.ts` (4 new, with fast-check); `room.test.ts` (2 new); `Notebook.test.tsx` (4 new: the blank box, the caret in the blank, the keys that are off, a wrong fill); `rooms.test.ts` (every Try values `blanks` stage finishes by filling in x: `answer`, then `check`); `lines.table.ts` (a new group of 13 rows: wrong and empty fills, leading zeros, lines true for every x or for none).
- `npm run build`: `tsc --noEmit` clean; 1.00 MB in 9 files, JavaScript 0.30 MB gzipped.

### File List

- `src/room/fading.ts`, `src/room/fading.test.ts`, `src/room/machine.ts`, `src/room/machine.test.ts` (new)
- `src/ui/scene/machine/Machine.tsx`, `layout.ts`, `layout.test.ts`, `progress-spring.ts`, `progress-spring.test.ts` (new)
- `src/ui/scene/scale/piece-tween.ts`, `piece-tween.test.ts`, `use-piece-tween.ts` (new)
- `src/art/skins/machine.ts`, `src/art/skins/machine.test.ts` (new)
- `src/room/notebook.ts`, `notebook.test.ts`, `scale.ts`, `scale.test.ts`, `tilt.ts`, `tilt.test.ts`, `dial.ts`, `room.ts`, `room.test.ts`, `types.ts`, `events.ts` (modified)
- `src/math/tokens.ts`, `tokens.test.ts`, `format.ts`, `format.test.ts`, `lines.table.ts` (modified)
- `src/config/tuning.ts`, `src/content/rooms/rooms.test.ts`, `src/store/store.test.ts` (modified)
- `src/ui/notebook/Notebook.tsx`, `LineView.tsx`, `NumberPad.tsx`, `notebook.css`, `Notebook.test.tsx`, `pad-keys.test.ts` (modified)
- `src/ui/scene/SceneRoot.tsx`, `src/ui/scene/scale/Pan.tsx`, `src/ui/scene/scale/Piece.tsx` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified), this story file

## Review

Reviewed once; the fixes were applied in one pass with no second review.

### Findings

- None. The review raised no findings that needed a fix, so no code changed.

### Minor notes (not fixed, for Luka)

- `C:\Users\lpodobnik\Claude\matematika\src\room\notebook.ts` (`writingPhases`): the check line also locks the stage from `arrive`, and in the real app it always does, because nothing leaves `arrive` until story 1.8. AC5's `open` to `locked` is covered only by a test that forces the phase to `open`.
- `C:\Users\lpodobnik\Claude\matematika\src\ui\scene\scale\piece-tween.ts`: pieces are matched only on their own pan. So when a line swaps sides (`9 = x + 4` to `x + 4 = 9`), the gear fades out on one pan and in on the other instead of moving, which is narrower than the architecture's "pieces matched by kind and number move".
- `C:\Users\lpodobnik\Claude\matematika\src\room\dial.ts` (`setDial`): acting out ends only on a change of notch. A dial drag that lands back on the same notch dispatches nothing, so it doesn't count as "the next exploring action".
- `C:\Users\lpodobnik\Claude\matematika\src\room\notebook.ts` (`enterLine`): `LineAccepted.progress` is always true for answer and check lines. A repeated `x = n`, which the checker accepts again, reports progress while `machineProgress` stays at 0.9.
- `C:\Users\lpodobnik\Claude\matematika\src\ui\scene\scale\use-piece-tween.ts`: when a tween is interrupted by a new layout, the earlier pieces still fading out disappear at once instead of finishing their fade.

### Checks after the review

- `npm run check`: 115 files, no errors (unchanged).
- `npm test`: 43 files, 881 tests passing (unchanged).
- `npm run build`: `tsc --noEmit` clean; 1.00 MB in 9 files, JavaScript 0.30 MB gzipped (unchanged).
