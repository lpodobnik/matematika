# Story 2.11: The play log and Luka's view

Status: done

## Story

As Luka,
I want to see how my son plays and keep a backup of his progress,
so that I can follow his thinking and never lose his save.

**Covers:** FR53, FR54.

## Acceptance Criteria

1. **The play log** (`src/playlog/log.ts`, `store/effects/playlog.ts`, `save/log-storage.ts`):
   - The device keeps a log under `matematika:log`, apart from the save. It records sessions (a mark after 30 minutes of nothing), rooms entered, finished and reset, ways used, predictions and wrong lines, each dated.
   - Capped at 20,000 entries, oldest dropped first.
   - Hints are never logged, nor is his name. Nothing is written on the loading screen.
2. **Luka's view** at `…#dnevnik`, linked from nowhere in the game. It opens in place of the game, so the two never write at once. It shows:
   - sessions per day;
   - each room's first entry, finish, resets, ways, predictions and wrong lines;
   - the latest wrong lines;
   - a warning when the device isn't saving.
   It exports the log as a JSON file, and "Natrag u igru" opens the game.
3. **The backup link** (`#b=<data>`, architecture, Links): the whole save without his name and look, deflate-raw, base64url, in the URL fragment, which the browser never sends anywhere. It is made on demand in Luka's view, with a copy button.
4. **Restoring.**
   - Opening a backup link shows what the backup holds and what is on the device, and asks before replacing a save that is there.
   - "Vrati kopiju" writes it, keeping the device's own name and look, and opens the game. "Odustani" opens the game unchanged.
   - A broken link says so and offers only "Odustani".
5. **Checks.**
   - Pure tests (log entries, sessions, the cap, summaries) and the backup round trip (no name, broken payloads).
   - The effect and log storage (lenient reads); render tests for both views.
   - A headless play-through at 1280 × 800 and 640 × 360: room 1 with a wrong line; the log on the device; Luka's view; the link made; a fresh device restores it into the game; the first device asks and keeps its save on "Odustani". Screenshots looked at.

## Calls made (for Luka's veto)

- **The address is `#dnevnik`,** as the architecture names it. Typed by Luka; there's no gesture in the game.
- **Luka's view and restoring are their own page.** `main.tsx` opens them in place of the game, and any change of address between the game, the view and a link starts the page afresh.
- **Only wrong lines are logged with their text.** Accepted lines carry no text in their events, and the story asks for wrong lines.
- **A restored backup keeps the device's name and look.** The link never carries them (GDD privacy). On a new device the naming comes again after room 1.
- **The view is plain tables in the game's paper and ink,** with no game skin, for a grown-up. It lists the rooms he has entered.
- **The architecture's prediction comparison** (rooms 3–6 against 9–13) and the later rooms' metrics (room 11's ways, the clock tower, fights, rooms built) wait for their rooms. The view shows each room's predictions and ways now.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/playlog/log.ts` (pure): `PlayLogEvent`, `logEntriesOf`, `appended`, `summarize`.
- `src/save/log-storage.ts`; `src/store/effects/playlog.ts`, in the effects registry.
- `src/links/backup.ts` (pure: the prefix, base64url); `src/app/backup.ts` (the save without the name, compression, decoding).
- `src/app/luka.tsx` (the container); `src/ui/luka/LukaView.tsx` (`LukaView`, `RestoreView`) and `luka.css`; `hr.luka`.
- `src/main.tsx`: the routes.

### Review (one pass) and fixes

The review confirmed the privacy (no name in the link or the log, no network), the routing (no reload loop, the game never booting on Luka's page), the read-only and unavailable states refusing a restore, and the CSP. It found eight issues, all fixed:
1. **Luka's view couldn't scroll:** the game's body hides overflow, so on the tablet the backup and download sat out of reach. The view now has its own height and scrolls (checked: on the phone it scrolls 391 px). Its text can also be selected, so the link can be copied by hand.
2. **Any JSON restored as a backup.** `{}` read as an empty save, and a newer version's save was cut down. A backup is now migrated first, as a launch is: anything that isn't a save, or is a newer version's, is refused as broken (with tests).
3. **A restore mixed two saves,** keeping the device's unknown fields, and a backup dropped fields this build doesn't know. The backup now carries the save as stored (`stored()`), and a restore replaces it whole (`replace()`), keeping only the device's name and look (with a test).
4. **"Kopirano." showed when nothing was copied.** It now shows only when the clipboard took the link. Otherwise it says to copy it by hand, and tapping the link selects it.
5. **"Napravi vezu" did nothing, unexplained,** with no save or in a browser without compression streams. It now says so.
6. **A failed read of the log could wipe it.** A log that couldn't be read is never written over; once a read succeeds, its entries are kept (with a test).
7. **Every logged event rewrote the whole log** (up to about 1.7M characters). A burst of entries now writes once, two seconds later, and at once when the page hides (with a test).
8. **Small fixes:**
   - "retci", not "redci";
   - "Igranja", not "Puta";
   - an empty-rooms message;
   - the restore screen warns first when the device isn't saving;
   - the download's URL is revoked after the download starts.

Not fixed, noted: two game tabs open at once still overwrite each other's save and log (the last write wins), as story 2.1 noted.

### Checks

- `npm run check`, `npm test` (2,217 passed) and `npm run build` pass. Luka's view loads on demand, in its own chunk.
- Headless play (`play211.mjs`, scratchpad), at 1280 × 800 and 640 × 360:
  - the log holds session, room, line and room after room 1 with a wrong line;
  - Luka's view, and the link (344 characters, without the name); the view scrolls on the phone;
  - a fresh device: the restore prompt, then the game with room 1 done;
  - the first device: the prompt shows both saves, and "Odustani" keeps its own.
  - No console errors. Screenshots looked at.
