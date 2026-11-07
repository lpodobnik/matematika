# Story 3.7: Play the fights on the tablet

Status: review (built and checked headless; Luka's son's tablet play is still to come)

## Story

As Luka,
I want the fights playable from the map on the tablet,
so that my son has somewhere to go between rooms.

**Covers:** epic 3's playable result.

## Acceptance Criteria

1. **Given** a game with room 2 done, **then** a headless test at 1280 × 800 and 640 × 360 enters a lair, plays a fight to a loss and one to a win, recovers the pile, buys an upgrade after room 6, and reads a torn page, tapping every control for real.
2. **And** Luka's son plays fights on the tablet, and what he runs into becomes the next story. This is Luka's step.

## Calls made (for Luka's veto)

- **The test starts from rooms 1–6 done,** set up through the store as a save would bring it (the rooms themselves are covered by `e2e/rooms-1-7.spec.ts`). That reaches the armour 30 lair (beside the bridge, room 5), which carries a torn page, and the workshop (room 6). Everything after the setup is tapped: the lair, the roll, each die and slot, the blows notch, the strike, the leave and its question, the end's way back, the page's close, the map's pages button, the counter's buy and back.
- **The loss is a leave after one strike,** which always loses and always drops a quarter (3 of 12 parts). A loss by hull would depend on the dice.
- **The win is played hard** (largest die on blade, next on reach, all blows) with the dev seed fixed at 22, whose dice win with a clean cut: "+21 dio" (4 + 5 steam, doubled, plus the 3 won back). The test asserts that win, so if the rules or tuning change it fails there, on purpose, rather than retrying other seeds (review).
- **It taps the dev panel's "+10 parts"** (backtick, the button, close) before the counter, so the new tool is checked in a real browser too.
- **It reloads twice:** mid-fight (the fight comes back with its armour) and at the end (the upgrade and the page are kept, and the next fight has 13 steam).
- **The dev panel gets the fights' tools** promised in story 3.1: +10 / +50 / 0 parts, a fixed or random seed, and "wake lairs" (every winding-down automaton rewinds now, `dev/wake-lairs`), so Luka can try the counter or a lair again on the tablet without waiting 15 minutes.
- **`npm run e2e` runs both browser tests,** rooms 1–7 and the fights: about 2.6 minutes for both sizes.

## Dev Agent Record

### Built (main session, `epic-1`)

- `e2e/fights.spec.ts`.
- `src/dev/DevPanel.tsx`: the fights' tools. `src/store/fight-reducer.ts`: `dev/wake-lairs`.

### Tests

- `e2e/fights.spec.ts` at both sizes: the lose, reload, leave-asks, pile-on-the-map, win-back-with-a-page (on screen), page-reader, dev panel, buy and reload steps, with screenshots of each, and no page errors or failed requests.
- `src/dev/DevPanel.test.tsx` (1 new), `src/store/fight.test.ts` (1 new: wake lairs).

### Review (one pass) and fixes

The review confirmed the mid-fight reload really checks a reload, the fight loop can't run away, the page's delay can't race the test, the selectors are unique, and `dev/wake-lairs` is right and dev-only. It found six issues, all fixed:

1. **The seed-retry loop couldn't save the test and hid a broken clean cut:** fallback seeds pay too little for the counter. The loop is gone: seed 22's win, its clean cut and "+21 dio" are asserted.
2. **Getting the pile back was checked only in the store.** The screen now shows it: the pile note on walking in, "+3 vraćeno s hrpe" on the end, and no pile on the map afterwards; the loss's end shows "3 dijela ostaju".
3. **Reading the dice didn't wait for them.** It does now.
4. **One check couldn't fail.** The blows notch is now checked as pressed; the formula check stays, as the "never the total" rule.
5. **Numbers depended on tuning.** The drop, the steam's cost and the 13 pips now come from `src/config/tuning.ts`.
6. **The panel's buttons weren't exercised.** The test taps "+10 parts" in the browser.

### Checks

- `npm run check`, `npm test` (2,297 passed, 2 skipped) and `npm run build` pass.
- `npm run e2e` passes at both sizes, on its own server on 5291 and against my dev server on 5290 (rooms 1–7 and the fights, 2.6 minutes), after the fixes. The fights test's 11 screenshots were looked at at both sizes.
- **Not done:** Luka's son's play on the tablet (criterion 2).
