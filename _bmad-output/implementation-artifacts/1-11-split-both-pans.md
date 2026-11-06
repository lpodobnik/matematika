# Story 1.11: Split both pans

Status: done

## Story

As the player,
I want to split both pans into equal parts,
so that I can get from `2x = 18` to x on its own.

**Covers:** FR11; architecture Pattern 1 (balance moves) and Pattern 2 (split jam).

## Acceptance Criteria

1. **Given** Balance is earned and a stage is open **When** the splitter is first available **Then** it wiggles once, and he can set it to 2–9 parts
2. **Given** the splitter set to n **When** he drags it across both pans **Then** each pan's number pieces first combine as a drop does, then each pan's gear count and number is divided by n, and the move completes like any balance move **And** after a typed `2x = 23 − 5`, a split by 2 gives `x = 9` rather than jamming on the odd 23
3. **Given** a split where any gear count or number doesn't divide evenly **When** he drags the splitter across **Then** the machine jams (`MachineJammed`, kind `split`) until he drags the splitter off, which clears the jam
4. **Given** room 4 at `2x = 18` **When** he splits by 2 **Then** the pans show `x = 9` and nothing is written; he writes `x = 9`, then `2 · 9 + 5 = 23`, and the machine locks

## Tasks / Subtasks

- [x] `src/room/splitter.ts`: when the splitter is offered and works, the parts stepper, `splitOutcome` (combine, then divide), `splitBothPans` (even: a balance move; uneven: a split jam), `liftSplitter`, `splitterView` (AC: 1–4)
- [x] `src/room/tray.ts`: export `balanceMove` (was `explored`) and `linearSide`, so a split completes exactly like a tray move (AC: 2)
- [x] `src/room/types.ts`, `room.ts`, `phases.ts`, `first-use.ts`, `src/config/tuning.ts`: `StageState.splitter`, 2 on arrival, kept by reset; the splitter's first use; `splitterMinParts`/`splitterMaxParts` (AC: 1, 3)
- [x] `src/store/actions.ts`, `reducer.ts`: `splitter/step`, `splitter/split`, `splitter/lift`, with the tools earned (AC: 1–4)
- [x] `src/ui/scene/scale/Splitter.tsx`, `splitter-layout.ts`, `splitter-drag.ts`, `StepButton.tsx` (moved out of `Tray.tsx`), `src/art/skins/splitter.ts`, `SceneRoot.tsx`: the holder, the blade, the sweep across both pans, the blade lying across the pans while jammed, dragging it off, the wiggle (AC: 1–3)
- [x] `src/dev/`: the splitter's parts in the dev panel
- [x] `src/content/rooms/rooms.test.ts`: split limits from `tuning`, and every canonical Balance split is an even `splitOutcome` (AC: 4)
- [x] Tests next to each file; `npm run check && npm test && npm run build` green; checked in a browser

## Dev Notes

- **Balance moves (Pattern 1):** the splitter, set to 2–9 parts, first combines each pan's number pieces as a drop does (`2x = 23 − 5` becomes `2x = 18`), then divides each pan's gear count and number; if any doesn't divide evenly the machine jams (`jam.kind = 'split'`) until he drags it off. Room 4's worked sequence: float 5 left, float 5 right writes `2x = 18`, the splitter at 2 gives `x = 9` on the pans, he writes `x = 9`, then `2 · 9 + 5 = 23`.
- **Which x the pans show (Pattern 1):** the splitter is an exploring action: it ends acting out, and the pans are weighed at the dial's x. `PansLevel` still comes only from the dial.
- **Jams (Pattern 2):** while jammed he can only edit the draft (clears a line jam only), drag the splitter off (clears a split jam only), reset or leave. `room/notebook.ts` already kept a split jam on edits and refused enter while jammed.
- **First use (Pattern 2):** the first time the splitter is available it wiggles once (hint level 1); `save.progress.firstUse` gets `'splitter'`.
- **Rules:** game logic only in `src/room/splitter.ts` (rule 1); one store and three actions, events `WayUsed`, `LineAccepted` (source `balance`) and `MachineJammed` (rule 2); the blade moves through a ref, React hears only start, release and settle (rule 6); number shown with `formatNumber` (rule 7); buttons and grab areas at least 48 CSS px, drags end on up, up outside, cancel, blur and a hidden page, no hover (rule 8); rooms stay data (rule 10).
- **Not in this story:** Balance `blanks` (epic 2), saving (epic 2), the tablet check of the gesture's feel (story 1.13).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **Where it is:** a holder in the scene's top-left corner, mirroring the tray: the blade (a bar marked into its parts, under a tag with the number), then + above − beside it. The − and + are the tray's buttons, now `StepButton.tsx`, so they repeat when held the same way.
- **The gesture:** a split happens when a drag from the holder has passed the finger over both pans (each pan's width, y 240–800 in scene units, at any tilt) and is let go anywhere but back over the holder. Over one pan only, it slides back and nothing happens.
- **A jammed split:** the pans keep the pieces they had (the combining step isn't kept either), stay weighed at the dial's x, and the blade lies across both pans, from one pan's centre to the other's, just under the machine, drawn in the jam's colour with each half marked into the parts. The machine shows its usual wedge, steam and shake.
- **Dragging it off:** grab the blade on the pans and let go over the holder, or at least 120 scene units (about 65 CSS px on the tablet) from where it was grabbed. A shorter nudge slides it back onto the pans. `splitter/lift` only clears a split jam; it is ignored otherwise.
- **A split jam counts in `jamsInARow`**, like a line jam, and a committed line resets it (hints from epic 2).
- **The parts are stage state** (`StageState.splitter`, not in the architecture's `StageState`, like the tray's numbers): 2 when a stage arrives, kept by reset. While a split jam is set the stepper does nothing.
- **Gear count:** a pan's x pieces as the scale draws them, over their divider: `2x : 3` splits by 2 into `x : 3`, and `x : 3` can't be split. A split even on both pans that would still need a number too long for a line is ignored (it can't happen in the rooms).
- **When the split completes:** exactly as a tray move (`balanceMove`): `WayUsed` once the pans' equation has the stage's solution again, and with Balance `auto` the line is written unless it is `x = n` (room 4's `x = 9` isn't). A split of pans that one tray move already unbalanced tips at the dial's x and writes nothing.
- **Offered with the tray:** whenever Balance is earned and the stage is `open`, so in room 4 the tray and the splitter wiggle together on first use. A line jam leaves the holder faint.
- **A blade carried, or sliding back, is hidden but stays mounted and grabbable**, like a pan's piece in story 1.10, so a quick second drag always starts.
- **Constants:** `tuning.splitterMinParts` (2) and `splitterMaxParts` (9); the content test now reads them.

### Completion Notes

- Pure core: `room/splitter.ts` decides everything. The scene draws `splitterView`, tracks the sweep with `splitter-drag.ts` and asks `splitterTakes` (against the live store) before it dispatches, so a drag the store ignores slides back.
- Checked in the built-in browser (dev server, `?dev`, Balance on, room 4 opened through the store, pointer events on the canvas): float 5 on each pan wrote `2x = 18`; a sweep over the left pan only slid back; at 3 and 4 parts a sweep across both jammed the machine (blade across the pans, holder empty, tray faint); a short nudge slid it back; dragging it up took it off and cleared the jam; at 2 parts the sweep gave `x = 9` on the pans with nothing written; typing `x = 9` and `2 · 9 + 5 = 23` locked the stage and the room restarted to `done`, with nothing in `matematika:errors`.
- **Found and fixed while checking:** the first version unmounted the blade while it slid back, so a regrab inside that window missed it. It now stays mounted and hidden, and a source test checks it. (The pane was hidden, so Pixi rendered only on screenshots; hits on a just-mounted blade needed a frame first. That is the pane, not the game.)

### Test Results

- `npm run check`: 165 files, no errors or warnings.
- `npm test`: 63 files, 1,255 tests passing (62 new; 4 new files).
  - AC1: `splitter.test.ts` (offered only when open with Balance, off while jammed, 2–9 one step at a time, kept by reset, first-use wiggle with and after the tray); `store.test.ts` (`firstUse` gets `splitter`, hint level 1, the stepper through dispatch); `splitter-layout.test.ts` (48 CSS px buttons and grab areas, clear of the machine and the tray); `art/skins/splitter.test.ts`.
  - AC2: `splitter.test.ts` (combining first after a typed `2x = 23 − 5`; dividing gear counts, numbers, springs and dividers; `WayUsed`, `LineAccepted` with source `balance` for a non-answer line; `blank` writes nothing; one pan unbalanced writes nothing; ends acting out); `splitter-drag.test.ts` (the sweep over both pans, sliding back from one, wired to the store); `rooms.test.ts` (every canonical split is even).
  - AC3: `splitter.test.ts` (uneven gear counts and numbers jam with kind `split`, pans kept, only edit, lift and reset work, lift clears, reset clears, `jamsInARow`); `splitter-drag.test.ts` (nudge slides back, dragging off lifts, a cancelled pointer never splits); `store.test.ts`.
  - AC4: `splitter.test.ts` and `store.test.ts` (room 4: `x = 9` shown, nothing written, then `x = 9` and the check line lock).
- `npm run build`: `tsc --noEmit` clean; 1.04 MB in 9 files, JavaScript 0.31 MB gzipped.

### File List

- `src/room/splitter.ts`, `splitter.test.ts` (new)
- `src/ui/scene/scale/Splitter.tsx`, `StepButton.tsx`, `splitter-drag.ts`, `splitter-drag.test.ts`, `splitter-layout.ts`, `splitter-layout.test.ts` (new)
- `src/art/skins/splitter.ts`, `splitter.test.ts` (new)
- `src/room/tray.ts`, `tray.test.ts`, `types.ts`, `room.ts`, `room.test.ts`, `phases.ts`, `first-use.ts` (modified)
- `src/store/actions.ts`, `reducer.ts`, `store.test.ts` (modified)
- `src/config/tuning.ts`, `src/content/rooms/rooms.test.ts` (modified)
- `src/ui/scene/SceneRoot.tsx`, `scale/Tray.tsx`, `scale/piece-drag.test.ts` (modified)
- `src/dev/DevPanel.tsx`, `dev-view.ts`, `dev-view.test.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified), this story file

## Review

Reviewed once; the fix was applied in one pass with no second review.

### Findings

- **Bug, fixed: at 640 × 360 the splitter's holder sat under the HTML reset control.** On the phone layout the notebook overlays the scene, so the scene fills the 640 × 360 area at scale 0.36 with no letterbox at the top. The holder at scene (20, 20) landed at about CSS (39, 7), and the reset disc (`.reset` in `C:\Users\lpodobnik\Claude\matematika\src\ui\common\common.css`: 8 px in, 56 px, above the canvas) covered its corner and the left end of the blade. A touch there reset the stage instead of picking up the splitter. The tablet was not affected (the scene is letterboxed 128 px down).
  - `C:\Users\lpodobnik\Claude\matematika\src\ui\scene\scale\splitter-layout.ts`: a new `splitterGeometry.resetClearPx` (72 CSS px: the reset's 8 px inset, its 56 px and an 8 px gap), and the holder's x is now `Math.max(geometry.left, geometry.resetClearPx * unitsPerPx)`. The blade, its grab area and the + and − buttons follow from the holder's x. That is 200 units at 640 × 360, where the holder (417 units wide) ends at 617, still left of the machine at 641; about 132 units on the tablet; and 72 units on an exact 1600 × 1000 area. The header comment says why.
  - `C:\Users\lpodobnik\Claude\matematika\src\ui\scene\scale\splitter-layout.test.ts`: a new test reads the reset's box from `common.css` and checks that the holder, the blade's grab area and both buttons, mapped to CSS px through `fitScene`, never intersect it for 640 × 360, an exact 16:10 area of 576 × 360 (offset 0), the tablet (870 × 800) and an exact 1600 × 1000 area. Three of these failed on the old layout (the tablet passed, as the review said). The corner test now expects the holder at `resetClearPx / scale`, and at `left` (20) on a screen large enough that 72 CSS px is less.

### Minor notes (not fixed, for Luka)

- **`liftSplitter` ignores the tools and whether the splitter is offered** (`C:\Users\lpodobnik\Claude\matematika\src\room\splitter.ts`). If Balance is switched off in the dev panel during a split jam, the blade disappears but the jam stays until reset. Dev only.
- **The first-use wiggle is recorded in a component ref** (`C:\Users\lpodobnik\Claude\matematika\src\ui\scene\scale\Splitter.tsx`), and `view.wiggle` is just `hintLevel >= 1`. A remount within the same stage, such as a scene remount after a WebGL context restore, replays the wiggle. `Tray.tsx` has the same pattern.
- **`splitOutcome` tests divisibility on the reduced coefficient (`a.n`).** A typed side like `x : 2 + x : 2`, which the scale draws as two gears on dividers of 2, can't be split by 2. Only unusual typed lines reach this.
- **During a split jam the pans are weighed at the dial's x without the jam's minimum tilt.** With the dial on the solution they can hang level while the machine shows a jam. The architecture says nothing on this; it is a call for you to confirm or veto.
- **Test coverage of the holder above the pan:** the suite was run once (63 files, 1,255 tests passing). The holder-above-the-pan test runs only on the tablet at tilt 0. At 640 × 360 the holder's bottom (about 331 units) is inside the pan band (from 240) and stays clear only because room 4's left pan holds one row.

### Checks after the review

- `npm run check`: 165 files, no errors.
- `npm test`: 63 files, 1,259 tests passing (4 new).
- `npm run build`: `tsc --noEmit` clean; 1.04 MB in 9 files, JavaScript 0.31 MB gzipped (unchanged).
