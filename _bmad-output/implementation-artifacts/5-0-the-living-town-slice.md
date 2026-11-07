# Story 5.0: The living town, a slice

Status: in-progress

## Why

Luka played a fresh game on 2026-11-07 and called it "puzzle after puzzle with text in between". He was right on three counts:

- A new game drops straight into room 1, with no opening, although the narrative design has one ("Opening | Start | The city is stopped… He finds the notebook", and Penkala's handle-turning joke).
- After each restart the game hands him straight to the next room, so the map, the lairs and the workshop hide behind the flow.
- Townspeople speak in story cards before he has met them.

He pictured a town he walks through, early-Zelda-like, isometric, with real art. This story builds one street of it, as a slice he can judge before the rest of the district is reworked. Epic 5 (rooms for friends) waits until the slice is accepted.

## Story

As Luka's son,
I want to start in a town I can walk around, meet its people and find the broken machines myself,
so that the puzzles are things I fix in a place, not levels in a list.

## Acceptance criteria

1. A new game opens on a short illustrated opening (4 panels, skippable): the city, the Clockmaker gone, Penkala turning handles by the Book, the notebook found.
2. Then he picks his name and look (moved from after room 1), and arrives in the town square.
3. The town square is an isometric, illustrated place. He taps where to go, and his character walks there around obstacles.
4. The gate machine (room 1), the street lamps (room 2), Kristijan's workshop and an automaton are places in the square. Walking up to a machine he can play opens its room. One he can't play yet says why in a bubble.
5. People in the square introduce themselves the first time they speak: a name and who they are (Gospon Penkala, the conductor; Nikola, the lamplighter's kid).
6. After a restart he comes back to the town, not to the next room; the restarted machine shows in colour and moves (the gate open, the lamps lit).
7. The rest of the district stays reachable through the map button in the town, until later stories put it into streets.
8. The map button in a room works from the first moment, not only after the first touch.
9. It plays at 1280 × 800 and 640 × 360, on touch and with a mouse.

## Calls made (for Luka's veto)

- **"Early Zelda" read as the feel** (a town to explore, people, secrets, automatons in the streets), **"isometric" as the camera.** Two style tests decide the look: the game's ink-and-watercolour style drawn isometric, and pixel art. Luka picks; the one not picked is not used.
- **The slice is one square,** holding rooms 1 and 2, the workshop and the first lair. The other rooms are reached through the map until they get streets of their own.
- **The town reuses the map's rules** (city/reach.ts): what is open, locked or restored is the same; only how he gets there changes.
- **The image cap** in `art-src/tools/fal-generate.mjs` now comes from CREDITS' first line, raised from 30 to 70 for this slice.
- **Ink and watercolour for now.** Luka was sent both style tests (t29 ink, t30 pixel) and hasn't picked yet; the slice is built in the game's existing ink style, so the six looks and the automaton carry over. Switching to pixel art means regenerating the square, the people and the opening.
- **The final square was edited from the style test** (FLUX.2 edit), so every position held: lamps unlit, fountain dry, a workshop door. A second edit raised the gate, and the town swaps to it once room 1 restarts.
- **Grey until fixed, as a blueprint.** The square shows in pale blue-grey; a restored machine blooms into colour in a soft circle (narrative design: "a grey blueprint city that gains brass, motion and sound").
- **People are met once.** Who has introduced themself is kept in the browser's storage, not in the save, for the slice.
- **The naming comes after the opening**, before any room: his character walks the town, so it needs a look first. Penkala's naming line still fits.

## Dev Agent Record

### Built (main session, `epic-1`)

- **Flow (store):**
  - `opening` screen and `opening/done`;
  - `progress.openingSeen` (decoded as seen for any save with a room done or in progress);
  - the naming after the opening;
  - no automatic next room at boot or after a restart;
  - `leaveWorks` lets the map button work during the arrival.
- **Town:**
  - `src/city/walk.ts` (A* on a 20-unit grid with path pulling, tested);
  - `src/content/town.ts` (ground, places, people, the automaton's round, lamp heads);
  - `src/ui/town/` (TownScreen, its art, CSS).
- **Opening:** `src/ui/opening/`, with four panels.
- **Loading:** `src/app/boot.ts` now preloads the opening and town pictures behind the loading screen.
- **Art:**
  - t29–t38 in `art-src/CREDITS.md`;
  - `art-src/tools/cutout.mjs` cuts figures out of their cream ground;
  - the image cap now comes from CREDITS' first line (70).
- **Tests:**
  - store, save and app tests moved to the new flow;
  - `e2e/town.spec.ts` (new): opening → naming → town → Penkala → gate → room 1 → back in the town with the gate open → the district map.
