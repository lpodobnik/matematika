# Story 1.12: Pick a quality setting

Status: done

## Story

As Luka,
I want the game to pick a quality setting that keeps 60 FPS on whatever device opens it,
so that effects never cost smoothness on his tablet or a friend's phone.

**Covers:** NFR1, NFR2; architecture Performance (quality).

## Acceptance Criteria

1. **Given** a placeholder steam effect (particles in a `ParticleContainer`) on the machine **When** quality is `high` or `medium` **Then** it runs; at `low` it is off
2. **Given** the game starts **When** the 2-second frame-time test runs with all effects on, starting 1 second after the scene's first frame **Then** a 95th-percentile frame time up to `tuning.qualityHighMs` (18 ms) picks `high`, up to `tuning.qualityMediumMs` (25 ms) `medium`, and otherwise `low` **And** the result is held in memory and the test runs on every launch until epic 2 saves `settings.quality`
3. **Given** the dev panel (from story 1.8) **When** this story adds a control there and a quality setting is forced **Then** it overrides the test result until reload

## Tasks / Subtasks

- [x] `src/config/tuning.ts`: `qualityHighMs` 18, `qualityMediumMs` 25, `qualityPercentile` 95, `qualitySettleMs` 1000, `qualityTestMs` 2000 (AC: 2)
- [x] `src/store/quality.ts`: the `Quality` type, nearest-rank percentile, `pickQuality`, `qualityInUse`, `reduceQuality` for `quality/measured` and `quality/force` (AC: 2, 3)
- [x] `src/store/`: the actions, `ui.quality` in the state, routed in the root reducer (AC: 2, 3)
- [x] `src/art/quality.ts`: which effects each setting keeps, switching off bloom, then particles, then shaders (AC: 1)
- [x] `src/ui/scene/frame-test.ts`: times the frames after the settle second and reports them; restarts when the page is hidden (AC: 2)
- [x] `src/ui/scene/SceneRoot.tsx`: runs the test from the scene's first frame until a pick is held (AC: 2)
- [x] `src/ui/scene/effects/steam-sim.ts`, `Steam.tsx`; `src/art/skins/steam.ts`; a vent on the placeholder machine (`art/skins/machine.ts`, `machine/layout.ts`, `Machine.tsx`) (AC: 1)
- [x] `src/dev/`: the quality readout and the auto / high / medium / low control (AC: 3)
- [x] Tests next to each file; `npm run check && npm test && npm run build` green; checked in a browser

## Dev Notes

- **Architecture, Performance (Quality):** a 2-second frame-time test with all effects on, timed only from 1 second after the scene's first frame; p95 up to 18 ms is `high`, up to 25 ms `medium`, otherwise `low`. It belongs in `save.settings.quality`, so it runs on every launch until saving exists (epic 2). Effects switch off in a fixed order: bloom, then particles, then shaders.
- **Consistency Rules, Effects:** every effect has a quality switch. Particles use Pixi 8's own `ParticleContainer`, because `@pixi/particle-emitter` supports only Pixi 7 (Architecture Validation).
- **Rule 6 (per-frame values through refs):** the steam steps on the Pixi ticker and is copied onto particles with no React state. The test reads frame times from the ticker and dispatches once.
- **Rule 2 (one store, one dispatch):** the scene reports frame times (`quality/measured`) and the dev panel forces a setting (`quality/force`). The store decides the pick (`store/quality.ts`) and holds it in memory.
- **Boundaries:** Pixi only in `ui/scene`, and the dev panel only in `dev/` behind `import.meta.env.DEV` (`architecture.test.ts`). The steam's skin is in `art/skins/`.
- **Files:** `src/store/quality.ts`, `src/art/quality.ts`, `src/art/skins/steam.ts`, `src/ui/scene/frame-test.ts`, `src/ui/scene/effects/`, plus edits to `store/`, `config/tuning.ts`, `ui/scene/SceneRoot.tsx`, `ui/scene/machine/`, `art/skins/machine.ts` and `dev/`.
- **Not in this story:** saving the pick (epic 2's `save.settings.quality`, plus a save trigger); bloom and the shaders (epic 6, with their switches already in `art/quality.ts`); the tablet profile with three machines (story 1.13).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **The state lives in `ui.quality`** (`{ measured, measuredMs, forced }`). The architecture's `ui` slice is "never persisted", which is true of all of it until epic 2. Epic 2 moves `measured` into `save.settings.quality`, and `forced` stays in `ui` because it lasts only until reload.
- **The store picks the setting.** The scene dispatches the raw frame times (`quality/measured`), and `store/quality.ts` picks from them. `Quality` and the pick live in `store/`, not `art/`, because the boundaries table lets the store import pure folders, save, audio and content, but not `art`. `art/quality.ts` imports the `Quality` type from the store, the same direction `ui` already uses.
- **The percentile is nearest-rank**, inclusive at the thresholds (exactly 18 ms is `high`, exactly 25 ms `medium`). NaN, negative and infinite frame times are dropped.
- **While the test runs, the setting in use is `high`**, even if one is forced, so the test always times every effect, as the AC says. A setting forced during the test applies when the test ends. The dev panel says `high · test running, then low (forced)`.
- **The test's report is taken once per launch.** A second report (from a scene remounted after a lost context, say) is ignored. A scene remounted before the report starts the test over.
- **A hidden page restarts the test.** A hidden page draws no frames, and the gap would count as one very slow frame. Hiding the page starts the test over, and frames drawn while hidden don't count. A window with no frame timed in it (one frame stalled across the whole window) also starts it over, so the test still ends with a pick. Without this, the browser pane's 1 FPS left the setting pending forever.
- **Frame times** are `ticker.lastTime + ticker.elapsedMS`. In Pixi's callbacks, `lastTime` is still the previous frame's time.
- **Low switches off all three effects**, not only particles. The architecture gives three settings and an order of bloom, then particles, then shaders. `medium` drops bloom and `low` drops the rest, because the shaders need an off switch and there is no setting below `low`. Only the steam exists so far.
- **The placeholder steam** comes from a new vent pipe on the housing's left end. It is 24 soft grey-ink puffs (no colour, NFR12) that rise about 56 units, drift left away from the lamps, grow and fade over 2 s. It runs whenever a machine is on screen, so the test always has it. The plume is part of `machineBounds`, and tests check that it stays inside the scene, between the pans at full tilt and clear of the housing and lamps. It sits outside the machine's body, so a jam's jolt doesn't shake puffs already in the air.
- **At `low` the steam unmounts**, so it costs nothing: no particles and no ticker callback.
- **The puff texture is made once per renderer** and kept for that renderer's life. Destroying it on every quality toggle triggered Pixi's "textureSource destroyed while still bound to a shader" warning. A renderer remounted after a lost context makes its own.
- **Particles are added with `addParticle`.** Passed through the constructor's `particles` option, they never upload their static properties (uvs), so nothing draws and WebGL logs "vertex buffer is not big enough". The unit tests can't catch this; the browser check did.
- **Ticker callbacks are registered in layout effects**, so they are removed before @pixi/react destroys the old app on a remount. After `destroy`, `ticker.remove` throws.
- **Dev panel control:** `auto`, `high`, `medium`, `low` under "force quality until reload". The chosen one has `aria-pressed`, a thicker border and bold text. Above them are the setting in use and why, and the test's p95 and pick. `auto` hands back to the test's pick.
- **No domain event** for the pick yet. Epic 2's save effect will need one, as a settings change.

### Completion Notes

- Checked in the built-in browser (dev server on port 5291 from this worktree). The pane was hidden, so frames came only when a screenshot or script forced them, at about 1 FPS:
  - The test ran and picked `low` (p95 about 1003 ms). The steam was then off: no `ParticleContainer` in the stage, and only Pixi's render callback left on the ticker.
  - Forcing `high` or `medium` from the panel (and through the store) brought the plume back. Read from the renderer, the pixels under the puffs went from paper to grey ink. Forcing `low` removed it. The panel showed `high · forced` with `high` pressed.
  - Six quality toggles and a WebGL context loss and restore (`WEBGL_lose_context`) logged no console warnings, and nothing went to `matematika:errors`. After the remount, the forced setting held and the steam came back with 24 particles.
  - The look of the plume and real frame rates weren't judged here. That is story 1.13's tablet profile.

### Test Results

- `npm run check`: 138 files, no errors.
- `npm test`: 52 files, 1034 tests passing (66 new; 4 new files).
  - AC1: `art/quality.test.ts` (particles on at high and medium, off at low; the switch-off order; the steam runs during the test, stops on a slow device, and stops when low is forced); `steam-sim.test.ts` (puffs rise, drift, grow, fade, restart at the vent and stay inside the plume's bounds); `machine/layout.test.ts` (the plume rises from the vent, is clear of the housing and lamps, and is inside the machine's box); `art/skins/machine.test.ts` (the vent and the puff are in ink only).
  - AC2: `store/quality.test.ts` (tuning values; nearest-rank percentile; thresholds at 18 and 25 ms inclusive; 5% of slow frames ignored, more counted; all effects on during the test; the pick taken once; empty reports ignored); `frame-test.test.ts` (nothing timed in the settle second, then 2 s of frames; the frame's own time; restarts when the page is hidden and when a frame stalls across the window; ends once and lets go of the ticker); `store.test.ts` (held in memory with no events and the room untouched, once per launch, a fresh store starts pending, kept across rooms and resets).
  - AC3: `store/quality.test.ts` and `store.test.ts` (forcing overrides the pick, null hands it back, and a reload forgets it); `dev-view.test.ts` (the readout while running, picked and forced); `DevPanel.test.tsx` (the readout, and the four choices with the right one pressed).
- `npm run build`: `tsc --noEmit` clean; 1.02 MB in 9 files, JavaScript 0.31 MB gzipped.

### File List

- `src/store/quality.ts`, `quality.test.ts` (new)
- `src/art/quality.ts`, `quality.test.ts` (new)
- `src/art/skins/steam.ts` (new)
- `src/ui/scene/frame-test.ts`, `frame-test.test.ts` (new)
- `src/ui/scene/effects/Steam.tsx`, `steam-sim.ts`, `steam-sim.test.ts` (new)
- `src/config/tuning.ts`, `src/store/actions.ts`, `reducer.ts`, `types.ts`, `store.test.ts` (modified)
- `src/ui/scene/SceneRoot.tsx`, `src/ui/scene/machine/Machine.tsx`, `layout.ts`, `layout.test.ts` (modified)
- `src/art/skins/machine.ts`, `machine.test.ts` (modified)
- `src/dev/DevPanel.tsx`, `DevPanel.test.tsx`, `dev-view.ts`, `dev-view.test.ts`, `dev-panel.css` (modified)
- `src/ui/notebook/pad-keys.test.ts` (modified: builds its state from `initialGameState()`)
- This story file

## Review

One review pass, then one fix pass (branch `lane/1-12-fix`).

### Findings

The review raised no findings to fix, so no code changed in the fix pass. `git merge epic-1` was already up to date (lane/1-12 is built on epic-1's tip, `c570ed0`). `npm run check` (138 files), `npm test` (52 files, 1034 tests) and `npm run build` (1.02 MB in 9 files, JavaScript 0.31 MB gzipped) all pass on the fix branch.

### Minor notes for Luka (not fixed)

- **`low` drops particles and shaders together.** `C:\Users\lpodobnik\Claude\matematika\src\art\quality.ts` has `low: 3`. The order stays bloom, then particles, then shaders, but no setting ever has shaders on with particles off. Epic 6's shaders, the restart glow among them, would then all vanish at `low`. This was the dev's own call; worth a veto check.
- **The thresholds can't pick `medium` on a 60 Hz screen** (from the architecture, not a code bug). rAF frame times are locked to the screen refresh, so a 60 Hz tablet only gives 16.7 or 33.3 ms. The p95 can't land in the 18-25 ms band, so a few dropped frames go straight from `high` to `low`. Worth checking in story 1.13's tablet profile.
- **A stall at the window's start isn't counted.** In `C:\Users\lpodobnik\Claude\matematika\src\ui\scene\frame-test.ts`, `if (last >= from)` skips any frame that starts inside the 1-second settle wait and ends inside the timing window. A long stall right at the window's start is never counted, which tilts the pick upward.
- **Merge risk.** 9 files that lane/1-12 changes also have uncommitted edits in the epic-1 checkout (`store/reducer.ts`, `types.ts`, `actions.ts`, `store.test.ts`, `dev/DevPanel.tsx`, `dev-view.ts`, `dev-view.test.ts`, `ui/scene/SceneRoot.tsx`, `ui/notebook/pad-keys.test.ts`). `C:\Users\lpodobnik\Claude\matematika\src\store\store.test.ts` line 24 expects `ui` to equal `{ screen, notebookAside }` exactly, so it will fail once `ui.quality` merges in.
- **Review's own run.** The test suite ran once on lane/1-12: 52 files, 1034 tests passing; check and build were not run then (they were in the fix pass, above). All three acceptance criteria are met in code: steam in a `ParticleContainer` runs at `high` and `medium` and unmounts at `low`; the p95 test starts 1 s after the first frame, uses inclusive 18 and 25 ms thresholds and is held in memory; the dev panel's forced setting holds until reload.

## Merge into epic-1

- Merged after stories 1.9 to 1.11. The conflicts (tuning, actions, reducer, store tests, scene root, dev panel) were resolved by keeping both sides: the dev panel has the Balance switch and the quality control, and the state has `save` and `ui.quality`.
- **The vent moved.** Story 1.11's splitter holder sits in the scene's top-left corner and, on a phone at 640 × 360, reaches to x ≈ 617, within 24 units of the housing's left end (x = 641). The vent out of the housing's left end and its plume reached x = 565, under the holder, and failed 1.11's test that the holder stays clear of the machine. The vent now stands on the housing's top, one pipe width in from its left end. The plume is smaller (16 puffs, radius 16, rising about 32 units and drifting a little left), so it stays above the housing, under the lamps' rays and right of the holder (left edge x ≈ 627). The machine's box no longer reaches left of the housing.
