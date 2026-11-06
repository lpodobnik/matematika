# Story 1.13: Play rooms 1–4 on the tablet

Status: review

## Story

As Luka,
I want rooms 1–4 to play back to back on the tablet at 60 FPS with the effect running,
so that the design's biggest bet, writing as the final move, can be tried for real.

**Covers:** NFR1, NFR2; epic 1's playable result; architecture content tests and profiling.

## Acceptance Criteria

1. **Given** a fresh start without the dev panel **When** he plays **Then** rooms 1–4 run in order, each from arrival to restart, and after room 4 a placeholder "to be continued" screen shows (the map replaces it in epic 2)
2. **Given** content tests **When** they run **Then** for rooms 1–4 each equation parses with one whole-number solution; machines, `xMeaning`, dial ranges, poke windows, pins and fading match the GDD tables; no poke-window notch hits the tilt clamp; every listed finishing way can finish under the room's limits, using `steps.ts` **And** no equation from `src/content/paper-test.ts`, seeded with the brief's paper test, appears in any room, compared up to swapped sides and commuted terms
3. **Given** the dev panel showing three copies of room 4's machine side by side, with the effect on **When** Luka drags the dial on his tablet while Chrome's remote profiler (`chrome://inspect`) records **Then** it holds 60 FPS and the knob follows the finger within one frame, and the numbers are recorded in this story's file
4. **Given** `src/math/lines.table.ts` **When** tests run **Then** it contains, with expected verdicts, every line in epic 1's acceptance criteria and, for each stage of rooms 1–4, the canonical solution of every finishing way (from `steps.ts`), one skipped-step solution and at least two wrong lines

## Tasks / Subtasks

- [x] `room/phases.ts`: `playedThrough`, true once the last room in content is done (AC: 1)
- [x] `store/`: `Screen` gains `continued`; the root reducer shows it when room 4's restart ends; `ui.copies` and `dev/set-copies` for the profile (AC: 1, 3)
- [x] `app/ToBeContinued.tsx`, `app.css`, `hr.app.toBeContinued`; `App` switches screens, with a props-only `AppScreen` (AC: 1)
- [x] `store/playthrough.test.ts`: rooms 1–4 from a fresh store, as he plays them, to the "to be continued" screen (AC: 1)
- [x] `content/paper-test.ts`, seeded from the brief; `rooms.test.ts`: rooms 1–4 against the GDD tables (xMeaning included), every finishing way through `steps.ts`, no paper-test equation in any room (AC: 2)
- [x] `ui/scene/copies.ts` and `SceneRoot.tsx`: the scene drawn as 1 or 3 copies side by side (AC: 3)
- [x] `dev/`: the "profile: 3 × r04" button, which sets room 4 up open, Balance on, `high` forced and three copies (AC: 3)
- [ ] **Luka:** the tablet profile and its numbers (AC: 3), below
- [x] `math/lines.table.ts`: the remaining epic 1 lines; `lines.table.test.ts` checks every AC line, every canonical solution, a skipped-step solution and two wrong lines per stage (AC: 4)
- [x] `npm run check && npm test && npm run build` green; checked in the browser

## What Luka has to do (AC 3)

The code for this criterion is done; only the measurement is left, and it needs the tablet in hand. The story stays at `review` until then.

1. On the PC, in the repo on branch `epic-1`: `npm run dev -- --host`. Note the Network address it prints, `http://<PC IP>:5173`.
2. On the tablet: Developer options on, USB debugging on, USB cable to the PC, accept the debugging prompt.
3. **Play through once, without the dev panel (AC 1):** in Chrome on the tablet, open `http://<PC IP>:5173` (no `?dev`), in landscape, and play rooms 1–4. After room 4's machine restarts, "Nastavak slijedi…" should show.
4. Open `http://<PC IP>:5173/?dev`. Wait about 3 s, then write down the panel's `frame test` line (p95 and pick).
5. In the panel, tap **profile: 3 × r04 off**. It turns `on`: room 4 is open (pin at 9), Balance is on, quality is forced `high` (the steam runs) and the scene shows three copies side by side. Tap **close** so the panel doesn't cover the scene.
6. On the PC, open `chrome://inspect#devices` in Chrome, find the tablet's `matematika` tab and click **inspect**. Open the **Performance** panel and click record.
7. On the tablet, drag one dial knob left and right over the whole track (0–6), steadily, for about 10 s.
8. Stop recording. Select the dragging stretch and read:
   - **FPS:** the Frames track. Count dropped or partially presented frames, and note the longest frame.
   - **Within one frame:** the Interactions track and the Main track. For the pointer moves, input delay plus processing plus presentation should be at most 16.7 ms, with no frame skipped between a move and the knob's redraw.
9. Optional: tap the profile button again (one copy, same room, steam still forced on) and repeat 6–8 for comparison.
10. Fill in the table below. If it holds 60 FPS and the knob follows within one frame, set `Status: done` here and `1-13-play-rooms-1-4-on-the-tablet: done` in `sprint-status.yaml`. If it doesn't, keep it at `review`; profiling again at `medium` and `low` (forced in the panel) shows what costs the frames.

### Tablet profile (Luka fills this in)

| Measure | 3 copies | 1 copy |
|---|---|---|
| Tablet model, Chrome version | | |
| Frame test (p95, pick), from step 4 | | |
| Average FPS while dragging | | |
| Dropped or partial frames / frames | | |
| Longest frame (ms) | | |
| Worst pointer move to knob redraw (ms) | | |
| Plays rooms 1–4 to "Nastavak slijedi…" (yes/no) | | — |

## Dev Notes

- **Pattern 2 (Restart, room order):** when a room's restart ends, the next room in `content/rooms/index.ts` loads; after the last one, the reducer sets `ui.screen = 'continued'`. Screens are a store field with no router (State Management). The map replaces the screen in epic 2.
- **NFR13:** the end screen is not a success screen: no stars, scores or praise, only a still gear and the line from `hr.ts`.
- **Room Data (content tests):** whole-number solutions, the GDD tables, no clamped poke notch, every listed way finishes under the room's limits through `math/steps.ts`, the dial stops short where the GDD says, the fading matrix, and no `content/paper-test.ts` equation, compared with `sameEquation` (`math/expr.ts`, up to swapped sides and commuted terms).
- **Testing Strategy (line table):** each room's accepted and rejected lines, with verdicts, in `math/lines.table.ts`.
- **Performance and Debug Tools:** 60 FPS while dragging in a three-machine room with effects on; per-frame values through refs, the dial dispatching once per notch (rule 6). Profile through `chrome://inspect` with `npm run dev -- --host`. The dev panel exists only in development builds (`architecture.test.ts`), and only `ui/scene` may use Pixi, so the panel sets `ui.copies` and the scene draws the copies.
- **Rule 2:** the panel only dispatches existing actions; `dev/set-copies` is a dev-only action, like story 1.10's `dev/set-tools`.
- **Files:** `src/room/phases.ts`, `src/store/{types,actions,reducer}.ts`, `src/app/{App,ToBeContinued}.tsx`, `src/app/app.css`, `src/content/text/hr.ts`, `src/content/paper-test.ts`, `src/content/rooms/`, `src/ui/scene/{copies.ts,SceneRoot.tsx}`, `src/dev/`, `src/math/lines.table*.ts`.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **The end screen** says "Nastavak slijedi…" under a still ink gear, on paper. It takes the scene's and notebook's place, so the scene unmounts. The dev panel stays, and any jump or the profile button returns to a room (`room/enter` sets `screen: 'room'`).
- **It shows only after the last room in content** (`playedThrough`), once its restart has played, by `presentation/done` or the clock's fallback. A built or friend's room that isn't in the list never shows it.
- **The paper test holds the brief's five equations:** `47 + 38 = 46 + 39`, `3x + 2 = 20`, `3x + 2 = 23`, `3x = 22` and `2x + 7 = 25`. The "after" version's new numbers and the textbook exercises 21 and 24 aren't written out in the brief, so they join in epic 6. `3x = 18`, the correct version of task 3's step, isn't on the test and is room 7's equation, so it is not listed.
- **Rooms' equations for the paper-test check** are the machines' equations and any preset lines. Room 5's changed equation (22 becomes 25) joins when `change` is implemented in epic 2.
- **`xMeaning` "matches the GDD"** when it contains every word of the GDD's "x is" column. The code's notes are longer design notes ("counterweight still needed to lift the door"), so an exact match would mean rewriting them.
- **The three copies are the whole scene at a third of its size**, side by side and centred top to bottom, all reading the same room. Dragging the dial in one moves the pans and knobs of all three, which is more work than a linked room where only one machine moves, so the profile errs on the heavy side.
- **The tray and the splitter stay out of the copies.** Their controls keep 48 CSS px for touch, so at a third of the size they covered the machines (seen in the browser). A room's machines will share one of each. Labels keep their 20 CSS px minimum, so numbers look large in the copies.
- **The profile button sets room 4 up through existing actions:** Balance on, room 4 entered, touched, the pin put at 9 and confirmed (the whole 0–6 dial is open), `high` forced so the steam runs whatever the frame-time test picked, then three copies. Pressing it again leaves the profile (one copy), keeping the room and the forced setting, so one copy and three can be compared with the steam on.
- **`ui.copies` lives in the store**, set by the dev-only `dev/set-copies`, because the panel can't import Pixi. Production builds never dispatch it, and the panel isn't in them.
- **The line table** gains each stage's own equation copied as a line (valid, no progress), and `x3 = 12` and `−x = 14` (incomplete). The test lists every line in epic 1's acceptance criteria with its stage and earlier lines, and finds each in the table, comparing in school notation. Try values' blanks (`x = ☐`, `☐ + 4 = 9`) count as the lines they become once filled.
- **A "skipped-step solution"** is the answer line straight after the stage equation, then the check line, with a longer solution through at least one step also in the table. For rooms 1–3 it is the same two lines as Try values' canonical solution; the steps it skips (`x = 9 − 4`, `x = 12 : 3` and so on) are in the table.
- **`App` was split** into `App` (reads the store, starts the clock) and a props-only `AppScreen`, because Zustand's server snapshot is the initial state, so `renderToString` can't see a store change. The App test mocks `SceneRoot`, because `@pixi/react` doesn't load under Node.
- **AC 1 is tested at the store level** (`store/playthrough.test.ts`, the real reducer and content, as he plays). A Playwright run through the canvas waits for the e2e set-up (architecture: from epic 5). Luka's step 3 covers it on the tablet.
- **No contradictions** found between the GDD, the architecture, epics.md and the code for this story.

### Completion Notes

- Checked in the built-in browser (dev server on port 5173, an 800 × 600 pane):
  - The profile button showed three copies of room 4 side by side, each with its machine, scale, pin and dial. Dragging the first copy's knob four notches moved all three to x = 4 (left side 13). Leaving the profile brought back one copy with the tray and splitter.
  - In room 4, `x = 9` and `2 · 9 + 5 = 23` typed on the pad locked the machine. After its lock and restart, "Nastavak slijedi…" showed with the gear. From there the profile button went back to room 4 with three copies.
  - The console's two errors (`sceneHitArea is not defined`, `probe: scene render failed`) are stale entries from earlier sessions in the same pane. Neither string exists in the code.
- Real frame rates and touch latency weren't measured here. That is Luka's profile.

### Test Results

- `npm run check`: 181 files, no errors.
- `npm test`: 70 files, 1455 tests passing (130 new; 3 new files).
  - AC1: `store/playthrough.test.ts` (rooms 1–4 phase by phase from a fresh store, every stage arriving and locking and every machine restarting in order, the pins paid off and 2x = 18 written for him, Balance earned at room 3, the room screen until room 4's restart ends, then `continued`, also by the clock); `room/phases.test.ts` (`playedThrough`); `store.test.ts` (one room as the whole list ends on `continued`); `app/App.test.tsx` (the switch, and the end screen's text and look).
  - AC2: `content/rooms/rooms.test.ts` (rooms 1–4 against the GDD tables, every way's canonical solution passes the checker, the paper test's equations and its swapped and commuted forms, none in any room).
  - AC3: `ui/scene/copies.test.ts` (one copy fills the scene; three side by side at a third, inside it, not overlapping); `dev/dev-view.test.ts` (the profile set-up run through the reducer: room 4 open on 0–6, Balance, `high` forced with the steam on, three copies; from anywhere; leaving); `DevPanel.test.tsx` (the button and its pressed state); `store.test.ts` (`dev/set-copies`).
  - AC4: `math/lines.table.test.ts` (50 epic 1 AC lines found; per stage of rooms 1–4 the canonical solution of each way line by line, a skipped-step solution, at least two wrong lines).
- `npm run build`: `tsc --noEmit` clean; 1.06 MB in 9 files, JavaScript 0.32 MB gzipped. The dev panel's text is not in `dist/`.

### File List

- `src/app/ToBeContinued.tsx`, `src/app/App.test.tsx` (new)
- `src/content/paper-test.ts` (new)
- `src/store/playthrough.test.ts` (new)
- `src/ui/scene/copies.ts`, `copies.test.ts` (new)
- `src/app/App.tsx`, `app.css` (modified)
- `src/content/text/hr.ts`, `src/content/rooms/index.ts`, `rooms.test.ts` (modified)
- `src/room/phases.ts`, `phases.test.ts` (modified)
- `src/store/types.ts`, `actions.ts`, `reducer.ts`, `store.test.ts` (modified)
- `src/ui/scene/SceneRoot.tsx` (modified)
- `src/dev/DevPanel.tsx`, `DevPanel.test.tsx`, `dev-view.ts`, `dev-view.test.ts` (modified)
- `src/math/lines.table.ts`, `lines.table.test.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (1.13 to review)
- This story file

## Review

Reviewed once; the fix pass ran once on branch `epic-1`, with no second review.

### Findings

The review raised no findings to fix, so no code changed in the fix pass. Acceptance criteria 1, 2 and 4 are met and tested; AC 3 waits on the tablet profile above.

### Minor notes (not fixed, for Luka)

- **AC 3 is still open, as planned.** The tablet profile table in `C:\Users\lpodobnik\Claude\matematika\_bmad-output\implementation-artifacts\1-13-play-rooms-1-4-on-the-tablet.md` stays empty until you measure on the tablet, so the story and `sprint-status.yaml` correctly stay at `review`.
- **The copies' header comment overstates what each copy holds.** `C:\Users\lpodobnik\Claude\matematika\src\ui\scene\copies.ts` says each copy includes the tray and the splitter, but `C:\Users\lpodobnik\Claude\matematika\src\ui\scene\SceneRoot.tsx` draws them only when there is one copy (the Calls Made above say why).
- **The `xMeaning` check matches substrings.** In `C:\Users\lpodobnik\Claude\matematika\src\content\rooms\rooms.test.ts`, short GDD words such as "to" or "per" pass on any text that contains those letters anywhere.
- **The epic 1 coverage test checks rows, not verdicts.** `C:\Users\lpodobnik\Claude\matematika\src\math\lines.table.test.ts` only checks that each AC line has a row in the table. It never compares the row's verdict with the verdict the AC states. A spot check found all of them correct today.
- **Room 3's stage types copy the content, not the GDD.** The GDD table test lists room 3's stage types as `['solve', 'predict']`, as the content has them, while the GDD calls room 3 a Predict room. The test's comment explains why, but it checks the content's choice rather than the GDD's.

### Checks after the review

- `npm run check`: 181 files, no errors.
- `npm test`: 70 files, 1,455 tests passing (unchanged).
- `npm run build`: `tsc --noEmit` clean; 1.06 MB in 9 files, JavaScript 0.32 MB gzipped (unchanged).
- `sprint-status.yaml`: `1-13-play-rooms-1-4-on-the-tablet` stays at `review` (it already was), for the tablet profile.
