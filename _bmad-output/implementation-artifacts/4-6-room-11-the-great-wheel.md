# Story 4.6: Room 11, the great wheel

Status: done

## Story

As Luka's son,
I want a machine whose numbers are too big to find by sliding,
so that I simplify first and use the slider only to check.

**Covers:** FR8 (room 11); FR21; FR22; GDD room 11 ("Too slow to drag"), and the design pass before epic 2 (the coarse slider).

## Acceptance Criteria

1. **The room** (`content/rooms/r11-great-wheel.ts`) is `5 905 − 27x = 316` (x = 207).
   - The slider moves in tens, and − and + step one at a time, so it reaches 207 slowly.
   - The poke window is its first 4 notches (0, 10, 20, 30).
   - The pin asks whether x is under 100, from 100 to 300, or over 300.
2. **Finishing it:**
   - Balance and Undo can finish it, each on a blank page, and the tray has its x-gear.
   - `x = 207` counts only after a simplified line.
   - The slider is his check.
3. **The pin's ranges** are flagged in the notebook, and once it is confirmed the range x is in stays there.
4. **Finishing it** brings the First Automaton's taunt and Nikola's line, the "Pojednostavljivanje" card, and the great wheel restored on the map.
5. **Checks:**
   - pure tests, content tests and line-table rows;
   - the play-through runs rooms 1–11;
   - a headless play at both sizes, with real taps on the ranges, the chain, the pad and −.

## Calls made (for Luka's veto)

- **The slider runs 0–210 in tens, not the GDD's 0–300.**
  - Past 218, the left side weighs below 0 (`5 905 − 27 · 300` is −2 195), and the content tests keep every readout at 0 or more.
  - The slider still reaches 207, as every room's must.
  - The pin's ranges stay the GDD's: under 100, 100 to 300, over 300.
- **The − and + sit in the notebook column, as a row: `−  x = 207  +`.** The GDD puts them "on its plate". On a phone, the dial's track fills the scene's width, so there is no room beside it. The row is off at the ends of the part he can reach (the poke window until the pin).
- **The range pin is placed in the notebook, like rooms 7 and 10's.**
  - The ranges read "x je manji od 100", "x je od 100 do 300" and "x je veći od 300", and 100 and 300 count as in the middle range.
  - He can flag it while still poking.
  - The machine doesn't turn the dial to test it.
- **The tilt is 0.0025° a unit:** 14° at 0, too small to see near 207. On a big-number scale the readouts tell him.
- **Balance can't finish with the tools alone.**
  - The x-gear's 27 and dragging the 316 off work.
  - The last split, by 27, is beyond the splitter's 9 parts, so he writes it.
  - The content test allows this only on a coarse dial.
  - The hint goes with the chain, which the room prefers anyway.
- **The new idea is "Pojednostavljivanje":** "Kad su brojevi preveliki za isprobavanje, pojednostavi jednadžbu korak po korak. Klizač je provjera."
- **Story lines (placeholder).** The narrative design calls for "the villain's mark on the great wheel is now a taunt":
  - First Automaton: "VELIKO KOLO NIJE ZA ŠEGRTE. BROJEVI SU PREVELIKI. ODUSTANITE."
  - Nikola: "Piše da odustaneš, Ivo. A kolo se vrti. Mislim da ga je strah."
- **On a phone, while he chooses a range,** the ranges take the place of the pad, the lines and the − + row. The scene's dial still turns in its poke window.
- **The map draws the great wheel** as a spoked wheel on its stand. Restored, its hub is lit and it turns.

## Dev Agent Record

### Built (main session, `epic-1`)

- `DialSpec.coarse`. `room/dial.ts`: `notchSize`, and the notch maths in it; `nudgeDial`. `room/room.ts`: the poke window in notches. `dial/nudge` action and reducer.
- The pin:
  - `room/pin.ts`: the `range` track, `bucketOf` and its resolution;
  - `room/range.ts`: `rangeView`;
  - the scene's pin and confirm stay out;
  - the hint's question is at the notebook.
- `ui/notebook/RangePanel.tsx` (`RangePanel`, `FineDial`, `rangeLabels`), `Notebook.tsx` and `notebook.css`.
- `content/rooms/r11-great-wheel.ts`.
- `hr.ts`: `range`, `fineDial`, the pin's question, the story lines and the card.
- `ui/map/glyphs.tsx`: the great wheel.

### Tests

- `src/room/range.test.ts`:
  - the coarse dial's notches and poke window;
  - − and + within reach;
  - 207 reached after the pin;
  - none on a plain dial;
  - the ranges, their ends, and the pin flagged and confirmed.
- `src/ui/notebook/RangePanel.test.tsx`: the − + row, off at the ends, and the ranges' words.
- `content/rooms/rooms.test.ts`: the GDD row, and a hand-written split allowed on a coarse dial.
- `math/lines.table.ts`: the r11 rows (Undo's and Balance's lines, wrong lines).
- `store/playthrough.test.ts`: rooms 1–11.

### Checks

- `npm run check`, `npm test` (2,549 passed, 2 skipped) and `npm run build` pass.
- Headless play at 1280 × 800 and 640 × 360 (`play46.mjs`), screenshots looked at:
  - from rooms 1–10 done, the great wheel node;
  - the poke window to 30, with the readouts (5 095 against 316);
  - "x je od 100 do 300" flagged and Potvrdi tapped;
  - the chain: `5 905 − ☐` with 5 905 typed, then `: 27`, the pans `x = 207`;
  - the slider at 210, then − tapped three times to 207, level;
  - the answer and the check line, the restart and the story card.
- Found and fixed while playing: on a phone, the ranges and Potvrdi were squeezed under the pad and the − + row.

### Review (one pass) and fixes

The review confirmed:
- the notch maths;
- the poke window's clamp;
- the reset;
- the range pin's ends, resume and reset;
- the answer refused until simplified;
- every readout from 0 to 210;
- the notebook's wiring and the phone CSS;
- the Croatian text.

It found three issues and one minor one, all fixed:

1. **A finger resting on the scene's slider at 207 jumped x to 210.** From between two notches, the first move rounded to the nearest one. A drag from between notches now sends nothing until the knob has moved half a notch.
2. **After a Balance move, the hint went silent at `5 589 = 27x`.** The split by 27 is beyond the splitter, and the chain was never offered instead. Where Balance can't go on, the hint now names the chain (`: 27`).
3. **Help level 4 had no worked example in room 11:** the left side's numbers are too big for a small one. It now works the same shape with small numbers, `50 − 3x = …`.
4. Minor: when a pin placed in the notebook paid (rooms 7, 10, 11), the parts' `+n` flew from a pin head in the scene that isn't there. It now rises from the counter.

New tests:
- the drag from between notches;
- the hint at `5 589 = 27x`;
- the example;
- the range panel rendered, with Potvrdi only once one is flagged and the confirmed range;
- − and + at the ends and while held;
- every coarse dial ending on a notch.

Left as it is: the range and story panels don't wiggle at hint level 1.

### Checks

- `npm run check`, `npm test` (2,556 passed, 2 skipped) and `npm run build` pass.
- Room 11 played again at both sizes after the fixes.

