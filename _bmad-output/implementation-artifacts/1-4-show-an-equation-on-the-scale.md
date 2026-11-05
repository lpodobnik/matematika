# Story 1.4: Show an equation on the scale

Status: review

## Story

As the player,
I want the stage's equation to appear as pieces on two pans that tip toward the heavier side,
so that I can see whether the two sides are equal.

**Covers:** FR1–FR3; NFR4 (number size, not colour alone); architecture store, `RoomSpec`, entity creation, `ui/scene/scale/`.

## Acceptance Criteria

1. **Given** the store skeleton (one Zustand store, a pure root reducer taking `ctx`, domain events, an empty effects registry) and `src/content/rooms/r01-door-lift.ts` with `machine: 'door-lift'` and an `xMeaning` **When** room 1 loads **Then** the left pan shows one x-gear and a weight of 4, and the right pan a weight of 9
2. **Given** any equation **When** its pieces are derived **Then** a number is a weight, a subtracted number a float, `kx` is k x-gears (one large gear showing the count above 12), `−kx` is springs, and `x : n` is a divider under an x-gear **And** any term without x that isn't a bare number (`2 · 9`, `18 : 2`) is one weight of its value, so `2 · 9 + 5 = 23`, `3 · 4 = 12` and `15 : 3 = 5` all have pieces **And** a weight and a float of the same number on one pan, or a gear and a spring, cancel and vanish
3. **Given** a value for x **When** the pans are drawn **Then** the tilt is the stage's `tiltPerUnit` (default `tuning.tiltPerUnit`, 1°) times the difference between the sides, clamped to `tuning.tiltMax` (15°), animated as a spring
4. **Given** the tablet **When** pieces render **Then** numbers on weights are at least 20 CSS px, and which side is heavier shows by position, not colour alone
5. **Given** content tests **When** they run **Then** room 1's equation parses with one whole-number solution and the room has a `machine` and an `xMeaning` **And** skins are placeholders

## Tasks / Subtasks

- [x] `src/config/tuning.ts`: `tiltPerUnit` 1, `tiltMax` 15, `maxSmallGears` 12 (AC: 2, 3)
- [x] `src/room/types.ts`: `RoomSpec`, `StageSpec`, `MachineSpec`, `PinSpec`, ids, `Phase`, `StageState`, `RoomState` (AC: 1)
- [x] `src/room/pieces.ts`: pieces from the AST, cancellation, keys, labels (AC: 2)
- [x] `src/room/tilt.ts`: exact side values, tilt with clamp (AC: 3)
- [x] `src/room/room.ts`, `src/room/events.ts`: enter a room, `StageArrived` (AC: 1)
- [x] `src/room/scale.ts`: `scaleView`, what the scale shows for the stage in play (AC: 1–3)
- [x] `src/store/`: `types`, `actions`, `events`, `reducer`, `store`, `effects/index` (AC: 1)
- [x] `src/content/rooms/r01-door-lift.ts`, `index.ts`, `rooms.test.ts` (AC: 1, 5)
- [x] `src/ui/scene/scale/`: `Scale`, `Pan`, `Piece`, `layout`, `tilt-spring`; placeholder skin in `src/art/skins/scale.ts`; wired into `SceneRoot`; `main.tsx` enters room 1 (AC: 1, 3, 4, 5)
- [x] Tests next to each file (AC: 1–5)
- [x] `npm run check && npm test && npm run build` green; checked in a browser

## Dev Notes

- **Boundaries:** `room/` is a pure folder (only `immer`, other pure folders, `config`, `lib`); it never imports the store, React, Pixi or content. The store looks a `RoomSpec` up in content and hands it to `enterRoom`. Content imports only types from pure folders. Only `ui/scene` imports Pixi. `src/architecture.test.ts` enforces all of this.
- **State management:** one store, `dispatch(action)` calls the pure root reducer with a fresh `ctx` (`now`, `rng`), stores the result, then runs effects on the returned domain events. Components read with selectors and never call effects.
- **Entity creation:** pieces are derived from the AST; keys are `${side}-${kind}-${index}`. Brackets are acted out from their `toLinear` form.
- **Which x the pans show (Pattern 1):** while exploring, the dial's x, shown on the gears. Acting out (story 1.7) will use the stage's solution and `?`.
- **Per-frame values through refs:** the tilt spring (Motion) writes the beam's rotation and the pans' positions to Pixi objects; React renders only when the pieces change.
- **Text in the scene:** numbers use Pixi `Text`; formatting only through `math/format.ts`.
- **Gesture and size rules:** thresholds in CSS px; the scene is 1600 × 1000, scaled to fit beside the notebook.
- **Not in this story:** the dial and readouts (1.5), the notebook (1.6), acting out lines and the placeholder machine's progress (1.7), room phases beyond `arrive` (1.8).

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run.

### Calls Made

- **Pieces live in `src/room/pieces.ts`, not `math/`.** The architecture's System Location Mapping puts scale logic in `room/`, and `math/` changes must add `lines.table.ts` rows, a file story 1.3 creates. `math/` is unchanged.
- **Domain events are defined in the pure folder that emits them** (`room/events.ts`), and `store/events.ts` is the one union of them. The architecture shows the union in `store/events.ts`, but pure reducers return events and can't import the store. The fight lane does the same (`FightEvent` in `fight/types.ts`).
- **`StageState` holds only `phase`, `machine`, `pans` and `dialX`** for now; later stories add the lines, draft, jam, progress, dial window and pin. **`GameState` has `room` and `ui`**; `save` comes in epic 2 and `fight` in epic 3.
- **Springs follow the gears' rule:** above 12, one large spring shows the count. The GDD and architecture name only the large gear, but room 11 has `27x` springs.
- **The large-gear threshold is per term, after cancellation.** `13x` is one large gear; `10x + 5x` is 15 small gears; `14x − 2x` is 12 small gears.
- **Cancellation pairs only equal pieces**, as the GDD says: `x + 7 − 5` keeps a weight of 7 and a float of 5. Gears and springs cancel only on dividers of the same size.
- **A term worth 0 has no piece**, so a pan worth 0 is empty (`0 · x + 4` is just a weight of 4).
- **A non-whole weight** (only a wrong line acted out can make one, e.g. `x = 25 : 2`) shows the reduced fraction as a division (`25 : 2`); beyond the literal range it shows its nearest whole number. Tilt always uses exact values.
- **Labels:** small gears and springs show the dial's x (the architecture's "which x the pans show" table), large ones their count as `27x`, dividers their number.
- **Label size grows on small screens:** 44 scene units normally (about 24 CSS px on a 1280 × 800 tablet), and larger whenever the scene's scale would put them under 20 CSS px (80 units at 640 × 360 with the notebook beside). The scene scale is React state in `SceneContent`, which changes only on resize.
- **Pans ride on posts above the beam's ends** and stay level, so stacked pieces never clash with strings; the heavier pan is lower, and a needle on the beam against fixed ticks shows the tilt by position too. Every piece kind has its own shape (weight block, balloon float, toothed gear, coil spring, small divider wheel).
- **Tilt spring:** Motion `springValue`, stiffness 120, damping 14: a small overshoot (about 0.4° on a 5° swing), settled in about a second. The scale starts level and swings to the stage's tilt.
- **`main.tsx` enters room 1 at start-up** (`room/enter`), until the map and room sequencing exist. An unknown room id is a programmer error (`assert`).
- **Room 1's data:** `xMeaning` "counterweight still needed to lift the door", `mapChange` `'door-lift-opens'`, dial 0–10 step 1, readouts on, ways `['try']`, Try values fading `'blanks'` (GDD Fading table, rooms 1–3). A locked dial (room 7) starts at 0 until its rules are written.
- **Content tests also require the solution to be 0 or more** (5th grade has no negative numbers), and every machine to have pieces on both pans.
- **`src/config/tuning.ts` is new here and also on the `lane/fight` branch**, so merging the two gives an add/add conflict; both are one `tuning` object and merge by joining their keys.
- **TypeScript 7 quirk:** after `if (p.kind === 'a' || p.kind === 'b') return`, it doesn't narrow `p` to the other member; `isNumberPiece` is a type guard used instead.

### Completion Notes

- The store skeleton: `createGameStore` (options for tests: reducer, effects, `makeCtx`, initial state), `gameStore`, `useGame(selector)`; the root reducer uses Immer and returns `{ state, events }`; the effects registry is empty and runs events in order through effects in order.
- `scaleView(room)` turns the stage in play into pieces with labels, exact side values, tilt and level; the Pixi components only lay it out and draw it.
- Checked in the built-in browser on `vite preview` and the dev server (StrictMode): one canvas, no console errors, nothing in `matematika:errors`; room 1 shows a gear (0) and a 4 against a 9, the right pan lower by 5°, at 800 × 600 and 1280 × 800.

### Test Results

- `npm run check`: 73 files, no errors.
- `npm test`: 25 files, 369 tests passing (111 new in 8 files).
  - AC1: `store.test.ts` (11): room 1 loads with a gear and a 4 against a 9; ctx per dispatch; events reach effects after the state is stored; the reducer is pure. `room.test.ts` (7).
  - AC2: `pieces.test.ts` (55): every piece rule, the AC's check lines, brackets, cancellation, keys; fast-check: pieces always weigh what the side is worth at any x, and no cancelling pair is ever left.
  - AC3: `tilt.test.ts` (9): 1° per unit, sign, clamp at ±15°, the stage's own `tiltPerUnit`, equal steps per notch, sides far beyond a float. `scale.test.ts` (4). `tilt-spring.test.ts` (5): on Motion's manual clock, the tilt swings, overshoots a little, settles, retargets without a jump, stops when destroyed.
  - AC4: `layout.test.ts` (14): labels at least 20 CSS px for any scene scale (fast-check) and on the tablet; labels fit their pieces; the heavier pan is lower; pans stay in the scene at ±15°; rows never overlap or leave the pan.
  - AC5: `rooms.test.ts` (6): room 1 parses with one whole-number solution, has a `machine`, `xMeaning` and `mapChange`, and has pieces on both pans.
- `npm run build`: `tsc --noEmit` clean; 0.91 MB in 9 files, JavaScript 0.27 MB gzipped (was 0.25 MB).

### File List

- `src/config/tuning.ts` (new)
- `src/room/types.ts`, `src/room/events.ts`, `src/room/room.ts`, `src/room/room.test.ts` (new)
- `src/room/pieces.ts`, `src/room/pieces.test.ts`, `src/room/tilt.ts`, `src/room/tilt.test.ts`, `src/room/scale.ts`, `src/room/scale.test.ts` (new)
- `src/store/types.ts`, `src/store/actions.ts`, `src/store/events.ts`, `src/store/reducer.ts`, `src/store/store.ts`, `src/store/store.test.ts`, `src/store/effects/index.ts` (new)
- `src/content/rooms/r01-door-lift.ts`, `src/content/rooms/index.ts`, `src/content/rooms/rooms.test.ts` (new)
- `src/art/skins/scale.ts` (new)
- `src/ui/scene/scale/Scale.tsx`, `Pan.tsx`, `Piece.tsx`, `layout.ts`, `layout.test.ts`, `tilt-spring.ts`, `tilt-spring.test.ts` (new)
- `src/ui/scene/SceneRoot.tsx` (modified: draws the scale and keeps the scene scale), `src/main.tsx` (modified: enters room 1)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified), this story file
