# Story 2.9: Room 6, the weighing yard

Status: done

## Story

As Luka's son,
I want to judge an equation without adding it up,
so that I learn equal means the same, not "do the sum".

**Covers:** FR21 (compare), FR22; GDD room 6.

## Acceptance Criteria

1. **The room** (`content/rooms/r06-weighing-yard.ts`):
   - `x + 56 = 58 + 27` (x = 29), slider 20–40, readouts hidden (`readouts: false`).
   - Ways Try values and Balance; Try values faded to a blank page, Balance `auto` (see Calls). The check line comes as a blank.
2. **The pin.** He pins x before anything moves (no poke window), with the readouts hidden, and the machine tests it. The slider's `x = …` plate still shows.
3. **The hidden readouts have their own tag:** the pin's question, "Vaga ne pokazuje zbrojeve. Usporedi utege: gdje će vaga biti u ravnoteži?"
4. **The map.**
   - Room 6 opens beside room 4.
   - It earns the workshop, which opens the workshop's gate (story 2.3): shown, named, and taking no tap until its epic.
   - The foundry gate shows from room 6, locked, with its plate `5 · x = 40`.
   - Its restart levels the yard's scale on the map.
   - With room 7 not built, nothing is left to play, so the map shows "Nastavak slijedi…".
5. **Ideas:** `compare`, with its explanation card "Usporedba" (story 2.6) after Faust's lines.
6. **Checks.**
   - Content tests and line-table rows: answer, check, the sum line, the comparing line `x = 27 + 2`, and wrong lines (added up, the 2 left out, the 2 the wrong way).
   - The pin question test; the map test for the workshop and foundry.
   - The play-through now runs rooms 1–6.
   - A headless play-through at 1280 × 800 and 640 × 360 from a save with rooms 1–5 done, to the map. Screenshots looked at.

## Calls made (for Luka's veto)

- **Balance `auto`, not the GDD's `blanks`.** Balance `blanks` isn't built: it would have him fill in each move's numbers, and filling `x = ☐` after a float of 56 means working out 58 + 27 − 56, the sum the room is about not doing. The fading test records room 6 as the exception. Room 7 still has `blanks` in the GDD, for story 2.10 to decide.
- **The hidden readouts' tag is the pin's question,** as with room 5's change, since handover tags stay down while the pin is offered.
- **No poke window:** "he pins x before anything moves". The slider starts at 20.
- **The workshop node shows but takes no tap** (story 2.3's call), since the workshop's screen is a later epic.
- **On a phone,** the wide 20–40 slider puts the pin's holder just beside the map button. They touch but don't overlap.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/content/rooms/r06-weighing-yard.ts`, added to `rooms`.
- `src/room/pin.ts`: the `hidden` question; `hr.pin.questions.hidden`.
- `src/ui/map/glyphs.tsx`: the weighing yard.
- Tests: the room table and fading exception, line-table rows, pin and map tests, the play-through through room 6, and expectations that ended after room 5.

### Review (one pass) and fixes

No correctness bugs. The review confirmed nothing leaks the hidden totals, both ways reach `x = 29`, the comparing line is accepted, and the map after room 6 is right. It found:
1. The question said "Brojki nema" (there are no numbers) while the weights show 56, 58 and 27; only the totals are hidden. It now reads "Vaga ne pokazuje zbrojeve. Usporedi utege: gdje će vaga biti u ravnoteži?"
2. Level 4's worked example dropped the right side's two terms and modelled subtracting. For a compare stage it now compares too: `x + 36 = 38 + 17`, `x = 17 + 2`, `x = 19`, then the check line (with a test).
3. The question read `readouts` alone. It now also counts a readouts blind, as the scale does.
4. The unused `x-hidden` pin kind and the comment saying compare pins come later are gone.

Kept, for Luka's veto: after the pin, Balance's float of 56 leaves a weight of 29 on the pan, so the answer can be read off it. The comparing happens at the pin, before anything moves; Balance stays as the GDD lists it.

### Checks

- `npm run check` and `npm test` (2,153 passed) and the build pass.
- Headless play (`play29.mjs`, scratchpad), at 1280 × 800 and 640 × 360: from a save with rooms 1–5 done, the launch opens room 6; the hidden-readouts question with only the pieces showing; the pin at 29, `x = 29` and 29 in the check line's blank; the story card; the map with the yard restored, the workshop seen and the foundry locked with its plate. No console errors. Screenshots looked at.
