# Story 4.9: Play rooms 8–13 on the tablet

Status: review (built and checked headless; Luka's son's tablet play is still to come)

## Story

As Luka,
I want rooms 8–13 playable on the tablet, through the line reveal,
so that my son can finish the district.

**Covers:** epic 4's playable result.

## Acceptance Criteria

1. **Given** a game with rooms 1–7 done, **then** a headless test at 1280 × 800 and 640 × 360 plays rooms 8–13 back to back with real taps, through the line reveal.
2. **And** Luka's son plays them on the tablet, and what he runs into becomes the next story. This is Luka's step.

## Calls made (for Luka's veto)

- **The test starts from rooms 1–7 done,** set up through the store as a save would bring it. Rooms 1–7 are covered by `e2e/rooms-1-7.spec.ts`, which now ends as room 8 arrives, not on the map.
- **It taps everything epic 4 added to the notebook:**
  - the chain's last link, its operations and Pokreni, including a wrong `+ 9` that jams and is deleted;
  - the pad;
  - room 10's stories and Potvrdi;
  - room 11's ranges and the − step down to 207;
  - the drum's heights.
  - Every pin must be right: each pays its parts, so a wrong pin fails the test.
- **The scene's moves go to the store, as the scene would send them,** as in the rooms 1–7 test. These are the dial, an x pin's place, and room 9's x-gear drop. The first touch on the canvas and the pin's confirm are real taps.
- **Every lock and restart must play out within the scene's own time**, under the clock's 8 s fallback, as in rooms 1–7.
- **It ends on the whole map:**
  - all 13 rooms are done, and the clock tower is restored;
  - room 12 has earned the drum;
  - the armour 60 lair is open;
  - the "to be continued" note shows.

## Dev Agent Record

### Built (main session, `epic-1`)

- `e2e/rooms-8-13.spec.ts`.
- `e2e/rooms-1-7.spec.ts`: ends as room 8 arrives.

### Review (one pass) and fixes

The review checked the test and the epic report against the code and the story files. It found:
- **A wrong pin passed.** Every pin now has to pay its parts, and the drum's right height has to be the flagged one.
- **The lock and restart waits didn't prove the scene played them.** They now wait for each phase, as the rooms 1–7 test does, within 6 s, under the clock's 8 s fallback. Each restart is screenshotted.
- **The final map's checks proved little.** The test now checks:
  - all 13 rooms by name;
  - the clock tower restored;
  - the "to be continued" note (no other browser test checks it now).
- **Room 9's x-gear was never used.** It is now set to 5 and dropped, the chain is checked to read `+ 100`, and then the stage is reset.
- **Fragile selectors.** The panels are found by their names, and the − step by its label.
- **Weak checks in between.** The wrong line is checked gone after delete, and no jam after the chain's runs.
- **Overclaims in this file and the report.** This file no longer says the link card is tapped, or that the first touch goes to the store. The report now gives:
  - the number of reviews (seven) and their times;
  - the room order after room 7;
  - where the phone layout bugs were found;
  - the map note's gap (only on the final map);
  - a full path in call 7, and call 14's wording;
  - 4.9's status (`review`).

### Checks

- `npm run e2e` runs all three browser tests at both sizes: rooms 1–7, the fights, and rooms 8–13. All pass: the fights on the full run, rooms 1–7 on its re-run after its new ending, and rooms 8–13 after the review's fixes (about 2 minutes each).
- The rooms 8–13 test's screenshots were looked at: the chain, room 10's written story, 207, the link, the drum's line, the reveal and the whole map.
- **Not done:** Luka's son's play on the tablet (criterion 2).
