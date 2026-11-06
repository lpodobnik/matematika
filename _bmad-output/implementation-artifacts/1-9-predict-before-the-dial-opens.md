# Story 1.9: Predict before the dial opens

Status: review

## Story

As the player,
I want to poke a few notches, then pin where I think the pans will level before the full dial opens,
so that I commit to an idea and see what it causes.

**Covers:** FR6, FR7 (without parts), FR21 (room 3's pins), FR22 (room 3), FR33 (first-use wiggle); architecture Pattern 2 (poke, pin, resolution, reset).

## Acceptance Criteria

1. **Given** a stage with `pokeNotches: 4` **When** it opens **Then** the dial moves only over min, min + step, min + 2·step and min + 3·step (`poke` phase), and the notebook is off
2. **Given** the poke phase **When** the pin is first available **Then** it wiggles once (hint level 1)
3. **Given** the poke phase **When** he first drags the pin **Then** the stage goes to `pin` and the dial freezes; a second drag moves the pin; confirming locks it, opens the full dial range and turns the notebook on
4. **Given** a locked "where it levels" pin **When** the dial levels the pans, or the stage locks **Then** the pin resolves once: a right pin shows as right on the machine and `PredictionMade` fires with `right: true`; a wrong pin briefly shows its own value's tilt on the pans, with no penalty (parts come in epic 3)
5. **Given** a locked pin **When** he resets the stage **Then** the pin stays locked and is not offered again, and the stage returns to `open` with the full dial range, so he is never left with a short dial and no pin
6. **Given** room 3 (sluice gate), stage 1: `x − 6 = 8`, dial 6–20, a 4-notch poke window and a "where it levels" pin **When** he plays it **Then** the poke window covers 6, 7, 8 and 9, and the answer is 14
7. **Given** room 3, stage 2: `20 − x = 6`, dial 0–20, no poke window, and an `effect` pin with two options, "the pan goes down" and "the pan goes up" as x grows **When** the stage opens **Then** he must pin a direction before the dial moves; the pin resolves on the first notch, where x is a spring, so raising x lifts its pan
8. **Given** room 3 is done **When** it restarts **Then** Balance is earned, held in memory until saving arrives in epic 2

## Tasks / Subtasks

- [x] `src/room/types.ts`, `room.ts`: `PinValue`, `PinState`, `EffectOption`, `FirstUseId`, `HintLevel`; stage `pin` and `hintLevel`; the poke window as the opening dial range (AC: 1, 3)
- [x] `src/room/pin.ts`: pin track, `pin/set`, `pin/confirm`, rightness, resolution, `pinView`, `pinRevealX` (AC: 3, 4, 7)
- [x] `src/room/phases.ts`: opening phase `poke` / `pin` / `open`; reset keeps a locked pin; `toolEarned` (AC: 1, 5, 7, 8)
- [x] `src/room/dial.ts`, `notebook.ts`, `scale.ts`: the dial stays still before a pin-first stage's pin; resolution on a notch, on levelling and on the lock; `pinRevealView` (AC: 4, 7)
- [x] `src/room/first-use.ts`: the first offer of the pin raises hint level 1, once per game (AC: 2)
- [x] `src/room/events.ts`, `src/store/`: `PredictionMade`; `pin/set`, `pin/confirm`; an in-memory `save` slice with `progress.tools` and `progress.firstUse` (AC: 2, 4, 8)
- [x] `src/content/rooms/r03-sluice-gate.ts`, `index.ts`, `rooms.test.ts`, `src/content/text/hr.ts`: room 3, and content tests for poke windows and pins (AC: 6, 7)
- [x] `src/ui/scene/scale/Pin.tsx`, `pin-layout.ts`, `pin-drag.ts`, `src/art/skins/pin.ts`: the pin, its holder, its places, the wiggle, right and wrong marks (AC: 2, 3, 4, 7)
- [x] `src/ui/scene/scale/Scale.tsx`, `Dial.tsx`, `dial-drag.ts`, `src/art/skins/dial.ts`: the brief reveal of a wrong pin's tilt; a stop at the poke window's end (AC: 1, 4)
- [x] `src/ui/common/PinConfirm.tsx`, `common.css`, `src/app/App.tsx`: the confirm control (AC: 3)
- [x] `src/dev/`: the dev panel shows the pin
- [x] Tests next to each file; `npm run check && npm test && npm run build` green; checked in a browser

## Dev Notes

- **Phases (Pattern 2):** `arrive → poke (if pokeNotches) → pin (if pin) → open → locked → restart → done`. Poke: the dial moves only over min … min + (pokeNotches − 1)·step, and the notebook is off (it writes only in `open`). Pin: starts on his first drag of the pin, which freezes the dial; a second drag moves it; confirming locks it and opens the stage. The track runs over the dial's range, or to twice its maximum with `beyondDial` (room 4).
- **Resolution (Pattern 2):** a `level-x` pin resolves when the dial levels the pans or the stage locks; an `effect` pin about direction on the first dial notch after it is confirmed. A right pin emits `PredictionMade` with `right: true`. A wrong pin briefly shows its own value's tilt. `PansLevel` comes only from the dial (Pattern 1), so acting out a line never resolves a pin.
- **Reset (Pattern 2):** with a locked pin, the pin stays and the stage returns to `open` with the full range; otherwise to its opening phase.
- **First use (Pattern 2):** the first time the pin, tray or splitter is available, it wiggles once (hint level 1).
- **Pure core (rule 1):** every decision is in `src/room/` (`pin.ts`, `first-use.ts`, `phases.ts`, `dial.ts`, `notebook.ts`, `scale.ts`), with tests. The scene draws `pinView` and reports places; the store routes actions and folds the first use and the earned tool into `save`.
- **One store, events (rule 2, Pattern 4):** `pin/set` once per place, never per frame (rule 6); `PredictionMade` is in the event union for the play log (epic 2) and parts (epic 3).
- **Rooms are data (rule 10):** room 3 is a `RoomSpec` with content tests; pins come from `PinSpec`, with no per-room code.
- **Text (rule 7):** the confirm label and the effect options' text are in `hr.pin`; the options are text keys.
- **Touch (rule 8):** the pin's hit area is at least 48 CSS px at 640 × 360; drags end on up, up outside and cancel (and blur or a hidden page); the confirm control is a 56 px button with no hover state.
- **Colour never the only signal (NFR4), colour only on started machines (NFR12):** a right pin gets a flame and rays, as a lit lamp does; a locked pin a collar; a wrong pin dims.
- **Not in this story:** parts for a right pin and `predictionPaid` (epic 3); pin kinds for compare, mistake, story, range and the drum (epics 2 and 4); saving `save` (epic 2); the hint ladder beyond the first-use wiggle (epic 2); the tray and splitter wiggles (1.10, 1.11); room 4 (1.10).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **Reset without a locked pin returns to the stage's opening phase**, which is `pin` for room 3's second stage (a pin and no poke window). Pattern 2's Reset row says "without one, it returns to poke (or open if the stage has no poke window)", which would skip the pin there and contradicts its own phase line (`pin (if pin)`) and AC 7. I followed the phase line. A pin he placed but hadn't confirmed goes back to its holder on reset.
- **A stage with a pin but no poke window opens straight into `pin`**, with no pin placed, so the dial can't move before he pins. In `arrive` such a stage's dial doesn't turn either, so grabbing the dial can't move it before the pin.
- **A poke window counts only with a pin** (it could never open otherwise). Content tests check that every poke window has a pin and is 3 or 4 notches or `'all'`, and that no notch inside it levels the pans or hits the tilt clamp, so the poke window can't give the answer away.
- **First use is once per game, not per stage.** What he has met is in a new `save.progress.firstUse` (not in the architecture's `SaveV1`; epic 2 should add it there when saving arrives). The first offer sets the stage's `hintLevel` (a Pattern 2 field) to 1, and the pin wiggles once on that rise. Reset keeps `hintLevel`, so the wiggle doesn't come back. Epic 2's ladder will start from level 1 in that stage.
- **`GameState` gains a `save` slice now**, held in memory: `progress.tools` and `progress.firstUse`. Balance is added when room 3's `RoomRestarted` fires (`toolEarned`, from the room's `earns`).
- **Effect options are typed** `EffectOption = 'pan-down' | 'pan-up'`, which are also their `hr.pin.options` keys, where the architecture has `options: string[]`. They mean "the pan that holds x goes down / up as x grows". Which one is right comes from the equation (`xPanMotion`: x's coefficient on its pan), not from watching the tilt, so a notch in either direction resolves it the same way. Content tests keep x on one side in every stage with an effect pin.
- **When a pin resolves:** an x pin when the dial levels the pans *at the stage's solution*, so a later one-sided tray move (story 1.10) that levels the pans elsewhere won't resolve it. Any pin still unresolved when the stage locks resolves then, the direction pin included if he never turned the dial. `PredictionMade` fires for wrong pins too, with `right: false`, which the play log needs for prediction accuracy.
- **The wrong-pin reveal is for x pins only.** For a direction pin, the first notch already shows what x really does, so a wrong direction pin just dims. The reveal shows the pans weighed at the pin's x: its tilt, with that x on the gears and the readouts. It is computed in `pinRevealView` and timed in the scene (1.6 s), and the next dial notch ends it early. When the lock resolves the pin, the pans hold the check line, which has no x, so the stage's equation is weighed instead.
- **Room 3's stage types:** stage 1 is `solve` (its pin is "where it levels", the Solve row of the GDD's room-type table) and stage 2 is `predict` (it pins the effect). The GDD calls room 3 as a whole a Predict room. `type` drives no behaviour yet.
- **Room 3 data:** `xMeaning: 'water in the basin before the release, then the water to release'`, `mapChange: 'sluice-gate-releases'`, Try values `blanks` on both stages (GDD fading: rooms 1–3), readouts on, `ways: ['try']`, `earns: 'balance'`. It is the last room in content for now, so after its restart the game stays `done`. Room 4 comes in story 1.10.
- **The pin in the scene:** it stands on the dial's band. Its tip sits on the track line and its head, carrying the number, rides above the knob. An x pin's places line up with the dial's notches (24 CSS px apart), so the pin stands over the notch it predicts, and places beyond the dial get faint ticks past the dial's end. If the dial scrolls (no epic 1 room does), the places spread across the window instead. The pin waits in a holder left of its first place and slides out with a horizontal drag. Once placed it can't go back into the holder. The direction pin's two places are arrow badges (a pan with an arrow down or up) 160 CSS px apart under the scale; its head shows the arrow of the option it sits on. The option text isn't drawn in the scene (rule: longer text goes in HTML). It is the confirm control's accessible name instead.
- **Confirm control:** an HTML button with a pin icon and "Potvrdi", in the scene area's bottom-left corner. It appears only while a placed pin waits to be confirmed. Like reset, it acts on release and never takes focus. On a phone it sits left of the dial's window.
- **Marks:** a locked pin gets a collar at its tip and a shaded head. A right pin gets a flame and rays in the lamp colour, since a right call is part of the machine starting. A wrong pin dims to 45 %. A stop on the dial shows the end of the poke window until the pin is locked.
- **`predictionPaid` is not added yet**: `pin.resolved` already keeps the resolution to once per stage, even across resets, and paying comes in epic 3.
- `dial-drag.ts`'s pointer handlers and drag-cancel watcher now accept any drag controller of the same shape, so the pin reuses them.

### Completion Notes

- Pure core: `room/pin.ts` holds the pin rules; `room/first-use.ts` the first-use wiggle; `room/phases.ts` the opening phase, reset and the earned tool. The dial, the notebook and the scale call into the pin for resolution and the reveal. The store routes `pin/set` and `pin/confirm` and folds first use and tools into `save`.
- Checked in the built-in browser (dev server, `?dev` jump to `r03 · 1`), driving the canvas with pointer events and reading the store:
  - A touch opens `poke` with `hintLevel` 1 and `firstUse: ['pin']`. A dial drag stops at 9.
  - Dragging the pin out of its holder goes to `pin` at x = 6 and moves it one place per 24 px. A second drag back to 14 works. The confirm control ("Potvrdi") appears, and clicking it gives `open` with the dial at 6–20 and the pad on.
  - Dragging the dial to 14 resolves the pin as right. The lit pin showed above the dial.
  - Writing 14 and 14 locks the stage. Stage 2 opens into `pin`. Dragging the direction pin onto "up" makes the confirm control read "Potvrdi: Kad x raste, zdjela se diže.", and the first notch resolves it as right.
  - The restart ends `done` with `tools: ['balance']`. No console errors, and nothing in `matematika:errors`.
  - The pane's screenshots showed only part of the scene and its animation ran slowly, so the pin's look on the dial band wasn't judged visually beyond the top of its head. A drag started in the same instant the pin first appears can miss until Pixi renders a frame (seen only with scripted input). Story 1.13's tablet check should look at the pin's placement and the wiggle.

### Test Results

- `npm run check`: 142 files, no errors or warnings.
- `npm test`: 54 files, 1,087 tests passing (105 new; 6 new files).
  - AC1: `pin.test.ts` (room 3 opens in poke with 6–9 open, the notebook off, 10 refused); `rooms.test.ts` (poke windows only with a pin, 3/4/'all', no notch levels or clamps); `pin-layout.test.ts`; `store.test.ts` (dial stops at 9 through dispatch, the pad ignored).
  - AC2: `first-use.test.ts` (hint level 1 on the first offer, never again, never lowered); `store.test.ts` (`firstUse` kept across reset and into stage 2); `pin.test.ts` (`pinView.wiggle`); `pin-layout.test.ts` (the wiggle's shape).
  - AC3: `pin.test.ts` (first drag to `pin`, dial frozen, move, confirm opens the full range and the notebook, off-track and wrong-kind values ignored); `pin-drag.test.ts` (holder, 24 px places, second drag, ends on up, up outside and cancel, stops once confirmed); `PinConfirm.test.tsx`; `store.test.ts`.
  - AC4: `pin.test.ts` (right on levelling with `PredictionMade` right, resolves once, wrong pin dims with no penalty and reveals its tilt at its own x, resolves on the lock, nothing more after); `store.test.ts`; `art/skins/pin.test.ts` (a right pin's flame and rays).
  - AC5: `phases.test.ts` (a locked pin kept, not offered, full range; a resolved one stays resolved; an unconfirmed pin back to its holder); `store.test.ts`.
  - AC6: `rooms.test.ts` (room 3's stages against the GDD tables, poke window 6–9, answer 14); `store.test.ts` (stage 1 played through dispatch).
  - AC7: `pin.test.ts` (pin-first stage, the dial still in arrive and pin, resolves on the first notch, `xPanMotion`); `phases.test.ts` (reset returns to `pin`); `rooms.test.ts` (spring on the left, "up" is right); `store.test.ts`.
  - AC8: `phases.test.ts` (`toolEarned`); `store.test.ts` (Balance in `save.progress.tools` when the restart begins, kept after `done`).
- `npm run build`: `tsc --noEmit` clean; 1.02 MB in 9 files, JavaScript 0.31 MB gzipped.

### File List

- `src/room/pin.ts`, `pin.test.ts`, `first-use.ts`, `first-use.test.ts` (new)
- `src/content/rooms/r03-sluice-gate.ts` (new)
- `src/ui/scene/scale/Pin.tsx`, `pin-layout.ts`, `pin-layout.test.ts`, `pin-drag.ts`, `pin-drag.test.ts` (new)
- `src/art/skins/pin.ts`, `pin.test.ts` (new)
- `src/ui/common/PinConfirm.tsx`, `PinConfirm.test.tsx` (new)
- `src/room/types.ts`, `room.ts`, `room.test.ts`, `phases.ts`, `phases.test.ts`, `dial.ts`, `notebook.ts`, `scale.ts`, `events.ts` (modified)
- `src/store/actions.ts`, `reducer.ts`, `store.ts`, `types.ts`, `store.test.ts` (modified)
- `src/content/rooms/index.ts`, `rooms.test.ts`, `src/content/text/hr.ts` (modified)
- `src/ui/scene/SceneRoot.tsx`, `scale/Scale.tsx`, `scale/Dial.tsx`, `scale/dial-drag.ts`, `src/art/skins/dial.ts` (modified)
- `src/ui/common/common.css`, `src/app/App.tsx` (modified)
- `src/dev/DevPanel.tsx`, `dev-view.ts`, `dev-view.test.ts` (modified)
- `src/ui/notebook/pad-keys.test.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified), this story file
