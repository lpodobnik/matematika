# Story 1.5: Drag x

Status: review

## Story

As the player,
I want to drag a dial that changes x one notch at a time,
so that I see each notch move the pans by the same amount.

**Covers:** FR4, FR5, FR9 (levelling); NFR1, NFR2, NFR4; architecture "The dial".

## Acceptance Criteria

1. **Given** room 1 **When** he drags the dial's horizontal track **Then** x changes by one notch per 24 CSS px within 0–10, starting at 0, with a tick mark on each notch, and the x-gears show the current value
2. **Given** a drag in progress **When** the finger moves **Then** the knob follows every frame through a ref, and the store updates only when the notch changes (`dial/set`, with a `DialNotch` event) **And** the drag ends cleanly on pointer up, pointer up outside and pointer cancel
3. **Given** a stage with readouts **When** he drags **Then** both sides' values show; a stage with `readouts: false` hides them
4. **Given** the sides become equal **When** the notch lands **Then** the pans level and `PansLevel` fires **And** every notch changes the difference between the sides by the same amount
5. **Given** a test fixture stage `x : 3 = 5` with dial 0–30, step 3 **When** he drags **Then** the dial steps in 3s
6. **Given** the dial **When** it reaches either end of its range **Then** it stops there **And** its hit area is at least 48 CSS px at a 640 × 360 viewport, and a mouse drag behaves the same, with no hover states

## Tasks / Subtasks

- [x] `src/config/tuning.ts`: `dialNotchPx` 24 (AC: 1)
- [x] `src/room/types.ts`: `DialSpec`; `StageState.dialOpen` (the full range until story 1.9's poke window) (AC: 1, 6)
- [x] `src/room/dial.ts`: notch maths, `dialView`, `setDial` with `DialNotch` and `PansLevel`; the phases that turn the dial (AC: 1, 2, 4, 5, 6)
- [x] `src/room/events.ts`, `src/store/actions.ts`, `src/store/reducer.ts`: `DialNotch`, `PansLevel`, `dial/set` (AC: 2, 4)
- [x] `src/room/scale.ts`: readouts in `ScaleView`, hidden by `readouts: false` or the readouts blind (AC: 3)
- [x] `src/ui/scene/scale/dial-drag.ts`: the drag controller, Pixi handlers and the DOM cancel watch (AC: 1, 2, 5, 6)
- [x] `src/ui/scene/scale/dial-layout.ts`: track, ticks, knob, hit area and scroll window in CSS px (AC: 1, 6)
- [x] `src/ui/scene/scale/Dial.tsx`, `src/art/skins/dial.ts`; wired into `SceneRoot` (AC: 1, 2, 6)
- [x] Readouts drawn under each pan (`Pan.tsx`, `layout.ts` `readoutBox`, `scaleSkin.readout`) (AC: 3)
- [x] `Piece.tsx`: Graphics redrawn only when a piece's shape changes, not on every notch (NFR1)
- [x] Content tests: dial ranges and readouts at every notch (AC: 3, 4)
- [x] Tests next to each file; `npm run check && npm test && npm run build` green; checked in a browser

## Dev Notes

- **The dial (architecture, Consistency Rules):** a horizontal track under the scale, one notch per 24 CSS px, a tick per notch, x starting at the dial's minimum; when the range is wider than the space, the track scrolls under a fixed window.
- **Per-frame values through refs (project-context rule 6):** the knob and the track's scroll are written to Pixi objects in `onGlobalPointerMove`; the store hears `dial/set` once per notch. No work in the move handler besides the knob and the notch (Performance: touch latency).
- **Input:** Pixi `onPointerDown`, then `onGlobalPointerMove`, ending on `onPointerUp`, `onPointerUpOutside` and `pointercancel`. Thresholds in CSS px; hit areas at least 48 CSS px at 640 × 360 through an enlarged `hitArea`; no hover states (rule 8).
- **Which x the pans show (Pattern 1):** while exploring, the dial's x, on the gears too; readouts shown unless the stage hides them. `PansLevel` fires only when the dial levels the pans.
- **Pattern 2:** reducers handle an action only in the phases where it is legal and ignore it elsewhere; in `pin` the dial is frozen.
- **Boundaries:** the dial's values and what turning it does are pure (`room/dial.ts`); the gesture is UI (`ui/scene/scale/dial-drag.ts`, no React or Pixi, so it is unit tested); only `ui/scene` imports Pixi.
- **Files:** `src/room/dial.ts`, `src/ui/scene/scale/Dial.tsx`, `dial-drag.ts`, `dial-layout.ts`, `src/art/skins/dial.ts`, `src/config/tuning.ts`.
- **Not in this story:** arrive ending on the first touch (1.8), the poke window and pin (1.9), acting out lines and hiding readouts while acting out (1.7), the tick and thunk sounds (epic 6).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **A drag starts anywhere on the track and moves the knob by the finger's travel** (relative drag), rather than having to grab the knob. The AC says "drags the dial's horizontal track"; it also lets a long range be covered in several strokes when the track scrolls. A tap on the track doesn't jump the knob.
- **The notch is the one nearest the knob**, so the first change comes after 12 px and then every 24 px; on release the knob settles on the store's notch.
- **One `dial/set` per notch change, even when a fast move skips notches**, as in the architecture's sketch; each `DialNotch` carries the new x. Skipped notches fire nothing and aren't "tried".
- **`dial/set` is legal in `arrive`, `poke` and `open`.** `arrive` is included because nothing ends it until story 1.8; 1.8 may drop it once the first touch ends arrive. Off-notch, out-of-range, same-notch and locked-dial values are ignored (no events, state unchanged); there is no `lib/log.ts` yet for the debug log.
- **`StageState.dialOpen` added now** (Pattern 2 field), set to the full range; story 1.9 narrows it. Both the reducer and the knob clamp to it.
- **Readouts show whenever he explores, not only mid-drag** (architecture's "which x the pans show" table: shown unless the stage hides them). They hide with `readouts: false` and also with the readouts blind (`blinds.readouts`, epic 5), which costs one line.
- **Readouts hang under the outer half of each pan** in a double-framed display window, at the same size as the pieces' numbers, so they move with their pan. At 640 × 360 a 5-digit readout (room 11's 5 905) would run off the scene's left edge; rooms 1–4 reach 23, so this is left for epic 4.
- **Pixi 8.22 never forwards the DOM's `pointercancel`** (it has no listener for it), so the dial listens for it on `window`, and also ends any drag on window `blur` and when the page is hidden. The `onPointerCancel` prop is wired too, in case a later Pixi forwards it.
- **Only the main mouse button starts a drag**, and only the pointer that started it moves or ends it.
- **Scrolling:** the track scrolls only when the knob comes within two notches of the window's edge, and is masked to the window only when it scrolls. Room 1 never scrolls; room 3's 0–20 would scroll at 640 × 360 beside the notebook.
- **Sizes grow on small screens**, like the labels in 1.4: the knob is at least 40 CSS px tall and the hit area at least 48 CSS px (808–1000 in scene units at 640 × 360, still below the lowest beam end at 729).
- **No cursor style on the dial**, since a cursor change is a hover state.
- **A locked dial (room 7) draws no dial** until its rules are written.
- **`Piece.tsx` fix from the 1.4 review note:** the shape memo now depends on the piece's kind and box size, not the piece object, so a notch no longer redraws every piece's Graphics; only the label text changes. Gears still redraw when x reaches 10, because the wider label grows the gear.
- **Content tests** now require every dial to be whole numbers from 0 up ending on a notch, every side to weigh a whole number of 0 or more at every notch (the readouts), and `tiltPerUnit` above 0 (the 1.4 review note).

### Completion Notes

- `room/dial.ts` holds the dial's values and `setDial`; the root reducer handles `dial/set` with it. `ui/scene/scale/dial-drag.ts` is the gesture with no React or Pixi; `Dial.tsx` wires it to Pixi events and the store and writes the knob and scroll through refs.
- Checked in the built-in browser on `vite preview` at 1024 × 768 and 640 × 360: dragging the track moves x a notch per 24 CSS px, the gear and readouts follow, the pans level at 5, releasing over the notebook ends the drag, and a synthetic touch `pointercancel` ends it too (later moves are ignored). No console errors, nothing in `matematika:errors`. Not checked on the tablet: frame rate (NFR1) is profiled in story 1.13.

### Test Results

- `npm run check`: 90 files, no errors.
- `npm test`: 33 files, 642 tests passing (82 new; 4 new files).
  - AC1: `dial-drag.test.ts` (26): starts at 0, a notch per 24 CSS px to 10; the store wired as `Dial.tsx` wires it; the x-gear shows x (`dial.test.ts`, `store.test.ts`). `dial-layout.test.ts` (16): 24 CSS px per notch at any scale. `art/skins/dial.test.ts` (1): 11 ticks 24 CSS px apart for room 1.
  - AC2: the knob moves on every move while only new notches dispatch; ends on up, up outside and cancel (Pixi handlers), and on the DOM's `pointercancel`, blur and hidden page (`watchDragCancel`); `Dial.tsx` wires all five handlers. `dial.test.ts` (25) and `store.test.ts` (4 new): same notch, off notch and no room change nothing.
  - AC3: `scale.test.ts` (3 new): readouts at the dial's x, hidden by `readouts: false` and the blind. `layout.test.ts` (3 new): readouts fit, clear the post and stay above the dial at ±15°. `rooms.test.ts`: whole values of 0 or more at every notch.
  - AC4: `PansLevel` at 5 and only on level; the difference changes by the same amount every notch for five equations and any `ax + b = c` (fast-check); room 1 tips −5° to 5° in 1° steps.
  - AC5: the `x : 3 = 5` fixture steps 3, 6, 9 … 30 and levels at 15, through the reducer and through the drag.
  - AC6: stops at both ends; hit area at least 48 CSS px at 640 × 360 (both layouts) and for any scale down to it; mouse and touch give the same notches; no hover handlers or cursor.
- `npm run build`: `tsc --noEmit` clean; 0.92 MB in 9 files, JavaScript 0.28 MB gzipped (unchanged).

### File List

- `src/room/dial.ts`, `src/room/dial.test.ts` (new)
- `src/ui/scene/scale/Dial.tsx`, `dial-drag.ts`, `dial-drag.test.ts`, `dial-layout.ts`, `dial-layout.test.ts` (new)
- `src/art/skins/dial.ts`, `src/art/skins/dial.test.ts` (new)
- `src/config/tuning.ts`, `src/room/types.ts`, `src/room/room.ts`, `src/room/room.test.ts`, `src/room/events.ts`, `src/room/scale.ts`, `src/room/scale.test.ts` (modified)
- `src/store/actions.ts`, `src/store/reducer.ts`, `src/store/store.test.ts` (modified)
- `src/ui/scene/SceneRoot.tsx`, `src/ui/scene/scale/Scale.tsx`, `Pan.tsx`, `Piece.tsx`, `layout.ts`, `layout.test.ts`, `src/art/skins/scale.ts` (modified)
- `src/content/rooms/rooms.test.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified), this story file
