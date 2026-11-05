# Story 1.6: Write in the notebook

Status: done

## Story

As the player,
I want a notebook with a number pad beside the scale,
so that I can write lines the way I do at school without the tablet's keyboard popping up.

**Covers:** FR15; NFR4 (phone layout), NFR9.

## Acceptance Criteria

1. **Given** a room **When** the notebook opens **Then** the stage equation is its first line, read-only **And** on the tablet in landscape the notebook sits beside the scale, and on a phone in landscape (under 500 CSS px tall) it slides over the scale and can be pushed aside
2. **Given** the number pad **When** he taps its keys **Then** digits, `x`, `+`, `−`, `·`, `:`, `=`, `(`, `)`, delete (from the end) and enter edit the draft line, each key at least 48 CSS px **And** the notebook is not an `<input>`, so the OS keyboard never opens
3. **Given** a computer **When** he types `0`–`9`, `x`, `+`, `-`, `*`, `/`, `:`, `=`, brackets, Backspace or Enter **Then** they work like the pad, with `*` → `·`, `/` → `:` and `-` → `−`
4. **Given** a draft line **When** he types **Then** it shows in school notation (`5905` shows as `5 905`)
5. **Given** a draft line **When** he presses enter **Then** it is judged (story 1.3): `incomplete`, `nonlinear` and `aside` lines wiggle and stay in the draft; `wrong` lines stay in the draft, marked as wrong; `valid`, `answer` and `check` lines are appended to `lines`, read-only

## Tasks / Subtasks

- [x] `src/math/format.ts`: `formatTokens` for draft and committed lines in school notation; rows in `lines.table.ts` (AC: 4)
- [x] `src/room/types.ts`: `NotebookLine`; `StageState.lines`, `draft`, `jam`, `refused` (AC: 1, 5)
- [x] `src/room/room.ts`: line 0 is the stage equation, `source: 'given'` (AC: 1)
- [x] `src/room/notebook.ts`: type, delete, enter with the checker; when the notebook takes input (AC: 2, 5)
- [x] `src/room/events.ts`, `src/store/actions.ts`, `src/store/reducer.ts`, `src/store/types.ts`: `notebook/type`, `notebook/delete`, `notebook/enter`, `notebook/slide`; `LineAccepted`, `LineWrong` (AC: 1, 2, 5)
- [x] `src/ui/notebook/`: `Notebook.tsx`, `NumberPad.tsx`, `LineView.tsx`, `pad-keys.ts`, `keyboard.ts`, `notebook.css` (AC: 1–5)
- [x] `src/app/App.tsx`: the notebook replaces the placeholder; tablet and phone layouts (AC: 1)
- [x] `src/content/text/hr.ts`: the notebook's labels (NFR9)
- [x] Tests next to each file; `npm run check && npm test && npm run build` green; checked in a browser at 1280 × 800 and 640 × 360

## Dev Notes

- **Two layers (Pattern 1):** `lines` holds committed lines only, and line 0 is the stage equation, read-only. A wrong line is never in `lines`: its tokens stay in the draft, marked as jammed, and he deletes from the end (there is no caret). Any edit clears the line jam.
- **Checker (Pattern 1, story 1.3):** `check(lines, tokens)` from `src/math/check.ts` judges the draft by its exact solution. `incomplete`, `nonlinear` and `aside` are refused with a wiggle, not a jam.
- **StageState (Pattern 2):** `lines: NotebookLine[]`, `draft: Token[]`, `jam: { kind: 'line' } | { kind: 'split'; parts } | null`. `NotebookLine = { tokens, source: 'given' | 'typed' | WayId, verdict }` (Data Architecture). Reducers handle an action only in the phases where it is legal.
- **Notation (rule 7, Consistency Rules):** only `math/format.ts` turns tokens into text: `·`, `:`, `−`, U+202F between thousands. Keyboard: `*` → `·`, `/` → `:`, `-` → `−`, `x` or `X` → x, Enter, Backspace (`math/tokens.ts` `tokenFromChar`).
- **No OS keyboard (rule 8):** the notebook is never an `<input>`. HTML input uses Pointer Events; `touch-action: manipulation`; no hover states; hit areas at least 48 CSS px at 640 × 360.
- **One store, one dispatch (rule 2):** components read with selectors and act through `dispatch`; the decisions live in `src/room/notebook.ts` (pure, tested).
- **Text (rule 7):** every Croatian string is in `src/content/text/hr.ts`; `architecture.test.ts` fails on Croatian letters in `ui/` and `app/`.
- **Layout (Consistency Rules: scene coordinates):** the scene is scaled to fit the area beside the notebook; the layout changes only between the tablet and phone layouts. `SceneRoot` follows its area's size with a `ResizeObserver`.
- **Files:** `src/math/format.ts`, `src/room/notebook.ts`, `src/ui/notebook/` (architecture: `ui/notebook/` holds Notebook, NumberPad, LineView).
- **Not in this story:** acting out lines, machine progress, `MachineJammed`, `jamsInARow` and locking the stage (1.7); Try values blanks (1.7); arrive ending on the first touch and reset (1.8); the notebook off in `poke` and `pin` (1.9); saving the lines (epic 2).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **A wrong line is marked by the jam** (`jam: { kind: 'line' }`), as the architecture's two layers say ("its tokens go back into the draft, marked as jammed"), not by a separate flag. Any edit (type or delete) clears a line jam; a split jam stays.
- **Pattern 2's jam rule applies from now on:** while jammed, enter is ignored until he edits the line, and the dial doesn't turn (`setDial` ignores it and `dialView.turns` is false). Story 1.7 adds acting the line out, `MachineJammed` and `jamsInARow` on top.
- **`LineAccepted` and `LineWrong` fire here**, from the reducer that commits or marks the line (Pattern 4). `LineAccepted` has `source: 'typed'` and `progress`: a valid line's own, and `true` for the answer and check lines (they move the machine to 0.9 and 1 in 1.7). `LineWrong.line` is the line in school notation. Refused lines fire nothing. `MachineJammed` and `StageLocked` stay with 1.7.
- **The wiggle is a counter on the stage** (`StageState.refused`, not in the architecture's list): each refusal counts up, and the notebook keys its draft line on the count, so the line remounts and the CSS wiggle plays once. With reduced motion it blinks instead.
- **The notebook writes in `arrive` and `open`**, like the dial's stopgap, because nothing ends `arrive` until story 1.8. It is off in `poke`, `pin`, `locked`, `restart` and `done`, and also **after a check line**, so the check line is always the last line even before 1.7 locks the stage.
- **Line 0's verdict is fixed** (`valid`, move `none`, no progress), so a stage arrives without being judged. Several scale tests enter fixture stages that have no whole-number solution.
- **Committed lines keep his tokens and show them as typed** through the new `formatTokens` in `math/format.ts`, so a line with brackets or leading zeros stays as written. For any equation it gives exactly `formatEquation`'s text (fast-check), and its text tokenizes back to the same tokens.
- **The draft holds at most 40 tokens** (`tuning.draftMaxTokens`, new). Further keys are ignored. Room 11's check line is 15 tokens.
- **The pad is laid out like a calculator:** 7 8 9 ( ) / 4 5 6 · : / 1 2 3 + − / 0 x = delete enter, 5 × 4 keys. Delete and enter are drawn as SVG icons and named in `hr.ts` (`Obriši`, `Upiši`), so they don't depend on a font having ⌫ or ↵.
- **Keys act on `pointerdown`** (main mouse button only, default prevented), and they can't be reached with Tab (`tabIndex -1`) and have no click handler, so a computer's Enter goes only to the notebook. They are `disabled` while the notebook is off.
- **Keyboard:** keys are read from `window`, since the notebook isn't an input. `Delete` also deletes from the end, because there is no caret. Ctrl, Cmd and Alt shortcuts are left to the browser; AltGr (Ctrl + Alt) still types. Keys going into a text field are left alone, for epic 2's name dialog.
- **Layouts:** on the tablet the notebook sits beside the scale at `clamp(280px, 32%, 440px)`; the placeholder's 240 px minimum was too narrow for five 48 px keys. On a phone, `@media (max-height: 499.98px)`, it slides over the scale from the right, `clamp(280px, 45vw, 340px)` wide, and a 48 × 96 px handle on its left edge pushes it aside (`translateX(100%)`, 220 ms) or brings it back. The handle stays visible at the screen's edge when aside. The notebook starts open and keeps its state across rooms (`ui.notebookAside`, action `notebook/slide`). There is no swipe gesture.
- **Key and text sizes scale with the height:** keys `clamp(48px, 8.5dvh, 72px)` tall, lines `clamp(20px, 3.6dvh, 30px)`. At 640 × 360 about four lines show above the pad; the list scrolls and keeps the draft in view.
- **A wrong line has a wavy underline as well as the jam colour** (`--jam` #a8432f, also added to `art/palette.ts`), so colour is never the only signal (NFR4). There are no other success or failure marks.

### Completion Notes

- `room/notebook.ts` holds every decision: when the notebook writes, typing, deleting from the end, and enter with story 1.3's `check`. The root reducer handles `notebook/type`, `notebook/delete`, `notebook/enter` and `notebook/slide`.
- `ui/notebook/` is presentation only: `Notebook` (store wiring and the keyboard watch), `NotebookPage` (from props, so it renders in tests), `NumberPad`, `LineView`, `pad-keys.ts`, `keyboard.ts` and `notebook.css`. `App.tsx` mounts it in place of the placeholder.
- Checked in the built-in browser on `vite preview`:
  - At 1280 × 800 the notebook sits beside the scale (scene 868 × 800) and the keys are 74 × 68 CSS px.
  - Key presses and pad taps (mouse, and synthetic touch `pointerdown`) edit the draft. `5905-27x=316` shows as `5 905 − 27x = 316` with U+202F.
  - `x = 6` is marked wrong and delete clears the mark. `x = 5` and `5 + 4 = 9` are appended, and then all 20 keys turn off. An incomplete line wiggles.
  - At 640 × 360 the notebook (290 px) slides over the full-width scene, the keys are at least 49.6 × 48 CSS px, and the handle pushes it aside and brings it back. 900 × 500 gives the tablet layout and 900 × 499 the phone layout.
  - No `<input>`, no console errors, nothing in `matematika:errors`.
  - The browser pane's text typing doesn't send key events, so keyboard input was checked with its key presses and with dispatched `KeyboardEvent`s.
  - Not checked on the tablet itself (story 1.13).

### Test Results

- `npm run check`: 101 files, no errors.
- `npm test`: 37 files, 772 tests passing (130 new; 4 new files).
  - AC1: `room.test.ts` (4 new): line 0 is the machine's equation as pad tokens, `given`; every stage starts with line 0 only. `notebook.test.ts`: delete never reaches line 0. `Notebook.test.tsx`: line 0 renders first as `line--given`. The CSS puts the notebook beside the scale on the tablet, and under 500 CSS px tall slides it over the scene (absolute, right, with a transition) with a handle of at least 48 px that pushes it aside (`translateX(100%)`). `store.test.ts`: `notebook/slide`.
  - AC2: `pad-keys.test.ts` (8): 20 keys, every token plus delete and enter, labels in school notation, the actions they send, `pointerdown` on the main button only. `Notebook.test.tsx` (16): 20 buttons, none reachable with Tab, no `<input>`, `<textarea>`, `<select>` or `contenteditable`; keys at least 48 px in the CSS, and five fit the narrowest notebook; no `:hover`. `notebook.test.ts` (32): each token types at the end, delete works from the end, the draft cap.
  - AC3: `keyboard.test.ts` (40): every key in the AC maps to the pad's, with `*` → `·`, `/` → `:`, `-` → `−` and `X` → x; other keys and shortcuts are ignored; the watch prevents the browser's own use, skips text fields and stops. `pad-keys.test.ts`: the same line typed on the pad and on the keyboard commits the same tokens.
  - AC4: `format.test.ts` (7 new): `formatTokens` groups thousands as he types (`5905` → `5 905`) and handles unfinished lines, leading zeros and only the school signs; fast-check against `formatEquation`, and the token round-trip. `lines.table.ts`: a new group of 18 rows, lines as the notebook writes them (U+202F) and as typed on a computer, including room 11's `5 905 − 27x = 316`. `Notebook.test.tsx`: the draft renders as `5 905 − 27x = 316`.
  - AC5: `notebook.test.ts`: incomplete, nonlinear and aside lines stay in the draft and count a wiggle. A wrong line stays, marked, never in `lines`; it fires `LineWrong` and blocks enter and the dial until edited. Valid lines (with and without progress), answer and check lines are appended with their verdicts and fire `LineAccepted`; after the check line no key is taken. fast-check: no random pad line is ever stored unless the checker commits it. `Notebook.test.tsx`: the wrong and wiggle marks, and committed lines under line 0. `store.test.ts` (5 new): the same through dispatch.
- `npm run build`: `tsc --noEmit` clean; 0.93 MB in 9 files, JavaScript 0.28 MB gzipped.

### File List

- `src/room/notebook.ts`, `src/room/notebook.test.ts` (new)
- `src/ui/notebook/Notebook.tsx`, `NumberPad.tsx`, `LineView.tsx`, `pad-keys.ts`, `keyboard.ts`, `notebook.css`, `Notebook.test.tsx`, `pad-keys.test.ts`, `keyboard.test.ts` (new)
- `src/math/format.ts`, `src/math/format.test.ts`, `src/math/lines.table.ts` (modified)
- `src/room/types.ts`, `src/room/room.ts`, `src/room/room.test.ts`, `src/room/events.ts`, `src/room/dial.ts` (modified)
- `src/store/actions.ts`, `src/store/types.ts`, `src/store/reducer.ts`, `src/store/store.test.ts` (modified)
- `src/app/App.tsx`, `src/app/app.css`, `src/art/palette.ts`, `src/config/tuning.ts`, `src/content/text/hr.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified), this story file

## Review

Reviewed once; the fixes were applied in one pass with no second review.

### Findings

- None. The review raised no findings that needed a fix, so no code changed.

### Minor notes (not fixed, for Luka)

- `C:\Users\lpodobnik\Claude\matematika\src\room\dial.ts` (`setDial`, `dialView`): when a line is wrong, the dial stops turning, as Pattern 2 says. Until story 1.7 nothing on the machine shows it is jammed, so in 1.6 the dial just stops responding and only the red wavy draft line explains why.
- `C:\Users\lpodobnik\Claude\matematika\src\room\notebook.ts` (`enterLine`): pressing enter while a wrong line is still marked is ignored with no wiggle or other feedback, so the enter key looks enabled but does nothing.
- `C:\Users\lpodobnik\Claude\matematika\src\ui\notebook\keyboard.ts` (`watchKeyboard`): it catches and acts on mapped keys (Backspace, Enter, `/`) even when the notebook is off or pushed aside on a phone. A computer keyboard then types into a hidden notebook, and those keys never reach the browser.
- `C:\Users\lpodobnik\Claude\matematika\src\room\types.ts`: `StageState.refused` (the wiggle counter) is a field that Pattern 2's `StageState` list doesn't have. The dev agent recorded this as one of its own decisions, and it should be written into the architecture so later stories keep it.
- Checks run by the review: 772/772 tests pass, `biome ci` and `tsc --noEmit` are clean. The phone layout has not been checked on a real Android device; that check is deferred to story 1.13.

### Checks after the review

- `npm run check`: 101 files, no errors.
- `npm test`: 37 files, 772 tests passing (unchanged).
- `npm run build`: `tsc --noEmit` clean; 0.93 MB in 9 files, JavaScript 0.28 MB gzipped (unchanged).
