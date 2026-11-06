# Story 1.10: Balance with the tray

Status: done

## Story

As the player,
I want to put the same piece on both pans or take it off both,
so that I can change the equation without the dial.

**Covers:** FR10, FR14, FR20 (Balance `auto`), FR33 (first-use wiggle); architecture Pattern 1 (balance moves).

## Acceptance Criteria

1. **Given** Balance is earned and a stage is open **When** the tray appears **Then** it holds weights and floats only, each numbered 1–99 with − and + buttons that repeat when held, and it wiggles once on first use **And** x-gears and springs can't be dragged off or added
2. **Given** a piece dropped on a pan, or a weight or float dragged off a pan into the tray **When** the drop lands **Then** the number pieces on that pan combine into one piece of their sum (a weight if positive, a float if negative, nothing if zero) **And** a drop that would leave a pan with no x pieces below 0 is refused and slides back
3. **Given** a change to one pan only **When** it lands **Then** the pans tip at the dial's x and nothing is written
4. **Given** the other pan gets the same change **When** the pans' equation has the stage's solution again **Then** the move is complete and `WayUsed` fires with `balance` **And** with Balance fading `auto`, the equation is appended as the next line, unless it is `x = n`, which he writes
5. **Given** exploratory moves **When** he drags a piece back, or resets **Then** the pans go back; writing a line replaces the exploratory layout with the line's
6. **Given** room 4 (water wheel): `2x + 5 = 23`, dial 0–6, `tiltPerUnit: 0.75`, a 4-notch poke window, a pin beyond the dial (track 0–12), Try values `blank`, Balance `auto` **When** he puts a float 5 on the left **Then** the equation is `2x = 23`, the pans tip, and nothing is written **And** when he puts a float 5 on the right, `2x = 18` is written **And** a content test confirms the dial can't reach 9; typing `x = 9` and the check line still locks the machine, because any correct method is accepted

## Tasks / Subtasks

- [x] `src/room/tray.ts`: when the tray is offered and works, the stepper, drop and take, combining a pan's numbers, the refusal, completion, the `auto` line, `trayView` (AC: 1–5)
- [x] `src/room/types.ts`, `room.ts`, `phases.ts`, `events.ts`, `notebook.ts`, `first-use.ts`: `TrayKind`, `TrayNumbers`, the stage's `tray`, `WayUsed`, a shared `commitLine`, the tray's first use (AC: 1, 4, 5)
- [x] `src/store/`: `tray/step`, `tray/drop`, `tray/take`, `dev/set-tools`; the tray takes the tools earned (AC: 1–4)
- [x] `src/content/rooms/r04-water-wheel.ts`, `index.ts`, `rooms.test.ts`: room 4, the fading matrix, ways that can finish (AC: 6)
- [x] `src/ui/scene/scale/Tray.tsx`, `tray-layout.ts`, `piece-drag.ts`, `stepper-repeat.ts`, `use-carry.ts`, `src/art/skins/tray.ts`: the shelf, its pieces and steppers, carrying pieces, landing and sliding back, the wiggle (AC: 1–3)
- [x] `Scale.tsx`, `Pan.tsx`, `Piece.tsx`, `use-piece-tween.ts`, `layout.ts`, `SceneRoot.tsx`: weights and floats on the pans can be grabbed; a carried piece hides on its pan (AC: 1, 2)
- [x] `src/dev/`: the pans, the tray and a Balance switch
- [x] Tests next to each file; `npm run check && npm test && npm run build` green; checked in a browser

## Dev Notes

- **Balance moves (Pattern 1):** tray of weights and floats only, 1–99 with a repeating stepper; after each drop a pan's number pieces combine into one; a pan with no x can't go below 0; one pan changed tips at the dial's x; the move completes when the pans' equation has the stage's solution again; with `auto` it is written unless it is `x = n`. Room 4's worked sequence is the test.
- **Which x the pans show (Pattern 1):** every tray move is exploring: it ends acting out, so the pans are weighed at the dial's x. `PansLevel` still comes only from the dial.
- **Two layers (Pattern 1):** `pans` is the last committed line plus exploratory moves; writing a line, a reset, or clearing a jam replaces them.
- **Jams (Pattern 2):** while jammed he can only edit the draft, drag the splitter off, reset or leave, so the tray does nothing then.
- **First use (Pattern 2):** the tray wiggles once (hint level 1) the first time it is offered; `save.progress.firstUse` gets `'tray'`.
- **Pure core (rule 1):** every decision is in `src/room/tray.ts` with tests; the scene asks it whether a drop is taken (`storeTakes`) so a refused piece slides back. **One store (rule 2):** three tray actions, `WayUsed` and `LineAccepted` (source `balance`). **Refs (rule 6):** the carried piece moves through a ref; React hears only start, release and settle. **Touch (rule 8):** buttons and grab areas at least 48 CSS px; drags and held buttons end on up, up outside, cancel, blur and a hidden page; no hover. **Rooms are data (rule 10).**
- **Not in this story:** the splitter (1.11); Balance `blanks` (epic 2); saving (epic 2); the "to be continued" screen after room 4 (1.13).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **The tray is offered whenever Balance is earned and the stage is `open`**, whatever the stage's `ways` list (that list says which ways can finish). It is off in arrive, poke and pin, and once the stage locks. While the machine is jammed it stays in view, drawn faint, and neither its drags nor its stepper do anything.
- **Where it is:** a shelf in the scene's top-right corner, right of the machine and above the right pan: the weight, then the float, each with + above − beside it. On the tablet it clears the machine and the right pan's pieces. On a 640 × 360 phone its 48 CSS px buttons widen it until its left edge (scene x ≈ 955) overlaps the edge of the area a jammed machine's steam lines reach (to x 1006). Phone layout is checked in epic 6.
- **Where a piece lands:** a piece from the tray lands on the pan whose half of the scene it is let go over (either side of the machine and stand, above the stand's foot), and a pan's piece lands in the tray when let go over the shelf (or within 40 scene units of it). Anywhere else it slides back. A pan's piece let go over either pan slides back too: moving a piece between pans isn't a tray move.
- **The tray's numbers are stage state** (`StageState.tray`, not in the architecture's `StageState`): both start at 1 when a stage arrives, and reset keeps them, since they are a setting of the tool, not a move. The stepper repeats after 450 ms, then every 110 ms (`tuning.trayRepeatDelayMs`, `trayRepeatMs`; `trayMaxNumber` is 99), and stops at 1 and 99.
- **A changed pan is rewritten from its pieces:** x pieces first, then one number (`2x + 8`, `2x − 2`, `x : 3 + 4`), springs after the number they lift (`23 − x`), `0` for an empty pan and `0 − x` for springs with nothing to lift. A pan that gets back to the last committed line's pieces shows that line's side as it was written. A drop that would make a number longer than a line allows (9 999 999) is refused too. The refusal below 0 applies to taking a piece off as well as to dropping one on.
- **"Drags a piece back":** a dropped piece merges into the pan's one number piece, so it can't be dragged off by itself. The pans go back when the pan's pieces return to the last committed line's, by dragging the merged piece off or by the opposite piece. Getting back to the last committed layout completes nothing: no `WayUsed`, no line.
- **When a move completes:** the pans' equation has exactly one solution, the stage's, and its pieces differ from the last committed line's. With Balance `blank` or `blanks` nothing is written, so a later return to that unwritten balanced layout fires `WayUsed` again. That only matters from room 6 on.
- **After an auto-written line the pans keep exploring at the dial's x**, not acting it out with `?`, since the line came from the pans. The tilt is then the same as before the move (`2x + 5 = 23` and `2x = 18` both tip by 18 units at x = 0), which shows the move kept the balance. The line goes through the checker like a typed one, is committed with source `balance` (`LineAccepted`, `progress` from its verdict), and moves the machine by its progress. `2x + 8 = 26` is written without progress.
- **Balance `blanks` writes nothing yet** (it arrives with rooms 6–7 in epic 2), the same as `blank`. A stage that lists no Balance mode is treated as `blank`.
- **Room 4 data** as in the architecture's sample: `xMeaning: 'load per bucket'`, `mapChange: 'water-wheel-turns'`, `ways: ['balance']`, `earns: null`. Until story 1.11's splitter he finishes it by typing `x = 9` after the tray writes `2x = 18`. It is the last room for now, so after its restart the game stays `done`.
- **Content tests added:** the fading matrix against the GDD table for every room (Try values blanks in rooms 1–3, blank from 4; Balance auto in 4–5, none before 4), and "every listed way can finish": Try values needs the answer on the dial; Balance needs `steps.ts`'s canonical solution, with every tray drop in 1–99 and every split in 2–9.
- **First use:** `offeredControls` and `meetControls` take the tools earned. The wiggle plays once per stage visit (a ref guard in `Tray.tsx`), so a reset or a scene remount doesn't replay it within the stage.
- **The dev panel** shows the pans and the tray and has a Balance switch, through a new `dev/set-tools` action. Switching it on in an open stage counts as the tray's first offer, so it wiggles.
- **`notebook.ts` now exports `commitLine`**, which typed and tray-written lines share. Typed lines behave as before.

### Completion Notes

- Pure core: `room/tray.ts` decides everything about the tray. The store routes the three tray actions with the earned tools. The scene draws `trayView`, carries pieces with `piece-drag.ts` and asks `storeTakes` whether the store will take a release before it dispatches.
- Checked in the built-in browser (dev server, `?dev`, Balance switched on, jump to `r04 · 1`, pin set and confirmed through the store), driving the canvas with pointer events:
  - The shelf shows the weight and the float at 1, with − faint at 1. Four taps on the float's + gave 5. Holding the weight's + for a second took it from 1 to 7, and it stopped on release.
  - Dragging the float from the tray to the left pan gave `2x = 23` and wrote nothing. Dragging it to the right pan wrote `2x = 18` (source `balance`), progress 0.2, readouts 0 and 18.
  - A gear couldn't be grabbed. The right pan's weight let go over the left pan slid back. Let go over the tray, it was taken off (`2x = 0`). A float dropped on the empty right pan was refused and slid back.
  - Reset gave line 0 and kept the tray's numbers. Typing `x = 9` and `2 · 9 + 5 = 23` locked the stage, the pin resolved as right, and the room restarted to `done`.
  - **Found and fixed:** when the stage locked, the shelf unmounted and the wiggle effect's cleanup wrote to its destroyed container, which crashed the scene. The effect now checks `destroyed`, and a test checks the guard. After the fix nothing reached `matematika:errors`.
  - The pane ran about 2 animation frames a second, so the piece tween, landing and slide back were seen only once they settled. Story 1.13's tablet check should look at the drag's feel, the shelf's placement and the wiggle.

### Test Results

- `npm run check`: 155 files, no errors or warnings.
- `npm test`: 59 files, 1,190 tests passing (103 new; 5 new files).
  - AC1: `tray.test.ts` (offered only when open with Balance, off while jammed, numbers 1–99, pieces are weights and floats, first-use wiggle); `stepper-repeat.test.ts` (repeat after the delay, stops on release, cancel and at an end); `tray-layout.test.ts` (48 CSS px buttons and grab areas); `art/skins/tray.test.ts`; `store.test.ts` (`firstUse` gets `tray`, hint level 1).
  - AC2: `tray.test.ts` (combining into a weight, a float or nothing; refusals below 0 for drops and takes; gears and springs can't be taken); `piece-drag.test.ts` (landing, sliding back, `releaseAction`, `storeTakes`, wired to the store).
  - AC3: `tray.test.ts`, `store.test.ts` (one pan tips at the dial's x, nothing written, no events).
  - AC4: `tray.test.ts` (`WayUsed` then `LineAccepted` with source `balance`; either order; several drops; no progress for `2x + 8 = 26`; `x = n` not written; `blank` writes nothing).
  - AC5: `tray.test.ts` (back to the written side, reset, a written line, a cleared jam, ending acting out, the dial weighing exploratory pans); `piece-tween.test.ts` (`isHidden`).
  - AC6: `rooms.test.ts` (room 4 against the GDD tables, poke window 0–3, pin track 0–12, the dial can't reach 9, `x = 9` and the check line lock, Balance's canonical solution); `store.test.ts` (room 4 through dispatch to the lock).
- `npm run build`: `tsc --noEmit` clean; 1.03 MB in 9 files, JavaScript 0.31 MB gzipped.

### File List

- `src/room/tray.ts`, `tray.test.ts` (new)
- `src/content/rooms/r04-water-wheel.ts` (new)
- `src/ui/scene/scale/Tray.tsx`, `tray-layout.ts`, `tray-layout.test.ts`, `piece-drag.ts`, `piece-drag.test.ts`, `stepper-repeat.ts`, `stepper-repeat.test.ts`, `use-carry.ts` (new)
- `src/art/skins/tray.ts`, `tray.test.ts` (new)
- `src/room/types.ts`, `room.ts`, `room.test.ts`, `phases.ts`, `events.ts`, `notebook.ts`, `first-use.ts` (modified)
- `src/store/actions.ts`, `reducer.ts`, `store.test.ts` (modified)
- `src/content/rooms/index.ts`, `rooms.test.ts` (modified)
- `src/config/tuning.ts` (modified)
- `src/ui/scene/SceneRoot.tsx`, `scale/Scale.tsx`, `scale/Pan.tsx`, `scale/Piece.tsx`, `scale/use-piece-tween.ts`, `scale/layout.ts`, `scale/layout.test.ts`, `scale/piece-tween.test.ts` (modified)
- `src/dev/DevPanel.tsx`, `DevPanel.test.tsx`, `dev-view.ts`, `dev-view.test.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified), this story file

## Review

Reviewed once; the fixes were applied in one pass with no second review.

### Findings

- **Bug, fixed: a cancelled pointer dropped the carried piece instead of sliding it back.** `C:\Users\lpodobnik\Claude\matematika\src\ui\scene\scale\Tray.tsx` passed the piece drag straight to `watchDragCancel`, which turns the DOM's `pointercancel` into `drag.end(pointerId)`. `end` asks the release handler, so a piece held over a pan when Android cancelled the pointer (an edge gesture, palm rejection) landed there, and with Balance `auto` could write a line he never let go of (a float 5 over the right pan in room 4 wrote `2x = 18`).
  - `C:\Users\lpodobnik\Claude\matematika\src\ui\scene\scale\piece-drag.ts`: `PieceDrag` has a new `abort(pointerId)`. When that pointer holds the piece, it slides back (`returning`) and the release handler is never called. A new `cancelWatch(drag)` maps `watchDragCancel`'s `end` to `abort` and its `cancel` to `cancel`, so a cancel is never a drop. The header now says so.
  - `Tray.tsx` now calls `watchDragCancel(window, document, cancelWatch(drag))`. The review asked for the same mapping written inline; it is a named helper so the test drives exactly what the tray wires.
  - `C:\Users\lpodobnik\Claude\matematika\src\ui\scene\scale\piece-drag.test.ts`: `abort` slides back only its own pointer's piece and never asks; a DOM `pointercancel` (through `watchDragCancel` and `cancelWatch`, with the real store-wired release handler) while a float 5 is held over the right pan leaves the handler uncalled, the phase `returning`, the room unchanged and no `2x = 18`; blur and a hidden page slide a held piece back; the source check now requires `cancelWatch(drag)` and refuses the old `watchDragCancel(window, document, drag)`.

### Minor notes (not fixed, for Luka)

- **AC2 vs restoring the written side:** `changedPans` in `C:\Users\lpodobnik\Claude\matematika\src\room\tray.ts` puts back the last committed side as it was written. After a typed `2x = 25 − 7`, a weight 3 and then a float 3 on the right show two number pieces (25 and float 7) again, not one 18. That breaks "combine into one piece" and the splitter example in the architecture.
- **AC5 "drags a piece back" only partly holds** (flagged as a call by the dev): dropped pieces merge, so in room 4 a float 5 on the left leaves no number piece to drag back, and he has to drop a weight 5 instead. Worth your confirm or veto.
- **A tray-written line (`2x = 18`) is not acted out:** `actingOut` stays false and the pans stay tipped at the dial's x. The architecture's `StageState` says `actingOut` is true "from a written line", and the chain's auto lines are acted out. This was a flagged call, open to veto.
- **The first-use wiggle guard is a component ref** (`wiggled` in `C:\Users\lpodobnik\Claude\matematika\src\ui\scene\scale\Tray.tsx`), and `hintLevel` stays at 1 for the whole stage. A scene remount after WebGL context loss (common on Android) replays the wiggle, despite this story's claim that it won't.
- **The release handler checks `storeTakes` against the room from the last render** (`latest.current.room` in `Tray.tsx`), but dispatches to the live store. Using `useGame.getState()` there would keep "lands" and "slides back" in step with what the reducer does. Edge case only.

### Checks after the review

- `npm run check`: 155 files, no errors.
- `npm test`: 59 files, 1,193 tests passing (3 new).
- `npm run build`: `tsc --noEmit` clean; 1.03 MB in 9 files, JavaScript 0.31 MB gzipped (unchanged).
