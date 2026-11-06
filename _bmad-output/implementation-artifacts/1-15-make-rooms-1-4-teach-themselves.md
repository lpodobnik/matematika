# Story 1.15: Make rooms 1–4 teach themselves

Status: in-progress

## Story

As Luka's son,
I want the machine to show me what to do next and pictures that mean what they look like,
so that I can play rooms 1–4 without my dad explaining them.

**Source:** his first play, relayed by Luka on 2026-11-06:
1. He didn't realise he had to move the slider.
2. When the scale was level, he asked "what now?".
3. He didn't know what to do with the pin. He called it the "balance balloon". Luka suggests: "Postavi hvataljku na mjesto gdje će vaga biti u ravnoteži".
4. He stopped again: how does he know the notebook is next?
5. He didn't realise the float was a balloon.
6. Luka: "Zdjelica" is a bad word. "Kad x raste" means nothing when x isn't shown anywhere. Nobody knows what the spring is. The two arrows are the same answer, because when the left goes down the right goes up.
7. Luka: "Aha, the spring is subtraction... why? It was a balloon a second ago."

And Luka in room 4:
- He put a weight on the left and the scale levelled: "there, solved".
- He couldn't put the splitter anywhere, and it doesn't look like splitting.
- After he put the balloon on the right, the scale looked nothing like the notebook's problem.
- "You can only do left what you do right."

**Covers:** the GDD's Balance row, Pieces table, Prediction and Player Assistance. The rule changes are in Dev Notes.

## Acceptance Criteria

### A. Pictures and the pin (worktree, branch `lane/1-15-art`)

1. **The pin is a flag.**
   - It is drawn as a small flag on a pole, in its holder and on the track, with the pin's number on the flag. Locked, the pole looks driven in. Right, the flag lights as today; wrong, it dims as today.
   - No round head is left; it must not be mistakable for a balloon.
   - The level-x pin's tag reads `Postavi zastavicu na mjesto gdje će vaga biti u ravnoteži.`
2. **Every minus is a balloon.**
   - The spring piece (`− x`, `− 5x`) is drawn as the same balloon as a float, carrying a small x-gear emblem. It is labelled `−x` or `−5x`.
   - Above 12 there is one large balloon showing the count, as large gears do.
   - A divided spring is drawn the builder's way, consistent with the divided gear; record the call.
   - No coil spring remains anywhere, the tray included.
   - The data kind stays `spring`; only the drawing changes.
3. **The balloon reads as a balloon.**
   - Balloons are bigger than in 1.14, with a shine highlight, a knot and a string.
   - They bob gently: a few scene units over about 2 s, as a container transform on the Pixi ticker, never a redraw. There is no bob under `prefers-reduced-motion`.
   - The same applies on the pans and on the tray.
4. **The direction pin asks about the whole scale.**
   - The question is `Kad x raste, na koju će se stranu vaga nagnuti?`.
   - The two places are small pictures of the whole scale tilted left and tilted right, labelled `lijevo` and `desno`.
   - The right answer is the side that goes down as x grows, computed from the equation and replacing `pan-down` / `pan-up`. Update the option type, room 3's data, `pinRight`, `hr.ts` and the tests. Room 3 stage 2 (`20 − x = 6`) answers `desno`.

### B. Balance (worktree, branch `lane/1-15-balance`)

5. **Every Balance move acts on both sides at once.** No one-sided move exists.
   - **Tray:** a weight or balloon from the tray, dropped anywhere over the scale (either pan, the beam, the space between), sends one copy to each side. Numbers on each side then combine as today.
   - **Dragging off:** dragging a number piece off a side takes the same number off both sides. It is the same move as dropping a balloon of that number.
   - **Splitter:** dropped anywhere over the scale, each side's pieces separate into n equal groups, and every group but one fades away, on both sides.
   - **Refused:** a move that would leave a side with no x below 0 is refused, and the piece slides back.
6. **The scale shows the true equation during Balance.**
   - From his first Balance move in a stage, the pans are weighed at the stage's solution, so they stay level. Readouts are hidden. This is acting out the last committed line, as today.
   - Any dial move returns to exploring, as today.
7. **x is on the gears.**
   - Every x-gear and x-balloon shows the letter `x` (a large one shows `27x`). Gears never show the dial's number, and never `?`.
   - The dial's value shows on the slider (lane C).
8. **Each move writes its lines straight away.** With Balance `auto`:
   - A tray move or drag-off writes the move as done, then the result: `2x + 5 − 5 = 23 − 5`, then `2x = 18`.
   - A split writes `2x : 2 = 18 : 2`. The result is written too, unless it is `x = n`, which he writes himself as today.
   - Both lines are `LineAccepted` with source `balance`, and `WayUsed` fires once per move.
9. **An uneven split is refused, not jammed.**
   - The pieces start to separate, show what is left over (for example `23` won't make two equal groups), and slide back together. Nothing is written.
   - The `split` jam kind, `liftSplitter` and the jam's blade drawing are removed, with their tests updated.
10. **The tools appear one at a time.**
    - **Tray:** offered in an open stage once Balance is earned and one of these holds:
      - its first use is already met;
      - the dial has been at its maximum this stage without levelling the pans;
      - a Balance move was made this stage.
    - **Splitter:** offered from the moment one side holds only x pieces with a count above 1, then for the rest of the stage.
    - Keep the exported names and signatures `trayOffered(room, tools)` and `splitterOffered(room, tools)`; lane C reads them.
11. **The tools look like what they do.**
    - **Tray:** a weight and a balloon, each with its number on the piece and a `+` directly above and a `−` directly below the number.
    - **Splitter:** a divider frame with n equal compartments, its number shown as `: n`, with `+`/`−` on the frame. n is 2–9 as today.

### C. Handovers and the slider (main checkout, `epic-1`)

12. **The slider shows x.**
    - Above the knob: `x = 9` while exploring, at least 20 CSS px, following the knob.
    - While the scale acts out (a written line or Balance), it reads `x = ?`, dimmed.
13. **One tag tells him the next step, once.**
    - A pure `room/handover.ts` decides which single handover applies now, from the room, `save.progress.firstUse` and the stage. A tag shows its text from `hr.ts`.
    - It looks like the 1.14 pin tag: a paper tag, at least 20 CSS px, never covering the pans, the dial or the pin's places at 640 × 360.
    - It goes away as soon as he does the step, which marks it met. After `tuning.hintIdleMs` (60 000) without any action of his in the stage, the current step's tag shows again, met or not.
    - Track `lastActionAt` on the stage from `ctx.now` on his actions, plus a `clock/tick` check.
    - The handovers:
      - **`dial`**, from arrival until he first turns a dial: the knob nudges one notch right and back by itself, every 4 s (presentation only, no store change). Tag by the knob: `Pomiči klizač – tako mijenjaš x.`
      - **`write`**, the first time his dial levels the pans and no answer line is written: the notebook's active blank or draft line pulses. Tag at the notebook: `Vaga je u ravnoteži. Upiši x u bilježnicu.`
      - **`check`**, after the answer line and before the check line: the check line pulses. Tag at the notebook: `Provjeri: uvrsti broj umjesto x.`
      - **`tray`**, when the tray is first offered: tag at the tray: `Klizač ne doseže. Stavi broj s police na vagu – ide na obje strane.`
      - **`balance-goal`**, after his first Balance move: tag above the scale: `Vaga zna koliki je x. Ostavi x samog na jednoj strani.`
      - **`splitter`**, when the splitter is first offered: tag at the splitter: `Razdjelnik dijeli obje strane na jednake dijelove.`
      - The pin's own tag (lane A's text) stays as it is.
    - Only one tag shows at a time: the earliest unmet step that applies.
    - Extend `FirstUseId` with the new ids. The existing first-use wiggles stay.

### D. All

14. `npm run check && npm test && npm run build` pass.
    - Replaced behaviour's tests are rewritten in place, not deleted silently.
    - `store/playthrough.test.ts` plays rooms 1–4 the new way. Room 4 takes 5 off with the tray, then splits by 2: `2x + 5 − 5 = 23 − 5`, `2x = 18`, `2x : 2 = 18 : 2`, then `x = 9` and the check line typed.
    - Checked in the browser at 1280 × 800 and 640 × 360.

## Tasks / Subtasks

- [ ] Lane A: AC 1–4
- [ ] Lane B: AC 5–11
- [ ] Lane C: AC 12–13
- [ ] Merge A and B into `epic-1`; checks green (AC 14)
- [ ] One review, one fix pass
- [ ] Browser check, rooms 1–4

## Dev Notes

**File ownership, so the three lanes can run at once:**

| Lane | Owns |
|---|---|
| A | `src/art/skins/scale.ts`, `src/art/skins/pin.ts`, `src/ui/scene/scale/Piece.tsx` (bob), `src/ui/scene/scale/Pin.tsx` (drawing and the option pictures), `src/room/pin.ts` (the direction option's meaning), `src/content/rooms/r03-sluice-gate.ts`, the `pin` texts in `hr.ts` |
| B | `src/room/tray.ts`, `src/room/splitter.ts`, `src/room/scale.ts` (labels, acting out), `src/room/notebook.ts` (balance lines), `src/art/skins/tray.ts`, `src/art/skins/splitter.ts`, `src/ui/scene/scale/Tray.tsx`, `Splitter.tsx`, `piece-drag.ts`, `splitter-drag.ts` and the drop targets in `Scale.tsx` |
| C | `src/room/handover.ts` (new), `src/room/first-use.ts`, the hint fields in `src/room/types.ts`, `src/ui/scene/scale/Dial.tsx` and `src/art/skins/dial.ts` (label, nudge), a new tag component, the notebook pulse in `src/ui/notebook/*`, the `handover` texts in `hr.ts`, the clock and idle handling in `src/store/reducer.ts` |

- Shared files (`hr.ts`, `tuning.ts`, `room/types.ts`, `store/reducer.ts`, `store/types.ts`, `SceneRoot.tsx`): add your own keys and branches only, and don't reformat others'. The merge joins them.
- Builders don't edit planning documents; the main session does.
- Croatian text lives only in `hr.ts`. Shape carries state (NFR4). No colour beyond today's lamp and jam (NFR12). No praise text (NFR13). Pixi rules as before. StrictMode-safe.

**Rule changes (main session writes them into the GDD and architecture):**
- Balance moves act on both sides at once.
- The scale is weighed at the true x during Balance.
- The split jam is replaced by a refusal.
- Every minus is a balloon; springs go.
- The pin is a flag. The direction pin asks which way the scale tilts.
- Gears show `x`, and the slider shows its value.
- One-time handover tags: the deliberate exception to "no instructions", which the son's first play showed he needs.

## Dev Agent Record

(Each lane adds its own section: Calls, files, checks.)
