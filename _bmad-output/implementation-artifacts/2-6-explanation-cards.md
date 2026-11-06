# Story 2.6: Explanation cards

Status: done

## Story

As Luka's son,
I want to know the real name for what I just did,
so that what I learned matches what school calls it.

**Covers:** FR34 for rooms 1–7; NFR13.

## Acceptance Criteria

1. **The ideas.**
   - Rooms 1–7's ideas, each with a card: level means equal (`equal`), the same step per notch (`notch`), a prediction, Balance, a split, judging without adding (`compare`), and finding a mistake.
   - Each room's spec lists the ideas it uses (`RoomSpec.ideas`): room 1 equal, room 2 the notch, room 3 a prediction, room 4 Balance and a split.
   - Rooms 5–7 list theirs when they are built (stories 2.8–2.10).
2. **When.**
   - The first time he finishes a room that uses an idea he hasn't had explained, the room's story card goes on: Nikola asks "Kako to radi?", and a card gives the school term and one or two sentences.
   - Each card shows once (`progress.ideasSeen`), even when a later room uses the idea again, or rooms come in another order.
3. **The text.**
   - In `hr.ts` (`hr.ideas`): a term ("Jednadžba", "Umnožak", "Procjena i provjera", "Isto na obje strane", "Dijeljenje obiju strana", "Usporedba", "Provjera") and at most two sentences.
   - Never praise (NFR13), and no gendered past tense about him.
4. **The log.** The city's log shows each card under the room that explained it, to reread.
5. **Checks.**
   - Pure tests for new ideas and their place in the log.
   - A store test: ideas seen as the card is told, kept through a reload.
   - Content and render tests: terms, sentences, no praise, the card after the lines, the log.
   - A headless play-through at 1280 × 800 and 640 × 360, with screenshots looked at.

## Calls made (for Luka's veto)

- The card is part of the room's story card, after the townspeople's lines, not a separate screen: one tap ("Dalje") for both.
- Room 2's second line changed from Nikola asking how ("A kako svjetiljka zna koliko treba?") to "Sreća? Meni ne izgleda kao sreća.", because Nikola's "Kako to radi?" now leads into the card.
- The wording targets 5th-grade school terms (jednadžba, umnožak, uvrstiti, jednakost). Placeholder text, like all of `hr.ts`, until epic 6.
- On a phone in landscape, the lines and the cards sit side by side so the card fits without scrolling. If a card is ever taller than the screen, it scrolls from its top.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/room/types.ts`: `ideaIds`, `IdeaId`, `RoomSpec.ideas`.
- `src/room/ideas.ts` (pure): `newIdeas`, `ideasByRoom`.
- Rooms 1–4's content lists their ideas.
- Save: `progress.ideasSeen`, added when a room's card is told (`withTold`).
- `hr.ts`: `hr.ideas`; room 2's second line.
- `src/ui/story/`: `IdeaCards`; the card's layout for phones. The log shows the cards (`MapScreen.tsx`).

### Review (one pass) and fixes

No correctness bug in normal play. All findings were fixed:
1. A save that has rooms told but no  (from the 2.5 build) would never show those rooms' cards anywhere. The decoder now counts the told rooms' ideas as seen, so the log shows them (with a test). This also fixes the log placing an idea under the wrong room for such a save.
2. On the tablet, Dalje came before the cards in the markup, so a screen reader read it too early. It now comes last in the markup, and the phone layout uses a grid instead of .
3. The card's term was an  under the log's  rooms. It is now a paragraph, in bold.
4.  had no fallback for older Safari. It now sits in , over plain centring.
5. The Croatian:
   - the notch card says "pomak klizača", not "zarez" (school's decimal comma), and reasons the right way round;
   - the prediction card says "prvo pokušaš pogoditi" and "uvrstiš u jednadžbu";
   - the equal card says "to označava znak =";
   - the mistake card is now "Traženje pogreške", reworded, so it doesn't overlap "Procjena i provjera";
   - room 3's lines are reordered ("Gle, automat kod stupa!…", "Prema Knjizi, smije. A voda teče, to je glavno."), so Nikola's "Kako to radi?" follows the water, not the Automaton.

### Checks

- `npm run check`, `npm test` (2,044 passed) and `npm run build` pass.
- Headless play (`play25.mjs`, scratchpad), at 1280 × 800 and 640 × 360: rooms 1–4 with their cards (Jednadžba after room 1, Umnožak after room 2, Procjena i provjera after room 3, the two Balance cards after room 4), and the log. No console errors. Screenshots looked at.
