# Story 2.13: Play rooms 1–7 on the tablet

Status: review (built and checked headless; Luka's son's tablet play is still to come)

## Story

As Luka,
I want rooms 1–7 to play back to back on the map, on the tablet,
so that the city is ready for my son's next real play.

**Covers:** epic 2's playable result; NFR1, NFR3.

## Acceptance Criteria

1. **From a fresh start, rooms 1–7 run** with gates, his name, story lines, cards, hints and saving. After room 7 the map shows "Nastavak slijedi…".
2. **A headless play-through test** (`e2e/rooms-1-7.spec.ts`, `npm run e2e`) at 1280 × 800 and 640 × 360 covers every room's end state. It:
   - taps the number pad, the story cards' "Dalje", the naming form, the hint and map buttons and the map's nodes for real;
   - sends the canvas's moves (machine, dial, pins, tray, splitter) to the store, as the scene does;
   - presses the hint twice in room 2 and checks that it shows;
   - reloads the page after room 3 and checks that his rooms and name are kept;
   - opens the map after room 4, checks the gates (the bridge open, the logbook and the tram not), and travels to the bridge;
   - screenshots each room's restart and story card, the naming, the hint and both maps;
   - fails on any page error.
3. **Luka's son plays it on the tablet,** and what he runs into becomes the next story. This is Luka's step.

## Calls made (for Luka's veto)

- **The browser test reaches the canvas through the store.** The scene is a Pixi canvas with no DOM to tap, and the store already holds the actions the scene sends: the dial, a pin's value, the tray and splitter. Everything that is DOM is tapped for real, as is the first touch on the canvas, and locks and restarts play out on their own. The room logic has been covered through the real store since story 1.13 (`src/store/playthrough.test.ts`, rooms 1–7). This test adds the screens, the map, saving and both sizes.
- **It runs against the dev server, in the installed Edge.** The test imports the dev server's store module, which a production build doesn't serve. `npm run e2e` starts its own server on port 5291, so it never touches the one on 5173. With `E2E_URL` it uses one already running.
- **Map nodes carry `data-node`** (their id), so a test can find a node without its Croatian name.
- **The e2e test is not part of `npm test`.** It takes about 40 s per size and needs a browser. `npm run e2e` runs it.

## Dev Agent Record

### Built (main session, `epic-1`)

- `e2e/rooms-1-7.spec.ts`; `playwright.config.ts` (Edge, the two sizes, its own server on 5291 or `E2E_URL`).
- `src/ui/map/MapScreen.tsx`: `data-node` on each node; `src/ui/notebook/NumberPad.tsx`: `data-key` on each key.

### Review (one pass) and fixes

The review confirmed the selectors are unique, the gate checks can't pass on a missing node, the store hook can't load a second copy, each size starts with empty storage, and the config never touches port 5173. It found seven issues, all fixed:

1. **The test finished every lock and restart itself,** so a scene that never reported done would have passed. Locks and restarts now play out on their own, and the test fails unless the scene reports each within 6 s, under the 8 s clock fallback. A size now takes 1.1 min instead of 40 s.
2. **Some DOM controls were dispatched, not tapped.** The pin's confirm button, room 7's flag and its confirm, and the first touch on the canvas are now tapped for real. Each touch checks that it woke the machine.
3. **`arrive` accepted either screen.** Each room now says how it should be reached. Rooms load straight after the story card, and only room 5 is entered from the map.
4. **Some criteria were claimed but not checked.** These are now asserted:
   - both hint levels (1, then 2);
   - his name on Penkala's reply;
   - room 4's early `x = 9` refused without a lock;
   - room 7's lines shown on the scale when tapped;
   - room 8 disabled on the map.
5. **Every 404 was ignored.** Now any failed request fails the test, except the browser's favicon.
6. **The pad's key order was copied** from `PAD_ROWS`. The keys now carry `data-key`, and the test finds them by it.
7. **Small fixes:**
   - the bridge comment said the wheel opens it, but Balance from room 3 does;
   - a needless wait before the reload was removed;
   - the `.gitignore` note was updated.

### Checks

- `npm run check`, `npm test` (2,225 passed) and `npm run build` pass.
- `npm run e2e` passes at both sizes against a running server. The tablet size also passes on its own server on 5291.
- Screenshots of every room's restart and story card, the naming, the hint and both maps were looked at, at both sizes.
- On the phone the open notebook covers the scene's right half during a restart. That is the existing phone layout, not this story's.
- **Not done:** Luka's son's play on the tablet, which is Luka's step (criterion 3).
