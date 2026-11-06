# Story 2.2: The city map

Status: done

## Story

As Luka's son,
I want a map of the district I can travel around,
so that the rooms become a city I am bringing back to life.

**Covers:** FR25, FR26 (leaving), FR27; NFR12.

## Acceptance Criteria

1. **The map.**
   - `content/map.ts` holds the GDD's 19 nodes: rooms 1–13, the four lairs (near rooms 2, 5, 8 and 12), the workshop and the foundry gate (both off room 6), with positions on a 1600 × 1000 map, and the GDD's edges: 1–2, 2–3, 3–4, 2–5, 4–6, 5–7, 6–7, 7–8, 3–9, 8–10, 9–11, 10–11, 11–12, 12–13, plus each lair, the workshop and the gate on its room.
   - It is drawn in code in `ui/map/` (a placeholder skin until the map illustration): paper, roads, and each node as its machine's glyph with its name from `hr.ts`.
   - Every node is grey ink (NFR12) until restored; a room he has finished shows its map change in colour (FR25), with shape carrying it too (the glyph runs: lamps lit, wheel turned, door up), so it reads without colour.
2. **Travelling.**
   - A node he can reach takes a tap and travels there at once (FR27): room 1, every finished room, and every authored room connected to a finished one. Rooms not yet authored (5–13 until their stories), the lairs, the workshop and the gate are drawn but don't take taps; story 2.3 gives them their gates and locked looks.
   - Tap targets are at least 48 CSS px at 640 × 360.
   - The room he should play next (the first reachable one he hasn't finished) pulses gently, once he has finished room 1.
3. **Leaving and coming back (FR26).**
   - A map control in the room takes him to the map from any phase before the lock.
   - A room he leaves keeps its committed lines and stage, in memory and in the save (`progress.started`); coming back resumes it as a reload does (story 2.1). Earlier stages stay solved.
   - The save keeps where he is: the room in progress, or none on the map. A launch on the map opens the map (`progress.onMap`); a launch between rooms, in a restart, goes on to the next room, so a first launch opens room 1.
4. **After a restart (Luka, 2026-11-06: "He should go to the next room").**
   - When a room's restart ends, the next room loads, as in epic 1: the room after it in play order if he can play it, otherwise the first open room he hasn't finished, resumed if he left it halfway.
   - With no room left to play, the map shows, with the finished room's change blooming. After room 4 the map replaces the "Nastavak slijedi…" screen and shows that note.
5. **Checks.**
   - Content tests: 19 nodes, the GDD's edges, every authored room on the map, no node off the map.
   - Pure tests for reachability and the next room.
   - A headless play-through at 1280 × 800 and 640 × 360: rooms 1–4 from the map, leaving room 3 halfway and coming back, a reload on the map, the screenshots looked at.

## Calls made (for Luka's veto)

- ~~After every restart he lands on the map.~~ Vetoed by Luka: the next room loads. The map is for leaving a room, choosing a room to replay, and the end.
- Drawn as HTML buttons over an SVG of the roads in `ui/map/`, not in Pixi as the architecture planned (`ui/scene/map/`). Each node is then a real button of at least 56 CSS px (48 on a phone) however small the board, it reads to a screen reader, and it is tested without a browser. The map illustration can sit under the same buttons, its grey state a CSS filter. The architecture is updated.
- Names on the map are placeholders in `hr.ts` (`Dizalo vrata`, `Ulične svjetiljke`, `Ustava`, `Vodeno kolo`, …). Only rooms he can reach are named; the rest are grey signs.
- A finished room can be played again from the map. Once Balance is earned, replaying room 1 offers the tray and shows the goal, as every stage with Balance does.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/city/`: `types.ts` (nodes and the map), `reach.ts` (`roomOpen`, `nextRoomOnMap`, `mapView`), pure and tested.
- `src/content/map.ts`: the district's 19 nodes and the GDD's edges, on a 1600 × 1000 map.
- `src/ui/map/`: `MapScreen.tsx` (HTML buttons over an SVG of the roads), `glyphs.tsx` (each machine's glyph, grey and restored), `map.css` (pulse, bloom, flow; still under reduced motion).
- `src/ui/common/MapButton.tsx`: the room's map control, bottom left.
- The store: `ui.screen` is `loading | room | map` (the "continued" screen is gone, its note now on the map); actions `map/open` and `map/travel`; the `RoomLeft` store event; `progress.started` in the save for rooms left halfway, resumed through story 2.1's `resumeRoom`.
- After a restart the next room loads (`moveOn` in `store/reducer.ts`), per Luka's veto.
- Architecture: the map lives in `ui/map/`, and `started` is in `SaveV1`.

### Review (one pass) and fixes

The first review agent stopped working partway and never reported; its probe test found two bugs, fixed with tests:
1. A room left at its second stage, before a line there, wasn't kept, so it came back at its first stage. A later stage is now always kept.
2. Leaving room 1 halfway on a first play, then reloading, started room 1 fresh and lost its lines.

A second review agent then reported five; all fixed, with tests except the fifth:
3. A reload during a restart opened the map, not the next room. The save now keeps whether he is on the map (`progress.onMap`): a launch with no room in progress opens the map only if he was on it, and otherwise goes on to the next room. This also fixes 2, and the next one.
4. Leaving room 1 with nothing written on a first play, then reloading, opened room 1, not the map.
5. The dev panel's new game kept the room that had just bloomed on the map.
6. Closed nodes told a screen reader their real names. They now say only "zatvoreno".
7. A left room that throws as it resumes would block that room, or every tick after a restart. It now starts fresh. No save that throws is known, so no test.

Not fixed, dev only: a dev panel jump out of a room drops that room's lines.

### Checks

- `npm run check`, `npm test` (1,994 passed) and `npm run build` pass.
- Headless play (a scratchpad script, `play22.mjs`), at 1280 × 800 and 640 × 360, with real clicks on the map and the map button: room 1 → room 2 loads; room 2 left halfway at its second stage and resumed from the map with its lines; rooms 3 and 4 load in turn; after room 4 the map, every room restored, with "Nastavak slijedi…"; a reload stays on the map. No console errors. Screenshots looked at.
