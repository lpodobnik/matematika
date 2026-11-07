# Epic 4 report, 2026-11-07

Epic 4 is built: 8 of its 9 stories are done. Story 4.9 is at `review` until your son plays rooms 8–13 on the tablet. With this epic, all 13 rooms play through, ending in the line reveal. He can now:

- **Room 8, the tram:** run the **gear chain** backward. The chain shows the pans as links, `x → · 4 → + 9 → 41`. He taps the last link, picks an operation and types its number; a right inverse moves the pans and writes the lines, and a wrong one jams.
- **Room 9, the steam lift:** undo `135 − ☐` with `135 − 100`. The tray now holds an **x-gear**, which cancels the x-balloons on both sides.
- **Room 10, the market scales:** write a story as its equation, so the pans fill from it, then choose which of three stories fits a set of pans.
- **Room 11, the great wheel:** `5 905 − 27x = 316` on a slider that moves in tens, with − and + for single steps. A pin asks roughly how big x is. He simplifies first, and the slider is his check.
- **Room 12, the junction:** two **linked machines**. The first answer, 4, becomes the second machine's weight. The room earns the drum.
- **Room 13, the clock tower:** the **recording drum** puts a dot for each x on a plot. He pins where the next dot falls. The line appears, crossing the level line at the answer, and the card explains that "linearna" comes from "linija". The whole district is restored.

Epic 4 was first detailed into 9 stories (`_bmad-output/planning-artifacts/epics.md`, "Epic 4").

- **Branch:** everything is on the local branch `epic-1`, 96 commits ahead of `main` (epics 1–4), this report's commit included. `main` is untouched, and **nothing was pushed**.
- **Commits:**
  - 49e1482 (4.1 and 4.3) and df186a9 (4.1's lint);
  - b7b6acc (4.2 and 4.4);
  - 3ebf0cc (4.5);
  - e0d8765 (4.6);
  - 3d786d3 (4.7);
  - b4a8e45 (4.8);
  - and 4.9 with this report.
- **Checks on `epic-1` now:**
  - `npm run check` passes.
  - `npm test` passes: 2,702 tests, with 2 skipped on purpose.
  - `npm run build` passes: 2.28 MB, 0.38 MB of gzipped JavaScript.
  - `npm run e2e` passes at both sizes: rooms 1–7, the fights, and the new rooms 8–13.
- **How it was built:**
  - One story at a time, each played headless at 1280 × 800 and 640 × 360, with its screenshots looked at.
  - The chain (4.1) and the x-gear (4.2) were each built and reviewed together with the first room that uses them (4.3 and 4.4).
  - There were seven reviews (4.1 with 4.3, 4.2 with 4.4, then 4.5, 4.6, 4.7, 4.8 and 4.9), each followed by one round of fixes. Each review finished in 3–8 minutes.
  - The reviews found real bugs, all fixed. Among them:
    - a `: 0` run on the chain crashed the game;
    - the drum's right height was always the middle button;
    - the scene's slider jumped from 207 to 210 at a touch;
    - the browser test would have passed with a wrong pin.
  - Playing at 640 × 360 found more. Several of the new notebook cards were squeezed out on a phone, or pushed the pad off the screen. All were fixed, and the reviews found the rest.
- **No images were generated.** Rooms 8–13 use the same placeholder machine as rooms 1–7. The final look is epic 6.

## 1. On the tablet (only you can do this)

1. On the PC, on branch `epic-1`, in `C:\Users\lpodobnik\Claude\matematika`, run `npm run dev -- --host`. Open the `Network:` address in Chrome on the tablet, in landscape.
2. **His save carries over.**
   - After room 7, the game goes straight on to room 8, the next in play order.
   - Room 9 also opens then: its chain lock lifts and the road from room 3 reaches it.
   - Room 10 opens after room 8.
   - Room 11 opens once rooms 9 and 10 are both done, and room 13 after room 12.
3. **Story 4.9:** let him play. What to watch:
   - Does he find the chain at the top of the notebook and see what its links mean?
   - Does he pick the inverse, or try things?
   - Does he write room 10's story, or wait to be told?
   - In room 11, does he simplify, or drag in tens?
   - Does he read the drum's dots before pinning the next one?

   What he runs into becomes the next story. Then set 4.9 to `done` in `C:\Users\lpodobnik\Claude\matematika\_bmad-output\implementation-artifacts\4-9-play-rooms-8-13-on-the-tablet.md` and `sprint-status.yaml`.
4. **The dev panel** (backtick key, or `?dev` in the address) can jump to any stage of rooms 8–13.
5. **Still open from before:**
   - stories 2.13 and 3.7's tablet plays;
   - story 1.13's frame profile.

## 2. Calls for you (veto or confirm)

Each story records its calls under "Calls made". These are the ones that change what your son sees, or what later epics can do. My recommendation is in bold.

| # | Where | The call | Recommendation |
|---|---|---|---|
| 1 | 4.1 | The gear chain sits at the top of the notebook column, not under the scale. The scene has no free space there, and a phone has none at all. He types the link's number on the notebook's pad. | **Keep;** watch whether he connects the chain to the pans. |
| 2 | 4.1 | The chain offers every operation (`+`, `−`, `·`, `:`, `… − ☐`) and never the answer. A wrong run is written into the draft and jams like a wrong line; delete takes it back. | **Keep.** |
| 3 | 4.1 | Undo writes its lines in room 8, gives blanks in room 9, and is a blank page from room 10 (GDD Fading). Once x is alone, room 8 also gives the last two lines as blanks, as Balance's `auto` does. | **Keep.** |
| 4 | 4.2 | The x-gear lands only where its count cancels the x-balloons exactly; otherwise it slides back. | **Keep.** |
| 5 | 4.4 | From room 8 on the pin asks only "Gdje će vaga biti u ravnoteži?". He knows the flag by then, and the long question didn't fit on a phone in room 9. | **Keep.** |
| 6 | 4.5 | "Builds the pans from a story" means **he writes the story's equation, and the pans fill from it**. Only the story as it is told counts; a step such as `3x = 30` is refused with a tag. A builder that adds pieces to the pans is epic 5's. | **Keep;** say if you meant pieces. |
| 7 | 4.5 | The stories (placeholder) and their distractors for `5 + 2x = 19`: "5 jednakih zupčanika i kutija teška 2…", "Kutija teži 5. Kutija i 2 jednaka zupčanika…" (the one that fits), "Kutija teži 19…". | **Read them once** (`C:\Users\lpodobnik\Claude\matematika\src\content\text\hr.ts`, `stories`). |
| 8 | 4.6 | Room 11's slider runs **0–210, not the GDD's 0–300**. Past 218 the left side would weigh below 0. The pin's ranges stay the GDD's (under 100, 100–300, over 300). | **Keep.** |
| 9 | 4.6 | − and + sit as a row in the notebook (`− x = 207 +`), not on the dial's plate: on a phone there is no room beside the dial. | **Keep.** |
| 10 | 4.6 | In room 11, Balance's last split (by 27) is beyond the splitter's 9 parts, so he writes it, or uses the chain. | **Keep.** |
| 11 | 4.7 | **Linked machines are the room's stages, one after another**, not two scales at once. The first answer rides into the second machine's equation, and a card in the notebook shows the link. Epic 5's builder can link up to 3 machines the same way. | **Keep;** a real side-by-side view would need a new scene. |
| 12 | 4.8 | Room 13's poke window is 3 notches, not "the whole dial". With the whole dial open first, the dots would already show where the line crosses. The next dot is one of three heights: the right one, and one or two steps past it. | **Keep.** |
| 13 | 4.8 | The reveal is room 13's idea card, after the restart: "Točkice leže na pravcu. „Linearna” dolazi od „linija”: zato se ove jednadžbe zovu linearne." The drum draws the line once each machine locks. | **Keep;** read the line once. |
| 14 | all | Epic 4's new notebook pieces live in the notebook column, as HTML: the chain, the stories, the ranges, the − + row, the drum, and the link card (which only shows). The x-gear stays on the scene's tray. | **Keep;** epic 6 can restyle them. |

## 3. Known gaps

- **On a phone the notebook is tight.**
  - In room 10, the fitting story gets a scrollable sliver beside the chain and the pad.
  - While a story waits, a refused line only wiggles; its tag doesn't show.
  - In room 13, the pad's bottom row loses a few pixels.

  The tablet is clear of all three.
- **Every room draws the same placeholder machine.** The tram, the steam lift and the rest have no drawings of their own until epic 6; the map has a sign for each.
- **The drum's dots aren't saved.** On a reload the drum starts again from where the slider stands.
- In room 13, the next dot appears a moment before the knob reaches it.
- **All text is placeholder** until epic 6.
- **From earlier epics, still:**
  - two tabs at once overwrite each other's save;
  - a dev-panel jump out of a room drops that room's lines;
  - on a phone, the map's "to be continued" note partly covers lair 60's sign. It shows only on the final map, once all 13 rooms are done.
