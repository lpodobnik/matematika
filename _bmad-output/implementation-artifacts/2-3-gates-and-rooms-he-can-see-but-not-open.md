# Story 2.3: Gates and rooms he can see but not open

Status: done

## Story

As Luka's son,
I want locked places I can see from where I am,
so that I know there's more, and what opens it.

**Covers:** FR28–FR32.

## Acceptance Criteria

1. **Gates are data (FR28, FR32).**
   - Each node in `content/map.ts` may carry what opens it: tools earned and rooms finished, never parts. The GDD's table:
     - Balance (room 3) opens rooms 4 and 5;
     - the workshop (room 6) opens the workshop;
     - the gear chain (room 7) opens rooms 8 and 9;
     - the recording drum (room 12) opens room 13.
   - Rooms 5 and 6 can be played in either order, and room 7 opens once both are finished. Likewise rooms 9 and 10, then room 11.
   - The foundry gate is sealed: it never opens in the MVP.
   - `city/reach.ts` decides from `roomsDone`, `tools` and the authored rooms only.
2. **What he sees.** A node shows once a room beside it is finished (room 1 shows from the start). Each node shows one of five looks:
   - **Restored:** a room he has finished.
   - **Open:** a room he can travel to.
   - **Locked:** a node he can see whose gate isn't met. It is named, drawn in ink and not tappable, with a lock badge that shows what opens it: Balance's weights, the gear chain or the drum. The foundry gate shows its plate, `5 · x = 40` (FR30).
   - **Seen:** a node he can see whose gate is met, but which takes him nowhere yet. These are the lairs, the workshop (until their epics), and rooms not yet authored. It is named, drawn in ink and not tappable (FR31: the lairs appear once seen; their fights come in epic 3).
   - **Unseen:** grey and unnamed, as in story 2.2.
3. **Return trip (FR29).** After room 2 the bridge (room 5) shows from it, locked with Balance's weights until room 3 earns Balance. The steam lift (room 9) shows from room 3, locked with the gear chain.
4. **Screen readers.** Each node says its name and its look ("Most, zaključano") or, unseen, only "zatvoreno".
5. **Checks.**
   - Pure tests: each gate in the GDD's table, the either-order pairs, the sealed foundry, and parts never opening anything.
   - A content test: every lock names a gate the node has.
   - A headless play-through at 1280 × 800 and 640 × 360. After room 2: the bridge shows locked, and lair 20 shows. After room 3: the steam lift shows locked with the chain. After room 4: room 6 shows. Screenshots looked at.

## Calls made (for Luka's veto)

- Room 7 opens only once **both** rooms 5 and 6 are finished, and room 11 once both 9 and 10 are: the GDD's order reads "5 and 6 in either order → 7". With roads alone, finishing either one would open it.
- A node shows once a room **beside it is finished**, not merely open. This is the AC's "after room 2, the bridge is visible from it".
- Lairs and the workshop show but take no taps until their epics, rather than opening an empty screen.
- A tool opens both its rooms at once. Balance opens the bridge with room 4, and the gear chain opens the steam lift with room 8, so from the map he could play room 5 before room 4, or room 9 before room 8. The GDD's "room 4, then room 5" and "room 8, then room 9" are read as play order, which the hand-over after a restart keeps: room 4 and room 8 load next.
- A gate that waits only for rooms (rooms 7 and 11) shows a plain padlock.
- Rooms 5–13 are not authored yet. Once their gate is met they show as "seen": named, but not tappable until their stories.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/city/types.ts`: `Gate` (tools, rooms, sealed) and `LockKind` on `NodeSpec`, with a `plate` for the foundry.
- `src/content/map.ts`: the GDD's gate table on the nodes.
- `src/city/reach.ts`: a `Reach` (rooms finished, tools, rooms authored); `nodeSeen`, `gateMet`, `roomOpen`, `nextRoomOnMap`, `nodeState` with five looks; `mapView` takes the tools. What the map shows is derived, not saved.
- `src/store/reducer.ts`: every reach check takes the tools (`reachOf`).
- `src/ui/map/`: seen and locked nodes are named, in ink, with a dashed ring, and take no tap. A lock badge shows Balance's weights, the gear chain, the drum, or a padlock. The foundry shows its plate.
- `hr.ts`: `zaključano` and `uskoro` for screen readers.
- Architecture: the map's visibility is derived; `seen` and `at` are dropped from `SaveV1`.

### Review (one pass) and fixes

One review: no blocking bugs. It checked the gate table against the GDD, that tools reach every check, the order Balance is saved in, every look, softlocks and labels, and probed the first three.
1. The foundry's plate pushed its glyph off its spot. Fixed: the plate sits over the gate, out of the button's flow, as the name sits below. Looked at from room 6 (a save with room 6 done), the foundry and the workshop crowded room 6's name on a phone, so both moved into open space (the foundry to 1060, 680; the workshop to 1160, 430).
2. The steam lift can come before room 8, like the bridge before room 4. Added to the calls.

### Checks

- Tests: each gate in the GDD's table, the either-order pairs, the sealed foundry, locks matching their gates, gates naming only tools and rooms, and every allowed order finishing all 13 rooms (9 orders, all authored).
- Headless play (`play23.mjs`, scratchpad), at 1280 × 800 and 640 × 360:
  - After room 2: the bridge is locked with the weights and Automat 20 is seen; a tap on the bridge does nothing.
  - After room 3: the steam lift is locked with the chain, and the bridge is seen.
  - After room 4: Vagaonica is seen.
  - No console errors. Screenshots looked at.
