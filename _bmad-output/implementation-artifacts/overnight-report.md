# Overnight report, 2026-11-06

Epic 1 is built. 12 of its 13 stories are done, and story 1.13 is at `review` until you profile it on the tablet. The fight rules (built ahead for epic 3) and the art style guide (epic 2), with 28 test images, were built alongside and merged in.

- **Branch:** everything is on the local branch `epic-1`, 38 commits ahead of `main`. `main` is untouched, and **nothing was pushed**, so GitHub Actions has never run.
- **Checks on `epic-1` this morning:** `npm run check` passes (Biome, 207 files). `npm test` passes: 83 files, 1,607 tests, and 2 tests are deliberately skipped (see Fight rules). `npm run build` passes: 1.06 MB, with 0.32 MB of gzipped JavaScript against the 1 MB target.
- **The run:** 6 h 11 min, 49 agents. No agent failed, no unit was blocked, and no repair pass was needed. Each unit was reviewed once and got one fix pass.

## 1. On the tablet (only you can do this)

This finishes stories 1.1 and 1.13.

1. On the PC, on branch `epic-1`, in `C:\Users\lpodobnik\Claude\matematika`, run `npm run dev -- --host` and note the `Network:` address. Last night it was `http://192.168.0.146:5173`.
2. **Story 1.1:** open that address in Chrome on the tablet. In portrait it should say "Okreni uređaj vodoravno.", and the message should go away in landscape.
3. **Story 1.13, play-through:** in landscape, without `?dev`, play rooms 1–4. After room 4's machine restarts, "Nastavak slijedi…" should appear.
4. **Story 1.13, profile:** follow steps 4–10 in `C:\Users\lpodobnik\Claude\matematika\_bmad-output\implementation-artifacts\1-13-play-rooms-1-4-on-the-tablet.md`, under "What Luka has to do". In short: open `?dev`, tap **profile: 3 × r04**, record with `chrome://inspect` while you drag the dial, and fill in the table. If it holds 60 FPS, set the story to `done` there and in `sprint-status.yaml`.

Also note the panel's **frame test** line (p95 and pick). It decides decision 8 below.

## 2. Decisions for you (veto or confirm)

Agents made about 280 small calls. Each is recorded in its story file under "Calls" and "Review". These are the ones that change what your son sees or what a later epic can do. My recommendation is in bold.

| # | Where | The call | Recommendation |
|---|---|---|---|
| 1 | 1.3, checker | Progress counts terms as written, so `2x + 7 − 7 = 25 − 7` is accepted but **doesn't move the machine**. That is the standard school way of writing the balance step. | **Change it:** count a valid line that carries a move as progress. |
| 2 | 1.3, for epic 4 | With only weights and floats, Balance can't finish a room where x is subtracted or divided. The GDD lists Balance as a finishing way for room 9 (`135 − 5x = 100`) and room 11 (`5 905 − 27x = 316`). | **Decide before epic 4:** add a tool, or drop Balance as a finishing way in those two rooms. |
| 3 | 1.9, room 3 | The direction pin shows only two arrow badges. The words "as x grows" are only in the button's screen-reader label. | **Show the text.** The question needs words for an 11-year-old. |
| 4 | 1.9, NFR12 | A correct pin lights up in lamp colour before the stage locks, which breaks the rule that only restarted machines get colour. | **Keep it ink until the lock.** |
| 5 | 1.12, quality | `low` also switches off shaders. The grey-to-colour restart is a shader, so it would vanish at low. | **Never switch off the grey-state shader.** `low` drops only particles and bloom. |
| 6 | 1.11, splitter | During a split jam the pans hang at the dial's x without the 4° jam tilt, so they can look level while the machine shows a jam. | **Apply the jam tilt,** as for a wrong line. |
| 7 | 1.10, tray | A line written by the tray (`2x = 18`) is not acted out with `?`. The pans keep the dial's x, so the tilt doesn't jump after his own move. | **Keep.** |
| 8 | 1.12, architecture | Frame times are locked to the screen's refresh: 16.7 or 33.3 ms on a 60 Hz tablet. So the p95 never lands in the 18–25 ms band, and `medium` can never be picked. | **Switch to a dropped-frame ratio** once you have the tablet's numbers. |
| 9 | 1.10, tray | Pieces he drops onto a pan merge, so he can't drag a single dropped piece back off. "Dragging back" returns the pan to the last written line. | **Keep.** |
| 10 | 1.4, pieces | `kx : n` is simplified before pieces are made: `3x : 3` shows one gear with no divider, and `6x : 4` shows 3 gears on dividers of 2. | **Show it as written,** before division lines are acted out (epic 2+). |
| 11 | Art, NFR12 | The apprentice and townspeople are always grey, so the look picker works by shape alone. A colour apprentice would be an NFR12 exception. No new images are needed either way. | **Keep grey** for now; it's cheap to change later. |
| 12 | Art | The guide follows the **standing** scale in the code (pans across x 65–1535), not the hanging scale the first draft assumed. | **Keep.** |
| 13 | Fight | The GDD's 0.6 parts per fight (random player, armour 60) is really 0.54 when computed exactly, so that check is skipped rather than loosened. | **Update the GDD table to 0.54.** |
| 14 | Fight | Only a win makes an automaton unavailable for 15 minutes. After a loss he can go straight back for his pile. | **Keep.** |

Smaller calls I'd keep as they are:
- Arrive ends on a press anywhere on the scene.
- Reset is an icon-only button with no confirmation.
- Only a room's last stage plays the restart.
- The pad is laid out like a calculator, with keys labelled `Obriši` and `Upiši`.
- In the check line's blanks, delete clears the whole blank.
- The end screen is "Nastavak slijedi…" under a still gear.
- A production CSP was added early.
- `.gitattributes` forces LF line endings, because a fresh Windows clone failed Biome without it.

## 3. What the reviews caught and fixed

The reviews raised 12 findings across 15 units, and one more problem appeared when story 1.12 was merged. All were fixed and tested.

| Unit | Fixed |
|---|---|
| 1.1 | Render errors inside the Pixi scene never reached the crash screen or the error log. Pixi could silently fall back to WebGPU or Canvas2D. JSX in pure folders got past the boundary test. |
| 1.2 | Division by zero lost to "nonlinear" when a line had both, which would have given the wrong refusal. |
| 1.4 | The spring's overshoot drew the beam past ±15°. |
| 1.10 | A browser pointer-cancel mid-drag dropped the piece and could write a line he never let go of. |
| 1.11 | At 640×360 the reset button covered the splitter's holder, so grabbing it reset the stage. |
| Merge 1.12 | Story 1.12's steam vent overlapped story 1.11's splitter on a phone. Moved. |
| Art | Five fixes: the mount points now follow the scale in code, a false claim about the quiet zone was corrected, moving parts are left out of backdrops, the generator defaulted to an old style block, and the NFR12 display state for each asset is now written down. |

## 4. Open minor notes worth one fix pass

These were deliberately left unfixed under the review-once rule. Each is copied in full in its story's Review section. The real bugs:

- **1.8:** while the tab is hidden, the 8 s fallback still runs the restart and loads the next room, so he never sees it. Fix: skip the clock tick while the page is hidden.
- **1.9, 1.10, 1.11:** the first-use wiggle (pin, tray, splitter) replays after a WebGL context loss, which is common on Android.
- **1.5:** a fast flick that skips notches sends no `DialNotch` for the skipped ones. Room 13's drum ("every value tried") and epic 6's tick sound need them.
- **1.6:** the computer keyboard still types into the notebook while it is hidden on a phone. Pressing enter on a marked wrong line gives no feedback.
- **1.10:** after a return to the written layout, a pan shows `25` and `7` again instead of one `18`.
- **1.7:**
  - Pieces that change pans fade out and back in instead of moving.
  - An interrupted tween drops the pieces that were still fading out.
- **1.12:** a stall right at the start of the frame test's window isn't counted.
- **Fight:**
  - A loss that drops nothing shows "−0" parts.
  - `blowRange` answers outside the `set` phase.
  - `lairAwake` trusts a clock that was ahead.
  - `fightLimits` throws on an unknown upgrade id.
- **Guards:**
  - `src/lib/log.ts` doesn't exist yet, so ignored actions aren't logged.
  - No test stops `Math.random()` or `Date.now()` in pure folders.

**The architecture document has drifted from the code.**
- `StageState` gained `dialOpen`, `refused`, `templates`, `presentedAt`, `tray` and `splitter`.
- `SaveV1` gained `progress.firstUse`.
- New events: `StageReset`, `DiceRolled`, `StrikeLanded`, `TornPageReturned` and `UpgradeBought`.
- Events are now defined in the pure folder that emits them.
- The Reset rule's contradiction was settled in favour of the phase line.

All of this needs writing into `C:\Users\lpodobnik\Claude\matematika\_bmad-output\planning-artifacts\game-architecture.md` before epic 2, so the next agents don't undo it.

## 5. Art style guide and images

- **Files:**
  - Guide: `C:\Users\lpodobnik\Claude\matematika\_bmad-output\art-bible.md`
  - Images: `C:\Users\lpodobnik\Claude\matematika\art-src\tests\`
  - Credits and prompts: `C:\Users\lpodobnik\Claude\matematika\art-src\CREDITS.md`
  - All 28 images on one page: `C:\Users\lpodobnik\Claude\matematika\_bmad-output\implementation-artifacts\overnight-art-contact-sheet.jpg`
- **Model:** FLUX.2 [max] on fal.ai. **28 of the 30 images are used**, so 2 remain.
- **What worked:**
  - The ink-and-wash look holds across backdrops, housings, automatons, looks and maps.
  - The six looks share one pose and scale (t14–t19).
  - The automaton family (t09, t11, t12) holds together.
- **What didn't:**
  - No backdrop or housing passes the new layout check yet. The closest are backdrop t22 and housing t27.
  - Every early backdrop has the moving part painted into the area where the pans hang.
  - The map (t20) is a concept only.
  - Nothing has transparency yet. Background removal is a separate step, and no tool has been chosen for it.
- **Before using these images publicly:** the licence line in CREDITS hasn't been checked against fal.ai's terms.

## 6. Fight rules (built ahead for epic 3)

The code is in `src/fight/`, `src/economy/` and `src/content/lairs.*`, and the story is `C:\Users\lpodobnik\Claude\matematika\_bmad-output\implementation-artifacts\ahead-fight-rules.md`.

- **GDD numbers:** the simulation (40,000 fights per tier) and an exact enumeration both match the GDD's win rates and parts per fight, except decision 13.
- **"Reasoning perfectly":** defined as the best choice each round, not planning across rounds. That is the only definition that reproduces the GDD's table.
- **Reloading:** the fight carries its own random seed, so a reload can't re-roll the dice.
- **Not done yet:** wiring it into the UI is epic 3.

## 7. Housekeeping done this morning

- **Leftover copies of the repo:** all 8 worktrees were checked as clean and merged, then removed, along with their 16 branches. Only `main` and `epic-1` remain.
- **Stray dev servers:** agents had left four Vite dev servers running (ports 4173, 4317, 4318 and 5291). I stopped them.
- **FAL_KEY:** the story 1.1 agent printed `.claude/settings.local.json`, including `FAL_KEY`, into its own session output. It is not in any file or commit. **Rotate the key if you ever share session transcripts.**
- **Untracked folders:** `.claude/` and `_bmad/` are still untracked.

## 8. Next

1. Run the tablet check (section 1).
2. Make decisions 1–14.
3. **One bounded fix pass:** your decisions, the bugs in section 4 and the architecture sync. One review, no loops.
4. Plan epic 2's stories (`gds-create-epics-and-stories`), which the readiness report says to do after epic 1 has been played on the tablet.
5. Push `epic-1` when you want CI to run. That's your call; nothing has been pushed.
