# Story 3.2: Strike: armour, clean cuts and dents

Status: done

## Story

As Luka's son,
I want my strike to land and show the sum,
so that I see whether my plan was right.

**Covers:** FR38 (strike, banner, dent); FR39; FR40 (losing, leaving after a strike).

## Acceptance Criteria

1. **When** he strikes, **then** the banner shows the sum, such as `6 · 3 + 2 = 20`, the armour drops by it (never below 0), and steam drops by one per blow.
2. **Given** armour left after the strike, **then** the automaton dents his hull and the next round starts with a roll.
3. **Given** armour brought to exactly 0, **then** it is a clean cut, shown as such, and he wins; armour below 0 also wins, without the clean cut.
4. **Given** armour left and his hull or steam at 0, **then** he loses; armour is checked first, so winning on the last steam counts.
5. **Given** a fight after his first strike, **when** he leaves, **then** it counts as losing, and he is told so before he confirms.
6. **And** the fight is saved after every strike.

## Calls made (for Luka's veto)

- **The rules were already there.** Story 3.1 put the strike, the win, the loss and settling through the store; this story is the screen over them: the strike button, the banner, the dent, the end, and the question before leaving.
- **The strike button sits under the blows dial,** off until all three slots are filled.
- **After a strike the banner replaces `a · x + b` and the dial** until the next roll: the sum with its total, "Oklop 20 → 4", and "Automat uzvraća: udubljenje u trupu." when it dents him. His hull plates shake once and one shows a crack. The slots keep showing the round's dice, off.
- **A clean cut says so** ("Čisti rez!") and the banner's frame is heavier. That it doubled the reward shows with the parts in story 3.3.
- **The end replaces the bench:** "Automat staje i odmotava se." (the automaton tilts and fades as it winds down) or "Automat je ovaj put jači." with why (hull, steam, or left early), and "Natrag na kartu". Leaving after a strike ends the fight with no banner, since leaving isn't a strike. The leave button goes once the fight is over.
- **Leaving after a strike asks first:** "Ako sada odeš, automat pobjeđuje i dio tvojih dijelova ostaje ovdje." with "Ostajem" first and "Ipak idem". It is a dialog: the fight behind it dims and takes no taps, and the box sits at the bottom, so his hull, steam and the last sum stay readable while he decides. Before the first strike leaving is free and asks nothing.
- **No "well done" anywhere** (NFR13): the end says what the automaton does, not how he did. Parts and the pile come in story 3.3.
- All new text is placeholder in `hr.ts`, as all text is until epic 6, and avoids gendered past tense.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/ui/fight/FightEnd.tsx`: `StrikeBanner`, `FightEndPanel`, `LeaveConfirm`.
- `src/ui/fight/FightScreen.tsx`: the strike button; the banner after a strike and at the end; the end panel; asking before leaving after a strike; the winding-down automaton; the hull shaking on a dent.
- `src/ui/fight/fight.css`: their styles at both sizes, with reduced motion.
- `src/content/text/hr.ts`: the strike's and the end's text.

### Review (one pass) and fixes

The review found no blocking defects and confirmed every phase renders the right thing, a fight resumed in phase `strike` shows its banner, no path loses without asking, and every strike saves. It found five issues, all fixed:

1. **The leave question wasn't a real dialog:** he could roll behind it and play a round with it open, and on a phone it covered the gauges and the sum. It is now a dialog with a backdrop that takes the taps, anchored at the bottom, and a new round or the fight's end closes it.
2. **A die held when he struck stayed held,** lighting every slot in phase `strike` and popping up for a frame on the next roll. A die is held only while placing, and striking puts it down.
3. **The tests overstated AC5** (a test-only prop forced the question open). The decision is now a pure helper (`tapLeave`, tested), the prop is gone, and tests cover the hull and steam reasons, a win below 0 without a clean cut, a win with no dent line, and the dialog's two answers.
4. **The hull shook again after a reload in a later round.** It shakes only in phase `strike`, right after a dent.
5. **Slots after a strike looked live.** They are dimmed until the next roll.

### Tests

- `src/ui/fight/FightScreen.test.tsx` (13) and `src/ui/fight/taps.test.ts` (4): the strike button off until the dial opens; the banner's sum, armour and dent; the roll for the next round; the slots off after a strike; a clean cut, and a win below 0 without one; the win's and the loss's end (hull, steam, left), with the way back; no banner after leaving early; leaving free before a strike and asked after; the dialog's answers.
- The rules and the store under them: `src/fight/fight.test.ts` and `src/store/fight.test.ts` (from the rules story and 3.1).

### Checks

- `npm run check`, `npm test` (2,275 passed, 2 skipped) and `npm run build` pass.
- After the fixes, headless screenshots at both sizes (Edge, a scratch Playwright script against the dev server on 5290): the lair, the start, a held die, the dial set, the strike's banner, the leave dialog and the loss. No page errors.
- Played in the dev server by tapping, at 1280 × 800: `5 · 3 + 1 = 16`, armour 20 → 4, a dent; asked to leave and stayed; `5 · 3 + 1 = 16` again, armour 4 → 0, the win, back to the map. At 640 × 360: two soft strikes, then left, confirmed: lost (left), a quarter of his 19 parts (4) dropped at the lair. Screenshots of the banner, the question, the win and the loss were looked at at both sizes.
