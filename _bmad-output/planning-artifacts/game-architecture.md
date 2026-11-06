---
title: 'Game Architecture'
project: 'matematika (working title)'
date: '2026-11-05'
author: 'Luka'
version: '1.0'
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
status: 'complete'
mode: 'decide-and-flag: Claude made the technical calls; each is open to Luka''s veto (see ADRs)'
versionsVerified: '2026-11-05, npm registry'

# Source Documents
gdd: '_bmad-output/planning-artifacts/gdds/gdd-matematika-2026-11-05/gdd.md'
epics: '_bmad-output/planning-artifacts/epics.md'
brief: '_bmad-output/planning-artifacts/briefs/brief-matematika-2026-11-05/brief.md'
narrative: '_bmad-output/narrative-design.md'
---

# Game Architecture: matematika (working title)

## Executive Summary

A static web app in **TypeScript 7 + React 19**, with no server. Machines, the map and fights render in **WebGL through PixiJS 8** (declared as React components with `@pixi/react`), so the art can use shaders, particles and glow. The notebook, number pad and cards stay in HTML. Pure TypeScript modules hold the game logic, and a single Zustand store wraps them. The UI is a thin layer that renders state and turns gestures into actions. The core is one **equation model**: the pans, the notebook, the gear chain and the recording drum all render it, and one checker based on exact rational solutions judges every line. Room links, reply links and backup links carry everything in the URL fragment, so hosting stays plain static files.

**How this document was made.** The workflow ran in decide-and-flag mode, at Luka's request, to avoid approval prompts. Every technical call is Claude's and open to veto. The calls most worth a look are ADR-1 (the renderer, revised after Luka put graphics before load time), ADR-6 (what the backup link holds) and ADR-10 (hosting).

---

## Project Context

### Game Overview

A 2D exploration puzzle game in Croatian for one 5th grader, played first on his Android tablet. Tools are maths ideas; the MVP is one district with one tool, the scale with draggable x, for linear equations. Writing the solution line by line is what starts each machine. He fights automatons for parts and builds rooms for friends, which travel as links.

### Technical Scope

| Item | Value |
|---|---|
| Platform | Web browser. Android tablet in landscape first; phone in landscape and computer also work; links must open on iPad and iPhone |
| Genre | Puzzle, with metroidvania-style gating on a node map |
| Rendering | 2D in WebGL; graphics take priority over load time (Luka). No artist: art is drawn in code and shaders, plus AI-generated or bought images (Luka) |
| Realtime | None. Turn-based, no physics, no networking |
| Project level | Medium: about 60–76 hours of AI-assisted build across 6 epics |

### Core Systems

| System | Complexity | GDD reference |
|---|---|---|
| Equation model, parser and line checker | High | Notebook; Success Metrics (test table) |
| Scale: pans, piece kit, tilt, dial, poke window, pin | Medium | The scale with draggable x |
| Balance moves: tray, splitter | Medium | Three ways to solve |
| Gear chain (undo), moving with the pans | High | Gear chain |
| Fading: lines that appear, blanks, blank page | Medium | Fading |
| Room engine: stages, room types, linked machines, drum | High | Puzzle Progression; Room types |
| Hint ladder and explanation cards | Low | Player Assistance |
| City map, gates, return trips, softlock rules | Low | Level Structure |
| Automaton fights, parts, piles, upgrades | Medium | Automaton fights |
| Room builder, costs, blinds, planted mistakes | Medium | Room builder |
| Room, reply and backup links | Medium | Room builder; Platform-Specific Details |
| Saving, migrations, play log, Luka's view | Medium | Platform-Specific Details |
| Audio: synthesised effects, layered machine loops | Low | Audio and Music |
| Croatian text and school notation | Low | Language |

### Technical Requirements

| Requirement | Target |
|---|---|
| Frame rate | 60 FPS while dragging the dial, in a three-machine room, on his tablet |
| First load | A loading screen with progress; under about 15 s on home Wi-Fi with an empty cache; later launches load from the device |
| Download | No hard cap, because graphics come first; soft budget 30 MB |
| Touch | Dial and pans follow the finger within one frame; targets at least 48 px; no hover states |
| Delivery | Static files, no installation, accounts or server |
| Saving | Automatic, on the device, after every written line and every fight; backup link |
| Room links | At most 2,000 characters, no data about the sender |
| Privacy | No analytics or tracking; nothing personal leaves the device; the character's name is never in a link |
| Language | Croatian only, all text in one place; `·`, `:`, space as the thousands separator |

### Complexity Drivers

- **High: the line checker.** It must accept every correct line, including skipped steps, and reject every wrong one, for all 13 rooms and any room a child builds.
- **High: one state, four views.** The pans, notebook, gear chain and drum must never disagree.
- **Novel: writing drives the machine.** A correct line acts itself out on the pans, and a wrong one is acted out and jams.
- **Novel: rooms as links.** A whole room, its blinds and the builder's solution travel in a URL that must survive messaging apps, and stay decodable for as long as the links sit in chat histories.

### Technical Risks

| Risk | Mitigation |
|---|---|
| A correct line gets rejected, which feels unfair to a child | The checker judges by exact solution, not by pattern; per-room test table; property tests |
| Browser data is cleared and progress is lost | Persistent-storage request; backup link; PWA install in epic 6 |
| iOS Safari deletes site storage after 7 days without a visit (friends' devices) | Backup link; prompt to add the game to the home screen on iOS. Friends' rooms need no save |
| Effects (filters, particles) too heavy for a mid-range Android tablet | A quality setting chosen at start-up, effects that switch off one by one, and a profile on the tablet in epic 1 |
| The tablet drops the WebGL context when the app is in the background | State lives in the store, so the scene rebuilds on `webglcontextrestored` with nothing lost |
| Changing the hosting origin wipes saves (storage is per origin) | Origin fixed before handover; backup link is the migration path |
| TypeScript 7 is a recent major (native compiler) | Only `tsc --noEmit` depends on it; fallback is TypeScript 6.0 |

---

## Engine & Framework

### Selected Stack

**PixiJS 8.22.0 (WebGL) for the scene, React 19.3.1 for everything, TypeScript 7.0.2, built with Vite 8.3.6.**

**Rationale.** Graphics come before load time, so the scene needs a GPU renderer: shaders for ink on paper and brass, particles for steam, glow when a machine restarts, and many moving parts at 60 FPS. PixiJS 8 provides that, and `@pixi/react` 8.0.5 lets Pixi objects be written as React components, so the scene, the HTML interface and the store share one model. The notebook, number pad, cards and dialogs stay in HTML, where Croatian text, layout and the on-screen keys are simplest.

| Option | Why not |
|---|---|
| SVG only (the first draft of this document) | Filters, particles and shaders are slow or unavailable on mobile, which caps how good it can look |
| Phaser 4.2.1 | Scenes, physics and a loader the game doesn't use, alongside its own state model; Pixi fits under React and the store |
| Godot 4 | The richest 2D tools, but a web export of tens of MB with known iOS Safari issues, which matter for friends' devices; scene files are hard for an AI to edit and check without the editor |
| Unity | Heavier still, with the same iOS issues |

The graphics ceiling is set by the art more than the renderer. Luka chose code-drawn art and shaders plus AI-generated or bought images, and Pixi handles both on the same scene.

### Project Initialization

Scaffold by hand, in story 1.1, from the Project Structure section; the interactive `create-vite` prompts don't suit an AI agent. The exact commands are under Development Environment.

### Provided by the Stack

| Component | Solution | Provided by |
|---|---|---|
| Rendering | WebGL scene for machines, map and fights; HTML and CSS for the notebook, number pad, cards and dialogs, layered over the canvas | PixiJS, `@pixi/react`; browser |
| Effects | Filters (glow, bloom, displacement), custom shaders, particle containers, blend modes | PixiJS, `pixi-filters` 6.1.5 |
| Physics | None needed. Tilt is a computed angle animated with a spring | Motion |
| Animation | Continuous motion (gears, steam, loops) on the Pixi ticker; springs and tweens for discrete changes; HTML transitions | PixiJS `useTick`; Motion 14.9.1 |
| Assets | Texture loading with progress, atlases, WebP | PixiJS `Assets` |
| Input | Pixi pointer events in the scene, Pointer Events in HTML; one code path for touch and mouse | PixiJS; browser |
| Audio | Web Audio API, synthesised | Browser |
| Scenes | A `screen` field in the store; no router | App code |
| Build | Vite 8 dev server and production build | Vite |
| Tests | Vitest 5 for logic; Playwright for flows on device profiles | Vitest, Playwright |

### Decisions Still Needed After the Stack

State management, persistence, link format, the equation model, room data, audio scheduling, hosting and PWA. All are made below.

---

## Decision Summary

| Category | Decision | Version | Affects epics | Rationale |
|---|---|---|---|---|
| Language | TypeScript, strict | 7.0.2 | All | Types keep AI-written code consistent |
| UI | React | 19.3.1 | All | The most consistently known UI model for agents |
| Build | Vite with `@vitejs/plugin-react` | 8.3.6, 6.2.1 | All | Fast dev server, static output |
| Rendering | PixiJS (WebGL) through `@pixi/react` for the scene; HTML for notebook, keys and cards | 8.22.0, 8.0.5 | All | Graphics first; one React model |
| Effects | `pixi-filters` plus own shaders in `src/art/shaders/` | 6.1.5 | 1, 6 | Ink, paper, brass, glow, steam |
| Images | AI-generated or bought PNGs in `art-src/`, converted to WebP at 1× and 2× by `scripts/build-art.ts` with sharp | 0.35.5 | 2, 6 | Luka allowed images; a small script instead of an atlas packer, since only backdrops and characters are images |
| Animation | Pixi ticker for continuous motion; Motion for springs, tweens and HTML transitions | 14.9.1 | 1, 4, 6 | Springs without hand-written physics |
| State | One Zustand store; pure reducers written with Immer; domain events | 5.0.16, 11.2.9 | All | Logic testable without React |
| Equation model | Own parser, AST, exact rationals, solution-based checker | n/a | 1, 4, 5 | Core novel system (Pattern 1) |
| Room data | Typed TypeScript data files, validated by tests | n/a | 1, 2, 4 | Content stays out of components |
| Persistence | `localStorage` JSON, versioned, with migrations; persistent-storage request | Browser | 2, 3, 5 | State is small, writes are synchronous |
| Links | URL fragment, versioned binary token encoding, base64url | n/a | 2, 5 | No server; nothing sent to the host (Pattern 3) |
| Backup | Progress without the name or play log, deflate, base64url in the fragment | Browser `CompressionStream` | 2 | Restores progress; GDD privacy rule |
| Audio | Web Audio API, synthesised, lookahead scheduler | Browser | 6 | No samples to license, tiny download |
| Text | One Croatian module, typed keys | n/a | 2, 6 | GDD: all text in one place |
| Lint and format | Biome | 2.6.5 | All | `typescript-eslint` does not support TypeScript above 6.0 |
| Unit tests | Vitest, fast-check for property tests | 5.1.0, 4.10.2 | All | Line-checker table, codecs, balance |
| E2E tests | Playwright, Android tablet, iPad, iPhone and desktop profiles | 1.65.0 | 5, 6 | Link flows from epic 5; the full device set in epic 6 |
| Offline and install | `vite-plugin-pwa`, update applied only on the map | 2.0.0 | 6 | Home-screen app, durable storage |
| Hosting | GitHub Pages from GitHub Actions; Cloudflare Pages if the repo stays private on a free plan | n/a | 6 | Static, free; the origin is fixed before handover |
| Runtime | Node | 26 (installed: 26.13.0) | All | Vite 8 needs 20.19+ or 22.12+ |

---

## Architectural Decisions

### State Management

One Zustand store holds the whole game. Every change goes through `dispatch(action)`, which calls a **pure root reducer**:

```ts
// src/store/types.ts
export interface Ctx { now: number; rng: Rng }
export type Reduce = (state: GameState, action: Action, ctx: Ctx) => { state: GameState; events: DomainEvent[] };
```

- `GameState` has four slices: `save` (everything persisted), `room` (the room in play), `fight` (the fight in play) and `ui` (screen and dialogs, never persisted).
- Reducers use Immer's `produce`. They never touch React, the DOM, storage, audio or `Date.now()`; time and randomness come in through `ctx`.
- Reducers return **domain events** such as `LineAccepted`, `MachineJammed` and `RoomRestarted`. Effects (saving, audio, play log) subscribe to events and never to raw state changes (Pattern 4).
- Components read with selectors (`useGame(s => s.room?.stage.dialX)`, or `useShallow` for several fields) and write only through `dispatch`.

### Data Persistence

| Key | Content | Written |
|---|---|---|
| `matematika:save` | `SaveV1`: progress, economy, workshop rooms, the room and fight in progress, settings, name and look | After every committed line, fight round, purchase, room built, stamp and settings change |
| `matematika:log` | Play log events, append-only, capped at 20,000 events, oldest dropped first | On every play-log event |
| `matematika:errors` | The last 50 caught errors | On error |

- Every save carries `v`. On load, migrations run in order (`migrations[1]` turns v1 into v2, and so on). A save from a newer version is never overwritten: the game loads it read-only and says so.
- Corrupt JSON is copied to `matematika:save:corrupt:<ISO time>` before a fresh save starts, so Luka can recover it by hand.
- On the first launch, `navigator.storage.persist()` asks the browser to keep the data.
- Inside a room, the stage's committed lines persist, so a reload resumes at the last written line. Exploratory moves (dial position, pieces moved but not written) are not saved.
- A fight in progress is saved after every strike, and a reload resumes it rather than counting as leaving (ADR-8).

### Links

Three link types, all in the URL fragment, which browsers never send to the server:

| Fragment | Link | Payload |
|---|---|---|
| `#s=<data>` | Room for a friend | Version byte, title id, 1–3 machines, blinds, optional planted-mistake lines, the builder's solution lines |
| `#r=<roomId>.<c or u>` | Reply | Hash of the room payload plus cracked or uncracked |
| `#b=<data>` | Backup | `SaveV1` without the character's name, deflate-raw, base64url |
| `#dnevnik` | Luka's view | None; linked from nowhere in the game |

The encoding is in Pattern 3.

### Asset Management

- **Art lives behind skins.** Machines, pieces, the map and automatons are Pixi components in `src/ui/scene/`, drawn through skins in `src/art/`. A skin may draw with Pixi `Graphics`, use shaders, or show textures, so the art source can change without touching logic. Epics 1–5 use placeholder skins; epic 6 replaces them.
- **What is an image and what is code.** Anything that moves or shows a number (pans, pieces, gears, dial, chain, drum, the dice) is drawn in code with `Graphics`, and may be filled with a material texture such as brass. Images carry the map illustration, room backdrops, machine housings, automatons and character looks.
- **One image, two states.** Every image is made in its restored colours. The grey blueprint state is a shader (desaturate plus ink tint) over the same image, and the restart animates the shader's amount from 1 to 0. No image is drawn twice.
- **Image pipeline.** Source PNGs, AI-generated or bought, go in `art-src/`, which is never shipped. `scripts/build-art.ts` uses sharp to write WebP at 1× and 2× into `public/assets/`, plus `manifest.json` for Pixi `Assets`. Every source has a line in `art-src/CREDITS.md` with its origin and licence; for AI images that's the tool and the prompt. A style guide written in epic 2 (`_bmad-output/art-bible.md`: palette, line weight, lighting, camera angle, prompt template) keeps the images consistent with each other and with the code-drawn parts.
- **Loading.** Pixi `Assets` loads in bundles: a small boot bundle for the loading screen, then the rest with progress shown. The renderer's resolution is `min(devicePixelRatio, 2)`.
- **Shaders** (paper grain, ink wobble, brass sheen, restart glow) are in `src/art/shaders/`, each with an off switch for the quality setting.
- **Fonts** are self-hosted WOFF2 files, subset to Latin and Latin Extended-A for č, ć, đ, š and ž, with tabular figures, under the OFL. They are never loaded from a font CDN, because that would leak visits to a third party. The system font serves until epic 6.
- **Audio** is synthesised. Any sample added later must be MP3, which every browser decodes, and must be listed with its licence in `public/audio/CREDITS.md`.
- Everything loads before play, behind the loading screen; after the PWA caches it, later launches load from the device. Only Luka's view and the dev panel load on demand.

---

## Novel Patterns

### Pattern 1: One Equation, Many Views

**The challenge.** The pans, notebook, gear chain and drum all show the same equation, and either side can drive a change: a move on the pans can write a line, and a written line moves the pans. They must never disagree, and the checker must accept any correct line.

**Components**

| Module | Responsibility |
|---|---|
| `math/tokens.ts` | Number-pad tokens: digits, `x`, `+`, `−`, `·`, `:`, `=`, `(`, `)` |
| `math/parse.ts` | Tokens to `Equation`; returns `{ ok: false, reason }`, never throws on user input |
| `math/expr.ts` | AST types, substitution, structural comparison up to commuting terms and swapped sides |
| `math/rational.ts` | Exact fractions on `BigInt`, always reduced, so no chain of `·` can overflow |
| `math/linear.ts` | Expression to `a·x + b`, or `nonlinear` for `x · x` and `18 : x` |
| `math/check.ts` | Judges a line against the stage (verdicts below) |
| `math/moves.ts` | Classifies the change between two equations for the pans to act out; measures progress |
| `math/chain.ts` | Equation to gear chain, inverse links, chain step back to an equation |
| `math/steps.ts` | Canonical next step per way, used by hints, worked examples and content tests |
| `math/forms.ts` | Classifies an equation's form (`x+a=b`, `ax=b`, `x:a=b`, `a−x=b`, `ax+b=c`, `a−bx=c`, `x+a=b+c`) for builder limits |
| `math/format.ts` | Equation to display string in school notation |

**Types**

```ts
export type Expr =
  | { k: 'num'; v: number }                  // whole number literal, 0–9 999 999
  | { k: 'x' }
  | { k: 'add' | 'sub' | 'mul' | 'div'; l: Expr; r: Expr }; // mul covers implicit 3x; div is ':'
export interface Equation { left: Expr; right: Expr }

export type Verdict =
  | { kind: 'incomplete' }                    // doesn't parse: refused with a wiggle, not a jam
  | { kind: 'nonlinear' }                     // e.g. 18 : x: refused, not a jam
  | { kind: 'aside' }                         // true sum with no x, e.g. 25 − 7 = 18: refused, not a jam
  | { kind: 'wrong' }                         // different solution, or a false check: acted out, jams
  | { kind: 'valid'; move: Move; progress: boolean }
  | { kind: 'answer' }                        // x = n with the stage's n
  | { kind: 'check' };                        // the stage equation with n put in for x: locks the machine
```

**Checker rules**

1. Parse. These are `incomplete`: anything that doesn't parse, more than one `=`, x followed by a digit (`x3`), division by zero, a leading minus, and numbers above 9 999 999. A line that isn't linear is `nonlinear`.
2. If the line has no x: it is `check` if it is true, comes after the answer line, and equals the stage's equation with the solution put in for x, up to factor order, commuted terms and swapped sides (`2 · 9 + 7 = 25` and `9 · 2 + 7 = 25` both count; `25 = 25` doesn't). A check line before the answer line, and any other true line, is `aside`. A false one is `wrong`.
3. Otherwise, solve it exactly. A line is correct only if it has **one solution equal to the stage's solution**. Any other result, including no solution or every number being a solution, is `wrong`.
4. `x = n` or `n = x`, with the stage's n, is `answer`. It must come before `check`, which must be the last line (GDD: the shortest solution is these two lines).
5. Any other correct line is `valid`, with `progress` measured as below.

**Progress.** Each equation gets a complexity tuple, `(terms on the x side, 1 if x's coefficient isn't 1 else 0, operators on the number side)`, compared lexicographically. A valid line makes progress if its tuple is smaller than the previous committed line's. `2x + 7 = 25` (2,1,0) → `2x = 25 − 7` (1,1,1) → `2x = 18` (1,1,0) → `x = 18 : 2` (1,0,1) → `x = 9` (1,0,0): each step makes progress. `2x + 8 = 26` doesn't, so it is accepted without moving the machine, as the GDD specifies. Rooms with x on both sides are outside the MVP, and the builder can't make them.

**Machine progress ("moves the machine one stage").** `machineProgress` runs from 0 to 1, per machine. Each valid line with progress adds `tuning.progressStep` (0.2), up to 0.8. The answer line sets 0.9, and the check line sets 1 and locks the machine. A valid line without progress adds nothing. Each machine's skin shows progress continuously (the door rises partway, the lamps glow brighter), so any number of lines works, including the two-line shortest solution. "Stage" always means a room stage; the Pixi root component is `SceneRoot`.

**Which x the pans show**

| Situation | x for the pans | Gear labels | Readouts |
|---|---|---|---|
| Exploring: dial, tray, splitter | The dial's x | The dial's x | Shown, unless the stage hides them |
| Acting out a written line | The stage's solution | `?` | Hidden |

- Acting out never changes the dial's value. Any exploring action (dial, tray or splitter) ends acting out and returns the pans to the dial's x, in the last committed line's layout.
- A correct line acted out stays level. A wrong one tips, by at least `tuning.jamMinTilt` (4°), so a near miss still shows, and the machine jams. The child sees exactly what his line claimed.
- `PansLevel` fires only when he levels the pans with the dial; a dial turned by the machine fires no `DialNotch`, `PansLevel` or `WayUsed`. Pins resolve on confirm (see Pattern 2), never from acting out.
- Pieces move from the old layout to the new one with **one generic tween**: pieces matched by kind and number move, and the rest fade out or in. `Move` feeds the play log and later flourishes; epic 1 needs nothing per move kind.

**Balance moves**

- The tray holds **weights and floats only**, numbered 1–99 with a stepper (− and + buttons, which repeat when held). X-gears and springs can't be added or dragged off.
- After each drop, the number pieces on that pan combine into one piece of their sum: a weight if positive, a float if negative, nothing if zero. A drop that would leave a pan with no x pieces below 0 is refused and slides back.
- A change to one pan makes the pans' equation differ from the last committed line, so the pans tip at the dial's x. The move is complete when the pans' equation again has the stage's solution. With Balance fading `auto`, that equation is written as the next line, unless it is `x = n`, which he writes himself.
- The splitter, set to 2–9 parts, first combines each pan's number pieces as a drop does (so `2x = 23 − 5` becomes `2x = 18`), then divides each pan's gear count and number. If any of them doesn't divide evenly, the machine jams (`jam.kind = 'split'`) until he drags the splitter off.
- Room 4 as a worked sequence: `2x + 5 = 23`; a float 5 on the left gives `2x = 23`, which tips and writes nothing; a float 5 on the right gives `2x = 18`, which is written; the splitter at 2 gives `x = 9` on the pans; he writes `x = 9`, then `2 · 9 + 5 = 23`.

```ts
export type Move =
  | { kind: 'add-both'; term: Term }        // same piece on or off both pans
  | { kind: 'split-both'; parts: number }   // the splitter
  | { kind: 'move-across'; term: Term }     // 2x + 7 = 25 → 2x = 25 − 7: the weight leaves, a float appears opposite
  | { kind: 'evaluate'; side: Side }        // 25 − 7 → 18: pieces merge
  | { kind: 'swap' }
  | { kind: 'compound' }                    // skipped steps: pieces morph in one go
  | { kind: 'none' };
```

**Data flow**

```
          number pad ─► draft tokens ─► Enter ─► check() ─► Verdict
                                                     │
 pans / tray / splitter / chain ─► candidate Equation┤
                                                     ▼
                                   stage reducer (Pattern 2) ─► lines[], pans, events
                                                     ▼
                     Scale, Notebook, Chain and Drum render from the same stage state
```

**Two layers on the scale.** `lines` holds what is committed and saved. Line 0 is the stage equation, shown read-only at the top of the notebook. **A wrong line is never in `lines`**: its tokens go back into the draft, marked as jammed, and he deletes from the end and retypes (there is no caret). Any edit to the draft clears the jam and returns the pans to the last committed line, and enter judges the line again. In `blanks` mode, delete clears the current blank, never the template's own text. `pans` is the last committed line plus exploratory moves, which are free and reversible by dragging pieces back (GDD). Writing a line replaces `pans` with that line's layout.

**Fading.** Each way has a line mode per room, taken from the room data:

| Mode | What appears | GDD |
|---|---|---|
| `auto` | After each completed move on the machine, its line is appended; he writes the answer and check lines | "Lines appear as he moves" |
| `blanks` | Try values: when the stage opens, `x = ☐` and the check line with x blanked (`☐ + 4 = 9`). Balance and Undo: after each completed move, its line with the result blanked (`2x = ☐`). Pad input fills only the current blank | "He fills in blanks" |
| `blank` | Nothing; he writes every line | "Blank page" |

**The gear chain** is a view of the current equation, available when x appears once. Its links are computed from the AST: `2x + 7 = 25` gives `x → ·2 → +7 → 25`, and `135 − 5x = 100` gives `x → ·5 → 135 − ☐ → 100`. He picks the operation and number for the last link. A right inverse produces the next equation, which flows through the same pipeline: the pans act it out, and the line is written in `auto` mode. A wrong inverse produces an equation with a different solution, so it jams exactly like a wrong line.

**The recording drum** records `(x, left side's value)` for every dial value tried in the stage. The right side is drawn as the level line. No other state is involved.

**Edge cases.** Whole-number dial only; division forms step by the divisor. A leading minus is refused because 5th grade has no negative numbers; binary minus works everywhere. Brackets parse, but no room needs them, and a line with brackets is acted out from its `toLinear` form. Leading zeros are allowed. The number pad can't produce letters other than x.

### Pattern 2: Room Stage State Machine

**Structure.** A room has 1 or more sequential **stages** (the GDD's "then"). A stage has 1–3 **machines** shown together; a linked machine's `☐` slot fills with the previous machine's answer when that machine locks. Authored rooms, rooms built in the workshop and friends' rooms all use the same `RoomSpec` and the same engine.

```ts
type Phase = 'arrive' | 'poke' | 'pin' | 'open' | 'locked' | 'restart' | 'done';
//  arrive → poke (if pokeNotches) → pin (if pin) → open → locked → restart → done (or the next stage's arrive)

interface StageState {
  phase: Phase;
  machine: number;                 // index of the active machine, 0–2
  lines: NotebookLine[];           // committed lines only; [0] is the stage equation, read-only
  draft: Token[];                  // a jammed line's tokens come back here
  jam: { kind: 'line' } | { kind: 'split'; parts: number } | null;
  machineProgress: number[];       // 0–1 per machine
  pans: Equation;
  actingOut: boolean;              // true from a written line until the next exploring action (dial, tray, splitter)
  dialX: number;
  dialOpen: { min: number; max: number };   // poke window, then the full range
  pin: { value: PinValue; locked: boolean; resolved: boolean } | null;
  jamsInARow: number;
  hintLevel: 0 | 1 | 2 | 3 | 4;
  lastActionAt: number;
  drum: { x: number; y: number }[];
  predictionPaid: boolean;
}
```

| Rule | Behaviour |
|---|---|
| Arrive | Ends on his first touch anywhere on the machine |
| Poke | The dial moves only over the positions min, min + step, …, min + (pokeNotches − 1)·step; the tray, splitter and notebook are off |
| Pin | Starts when he first drags the pin; a second drag moves it. The dial keeps turning inside the poke window (a stage with no poke window can't turn it before confirming). While the pin is offered, a tag on its holder asks its question (`hr.ts`), and a clamp drawn across the track marks the window's end. Confirm (an HTML button beside the pin's head) locks it and opens the stage. The pin track runs over the dial's range, or to twice the dial's maximum when the pin spec says `beyondDial` (story 1.14) |
| Resolution | Every pin resolves on confirm, and the machine tests it: a `level-x` pin the dial can reach turns the dial itself to the pin's value, notch by notch (`tuning.pinTestNotchMs`); one beyond the dial has the pans weigh the pin's x for `tuning.pinRevealMs`; an `effect` pin turns the dial up `tuning.pinEffectTestNotches` notches. A right pin lights, a wrong one dims; no praise text (NFR13). `PredictionMade` carries `right`; the root reducer pays `tuning.predictionParts` (2) into `save.economy` for a right one, once per stage, recorded in `paidPredictions` as `"r05:1"`, from epic 1 on. Lock stays a safety trigger. If he grabs the knob during a test, his drag takes over (story 1.14) |
| Jams | While `jam` is set, he can only edit the draft (which clears a line jam), drag the splitter off (which clears a split jam), reset or leave |
| Room types | `type` selects a small strategy module (`room/types/compare.ts` and so on) that hooks into the common phases. There is no per-room code |
| First use | The first time the pin, tray or splitter is available, it wiggles once (hint level 1) |
| Hints | A `clock/tick` action each second checks `ctx.now − lastActionAt ≥ 60 s`; `jamsInARow ≥ 3` raises the level at once. The content comes from `math/steps.ts` |
| Restart | When a stage locks, part of the machine starts; when the last stage locks, the whole machine restarts. Both end when the UI dispatches `presentation/done`, with a timeout fallback so a missed animation event never strands the game |
| Reset | Resets the current stage only: lines back to line 0, `machineProgress` to 0, the dial to its minimum, exploratory moves and jams cleared. With a locked pin, the pin stays and the stage returns to `open` with the full dial range; without one, it returns to `poke` (or `open` if the stage has no poke window). Reset is off while the stage is `locked` or restarting |
| Leave | Keeps the committed lines (from epic 2, when there is a map) |

### Pattern 3: Rooms in Links

**Encoding.** A friend's room is encoded as `[version: u8][title id: u8][flags][machines…][lines…]`, where each equation is a token stream with 4-bit tokens and variable-length integers, then base64url. The other link types use the same version byte.

| Rule | Value |
|---|---|
| Size | The largest legal room (3 machines, every blind, a planted mistake, maximum numbers) must encode to at most 2,000 characters **including the origin**. A CI test checks this |
| Versions | **A link version, once released, must stay decodable forever**, because links live on in chat histories. Fixtures for each version are kept in `links/__fixtures__/` |
| Room id | cyrb53 hash of the payload bytes, in base36. Not `crypto.subtle`, which is missing in insecure contexts such as the tablet on LAN during development |
| Trust | Decoded links are untrusted. Every field is range-checked (coefficients up to 99, numbers up to 9 999, at most 3 machines, title id from the list), and a room must have a whole-number solution. A bad link shows the in-fiction screen "this machine arrived broken" |
| After use | `#r` and `#b` fragments are removed with `history.replaceState` after they are handled. `#s` stays, so a reload reopens the friend's room |
| Sharing | `navigator.share` where available, otherwise a copy button, otherwise the link shown as selectable text |

### Pattern 4: Domain Events to Effects

Reducers emit events, and three effect modules listen; components never call them directly.

| Effect | Listens for | Does |
|---|---|---|
| `store/effects/save.ts` | Any event in `SAVE_TRIGGERS` | Writes `matematika:save` synchronously |
| `store/effects/audio.ts` | `DialNotch`, `PansLevel`, `MachineJammed`, `RoomRestarted`… | Plays effects; adds a machine loop on restart |
| `store/effects/playlog.ts` | Room, way, prediction, line, fight, builder and session events | Appends to `matematika:log` |

```ts
// src/store/events.ts
export type DomainEvent =
  | { type: 'StageArrived'; roomId: RoomId; stage: number }
  | { type: 'DialNotch'; x: number }
  | { type: 'PansLevel'; roomId: RoomId; stage: number; x: number }
  | { type: 'WayUsed'; roomId: RoomId; stage: number; way: WayId }          // a completed move on the machine
  | { type: 'LineAccepted'; roomId: RoomId; stage: number; source: 'typed' | WayId; progress: boolean }
  | { type: 'LineWrong'; roomId: RoomId; stage: number; line: string }
  | { type: 'MachineJammed'; roomId: RoomId; kind: 'line' | 'split' }
  | { type: 'PredictionMade'; roomId: RoomId; stage: number; right: boolean }
  | { type: 'StageLocked'; roomId: RoomId; stage: number }
  | { type: 'RoomRestarted'; roomId: RoomId }
  | { type: 'FightEnded'; lairId: LairId; won: boolean; parts: number }
  // …one union, in one file; "ways used" in the play log comes from WayUsed
```

---

## Cross-cutting Concerns

### Error Handling

| Kind | Handling |
|---|---|
| Expected outcomes (wrong line, illegal move, bad link) | Typed results (`Verdict`, `{ ok: false, reason }`). Never thrown |
| Programmer errors (impossible state) | `assert(cond, msg)` throws; caught by the error boundary |
| Render crash | The top-level React error boundary shows an in-fiction "the machine jammed, tap to restart" screen. The save is untouched, and the tap reloads the game. Set up in epic 1's first story |
| Global errors | `window.onerror` and `unhandledrejection` write to `matematika:errors` |
| Storage failure (quota, private mode) | The game keeps running in memory and shows a quiet "progress isn't being saved" notice in Luka's view and on the map |
| WebGL context lost (common on Android when the app is in the background) | The scene unmounts and remounts on `webglcontextrestored`, and also on `visibilitychange` back to visible if the context is still lost, because the restore event may never come after long backgrounding. Tearing down the old app keeps cached textures. No game state lives in Pixi objects, so nothing is lost |
| No WebGL at all | An in-fiction screen asking to open the game in up-to-date Chrome or Safari. Pixi falls back to WebGL 1 first; WebGPU is not used |

Messages to the child are in-fiction Croatian, from the text module. Technical detail goes only to the error log.

### Logging

```ts
// src/lib/log.ts
log.debug('room', 'verdict', verdict);   // console, development builds only
log.warn('save', 'migration from v1');   // console in development
log.error('links', 'decode failed', e);  // console in development; matematika:errors in production
```

There is no remote logging, analytics or crash reporting (GDD privacy). The **play log** is a separate thing: it is game data for Luka's view, written through Pattern 4.

### Configuration

| Kind | Location |
|---|---|
| Tuning numbers from the GDD and this document (tilt 1° per unit and ±15°, minimum jam tilt 4°, progress step 0.2, 24 px per notch, 60 s and 3 jams for hints, 2 parts per prediction, quality thresholds, fight values, costs, lair rewind of 15 min) | `src/config/tuning.ts`, one exported `const` object. The GDD numbers are provisional, so they all live in this one file |
| Content (rooms, map, lairs, titles, text) | `src/content/` |
| Player settings (mute, quality) | `save.settings` |
| Build flags | `import.meta.env.DEV`; no other environment variables |

### Event System

Domain events (Pattern 4) are the only cross-system channel. There is no global event bus and no React context used for events. UI-only signals, such as "animation finished", are actions dispatched to the store.

### Debug Tools

In development builds only, the dev panel (`src/dev/`, opened with a `?dev` query or the backtick key) can jump to any room or stage, set tools and parts, show the checker's verdict and tuple live, fix the fight seed, fill or clear the save, and encode or decode a link. It is excluded from production by `import.meta.env.DEV`.

**Testing on the tablet:** run `npm run dev -- --host`, then open `http://<PC IP>:5173` in Chrome on the tablet. Profile with USB debugging through `chrome://inspect`. This is an insecure context, so the service worker, sharing and clipboard don't work there. Test those on the deployed site.

---

## Project Structure

### Organization Pattern

**Pure core plus a thin UI.** Folders split by domain. Domain folders hold pure TypeScript; `ui/` holds React; `store/` is the only bridge between them. Tests sit next to the code they test.

### Directory Structure

```
matematika/
├── index.html
├── package.json, package-lock.json, .npmrc        # save-exact=true
├── vite.config.ts                                  # also holds Vitest config
├── tsconfig.json
├── biome.json
├── playwright.config.ts
├── .github/workflows/ci.yml
├── public/
│   ├── assets/                                     # WebP atlases at 1× and 2×, Pixi asset manifest
│   ├── fonts/                                      # epic 6
│   ├── icons/                                      # PWA icons, epic 6
│   └── audio/CREDITS.md                            # only if samples are used
├── art-src/                                        # source PNGs and CREDITS.md; never shipped
├── scripts/
│   ├── build-art.ts                                # art-src/ → public/assets/ WebP 1× and 2×, manifest
│   └── check-size.ts                               # fails the build over budget; imports nothing from src/
├── e2e/                                            # Playwright specs
├── jednadzbe.html                                  # old proof of concept; not part of the app
└── src/
    ├── main.tsx                                    # read fragment → load save → mount
    ├── architecture.test.ts                        # enforces the import boundaries
    ├── app/                                        # App, screen switch, error boundary, portrait overlay
    ├── math/                                       # Pattern 1 (pure)
    ├── room/                                       # Pattern 2 (pure): stage reducer, phases, pins, hints, fading
    │   └── types/                                  # solve, compare, predict, mistake, story
    ├── fight/                                      # pure: rng, dice, placement, strike, rewards, piles
    ├── city/                                       # pure: gating, return trips, lairs, city log
    ├── economy/                                    # pure: parts, upgrades, costs
    ├── workshop/                                   # pure: builder rules, limits, validation, costs
    ├── links/                                      # pure: codecs, base64url, cyrb53, fragment router
    │   └── __fixtures__/
    ├── save/                                       # schema, migrations, storage adapter
    ├── playlog/                                    # event types, summaries for Luka's view
    ├── store/                                      # Zustand store, root reducer, actions, events
    │   └── effects/                                # save, audio, playlog
    ├── audio/                                      # Web Audio engine, effects, loops, scheduler
    ├── content/
    │   ├── rooms/                                  # r01-door-lift.ts … r13-clock-tower.ts, index.ts
    │   ├── map.ts                                  # 19 nodes, edges, gates, positions
    │   ├── lairs.ts
    │   ├── titles.ts                               # fixed list of room titles
    │   ├── paper-test.ts                           # equations that must never appear in rooms
    │   └── text/hr.ts                              # every Croatian string
    ├── config/tuning.ts
    ├── art/                                        # palette, skins, quality settings
    │   └── shaders/                                # paper, ink, brass, glow; each can switch off
    ├── ui/
    │   ├── scene/                                  # Pixi (WebGL) components
    │   │   ├── SceneRoot.tsx                       # <Application>, resize, resolution, context loss
    │   │   ├── scale/                              # Scale, Pan, Piece, Dial, Pin, Tray, Splitter
    │   │   ├── chain/  drum/  map/  fight/  workshop/  effects/   # effects: steam, sparks, glow
    │   ├── notebook/                               # HTML: Notebook, NumberPad, LineView
    │   ├── cards/  luka/  common/                  # HTML: cards, dialogs, Luka's view, loading screen
    ├── lib/                                        # log, assert, small helpers
    └── dev/                                        # dev panel, development builds only
```

### System Location Mapping

| System | Logic | UI |
|---|---|---|
| Equation model, checker | `src/math/` | `ui/notebook/` |
| Scale, balance | `src/room/`, `src/math/moves.ts` | `ui/scene/scale/` |
| Gear chain, drum | `src/math/chain.ts`, `src/room/` | `ui/scene/chain/`, `ui/scene/drum/` |
| Room types, fading, hints | `src/room/` | `ui/cards/`, `ui/scene/scale/` |
| Map and gates | `src/city/`, `content/map.ts` | `ui/scene/map/` |
| Fights | `src/fight/`, `src/economy/` | `ui/scene/fight/` |
| Builder | `src/workshop/` | `ui/scene/workshop/`, `ui/common/` |
| Links | `src/links/` | `app/` (entry), `ui/common/` (sharing) |
| Saving, play log | `src/save/`, `src/playlog/`, `store/effects/` | `ui/luka/` |
| Audio | `src/audio/`, `store/effects/audio.ts` | Mute control in `ui/common/` |

### Architectural Boundaries

| Folder | May import | Must not import |
|---|---|---|
| `math`, `room`, `fight`, `city`, `economy`, `workshop`, `links`, `playlog` | Each other's types and functions, `config`, `lib`, `immer` | `react`, `zustand`, `motion`, `pixi.js`, `ui`, `store`, `save`, `audio`, any DOM or storage API |
| `ui/scene` | Everything `ui` may, plus `pixi.js`, `@pixi/react`, `pixi-filters` | HTML elements |
| Rest of `ui` | | `pixi.js` |
| `content` | Types from the pure folders | Anything with behaviour |
| `store` | Pure folders, `save`, `audio`, `content` | `ui` |
| `ui` | `store` hooks and actions, `art`, `content/text`, pure types and formatters | `save`, `audio` and effects directly |

`src/architecture.test.ts` scans import statements and fails on any violation. Biome's `noRestrictedImports` gives the same rule in the editor.

---

## Implementation Patterns

### Communication

Components read with selectors and act only through `dispatch`. Systems talk only through domain events (Pattern 4).

```tsx
// src/ui/scene/scale/Dial.tsx (sketch)
const x = useGame(s => s.room!.stage.dialX);
const dispatch = useGame(s => s.dispatch);
// onGlobalPointerMove: slide the knob along the track through its ref every move
// (no React render), and dispatch only when the notch changes
knobRef.current!.x = trackX(dragOffsetPx);
if (notch !== lastNotch) dispatch({ type: 'dial/set', x: min + notch * step });
```

**Scene components** read the store like any other component. Values that change every frame (a finger dragging, a spring settling, a gear turning) are written to Pixi objects through refs inside `useTick` or Motion's `animate(…, { onUpdate })`, never through React state.

### Entity Creation

Nothing is instantiated imperatively. Rooms, machines, pieces, lairs and map nodes are **data** (`RoomSpec`, `MachineSpec`, `NodeSpec`). Pieces are derived from the AST: a number becomes a weight, a subtracted number a float, `kx` becomes k x-gears (one large gear above 12), `−kx` becomes springs, and `x : n` becomes a divider (the GDD's "reducer", renamed in code so it isn't confused with state reducers). Any term without x that isn't a bare number (`2 · 9`, `18 : 2`) becomes one weight, or one float if subtracted, of its value, so every check line can be acted out. A line with brackets is acted out from its `toLinear` form. React renders the derived list with stable keys of the form `${side}-${kind}-${index}`.

### State Transitions

Explicit finite-state machines with discriminated unions: stage `Phase` (Pattern 2) and fight `phase: 'roll' | 'place' | 'set' | 'strike' | 'won' | 'lost'`. A reducer handles each action only in the phases where it is legal and ignores it elsewhere, logging at debug level.

### Data Access

Content is imported statically: `import { rooms } from '@/content/rooms'`. Saved data is reached only through the store. Text comes from `import { hr } from '@/content/text/hr'`, as typed properties; templates are functions:

```ts
export const hr = {
  ui: { reset: 'Ispočetka', mute: 'Bez zvuka' },
  room: { r01: { restart: (name: string) => `Vrata se dižu. ${name}, kako se to radi?` } },
} as const;
```

(The strings are placeholders. The final text comes in epic 6 and avoids gendered verb forms.)

### Room Data

```ts
// src/content/rooms/r04-water-wheel.ts
export const r04: RoomSpec = {
  id: 'r04',
  machine: 'water-wheel',
  xMeaning: 'load per bucket',
  stages: [{
    type: 'solve',
    machines: [{ equation: '2x + 5 = 23' }],
    dial: { min: 0, max: 6, step: 1 },
    tiltPerUnit: 0.75,                 // so no poke-window notch hits the 15° clamp
    pokeNotches: 4,
    pin: { kind: 'level-x', beyondDial: true },
    readouts: true,
    ways: ['balance'],
    fading: { try: 'blank', balance: 'auto' },
  }],
  earns: null,
  mapChange: 'water-wheel-turns',
};
```

Equations are written as strings in school notation and parsed when loaded. **Content tests** check every room: each equation parses and has one whole-number solution; dial ranges and poke windows match the GDD table; no poke-window notch hits the tilt clamp; every listed way can finish under that room's limits (using `math/steps.ts`), and the dial can't reach the answer where the GDD says it stops short; the fading matrix matches the GDD; no paper-test equation appears, compared up to swapped sides and commuted terms (`content/paper-test.ts`); every room has a `machine`, an `xMeaning` and a `mapChange`. `xMeaning` is a design note in English that the machine's skin must make visible; it is never shown as text.

### Consistency Rules

| Rule | Detail |
|---|---|
| No game logic in components | If it decides anything, it lives in a pure folder and has a test |
| No Croatian strings outside `content/text/hr.ts` | `architecture.test.ts` also fails on č, ć, đ, š or ž in `ui/` and `app/` |
| Notation | Only `math/format.ts` formats equations and numbers: `·` (U+00B7), `:`, `−` (U+2212), and U+202F narrow no-break space as the thousands separator from 1 000. The parser ignores spaces |
| Physical keyboard | `*` → `·`, `/` → `:`, `-` → `−`, `x` or `X` → x, Enter, Backspace |
| No OS keyboard in play | The notebook is not an `<input>`, so the OS keyboard never opens; only the name dialog uses one |
| Input | Scene: Pixi pointer events (`onPointerDown`, then `onGlobalPointerMove` for drags, ending on `onPointerUp`, `onPointerUpOutside` and `pointercancel`, or a dropped drag sticks on Android). HTML: Pointer Events with `setPointerCapture`. `touch-action: none` on the canvas and `manipulation` elsewhere; `overscroll-behavior: none`; no hover-only affordances |
| Gesture sizes | Thresholds in CSS pixels, not scene units (24 px per notch). Hit areas are at least 48 CSS px at the smallest supported viewport, 640 × 360 CSS px in landscape, using an enlarged `hitArea` where a drawing is smaller |
| The dial | A horizontal track under the scale, dragged left and right, one notch per 24 CSS px, with a tick per notch. x starts at the dial's minimum. When the range is wider than the space, the track scrolls under a fixed window |
| Scene coordinates | One logical scene of 1600 × 1000, scaled to fit the area beside the notebook; layout changes only between the tablet and phone layouts |
| Animation | Continuous motion on the Pixi ticker, discrete changes with Motion; nothing per frame through React state. Logic never waits for an animation, except `presentation/done` |
| Effects | Filters go on containers that are cached as textures or are few in number, never one per piece. `Graphics` are built once and transformed, not redrawn each frame. Every effect has a quality switch |
| Text in the scene | Numbers on weights use Pixi `Text` at the renderer's resolution, at least 20 CSS px; anything longer than a number or a short label goes in HTML |
| Time and randomness | Only through `ctx`; never `Date.now()` or `Math.random()` in a pure folder |
| Dates | ISO 8601 strings in save and log; `Intl.DateTimeFormat('hr-HR')` for display |
| No `dangerouslySetInnerHTML` | Anywhere |

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Component files | PascalCase `.tsx` | `NumberPad.tsx` |
| Other files | kebab-case `.ts` | `move-classify.ts` |
| Tests | Next to the source file | `check.test.ts` |
| Types and interfaces | PascalCase, no `I` prefix | `RoomSpec`, `Verdict` |
| Functions and variables | camelCase | `toLinear`, `dialX` |
| Constants | camelCase inside `tuning`; UPPER_SNAKE only for module-level literal tables | `tuning.tiltPerUnit`, `SAVE_TRIGGERS` |
| Actions | `domain/verb`, lower case | `dial/set`, `notebook/enter`, `fight/strike` |
| Domain events | PastTense PascalCase | `LineAccepted`, `RoomRestarted` |
| Ids | Short fixed strings | Rooms `r01`–`r13`; lairs `lair-20`, `lair-30`, `lair-45`, `lair-60`; `workshop`; `foundry`; ways `try`, `balance`, `undo`; tools `balance`, `workshop`, `chain`, `drum` |
| Room content files | `rNN-machine-name.ts` | `r09-steam-lift.ts` |
| Code language | English for code and comments; Croatian only in `hr.ts` | |

---

## Data Architecture

```ts
interface RoomSpec {
  id: RoomId | `built-${string}`;
  machine: MachineId;                  // which skin: 'door-lift', 'street-lamps', …
  xMeaning: string;                    // design note: what x is here; shown only through the skin
  stages: StageSpec[];
  earns: ToolId | null;
  mapChange: string | null;            // null for built and friends' rooms
}
interface StageSpec {
  type: 'solve' | 'compare' | 'predict' | 'mistake' | 'story';
  machines: MachineSpec[];             // 1–3; later ones may hold a ☐ fed by the previous answer
  dial: { min: number; max: number; step: number } | 'locked';
  tiltPerUnit?: number;                // overrides tuning.tiltPerUnit (1°) for this stage
  pokeNotches?: number | 'all';        // number of dial positions open before the pin
  pin?: PinSpec;
  readouts: boolean;
  ways: WayId[];                       // ways that can finish
  fading: Partial<Record<WayId, 'auto' | 'blanks' | 'blank'>>;
  presetLines?: string[];              // mistake rooms, and planted mistakes
  change?: { after: 'locked'; from: number; to: number };   // room 5: 22 becomes 25
  blinds?: { readouts?: true; stillPans?: true; shortDial?: number };
  drum?: true;
}

type Side = 'left' | 'right';
type Term =                            // one piece's worth of an equation side
  | { kind: 'num'; value: number; sign: 1 | -1 }                    // weight or float
  | { kind: 'x'; coef: number; sign: 1 | -1; divisor?: number };    // x-gears, springs, divider
interface NotebookLine { tokens: Token[]; source: 'given' | 'typed' | WayId; verdict: Verdict }
type PinSpec =
  | { kind: 'level-x'; beyondDial?: true }   // where it levels
  | { kind: 'x-hidden' }                     // compare: x before anything moves
  | { kind: 'wrong-line' }                   // find the mistake
  | { kind: 'story-choice' }
  | { kind: 'range'; bounds: number[] }      // room 11: under 100, 100–300, over 300
  | { kind: 'next-dot' }                     // the drum
  | { kind: 'effect'; options: string[] };  // predict what a change does; options are text keys; resolves on confirm (story 1.14)
type PinValue =
  | { kind: 'x'; x: number } | { kind: 'line'; index: number }
  | { kind: 'choice'; index: number } | { kind: 'bucket'; index: number };

interface SaveV1 {
  v: 1;
  createdAt: string;
  character: { name: string | null; look: LookId | null };
  progress: {
    roomsDone: RoomId[]; tools: ToolId[]; formsMet: FormId[]; ideasSeen: IdeaId[];
    seen: NodeId[]; at: NodeId; tornPages: PageId[];
    room: { id: RoomId; stage: number; lines: string[] } | null;
  };
  economy: {
    parts: number; upgrades: UpgradeId[]; paidPredictions: string[];
    piles: Partial<Record<LairId, number>>;
    lairs: Partial<Record<LairId, { rewindsAt: string }>>;
  };
  fight: FightState | null;
  workshop: { rooms: { id: string; payload: string; title: TitleId; stamp: 'cracked' | 'uncracked' | null }[] };
  cityLog: { at: string; roomId: RoomId }[];
  settings: { muted: boolean; quality: 'high' | 'medium' | 'low' | null };
}

type PlayLogEvent = { at: string } & (
  | { type: 'session' }                                  // first event after 30 min of nothing
  | { type: 'room'; roomId: RoomId; action: 'enter' | 'done' | 'reset' }
  | { type: 'way'; roomId: RoomId; way: WayId }
  | { type: 'prediction'; roomId: RoomId; stage: number; right: boolean }
  | { type: 'line'; roomId: RoomId; ok: boolean; text: string }   // hints are never logged (GDD: free and never recorded)
  | { type: 'fight'; lairId: LairId; won: boolean; parts: number }
  | { type: 'built'; roomId: string; sent: boolean }
);
```

**Luka's view** (`#dnevnik`) reads the play log and shows the GDD gameplay metrics: sessions per day, prediction accuracy in rooms 3–6 against 9–13, ways used by room 11, the date the clock tower ran, rooms built and sent, and fights at armour 45 or more after a loss. It also exports the log as a JSON file and makes the backup link.

---

## API Contracts

There is no server and there are no network calls at runtime. The only external contract is the **URL**:

| URL | Meaning |
|---|---|
| `<origin><base>` | The game |
| `…#s=<room>` | Play a friend's room |
| `…#r=<roomId>.c` / `.u` | Stamp a built room cracked or uncracked; ignored if no built room has that id |
| `…#b=<backup>` | Offer to restore progress, showing both saves before overwriting |
| `…#dnevnik` | Luka's view |

The link formats are versioned, and old versions stay decodable (Pattern 3).

---

## Security and Privacy

- **No data leaves the device.** No analytics, trackers, font CDNs or third-party requests. Fragments are never sent to the host.
- **The name never goes in a link.** Room, reply and backup links leave it out, so a restore asks for the name again.
- **Friends' links are untrusted input,** validated field by field (Pattern 3). Link text comes only from fixed lists, so there is no free text and nothing to inject.
- **Content Security Policy** in a `<meta>` tag: `default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; connect-src 'self' data: blob:; worker-src 'self' blob:`. Pixi decodes textures in a worker started from a blob URL, hence `blob:`. `main.tsx` imports `pixi.js/unsafe-eval` so Pixi needs no `'unsafe-eval'`. The policy is added only to production builds (in `transformIndexHtml`), because the development server's hot reload uses an inline script.
- **No authentication,** by design.

---

## Performance

| Budget | Target | How |
|---|---|---|
| First load in total | Soft budget 30 MB; graphics come first | `scripts/check-size.ts` reports the size on every build and fails only above 30 MB, so a change of budget is deliberate |
| Loading | A loading screen within 1 s, then progress | A small boot bundle (loading screen, fonts) before the main asset bundles |
| JavaScript | Under 1 MB gzipped | React, PixiJS, Motion, Zustand and Immer; any other runtime dependency needs a reason in an ADR |
| Textures in GPU memory | Under 256 MB | Atlases; 2× textures only where the screen's density uses them |
| Dragging | 60 FPS in a three-machine room with effects on | Per-frame values through refs; the dial dispatches per notch; cached filter containers |
| Touch latency | Within one frame | No work in `onGlobalPointerMove` besides moving the knob and the notch calculation |
| Audio | No main-thread spikes | A 25 ms lookahead timer schedules 100 ms ahead on the audio clock |
| Quality | Steady 60 FPS on his tablet | A quality setting picked by a 2-second frame-time test with all effects on, timed only after the scene has settled (1 second after its first frame, so mount and texture-upload spikes don't count): 95th-percentile frame time up to `tuning.qualityHighMs` (18 ms) gives `high`, up to `tuning.qualityMediumMs` (25 ms) `medium`, otherwise `low`. Stored in `save.settings.quality`, so it runs on first launch only (every launch until saving exists in epic 2). Effects switch off in a fixed order: bloom, then particles, then shaders |

Epic 1 ends with a profile on the tablet, with effects on.

---

## Audio Architecture

- `audio/engine.ts` creates one `AudioContext` on the first `pointerdown`, as browsers require, with master gain for mute.
- **Effects** are synthesised: a dial tick (a short noise burst), a thunk when the pans level (a low sine with fast decay), and a jam hiss (filtered noise).
- **Machine loops** are 16-step patterns at a shared tempo (provisional: 96 BPM), defined as data per room. A restarted machine's loop joins in on the next bar, so the city's sound is the music. The map plays all restored loops quietly; a room brings its own loop forward.

---

## Deployment

| Item | Decision |
|---|---|
| CI | GitHub Actions on every push: `npm ci` → `biome ci` → `tsc --noEmit` → `vitest run` → `vite build` → size check. On `main`, the build also deploys |
| Host | GitHub Pages from the existing `lpodobnik/matematika` repo, with Vite `base: '/matematika/'`. If the repo stays private on a free plan, Pages is unavailable, so use Cloudflare Pages instead (own origin, works with private repos) |
| Origin | **Fixed before the handover.** Saves are tied to it, so moving later needs the backup link |
| PWA (epic 6) | `vite-plugin-pwa` 2.0.0: manifest with landscape and standalone display; the app shell and all asset bundles precached, so later launches load from the device. A new version downloads in the background and is applied only while he is on the map, never mid-room |
| E2E | Playwright on Galaxy Tab, iPad, iPhone (landscape) and desktop Chrome profiles: room 1, link encode and open, backup and restore. Runs on `main` from epic 5 |

---

## Epic to Architecture Mapping

| Epic | Main locations | Patterns |
|---|---|---|
| 1. First machine | `math/`, `room/`, `ui/scene/SceneRoot.tsx`, `ui/scene/scale/`, `ui/notebook/`, `content/rooms/r01`–`r04`, `store/`, quality setting | 1, 2, 4 |
| 2. The city | `city/`, `save/`, `links/` (backup), `playlog/`, `ui/scene/map/`, `ui/cards/`, `ui/luka/`, loading screen, `content/text/`, `r05`–`r07` | 2, 3, 4 |
| 3. Automaton fights | `fight/`, `economy/`, `ui/scene/fight/`, `content/lairs.ts`, `fight/balance.test.ts` | 4 |
| 4. The whole district | `math/chain.ts`, `room/types/story.ts`, linked machines, drum, `ui/scene/chain/`, `ui/scene/drum/`, `r08`–`r13` | 1, 2 |
| 5. Rooms for friends | `workshop/`, `links/` (room, reply), `ui/scene/workshop/`, friend mode in `app/` | 2, 3 |
| 6. Ready for the surprise | `art/` and `art/shaders/`, `ui/scene/effects/`, final textures, `audio/`, `content/text/hr.ts`, PWA, deployment, e2e, fonts | All |

**Epic 1's first story is scaffolding:** the project, CI, boundaries test and an empty screen, before any game code.

---

## Testing Strategy

| Layer | Tool | Covers |
|---|---|---|
| Line-checker table | Vitest | For each of the 13 rooms, lines that must be accepted (including skipped steps) and lines that must be rejected, with the expected verdict. This is the GDD's technical metric |
| Property tests | fast-check | Random linear equations: any solution-preserving step is accepted and any change that alters the solution is rejected; link encode and decode round-trips |
| Content | Vitest | The room checks under Room Data; map reachability (every required room reachable in every allowed order, no gate depending on parts); 19 nodes and the GDD's edges |
| Fights | Vitest | Rules and edge cases; `fight/balance.test.ts` runs the GDD's scripted players for 40,000 fights per setting through the real fight code and checks win rates within ±2 points |
| Save and links | Vitest | Each migration from fixtures; every released link version decodes from fixtures; the largest room fits in 2,000 characters |
| UI flows | Playwright | Room 1 with touch on the tablet profile; send and open a link; backup and restore |
| On the device | By hand | Epic 1 profile on his tablet; epic 6 links through messaging apps on Android, iPad and iPhone |

---

## Architecture Validation

| Check | Result | Notes |
|---|---|---|
| Decision compatibility | Pass | Peer ranges checked: `@pixi/react` 8.0.5 needs PixiJS 8.2.6 or later and React 19; `pixi-filters` 6.1.5 accepts PixiJS 8; Motion and Zustand accept React 19; Vitest 5 and `vite-plugin-pwa` 2 accept Vite 8; Biome is used because `typescript-eslint` stops before TypeScript 6.1. `@pixi/particle-emitter` supports only PixiJS 7, so particles use Pixi 8's own `ParticleContainer` |
| GDD coverage | Pass | Every core system and technical requirement maps to a location above; performance, loading, privacy, saving, links, notation, touch and language each have a rule |
| Pattern completeness | Pass | Entity creation, communication, state, errors, data access and events are defined, with examples |
| Epic mapping | Pass | All six epics mapped |
| Document completeness | Pass | No placeholders. The text-module strings are marked as placeholders on purpose |

**Deferred, with reasons:**
- The final font, and which image generator or asset packs to use (epic 2 style guide, epic 6 final art). The pipeline takes PNGs from any source.
- The PWA (epic 6), because it complicates development and matters only from the handover on.
- The final host name, which is needed only before the handover (ADR-10).

---

## Development Environment

### Prerequisites

Node 26 (26.13.0 is installed) and npm 11, plus Git. Chrome on the Android tablet, with USB debugging on for profiling.

### AI Tooling (MCP Servers)

No engine MCP is listed for PixiJS. The desktop app's built-in browser covers previews and screenshots, and Playwright covers device profiles. Context7 (`claude mcp add context7 -- npx -y @upstash/context7-mcp`) can be added later if lookups of current library docs become necessary. It is not set up now.

### Setup Commands

```bash
npm init -y
npm install --save-exact react@19.3.1 react-dom@19.3.1 pixi.js@8.22.0 @pixi/react@8.0.5 pixi-filters@6.1.5 zustand@5.0.16 immer@11.2.9 motion@14.9.1
npm install --save-exact -D sharp@0.35.5 vite@8.3.6 @vitejs/plugin-react@6.2.1 typescript@7.0.2 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node@26.6.6 vitest@5.1.0 fast-check@4.10.2 @biomejs/biome@2.6.5 @playwright/test@1.65.0
npx playwright install chromium webkit
```

In `package.json`, set `"private": true` and `"type": "module"`. Scripts: `dev` (`vite`), `build` (`tsc --noEmit && vite build && node scripts/check-size.ts`), `test` (`vitest run`), `check` (`biome ci .`), `e2e` (`playwright test`). Node 26 runs the standalone `.ts` script directly. Imports inside `src/` use the `@/` alias, set in both `tsconfig.json` and `vite.config.ts`.

`tsconfig.json` for TypeScript 7, which removed options that 6.0 deprecated: `"strict": true`, `"module": "esnext"`, `"moduleResolution": "bundler"`, `"paths": { "@/*": ["./src/*"] }` with **no `baseUrl`**, `"noUncheckedIndexedAccess": true`, `"verbatimModuleSyntax": true`, `"jsx": "react-jsx"`, `"noEmit": true`. The app runs under React StrictMode, so `SceneRoot` must survive StrictMode's double mount of `@pixi/react`'s asynchronous `<Application>` in development.

### First Steps

1. First story: scaffold, CI, `architecture.test.ts`, an empty landscape screen and the portrait overlay.
2. Write `math/` with the room 1–4 rows of the line-checker table before any UI.
3. Build the scale (in the scene) and the notebook (in HTML) for room 1, with one placeholder effect such as steam, and profile on the tablet.

---

## Architecture Decision Records

Each is Claude's call, open to Luka's veto.

| ADR | Decision | Instead of | Why |
|---|---|---|---|
| 1 | PixiJS (WebGL) scene through `@pixi/react`, HTML for notebook and cards | SVG only, Phaser 4, Godot or Unity | Revised after Luka put graphics before load time: WebGL gives shaders, particles and glow, which SVG can't do well on a tablet; Pixi fits under React and the store; Godot's web export is heavy and unreliable on iOS, where friends may play |
| 2 | One store, pure reducers, domain events | Component state, an event bus | The checker, rooms and fights test without a browser; agents get one place to put logic |
| 3 | Judge lines by exact solution | Matching expected steps | Accepts any correct line, including skipped steps, as the GDD requires |
| 4 | Wrong lines acted out at the true x | Just a red line | The pans tip by exactly what the line claims, which is Pillar 1 |
| 5 | Progress by complexity tuple | Counting lines | `2x + 8 = 26` is accepted without moving the machine, as specified |
| 6 | Backup link without the name or play log; play log exported as a file | Everything in the link | Follows the GDD's name rule; the play log is Luka's data and would make the link long |
| 7 | `localStorage` | IndexedDB | Small, synchronous, enough; migrations handle growth |
| 8 | A fight in progress resumes after a reload | Counting it as leaving | A tablet that sleeps shouldn't cost a 5th grader his parts |
| 9 | Unparseable lines, lines that aren't linear, and side sums are refused without a jam | Counting them as jams | Typos aren't wrong ideas; jams are for wrong maths |
| 10 | GitHub Pages, with Cloudflare Pages as the fallback; origin fixed before handover | Choosing a host now | The repo already exists there; nothing needs hosting until tablet tests need links |
| 11 | Synthesised Web Audio | Tone.js, sample packs | No licences, tiny, and enough for ticks, thunks, hisses and loops |
| 12 | Biome | ESLint with `typescript-eslint` | `typescript-eslint` doesn't support TypeScript 7 |
| 13 | Lairs rewind 15 minutes after a win (tuning value) | Rewinding after a room | The GDD says only "later"; a real-time timer is simple and easy to tune |
| 14 | Luka's view at `#dnevnik`, linked from nowhere | A PIN screen | Enough to keep it out of the way of a 5th grader |
| 15 | The dial updates the store per notch; per-frame values go through refs | Per pointer move through React | Keeps 60 FPS and matches the ticks |
| 16 | A loading screen and a 30 MB soft budget; everything cached after the first launch | The GDD's former 5 MB and 3 s limits | Luka: graphics matter more than load time |
| 17 | A quality setting from a frame-time test, with effects switching off in a fixed order | One fixed look | Rich effects without risking 60 FPS on his tablet |
| 18 | Code draws everything that moves or shows a number; images carry backdrops, map, housings, automatons and looks | Images for everything | Pieces and gears must animate and show exact numbers; images give the rest the richness Luka wants |
| 19 | The grey state is a shader over the colour image | Two drawings per image | Half the images, and grey and restored always match |

---

_Generated by the BMAD GDS Game Architecture workflow · 2026-11-05 · for Luka_
