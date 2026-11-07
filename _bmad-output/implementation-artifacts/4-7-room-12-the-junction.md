# Story 4.7: Room 12, the junction: linked machines

Status: done

## Story

As Luka's son,
I want one machine's answer to drive the next,
so that I see an answer is a number I can use.

**Covers:** FR23 (linked machines); FR22; GDD room 12; narrative, room 12 (the recording drum).

## Acceptance Criteria

1. **The room** is `content/rooms/r12-junction.ts`, with two machines:
   - `2x + 3 = 11` (x = 4) feeds `3x + ☐ = 19`;
   - when the first locks, its answer rides into the second as a weight, so the second is `3x + 4 = 19` (x = 5).
2. **The notebook shows the link:**
   - while the first machine runs: "Rješenje ovog stroja ide u sljedeći: 3x + ☐ = 19";
   - while the second runs: "Rješenje prethodnog stroja je ovdje uteg: 3x + [4] = 19", with the 4 marked.
3. **Each machine has:**
   - a slider from 0 to 10;
   - a poke window of 4 notches;
   - a pin where it levels.
   - All three ways can finish it, each on a blank page.
4. **Finishing it:**
   - it earns the recording drum, which opens room 13;
   - the armour 60 lair beside it can be seen;
   - the story card shows Faust's and Nikola's lines and the "Povezane jednadžbe" card;
   - on the map, the junction is restored.
5. **Checks:**
   - content tests, including that the template filled with the first answer is the second machine;
   - line-table rows;
   - the store's play-through runs rooms 1–12;
   - a headless play at both sizes.

## Calls made (for Luka's veto)

- **A room's linked machines are its stages, one after another.** The GDD says they are shown together. Here the second machine arrives when the first locks.
  - This reuses the whole engine: stages, locks, saving and resuming.
  - Epic 5's builder can link up to 3 in the same way.
  - Showing all the machines at once would need a scene of two or three scales, and on a phone there is no room for it.
- **The fed equation is written in full in the room's data (`3x + 4 = 19`), with a `template` of `3x + ☐ = 19`.**
  - The content test checks that the template, filled with the first stage's answer, is the second stage's equation.
  - The engine never parses ☐, and the number can't be typed in by hand.
- **The link is shown as a card at the top of the notebook.**
  - In the first machine it shows the second machine's equation with its ☐ empty, so he knows his answer will be used.
  - In the second machine the ☐ is filled and marked.
- **0.9° a unit for the second machine.** 15 apart at 0 would otherwise hit the 15° clamp. The first keeps the default 1°.
- **The new idea is "Povezane jednadžbe":** "Rješenje jedne jednadžbe može biti broj u drugoj. Zato prvu riješi točno."
- **Story lines (placeholder; narrative design: "he finds the Clockmaker's recording drum"):**
  - Faust: "Ovo je Kristijanov bubanj. Pamti svaki x koji isprobaš."
  - Nikola: "Na njemu su točkice. Kao da nešto crta."
- **The map draws the junction** as two meshed gears, lit once restored.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/room/types.ts`: `StageSpec.fed`; `ideaIds` gets `linked`.
- `src/room/linked.ts`: `linkedView`.
- `src/ui/notebook/LinkedPanel.tsx`, `Notebook.tsx` and `notebook.css`.
- `content/rooms/r12-junction.ts`.
- `hr.ts`: `linked`, the story lines and the card.
- `ui/map/glyphs.tsx`: the junction.
- `math/lines.table.ts`: the r12 rows for both machines.

### Tests

- `src/room/linked.test.ts`: the link in each stage, and none elsewhere.
- `content/rooms/rooms.test.ts`: the GDD row, and the fed template.
- The line table: both machines, every way.
- `store/playthrough.test.ts`: rooms 1–12.

### Checks

- `npm run check`, `npm test` (2,626 passed, 2 skipped) and `npm run build` pass.
- Headless play at 1280 × 800 and 640 × 360 (`play47.mjs`), screenshots looked at:
  - the map after room 11, with the junction open (room 13 stays closed until room 12 is done, when the drum opens it at once);
  - the first machine with its link card, the pin at 4, and the lines;
  - the second machine with the 4 marked in `3x + 4 = 19`, the pin at 5, and the lines;
  - the story card.


### Review (one pass) and fixes

The review confirmed:
- the link card in every stage, after reset, resume and the dev jump;
- the drum earned once;
- room 13 seen after room 12, lair 60 open, and the "to be continued" note;
- the phone rules from stories 4.5 and 4.6 not catching the card;
- the content and line rows;
- the Croatian text.

It found one defect, and a missing test:
1. **On a phone the card showed only its lead sentence,** so the equation with its ☐, and later the marked 4, couldn't be seen. Fixed:
   - On a phone the card is now one line, the equation, and it never gives way.
   - Line 0, the same equation, makes room for it.
   - The notebook's gaps are a little tighter there, so the pad stays whole.
2. **Nothing tested that room 12 earns the drum.** The play-through checks it now.

Minor fixes:
- The ☐ reads "prazno mjesto" to a screen reader.
- The lead says "prethodnog stroja", so it also fits a third machine in epic 5.
- An unused attribute was removed.
- The map note in these checks was corrected: room 13 stays closed until room 12 is done.

### Checks after the fixes

- `npm run check`, `npm test` (2,626 passed, 2 skipped) and `npm run build` pass.
- Room 12 played again at both sizes.

