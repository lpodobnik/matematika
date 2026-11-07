# Story 6.2: Sound

Status: review

## Why

FR55 and the GDD's Audio and Music: "a tick per dial notch, a thunk when the pans level, a steam hiss on a jam", "the city's sound is the music: each restarted machine adds its own rhythmic loop at a shared tempo", and "a mute control is always available". The save has carried `settings.muted` since story 2.1, but nothing set it and nothing played.

## Story

As Luka's son,
I want the machines to click, thunk and hiss as I work them, and the town to fill with their rhythms as I fix them,
so that bringing the city back to life is something I hear, not only see.

## Acceptance criteria

1. A dial notch ticks; the pans levelling thunks; a jam hisses; a stage's lock clicks home; a room's restart swells a warm brass chord. Buttons make a soft wooden tap.
2. Every room has its own short machine loop on one shared tempo and key. In the town, the restored machines of the street on screen play their loops; the rest of the restored district plays quietly. Rooms and fights have no loops.
3. A restarting room's loop joins on the next bar and plays through its story card. Room 13's restart brings all thirteen machines in together.
4. Sound starts on the first tap (browsers allow audio only after a gesture), sleeps while the page is hidden, and does nothing where Web Audio is missing.
5. A mute control, a speaker of at least 48 CSS px, is on every screen but the loading one; it is kept in `save.settings.muted` and respected everywhere.
6. Everything is synthesised with Web Audio: no audio files, no new dependency. Levels are modest and nothing is harsh.

## What was built

All new code is in `src/audio/` (no React, no store), `src/store/effects/audio.ts`, `src/store/settings-reducer.ts`, `src/app/sound.ts`, `src/ui/common/MuteButton.tsx` and `src/ui/town/use-town-sound.ts`.

- **`audio/music.ts`** (pure): 96 BPM, 16 sixteenth steps to a 2.5 s bar, D major pentatonic (`frequency(degree)`), `nextBarAt` and `stepsBetween`, the scheduler's maths.
- **`audio/loops.ts`** (pure data): the thirteen loops, each two or three voices of a 16-step pattern and the scale degrees its hits play in turn (`noteAt`).
- **`audio/ambience.ts`** (pure): `loopLevels({ done, area, focus })`, which loops play how loud.
- **`audio/voices.ts`**: the synthesis, from oscillators, biquad filters and one buffer of seeded white noise. Nine effects (`tick`, `thunk`, `hiss`, `latch`, `restart`, `tap`, `rattle`, `clank`, `chime`) and seven loop voices (`click`, `clank`, `hum`, `whirr`, `wood`, `bell`, `puff`).
- **`audio/engine.ts`**: one AudioContext made on the first gesture; master gain (mute) → effects bus and loop bus; a lookahead scheduler (every 25 ms, 100 ms ahead, on the audio clock, as the architecture says). Loops join on the next bar line of one grid started with the context, so every loop is in time with every other; they fade in, fade to a new level, or fade out over 1.5 s. While muted or hidden nothing is scheduled. Every call is a no-op without Web Audio, and a sound that fails to build is skipped.
- **`store/effects/audio.ts`**: the effect (Pattern 4). `soundOf(event)` maps domain events to effects; it keeps the engine's mute in step with `save.settings.muted` on every event, remembers the town street (`TownAreaShown`) and the restarting room, and hands the engine new loop levels only when they change.
- **Store**: two actions, `settings/mute` (sets `save.settings.muted`, emits `SaveChanged`, so it is written) and `town/area` (changes no state, emits `TownAreaShown`), handled by `withSettings`, the outermost reducer wrapper.
- **`app/sound.ts`**: listens on the window for the first pointerdown, pointerup or key to unlock; taps for enabled buttons (not the town ground, where a tap is a step); sleeps the context while the page is hidden. Installed once in `App`.
- **Mute control** (`ui/common/MuteButton.tsx`, `mute-button.css`): a round paper speaker like the map control, 52 px (48 on a phone), `aria-pressed` while muted, label `hr.ui.mute` ("Bez zvuka"). Rendered once in `AppScreen`, fixed to the window.
- **Town**: one added line in `TownBoard` (`useTownSound(areaId)`), and its import. The hook dispatches the street as it shows and null as the town unmounts.

### What each machine sounds like

All at 96 BPM in D major pentatonic. "Degree" 0 is D3; the hits named are 16ths of a bar.

| Room | Machine | Loop |
|---|---|---|
| 1 | Door lift | A chain ratchet clicking on every eighth, a heavy clank on beats 1 and 3 (D, then A below). |
| 2 | Street lamps | A soft gas hum on low D held all bar, two high lamp chimes (B, E, B, F#) off the beat. |
| 3 | Sluice gate | Water rushing through on every beat, the gate's wooden creak in between. |
| 4 | Water wheel | Paddles knocking a lilting 3-against-4 figure that runs D F# B F# D F# B and a high F# over two bars, a splash twice a bar. |
| 5 | Bridge | A deep winch hum alternating D2 and A2 each half bar, a girder clank between. |
| 6 | Weighing yard | Weights clanking down (A, F#, D), a pointer clicking off the beat. |
| 7 | Old logbook | A typebar rhythm of high clicks, a page turning at the end of each half bar. |
| 8 | Tram | The ding-ding of its bell at the top of the bar, rail joints clacking under it. |
| 9 | Steam lift | Steam chuffing in a lopsided rhythm over a low boiler hum on A. |
| 10 | Market scales | Brass pans chiming D F# B F# off the beat, a peg ticking on it. |
| 11 | Great wheel | A big gear whirring up twice a bar over a low D hum, one clank late in the bar. |
| 12 | Junction | Points clacking in a syncopated off-beat pattern, small gears whirring. |
| 13 | Clock tower | Tick-tock on every beat, a low bell (D2) on the bar, a higher one (B, then D) halfway. |

### Effects

| Event | Sound |
|---|---|
| `DialNotch` | Tick: a short band-passed click, alternating slightly in pitch like a ratchet. |
| `PansLevel` | Thunk: a low sine falling 120 → 52 Hz with a soft thump of noise. |
| `MachineJammed` | Hiss: a band of noise sweeping down from 5.2 to 1.6 kHz over about a second. |
| `StageLocked` | Latch: two ticks and a small thunk. |
| `RoomRestarted` | A warm brass chord (D, F#, A, D, detuned saws through an opening low-pass), swelling over a second and fading by four. |
| A button | Tap: a short falling sine, like a knuckle on wood. |
| `DiceRolled` | Rattle: six quick wooden knocks. |
| `StrikeLanded` | Clank: inharmonic metal partials. |
| A right `PredictionMade`, a won `FightEnded`, `UpgradeBought` | Chime: two small bells (B5, D6). A lost fight hisses. |

### Levels, measured

Rendered offline in Edge (OfflineAudioContext) through the real gain chain: no effect peaks above 0.23 (the thunk), the tick at 0.10, the restart chord at 0.15; one loop peaks at 0.04–0.10, and all thirteen together at 0.19 (RMS 0.05). Nothing comes near clipping.

## Calls made (for Luka's veto)

- **Sound follows domain events, not UI code.** The only UI hooks are the town's street (`town/area`, which changes no state) and the tap on buttons, which the app shell does with one window listener, so no button component changed.
- **No loops in rooms or fights.** A room is for thinking; its own machine is silent until its restart, and the architecture's "a room brings its own loop forward" is read as the restart: the room's loop comes forward on its own then and keeps playing under the story card. Fights have their own effects (dice, strikes, a chime or hiss at the end) and no loops.
- **Town levels:** the street on screen at full loop level, the rest of the restored district at 22 %. "Louder for the machine he stands near" was left out: his position lives in refs inside `TownBoard`, and reading it would mean a bigger edit to a file another session is changing. The street is close enough to "near".
- **Room 13's climax** plays all thirteen loops at full level from its restart through its story card; the town then goes back to street and district levels.
- **Extra effects** beyond FR55 (latch, chime, rattle, clank, tap) are there because the GDD budgets "about 20 effects" and they cost nothing; any can be silenced by returning null in `soundOf`.
- **One key for everything, D major pentatonic,** so any mix of loops is consonant; one tempo, 96 BPM, the architecture's provisional figure.
- **Unlock on pointerdown, pointerup and keydown.** A finger's pointerdown is not an activation gesture in Chrome or Safari, its pointerup is; listening to both covers mouse and touch.
- **The context is suspended while the page is hidden** (tablet battery), resumed when shown.
- **Mute placement:** top right by default; top left on the opening (its skip is top right); bottom right in the shop (its parts counter is top right); lower on the district map overlay (its log button); in a room, the scene area's top-right corner on the tablet, left of the notebook, and under the hint button on a phone (the notebook's handle is top right there). Done with `:has()` in `mute-button.css`, so no screen's layout changed. Checked by screenshots at 1280 × 800 and 640 × 360 on every screen.
- **Mute is a toggle with one label** ("Bez zvuka") and `aria-pressed`, rather than a label that flips.
- **Mute fades the master gain over 60 ms** rather than suspending the context, so unmuting is instant; nothing is scheduled while muted.
- **Not in the sprint status yet:** `sprint-status.yaml` has epic 6 in backlog with no story rows; left alone so as not to collide with other sessions.

## Tests

- `src/audio/music.test.ts`: tempo, key, bar lines, back-to-back lookahead windows never drop or repeat a step; every room has a valid, distinct loop; the full city never has more than 12 struck hits on one step; `noteAt` cycles; `loopLevels` for room, town, restart and room 13.
- `src/audio/engine.test.ts` (fake AudioContext, manual timers): no-op without Web Audio and in node; one context on the first tap; mute before the first tap is honoured; a loop joins on the next bar and plays its pattern on the grid; only a lookahead ahead is scheduled; fade-out releases a loop; nothing is scheduled while muted or hidden; every effect and every loop voice builds, stops its sources and never ramps exponentially to 0.
- `src/store/effects/audio.test.ts`: the event-to-sound table; mute followed on every event; town street and district levels; restart focus through the card; room 13; silence in a room; `settings/mute` saved with `SaveChanged`; `town/area` changes no state.
- `src/app/sound.test.ts`, `src/ui/common/MuteButton.test.tsx`: the unlock, the button tap, the hidden page; the control's markup and size.
- `e2e/sound.spec.ts` (tablet and phone): the control on the opening, town, a room and a fight; the first tap starts the engine; muting stops it, is written to `matematika:save`, and survives a reload.

## How to hear it

`npm run dev`, open the game, tap once. Turn the dial in room 1 (ticks, and a thunk when level), write a wrong line (hiss), finish the room (latch, chord, then the door lift's ratchet-and-clank under the story card). In the town the square now has room 1's loop; the dev panel's tools and jumps reach later rooms. The speaker in the corner mutes everything and stays muted after a reload.
