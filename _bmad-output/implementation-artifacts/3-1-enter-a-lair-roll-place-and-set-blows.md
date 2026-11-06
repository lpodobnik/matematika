# Story 3.1: Enter a lair, roll, place and set blows

Status: done

## Story

As Luka's son,
I want to walk into an automaton's lair and set up a strike with my dice,
so that I can plan how hard to hit before I see the total.

**Covers:** FR38 (roll, place, set); FR40 (leaving); FR41 (lairs open once seen); ADR-8.

## Acceptance Criteria

1. **Given** the map with a lair he has seen and whose automaton is awake, **when** he taps it, **then** a fight starts there with his upgrades' limits, seeded from `ctx.rng`, and the fight screen shows the automaton with its armour, his hull, his steam and a roll button.
2. **When** he rolls, **then** 3 dice show, and he places each as blade `a`, charge `b` or reach by tapping a die and then a slot; a die can be moved or taken back.
3. **Given** all three slots filled, **then** the blows dial opens at 1 and runs to the reach die (never past the steam left), and the screen shows `a · x + b` with his numbers, such as `6 · 3 + 2`, but never the total.
4. **Given** a fight before his first strike, **when** he leaves, **then** he is back on the map with nothing changed.
5. **Given** a fight in progress, **when** the page reloads, **then** it resumes where it was, and rolling gives the same dice, so a reload is never a free re-roll (ADR-8).

## Calls made (for Luka's veto)

- **The fight is HTML and SVG, not Pixi,** like the map (epic 2, call 2): every control is a real button he taps, a screen reader can read it, and the browser test can tap it. The architecture's `ui/scene/fight/` becomes `src/ui/fight/`. The automaton and the dice are placeholder drawings in code until epic 6.
- **The whole fight goes through the store now** (`src/store/fight-reducer.ts`), strike and settling included, so stories 3.2–3.4 are screens over it. It is a layer over the room reducer: it takes the fight's actions and a tap on a lair, and hands everything else on.
- **A fight is settled in the same step that ends it,** and the save never holds a finished fight, so a reload can never pay or drop twice. The ended fight stays in the store only to show how it ended, until he taps back to the map (`fight/close`).
- **The fight is saved as it starts, after each roll and after each strike** (`FightStarted`, `DiceRolled`, `StrikeLanded`, `FightLeft` are save triggers). Placing a die and setting blows aren't saved: after a reload the same dice wait to be placed again. The rules' state holds its own generator, so rolling again after a reload gives the same dice.
- **He stays "on the map" in the save during a fight.** A fight is entered from the map and left back to it; a launch with a fight in progress opens the fight screen.
- **Lairs are named by armour** on the map ("Automat 20", "Automat 30", …), so he can choose which to take on. A lair is open as soon as it is seen (GDD: "each open once seen").
- **Tap a die, then a slot.** Tapping a filled slot with no die held takes its die back; tapping the held die again puts it down. A die moved between slots empties its old slot (the rules' existing behaviour), so the dial closes and reopens at 1.
- **The blows dial is a row of numbered notches,** 1 up to the reach die. Before a die is on reach, six notches show, off; once one is, as many as it shows, off until all three slots are filled. Notches the steam can't pay for are dashed and off.
- **Walking out before a strike and back in brings the same dice** (review). The GDD makes leaving before the first strike free, so without this, leaving would be a free re-roll. The fight's seed is kept at the lair (`economy.seeds`) until its first strike.
- **A saved fight that doesn't hang together is dropped whole** (`src/save/decode-fight.ts`): an unknown lair, a die that isn't 1–6, a slot past the dice, a phase its slots don't fit, a last strike whose numbers don't add up. He is then on the map, as before he walked in.
- **The review's minor notes on the fight rules are fixed:** a loss that drops nothing reports +0, not −0; `blowRange` is null outside phase `set`; a lair whose rewind time is further off than a whole rewind (a clock set back) counts as awake; an upgrade id the rules don't know adds nothing.
- **Dev panel actions** `dev/set-parts` and `dev/fight-seed` are in the store (the panel's buttons come with story 3.7's test), so tests can play fights with known dice.
- **Only the armour 20 and 30 lairs can be seen with rooms 1–7.** The armour 45 and 60 lairs hang off rooms 8 and 12 (GDD), which come in epic 4.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/store/fight-reducer.ts`: entering a lair, the fight's actions, settling in the step that ends a fight, back to the map, resuming at launch, the dev actions.
- `src/store/fight-end.ts`: how the fight on screen ended (`ui.fightEnd`).
- `src/save/decode-fight.ts`: reads a saved fight back, or drops it.
- `SaveV1.fight`, `progress.tornPages`; `GameState.fight`; `Screen` `fight`; `ui.fightEnd`, `ui.fightSeed`; fight actions and events; save triggers; `isRoomEvent` now lists what isn't the room's.
- `src/city/reach.ts`: a lair is open once seen.
- `src/ui/fight/FightScreen.tsx`, `fight-art.tsx`, `fight.css`; `App.tsx` shows it.
- `src/content/text/hr.ts`: `fight` text; lairs named by armour.
- Fixes in `src/fight/fight.ts`, `settle.ts`, `limits.ts`.

### Tests

- `src/store/fight.test.ts` (21): entering, upgrades, unseen and winding-down lairs, the dev seed, rolling, placing and the dial, free and losing leaves, reloads mid-fight, a win's pay and rewind, a reload after the end, a loss's pile recovered by a win, the first torn page, a new game.
- `src/save/decode-fight.test.ts` (5), `src/ui/fight/FightScreen.test.tsx` (5), `src/ui/fight/taps.test.ts` (3), the blows plural in `hr.test.ts`; new cases in `fight.test.ts`, `settle.test.ts`, `limits.test.ts`.
- Tests that expected the lair to wait for epic 3, the old save shape or the old trigger list were updated.

### Review (one pass) and fixes

The review found no blocking defects. It confirmed that a fight can't be settled twice, a reload can't re-roll, the room reducer leaves a fight alone, and every state the rules can save decodes. It found six issues, all fixed:

1. **Leaving and walking back in was a free re-roll.** Entering a lair now keeps the fight's seed there (`economy.seeds`), and the first strike uses it up, so walking out and back in rolls the same dice, across a reload too.
2. **The screen's taps weren't tested.** They are now a pure helper (`src/ui/fight/taps.ts`) with its own tests: pick up, put down, place, move, take back.
3. **The dev panel's jump into a room left a stale fight** that blocked every lair. `room/enter` now drops the fight.
4. **The notch labels' Croatian plural was wrong** ("1 udaraca"). They now say "1 udarac", "2 udarca", "5 udaraca", with a test.
5. **The saved-fight reader let a few impossible states through.** It now checks that every strike dented him, that the last strike was the round before, and the blows against the steam's cost per blow.
6. **The story file misdescribed the closed dial;** corrected above.

### Checks

- `npm run check`, `npm test` (2,263 passed, 2 skipped) and `npm run build` pass.
- Played in the dev server at 1280 × 800 and 640 × 360: entered the armour 20 lair from a game with rooms 1–2 done, rolled, placed the dice by tapping, set blows (`5 · 3 + 1`), and reloaded: the fight came back with the same dice. After the fixes, a die tapped onto reach placed it (on a restarted dev server).
