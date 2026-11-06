# Story 1.16: One x, a goal and a hint button

Status: in-progress

## Story

As Luka's son,
I want one x I can trust, a picture of what I'm aiming for and a button that shows me the next step,
so that I can solve room 4 by simplifying, not by guessing, and never get stuck.

**Source:** Luka's play of story 1.15's room 4 (2026-11-06).
1. "Why should I write x all of a sudden, when I used to set x with the slider?"
2. "Why do I set x to 6 with the slider, but then balance it out with weights, when 6 is obviously wrong? x is unknown but the slider is on 6, although it says x = ?."
3. "There should be a better way that stops me solving without simplifying."
4. "If I put x at 6 and simplify, it should still be out of balance."
5. "A visual way that makes me say: this is too complicated, I need to simplify."
6. "We really need a hint button that shows the next step."

Story 1.15 weighed the scale at the true x during Balance and showed `x = ?` on the slider while its knob sat at 6. That gave two x's at once. This story keeps only the slider's x.

## Acceptance Criteria

### A. One x and simplify-first (worktree, branch `lane/1-16-rules`)

1. **The slider is the only x.**
   - The pans are always weighed at the slider's x: while exploring, after a typed line, and after a Balance move.
   - Readouts always show, unless the stage sets `readouts: false`.
   - The slider's plate always reads `x = <dial value>`. The `x = ?` state and its dimming are removed.
   - Balance moves still act on both sides at once (1.15). So at a wrong slider value the scale stays out of balance through every move. In room 4 with the slider at 6: 17 vs 23, then 12 vs 18, then 6 vs 9.
   - Acting out at the stage's solution is removed. Pieces still take the last committed line's layout, through the tween, as today.
   - The jam's minimum tilt for a wrong line stays.
   - Rewrite every test that asserted acting out at the solution, `?`, `x = ?` or hidden readouts; don't delete them silently.
   - The pin test's own weighing beyond the dial stays for later rooms. No room 1–4 has it after AC 3.
2. **Simplify before answering.**
   - Applies in a stage whose `ways` don't include `try` (room 4).
   - An answer line `x = n`, typed or filled into a blank, is accepted only if the last committed line already has x terms on one side only and a single number on the other. `2x = 18` and `18 = 2x` count; `2x + 5 = 23` doesn't.
   - Otherwise it is refused like an incomplete line: not stored, the draft wiggles, no jam.
   - A refusal tag shows, from `hr.ts`: `Prvo pojednostavi vagu.`
   - Simplifying lines he types himself count, as well as Balance's.
   - Stages whose ways include `try` are unchanged.
3. **Room 4: one new idea, Balance.**
   - Remove room 4's pin and poke window. The dial still runs 0–6.
   - Room 4 keeps the notebook's blanks for the last two lines. Once the last committed line has x alone (coefficient 1) against a number on the pans, the notebook shows `x = ☐`. After it, the check template `2 · ☐ + 5 = 23`.
   - Update the content tests and their GDD-table expectations. The main session updates the GDD's room 4 row (pin: none) and its fading row.
4. **The `answer` handover.**
   - When the pans show x alone against a number and no answer line is written, the notebook's `x = ☐` pulses. Tag at the notebook: `x je sam na vagi. Upiši koliko je x.`
   - Like the other handovers: once per game, and it returns after 60 s idle. Add it to `room/handover.ts` in its place in the order, before `check`.

### B. The goal card and the hint button (main checkout, `epic-1`)

5. **The goal card.**
   - In a stage where the tray is offered, a small paper card stands in the scene, labelled `Cilj: x sam`.
   - It shows a miniature scale: one x-gear alone on one pan, a weight marked `?` on the other.
   - When the pans match it (x pieces with count 1 on one side, a single number piece or none on the other), the card marks it by shape: a heavier frame and a tick, plus the lamp light already used for right pins. Shape is the signal, colour only adds to it (NFR4).
   - It never covers the pans, the dial, the tray, the splitter or the handover tags at 640 × 360 and on the tablet. Add a layout test.
   - Drawn in code (Pixi, `ui/scene`), text from `hr.ts`.
6. **The hint button.**
   - A round HTML button with `?`, at least 48 CSS px, directly under the reset control in the top-left corner, clear of the splitter's holder. It never takes focus, acts on release, and is available in every phase where he can act.
   - Hints are free and never recorded or paid (GDD Player Assistance).
   - **First press:** shows the current step's handover tag (`room/handover.ts`), even if it was met. If none applies, the tag for the step he is on is chosen by the same ordering.
   - **Second press while that tag shows:** shows the exact next move, from a pure `room/hint.ts` built on `math/steps.ts` `nextStep`:
     - **Try** (the slider): the knob's ghost moves two notches the right way and back, with the tag `Pomiči klizač udesno.` or `ulijevo`. Once the pans are level, the notebook blank pulses with `Upiši x = 5.`
     - **Balance, add or take a number:** a ghost of the right tray piece, for example the −5 balloon, rises from the tray and glides onto the scale, splitting into one copy per side, then fades. Tag: `Skini 5 s obje strane: stavi balon −5 na vagu.` or `Dodaj …` for a weight.
     - **Balance, split:** a ghost of the splitter frame glides onto the scale. Tag: `Podijeli obje strane s 2.`
     - **Answer:** the blank pulses with `Upiši x = 9.`
     - **Check:** the template pulses with `Prepiši prvu jednadžbu, a umjesto x upiši 9.`
     - **Pin:** the pin tag again. A prediction has no next move to show.
   - A ghost is presentation only: no store change, no event. Any action of his ends the hint. Texts are in `hr.ts`.
7. **The automatic 60 s hints stay as they are.**

### C. All

8. `npm run check && npm test && npm run build` pass.
   - `store/playthrough.test.ts` plays room 4 the new way: −5, split by 2, `x = 9` into the blank, then the check line. It also covers a refused early `x = 9`.
   - Checked in a browser at 1280 × 800 and 640 × 360.

## Tasks / Subtasks

- [ ] Lane A: AC 1–4
- [ ] Lane B: AC 5–7
- [ ] Merge; checks green (AC 8)
- [ ] One review, one fix pass
- [ ] Headless play-through, rooms 1–4

## Dev Notes

**File ownership:**

| Lane | Owns |
|---|---|
| A | `src/room/scale.ts`, `src/room/tray.ts`, `src/room/splitter.ts`, `src/room/notebook.ts`, `src/room/fading.ts`, `src/room/dial.ts`, `src/room/handover.ts`, `src/ui/scene/scale/Dial.tsx`, `dial-label.ts`, `Scale.tsx`, `src/content/rooms/r04-water-wheel.ts`, the content tests, the notebook UI only if the blanks need it |
| B | new `src/room/hint.ts`, new goal card files (skin, layout, component), new `src/ui/common/HintButton.tsx` and its CSS, the ghost animations (new components in `ui/scene/scale/`), `SceneRoot.tsx`, `App.tsx` mounting |

- Lane B reads `room/handover.ts`'s exported API (`handoverView` and the handover ids) and `math/steps.ts`. Don't change their signatures. Lane A only adds the `answer` id.
- Shared files (`hr.ts`, `tuning.ts`, `room/types.ts`, `store/*`): add your own keys and branches only.
- Builders don't edit planning documents.
- Croatian text only in `hr.ts`. Pixi only in `ui/scene`. Shape carries state. No praise text. StrictMode-safe.

## Dev Agent Record

(Each lane adds its own section: Calls, files, checks.)
