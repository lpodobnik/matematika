# Story 2.4: His name and his look

Status: done

## Story

As Luka's son,
I want to name my apprentice and pick how he looks,
so that the story is mine.

**Covers:** FR36; narrative design, the apprentice and the opening.

## Acceptance Criteria

1. **When.**
   - When room 1's restart ends with no name yet, the naming screen comes, before room 2: Gospon Penkala asks who he is (narrative design, Opening: "Naming is a reward for proving himself").
   - A reload during room 1's restart, or on the naming screen, comes back to the naming.
   - A save from before this story, with rooms finished but no name, is asked once; then the next room follows, or the map when none is left.
2. **The name.**
   - A text field, the only one in the game, so the OS keyboard comes up only here.
   - The name is tidied: spaces collapsed, control characters dropped, at most 16 letters, never half of one.
   - An empty name can't be confirmed.
3. **The look.**
   - The art bible's six looks, in grey (NFR12), each a button of at least 48 CSS px, with a description for screen readers.
   - One must be picked.
4. **The reply.**
   - Penkala answers with the name ("Đuro? Hm. Toga nema u knjizi."), the first line to use it, and "Dalje" goes on to room 2.
   - Townspeople's lines from story 2.5 take the name the same way, as a parameter of their line in `hr.ts`.
5. **Saved.**
   - `character {name, look}` is saved on the device (story 2.1); the decoder keeps only a known look and a tidied name. Nothing about it leaves the device.
6. **Checks.**
   - Store tests: the naming after room 1, saving, refusals, reloads, an old save.
   - Pure tests: tidying names.
   - Render tests: the screen, the confirm button, the reply, grey, target sizes.
   - A headless play-through at 1280 × 800 and 640 × 360: room 1, the name typed on the keyboard, a look tapped, the reply, room 2, a reload. Screenshots looked at.

## Calls made (for Luka's veto)

- The looks are the art bible's test images t14–t19 as they are, as placeholders until the final looks (story 2.12, epic 6). Look 1's brass goggles and look 5's copper buttons don't show, since every look is grey.
- The apprentice is grey, as NFR12 says, so the picker reads by shape and value only. A colour apprentice would be an NFR12 exception for the GDD (the art bible's open question).
- Names are cut to 16 letters, down from the decoder's 24: enough for a name and a nickname, short enough for a line of dialogue.
- Penkala's reply is "{name}? Hm. Toga nema u knjizi." ("That's not in the book"), his line from the narrative design. Placeholder text, like all of `hr.ts`.
- There is no way to rename yet; the dev panel's new game starts over.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/city/character.ts`: `lookIds`, `cleanName`, `needsName`, `maxNameLength` (16).
- `src/save/`: `Character.look` is a `LookId`; the decoder tidies the name and keeps only a known look.
- Store: the `naming` screen, the `character/set` action. A restart of room 1 with no name stops there, and a launch with no name after room 1 opens it. The naming then goes on to the room after room 1.
- `src/ui/naming/`: `NamingScreen.tsx` (the form, the looks, Penkala's reply) and `naming.css`. The six looks are `looks/look-1.webp` to `look-6.webp`, copied from `art-src/tests/`.
- `hr.ts`: `naming`.

### Review (one pass) and fixes

Four findings, all fixed with a test or a replay:
1. A save from before the naming with a room in progress resumed that room, and the map button then opened the naming. Now the naming comes first, and that room waits with the rooms he left halfway, resuming when its turn comes.
2. The confirm button was disabled until a look was picked, so the keyboard's Enter did nothing and the keyboard stayed over the looks. The button is now `aria-disabled`, and Enter with no look closes the keyboard.
3. Names were cut by code point, which could split an emoji. They're now cut by characters as they show (`Intl.Segmenter`), in the decoder too.
4. The field took 24 characters but kept 16. It now takes 16.

Also, a misplaced comment in `hr.ts` was moved back. Penkala's reply is centred, since it has no keyboard to make room for.

### Checks

- `npm run check`, `npm test` (2,021 passed) and `npm run build` pass.
- Headless play (`play24.mjs`, scratchpad), at 1280 × 800 and 640 × 360:
  - room 1 played through;
  - "Đuro Kovač" typed on the keyboard, Enter pressed before a look (the keyboard closes, the naming stays), then look 3 tapped;
  - Penkala answers with the name, and "Dalje" opens room 2;
  - a reload stays in room 2 with the name and look kept.
  - No console errors. Screenshots looked at.
