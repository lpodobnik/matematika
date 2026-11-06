# Story 3.3: Parts, winding down and piles

Status: done

## Story

As Luka's son,
I want a win to pay parts and a loss to cost some,
so that fights matter and I can win my parts back.

**Covers:** FR39 (reward); FR40 (piles); FR41 (wind down, rewind); ADR-13; the play log's fights.

## Acceptance Criteria

1. **Given** a win, **then** he is paid base parts plus unspent steam, doubled on a clean cut, plus any pile at that automaton, and the parts fly to the counter; the automaton winds down, drops its punched tape, and its lair shows as winding down on the map until it rewinds 15 minutes later.
2. **Given** a loss, **then** a quarter of his unspent parts, rounded down, drops in a pile at that automaton, shown on its lair; another loss adds to it; parts already spent are safe.
3. **And** the fight is settled once, in the same step that clears it from the save, so a reload never pays or drops twice.
4. **And** each fight writes a `fight` entry to the play log, and Luka's view shows fights per lair, wins, parts won and lost, and fights at armour 45 or more after a loss.

## Calls made (for Luka's veto)

- **The paying and dropping were already in the store** (story 3.1, settling in the step that ends a fight; tested in `src/store/fight.test.ts`). This story shows them: on the fight's end, on the map, and in Luka's view.
- **The win's end shows what it paid and why:** "+7 dijelova", then "3 za automat + 4 preostale pare", "Čisti rez udvostručuje nagradu." on a clean cut, and "+4 vraćeno s hrpe" when he won back a pile. The total includes the pile. The "+n" rises in, and the counter ticks up to the new total once it has (`partsFlightMs`, the same 900 ms as a prediction's `+2`). It doesn't travel across the screen like the prediction's `+2` does: the end sits right under the counter's corner.
- **The loss's end says what stayed behind and that a win brings it back:** "4 dijela ostaju kod automata. Pobjeda ih vraća.", or "Nijedan dio nije ostao kod automata." when he had under 4 parts. Nothing else about the loss.
- **The parts counter sits in the fight's top-right corner** (in rooms it is bottom left), out of the way of the armour on a phone. Story 3.6 makes the counter show everywhere.
- **The beaten automaton tilts, fades, and drops a strip of punched tape** under it (not on a phone, where there is no room).
- **On the map, a winding-down lair is faint and takes no tap,** with a plate "budi se za 15 min" that counts down (the map looks again every 30 s, only while an automaton is asleep). The minutes round up, so it never says 0.
- **A pile shows as a small badge with its number on the lair** ("4"), and is read out ("ostavljeno 4"). A pile at a lair he hasn't seen doesn't show.
- **Walking back into a lair with a pile says so** under the armour: "Ovdje te čekaju 4 dijela s prošle borbe." until his first strike.
- **The play log's `fight` entry** is the architecture's: lair, won, and the change in his parts. Free leaves aren't logged (nothing happened). Luka's view gets a "Borbe" table by lair (fights, wins, parts won, parts left) and the GDD's metric ("he still takes armour 45 or more after a loss"; the risk is fear of losing) read as: of his losses, how many were followed, before the next loss, by a fight at armour 45 or more ("Porazi nakon kojih slijedi borba s oklopom 45 ili više: 1 od 2"). With rooms 1–7 the armour 45 and 60 lairs can't be seen yet, so it reads 0 until epic 4.
- **Croatian counts parts, blows and steam properly:** "1 dio / 2 dijela / 5 dijelova", the verb agreeing ("4 dijela ostaju", "5 dijelova ostaje"), "ga" for one part, and "1 preostala para / 4 preostale pare / 6 preostalih para".

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/city/reach.ts`: lair state `winding` (from `asleep`), a node's `pile`.
- `src/fight/settle.ts`: `asleepLairs`. `src/store/fight-reducer.ts` enters a lair through the same map state.
- `src/ui/map/MapScreen.tsx`, `map.css`: the winding lair, its wake plate, the pile badge, a 30 s look while one is asleep.
- `src/ui/fight/FightEnd.tsx`, `FightScreen.tsx`, `fight-art.tsx`, `fight.css`: the parts on the end, the counter, the dropped tape, the pile note.
- `src/playlog/log.ts`: the `fight` entry and the fights summary. `src/ui/luka/LukaView.tsx`: the fights table.
- `src/content/text/hr.ts`: the text, with Croatian counting for parts.

### Review (one pass) and fixes

The review confirmed that "+n" and "base + steam" match what settling paid (clean cuts and piles included), that the map and the store agree on which lairs are open at every edge (exactly 15 minutes, a clock set back), that each ended fight is logged once and a free leave not at all, and the parts counting. It found five issues, all fixed:

1. **The steam left was always "preostale pare"**, wrong for most wins ("6 preostale pare"). It now counts as Croatian does, with 0, 1, 4, 5, 12 and 21 tested.
2. **The counter ticked at the wrong moment on a win:** it showed the new total for a render, ticked, dropped back, and ticked again 900 ms later. Which end has landed is now worked out during render, so the counter holds the old total and ticks once, when the parts arrive (checked headless: 12 at the win, 19 after).
3. **A stored fight entry without `won` counted as a loss.** It is now skipped, as is one whose parts aren't a finite number.
4. **The after-a-loss metric never reset,** so one early loss counted every later hard fight. It now counts losses followed, before the next loss, by a hard fight, out of all losses (a call above).
5. **The map ticked every 30 s forever after the first win.** It ticks only while an automaton is asleep.

### Tests

- `src/playlog/log.test.ts` (3 new): the entry, nothing for other fight events, the summary by lair and losses followed by a hard fight, unreadable entries skipped.
- `src/city/reach.test.ts` (2 new), `src/ui/map/MapScreen.test.tsx` (1 new), `src/ui/fight/FightScreen.test.tsx` (3 new), `src/ui/luka/LukaView.test.tsx` (1 new), `src/content/text/hr.test.ts` (parts counting).
- The paying and dropping themselves: `src/store/fight.test.ts` (story 3.1).

### Checks

- `npm run check`, `npm test` (2,283 passed, 2 skipped) and `npm run build` pass, after the fixes too.
- Headless screenshots at 1280 × 800 and 640 × 360 (a scratch Playwright script against the dev server on 5290), all looked at: a win (+7: 3 for the automaton, 4 steam; counter 12 → 19), the map with the lair winding down ("budi se za 15 min"), a loss by leaving (4 of 19 parts stay), the map with the pile badge, and the pile note on walking back in. No page errors.
