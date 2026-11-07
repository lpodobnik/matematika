# Epic 3 report, 2026-11-07

Epic 3 is built: 6 of its 7 stories are done. Story 3.7 is at `review` until your son plays fights on the tablet. He can now:

- walk into an automaton's lair from the map and fight it: roll, place the dice as blade, charge and reach, set his blows and see `a · x + b` without the total, strike, and see the sum;
- win parts (base parts plus steam left, doubled on a clean cut), or lose a quarter of his unspent parts into a pile at that automaton, which a win brings back;
- see a beaten automaton wind down on the map for 15 minutes;
- win torn logbook pages and read them again from the map;
- buy the three upgrades at the old mechanic's counter (the workshop node, after room 6).

Epic 3 was detailed into 7 stories first (`_bmad-output/planning-artifacts/epics.md`, "Epic 3"). The rules themselves were built and balance-tested before epic 2 (`ahead-fight-rules.md`), so this epic is the screen, the store, the save and the map around them.

- **Branch:** everything is on the local branch `epic-1`, 88 commits ahead of `main` (epics 1–3). `main` is untouched, and **nothing was pushed**.
- **Commits:** 2b53291 (3.1), 3296b2c (3.2), 12205c3 (3.3), c2272b9 (3.4), 2d527a9 (3.5 and 3.6), and 3.7 with this report.
- **Checks on `epic-1` now:** `npm run check` passes (Biome). `npm test` passes: 2,297 tests, with 2 skipped on purpose (the fight table's one GDD number a faithful implementation can't reach). `npm run build` passes: 2.25 MB, 0.37 MB of gzipped JavaScript against the 1 MB target. `npm run e2e` passes at both sizes: rooms 1–7 and the new fights test, 2.6 minutes.
- **How it was built:** one story at a time. Each got one review agent (all finished in 3–5 minutes, inside their 25-minute timers) and one fix pass; 3.5 and 3.6 shared one review, since 3.6 only added the counter to the map. Every story was played headless at 1280 × 800 and 640 × 360 and its screenshots looked at. No images were generated (2 of the 30 remain).

## 1. On the tablet (only you can do this)

1. On the PC, on branch `epic-1`, in `C:\Users\lpodobnik\Claude\matematika`, run `npm run dev -- --host` and open the `Network:` address in Chrome on the tablet, in landscape.
2. **His save carries over.** If he has played rooms 1–2, the armour 20 lair ("Automat 20", next to the street lamps) is already open on the map; the armour 30 one opens beside the bridge (room 5), and the counter (the workshop) after room 6.
3. **Story 3.7:** let him fight. Things to watch: does he place dice on purpose (the big one on blade?), does he read `a · x + b` before striking, does a loss put him off, does he go back for his pile, and does he find the counter. What he runs into becomes the next story. Then set 3.7 to `done` in `C:\Users\lpodobnik\Claude\matematika\_bmad-output\implementation-artifacts\3-7-play-the-fights-on-the-tablet.md` and `sprint-status.yaml`.
4. **The dev panel** (backtick key, or `?dev` in the address) now has +10 / +50 / 0 parts, a fixed or random fight seed, and "wake lairs", if you want to try the counter or a lair again without waiting 15 minutes.
5. **Afterwards, your view** (`#dnevnik`): a new "Borbe" table by lair (fights, wins, parts won, parts left) and how many of his losses were followed by a fight at armour 45 or more.
6. **Still open from before:** story 2.13's tablet play of rooms 1–7, and story 1.13's frame profile.

## 2. Calls for you (veto or confirm)

Each story records its calls under "Calls made". These are the ones that change what your son sees, or what later epics can do. My recommendation is in bold.

| # | Where | The call | Recommendation |
|---|---|---|---|
| 1 | 3.1 | The fight is HTML and SVG, not Pixi, like the map: real buttons, readable, testable. The automaton and dice are placeholder drawings until epic 6. | **Keep;** update the architecture. |
| 2 | 3.1 | Placing is tap a die, then a slot; tapping a filled slot takes its die back. The blows dial is a row of numbered notches. | **Keep;** watch whether he gets it without help. |
| 3 | 3.1 | Walking out before a strike is free (GDD), and walking back in brings the same dice, so leaving is never a free re-roll. | **Keep.** |
| 4 | 3.1 | Lairs are named by armour on the map: "Automat 20", "Automat 30"… | **Keep.** |
| 5 | 3.2 | Leaving after a strike asks first, because it loses ("Ako sada odeš, automat pobjeđuje…"). | **Keep.** |
| 6 | 3.3 | The end shows what the win paid and why ("+7 dijelova", "3 za automat + 4 preostale pare", the doubling, the pile won back), or what stayed at the automaton. No praise anywhere. | **Keep.** |
| 7 | 3.3 | Your metric "fights at armour 45+ after a loss" reads: of his losses, how many were followed, before the next loss, by a hard fight ("1 od 2"). With rooms 1–7 the hard lairs can't be seen, so it reads 0 until epic 4. | **Keep;** say if you meant something else. |
| 8 | 3.4 | The torn pages live on the map (a button under the city's log), not in the notebook, which exists only inside rooms. A returned page shows by itself once the win's parts have landed. | **Keep.** |
| 9 | 3.4 | The three pages' text (placeholder): the First Automaton asks Kristijan why step three comes before step four; the steps stop working when the wheel wears; "learn why, not only how". | **Read them once** (`hr.ts`, `pages`). |
| 10 | 3.5 | The counter is the workshop node, so upgrades wait for room 6 though fights open after room 2. | **Keep;** room building joins the same place in epic 5. |
| 11 | 3.5 | Buying is one tap, no "are you sure". "Para +3" and "Trup +1", not "+3 pare" (which also reads as money). | **Keep.** |
| 12 | 3.6 | The parts counter is on every screen now (rooms, map, fight, counter); on a phone's fight screen it sits bottom right. | **Keep.** |
| 13 | all | Only the armour 20 and 30 lairs, and so only page 1, can be reached with rooms 1–7; the armour 45 and 60 lairs hang off rooms 8 and 12 (GDD), in epic 4. | **Keep the GDD's placement.** |

## 3. Known gaps

- **On a phone, once every room so far is done,** "Nastavak slijedi…" sits above the parts counter and partly covers the unseen armour 60 lair's glyph. The tablet is clear. Epic 4's map pass should place both.
- **Fights only reach armour 30 with rooms 1–7,** so the balance table's hard fights (and pages 2 and 3, and the upgrades' real purpose) wait for epic 4.
- **Fight and counter text is placeholder,** as all text is until epic 6.
- From epic 2, still: two tabs at once overwrite each other's save (last write wins); a dev-panel jump out of a room drops that room's lines.
