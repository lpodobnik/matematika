# Story 4.5: Room 10, the market scales: the story room

Status: done

## Story

As Luka's son,
I want to turn a story into pans and pans into a story,
so that I can move between a word problem and the maths.

**Covers:** FR21 (story); FR22; GDD room 10 and Room types: Story; narrative, room 10 (settling up).

## Acceptance Criteria

1. **Stage 1** (`content/rooms/r10-market-scales.ts`) opens with a story and empty pans: "Ključ košta 60 dijelova. Ključ i 3 jednaka zupčanika zajedno koštaju 90. Koliko košta jedan zupčanik?"
   - He writes the story as the notebook's first line, and the pans fill from it.
   - It counts as `60 + 3x = 90`, with terms or sides swapped.
   - A step (`3x = 30`) or the answer is refused with a tag ("Prvo zapiši priču onako kako je ispričana.").
   - A wrong story jams and the pans act it out.
   - Until the story is written, the dial, the tray, the splitter and the chain wait.
   - Then he solves it (x = 10).
2. **Stage 2** opens with the pans for `5 + 2x = 19` and three stories. Before the slider opens he flags the one that fits ("Koja priča odgovara vagi? Stavi zastavicu na nju.") and confirms it.
   - A right pin earns its parts.
   - Either way, the story that fits then stands alone.
   - He solves it (x = 7).
3. **The room:**
   - slider 0–15;
   - all three ways, each on a blank page;
   - the tray with its x-gear (from room 9).
4. **Finishing it:**
   - the story card has Penkala settling up and Nikola's line;
   - the "Jednadžba iz priče" card;
   - on the map, the market scales restored.
5. **Checks:**
   - content tests, including exactly one fitting story per choice;
   - line-table rows;
   - the store's play-through, rooms 1–10;
   - pure tests;
   - a headless play at both sizes with real taps on the pad and the stories.

## Calls made (for Luka's veto)

- **"Builds the pans from a story" means he writes the story's equation, and the pans fill from it.**
  - The GDD doesn't say how. Writing it is the step school asks for in word problems (Pillar 3).
  - The pans then act his line out, so a misread story (`60x + 3 = 90`) tips and jams where he can see it.
  - A piece-by-piece builder for the pans is epic 5's room builder, not built here.
- **Only the story as told counts as written:** the stage's equation up to commuted terms and swapped sides. A correct step such as `3x = 30` is refused with a tag, not jammed: it isn't wrong, it skips the story.
- **His written line stands in for line 0,** which stays hidden in the notebook, so the equation isn't shown before he writes it. Nothing new is saved: the story counts as written once a line follows line 0, so a reload keeps it.
- **The story stays at the top of the notebook,** on a white card. The three stories to choose from are buttons there too, as room 7's lines are (the scene's pin and its confirm stay out). Once one is flagged, "Potvrdi" sits under them.
- **The story pin opens before the slider.** There is no poke window, as the GDD's "the matching story" pin implies.
  - The machine doesn't turn the dial to test it.
  - Right or wrong, the fitting story then stands alone.
  - There is no other mark of whether he was right, apart from the parts counter, as in room 7.
- **The three stories for `5 + 2x = 19`** each mix up a different part (placeholder text):
  - "5 jednakih zupčanika i kutija teška 2 zajedno teže 19." (5x + 2)
  - "Kutija teži 5. Kutija i 2 jednaka zupčanika zajedno teže 19." (the one that fits)
  - "Kutija teži 19. Kutija i 2 jednaka zupčanika zajedno teže 5." (the sides swapped)
  - Each story's equation is in the room's data, so the content test checks that exactly one fits.
- **The tilts:** 0.45° a unit for the first stage (30 apart at 0 is 13.5°), and 0.8° for the second (16 apart at 15 is 12.8°).
- **The new idea is "Jednadžba iz priče":** "Ono što ne znaš postaje x. Ono što je jednako stavi s obje strane znaka =."
- **Story lines (placeholder).** The narrative design calls for "his first doubter settles up at the market, grudgingly":
  - Penkala: "Vaga na tržnici je točna. Dobro, Ivo. Priznajem."
  - Nikola: "Gospon Penkala je nešto priznao? To treba zapisati u Knjigu!"
  - Neither line refers to room 9.
- **On a phone:**
  - the story card gives way and scrolls inside itself before anything pushes the pad off the screen;
  - while the story waits, its tag (and a refusal's) stays hidden, since the story itself says what to do;
  - once the story is written, the card goes, making room for the chain;
  - while he chooses a story, the stories take the place of the pad and the lines.
- **The map draws the market scales** as a stall's hanging scales: tipped and grey, then level under a lit awning.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/room/story.ts` (pure): `storyWaits`, `writesStory`, `rightStory`, `storyView`.
- `src/room/types.ts`:
  - `StageSpec.story` and `StoryKey`;
  - the `story` refusal;
  - the `story` handover, first in the order.
- Wired in:
  - `room.ts`: the pans start empty;
  - `notebook.ts`: enter while the story waits, and the refusal's tag;
  - `dial.ts`, `tray.ts`, `chain.ts`: wait for the story;
  - `pin.ts`: the `story` track and its resolution;
  - `handover.ts`, `hint.ts` and `ui/common/hint-text.ts`: the story's tag and its move, "Zapiši priču kao jednadžbu: 60 + 3x = 90.";
  - the pin's question at the notebook.
- `src/ui/notebook/StoryPanel.tsx`, `Notebook.tsx` and `notebook.css`. `Pin.tsx` and `PinConfirm.tsx` stay out for a story pin.
- `src/content/rooms/r10-market-scales.ts`.
- `hr.ts`: `stories`, the pin's question, the refusal, the tag, the hint, the story lines and the card.
- `ui/map/glyphs.tsx`: the market scales.

### Tests

- `src/room/story.test.ts` (7):
  - the empty pans, with everything waiting;
  - the story written three ways;
  - a step or the answer refused with its tag;
  - a wrong story jams;
  - resume;
  - the fitting story;
  - the pin, flagged and confirmed.
- `content/rooms/rooms.test.ts`: the GDD row and exactly one fitting story.
- `math/lines.table.ts`: both stages' rows for every way, the story as told, and misread stories.
- `store/playthrough.test.ts`: rooms 1–10.
- Updated:
  - `pin.test.ts`: the story pin is supported;
  - `handover.test.ts`: the order;
  - `handover-tag-layout.test.ts`: the dial's tag doesn't apply in story stages;
  - `dev-view.test.ts`;
  - `ChainStrip.test.tsx`: the phone rules it reads.

### Checks

- `npm run check`, `npm test` (2,504 passed, 2 skipped) and `npm run build` pass.
- Headless play at 1280 × 800 and 640 × 360 (`play45.mjs`), screenshots looked at:
  - from rooms 1–9 done, the market scales node;
  - the story with empty pans;
  - `3x = 30` typed and refused with its tag, then deleted;
  - `60 + 3x = 90` typed: the pans fill, and the chain shows `x → · 3 → + 60 → 90`;
  - 10 on the dial, both lines;
  - stage 2's three stories, the second flagged with a tap, Potvrdi tapped;
  - 7 and both lines;
  - the story card.
- Found and fixed while playing:
  - Potvrdi beside the flagged story was cut off at the notebook's right edge;
  - on a phone, the story, the chain and a tag together pushed the page into scrolling.

### Review (one pass) and fixes

The review traced the empty pans `0 = 0` through every system and found nothing leaking:
- no `PansLevel`;
- no goal card;
- no answer handover;
- no chain.

It also confirmed:
- the story lines accepted and refused, and the jam;
- reset before and after writing;
- resume with a story pin;
- the dev panel jump;
- the notebook placement;
- the Croatian text.

It found six defects, all fixed:

1. **On a phone, the hint showed nothing before the story was written.** The rule that hides the story's tag also hid the hint's tag, which shares its card. It now hides only the handover's and the refusal's.
2. **After a reset, the splitter worked on the empty pans.** The reset kept `splitterSeen`, so a split on `0 = 0` counted as a Balance move. The splitter now waits for the story too.
3. **On a phone, the fitting story vanished once the pin was confirmed:** it was caught by the rule that hides the written story. That rule is now scoped to a story he writes (`data-build`).
4. **Help level 4 showed an unrelated worked example while the story waited.** It shows none until the story is written.
5. **On a phone, a notebook pushed aside in stage 1 hid stage 2's stories.** The notebook is always shown while a story pin waits.
6. **`60 + x + x + x = 90`, the cogs written one by one, was refused as "not the story".** It now counts as the story.

Minor notes:
- The unused `fits` text was removed.
- "kutija teška 2" replaces "kutija od 2".
- The card now says "s obje strane".
- New tests: the splitter, the chain and the example wait after a reset, and the cogs written one by one.

**Known gap, on a phone:**
- With the chain, its tag and the pad, the fitting story in stage 2 gets a scrollable sliver. The line he writes keeps its room.
- While the story waits in stage 1, a refused line only wiggles; its tag doesn't show.

### Checks

- `npm run check`, `npm test` (2,506 passed, 2 skipped) and `npm run build` pass.
- Room 10 was played again at both sizes after the fixes.

