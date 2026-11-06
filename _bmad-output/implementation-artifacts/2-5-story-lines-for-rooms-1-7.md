# Story 2.5: Story lines for rooms 1–7

Status: done

## Story

As Luka's son,
I want the city to talk back when I fix things,
so that each restart feels like it matters.

**Covers:** FR37 for rooms 1–7; NFR13; narrative design, Story Beats, Dialogue Framework, Found Documents and In-Game Storytelling.

## Acceptance Criteria

1. **When.**
   - The first time a room's restart ends, a story card comes before anything else: before the naming after room 1, the next room, or the map.
   - Replaying a finished room tells nothing again.
   - A reload on the card, or during the restart, comes back to it.
   - A save from before this story tells each finished room's lines once, in order.
2. **What.**
   - One or two lines per room from the narrative design's beats, in Croatian in `hr.ts` (`hr.story`), each at most 80 characters even with the longest name. Who says each one is named.
   - Lines after the naming may take his name (room 2: "Čista sreća, Lana. Ništa drugo.").
   - No line praises him (NFR13), and none addresses him with a gendered past tense.
3. **Found documents.**
   - Kristijan's notebook note (room 7) reads as a note in his hand.
   - The First Automaton's notice (room 5) reads as punched tape, in capitals.
   - Both are written now and show once rooms 5 and 7 are built (stories 2.8 and 2.10).
4. **The city's log (FR37).**
   - A button on the map opens every line he has been told, room by room in the order he restarted them, to read again.
   - The save keeps that order (`progress.told`).
5. **Checks.**
   - Store tests: the card after a first restart, a replay with no card, reloads, an old save, the dev panel's new game.
   - Content tests: lines per room, line length, capitals, dialect, no praise, the name.
   - Render tests: the card, the note and notice, the log.
   - A headless play-through at 1280 × 800 and 640 × 360: rooms 1–4 with their cards, the log, and rooms 5 and 7's cards from a save. Screenshots looked at.

## Calls made (for Luka's veto)

- **Where the lines show.** The narrative design puts them in speech bubbles on the map after each restart. You vetoed the map after a restart, so they show on a card between rooms instead: who speaks, their lines, and "Dalje".
- **Room 1's card comes before the naming.** Penkala's lines are about the door, then he asks who he is. His reply to the name changed to "{name}? Hm. Zapisat ću to. Olovkom, za svaki slučaj.", because "Toga nema u Knjizi" now closes room 1's card.
- **Notes and notices are on the card.** Kristijan's note and the First Automaton's notice show on the card with the townspeople's lines, not on the machines in the room, since story arrives only between rooms. Rooms 1–4 have neither: the beats put the first notice at room 5 and the note at room 7.
- **The log is a book icon,** top right of the map, so it stays clear of room 13's spot on a phone. Room 13 moved a little left and down (to 1300, 230) for the same reason.
- **The opening line** (Penkala turning the handle three times before room 1) is not in this story. It belongs to the room 1 scene and comes with the scene work in epic 6.
- **The text is placeholder,** like all of `hr.ts`, until the final text in epic 6.

## Dev Agent Record

### Built (main session, `epic-1`)

- Save: `progress.told` (rooms whose lines he has seen, in order).
- Store: the `story` screen and the `story/next` action. What is owed before any room is `owed(save)`: a finished room not yet told, then the naming. A restart's end, a launch, and the naming all go through it.
- `hr.ts`: `hr.story` (speakers, lines for rooms 1–7, the log); the naming's reply.
- `src/ui/story/`: `StoryLines.tsx` (a room's lines, with the note and notice looks), `StoryScreen.tsx` (the card), `story.css`.
- `src/ui/map/MapScreen.tsx`: the log button and `CityLog`.

### Review (one pass) and fixes

Six findings, all fixed (1 and 2 with tests):
1. An old save that was on the map went into a room after its cards. Now the card and the naming leave where he was as it was, and he goes back to the map.
2. An old save with a room in progress that wasn't next in order lost that room after its cards, and left an empty entry among the rooms left halfway. Now a room in progress at launch stays loaded under the card or the naming, saved as before, and he goes back to it. This replaces story 2.4's setting aside.
3. Room 6's line called the weighing yard the workshop. It now reads: "Ona radionica tamo bila je Kristijanova. Ključ je odsad tvoj."
4. The fallback name before naming, used only by dev jumps, is now in the vocative: "šegrte".
5. Two stiff lines now read better: "A ova su se digla bez kurble." and "A kako svjetiljka zna koliko treba?".
6. Room 13 nearly touched the log button on small phones, so it moved to (1300, 230).

Known, not fixed: below the 640 × 360 target, at 568 × 320, the map crowds. The foundry's plate covers "Radionica", and the note covers "Parno dizalo". This is for the map illustration (story 2.12, epic 6).

### Checks

- `npm run check`, `npm test` (2,037 passed) and `npm run build` pass.
- Headless play (`play25.mjs`, scratchpad), at 1280 × 800 and 640 × 360:
  - rooms 1–4, each with its card (Dalje tapped);
  - the naming after room 1's card; room 2's line uses the name;
  - the map after room 4, and the log listing rooms 1–4's lines in order;
  - rooms 5 and 7's cards from a save: the notice on punched tape and Kristijan's note.
  - No console errors. Screenshots looked at.
