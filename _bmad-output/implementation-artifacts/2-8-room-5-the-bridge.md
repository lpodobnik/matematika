# Story 2.8: Room 5, the bridge

Status: done

## Story

As Luka's son,
I want to predict what a change does without solving again,
so that I see what the numbers in an equation do.

**Covers:** FR21 (predict), FR22; GDD room 5.

## Acceptance Criteria

1. **The room** (`content/rooms/r05-bridge.ts`):
   - Stage 1: `3x + 4 = 22` (x = 6), a slider 0–10 with a poke window of 4 notches (0–3), and a pin where it levels.
   - Stage 2: the change, `3x + 4 = 25` (x = 7), `change: { from: 22, to: 25 }`. The pin comes before the slider opens.
   - Both stages: ways Try values and Balance, Balance fading `auto`, Try values faded to a blank page (the GDD's fading table, room 4 on). The check line comes as a blank after the answer; after a Balance move that leaves x alone, both lines do.
2. **The pins.** He pins where it levels; the machine tests the pin. After the change he pins where it levels now, before the slider opens.
3. **The change has its own tag.** The pin's question in stage 2 is the change's own: "Teret se promijenio. Gdje će vaga sada biti u ravnoteži?"
4. **The change shows.** Stage 2's slider starts where stage 1 levelled (6), so the new load tips the scale away from level: 22 against 25.
5. **The map.** Room 5 opens with Balance, beside room 2. Its restart lowers the bridge on the map: a lit deck with railings, where it stood raised. After its restart, nothing is left to play, so the map shows "Nastavak slijedi…".
6. **Checks.**
   - Content tests (the room table), line-table rows for both stages (canonical Try and Balance solutions, skipped steps, wrong lines including the old answer and the old load).
   - Pin tests (the change's question; the starting slider), the pin tag's layout clearing the pans, dial and readouts at both sizes.
   - The play-through now runs rooms 1–5.
   - A headless play-through at 1280 × 800 and 640 × 360, from a save with rooms 1–4 done, to the map. Screenshots looked at.

## Calls made (for Luka's veto)

- **Stage 2 has no poke window.** He predicts from the change alone ("what a change does, without solving"), and the slider opens after the pin.
- **The change's tag is the pin's question,** since handover tags stay down while the pin is offered. It doesn't name the numbers; the pans and readouts show 22 against 25.
- **Stage 2's slider starts at 6,** the old answer, not at 0, so the change is seen as the scale tipping.
- **A tilt of 0.7° per unit,** so no notch hits the 15° clamp (21 apart at 0 is 14.7°).
- **Room 5's ideas are a prediction and Balance.** Both are usually explained by then (rooms 3 and 4), so it usually has no explanation card. "What a change does" isn't among story 2.6's seven ideas.
- **The machine's housing** in the scene is the shared one, like rooms 1–4's, until the room art (epic 6).

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/content/rooms/r05-bridge.ts`, added to `rooms`.
- `src/room/pin.ts`: the `change` question; `hr.pin.questions.change`.
- `src/room/room.ts`: `startingDial`; the pin tag's layout uses it (`pin-tag-layout.ts`).
- `src/ui/map/glyphs.tsx`: the bridge.
- Tests: the room table, line-table rows, pin tests, map test, play-through through room 5; the tests that ended after room 4 now go on to room 5.

### Review (one pass) and fixes

The review checked every path into stage 2 (from stage 1, a dev jump, a reload, a reset), the pin test, Balance and Try values in both stages, the tags, the cards, the map and the Croatian. It found:
1. In room 5 the hint's ghost always slid the knob, even mid-Balance, because the hint chose Try values whenever the slider reaches the answer. Room 5 is the first room with both ways and such a slider. The hint (and the level 4 example) now go on with Balance once he has made a Balance move in the stage (with a test).
2. Room 5 can be played before room 4, as Balance opens both (story 2.3's call). Left as it is, already in story 2.3's "Calls made".
3. Two doc comments still said the slider starts at its minimum. Both now point to `startingDial`.

### Checks

- `npm run check` and `npm test` (2,117 passed) and the build pass.
- Headless play (`play28.mjs`, scratchpad), at 1280 × 800 and 640 × 360:
  - from a save with rooms 1–4 done, the launch opens room 5;
  - the poke window 0–3 with the pin's question;
  - the pin at 6, `x = 6`, and 6 into the check line's blank;
  - the change: 22 against 25 at x = 6, with its own question, clear of both readouts;
  - the pin at 7, `x = 7` and 7;
  - the story card, then the map with the bridge lowered and "Nastavak slijedi…".
  - No console errors. Screenshots looked at.
