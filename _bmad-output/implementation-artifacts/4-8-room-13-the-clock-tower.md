# Story 4.8: Room 13, the clock tower: the drum and the line reveal

Status: done

## Story

As Luka's son,
I want to see what my tries draw,
so that I find out why these equations are called linear.

**Covers:** FR24 (the drum, the next-dot pin, the line reveal); FR22; GDD room 13 and the Line reveal; narrative, the climax.

## Acceptance Criteria

1. **The drum** (room 13, earned in room 12) sits at the top of the notebook.
   - It draws a dot for each x the slider has stood at: (x, the left side there).
   - The right side is drawn as a dashed level line.
   - The dots are kept through a reset.
2. **Machine 1, `3x + 5 = 20` (x = 5):**
   - The poke window is 0, 1 and 2, with dots at 5, 8 and 11.
   - Before the slider opens, he pins the next dot at x = 3, choosing among 14, 17 and 20, and confirms.
   - The machine turns the slider to 3, so the dot shows; a right pin pays its parts.
   - The slider is then his. Once the machine locks, the line through the whole dial is drawn, and it crosses the level line at the answer.
3. **Machine 2, `50 − 4x = 34` (x = 4):** the same, with a falling line (50, 46, 42, then 38, 34 or 30).
4. **After the restart, the story card:**
   - Nikola: "Sve točkice leže na jednoj liniji. I cijela četvrt opet radi!"
   - Faust: "Zadnji trag na bubnju vodi ravno do ljevaonice. A ona je zatvorena."
   - Then the reveal card, "Linearna jednadžba": "Točkice leže na pravcu. „Linearna” dolazi od „linija”: zato se ove jednadžbe zovu linearne."
   - On the map the clock tower is restored, and the district is whole.
5. **Checks:**
   - pure tests, content tests and line rows;
   - the store's play-through runs all 13 rooms;
   - a headless play at both sizes, with real taps on the drum's heights and Potvrdi.

## Calls made (for Luka's veto)

- **The drum is SVG at the top of the notebook,** like the chain and the stories. The scene has no room for it beside the scale, and a phone has none at all.
- **The GDD's poke window is "the whole dial, with the drum". Here it is the first 3 notches, then the next-dot pin.**
  - With the whole dial open first, the dots would already show where the line crosses, and the pin would predict nothing.
  - Three dots are enough to see the step.
  - After the pin, the whole dial opens.
- **The next dot is one of three heights: the right one, and one and two steps past it, as if the dots sped up.**
  - So the right one is the lowest on a rising line (14 of 14, 17, 20) and the highest on a falling one (38 of 30, 34, 38).
  - He has to read which way the dots go, and by how much.
  - The heights first built had a wrong one on each side, which always left the right one in the middle (see the review).
  - The machine tests the pin by turning the slider to the next x, so its dot appears where it really is.
  - His guess then stays as a ring beside it, dashed if wrong, and the height that was right is underlined.
  - Potvrdi waits until all three of the poke window's dots are on the drum.
- **The line is drawn only once the machine locks.** Until then the drum shows only what he has tried. Lit, it runs from one end of the dial to the other.
- **The reveal is the room's idea card, "Linearna jednadžba".** It shows after the restart, as every room's card does: "only then does the explanation appear" (GDD).
- **The dots aren't saved.** On a reload the drum starts again from where the slider stands. They are only a record of his tries.
- **On a phone,** the drum is a strip 48 px tall, and line 0 makes room for it (the chain shows the same equation). The pad's bottom row loses a few pixels, but it can still be tapped.
- **The map draws the clock tower** with a clock face. Restored, the face is lit and the hands point up.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/room/drum.ts` (pure):
  - `recordDial`, `nextDotX`, `nextDotOptions`, `rightDot`, `drumView`;
  - `StageState.tried`, which arrival starts with the starting x and reset keeps.
- `src/store/reducer.ts`: every room step records the slider's x (`recordDial`).
- `src/room/pin.ts`:
  - the `dot` track;
  - the `next-dot` pin, supported and resolved;
  - the machine's test turning the slider to the next x.
- The scene's pin, its confirm and the parts' flight stay out for a drum pin. The hint's question hangs at the notebook.
- `src/ui/notebook/DrumPanel.tsx`, `Notebook.tsx`, `notebook.css`.
- `content/rooms/r13-clock-tower.ts`. `ideaIds` gets `linear`.
- `hr.ts`: `drum`, the pin's question, the story lines and the card.
- `ui/map/glyphs.tsx`: the clock tower.

### Tests

- `src/room/drum.test.ts`:
  - the next dot's x and its three heights in both machines;
  - the right one;
  - the dots and the level line;
  - the machine's test leaving the fourth dot;
  - the dots kept through a reset;
  - the line once locked (falling: 50 to 10);
  - no drum elsewhere.
- `content/rooms/rooms.test.ts`: the GDD row.
- `math/lines.table.ts`: both machines, every way.
- `store/playthrough.test.ts`: all 13 rooms. `room/pin.test.ts`: every pin kind is supported. `store/store.test.ts`: the room-not-in-content test now uses a shorter list.

### Checks

- `npm run check`, `npm test` (2,699 passed, 2 skipped) and `npm run build` pass.
- Headless play at 1280 × 800 and 640 × 360 (`play48.mjs`), screenshots looked at:
  - from rooms 1–12 done, the clock tower node;
  - machine 1's three dots, 14 flagged (a ring at x = 3), Potvrdi;
  - more dots, the answer and the check line, the line drawn;
  - machine 2's falling line crossing the level line at 4;
  - the story card with the reveal.
- Found and fixed while playing: on a phone, the drum, the chain and the pad overflowed the notebook.

### Review (one pass) and fixes

The review confirmed:
- `tried` needs no saving, and resume rebuilds it;
- reset, dev jumps and the cost of recording every step;
- `drumView`'s maths;
- the poke window, the tilts, and the machine's test at x = 3 (not level);
- the end of the game: the "to be continued" note, the foundry sealed, the play log;
- the card and the story lines.

It found eight issues. Seven are fixed:

1. **The right height was always the middle button.** It had a wrong one on each side, so he could tap the middle without reading the drum. It is now the lowest on a rising line and the highest on a falling one. A content test keeps it from always being in one place.
2. **His guess vanished at Potvrdi, and the drum never said right or wrong.** The pin's heights now stay after the test, with the right one marked, and his ring stays beside the real dot (dashed if wrong). On a phone, the heights make room for the pad once tested.
3. **On a phone the plot was about 120 px wide, with tiny dots.** The plot is now wide and short (300 × 72), so it fills the notebook's width at both sizes.
4. **The screen-reader label wasn't Croatian:** "s 3 točkica". It now reads "Bubanj: 3 točkice i crta ravnoteže", with the count's right form.
5. **Recording in the reducer was untested.** A store test now checks the dots after the pin's confirm (0, 1, 2, 3) and the right pin's payment.
6. **Content guards were missing.** A content test now checks that a next-dot pin:
   - has a drum;
   - lands on the dial, short of the answer;
   - offers three distinct heights.
7. *(Not fixed.)* **The dot at x = 3 appears as he confirms,** a moment before the knob gets there. Left as a known gap: it is cosmetic.
8. **He could confirm after one dot.** Potvrdi now waits for the poke window's dots.

Minor: the phone rule that hides the chain while he chooses also applies in rooms 10 and 11. The chain isn't offered during a pin anyway.

### Checks after the fixes

- `npm run check`, `npm test` (2,702 passed, 2 skipped) and `npm run build` pass.
- Room 13 was played again at both sizes.
- The rooms 8–13 browser test (story 4.9) passes at both sizes.

