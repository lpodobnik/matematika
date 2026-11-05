---
project: 'matematika (working title)'
updated: '2026-11-05'
---

# Project Context for AI Agents

Read this before writing any code. It is a short guide; the full rules are in the documents below.

## Source Documents

| Document | Path | Use it for |
|---|---|---|
| Stories | `_bmad-output/planning-artifacts/epics.md` | What to build, with acceptance criteria |
| Architecture | `_bmad-output/planning-artifacts/game-architecture.md` | How to build it: stack, patterns, structure, rules |
| GDD | `_bmad-output/planning-artifacts/gdds/gdd-matematika-2026-11-05/gdd.md` | Game rules, room tables, tuning numbers |
| GDD decisions | `_bmad-output/planning-artifacts/gdds/gdd-matematika-2026-11-05/decision-log.md` | Why the rules are as they are |
| Narrative | `_bmad-output/narrative-design.md` | Story, characters, tone |

When the stories and the architecture disagree, the architecture's Pattern 1 and Pattern 2 win, and the disagreement is reported.

## The Game in One Paragraph

A Croatian-language puzzle game for one 5th grader on an Android tablet. Equations are machines: each side sits on a pan, and he solves by dragging x, balancing the pans, or running a gear chain backward, then writes the solution line by line. Each correct line moves the machine, and the check line restarts it. No scores, stars or "correct" screens, ever.

## Stack

TypeScript 7.0.2, React 19.3.1, PixiJS 8.22.0 through `@pixi/react` 8.0.5 for the scene, HTML for the notebook and cards, Zustand 5 with Immer, Motion, Vite 8, Vitest 5, Biome 2.6. Exact versions only. No other runtime dependency without an ADR.

## Rules Agents Must Not Break

1. **Game logic lives only in pure folders** (`math`, `room`, `fight`, `city`, `economy`, `workshop`, `links`, `playlog`), with tests. They never import React, Pixi, Zustand, Motion, the DOM or storage. `src/architecture.test.ts` enforces this.
2. **One store, one `dispatch`.** Pure reducers get time and randomness through `ctx` and return domain events. Saving, audio and the play log react to events; components never call them.
3. **Lines are judged by their exact solution**, never by matching expected steps (architecture Pattern 1, checker rules).
4. **Acting out a line uses the stage's solution, shows `?` on the gears and never moves the dial.** Exploring uses the dial's x.
5. **A wrong line is never stored in `lines`.** It goes back to the draft, and the machine jams.
6. **Per-frame values go through refs**, never React state. The dial dispatches once per notch.
7. **All Croatian text lives in `src/content/text/hr.ts`.** Notation only through `math/format.ts`: `·`, `:`, `−`, and U+202F as the thousands separator.
8. **Touch first:** hit areas at least 48 CSS px at 640 × 360, no hover states, drags end on pointer up, up outside and cancel. The notebook is never an `<input>`.
9. **No data leaves the device.** No analytics, no third-party requests, no character name in any link.
10. **Rooms are data** (`RoomSpec`), with content tests. No per-room code.

## Testing

- Every change to `math/` adds rows to `src/math/lines.table.ts`.
- Content tests run for every room.
- Luka plays on the tablet; profile through `chrome://inspect` when a story asks for it.
