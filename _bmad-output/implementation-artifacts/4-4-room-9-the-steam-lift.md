# Story 4.4: Room 9, the steam lift

Status: done

## Story

As Luka's son,
I want a machine where more x makes the pan lighter,
so that I see x can be taken away, and how to undo that.

**Covers:** FR20 (Undo `blanks`), FR22; GDD room 9; narrative, room 9.

## Acceptance Criteria

1. **The room** is in `content/rooms/r09-steam-lift.ts`:
   - `135 − 5x = 100` (x = 7);
   - slider 0–10, a poke window of 4 notches, and a pin where it levels;
   - all three ways can finish it: Undo `blanks`, and Balance and Try values on a blank page;
   - the tray has its x-gear (story 4.2).
2. **The chain** shows `135 − ☐`. Each run writes its move and leaves the result as a blank (`5x = ☐`). Once x is alone, `x = ☐` and the check line come as blanks.
3. **On the map** it is seen from room 3 with its chain lock (story 2.3), opens with the chain, and is restored once finished.
4. **Finishing it:** the story card has the First Automaton's notice and Nikola's line, and the "Oduzimanje nepoznanice" card.
5. **Checks:**
   - content tests and line-table rows;
   - the store's play-through runs rooms 1–9;
   - a headless play at both sizes.

## Calls made (for Luka's veto)

- **Stories 4.2 and 4.4 were built together,** as 4.1 and 4.3 were: the x-gear is first offered in room 9.
- **0.4° a unit:** 35 apart at 0 is 14°, and 85 against 100 at 10 is 6°.
- **From room 8 on, the pin asks only "Gdje će vaga biti u ravnoteži?"**, not "Postavi zastavicu na mjesto gdje…".
  - By room 8 he knows the flag.
  - On a phone, room 9's right pan rides high while he pokes, and its five balloons fill the left wall, so the long question's card fit nowhere.
- **The new idea is "Oduzimanje nepoznanice"** (x taken away): "Kad se x oduzima, veći x čini stranu lakšom. Zato 135 − 5x = 100 vraćaš sa 135 − 100."
- **Story lines (placeholder).** The narrative design says "automatons have sealed the steam lift, and the marks are bolder":
  - First Automaton: "DIZALO JE ZAPEČAĆENO PO KORACIMA. OTVARANJE NIJE PREDVIĐENO."
  - Nikola: "Pečat je pao. Ali tko lijepi te papire po cijelom gradu?"
  - Neither line mentions room 10, since rooms 9 and 10 come in either order.
- **The map draws the steam lift** as a cage between two rails: low and grey at first, then at the top, lit, with steam.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/content/rooms/r09-steam-lift.ts` and `index.ts`.
- `ideaIds` gets `take-away`.
- `hr.ts`:
  - the story lines and the card;
  - the short pin question (`room/pin.ts`, `level-x-short`);
  - the blank's hint.
- `ui/map/glyphs.tsx`: the steam lift.
- `math/lines.table.ts`: the r09 rows (Undo, Balance with the gear, the skipped step, and wrong lines including `+ 135`).

### Tests

- Content tests and line-table rows pass for all three ways.
- `src/store/playthrough.test.ts`:
  - rooms 1–9;
  - room 9's lines: `5x = 135 − 100` from the chain, `5x = 35` typed into its blank, `x = 35 : 5`, then his two lines.
- `ui/scene/scale/pin-tag-layout.test.ts`: room 9's tag clears the pans at both sizes.

### Checks

- `npm run check`, `npm test` (2,422 passed, 2 skipped) and `npm run build` pass.
- Headless play at 1280 × 800 and 640 × 360 (`play44.mjs`), screenshots looked at:
  - from rooms 1–8 done, on the map, the steam lift node;
  - the pin at 7;
  - the tray with its gear set to `5x`, dropped: `135 = 5x + 100`, level at 7, and the chain now `x → · 5 → + 100 → 135`;
  - after a reset, `135 − ☐` picked and 135 typed on the pad: `5x = 135 − 100` and `5x = ☐`;
  - 35 filled, `: 5` run with enter, then `x = ☐` and the check line filled;
  - the story card.
- **Known gap:** on the tablet, after the gear's drop, the right pan's stack (five gears and the 100) reaches up to the tray's bottom edge. They touch, but neither covers the other's numbers.
- Reviewed together with story 4.2; the fixes are listed there. The review found room 9's content, its fading and its hints at each point fine.

