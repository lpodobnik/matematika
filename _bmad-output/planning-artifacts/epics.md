---
stepsCompleted: [1, 2, 3, 4]
status: 'epic 1 ready for development'
mode: 'decide-and-flag: Claude made the calls; each is open to Luka''s veto (see Calls Open to Veto)'
inputDocuments:
  - '_bmad-output/planning-artifacts/gdds/gdd-matematika-2026-11-05/gdd.md'
  - '_bmad-output/planning-artifacts/gdds/gdd-matematika-2026-11-05/epics.md'
  - '_bmad-output/game-architecture.md'
  - '_bmad-output/narrative-design.md'
---

# matematika - Epic Breakdown

## Overview

This document breaks the GDD and the architecture into stories. **Epic 1 is broken down in full**, with acceptance criteria. Epics 2–6 keep the GDD's epic structure and story list, and are detailed with this workflow before each one starts, because epic 1 tests the design's biggest bet and its result can change them. There is no UX design document; interaction rules come from the GDD's Controls and Input section and the architecture's consistency rules.

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
- FR22: 13 rooms with the equations, dial ranges, poke windows, pins and finishing ways in the GDD's Puzzle Progression tables.
- FR23: Linked machines: up to 3 machines, where one machine's answer becomes a weight in the next.
- FR24: The recording drum draws a dot for each x tried, with the right-hand side as a level line; he pins the next dot; room 13 ends with the line reveal and "linearna" from "linija".
- FR25: Solving a room restarts something visible on the map.
- FR26: Rooms can't be lost; every room can be reset or left at any time.

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

From the architecture (`_bmad-output/game-architecture.md`):

- **No starter template.** Epic 1's first story scaffolds by hand: Vite 8.3.6, React 19.3.1, TypeScript 7.0.2, PixiJS 8.22.0 with `@pixi/react` 8.0.5, Zustand, Immer, Motion, Biome, Vitest, exact versions.
- **Pure core.** Game logic lives in pure folders (`math`, `room`, `fight`, `city`, `economy`, `workshop`, `links`, `playlog`), enforced by `src/architecture.test.ts`.
- **One store.** A pure root reducer with `ctx` (time, randomness) returns state and domain events; effects (save, audio, play log) listen to events.
- **One equation model** (Pattern 1): AST, exact rationals, solution-based checker, progress tuple, move classification, acting out at the stage's true solution.
- **Room engine** (Pattern 2): `RoomSpec` data, stages, phases, room-type strategies.
- **Content tests** for every room: whole-number solution, GDD dial and fading tables, every listed way can finish, no paper-test equations.
- **Scene:** a 1600 × 1000 logical scene; per-frame values through refs; WebGL context loss handled; a quality setting.
- **Links** in the URL fragment, versioned and decodable forever (Pattern 3).
- **Saving** in `localStorage` with versioned migrations; persistent-storage request.
- **CI** on every push; deployment, PWA and e2e come in epic 6.
- **Art:** skins separate from logic; images through `art-src/` and `scripts/build-art.ts`; an art style guide in epic 2.

### UX Design Requirements

No UX design document. The interaction requirements are FR15 and NFR4, plus the architecture's consistency rules (input, gesture sizes, OS keyboard, text in the scene).

### FR Coverage Map

| FR | Epic | Note |
|---|---|---|
| FR1–FR5 | 1 | |
| FR6, FR7 | 1, 3 | Pin in 1; parts paid in 3 |
| FR8 | 1, 4 | Room 4 in 1; rooms 8 and 11 in 4 |
| FR9–FR11 | 1 | |
| FR12, FR13 | 4 | |
| FR14–FR19 | 1 | |
| FR20 | 1, 2, 4 | Try values and Balance's first stage in 1; Balance's later stages in 2; Undo in 4 |
| FR21 | 1, 2, 4 | Solve and predict in 1; compare, predict and mistake in 2; story in 4 |
| FR22 | 1, 2, 4 | Rooms 1–4, 5–7, 8–13 |
| FR23, FR24 | 4 | |
| FR25 | 1, 2, 6 | Restart animation in 1; map change in 2; final look in 6 |
| FR26 | 1, 2 | Reset in 1; leaving to the map in 2 |
| FR27–FR32 | 2 | Lair nodes appear in 2; fights in 3 |
| FR33–FR37 | 2 | FR35 holds from epic 1 |
| FR38–FR43 | 3 | |
| FR44–FR51 | 5 | |
| FR52 | 2, 3 | Lines in 2; fights in 3 |
| FR53, FR54 | 2 | Fights and rooms built join the log in 3 and 5 |
| FR55 | 6 | Mute from 2 |

## Epic List

### Epic 1: First machine
He can play rooms 1–4 on the tablet, one after another: poke the scale, predict, balance, and write the lines that start each machine.
**FRs covered:** FR1–FR11, FR14–FR19, FR20–FR22 (part), FR25 (part), FR26 (part), FR35.

### Epic 2: The city
Rooms 1–7 sit on a map he can return to, with saving, story, his character, hints and explanation cards.
**FRs covered:** FR20–FR22 (part), FR25–FR37, FR52–FR54.

### Epic 3: Automaton fights
He can hunt automatons in four lairs for parts and buy upgrades.
**FRs covered:** FR7 (parts), FR38–FR43, FR52 (fights).

### Epic 4: The whole district
All 13 rooms, with the gear chain, linked machines and the recording drum, ending in the line reveal.
**FRs covered:** FR8 (part), FR12, FR13, FR20–FR22 (part), FR23, FR24.

### Epic 5: Rooms for friends
He builds a room, solves it, sends it as a link, and sees whether his friend cracked it.
**FRs covered:** FR44–FR51.

### Epic 6: Ready for the surprise
The finished MVP: final art and sound, Croatian text, deployment and testing on all devices.
**FRs covered:** FR25 (look), FR55; NFR3, NFR5–NFR7, NFR10, NFR12.

**Order:** 1 → 2 → 3 and 4 in either order → 5 → 6, as in the GDD.

## Epic 1: First machine

Prove on the tablet that the machine is fun to poke and that writing feels like the final move, not a chore. Out of scope: map, saving, parts and final art.

### Story 1.1: Set up the project

As Luka,
I want the empty game running in Chrome on the tablet and checked on every push,
So that every later story lands on a working base whose rules are enforced.

**Covers:** architecture setup, boundaries and CI; NFR5, NFR6.

**Acceptance Criteria:**

**Given** a fresh clone
**When** `npm ci` and `npm run dev -- --host` run on the PC
**Then** the game opens at `http://<PC IP>:5173` in Chrome on the Android tablet, showing an empty 1600 × 1000 logical scene scaled to fit, with a placeholder notebook area beside it
**And** `package.json` pins the architecture's versions exactly, with `"type": "module"` and `"private": true`, and `.npmrc` has `save-exact=true`

**Given** the tablet in portrait
**When** the game is open
**Then** an overlay asks to turn it, with its text from `src/content/text/hr.ts`, and disappears in landscape

**Given** the project
**When** `npm run check`, `tsc --noEmit`, `npm test` and `npm run build` run
**Then** all pass, and GitHub Actions runs them on every push (deployment comes in epic 6)

**Given** `src/architecture.test.ts`
**When** a file in a pure folder imports `react`, `pixi.js`, `zustand`, `motion`, `ui/`, `store/`, `save/` or `audio/`, or a file in `ui/` or `app/` contains č, ć, đ, š or ž
**Then** the test fails, shown by fixtures inside the test

**Given** the WebGL context is lost and restored (forced with the `WEBGL_lose_context` extension)
**When** it is restored
**Then** the scene remounts without a page reload

### Story 1.2: Read, solve and write equations

As Luka,
I want equations parsed, solved exactly and written in school notation,
So that the scale, notebook and checker all work from one model.

**Covers:** basis for FR16 and NFR11; NFR9 (notation); architecture Pattern 1 (`tokens`, `parse`, `expr`, `rational`, `linear`, `format`).

**Acceptance Criteria:**

**Given** number-pad tokens or a string in school notation
**When** it is parsed
**Then** the result is an `Equation`, or `{ ok: false, reason }` for anything incomplete, and nothing throws
**And** `2x + 7 = 25`, `x : 3 = 5`, `20 − x = 6`, `2 · 9 + 7 = 25` and `5 905 − 27x = 316` parse, while `2x + = 25`, `= 9`, `x =` and `−x = 14` don't

**Given** a parsed equation
**When** it is read
**Then** `3x` and `3 · x` are both multiplication, `:` is division, brackets group and spaces are ignored

**Given** a side of an equation
**When** `toLinear` runs
**Then** it returns an exact `a·x + b` with reduced fractions, or `nonlinear` for `x · x` and `18 : x`

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

**Covers:** FR16–FR19 (judging); NFR11; architecture Pattern 1 (`check`, `moves`, progress tuple).

**Acceptance Criteria:**

**Given** a stage equation and its committed lines
**When** a line is checked
**Then** the verdict is `incomplete`, `nonlinear`, `aside`, `wrong`, `valid` (with `move` and `progress`), `answer` or `check`, by the architecture's checker rules

**Given** the stage `2x + 7 = 25`
**When** lines are checked
**Then** `2x = 18`, `2x = 25 − 7`, `x = 18 : 2` and `x = 9` (a skipped step) are accepted
**And** `2x = 32`, `x = 16` and `2 + x = 25` are wrong
**And** `2x + 8 = 26` is valid with `progress: false`

**Given** the answer line `x = 9` has been written
**When** the next line is checked
**Then** `2 · 9 + 7 = 25` is `check`, `25 = 25` is `aside` and `2 · 8 + 7 = 25` is `wrong`
**And** a check line written before the answer line is not accepted as `check`

**Given** the chain `2x + 7 = 25` → `2x = 25 − 7` → `2x = 18` → `x = 18 : 2` → `x = 9`
**When** progress is measured with the tuple (terms on the x side, coefficient not 1, operators on the number side)
**Then** every step makes progress

**Given** pairs of consecutive lines
**When** `moves` classifies them
**Then** it returns `add-both`, `split-both`, `move-across`, `evaluate`, `swap`, `compound` and `none` for the architecture's examples

**Given** `src/math/lines.table.test.ts`
**When** tests run
**Then** it holds accepted and rejected lines, with expected verdicts, for rooms 1–4 including both stages of rooms 2 and 3

**Given** random equations (fast-check)
**When** a solution-preserving step is applied (the same number added to both sides, both sides multiplied by a whole number other than 0, a side evaluated)
**Then** the line is accepted, and changing one number on one side only is rejected

### Story 1.4: Show an equation on the scale

As the player,
I want the stage's equation to appear as pieces on two pans that tip toward the heavier side,
So that I can see whether the two sides are equal.

**Covers:** FR1–FR3; NFR4 (number size, not colour alone); architecture store, `RoomSpec`, `ui/scene/scale/`.

**Acceptance Criteria:**

**Given** the store skeleton (one Zustand store, a pure root reducer taking `ctx`, domain events, an empty effects registry) and `src/content/rooms/r01-door-lift.ts`
**When** room 1 loads
**Then** the left pan shows one x-gear and a weight of 4, and the right pan a weight of 9

**Given** any equation
**When** its pieces are derived
**Then** a number is a weight, a subtracted number a float, `kx` is k x-gears (one large gear showing the count above 12), `−kx` is springs and `x : n` is a reducer under an x-gear
**And** a weight and a float of the same number on one pan, or a gear and a spring, cancel and vanish

**Given** a value for x
**When** the pans are drawn
**Then** the tilt is `tuning.tiltPerUnit` (1°) times the difference between the sides, clamped to `tuning.tiltMax` (15°) and scaled per room, animated as a spring

**Given** the tablet
**When** pieces render
**Then** numbers on weights are at least 20 CSS px, and which side is heavier shows by position, not by colour alone

**Given** `RoomSpec` content
**When** content tests run
**Then** room 1's equation parses and has one whole-number solution
**And** no game state is stored in Pixi objects; skins are placeholders

### Story 1.5: Drag x

As the player,
I want to drag a dial that changes x one notch at a time,
So that I see each notch move the pans by the same amount.

**Covers:** FR4, FR5, FR9 (levelling); NFR1, NFR2, NFR4.

**Acceptance Criteria:**

**Given** room 1
**When** he drags the dial
**Then** x changes by one notch per 24 CSS px within 0–10, with a tick mark on each notch, and the x-gears show the current value

**Given** a drag in progress
**When** the finger moves
**Then** the knob follows every frame through a ref, and the store updates only when the notch changes (`dial/set`)

**Given** a stage with readouts
**When** he drags
**Then** both sides' values show; a stage with `readouts: false` hides them

**Given** the sides become equal
**When** the notch lands
**Then** the pans level and a `PansLevel` event fires
**And** every notch changes the difference between the sides by the same amount

**Given** a division form (room 2's second stage)
**When** he drags
**Then** the dial steps in 3s over 0–30

**Given** the dial
**When** it reaches either end of its range
**Then** it stops there
**And** its hit area is at least 48 CSS px, and dragging with a mouse behaves the same, with no hover states

### Story 1.6: Write in the notebook

As the player,
I want a notebook with a number pad beside the scale,
So that I can write lines the way I do at school without the tablet's keyboard popping up.

**Covers:** FR15; NFR4 (phone layout), NFR9.

**Acceptance Criteria:**

**Given** the tablet in landscape
**When** a room is open
**Then** the notebook sits beside the scale
**And** on a phone in landscape (under 500 CSS px tall) it slides over the scale and can be pushed aside

**Given** the number pad
**When** he taps its keys
**Then** digits, `x`, `+`, `−`, `·`, `:`, `=`, `(`, `)`, delete and enter edit the draft line, each key at least 48 CSS px
**And** the notebook is not an `<input>`, so the OS keyboard never opens

**Given** a computer
**When** he types `0`–`9`, `x`, `+`, `-`, `*`, `/`, `:`, `=`, brackets, Backspace or Enter
**Then** they work like the pad, with `*` → `·`, `/` → `:` and `-` → `−`

**Given** a draft line
**When** he types
**Then** it shows in school notation (`5905` shows as `5 905`)

**Given** a draft line
**When** he presses enter
**Then** it is judged (story 1.3): an `incomplete`, `nonlinear` or `aside` line wiggles and stays in the draft, and any other line is appended to the notebook
**And** appended lines are read-only

### Story 1.7: Make written lines drive the machine

As the player,
I want each correct line to move the machine and a wrong one to jam it,
So that writing is what starts the machine.

**Covers:** FR17–FR19, FR20 (Try values blanks); NFR13; architecture "acting out".

**Acceptance Criteria:**

**Given** an appended line that is valid with progress
**When** it is committed
**Then** the pans take the line's layout, animated by its `Move`, and stay level (both sides evaluated at the stage's solution)
**And** one stage of the machine engages, and `LineAccepted` fires

**Given** a valid line without progress (`2x + 8 = 26`)
**When** it is committed
**Then** it is accepted and the machine doesn't move

**Given** a wrong line
**When** it is appended
**Then** the pans take its layout evaluated at the stage's solution, tip by the tilt rule, and the machine jams (`MachineJammed`)
**And** nothing else can be written until he edits or deletes that line, which becomes editable
**And** `jamsInARow` counts consecutive jams and resets on a committed line

**Given** the answer line and then the check line
**When** both are committed
**Then** the machine locks (`StageLocked`), and nothing but the machine shows success: no stars, scores or "correct" screen

**Given** a stage whose Try values fading is `blanks`
**When** the notebook opens
**Then** it offers `x = ☐` and the check line with blanks for x (`☐ + 4 = 9`), filled with the pad
**And** in `blank` mode the notebook shows an empty line

**Given** a stage whose solution is beyond the dial's range
**When** a line is acted out
**Then** the dial shows the value past its end rather than clamping it

### Story 1.8: Play a room from arrival to restart

As the player,
I want each room to run from a stopped machine to watching it restart, then move on,
So that rooms 1 and 2 play one after another.

**Covers:** FR22 (rooms 1–2), FR25 (restart animation), FR26 (reset), FR35; architecture Pattern 2.

**Acceptance Criteria:**

**Given** `r01` and `r02` in `src/content/rooms/index.ts`
**When** a room starts
**Then** it runs `arrive → open → locked → restart → done`, with no instruction screen before it (poke and pin come in 1.9)

**Given** room 2
**When** its first stage `3x = 12` (dial 0–10) locks
**Then** its second stage `x : 3 = 5` (dial 0–30 in 3s) arrives

**Given** the last stage locks
**When** the restart plays
**Then** a placeholder animation shows the machine running (the door lifts, the lamps light), ending on `presentation/done` or a timeout fallback

**Given** any phase
**When** he taps reset
**Then** the stage returns to its first line and the dial to its start

**Given** a room is done
**When** its restart ends
**Then** the next room in `content/rooms/index.ts` loads

**Given** a development build with `?dev` or the backtick key
**When** the dev panel opens
**Then** it jumps to any room and stage and shows the last verdict and progress tuple

### Story 1.9: Predict before the dial opens

As the player,
I want to poke a few notches, then pin where I think the pans will level before the full dial opens,
So that I commit to an idea and see what it causes.

**Covers:** FR6, FR7 (without parts), FR21 (predict), FR22 (room 3).

**Acceptance Criteria:**

**Given** a stage with `pokeNotches: 4`
**When** it opens
**Then** the dial moves only over its first 4 notches (`poke` phase)

**Given** the poke phase
**When** he drags the pin onto the machine, optionally drags it again, and confirms
**Then** the pin locks (`pin` → `open`) and the full dial range opens

**Given** a locked pin
**When** the result is known (the pans level, or the machine locks)
**Then** a right pin shows as right on the machine and `PredictionMade` fires with `right: true`
**And** a wrong pin shows what its value does to the pans, with no penalty; parts are paid from epic 3

**Given** a resolved pin
**When** he resets the stage
**Then** the pin doesn't reopen

**Given** room 3 (`x − 6 = 8`, dial 6–20, poke 4; then `20 − x = 6`, dial 0–20)
**When** he plays the second stage
**Then** x is a spring, so raising x lifts its pan and the pans move the other way

**Given** room 3 is done
**When** it restarts
**Then** Balance is earned, held in memory until saving arrives in epic 2

### Story 1.10: Balance the pans

As the player,
I want to take the same piece off both pans, or split both into equal parts,
So that I can solve a room the dial can't reach.

**Covers:** FR8 (room 4), FR10, FR11, FR14, FR20 (Balance first stage), FR22 (room 4).

**Acceptance Criteria:**

**Given** Balance is earned
**When** a room opens
**Then** a tray of spare pieces appears; he sets a spare piece's number and drags it onto a pan, or drags a piece off a pan into the tray

**Given** a change to one pan only
**When** it is made
**Then** the scale tips and nothing is written
**And** once both pans have had the same change, the pans' equation is equivalent again

**Given** the splitter set to n parts (2–9)
**When** he drags it across both pans
**Then** every piece count on both pans is divided by n
**And** a split that doesn't divide evenly jams

**Given** Balance fading `auto`
**When** a balanced move completes
**Then** its line appears in the notebook, except `x = n` and the check line, which he writes

**Given** exploratory moves
**When** he undoes the last move or resets
**Then** the pans go back, and writing a line replaces the exploratory layout with the line's

**Given** room 4 (`2x + 5 = 23`, dial 0–6, poke 4, pin beyond the dial)
**When** he plays it
**Then** the pin can be set beyond the dial's end, only Balance can finish the room, and Try values is a blank page

### Story 1.11: Play rooms 1–4 on the tablet

As Luka,
I want rooms 1–4 to play back to back on the tablet at 60 FPS with an effect running,
So that the design's biggest bet, writing as the final move, can be tried for real.

**Covers:** NFR1, NFR2; epic 1's playable result; architecture content tests, quality setting, profiling.

**Acceptance Criteria:**

**Given** a fresh start without the dev panel
**When** he plays
**Then** rooms 1–4 run in order, each from arrival to restart

**Given** `src/math/steps.ts`
**When** asked for the next step of a stage by a way
**Then** it returns the canonical next line for Try values and Balance

**Given** content tests
**When** they run
**Then** for rooms 1–4 each equation parses with one whole-number solution; dial ranges, poke windows, pins and fading match the GDD tables; every listed finishing way can finish under the room's limits, using `steps.ts`
**And** no equation from `src/content/paper-test.ts` (seeded with the brief's paper test) appears in any room

**Given** a placeholder steam effect on the machine
**When** the game starts for the first time
**Then** a short frame-time test picks a quality setting (`high`, `medium`, `low`), and lower settings switch the effect off in the fixed order

**Given** his tablet, profiled through `chrome://inspect`
**When** he drags the dial in room 4 with the effect on
**Then** it holds 60 FPS, the knob follows the finger within one frame, and the results are recorded in the story file

**Given** the line-checker table
**When** tests run
**Then** it covers every accepted and rejected line used while playing rooms 1–4

## Epic 2: The city

Turn separate rooms into a world he wants to return to. **Stories are detailed with this workflow before the epic starts.** From the GDD:

1. The map shows connected nodes and restored or grey states.
2. Gates open from tools earned and rooms completed, and locked rooms stay visible.
3. Progress saves automatically and can be restored by backup link.
4. After room 1, someone asks who he is, and he names his character and picks a look.
5. The hint ladder triggers on inactivity or repeated jams.
6. Rooms 5–7 play, including acting out the wrong line in the old logbook, which reveals Kristijan's planted signal.
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
7. Rooms 8–13 play.

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
4. Links and saving work on all three device types.
5. The paper test is ready, and none of its numbers appear in a room.

## Validation

| Check | Result |
|---|---|
| Every FR maps to an epic | Pass (coverage map) |
| Epic 1's FRs are covered by its stories | Pass: FR1–FR11 and FR14–FR19 in 1.4–1.10; FR20–FR22, FR25, FR26 and FR35 in part, as mapped |
| Starter setup is epic 1's first story | Pass: 1.1, scaffolding by hand (no template) |
| No forward dependencies in epic 1 | Pass: each story uses only earlier ones |
| Stories sized for one dev agent | Pass: 1.2–1.3 and 1.6–1.7 split the notebook and checker work |
| Entities created when first needed | Pass: the store in 1.4, the dev panel in 1.8, `steps.ts` in 1.11, saving in epic 2 |
| Epics give user value, not layers | Pass: as in the GDD |

## Calls Open to Veto

- **Only epic 1 is broken down now.** Epics 2–6 are detailed before each one starts, because playing epic 1 may change them.
- **Epic 1 has 11 stories**, splitting the GDD's 8: the equation model and the line checker each get their own story, before any UI.
- **Hints are not logged**, following the GDD's "free and never recorded". The architecture's play log had them, and is now fixed.
- **The style guide moves into epic 2's story list**, with test images from fal.ai.
