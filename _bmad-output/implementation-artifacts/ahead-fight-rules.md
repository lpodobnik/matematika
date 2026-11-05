# Ahead of epic 3: Fight rules as pure logic

Status: review

## Story

As Luka,
I want the automaton fight rules built and tested as pure logic before epic 3 starts,
so that epic 3's fight screens and store wiring sit on rules that already reproduce the GDD's balance table.

**Covers:** the logic of FR38–FR43; the fight state's shape for ADR-8 (saved after each strike, resumed on reload); ADR-13 (lairs rewind 15 minutes after a win). **Not covered:** screens (`ui/scene/fight/`), store wiring and save triggers, the play log, right-prediction parts (FR7, epic 3 story 6), map nodes for the lairs (epic 2).

## Acceptance Criteria

1. **Given** a seed **When** the fight's generator runs **Then** it gives the reference mulberry32 sequence, its whole state is one unsigned 32-bit integer, the same seed always gives the same numbers, and no pure folder calls `Math.random()`; randomness enters only as the seed, drawn from `ctx.rng` with `seedFrom`
2. **Given** a lair and his upgrades **When** a fight starts **Then** it waits in phase `roll` with the lair's armour and base parts, hull 3, steam 10 and 3 dice, plus 1 hull, 3 steam and a 4th die for the upgrades he owns
3. **Given** phase `roll` or `strike` **When** he rolls **Then** 3 six-sided dice (4 with the 4th-die upgrade) come from the fight's own generator, the round number goes up, the slots empty, the phase becomes `place` and `DiceRolled` is emitted
4. **Given** phase `place` or `set` **When** he places dice **Then** each die goes to blade `a`, charge `b` or reach; a die already in another slot moves, a die it replaces goes back; with 4 dice the one left over is discarded; once all three slots are filled the phase is `set` with blows at 1
5. **Given** phase `set` **When** he sets blows on the dial **Then** only whole numbers from 1 to the reach die, and never more than the steam left pays for, are accepted; anything else is ignored. A new reach die clamps the blows
6. **Given** phase `set` **When** he strikes **Then** the damage is `a · x + b`, steam drops by one per blow, the strike is recorded for the banner (`6 · 3 + 2 = 20`) and `StrikeLanded` is emitted
7. **Given** a strike **When** it brings armour to 0 or below **Then** he wins, even on his last steam or last hull, because armour is checked first; armour landing on exactly 0 is a clean cut
8. **Given** a strike that leaves armour **When** it resolves **Then** the automaton dents him (hull − 1); he loses if the hull is empty (reason `hull`, also when steam ran out too) or no steam is left (reason `steam`); otherwise the phase is `strike` and the next roll starts the next round
9. **Given** a fight in progress **When** he leaves **Then** before his first strike the fight is dropped with nothing changed; after it, the fight is lost with reason `left`
10. **Given** any phase **When** an action is not legal there **Then** it is ignored: the same state comes back with no events. After `won` or `lost` nothing changes the fight
11. **Given** a fight saved after a strike (plain JSON, including the generator's state) **When** it is reloaded **Then** it is still in progress and plays on exactly as if it had never been saved, and rolling again gives the same dice, so a reload is never a free re-roll (ADR-8)
12. **Given** a win **When** the reward is paid **Then** it is base parts plus unspent steam, doubled on a clean cut
13. **Given** a won fight **When** it is settled **Then** his parts grow by the reward plus the whole pile at that automaton, which is removed (never doubled), the automaton winds down until 15 minutes later (`tuning.fight.lairRewindMinutes`, ADR-13), and `FightEnded` carries the parts gained
14. **Given** a lost fight, including one left after the first strike **When** it is settled **Then** a quarter of his unspent parts, rounded down, goes into a pile at that automaton; another loss adds to the pile; under 4 parts nothing is dropped; spent parts (upgrades) are safe; the automaton does not wind down and no page is returned; `FightEnded` carries minus the parts dropped
15. **Given** the first win against the armour 30, 45 or 60 automaton **When** it is settled **Then** its torn page (page 1, 2 or 3) is added to his notebook's pages and `TornPageReturned` is emitted; later wins and the armour 20 automaton return none
16. **Given** his parts **When** he buys an upgrade **Then** the 4th die costs 40, +3 steam 20 and +1 hull 30 (90 in all), each can be bought once, it is paid from unspent parts, and without enough parts nothing changes
17. **Given** `src/content/lairs.ts` **When** content tests run **Then** the four lairs have armour 20, 30, 45 and 60, base parts 3, 4, 5 and 6, and the torn pages on 30, 45 and 60
18. **Given** the GDD's two scripted players (one reasoning perfectly, one placing dice at random and committing every blow it can) **When** `src/fight/balance.test.ts` runs them through the real fight code, 40,000 fights per tier, and also enumerates every roll exactly **Then** win rates are within ±2 points of the GDD and parts per fight within ±10%, with all three upgrades the reasoning player wins 98% ±2 at armour 60, and the whole test file runs in about 2.5 seconds. The one number a faithful implementation can't reach (random player's parts at armour 60) is skipped with the measured numbers in a comment
19. **Given** the fight's tuning numbers **When** anything reads them **Then** they come from `src/config/tuning.ts`; the pure folders pass `src/architecture.test.ts`, and `content/lairs.ts` imports only types

## Tasks / Subtasks

- [x] `src/config/tuning.ts`: fight values, upgrade costs and effects, lair rewind (AC: 2, 12–16, 19)
- [x] `src/fight/rng.ts`, `dice.ts`, `limits.ts` (AC: 1–3, 16)
- [x] `src/fight/fight.ts`: start, the phase machine, placing, the dial, strikes, leaving (AC: 2–11)
- [x] `src/fight/settle.ts`: rewards paid, piles, torn pages, lair rewind (AC: 13–15)
- [x] `src/economy/`: parts, rewards, upgrade costs, buying (AC: 12, 16)
- [x] `src/content/lairs.ts` with its content test (AC: 17)
- [x] `src/fight/scripted-players.ts` and `src/fight/balance.test.ts` (AC: 18)
- [x] Unit tests for every rule and edge case; `npm run check && npm test && npm run build` green (AC: 1–19)
- [ ] **Epic 3:** the store's `fight` slice, `SAVE_TRIGGERS` (`StrikeLanded`, `FightEnded`, `UpgradeBought`), the fight scene and the play-log entries. See "For epic 3" below.

## Dev Notes

- **Sources:** GDD, Automaton fights (rules table, upgrades, simulation table) and Level Structure (lairs, torn pages); architecture, State Transitions (fight phases), Consistency Rules (time and randomness only through `ctx`), Data Architecture (`SaveV1.economy`, `progress.tornPages`, `fight`), ADR-8 and ADR-13.
- **Pure folders only.** `fight/` and `economy/` import each other, `config` and nothing else; tests also import `content`. `content/lairs.ts` imports only types.
- **Phases:** `roll ─roll→ place ─three slots filled→ set ─strike→ strike | won | lost`, and `strike ─roll→ place` for the next round. `place` and `set` accept placing and unplacing; only `set` accepts blows and strikes.

### For epic 3

- `startFight(lair, save.economy.upgrades, seedFrom(ctx.rng))`, then `reduceFight(state.fight, action)` for `fight/roll`, `fight/place`, `fight/unplace`, `fight/blows`, `fight/strike` and `fight/leave`. A `null` state means he left for free: clear the fight and settle nothing.
- When the phase becomes `won` or `lost`, call `settleFight({ economy, tornPages }, fight, lairs[fight.lairId], ctx.now)` **in the same reduction** that sets `save.fight = null`, so a reload can never settle twice.
- Before starting, check `lairAwake(economy, lairId, ctx.now)`; a winding-down lair can't be fought.
- The banner reads `fight.lastStrike` (`blade · blows + charge = damage`) in any phase, including `won` and `lost`. The dial's range is `blowRange(fight)`; the values on the slots are `placedValues(fight)`.
- `buyUpgrade(economy, id)` returns `UpgradeBought`; costs come from `upgradeCost(id)`.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), unattended overnight run, lane branch `lane/fight`.

### Calls Made

- **"Reasoning perfectly" is per-round perfect arithmetic, not whole-fight planning.** Each round the reasoning player looks at every placement of three dice and every legal blow count. If any of them brings armour to 0 or below, it takes the one paying the most parts (base plus steam left, doubled on a clean cut); otherwise it takes the one dealing the most damage, with the fewest blows on ties. This is the only definition I tried that reproduces the GDD's whole table. The strategy that truly maximises the chance of winning (dynamic programming over armour, hull and steam) wins 99.7%, 97.0%, 81.7% and **43.7%** at armour 20–60, which misses the GDD's 39% at armour 60 by more than 2 points, so it is not what the GDD simulated. The GDD's phrase is loose; the numbers are kept.
- **The random player** picks one of the 6 (or 24 with four dice) ordered placements uniformly and sets blows to the most the reach and steam allow.
- **Measured against the GDD** (simulated 40,000 fights per tier with fixed seeds / exact over every roll):

  | Armour | Reasoning wins | Random wins | Parts: reasoning | Parts: random |
  |---|---|---|---|---|
  | 20 | 99.66% / 99.67% (GDD 99.7%) | 98.01% / 97.97% (98%) | 13.03 / 13.03 (13) | 6.85 / 6.84 (7) |
  | 30 | 96.90% / 96.99% (97%) | 82.94% / 82.87% (83%) | 11.73 / 11.74 (12) | 5.50 / 5.47 (5.5) |
  | 45 | 81.67% / 81.68% (81%) | 40.22% / 40.21% (41%) | 8.56 / 8.57 (8.5) | 2.52 / 2.53 (2.5) |
  | 60 | 38.76% / 38.94% (39%) | 7.61% / 7.49% (8%) | 3.51 / 3.53 (3.5) | **0.553 / 0.540 (0.6)** |

  With all three upgrades the reasoning player wins 98.30% at armour 60 (GDD 98%).
- **One check skipped, rules unchanged:** the random player's parts per fight at armour 60 is exactly 0.5399, 10.01% under the GDD's 0.6. The simulated run happens to land at 0.553 with its seed, but whether it passes depends on the seed, so both parts checks for that cell are `it.skip` with the numbers in a comment. Everything else passes. The GDD's 0.6 looks like a rounded, noisy run of the same rules.
- **The full 40,000 fights run by default.** The whole balance file takes about 2.5 seconds (360,000 simulated fights plus the exact enumeration), so no environment variable is needed to keep the default run under 20 seconds.
- **An exact enumeration was added next to the simulation:** every roll and, for the random player, every placement, through `reduceFight`, memoised on armour, hull and steam. It gives noise-free expected values and checks that the simulation agrees within 4 standard errors. The exact pass covers three dice only; the four-dice upgrade case is simulated only.
- **The fight carries its own generator state** (`FightState.rng`), seeded once from `ctx.rng` at the start, rather than drawing each roll from `ctx.rng`. A resumed fight then rolls exactly what it would have, and reloading after a bad roll can't re-roll it. Randomness still enters only through the injected seed.
- **Blows are at least 1; the dial opens at 1.** The GDD doesn't allow a strike with no blows, and with `x = 0` the charge would strike for free. The GDD's numbers are reproduced with at least one blow.
- **Phase `strike` means "struck, armour left, dented, waiting for the next roll".** A winning or losing strike goes straight to `won` or `lost`. `fight/roll` is legal in `roll` and `strike`, so the next round is one tap.
- **The dent comes before the loss check,** and when hull and steam run out together the reason is `hull`.
- **Moving a die between slots empties its old slot,** so the dial closes and reopens at 1. Only a die swapped in from outside the slots (the 4th die onto reach) keeps the dial open, with blows clamped.
- **Overkill wins without the doubling,** and the armour shown is 0.
- **A recovered pile is paid on top of the reward and never doubled.** Under 4 parts a loss drops nothing and creates no pile entry. "Unspent parts" is his balance at the moment of the loss; the pile already at the automaton isn't part of it.
- **Only a win winds an automaton down.** After a loss it stays awake, so he can go straight back for his pile. An unreadable `rewindsAt` counts as rewound, so a damaged save can't lock a lair for good.
- **Events:** `settleFight`, not `reduceFight`, emits `FightEnded`, because only settling knows the parts. Its `parts` is the signed change in his parts (reward plus pile on a win, minus the drop on a loss). Added `DiceRolled`, `StrikeLanded` (the ADR-8 save trigger), `TornPageReturned` and `UpgradeBought`; the architecture lists only `FightEnded`.
- **Ids:** lairs `lair-20` to `lair-60` (architecture); torn pages `page-1` to `page-3` in story order, so retuning armour never renames a page; upgrades `fourth-die`, `steam`, `hull`.
- **Types:** `LairId`, `PageId`, `LairSpec`, `FightState`, actions and events in `fight/types.ts`; `UpgradeId` and `Economy` (the shape of `SaveV1.economy`, including `paidPredictions` for story 3.6) in `economy/types.ts`.
- **No Immer in the fight reducer;** plain object spreads keep the simulation fast. The store's root reducer can still wrap it in `produce`.
- **Tuning is grouped** under `tuning.fight` and `tuning.upgrades` in one exported object, so this lane's block is in one place. `src/config/tuning.ts` is new on this branch; if another lane also creates it, the merge keeps both blocks.
- **The lairs' map positions (near rooms 2, 5, 8 and 12) are left to the map content in epic 2;** `RoomId` doesn't exist yet.
- **No contradictions found** between the GDD, the architecture and the epics on fight rules. The two GDD wording issues are the loose "reasoning perfectly" and the rounded 0.6, both above.

### Completion Notes

- All rules are pure functions over plain data; nothing in `fight/` or `economy/` reads the clock or `Math.random()`.
- The reducer returns the same state object for an ignored action, so callers can test `next === state`.
- `settleFight` and the economy functions never mutate their input (tested with `structuredClone`).

### Test Results

- `npm run check` (Biome CI): 54 files, no errors. `tsc --noEmit` (in `npm run build`): no errors.
- `npm test`: 21 files, 276 passing, 2 skipped (the random player's parts at armour 60, simulated and exact). New: `fight/rng`, `dice`, `limits`, `fight`, `settle`, `scripted-players`, `balance`; `economy/parts`, `rewards`, `upgrades`; `content/lairs`. Whole suite about 3 seconds.
- `npm run build`: 0.85 MB in 9 files; JavaScript 0.25 MB gzipped (no change: nothing imports the fight code yet).

### File List

- `src/config/tuning.ts`
- `src/fight/types.ts`, `src/fight/rng.ts`, `src/fight/rng.test.ts`, `src/fight/dice.ts`, `src/fight/dice.test.ts`, `src/fight/limits.ts`, `src/fight/limits.test.ts`
- `src/fight/fight.ts`, `src/fight/fight.test.ts`, `src/fight/settle.ts`, `src/fight/settle.test.ts`
- `src/fight/scripted-players.ts`, `src/fight/scripted-players.test.ts`, `src/fight/balance.test.ts`
- `src/economy/types.ts`, `src/economy/parts.ts`, `src/economy/parts.test.ts`, `src/economy/rewards.ts`, `src/economy/rewards.test.ts`, `src/economy/upgrades.ts`, `src/economy/upgrades.test.ts`
- `src/content/lairs.ts`, `src/content/lairs.test.ts`
- This story file
