# Story 2.1: Save progress on the device

Status: done

## Story

As Luka's son,
I want the game to remember where I am,
so that I can stop and come back without losing anything.

**Covers:** FR52, NFR3; architecture, Data Persistence and `SaveV1`.

## Acceptance Criteria

1. **What is saved, and when.**
   - `matematika:save` holds `SaveV1`:
     - progress: rooms done, tools, first uses, and the room in progress;
     - the economy;
     - settings: muted, and the frame-time test's quality pick (a quality forced from the dev panel is never saved);
     - his name and look (empty until story 2.4);
     - `createdAt`.
   - The room in progress is its id, its stage, the stage's committed lines after line 0 (each as its pad characters, its source, and whether it moved the machine) and the confirmed pin. Exploratory moves are not saved: the dial, pieces moved but not written, a pin not yet confirmed, the draft.
   - A room whose restart has begun is no longer in progress: it is in rooms done.
   - It is written after:
     - a committed line, typed or written by Balance;
     - a stage arriving, locking or being reset;
     - a confirmed pin (and a paid prediction);
     - a restart, and the tool it earns;
     - any other change to the saved slice: a first use met, the quality pick, a dev-panel change of tools.
   - Writes go through `store/effects/save.ts`, listening to domain events (Pattern 4). Nothing is written before the save has been read at launch, so a launch can never overwrite a save with a fresh game.
2. **Coming back.**
   - A loading screen shows at once (static in `index.html`, before the code has loaded), then in React until the save is read and the assets are loaded. Epic 2 has no image bundles yet; the loader reports progress and the screen is ready for them.
   - With a room in progress, he is back in the same room and stage with its committed lines, and the notebook, the pans, the blanks and the machine's progress are as they were after the last line. A confirmed pin is back in place and is not paid again.
   - With no room in progress, the first room in play order that isn't done arrives; when every room is done, the "to be continued" screen shows.
   - A saved quality pick is used, and the frame-time test doesn't run again.
   - A saved room that no longer replays (its content changed, or the save was edited) starts that stage fresh; a stage that no longer exists starts the room fresh. Never a crash.
3. **Old, broken and unwritable saves.**
   - Every save carries `v`. Migrations run in order from the save's version to the current one (`migrations[n]` turns vn into vn+1). v1 is the first version, so the table is empty; the mechanism is tested with a test table.
   - Missing or invalid fields take their defaults on load, so fields that later stories add need no new version.
   - A save that isn't JSON, or isn't a save, is copied to `matematika:save:corrupt:<ISO time>`, and the game starts fresh.
   - A save from a newer version is loaded as far as it can be read and never overwritten (read-only).
   - On the first launch, `navigator.storage.persist()` asks the browser to keep the data.
   - If storage can't be read or written (private mode, quota), the game keeps running in memory and the failure goes to the error log. The visible notice comes with the map (2.2) and Luka's view (2.11).
4. **Dev panel.** "New game" clears the progress and starts room 1 (written through the save effect like any change).
5. **Checks.**
   - Unit tests for the decoder, migrations, corrupt and newer saves, storage failure, the save effect's triggers, and replaying a room for each of rooms 1–4 at several points (after a Try line, after Balance's auto lines, with blanks showing, after the answer, after the check line).
   - A headless play-through: play rooms 1–3 and part of room 4, reload at each point, and look at the screenshots at 1280 × 800 and 640 × 360: the same room, stage, lines and pans after the reload.

## Design notes

- `src/save/`: `schema.ts` (`SaveV1`, `currentVersion`), `decode.ts` (lenient decoder), `migrate.ts`, `storage.ts` (the adapter: load, write, persist request, corrupt copy, read-only).
- `src/room/resume.ts` (pure): `savedRoomOf(room)` and `resumeRoom(spec, stage, saved, now)`. Replay runs the room's own functions: the pin is set and confirmed, typed lines go through the same commit as enter (without the refusal, since they were accepted when written), and Balance lines are committed with their saved progress, the pans taking the move's result.
- `src/store/persist.ts`: `toSaveV1(state)` and `fromSaveV1(save)`.
- Actions `boot/progress` and `boot/start`; store event `SaveChanged`, emitted when the saved slice changes.
- `ui.screen` gains `loading`.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/save/`: `schema.ts`, `decode.ts` (lenient, field by field), `migrate.ts` (empty table, tested with a test table), `storage.ts` (the adapter).
- `src/room/resume.ts`: `savedRoomOf` and `resumeRoom`. Typed lines replay through `commitTypedLine`, now split out of `enterLine` in `room/notebook.ts`; Balance lines are committed with their saved progress, the pans taking the move's result.
- `src/store/persist.ts`, `src/store/effects/save.ts` (the registry's first effect), the `SaveChanged` store event, the actions `boot/progress`, `boot/start` and `dev/new-game`, and `roomsDone` on a restart.
- `src/app/boot.ts`, `LoadingScreen.tsx`, and a static gear in `index.html`; `main.tsx` mounts on the loading screen, then boots.
- The dev panel's "new game".
- `roomIds`, `toolIds`, `wayIds` and `handoverIds` are runtime lists in `room/types.ts`, so the decoder can check ids.
- Architecture: `SaveV1` updated to what was built, and fields join with their stories.

### Review (one pass) and fixes

All six findings were confirmed and fixed, each with a test:
1. The decoder dropped a room with more than 60 lines, which room 4's Balance moves reach. The cap is now 5000.
2. A launch dropped save fields this build doesn't know. The storage now writes the known fields over the save as read, so unknown fields are kept.
3. A failed read at launch still let writes through. Now nothing is written for that session.
4. An unreadable save whose copy couldn't be kept aside was still written over. Now nothing is written for that session.
5. A room that throws as it resumes would block every launch. `boot` now logs it and starts at the next room.
6. The splitter's "offered" memory was lost on reload after a reset. It is now saved (`splitterSeen`).

Not fixed, low: two tabs open at once, where the last write wins.

### Checks

- `npm run check`, `npm test` (1,963 passed) and `npm run build` pass.
- Headless play (a scratchpad script, `play21.mjs`), at 1280 × 800 and 640 × 360:
  - rooms 1–4 played through, with a reload at 8 points: after an answer, after a pin, after Balance's lines, with blanks showing, after the answer, after the check line. The room was the same after every reload.
  - After room 4, a reload shows "Nastavak slijedi…".
  - Screenshots looked at. The only console error is the missing favicon.
