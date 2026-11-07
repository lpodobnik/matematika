# Story 3.5: Upgrades at the old mechanic's counter

Status: done

## Story

As Luka's son,
I want to spend my parts on better equipment,
so that the strongest automatons become beatable.

**Covers:** FR43; narrative design, the old mechanic.

## Acceptance Criteria

1. **Given** the workshop node, open after room 6, **when** he taps it, **then** the old mechanic's counter shows the three upgrades with their costs: 4th die, roll 4 and discard 1 (40 parts); +3 steam (20); +1 hull (30).
2. **When** he buys one he can afford, **then** his parts drop by its cost, it shows as owned, and it can't be bought again; one he can't afford can't be bought.
3. **And** the next fight starts with the new limits; with the 4th die he rolls 4 and the die left out of the slots is discarded.

## Calls made (for Luka's veto)

- **The counter is the workshop node, after room 6.** The narrative design has the old mechanic (Faust) sell upgrades and hand over the workshop in room 6, and the workshop's gate is the tool room 6 earns. Room building joins the same place in epic 5. Until then the node opens only the counter, as screen `shop`.
- **So upgrades wait for room 6,** though fights open after room 2. Parts can pile up before then; nothing is lost.
- **A card per upgrade:** its sign, name, what it does in a short line ("Četvrta kocka: Baciš četiri kocke, a jednu ostaviš sa strane.", "Para +3: Tri udarca više u svakoj borbi.", "Trup +1: Jedno udubljenje više prije poraza."; "Para +3" rather than "+3 pare", which also reads as money), its cost, and one button: "Kupi" when he can afford it, "Još 13" (how many more) when he can't, "Kupljeno" once bought, with the card's frame dashed. Buying is one tap, with no "are you sure": an upgrade can't be lost and he chose it.
- **Faust's line** (placeholder, with a machine saying as the narrative design has him): "Stroj je dobar koliko i njegov najslabiji zupčanik. Dijelove imaš? Onda biraj."
- **The 4th die:** with it he rolls 4; the die he leaves out of the three slots is the discarded one (the rules' existing behaviour). The fight's tag says so on the tablet ("Jedna kocka ostaje sa strane."); the phone hides tags, as it already did.
- **Buying is saved** (`UpgradeBought` is a save trigger, and the economy changing writes the save anyway). Purchases aren't in the play log: the architecture lists none, and Luka's view shows parts through fights.
- **The parts counter sits top right on the counter screen, and on a phone's fight screen it moves to bottom right,** because the fight's gauges run to the top-right corner there (found in this story's screenshots).

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/store/shop-reducer.ts`: a layer over the fights' layer: the workshop node opens the counter when the map shows it open, `shop/buy` through `buyUpgrade`, `shop/close` back to the map.
- `src/city/reach.ts`: the workshop opens on its gate.
- `src/ui/shop/ShopScreen.tsx`, `shop.css`; `App.tsx` shows it; `Screen` `shop`; actions `shop/buy`, `shop/close`; `UpgradeBought` saves.
- `src/content/text/hr.ts`: `shop`; the fight's tag with 4 dice.
- `src/ui/fight/fight.css`: the phone's counter bottom right.

### Review (one pass, with story 3.6) and fixes

The review confirmed buying works only at the counter, once, never without the parts, that nothing in the inner reducers misbehaves on the counter, that the workshop's `open` state is consistent everywhere, and the 4 dice reach the fight. It found three issues and three minor notes, all fixed:

1. **The map's parts counter (story 3.6) covered "Nastavak slijedi…"** once all rooms are done. The note now sits above the counter. On a phone it then partly covers the unseen armour 60 lair's glyph; that lair can't be seen before epic 4, so it is a known gap for epic 4's map.
2. **A short buy button read "Kupi" to a screen reader** while showing "Još 13". Its name is now its text.
3. **The new fights browser test (story 3.7) broke the type check** with a dynamic import path. Fixed there.
4. Minor: a stale comment in `city/reach.ts`; a test now places 3 of 4 dice and strikes with only those three; the upgrade names "Para +3" and "Trup +1".

### Tests

- `src/store/shop.test.ts` (4): opens after room 6 and back; shut before; buys once, saved, not without the parts, and the next fight has 4 dice, three placed and the fourth left out of the strike; no purchase off the counter.
- `src/ui/shop/ShopScreen.test.tsx` (2): the three upgrades with what they do and 40, 20, 30; buy, how many more (also to a screen reader), owned.
- `src/ui/map/MapScreen.test.tsx`: the workshop node now shows open after room 6. `src/store/effects/save.test.ts`: the trigger list.

### Checks

- `npm run check`, `npm test` (2,295 passed, 2 skipped, with story 3.6) and `npm run build` pass.
- `npm run e2e` (rooms 1–7 and the fights) passes at both sizes after the fixes.
- Headless screenshots at 1280 × 800 and 640 × 360, looked at: the map after room 6, the counter with 47 parts, after buying the 4th die (7 left, "Još 13", "Još 23"), and a fight rolling 4 dice. No page errors.
