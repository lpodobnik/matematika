# Epic 2 report, 2026-11-06

Epic 2 is built: 12 of its 13 stories are done. Story 2.13 is at `review` until your son plays rooms 1–7 on the tablet. Rooms 5–7 are new, along with:

- the city map with gates;
- his name and look;
- the story lines and explanation cards;
- the hint ladder;
- saving;
- the play log with your view at `#dnevnik`;
- the backup link;
- the finished style guide.

- **Branch:** everything is on the local branch `epic-1`, 82 commits ahead of `main` (epics 1 and 2). `main` is untouched, and **nothing was pushed**.
- **Checks on `epic-1` now:** `npm run check` passes (Biome, 323 files). `npm test` passes: 127 files, 2,225 tests, with 2 skipped on purpose (epic 1's fight table). `npm run build` passes: 2.20 MB, with 0.36 MB of gzipped JavaScript against the 1 MB target. `npm run e2e` (new) passes at both sizes.
- **How it was built:** one story at a time in this session. Each story got one review agent and one fix pass, then a headless play-through at 1280 × 800 and 640 × 360, with the screenshots looked at. One review agent stalled for two hours early on, and every review since has run with a 25-minute timer. No images were generated (2 of the 30 remain).

## 1. On the tablet (only you can do this)

1. On the PC, on branch `epic-1`, in `C:\Users\lpodobnik\Claude\matematika`, run `npm run dev -- --host` and open the `Network:` address in Chrome on the tablet, in landscape.
2. **Story 2.13:** let him play from a fresh start (the dev panel's new game, or a fresh browser profile). Rooms 1–7 should run from the map; after room 7 the map says "Nastavak slijedi…". What he runs into becomes the next story. Then set 2.13 to `done` in `C:\Users\lpodobnik\Claude\matematika\_bmad-output\implementation-artifacts\2-13-play-rooms-1-7-on-the-tablet.md` and `sprint-status.yaml`.
3. **Afterwards, your view:** open the same address with `#dnevnik` at the end. It shows his sessions, each room's first entry, finish, resets, ways, predictions and wrong lines. "Napravi vezu" makes a backup link of his save (without his name).
4. **Still open from epic 1:** story 1.13's frame profile (the overnight report, section 1, step 4).

To replay the headless test yourself: `npm run e2e` (about 2.5 min for both sizes; it starts its own server on port 5291, never 5173). Its screenshots of every room's end state land in `C:\Users\lpodobnik\Claude\matematika\test-results\`.

## 2. Calls for you (veto or confirm)

Each story records its calls under "Calls made". These are the ones that change what your son sees, or what later epics can do. My recommendation is in bold.

| # | Where | The call | Recommendation |
|---|---|---|---|
| 1 | 2.2, map | After a restart the next room loads (your veto). The map is for leaving a room, replaying one, and the end. | **Keep** (your call). |
| 2 | 2.2, map | The map is HTML buttons over an SVG, not Pixi as the architecture planned, so nodes are real 56 px buttons that a screen reader can read. | **Keep;** update the architecture. |
| 3 | 2.3, gates | Room 7 needs **both** rooms 5 and 6, as the GDD's order reads; the roads alone would open it after either. | **Keep.** |
| 4 | 2.3, gates | A tool opens both its rooms at once: Balance (from room 3) opens rooms 4 and 5 together, so from the map he could play room 5 before room 4. After a restart the next room in order still loads, so he only does that if he chooses to. | **Keep.** |
| 5 | 2.4, naming | Names are cut to 16 letters; there's no rename yet (the dev panel's new game starts over). | **Keep;** a rename can come with the workshop. |
| 6 | 2.5, story | All of `hr.ts` (room names, lines, cards) is placeholder text until epic 6. Room 1's card comes before the naming. | **Read the lines once** and veto any that jar. |
| 7 | 2.7, hints | Level 3 (the structure line) is for machine moves only. On a phone the notebook doesn't slide in on its own when a hint points into it. | **Keep.** |
| 8 | 2.9, 2.10 | Rooms 6 and 7 write their Balance lines `auto` (for him), not the GDD's `blanks`. Balance `blanks` isn't built, and in room 6 it would have him work out 58 + 27 − 56, the sum the room is about not doing. | **Keep;** the GDD follows. |
| 9 | 2.10, room 7 | The slider runs 1–10 (at 0, `3x − 1` would weigh −1). A wrong mistake-pin earns nothing, but the machine then strikes the planted line, so he goes on to the rewrite. | **Keep.** |
| 10 | 2.11, log | Your view is at `#dnevnik`, reached only by typing it. A restored backup keeps the device's own name and look; the link never carries them. | **Keep.** |
| 11 | 2.12, art | The apprentice stays grey (NFR12). The template backdrop is t22 resized in two bands, not a new image, so 2 images remain. | **Keep.** |
| 12 | 2.12, palette | Two UI-only tokens join the palette: `sheet` (white speech bubbles and cards) and `lampWash` (the met goal banner). There is one red (`jam`). | **Keep.** |
| 13 | 2.13, test | The browser test taps every DOM control for real, but reaches the Pixi canvas through the store, as the scene does. | **Keep.** |

## 3. Known gaps

- **Two tabs at once** overwrite each other's save and log; the last write wins (2.1, 2.11).
- **A dev-panel jump out of a room** drops that room's lines (2.2; dev only).
- Rooms 8–13 are not authored: past room 7 the map shows them as seen or closed.
