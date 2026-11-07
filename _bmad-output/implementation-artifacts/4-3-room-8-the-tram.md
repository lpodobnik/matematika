# Story 4.3: Room 8, the tram

Status: done

## Story

As Luka's son,
I want a machine I can run backward to its start,
so that undoing becomes a way to solve.

**Covers:** FR8 (rooms 8), FR20, FR22; GDD room 8; narrative, room 8.

## Acceptance Criteria

1. **The room** is in `content/rooms/r08-tram.ts`:
   - `4x + 9 = 41` (x = 8), slider 0–10, a poke window of 4 notches, and a pin where it levels;
   - Balance and Undo can finish it, Undo `auto` and Balance blank page.
2. **The chain** (story 4.1) arrives with it.
3. **Finishing it:**
   - the story card has Nikola's and Penkala's lines, and the "Obrnute operacije" card;
   - on the map the tram is restored, and the armour 45 lair beside it can be seen.
4. **Checks:**
   - content tests and line-table rows;
   - the store's play-through now runs rooms 1–8;
   - a headless play at 1280 × 800 and 640 × 360 with real taps on the chain, the picker and the pad.

## Calls made (for Luka's veto)

- **Stories 4.1 and 4.3 were built together.** The chain can only be seen in a room that lists Undo, and room 8 is the first.
- **0.45° a unit,** so no notch hits the 15° clamp (32 apart at 0 is 14.4°).
- **Only Balance and Undo can finish it, as the GDD lists them:**
  - `x = 8` counts only after he simplifies (story 1.16);
  - the slider reaches 8 and is his check.
- **The new idea is "Obrnute operacije"** (inverse operations): "Suprotna operacija poništava korak: − poništava +, a : poništava ·. Na objema stranama vaga ostaje ravna."
- **Story lines (placeholder; narrative design: "people start asking for him by name"):**
  - Nikola: "Ljudi u tramvaju pitaju za tebe. Kažu: „Gdje je Ivo?“"
  - Penkala: "Vožnja unatrag do početka? Toga sigurno nema u Knjizi."
- **The map draws the tram** as a car on its rail; restored, its windows are lit and it moves off.
- **Tests that said "rooms 1–7" now read the rooms from content:** the next room, the "to be continued" note and the story lines. Adding rooms 9–13 won't need them rewritten.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/content/rooms/r08-tram.ts` and `index.ts`.
- `ideaIds` gets `inverse`.
- `hr.ts`: the story lines and the card.
- `ui/map/glyphs.tsx`: the tram.
- `math/lines.table.ts`: the r08 rows.
- `content/rooms/rooms.test.ts`: the GDD row, and Undo's fading by room (`auto` in 8, `blanks` in 9, blank page from 10).

### Tests

- Content tests and line-table rows pass, Undo's canonical solution included.
- `src/store/playthrough.test.ts`:
  - rooms 1–8;
  - room 8 written the Undo way (`4x = 41 − 9`, `4x = 32`, `x = 32 : 4` from `undo`, then his two lines);
  - no jams.
- Updated to read from content: `city/reach.test.ts`, `dev/dev-view.test.ts`, `ui/map/MapScreen.test.tsx`, `ui/story/story.test.tsx`, `ui/scene/scale/pin-tag-layout.test.ts`.

### Checks

- `npm run check`, `npm test` (2,368 passed, 2 skipped) and `npm run build` pass.
- Headless play at 1280 × 800 and 640 × 360 (`play43.mjs` in the scratchpad), screenshots looked at:
  - from rooms 1–7 done on the map, the tram node;
  - the poke window, the pin at 8 and its confirm;
  - the chain with its tag;
  - a wrong `+ 9` tapped through the picker: it jams, shown on the pans as 32 against 50, and is deleted;
  - `− 9` (run by its button) and `: 4` (run by enter): the moves and results are written, and the links go dark;
  - `x = ☐` and the check line as blanks, filled;
  - the restart, and the story card with its idea card.
- Found and fixed while playing:
  - the notebook looped React (a selector returned a new object each time);
  - on a phone, the chain's tag card pushed the pad off the screen.
- Reviewed together with story 4.1; the fixes are listed there. The review found room 8's content, story lines and play-through fine. After the fixes, room 8 was played again at both sizes.

