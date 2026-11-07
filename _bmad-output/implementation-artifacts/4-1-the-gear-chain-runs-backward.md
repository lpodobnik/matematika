# Story 4.1: The gear chain runs backward

Status: done

## Story

As Luka's son,
I want to undo the machine one link at a time,
so that I see why undoing works: it is balancing both sides.

**Covers:** FR12 (links, inverses, jams), FR13; FR20 (Undo `auto`, `blanks`, `blank`); architecture `math/chain.ts`, The gear chain.

## Acceptance Criteria

1. **Given** a stage whose ways include Undo, with the gear chain earned, **then** a strip at the top of the notebook column shows the pans' equation as links, `x → · 4 → + 9 → 41`, whenever x is there once, on one side, against a number. Links already undone in the stage are dark.
2. **When** he taps the last link, **then** a picker asks for an operation (`+`, `−`, `·`, `:`, `… − ☐`) and a number he types on the pad. It never offers the answer.
3. **When** he runs the link's inverse, **then** the pans take the result at the slider's x, the link goes dark and the output turns.
   - With Undo `auto`, the move and its result are written: `4x = 41 − 9`, `4x = 32`.
   - With `blanks`, the move is written and the result comes as `4x = ☐`.
   - With `blank`, nothing is written and he writes the lines himself.
4. **When** he runs a wrong one, **then** the move is written into the draft, acted out on the pans, tipped, and the machine jams like a wrong line, until he deletes it.
5. **And** the hint ladder, the help ladder and the worked example know Undo. The chain's first use has a handover tag. Undo lines are saved and resumed, and logged as a way used.

## Calls made (for Luka's veto)

- **The chain sits at the top of the notebook, not under the scale.**
  - The scene has no free space under the scale, since the dial takes it, and the phone has none at all.
  - The notebook column also ties the chain to writing.
  - It is HTML, like the map and the fights (epic 3's call 1).
- **He types the link's number on the notebook's own pad.** While the picker is open, the pad's other keys are off, and enter runs the link.
- **The operations are `+`, `−`, `·`, `:` and `… − ☐`, a number minus the chain.**
  - Room 9's `135 − ☐` link is undone by `135 − ☐` itself (GDD).
  - Every operation is always offered, so the picker gives nothing away.
- **The dark links come from the pans, not from a record of runs.** When the pans' links are the first links of the stage's equation, the rest are dark. So a line he types himself (`4x = 32`) darkens a link too, and a Balance move that makes a different chain shows no dark links.
  - Nothing new is saved.
  - On a reload the strip is exactly what the pans show.
- **A wrong run jams exactly like a wrong line**, as the architecture says.
  - Its move is written into the draft (`4x = 41 + 9`), struck with the wavy underline.
  - The pans act it out.
  - The pad's delete takes it back.
  - It counts toward the help ladder's jams.
- **The chain only runs with nothing half-written:** no draft, no blank waiting, nothing tapped on the scale, and no check line yet.
- **Undo `auto` gives the last two lines as blanks once x is alone,** as Balance `auto` does (story 1.16's rule, now for both ways).
- **Undo `blanks`** writes the move and gives the result as a blank (`5x = ☐`). After `x = ☐`, the check line comes as a blank too.
- **The hint prefers Undo** where the stage lists it and the pans are a chain. The chain is the new idea from room 8 on. Balance still wins once he has made a Balance move in the stage.
  - Its move is "Dodirni kariku + 9 i odaberi − 9.", with the last link pulsing.
- **A tag about the chain hangs at the chain,** as one line under its links, not as a card under the lines. On a phone there was no room for both: the card pushed the pad's bottom row off the screen.
  - On a phone, while he picks, the picker takes the lines' place.
  - On a phone with the chain's tag up, line 0 scrolls out of view, but the chain shows the same equation.
- **The chain's handover comes before the tray's,** so in room 8, where the tray is also offered, the chain's tag shows first.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/math/chain.ts` (pure):
  - `chainOf`, `lastLink`, `inverseOf`, `undoLast` (the move and its result), `undoneLinks`;
  - `linkText`, the chain's school notation.
- `src/math/steps.ts`: Undo's canonical lines (`undoStep`). `StepWay` now includes `undo`, so the content tests and the line table check Undo too.
- `src/room/chain.ts` (pure): `chainOffered`, `chainWorks`, `runLink`, `chainView`, `undoFading`.
- The store:
  - `chain/run` action;
  - the `chain` handover (`room/handover.ts`) and its text;
  - the hint's `chain` move (`room/hint.ts`, `ui/common/hint-text.ts`);
  - `blanksOnceAlone` for Undo `auto` (`room/fading.ts`);
  - a resumed Undo line no longer counts as a Balance move (`room/resume.ts`).
- `src/ui/notebook/ChainStrip.tsx` and `notebook.css`. The notebook routes the pad to the picker while it is open.

### Tests

- `src/math/chain.test.ts`: the GDD's chains, x on the right, not-chains, every move and result keeping the solution, `135 − ☐`, wrong choices, dark links.
- `src/math/steps.test.ts`: Undo's canonical lines for `2x + 7 = 25` and `135 − 5x = 100`.
- `src/room/chain.test.ts`: the view; not before the chain is earned; a right run in all three modes; the blanks; a wrong run's jam and delete; `135 − ☐`; the handover; the hint; resume.
- `src/ui/notebook/ChainStrip.test.tsx`: the strip, dark links, the picker offering every operation, 48 px, the pick's keys, the pad's other keys off.
- Played with room 8 (story 4.3).

### Review (one pass, with story 4.3) and fixes

The review ran every scenario as a probe in the scratchpad, and found these fine:
- x on the right;
- `135 − ☐` and `x : 3 + 1 = 5`;
- `· 0` and 7-digit numbers;
- resume in `auto`;
- the dark links;
- the handover order;
- the hint's inverse;
- the worked examples;
- saving through `LineAccepted`;
- the picker closing on a jam, a tapped line, the check line, a stage change and leaving.

It found nine defects, all fixed:

1. **`: 0` crashed the game:** the jammed line couldn't be weighed. A run that divides by zero is now refused, as enter refuses such a line.
2. **With Undo `blank`, deleting a jam threw away his runs.** The pans went back to the last committed line. A chain jam now keeps the pans from before it. One delete takes the whole wrong move back to them, and a key he types after it stays.
3. **With Undo `blanks`, a reload lost the blank** (`4x = ☐`, or `x = ☐` and the check line). They are rebuilt on resume (`undoBlanksAfter`).
4. **The hint pointed at the splitter while `4x = ☐` waited.** It now points at the blank: "Lanac je napravio korak. Upiši što je ostalo na vagi.", then "Upiši 32 u prazno polje."
5. **On a phone, touch targets were 40–44 px.** They are 48 px. While he picks, the picker takes the place of the lines and the links, and a chip shows the link being undone. The phone's rules are tested too.
6. **The picker went stale after a Balance move.** It now remembers the link and output it was opened for, and closes when they change.
7. **The empty draft line pulsed while the tag said to tap the link.** It no longer pulses for a chain tag.
8. **A computer's keyboard couldn't pick an operation.** `+`, `−`, `·` and `:` now pick one, and Escape closes the picker. The `… − ☐` operation still needs a tap.
9. **A move he typed himself (`4x = 41 − 9`) turned the chain off, with the wrong reason.** The chain now works its number side out: output 32. The hint goes on with Undo.

Minor notes:
- The dark links tell a screen reader they are undone.
- The idea card was reworded: "− poništava +, a : poništava ·. Napravi to na objema stranama i vaga ostaje ravna."
- New tests cover `: 0`, the blank-mode delete, resume with `blanks`, the hint's blank, a typed move, the keyboard's operations, the phone sizes and the Undo worked example.

Left as they are:
- `LineWrong` doesn't say whether a jam came from the chain.
- With Undo `blank` the runs aren't saved, so a reload goes back to the last written line. Balance `blank` behaves the same way.

### Checks

- `npm run check`, `npm test` (2,377 passed, 2 skipped) and `npm run build` pass.
- Room 8 played headless again at both sizes after the fixes.

