---
stepsCompleted: [1, 2, 3, 4]
status: 'epic 1 ready for development'
mode: 'decide-and-flag: Claude made the calls; each is open to Luka''s veto (see Calls Open to Veto)'
revised: '2026-11-05, after the implementation readiness review'
inputDocuments:
  - '_bmad-output/planning-artifacts/gdds/gdd-matematika-2026-11-05/gdd.md'
  - '_bmad-output/planning-artifacts/gdds/gdd-matematika-2026-11-05/epics.md'
  - '_bmad-output/planning-artifacts/game-architecture.md'
  - '_bmad-output/narrative-design.md'
---

# matematika - Epic Breakdown

## Overview

This document breaks the GDD and the architecture into stories. It supersedes the story lists in the GDD folder's `epics.md`, which stays as the epic overview. **Epic 1 is broken down in full**, with acceptance criteria. Epics 2–6 keep the GDD's epic structure and story list, and are detailed with this workflow before each one starts, because epic 1 tests the design's biggest bet and its result can change them. There is no UX design document; interaction rules come from the GDD's Controls and Input section and the architecture's consistency rules.

Acceptance criteria refer to the architecture (`_bmad-output/planning-artifacts/game-architecture.md`) by section name: Pattern 1 (the equation model, checker rules, which x the pans show, balance moves, fading) and Pattern 2 (room phases and rules).

## Requirements Inventory

### Functional Requirements

**Scale**
- FR1: Each side of a stage equation sits on its own pan as pieces: number weight (`+ n`), x-gear (`+ x`; `kx` is k gears, one large gear showing the count above 12), float (`− n`), spring (`− x`), reducer (`x : n`).
- FR2: A weight and a float of the same number cancel, as do a gear and a spring.
- FR3: The pans tilt 1° per unit of difference between the sides, clamped at ±15°, scaled per room for big numbers.
- FR4: Both sides' values show while dragging, except in rooms where readouts are hidden.
- FR5: The x dial moves in whole-number notches, one per 24 px of drag with a tick per notch, within a range set per room; in division forms each notch is a multiple of the divisor.
- FR6: The poke window limits the dial to its first 3 or 4 notches until he makes a prediction.
- FR7: He places a prediction pin on the machine, can move it with a second drag, and confirms it; the full dial range then opens. A right call earns 2 bonus parts, paid when the result is known and once per stage; a wrong one costs nothing.
- FR8: The dial can stop short of the answer (rooms 4, 8 and 11), so he needs another way.

**Three ways to solve**
- FR9: Try values: drag the dial until the pans level; written `x = n`.
- FR10: Balance: add or remove the same piece on both pans, from a tray of spare pieces whose numbers he sets; moving one side only tips the scale.
- FR11: The splitter, set to n parts and dragged across both pans, divides them; a split that doesn't divide evenly jams.
- FR12: The gear chain shows the equation as linked operations (`x → ·2 → +7 → 25`). He taps the last link and sets its inverse, choosing operation and number; a right inverse turns the output and the link goes dark; a wrong one jams. It handles `a − bx` forms, where the inverse of `135 − ☐` is `135 − 100`.
- FR13: Running a chain link backward also acts on the pans.
- FR14: All ways are free to try and reversible until he writes; any correct method is accepted.

**Notebook**
- FR15: The notebook sits beside the scale in landscape, with an on-screen number pad (digits, `x`, `+`, `−`, `·`, `:`, `=`, brackets, delete, enter); number keys also work on a computer.
- FR16: A valid line is any line with the same solution as the line before, so steps can be skipped.
- FR17: Every solution ends with `x = n`, then the check line (`2 · 9 + 7 = 25`), which locks the machine.
- FR18: A correct line makes the machine act it out and move one stage; a valid line with no move to act out (`2x + 8 = 26`) is accepted without moving the machine.
- FR19: A wrong line is acted out, tips the scale and jams the machine; nothing is counted, and he can edit the line.
- FR20: Each way fades on its own, per the GDD table: lines appear as he moves (he writes the last two), then blanks to fill, then a blank page.

**Rooms**
- FR21: Room types: Solve; Compare (readouts hidden, pin x before anything moves); Predict (pin the effect before it runs; a number may change after solving); Find the mistake (a notebook with one wrong line and a jammed machine: pin the line, act it out, fix it); Story (build pans from a story, then pick the story that fits a set of pans).
- FR22: 13 rooms with the machines, what x means, equations, dial ranges, poke windows, pins and finishing ways in the GDD's Puzzle Progression tables.
- FR23: Linked machines: up to 3 machines, where one machine's answer becomes a weight in the next.
- FR24: The recording drum draws a dot for each x tried, with the right-hand side as a level line; he pins the next dot; room 13 ends with the line reveal and "linearna" from "linija".
- FR25: Solving a room restarts something visible on the map.
- FR26: Rooms can't be lost; the current stage can be reset, and the room left, at any time.

**City**
- FR27: A map with 19 nodes and the GDD's connections; tapping any reached connected node travels there at once.
- FR28: Tools earned at the end of rooms 3 (Balance), 6 (workshop), 7 (gear chain) and 12 (recording drum) open the rooms listed in the GDD; rooms 5–6 and 9–10 can be done in either order.
- FR29: Return trips: the bridge is visible from the street lamps with its weights locked, and the steam lift from the sluice gate with its chain case locked.
- FR30: The foundry gate is visible from room 6, shows `5 · x = 40`, and stays closed.
- FR31: Four automaton lairs, near rooms 2, 5, 8 and 12, open once seen.
- FR32: Tools are earned only in required rooms, gates depend only on tools and completed rooms, and parts never open the way forward.

**Assistance and story**
- FR33: Help arrives after 60 s without acting or 3 jams in a row, in four levels (wiggle, rate or next move, line structure with blanks, a worked example with other numbers); it is free and never recorded.
- FR34: After a room's first use of an idea, a one- or two-sentence card connects it to the school term, as the answer to Nikola's "how did you do that?"
- FR35: No instructions appear before a room.
- FR36: After room 1, someone asks who he is; he names his character (the only time the OS keyboard appears) and picks one of 4–6 looks; townspeople use the name.
- FR37: One or two story lines when a machine restarts; recurring townspeople; Kristijan's 13 notebook notes; the First Automaton's notices; the city's log of restarts.

**Fights**
- FR38: A turn-based fight: he rolls 3 dice and places them as blade `a`, charge `b` and reach (most blows this round), sets blows on the x dial seeing `a · x + b` but not the total, then strikes; the banner shows the sum; if armour is left, the automaton dents him.
- FR39: Hull 3; steam 10 per fight, 1 per blow; reward is base parts plus unspent steam; armour landing on exactly 0 doubles it.
- FR40: Losing (armour left and hull or steam at 0) drops a quarter of his unspent parts, rounded down, in a pile at that automaton; beating it recovers the whole pile; leaving is free before the first strike and counts as losing after it.
- FR41: Armour tiers 20, 30, 45 and 60 with base parts 3, 4, 5 and 6; a beaten automaton winds down, drops parts and punched tape, and rewinds later.
- FR42: The armour 30, 45 and 60 automatons each carry one torn logbook page, returned to his notebook on the first win.
- FR43: Upgrades: 4th die, roll 4 and discard 1 (40 parts); +3 steam (20); +1 hull (30).

**Rooms for friends**
- FR44: The workshop opens after room 6; he can use only forms and options met in rooms.
- FR45: He places x-gears and weights and chooses every number; coefficients up to 99, numbers up to 9 999; a room without a whole-number answer can't be sent.
- FR46: Costs charged on sending: weight 1, x-gear, spring or float 2, decoration 3, each blind 5, planted mistake 5, each extra linked machine 15.
- FR47: Ways to make it hard: blinds (hide readouts, keep pans still until x is written, shorten the dial), a planted mistake, up to 3 linked machines.
- FR48: He must solve the room and write the solution before the link appears; he picks the title from a fixed list.
- FR49: The link carries the whole room and nothing about the sender. A friend gets a one-minute intro machine if new, then the room with all three ways, a blank page and the usual help; cracking it gives a reply link and an offer to start the game.
- FR50: A friend can give up at any time; the machine then plays his written solution, and the friend gets a reply link.
- FR51: Opening a reply link stamps that room "cracked" or "uncracked" on the workshop wall.

**Saving and the play log**
- FR52: Progress saves automatically on the device after every written line and every fight.
- FR53: A backup link restores progress if browser data is cleared or he changes device.
- FR54: The play log keeps dates, rooms, ways used, predictions, wrong lines, fights and rooms built on the device, in a view for Luka his son doesn't see.

**Audio**
- FR55: A tick per dial notch, a thunk when the pans level, a steam hiss on a jam; each restarted machine adds its own loop at a shared tempo; a mute control is always available.

### NonFunctional Requirements

- NFR1: 60 FPS while dragging the dial in a three-machine room on his tablet.
- NFR2: The dial and pans follow the finger within one frame.
- NFR3: First load shows a loading screen and takes under about 15 s on home Wi-Fi; soft budget 30 MB; later launches load from the device.
- NFR4: Touch-first in landscape: one finger, mouse the same with no hover states, targets at least 48 px, numbers on weights at least 20 px, colour never the only signal; on a phone the notebook slides over the scale.
- NFR5: A browser link with no installation, accounts or server; static hosting.
- NFR6: His Android tablet in Chrome first; phone and computer also work; links open on iPads and iPhones.
- NFR7: Room links at most 2,000 characters, holding nothing about the sender.
- NFR8: No analytics or tracking; no personal data leaves the device; the character's name is never in a link.
- NFR9: Croatian only, all text in one place; school notation `·`, `:` and a space as the thousands separator; no gendered verb forms.
- NFR10: No progress lost during the 2-week test.
- NFR11: The line checker accepts every correct line and rejects every wrong one, in a test table covering all 13 rooms.
- NFR12: The living-blueprint look: grey ink on paper, with colour and brass only on restarted machines; code-drawn parts plus AI-generated or bought images.
- NFR13: No stars, scores or "correct" screens; success shows as the city changing.

### Additional Requirements

From the architecture:

- **No starter template.** Epic 1's first story scaffolds by hand: Vite 8.3.6, React 19.3.1, TypeScript 7.0.2, PixiJS 8.22.0 with `@pixi/react` 8.0.5, Zustand, Immer, Motion, Biome, Vitest, exact versions, and the `tsconfig.json` given under Development Environment.
- **Pure core.** Game logic lives in pure folders (`math`, `room`, `fight`, `city`, `economy`, `workshop`, `links`, `playlog`), enforced by `src/architecture.test.ts`.
- **One store.** A pure root reducer with `ctx` (time, randomness) returns state and domain events; effects (save, audio, play log) listen to events.
- **One equation model** (Pattern 1): AST, `BigInt` rationals, solution-based checker, progress tuple, machine progress, which x the pans show, balance moves.
- **Room engine** (Pattern 2): `RoomSpec` data, stages, phases, pin and poke rules, jam model, room-type strategies.
- **Content tests** for every room: whole-number solution, GDD tables, no clamped poke notch, every listed way can finish, no paper-test equations.
- **Scene:** a 1600 × 1000 logical scene in `SceneRoot`; per-frame values through refs; WebGL context loss handled; a quality setting.
- **Links** in the URL fragment, versioned and decodable forever (Pattern 3).
- **Saving** in `localStorage` with versioned migrations; persistent-storage request.
- **CI** on every push; deployment, PWA and the full device test set come in epic 6.
- **Art:** skins separate from logic; images through `art-src/` and `scripts/build-art.ts`; an art style guide in epic 2.

### UX Design Requirements

No UX design document. The interaction requirements are FR15 and NFR4, plus the architecture's consistency rules (input, gesture sizes, the dial, OS keyboard, text in the scene).

### FR Coverage Map

| FR | Epic | Note |
|---|---|---|
| FR1–FR5 | 1 | |
| FR6, FR7 | 1, 3 | Pin in 1; parts paid in 3 |
| FR8 | 1, 4 | Room 4 in 1; rooms 8 and 11 in 4 |
| FR9–FR11 | 1 | |
| FR12, FR13 | 4 | |
| FR14–FR19 | 1 | |
| FR20 | 1, 2, 4 | Try values (rooms 1–4) and Balance `auto` (room 4) in 1; Balance `auto` and `blanks` (rooms 5–7) in 2; Balance's blank page and all of Undo (rooms 8–13) in 4 |
| FR21 | 1, 2, 4 | Solve, and predict through room 3's pins, in 1; compare, predict and mistake in 2; story in 4 |
| FR22 | 1, 2, 4 | Rooms 1–4, 5–7, 8–13 |
| FR23, FR24 | 4 | |
| FR25 | 1, 2, 4, 6 | Restart animation in 1; map changes for rooms 1–7 in 2 and 8–13 in 4; final look in 6 |
| FR26 | 1, 2 | Stage reset in 1; leaving to the map in 2 |
| FR27, FR30–FR32 | 2 | Lair nodes appear in 2; fights in 3 |
| FR28, FR29 | 2, 4 | Balance, workshop and gear-chain gates and the bridge return trip in 2; drum gate and steam-lift return trip in 4 |
| FR33, FR34, FR37 | 2, 4 | Rooms 1–7 in 2; rooms 8–13 in 4. Hint level 1 (wiggle) for first use of the pin, tray and splitter in 1 |
| FR35 | 1 | Holds in every later epic |
| FR36 | 2 | |
| FR38–FR43 | 3 | |
| FR44–FR51 | 5 | |
| FR52 | 2, 3 | Lines in 2; fights in 3 |
| FR53, FR54 | 2 | Fights and rooms built join the log in 3 and 5 |
| FR55 | 6 | Mute from 2 |

### NFR Coverage Map

| NFR | Epic | Note |
|---|---|---|
| NFR1 | 1, 4, 5 | Three copies of a machine profiled in 1; real linked machines in 4; built three-machine rooms in 5 |
| NFR2 | 1 | Holds in every later epic |
| NFR3 | 2, 6 | Loading screen in 2; PWA cache in 6 |
| NFR4 | 1 | Holds in every later epic; phone layout checked in 6 |
| NFR5–NFR7 | 5, 6 | Links in 5; hosting and devices in 6 |
| NFR8 | 2, 5 | Saving and the play log in 2; links in 5 |
| NFR9 | 1, 2, 6 | Notation in 1; text module in 2; final text in 6 |
| NFR10 | 2, 6 | Saving in 2; the 2-week test in 6 |
| NFR11 | 1, 2, 4, 6 | The table grows with each room epic; checked complete in 6 |
| NFR12 | 2, 6 | Style guide in 2; final art in 6 |
| NFR13 | 1 | Holds in every later epic |

## Epic List

### Epic 1: First machine
He can play rooms 1–4 on the tablet, one after another: poke the scale, predict, balance, split, and write the lines that start each machine.
**FRs covered:** FR1–FR11, FR14–FR19, and parts of FR20–FR22, FR25, FR26, FR33 and FR35.

### Epic 2: The city
Rooms 1–7 sit on a map he can return to, with saving, story, his character, hints and explanation cards.
**FRs covered:** parts of FR20–FR22, FR25, FR26, FR28, FR29, FR33, FR34 and FR37; FR27, FR30–FR32, FR36, FR52–FR54.

### Epic 3: Automaton fights
He can hunt automatons in four lairs for parts and buy upgrades.
**FRs covered:** FR7 (parts), FR38–FR43, FR52 (fights).

### Epic 4: The whole district
All 13 rooms, with the gear chain, linked machines and the recording drum, ending in the line reveal.
**FRs covered:** FR8 (part), FR12, FR13, FR23, FR24, and parts of FR20–FR22, FR25, FR28, FR29, FR33, FR34 and FR37.

### Epic 5: Rooms for friends
He builds a room, solves it, sends it as a link, and sees whether his friend cracked it.
**FRs covered:** FR44–FR51.

### Epic 6: Ready for the surprise
The finished MVP: final art and sound, Croatian text, deployment and testing on all devices.
**FRs covered:** FR25 (look), FR55; NFR3, NFR5–NFR7, NFR10–NFR12.

**Order:** 1 → 2 → 3 and 4 in either order → 5 → 6, as in the GDD.

## Epic 1: First machine

Prove on the tablet that the machine is fun to poke and that writing feels like the final move, not a chore. Out of scope: map, saving, parts and final art.

### Story 1.1: Set up the project

As Luka,
I want the empty game running in Chrome on the tablet and checked on every push,
So that every later story lands on a working base whose rules are enforced.

**Covers:** architecture setup, boundaries, error handling and CI; NFR5, NFR6.

**Acceptance Criteria:**

**Given** a fresh clone
**When** `npm ci` and `npm run dev -- --host` run on the PC
**Then** the game opens at `http://<PC IP>:5173` in Chrome on the Android tablet, showing an empty 1600 × 1000 logical scene in `SceneRoot`, scaled to fit, with a placeholder notebook area beside it
**And** `package.json` pins the architecture's versions exactly, with `"type": "module"` and `"private": true`, `.npmrc` has `save-exact=true`, and `tsconfig.json` matches the architecture's (no `baseUrl`; `moduleResolution: "bundler"`)

**Given** development mode under React StrictMode
**When** the app mounts
**Then** `SceneRoot` survives the double mount of `@pixi/react`'s `<Application>` with one working canvas and no console errors

**Given** the tablet in portrait
**When** the game is open
**Then** an overlay asks to turn it, with its text from `src/content/text/hr.ts`, and disappears in landscape

**Given** the project
**When** `npm run check`, `tsc --noEmit`, `npm test` and `npm run build` run
**Then** all pass, and GitHub Actions runs them on every push (deployment comes in epic 6)

**Given** `src/architecture.test.ts`
**When** a file in a pure folder imports `react`, `pixi.js`, `zustand`, `motion`, `ui/`, `store/`, `save/` or `audio/`, or a file in `ui/` or `app/` contains č, ć, đ, š or ž
**Then** the test fails, shown by fixtures inside the test; `immer` is allowed in pure folders

**Given** a render error, a `window.onerror` or an `unhandledrejection`
**When** it happens
**Then** the error boundary shows the in-fiction "tap to restart" screen, the tap reloads the game, and the error is written to `matematika:errors`

**Given** the WebGL context is lost (forced with `WEBGL_lose_context`)
**When** it is restored, or the page becomes visible again while it is still lost
**Then** the scene remounts without a page reload

### Story 1.2: Read, solve and write equations

As Luka,
I want equations parsed, solved exactly and written in school notation,
So that the scale, notebook and checker all work from one model.

**Covers:** basis for FR16 and NFR11; NFR9 (notation); architecture Pattern 1 (`tokens`, `parse`, `expr`, `rational`, `linear`, `format`).

**Acceptance Criteria:**

**Given** number-pad tokens or a string in school notation
**When** it is parsed
**Then** the result is an `Equation`, or `{ ok: false, reason }`, and nothing throws
**And** `2x + 7 = 25`, `x : 3 = 5`, `20 − x = 6`, `2 · 9 + 7 = 25`, `9 = x` and `5 905 − 27x = 316` parse
**And** `2x + = 25`, `= 9`, `x =`, `−x = 14`, `2x = 25 − 7 = 18`, `x3 = 12` and a number above 9 999 999 don't

**Given** a parsed equation
**When** it is read
**Then** `3x` and `3 · x` are both multiplication, `:` is division, brackets group and spaces are ignored

**Given** a side of an equation
**When** `toLinear` runs
**Then** it returns an exact `a·x + b` with reduced `BigInt` fractions, or `nonlinear` for `x · x` and `18 : x`, or a division-by-zero result for `18 : 0`, with no thrown error
**And** a chain such as `9 999 999 · 9 999 999 · 9 999 999` stays exact

**Given** an equation
**When** `solve` runs
**Then** `2x + 7 = 25` gives 9, `x + 1 = x + 2` gives no solution and `2x = 2x` gives every number

**Given** an equation or number
**When** `format` runs
**Then** it writes `·` (U+00B7), `:`, `−` (U+2212), `3x` without a dot, and thousands from 1 000 with U+202F (`5905` → `5 905`)

**Given** random whole-number equations `ax + b = c` with whole-number solutions (fast-check)
**When** each is formatted and parsed again
**Then** it round-trips, and `solve` returns its solution

### Story 1.3: Judge a written line

As Luka,
I want every written line judged by its solution,
So that any correct line, including skipped steps, is accepted and every wrong one is caught.

**Covers:** FR16–FR19 (judging); NFR11; architecture Pattern 1 (checker rules, progress, `moves`, `steps`).

**Acceptance Criteria:**

**Given** a stage equation and its committed lines
**When** a line is checked
**Then** the verdict is `incomplete`, `nonlinear`, `aside`, `wrong`, `valid` (with `move` and `progress`), `answer` or `check`, by the architecture's checker rules

**Given** the stage `2x + 7 = 25`
**When** lines are checked
**Then** `2x = 18`, `2x = 25 − 7`, `x = 18 : 2` and `x = 9` (a skipped step) are accepted, and `9 = x` is `answer`
**And** `2x = 32`, `x = 16` and `2 + x = 25` are `wrong`
**And** `2x + 8 = 26` is `valid` with `progress: false`
**And** `x = 18 : 0`, `2x = 25 − 7 = 18` and `x3 = 9` are `incomplete`

**Given** the answer line `x = 9` has been written
**When** the next line is checked
**Then** `2 · 9 + 7 = 25` and `9 · 2 + 7 = 25` are `check`, `25 = 25` is `aside` and `2 · 8 + 7 = 25` is `wrong`

**Given** the answer line has not been written yet
**When** `2 · 9 + 7 = 25` is checked
**Then** it is `aside`

**Given** the chain `2x + 7 = 25` → `2x = 25 − 7` → `2x = 18` → `x = 18 : 2` → `x = 9`
**When** progress is measured with the tuple (terms on the x side, coefficient not 1, operators on the number side)
**Then** every step makes progress

**Given** `src/math/steps.ts`
**When** asked for the next step of an equation by Try values or Balance
**Then** it returns the canonical next line (Balance for `2x + 5 = 23`: `2x = 18`, then `x = 9`)

**Given** `src/math/lines.table.ts`, a named list of rows (stage, line, expected verdict)
**When** `lines.table.test.ts` runs
**Then** every row passes, including rows for rooms 1–4 (both stages of rooms 2 and 3) and every line of room 4's worked sequence

**Given** random equations (fast-check)
**When** a solution-preserving step is applied (the same number added to both sides, both sides multiplied by a whole number other than 0, a side evaluated)
**Then** the line is accepted, and changing one number on one side only is rejected

### Story 1.4: Show an equation on the scale

As the player,
I want the stage's equation to appear as pieces on two pans that tip toward the heavier side,
So that I can see whether the two sides are equal.

**Covers:** FR1–FR3; NFR4 (number size, not colour alone); architecture store, `RoomSpec`, entity creation, `ui/scene/scale/`.

**Acceptance Criteria:**

**Given** the store skeleton (one Zustand store, a pure root reducer taking `ctx`, domain events, an empty effects registry) and `src/content/rooms/r01-door-lift.ts` with `machine: 'door-lift'` and an `xMeaning`
**When** room 1 loads
**Then** the left pan shows one x-gear and a weight of 4, and the right pan a weight of 9

**Given** any equation
**When** its pieces are derived
**Then** a number is a weight, a subtracted number a float, `kx` is k x-gears (one large gear showing the count above 12), `−kx` is springs, and `x : n` is a divider under an x-gear
**And** any term without x that isn't a bare number (`2 · 9`, `18 : 2`) is one weight of its value, so `2 · 9 + 5 = 23`, `3 · 4 = 12` and `15 : 3 = 5` all have pieces
**And** a weight and a float of the same number on one pan, or a gear and a spring, cancel and vanish

**Given** a value for x
**When** the pans are drawn
**Then** the tilt is the stage's `tiltPerUnit` (default `tuning.tiltPerUnit`, 1°) times the difference between the sides, clamped to `tuning.tiltMax` (15°), animated as a spring

**Given** the tablet
**When** pieces render
**Then** numbers on weights are at least 20 CSS px, and which side is heavier shows by position, not colour alone

**Given** content tests
**When** they run
**Then** room 1's equation parses with one whole-number solution and the room has a `machine` and an `xMeaning`
**And** skins are placeholders

### Story 1.5: Drag x

As the player,
I want to drag a dial that changes x one notch at a time,
So that I see each notch move the pans by the same amount.

**Covers:** FR4, FR5, FR9 (levelling); NFR1, NFR2, NFR4; architecture "The dial".

**Acceptance Criteria:**

**Given** room 1
**When** he drags the dial's horizontal track
**Then** x changes by one notch per 24 CSS px within 0–10, starting at 0, with a tick mark on each notch, and the x-gears show the current value

**Given** a drag in progress
**When** the finger moves
**Then** the knob follows every frame through a ref, and the store updates only when the notch changes (`dial/set`, with a `DialNotch` event)
**And** the drag ends cleanly on pointer up, pointer up outside and pointer cancel

**Given** a stage with readouts
**When** he drags
**Then** both sides' values show; a stage with `readouts: false` hides them

**Given** the sides become equal
**When** the notch lands
**Then** the pans level and `PansLevel` fires
**And** every notch changes the difference between the sides by the same amount

**Given** a test fixture stage `x : 3 = 5` with dial 0–30, step 3
**When** he drags
**Then** the dial steps in 3s

**Given** the dial
**When** it reaches either end of its range
**Then** it stops there
**And** its hit area is at least 48 CSS px at a 640 × 360 viewport, and a mouse drag behaves the same, with no hover states

### Story 1.6: Write in the notebook

As the player,
I want a notebook with a number pad beside the scale,
So that I can write lines the way I do at school without the tablet's keyboard popping up.

**Covers:** FR15; NFR4 (phone layout), NFR9.

**Acceptance Criteria:**

**Given** a room
**When** the notebook opens
**Then** the stage equation is its first line, read-only
**And** on the tablet in landscape the notebook sits beside the scale, and on a phone in landscape (under 500 CSS px tall) it slides over the scale and can be pushed aside

**Given** the number pad
**When** he taps its keys
**Then** digits, `x`, `+`, `−`, `·`, `:`, `=`, `(`, `)`, delete (from the end) and enter edit the draft line, each key at least 48 CSS px
**And** the notebook is not an `<input>`, so the OS keyboard never opens

**Given** a computer
**When** he types `0`–`9`, `x`, `+`, `-`, `*`, `/`, `:`, `=`, brackets, Backspace or Enter
**Then** they work like the pad, with `*` → `·`, `/` → `:` and `-` → `−`

**Given** a draft line
**When** he types
**Then** it shows in school notation (`5905` shows as `5 905`)

**Given** a draft line
**When** he presses enter
**Then** it is judged (story 1.3): `incomplete`, `nonlinear` and `aside` lines wiggle and stay in the draft; `wrong` lines stay in the draft, marked as wrong; `valid`, `answer` and `check` lines are appended to `lines`, read-only

### Story 1.7: Make written lines drive the machine

As the player,
I want each correct line to move the machine and a wrong one to jam it,
So that writing is what starts the machine.

**Covers:** FR17–FR19, FR20 (Try values blanks); NFR13; architecture Pattern 1 (machine progress, which x the pans show, two layers, fading) and Pattern 2 (jam model).

**Acceptance Criteria:**

**Given** a committed line
**When** it is acted out
**Then** the pans take the line's layout with one generic tween, are evaluated at the stage's solution, show `?` on the gears and hide the readouts
**And** the dial keeps its value, and the next exploring action (dial, tray or splitter) returns the pans to the dial's x in the committed line's layout
**And** acting out never fires `PansLevel`

**Given** a valid line with progress
**When** it is committed
**Then** the pans stay level, `machineProgress` rises by `tuning.progressStep` (0.2) up to 0.8, the placeholder machine shows it, and `LineAccepted` fires

**Given** a valid line without progress (`2x + 8 = 26`)
**When** it is committed
**Then** it is accepted and `machineProgress` doesn't change

**Given** a wrong line
**When** enter is pressed
**Then** it is acted out at the stage's solution, the pans tip by at least `tuning.jamMinTilt` (4°), the machine jams (`MachineJammed`, kind `line`), and the line stays in the draft, not in `lines`
**And** any edit to the draft clears the jam and returns the pans to the last committed line, and enter judges the edited line again
**And** `jamsInARow` counts consecutive jams and resets on a committed line

**Given** the answer line, then the check line
**When** each is committed
**Then** `machineProgress` goes to 0.9, then to 1; the stage goes from `open` to `locked` and `StageLocked` fires
**And** nothing but the machine shows success: no stars, scores or "correct" screen

**Given** a stage whose Try values fading is `blanks`
**When** the stage opens
**Then** the notebook shows `x = ☐` and the check line with x blanked (`☐ + 4 = 9`); pad input fills only the current blank, and delete clears that blank, never the template's own text
**And** in `blank` mode the notebook shows an empty draft line

### Story 1.8: Play a room from arrival to restart

As the player,
I want each room to run from a stopped machine to watching it restart, then move on,
So that rooms 1 and 2 play one after another.

**Covers:** FR22 (rooms 1–2), FR25 (restart animation), FR26 (stage reset), FR35; architecture Pattern 2 (arrive, restart, reset).

**Acceptance Criteria:**

**Given** `r01` (door lift) and `r02` (street lamps) in `src/content/rooms/index.ts`, each with `machine`, `xMeaning` and `mapChange`
**When** a room starts
**Then** it runs `arrive → open → locked → restart → done`, with no instruction screen, and `arrive` ends on his first touch on the machine (`StageArrived` fires when it begins)

**Given** room 2
**When** its first stage `3x = 12` (dial 0–10) locks
**Then** part of the machine starts (one lamp lights), and its second stage `x : 3 = 5` (dial 0–30 in 3s) arrives

**Given** the last stage of a room locks
**When** the restart plays
**Then** a placeholder animation shows the whole machine running, ending on `presentation/done` or a timeout fallback

**Given** any phase before `locked`
**When** he taps reset
**Then** the current stage returns to line 0 with the dial at its minimum and `machineProgress` at 0, and earlier stages stay solved
**And** reset is off while the stage is `locked` or restarting

**Given** a room is done
**When** its restart ends
**Then** the next room in `content/rooms/index.ts` loads

**Given** a development build with `?dev` or the backtick key
**When** the dev panel opens
**Then** it jumps to any room and stage, and shows the last verdict and progress tuple

### Story 1.9: Predict before the dial opens

As the player,
I want to poke a few notches, then pin where I think the pans will level before the full dial opens,
So that I commit to an idea and see what it causes.

**Covers:** FR6, FR7 (without parts), FR21 (room 3's pins), FR22 (room 3), FR33 (first-use wiggle); architecture Pattern 2 (poke, pin, resolution, reset).

**Acceptance Criteria:**

**Given** a stage with `pokeNotches: 4`
**When** it opens
**Then** the dial moves only over min, min + step, min + 2·step and min + 3·step (`poke` phase), and the notebook is off

**Given** the poke phase
**When** the pin is first available
**Then** it wiggles once (hint level 1)

**Given** the poke phase
**When** he first drags the pin
**Then** the stage goes to `pin` and the dial freezes; a second drag moves the pin; confirming locks it, opens the full dial range and turns the notebook on

**Given** a locked "where it levels" pin
**When** the dial levels the pans, or the stage locks
**Then** the pin resolves once: a right pin shows as right on the machine and `PredictionMade` fires with `right: true`; a wrong pin briefly shows its own value's tilt on the pans, with no penalty (parts come in epic 3)

**Given** a locked pin
**When** he resets the stage
**Then** the pin stays locked and is not offered again, and the stage returns to `open` with the full dial range, so he is never left with a short dial and no pin

**Given** room 3 (sluice gate), stage 1: `x − 6 = 8`, dial 6–20, a 4-notch poke window and a "where it levels" pin
**When** he plays it
**Then** the poke window covers 6, 7, 8 and 9, and the answer is 14

**Given** room 3, stage 2: `20 − x = 6`, dial 0–20, no poke window, and an `effect` pin with two options, "the pan goes down" and "the pan goes up" as x grows
**When** the stage opens
**Then** he must pin a direction before the dial moves; the pin resolves on the first notch, where x is a spring, so raising x lifts its pan

**Given** room 3 is done
**When** it restarts
**Then** Balance is earned, held in memory until saving arrives in epic 2

### Story 1.10: Balance with the tray

As the player,
I want to put the same piece on both pans or take it off both,
So that I can change the equation without the dial.

**Covers:** FR10, FR14, FR20 (Balance `auto`), FR33 (first-use wiggle); architecture Pattern 1 (balance moves).

**Acceptance Criteria:**

**Given** Balance is earned and a stage is open
**When** the tray appears
**Then** it holds weights and floats only, each numbered 1–99 with − and + buttons that repeat when held, and it wiggles once on first use
**And** x-gears and springs can't be dragged off or added

**Given** a piece dropped on a pan, or a weight or float dragged off a pan into the tray
**When** the drop lands
**Then** the number pieces on that pan combine into one piece of their sum (a weight if positive, a float if negative, nothing if zero)
**And** a drop that would leave a pan with no x pieces below 0 is refused and slides back

**Given** a change to one pan only
**When** it lands
**Then** the pans tip at the dial's x and nothing is written

**Given** the other pan gets the same change
**When** the pans' equation has the stage's solution again
**Then** the move is complete and `WayUsed` fires with `balance`
**And** with Balance fading `auto`, the equation is appended as the next line, unless it is `x = n`, which he writes

**Given** exploratory moves
**When** he drags a piece back, or resets
**Then** the pans go back; writing a line replaces the exploratory layout with the line's

**Given** room 4 (water wheel): `2x + 5 = 23`, dial 0–6, `tiltPerUnit: 0.75`, a 4-notch poke window, a pin beyond the dial (track 0–12), Try values `blank`, Balance `auto`
**When** he puts a float 5 on the left
**Then** the equation is `2x = 23`, the pans tip, and nothing is written
**And** when he puts a float 5 on the right, `2x = 18` is written
**And** a content test confirms the dial can't reach 9; typing `x = 9` and the check line still locks the machine, because any correct method is accepted

### Story 1.11: Split both pans

As the player,
I want to split both pans into equal parts,
So that I can get from `2x = 18` to x on its own.

**Covers:** FR11; architecture Pattern 1 (balance moves) and Pattern 2 (split jam).

**Acceptance Criteria:**

**Given** Balance is earned and a stage is open
**When** the splitter is first available
**Then** it wiggles once, and he can set it to 2–9 parts

**Given** the splitter set to n
**When** he drags it across both pans
**Then** each pan's number pieces first combine as a drop does, then each pan's gear count and number is divided by n, and the move completes like any balance move
**And** after a typed `2x = 23 − 5`, a split by 2 gives `x = 9` rather than jamming on the odd 23

**Given** a split where any gear count or number doesn't divide evenly
**When** he drags the splitter across
**Then** the machine jams (`MachineJammed`, kind `split`) until he drags the splitter off, which clears the jam

**Given** room 4 at `2x = 18`
**When** he splits by 2
**Then** the pans show `x = 9` and nothing is written; he writes `x = 9`, then `2 · 9 + 5 = 23`, and the machine locks

### Story 1.12: Pick a quality setting

As Luka,
I want the game to pick a quality setting that keeps 60 FPS on whatever device opens it,
So that effects never cost smoothness on his tablet or a friend's phone.

**Covers:** NFR1, NFR2; architecture Performance (quality).

**Acceptance Criteria:**

**Given** a placeholder steam effect (particles in a `ParticleContainer`) on the machine
**When** quality is `high` or `medium`
**Then** it runs; at `low` it is off

**Given** the game starts
**When** the 2-second frame-time test runs with all effects on, starting 1 second after the scene's first frame
**Then** a 95th-percentile frame time up to `tuning.qualityHighMs` (18 ms) picks `high`, up to `tuning.qualityMediumMs` (25 ms) `medium`, and otherwise `low`
**And** the result is held in memory and the test runs on every launch until epic 2 saves `settings.quality`

**Given** the dev panel (from story 1.8)
**When** this story adds a control there and a quality setting is forced
**Then** it overrides the test result until reload

### Story 1.13: Play rooms 1–4 on the tablet

As Luka,
I want rooms 1–4 to play back to back on the tablet at 60 FPS with the effect running,
So that the design's biggest bet, writing as the final move, can be tried for real.

**Covers:** NFR1, NFR2; epic 1's playable result; architecture content tests and profiling.

**Acceptance Criteria:**

**Given** a fresh start without the dev panel
**When** he plays
**Then** rooms 1–4 run in order, each from arrival to restart, and after room 4 a placeholder "to be continued" screen shows (the map replaces it in epic 2)

**Given** content tests
**When** they run
**Then** for rooms 1–4 each equation parses with one whole-number solution; machines, `xMeaning`, dial ranges, poke windows, pins and fading match the GDD tables; no poke-window notch hits the tilt clamp; every listed finishing way can finish under the room's limits, using `steps.ts`
**And** no equation from `src/content/paper-test.ts`, seeded with the brief's paper test, appears in any room, compared up to swapped sides and commuted terms

**Given** the dev panel showing three copies of room 4's machine side by side, with the effect on
**When** Luka drags the dial on his tablet while Chrome's remote profiler (`chrome://inspect`) records
**Then** it holds 60 FPS and the knob follows the finger within one frame, and the numbers are recorded in this story's file

**Given** `src/math/lines.table.ts`
**When** tests run
**Then** it contains, with expected verdicts, every line in epic 1's acceptance criteria and, for each stage of rooms 1–4, the canonical solution of every finishing way (from `steps.ts`), one skipped-step solution and at least two wrong lines

### Story 1.14: Fix what the first playtest found

As Luka,
I want rooms 1–4 to make sense to someone who has never seen them,
So that the machine can teach without me standing next to it.

**Covers:** Luka's first playtest (2026-11-06), the Prediction, Pieces and Write rows of the GDD, NFR4, NFR13. Full criteria are in `_bmad-output/implementation-artifacts/1-14-fix-what-the-first-playtest-found.md`.

**Acceptance Criteria:**

**Given** a stage that isn't locked
**When** lines move the machine
**Then** the door lifts only a little against a visible latch, and the check line releases the latch and opens it fully

**Given** `x : n` or a float on a pan
**Then** `x : n` is one slice of a ghost x-gear cut into n, tagged `: n`, and a float is a balloon labelled `−6` pulling up

**Given** a pin on offer
**Then** a tag asks its question, a clamp marks the end of the poke window, the dial keeps turning inside the window, and confirm sits beside the pin

**Given** he confirms a pin
**Then** the machine tests it at once (turns the dial to it, weighs its x beyond the dial, or, for a direction pin, turns the dial to its end), and a right pin pays 2 parts once per stage into a counter, with no praise text

### Story 1.15: Make rooms 1–4 teach themselves

As Luka's son,
I want the machine to show me what to do next and pictures that mean what they look like,
So that I can play rooms 1–4 without my dad explaining them.

**Covers:** his first play (2026-11-06); the GDD's Balance, Pieces, Prediction and Player Assistance. Full criteria are in `_bmad-output/implementation-artifacts/1-15-make-rooms-1-4-teach-themselves.md`.

**Acceptance Criteria:**

**Given** a Balance move
**When** he drops a tray piece, drags a number off, or drops the splitter on the scale
**Then** it acts on both sides at once, the scale stays level at the true x, and the move and its result are written; an uneven split is refused

**Given** any step he hasn't done before (the slider, writing x, the check line, the pin, the tray, keeping x alone, the splitter)
**Then** one short tag tells him the step, goes when he does it, and comes back after 60 s idle

**Given** the pieces
**Then** gears show `x`, the slider shows `x = 9`, every minus is a bobbing balloon, the pin is a flag, and the direction pin asks whether the scale tilts lijevo or desno

### Story 1.16: One x, a goal and a hint button

As Luka's son,
I want one x I can trust, a picture of what I'm aiming for and a button that shows me the next step,
So that I can solve room 4 by simplifying, not by guessing, and never get stuck.

**Covers:** Luka's play of room 4 (2026-11-06); the GDD's Balance and Player Assistance. Full criteria are in `_bmad-output/implementation-artifacts/1-16-one-x-a-goal-and-a-hint-button.md`.

**Acceptance Criteria:**

**Given** any line or Balance move
**Then** the pans are weighed at the slider's x, so simplifying at a wrong x stays out of balance

**Given** room 4 (Balance only, no pin)
**When** he answers `x = 9` before a line with x alone
**Then** it is refused with "Prvo pojednostavi vagu."; once x is alone, `x = ☐` and the check template appear as blanks

**Given** the hint button
**When** he presses it once, then again
**Then** it shows the current step's tag, then the exact next move as a ghost or a pulsing line

## Epic 2: The city

Turn separate rooms into a world he wants to return to. **Stories are detailed with this workflow before the epic starts.** From the GDD:

1. The map shows connected nodes and restored or grey states, and leaving a room keeps its lines.
2. Gates open from tools earned and rooms completed, and locked rooms stay visible.
3. Progress saves automatically and can be restored by backup link, with a loading screen.
4. After room 1, someone asks who he is, and he names his character and picks a look.
5. The hint ladder triggers on inactivity or repeated jams.
6. Rooms 5–7 play, including acting out the wrong line in the old logbook, which reveals Kristijan's planted signal; their line-checker rows are added.
7. The play log records sessions, ways used, predictions and wrong lines on the device.
8. The art style guide sets the palette, line weight, lighting and prompt template, with test images from fal.ai.

## Epic 3: Automaton fights

Give him a reason to practise that is decided by maths, not by a quiz. **Stories are detailed before the epic starts.** From the GDD:

1. A round rolls dice, and he places them and commits blows without seeing the total.
2. A strike resolves armour, clean cuts and the automaton's dent.
3. Winning pays parts and winds the automaton down, and losing drops a recoverable pile.
4. The first win in the armour 30, 45 and 60 lairs returns a torn page to his notebook.
5. Upgrades change the fight's limits.
6. Right predictions in rooms pay parts, once per stage.

## Epic 4: The whole district

Finish the solo game through the line reveal. **Stories are detailed before the epic starts.** From the GDD:

1. The chain shows the equation as links, and he sets each inverse himself.
2. Running a link backward also acts on the pans and writes the undo line.
3. The chain handles `a − bx` forms, including the `135 − ☐` link.
4. The story room builds pans from a story and matches pans to a story.
5. One machine's answer becomes a weight in the next.
6. The drum plots dots and the level line, and the reveal follows.
7. Rooms 8–13 play, with their map changes, gates, hints, cards, story lines and line-checker rows.

## Epic 5: Rooms for friends

Make the pride of "my friend couldn't crack it" possible without a server. **Stories are detailed before the epic starts.** From the GDD:

1. He builds a machine from pieces, paid for with parts when he sends it.
2. He adds blinds and a planted mistake.
3. He links up to 3 machines.
4. He must solve and write the room before the link appears.
5. A friend opens the link and plays, with a short intro if new.
6. A friend who gives up sees his solution.
7. The reply link stamps the room.

## Epic 6: Ready for the surprise

Make it hold up against Zelda on first contact. **Stories are detailed before the epic starts.** From the GDD:

1. Machines and the map take on the final look.
2. Each restart adds colour, motion and a sound loop.
3. All text is final in Croatian and avoids gendered verb forms.
4. Links and saving work on all three device types, and the game is deployed.
5. The line-checker table is complete for all 13 rooms.
6. The paper test is ready, and none of its equations appear in a room.

## Validation

| Check | Result |
|---|---|
| Every FR and NFR maps to an epic | Pass (both coverage maps) |
| Epic 1's FRs are covered by its stories | Pass: FR1–FR11 and FR14–FR19 in 1.4–1.11; FR20–FR22, FR25, FR26, FR33 and FR35 in part, as mapped |
| Starter setup is epic 1's first story | Pass: 1.1, scaffolding by hand (no template) |
| No forward dependencies in epic 1 | Pass: 1.5 uses a test fixture for the division step; 1.7 introduces `locked`; 1.8 adds arrival, restart and room order; rooms join in 1.8–1.11 |
| Stories sized for one dev agent | Pass: checker, notebook, machine, tray, splitter and quality are separate stories |
| Entities created when first needed | Pass: the store in 1.4, the dev panel in 1.8, `steps.ts` in 1.3, saving in epic 2 |
| Epics give user value, not layers | Pass: as in the GDD |

## Calls Open to Veto

- **Only epic 1 is broken down now.** Epics 2–6 are detailed before each one starts, because playing epic 1 may change them.
- **Epic 1 has 16 stories**: 13 splitting the GDD's 8, so each fits one developer session, plus 1.14–1.16 from the first playtests.
- **Acting out shows `?` on the gears** and never moves the dial, so a written line can't reveal x.
- **The tray holds weights and floats only**, numbered 1–99, and numbers on a pan combine after each drop, so `2x + 5 = 23` becomes `2x = 18` in two drops.
- **Reset restarts the current stage**, not the whole room (GDD updated).
- **Room 3's second stage gets a direction pin** ("which way does the pan move as x grows?") instead of a second "where it levels" pin, because both stages solve to 14 (GDD room table and decision log updated).
- **Reset with a locked pin returns to the open stage**, so he is never stuck with a short dial and no pin.
- **The splitter combines each pan's numbers before dividing**, so a correct `2x = 23 − 5` never jams.
- **The paper-test rule compares equations, not numbers** (GDD updated).
- **Quality thresholds** of 18 ms and 25 ms at the 95th percentile.
- **Hints are not logged**, following the GDD's "free and never recorded".
- **The style guide is in epic 2**, with test images from fal.ai.
