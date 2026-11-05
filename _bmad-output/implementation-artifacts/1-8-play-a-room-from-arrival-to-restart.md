# Story 1.8: Play a room from arrival to restart

Status: review

## Story

As the player,
I want each room to run from a stopped machine to watching it restart, then move on,
so that rooms 1 and 2 play one after another.

**Covers:** FR22 (rooms 1–2), FR25 (restart animation), FR26 (stage reset), FR35; architecture Pattern 2 (arrive, restart, reset).

## Acceptance Criteria

1. **Given** `r01` (door lift) and `r02` (street lamps) in `src/content/rooms/index.ts`, each with `machine`, `xMeaning` and `mapChange` **When** a room starts **Then** it runs `arrive → open → locked → restart → done`, with no instruction screen, and `arrive` ends on his first touch on the machine (`StageArrived` fires when it begins)
2. **Given** room 2 **When** its first stage `3x = 12` (dial 0–10) locks **Then** part of the machine starts (one lamp lights), and its second stage `x : 3 = 5` (dial 0–30 in 3s) arrives
3. **Given** the last stage of a room locks **When** the restart plays **Then** a placeholder animation shows the whole machine running, ending on `presentation/done` or a timeout fallback
4. **Given** any phase before `locked` **When** he taps reset **Then** the current stage returns to line 0 with the dial at its minimum and `machineProgress` at 0, and earlier stages stay solved **And** reset is off while the stage is `locked` or restarting
5. **Given** a room is done **When** its restart ends **Then** the next room in `content/rooms/index.ts` loads
6. **Given** a development build with `?dev` or the backtick key **When** the dev panel opens **Then** it jumps to any room and stage, and shows the last verdict and progress tuple

## Tasks / Subtasks

- [x] `src/content/rooms/r02-street-lamps.ts` and `index.ts`: room 2 with its two stages, in play order after room 1 (AC: 1, 2, 5)
- [x] `src/room/phases.ts`: arrive ending on a touch, the lock and restart presentations, the clock fallback, reset, the next room (AC: 1–5)
- [x] `src/room/room.ts`, `types.ts`, `events.ts`: entering at a stage, `presentedAt`, `StageReset` and `RoomRestarted` (AC: 1–4, 6)
- [x] `src/room/notebook.ts`: the notebook writes only in `open`; the check line starts the lock's clock (AC: 1, 3)
- [x] `src/room/dial.ts`: a notch in `arrive` ends arrive (AC: 1)
- [x] `src/room/machine.ts`: the machine's parts (one per stage), parts started, whole machine running (AC: 2, 3)
- [x] `src/store/`: `machine/touch`, `stage/reset`, `presentation/done`, `clock/tick`, `room/enter` with a stage; the next room loads when a room is done (AC: 1–6)
- [x] `src/ui/scene/SceneRoot.tsx`: any press on the canvas dispatches `machine/touch` (AC: 1)
- [x] `src/ui/scene/machine/`, `src/art/skins/machine.ts`, `src/art/palette.ts`: lamps, turning pulleys, the hum, the presentation timer (AC: 2, 3)
- [x] `src/ui/common/ResetButton.tsx`, `common.css`; `src/app/clock.ts`; `src/app/App.tsx` (AC: 3, 4)
- [x] `src/dev/`: the dev panel, loaded on demand in development builds only (AC: 6)
- [x] `src/architecture.test.ts`: dev/ reached only on demand behind `import.meta.env.DEV`; dev/ keeps ui's rules (AC: 6)
- [x] Tests next to each file; `npm run check && npm test && npm run build` green; checked in a browser

## Dev Notes

- **Phases (Pattern 2):** `arrive → poke (if pokeNotches) → pin (if pin) → open → locked → restart → done (or the next stage's arrive)`. Poke and pin are story 1.9's; here a stage always opens into `open`.
- **Arrive:** ends on his first touch anywhere on the machine. No instruction screen comes before a room (FR35, GDD Pillar 1).
- **Restart:** when a stage locks, part of the machine starts; when the last stage locks, the whole machine restarts. Both end when the UI dispatches `presentation/done`, with a timeout fallback so a missed animation event never strands the game. Logic never waits for an animation except `presentation/done` (Consistency Rules, Animation).
- **Reset:** the current stage only: lines back to line 0, `machineProgress` to 0, the dial to its minimum, exploratory moves and jams cleared; off while `locked` or restarting.
- **Time through ctx (rule 2):** reducers never read the clock; `clock/tick` (each second, Pattern 2's Hints row) brings `ctx.now`.
- **Events (Pattern 4):** `StageArrived`, `StageLocked`, `RoomRestarted` are in the architecture's union; effects listen, components never call them.
- **Dev panel (Debug Tools):** `src/dev/`, `?dev` or backtick, development builds only (`import.meta.env.DEV`), loaded on demand; jumps to any room or stage and shows the checker's verdict and tuple.
- **Rooms are data (rule 10):** room 2 is a `RoomSpec` with content tests; the machine's placeholder skin is shared, with no per-room code. `xMeaning` is a design note, never shown.
- **Text (rule 7):** the reset control's name is `hr.ui.reset`; no Croatian in `ui/`, `app/` or `dev/`.
- **Touch (rule 8):** the reset control is a 56 px button, no hover state, never an `<input>`.
- **Files:** `src/room/` (pure), `src/store/`, `src/content/rooms/`, `src/ui/scene/`, `src/ui/common/`, `src/app/`, `src/dev/`, `src/art/`.
- **Not in this story:** poke, pin and the pin's reset rule (1.9); the tray and splitter (1.10–1.11); the quality control in the dev panel (1.12); rooms 3–4 and the "to be continued" screen after room 4 (1.9–1.13); leaving a room and the map (epic 2); saving (epic 2).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **Arrive ends on a press anywhere on the canvas**, letterbox margins included, through the Pixi stage (`app.stage`, hit area `app.screen`). The scene is the machine. The notebook (pad and keyboard) is off in `arrive`, so on a computer he clicks the scene before typing. The dial can still be grabbed in `arrive`: the press bubbles to the stage after the dial starts its drag, so grabbing the dial is the first touch. A notch in `arrive` also ends it, in case that press is missed.
- **Only the last stage has a `restart` phase.** An earlier stage goes `locked → presentation/done → the next stage's arrive`. Pattern 2's "locked → restart → done (or the next stage's arrive)" can be read both ways; this reading matches "when a stage locks, part of the machine starts; when the last stage locks, the whole machine restarts".
- **`presentation/done` names its room, stage and phase.** A report that doesn't match what is playing now is ignored, so a late report after the fallback can't skip the restart.
- **Timeout fallback:** a new `clock/tick` action, sent every second by `src/app/clock.ts` (Pattern 2's Hints row already plans it), and a new stage field `presentedAt` (ctx.now when the lock or restart began; not in Pattern 2's list). `tuning.presentationTimeoutMs` is 8 s. The lock plays 1.8 s and the restart 3.6 s (`ui/scene/machine/layout.ts`). A presentation with no start time starts counting at the next tick.
- **`enterLine(room, now)`** now takes ctx.now, to stamp the lock.
- **`RoomRestarted` fires when the restart begins**, so audio's loop (epic 6) joins as the machine starts. A new `StageReset` event feeds the play log's room `reset` (epic 2).
- **`done` is passed through at once when a next room exists:** the root reducer loads it in the same step and fires its `StageArrived`. Room 2 is the last room for now, so after it the game stays in `done`, with the machine running and nothing else on screen. Story 1.13 adds "to be continued".
- **Which room is next** is `nextRoom` in `room/phases.ts` (the list order of `content/rooms/index.ts`). A room not in the list (built, a friend's) has none.
- **Reset** works in `arrive`, `poke`, `pin` and `open`, and always lands in the opening phase (`open` for now), so a reset in `arrive` also ends arrive. It brings back the blanks to fill. It keeps `jamsInARow`, which Pattern 2 resets only on a committed line (hints in epic 2), and `refused`, the notebook's wiggle counter. The control is an icon-only round button (circular arrow, `aria-label` "Ispočetka") in the scene area's top-left corner, 56 px, greyed while off. It acts on release (`click`) so a finger sliding off doesn't wipe his lines, and it never takes focus (pointerdown default prevented), so a computer's keys stay with the notebook. There is no confirmation.
- **Room 2, stage 1 has `tiltPerUnit: 0.8`.** At 1° per unit, x = 10 (18 units) hits the 15° clamp, and the last notch wouldn't move the pans. That breaks the room's teaching point, "each notch moves the pan by the same amount". A content test checks that every notch of room 2 moves the pans equally, with no notch at the clamp. The GDD gives no number for this.
- **Room 2 data:** `xMeaning: 'oil per lamp, then the oil in a full tank'`, `mapChange: 'street-lamps-light'`, Try values `blanks` on both stages (GDD fading table: rooms 1–3), readouts on, no poke window or pin.
- **Placeholder machine:** one skin for every machine. It gets a lamp per stage on top of the housing, lit as each stage locks: a flame and rays in a new `palette.lamp` colour, so shape signals as well as colour (NFR4), and colour comes only with a restarted part (NFR12). The lamp comes on 0.5 s into the lock with a short swell. The restart is the pulleys turning (they now have spokes) and a small hum; the pulleys keep turning in `done`. Room 1 has one lamp, room 2 two.
- **`room/enter` takes an optional `stage`** for the dev panel's jumps. Earlier stages count as solved, so their lamps are lit.
- **Dev panel:** English labels (developer tool, not game text). It shows room, stage and phase, machine progress, the jam, the last committed line's verdict and tuple, and the draft's verdict and tuple as enter would judge it now (a refused or jammed line stays in the draft, so this shows its verdict). It has a jump button for every stage of every authored room. Backtick toggles it, and so do AltGr+7 and the key left of 1 on a Croatian layout. It is a lazy import behind `import.meta.env.DEV`. The production build contains none of it (checked in `dist/`). It sits bottom-left and covers the left end of the dial; close it with its button or the backtick.
- **`architecture.test.ts`:** outside `dev/`, only a dynamic import in a file that checks `import.meta.env.DEV` may reach `dev/`. `dev/` keeps ui's import rules and the no-Croatian-letters rule.
- `.claude/launch.json` (untracked) gained a `dev` configuration for the browser check.

### Completion Notes

- Pure core: `room/phases.ts` holds the phases after arrival (touch, presentations, clock, reset, next room); `room/machine.ts` the parts view; `room/room.ts` entering at a stage. The store routes the new actions and loads the next room. UI only draws and reports: the canvas reports touches, the machine reports `presentation/done`, the reset control dispatches `stage/reset`, and the app's clock ticks.
- Checked in the built-in browser:
  - Dev server at 1280 × 800 with `?dev`. Room 1 arrives with the pad off. A press on the scene, or on the canvas margin, opens it. `5`, enter, `5`, enter: `locked`, reset greyed. The restart plays, then room 2 arrives with two lamps and `3x = 12`. The dev jump to `r02 · 1` works. Stage 1 locks, the first lamp lights, and stage 2 `x : 3 = 5` arrives. A wrong `x = 9` jams; reset returns to line 0 with the blanks, no jam, dial 0, and the button didn't take focus. `15`, `15`: `locked`, `restart`, then `done`.
  - Production preview at 640 × 360: no dev panel with `?dev`, the reset control at 8, 8 (56 × 56), the pad off in arrive, no `<input>`.
  - The pane ran at about 2 FPS (hidden), so screenshots lagged and animation smoothness wasn't judged. That is story 1.13's, on the tablet. The only entries in `matematika:errors` came from a hot reload in the middle of an edit; they were cleared.

### Test Results

- `npm run check`: 128 files, no errors or warnings.
- `npm test`: 48 files, 968 tests passing (87 new; 5 new files).
  - AC1: `phases.test.ts` (arrive ends on a touch or a notch, later touches ignored, opening phase); `store.test.ts` (room 1 `arrive → open → locked → restart → done` through dispatch with the event order; the notebook off until the touch); `room.test.ts` (arrive first, `presentedAt`); `rooms.test.ts` (play order, room 2 against the GDD tables).
  - AC2: `phases.test.ts`, `store.test.ts` (room 2: a lamp started, stage 2 arrives with its dial 0–30 in 3s, then the restart); `machine.test.ts` (parts and parts started per phase); `art/skins/machine.test.ts` (a lit lamp shows rays as well as colour); `layout.test.ts` (lamps placed and inside the scene).
  - AC3: `phases.test.ts` (restart and `RoomRestarted`, done; mismatched reports ignored; clock fallback for the lock and the restart; unstamped and clock-skewed presentations); `store.test.ts` (fallback through `clock/tick`; a late report after the fallback is ignored); `layout.test.ts` (presentations inside the fallback; the lamp lights before the lock ends); `clock.test.ts`.
  - AC4: `phases.test.ts` (reset in every phase before locked and none after; line 0, dial minimum, progress 0, blanks back, jam cleared; earlier stages stay solved; `jamsInARow` kept); `store.test.ts` (reset through dispatch, ignored once locked); `ResetButton.test.tsx` (name from `hr.ts`, off state, 48 px or more, no hover).
  - AC5: `store.test.ts` (room 1's restart loads room 2; the last room stays done); `phases.test.ts` (`nextRoom`).
  - AC6: `dev-view.test.ts` (jump targets, readouts with verdict and tuple, `?dev`, backtick on several layouts); `DevPanel.test.tsx` (closed by default, opens with `?dev`, shows place, line, tuple and jumps); `store.test.ts` (enter at any stage); `architecture.test.ts` (dev reach and rules fixtures).
- `npm run build`: `tsc --noEmit` clean; 1.00 MB in 9 files, JavaScript 0.30 MB gzipped; no dev panel code in `dist/`.

### File List

- `src/room/phases.ts`, `src/room/phases.test.ts` (new)
- `src/content/rooms/r02-street-lamps.ts` (new)
- `src/app/clock.ts`, `src/app/clock.test.ts` (new)
- `src/ui/common/ResetButton.tsx`, `ResetButton.test.tsx`, `common.css` (new)
- `src/dev/DevPanel.tsx`, `DevPanel.test.tsx`, `dev-view.ts`, `dev-view.test.ts`, `dev-panel.css` (new)
- `src/room/room.ts`, `room.test.ts`, `types.ts`, `events.ts`, `notebook.ts`, `notebook.test.ts`, `dial.ts`, `machine.ts`, `machine.test.ts`, `scale.test.ts` (modified)
- `src/store/actions.ts`, `reducer.ts`, `store.test.ts` (modified)
- `src/content/rooms/index.ts`, `rooms.test.ts`, `src/content/text/hr.ts`, `src/config/tuning.ts` (modified)
- `src/ui/scene/SceneRoot.tsx`, `src/ui/scene/machine/Machine.tsx`, `layout.ts`, `layout.test.ts` (modified)
- `src/art/palette.ts`, `src/art/skins/machine.ts`, `machine.test.ts` (modified)
- `src/app/App.tsx`, `src/architecture.test.ts` (modified)
- `src/ui/notebook/Notebook.test.tsx`, `pad-keys.test.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified), this story file
