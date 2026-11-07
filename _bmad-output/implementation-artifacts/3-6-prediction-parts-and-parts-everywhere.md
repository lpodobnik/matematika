# Story 3.6: Prediction parts, and parts everywhere

Status: done

## Story

As Luka's son,
I want right predictions in rooms to pay into the same parts I fight for,
so that thinking ahead in rooms helps me in fights.

**Covers:** FR7 (the payment); the GDD's economy.

## Acceptance Criteria

1. **Given** a right prediction in rooms 3–7, **then** it pays 2 parts once per stage (built in story 1.14), into the same parts fights pay and upgrades spend.
2. **And** the parts counter shows on the map, the fight screen and the counter as well as in rooms, once he has any.

## Calls made (for Luka's veto)

- **The payment was already built** (story 1.14: `payPrediction` in the root reducer, once per stage, into `save.economy.parts`). Fights pay into and drop from that same `economy.parts` (story 3.3), and the counter spends from it (story 3.5): one number. Nothing new was needed for AC1.
- **The counter now shows on the map,** in the board's bottom-right corner, once he has any parts. "Nastavak slijedi…" sits above it (review); on a phone that note then partly covers the unseen armour 60 lair, a known gap for epic 4's map. With the fight screen (3.3) and the counter (3.5), it is on every screen but the naming and the story cards.
- **Reviewed together with story 3.5,** since this story adds one counter to the map; the review and its fixes are recorded in story 3.5.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/ui/map/MapScreen.tsx`, `map.css`: the parts counter on the map.

### Tests

- `src/ui/map/MapScreen.test.tsx` (1 new): no counter before any parts; his parts once he has some.
- The payment: `src/economy/predictions.test.ts`, `src/store/store.test.ts` (story 1.14), and the rooms 1–7 browser test (story 2.13).

### Checks

- `npm run check`, `npm test` (2,295 passed, 2 skipped) and `npm run build` pass.
- Headless screenshots of the map with 19 and 15 parts, and the rooms test's end map with the note and 12 parts, at 1280 × 800 and 640 × 360, looked at.
