# Story 1.15: Make rooms 1–4 teach themselves

Status: in-progress

## Story

As Luka's son,
I want the machine to show me what to do next and pictures that mean what they look like,
so that I can play rooms 1–4 without my dad explaining them.

**Source:** his first play, relayed by Luka on 2026-11-06:
1. He didn't realise he had to move the slider.
2. When the scale was level, he asked "what now?".
3. He didn't know what to do with the pin. He called it the "balance balloon". Luka suggests: "Postavi hvataljku na mjesto gdje će vaga biti u ravnoteži".
4. He stopped again: how does he know the notebook is next?
5. He didn't realise the float was a balloon.
6. Luka: "Zdjelica" is a bad word. "Kad x raste" means nothing when x isn't shown anywhere. Nobody knows what the spring is. The two arrows are the same answer, because when the left goes down the right goes up.
7. Luka: "Aha, the spring is subtraction... why? It was a balloon a second ago."

And Luka in room 4:
- He put a weight on the left and the scale levelled: "there, solved".
- He couldn't put the splitter anywhere, and it doesn't look like splitting.
- After he put the balloon on the right, the scale looked nothing like the notebook's problem.
- "You can only do left what you do right."

**Covers:** the GDD's Balance row, Pieces table, Prediction and Player Assistance. The rule changes are in Dev Notes.

## Acceptance Criteria

### A. Pictures and the pin (worktree, branch `lane/1-15-art`)

1. **The pin is a flag.**
   - It is drawn as a small flag on a pole, in its holder and on the track, with the pin's number on the flag. Locked, the pole looks driven in. Right, the flag lights as today; wrong, it dims as today.
   - No round head is left; it must not be mistakable for a balloon.
   - The level-x pin's tag reads `Postavi zastavicu na mjesto gdje će vaga biti u ravnoteži.`
2. **Every minus is a balloon.**
   - The spring piece (`− x`, `− 5x`) is drawn as the same balloon as a float, carrying a small x-gear emblem. It is labelled `−x` or `−5x`.
   - Above 12 there is one large balloon showing the count, as large gears do.
   - A divided spring is drawn the builder's way, consistent with the divided gear; record the call.
   - No coil spring remains anywhere, the tray included.
   - The data kind stays `spring`; only the drawing changes.
3. **The balloon reads as a balloon.**
   - Balloons are bigger than in 1.14, with a shine highlight, a knot and a string.
   - They bob gently: a few scene units over about 2 s, as a container transform on the Pixi ticker, never a redraw. There is no bob under `prefers-reduced-motion`.
   - The same applies on the pans and on the tray.
4. **The direction pin asks about the whole scale.**
   - The question is `Kad x raste, na koju će se stranu vaga nagnuti?`.
   - The two places are small pictures of the whole scale tilted left and tilted right, labelled `lijevo` and `desno`.
   - The right answer is the side that goes down as x grows, computed from the equation and replacing `pan-down` / `pan-up`. Update the option type, room 3's data, `pinRight`, `hr.ts` and the tests. Room 3 stage 2 (`20 − x = 6`) answers `desno`.

### B. Balance (worktree, branch `lane/1-15-balance`)

5. **Every Balance move acts on both sides at once.** No one-sided move exists.
   - **Tray:** a weight or balloon from the tray, dropped anywhere over the scale (either pan, the beam, the space between), sends one copy to each side. Numbers on each side then combine as today.
   - **Dragging off:** dragging a number piece off a side takes the same number off both sides. It is the same move as dropping a balloon of that number.
   - **Splitter:** dropped anywhere over the scale, each side's pieces separate into n equal groups, and every group but one fades away, on both sides.
   - **Refused:** a move that would leave a side with no x below 0 is refused, and the piece slides back.
6. **The scale shows the true equation during Balance.**
   - From his first Balance move in a stage, the pans are weighed at the stage's solution, so they stay level. Readouts are hidden. This is acting out the last committed line, as today.
   - Any dial move returns to exploring, as today.
7. **x is on the gears.**
   - Every x-gear and x-balloon shows the letter `x` (a large one shows `27x`). Gears never show the dial's number, and never `?`.
   - The dial's value shows on the slider (lane C).
8. **Each move writes its lines straight away.** With Balance `auto`:
   - A tray move or drag-off writes the move as done, then the result: `2x + 5 − 5 = 23 − 5`, then `2x = 18`.
   - A split writes `2x : 2 = 18 : 2`. The result is written too, unless it is `x = n`, which he writes himself as today.
   - Both lines are `LineAccepted` with source `balance`, and `WayUsed` fires once per move.
9. **An uneven split is refused, not jammed.**
   - The pieces start to separate, show what is left over (for example `23` won't make two equal groups), and slide back together. Nothing is written.
   - The `split` jam kind, `liftSplitter` and the jam's blade drawing are removed, with their tests updated.
10. **The tools appear one at a time.**
    - **Tray:** offered in an open stage once Balance is earned and one of these holds:
      - its first use is already met;
      - the dial has been at its maximum this stage without levelling the pans;
      - a Balance move was made this stage.
    - **Splitter:** offered from the moment one side holds only x pieces with a count above 1, then for the rest of the stage.
    - Keep the exported names and signatures `trayOffered(room, tools)` and `splitterOffered(room, tools)`; lane C reads them.
11. **The tools look like what they do.**
    - **Tray:** a weight and a balloon, each with its number on the piece and a `+` directly above and a `−` directly below the number.
    - **Splitter:** a divider frame with n equal compartments, its number shown as `: n`, with `+`/`−` on the frame. n is 2–9 as today.

### C. Handovers and the slider (main checkout, `epic-1`)

12. **The slider shows x.**
    - Above the knob: `x = 9` while exploring, at least 20 CSS px, following the knob.
    - While the scale acts out (a written line or Balance), it reads `x = ?`, dimmed.
13. **One tag tells him the next step, once.**
    - A pure `room/handover.ts` decides which single handover applies now, from the room, `save.progress.firstUse` and the stage. A tag shows its text from `hr.ts`.
    - It looks like the 1.14 pin tag: a paper tag, at least 20 CSS px, never covering the pans, the dial or the pin's places at 640 × 360.
    - It goes away as soon as he does the step, which marks it met. After `tuning.hintIdleMs` (60 000) without any action of his in the stage, the current step's tag shows again, met or not.
    - Track `lastActionAt` on the stage from `ctx.now` on his actions, plus a `clock/tick` check.
    - The handovers:
      - **`dial`**, from arrival until he first turns a dial: the knob nudges one notch right and back by itself, every 4 s (presentation only, no store change). Tag by the knob: `Pomiči klizač – tako mijenjaš x.`
      - **`write`**, the first time his dial levels the pans and no answer line is written: the notebook's active blank or draft line pulses. Tag at the notebook: `Vaga je u ravnoteži. Upiši x u bilježnicu.`
      - **`check`**, after the answer line and before the check line: the check line pulses. Tag at the notebook: `Provjeri: uvrsti broj umjesto x.`
      - **`tray`**, when the tray is first offered: tag at the tray: `Klizač ne doseže. Stavi broj s police na vagu – ide na obje strane.`
      - **`balance-goal`**, after his first Balance move: tag above the scale: `Vaga zna koliki je x. Ostavi x samog na jednoj strani.`
      - **`splitter`**, when the splitter is first offered: tag at the splitter: `Razdjelnik dijeli obje strane na jednake dijelove.`
      - The pin's own tag (lane A's text) stays as it is.
    - Only one tag shows at a time: the earliest unmet step that applies.
    - Extend `FirstUseId` with the new ids. The existing first-use wiggles stay.

### D. All

14. `npm run check && npm test && npm run build` pass.
    - Replaced behaviour's tests are rewritten in place, not deleted silently.
    - `store/playthrough.test.ts` plays rooms 1–4 the new way. Room 4 takes 5 off with the tray, then splits by 2: `2x + 5 − 5 = 23 − 5`, `2x = 18`, `2x : 2 = 18 : 2`, then `x = 9` and the check line typed.
    - Checked in the browser at 1280 × 800 and 640 × 360.

## Tasks / Subtasks

- [x] Lane A: AC 1–4
- [x] Lane B: AC 5–11
- [x] Lane C: AC 12–13
- [ ] Merge A and B into `epic-1`; checks green (AC 14)
- [ ] One review, one fix pass
- [ ] Browser check, rooms 1–4

## Dev Notes

**File ownership, so the three lanes can run at once:**

| Lane | Owns |
|---|---|
| A | `src/art/skins/scale.ts`, `src/art/skins/pin.ts`, `src/ui/scene/scale/Piece.tsx` (bob), `src/ui/scene/scale/Pin.tsx` (drawing and the option pictures), `src/room/pin.ts` (the direction option's meaning), `src/content/rooms/r03-sluice-gate.ts`, the `pin` texts in `hr.ts` |
| B | `src/room/tray.ts`, `src/room/splitter.ts`, `src/room/scale.ts` (labels, acting out), `src/room/notebook.ts` (balance lines), `src/art/skins/tray.ts`, `src/art/skins/splitter.ts`, `src/ui/scene/scale/Tray.tsx`, `Splitter.tsx`, `piece-drag.ts`, `splitter-drag.ts` and the drop targets in `Scale.tsx` |
| C | `src/room/handover.ts` (new), `src/room/first-use.ts`, the hint fields in `src/room/types.ts`, `src/ui/scene/scale/Dial.tsx` and `src/art/skins/dial.ts` (label, nudge), a new tag component, the notebook pulse in `src/ui/notebook/*`, the `handover` texts in `hr.ts`, the clock and idle handling in `src/store/reducer.ts` |

- Shared files (`hr.ts`, `tuning.ts`, `room/types.ts`, `store/reducer.ts`, `store/types.ts`, `SceneRoot.tsx`): add your own keys and branches only, and don't reformat others'. The merge joins them.
- Builders don't edit planning documents; the main session does.
- Croatian text lives only in `hr.ts`. Shape carries state (NFR4). No colour beyond today's lamp and jam (NFR12). No praise text (NFR13). Pixi rules as before. StrictMode-safe.

**Rule changes (main session writes them into the GDD and architecture):**
- Balance moves act on both sides at once.
- The scale is weighed at the true x during Balance.
- The split jam is replaced by a refusal.
- Every minus is a balloon; springs go.
- The pin is a flag. The direction pin asks which way the scale tilts.
- Gears show `x`, and the slider shows its value.
- One-time handover tags: the deliberate exception to "no instructions", which the son's first play showed he needs.

## Dev Agent Record

(Each lane adds its own section: Calls, files, checks.)

### Lane A (`lane/1-15-art`): flag pin, balloons for every minus, tilt question

**Calls** (flag any for veto):
- The flag: a pole with a flat cap and a waving cloth on its right that holds the number. Unlocked, the foot is sharpened like a stake, no wider than the pole. A wider point read as an arrow in the browser. Locked, the point is gone into the track, a plate sits at the foot and the cloth is shaded.
- The cloth sits where the head was. `PinLayout.headX` (the cloth's centre, right of the pole) is new. The hit area, Potvrdi (`scene-spots.ts`) and the tag's obstacles all follow it.
- The holder is a socket on the track with a bracket over the pole's top. The tag's string is tied to the top of the bracket.
- The Potvrdi icon is now a flag, so no round-headed pin is left anywhere.
- Direction pin options are `tilt-left` / `tilt-right`. `tiltAsXGrows` replaces `xPanMotion`: the scale tilts toward the side that gets heavier as x grows. x may sit on both sides, as long as growing it tips the scale, so the content test drops 1.14's "x on one side only".
- Each place is a faint flag with a picture of the whole scale in its cloth, tilted 20° its way. The placed flag carries the same picture.
- The words `lijevo` / `desno` sit level with the cloth, on the outer side. Above the flag, `lijevo` collided with room 3.2's low left pan at 640 × 360.
- So Potvrdi now goes toward the dial's centre for direction pins too. This also fixes 1.14's "Potvrdi covers the left readout" on the phone.
- The direction places are 280 CSS px apart, not 160, so their pictures clear the stand's foot.
- The longer level-x question doesn't fit on the holder or the left wall at 640 × 360. The tag now tries the wall right of the machine after the left wall. On the phone, rooms 3.1 and 4 hang top right.
- Every minus is one balloon drawing: a light shaded skin with a paper shine, a knot, and a string drawn on its own. 1.14's arrow is gone, since the balloon and its bob show the pull. A spring's balloon carries a small toothed x-gear under its label, with 18 teeth when large.
- The balloon is 2.2 label sizes wide (1.14: 1.8), with a body 2.5 tall (1.14: 1.72). The string is 0.5 label sizes. A large one is at least 2.7 wide.
- The spring's minus is added in the drawing: `pieceText` uses `minusLabel` from `room/pieces.ts`, which never doubles a minus. `room/scale.ts` is lane B's, so it isn't touched. Until lane B's `x` labels land, a spring shows `−` plus the dial's value. Main session: you may move this into `pieceView` at the merge.
- A divided spring is cut the way the divided gear is: a faint ghost balloon cut into n from its centre, its bottom sector solid (with the emblem), x in the ghost above, and the `: n` tag beside it.
- Bunches (new in `layoutPan`): balloons side by side tie into a bunch. As many as fit stand side by side, and the rest float one tier up, nestled in the gaps, on longer strings. Without this, `135 − 5x` and `50 − 4x` needed two rows of balloons and broke the art bible's pan sweep (y 243). The sweep and zones are unchanged.
- The bob is ±4 scene units over 2 s, with a phase per piece key. It runs on the app's ticker and moves only the balloon's container; the string's container stretches to stay tied to the pan. It is still under `prefers-reduced-motion` and applies on pans, the tray and a carried piece.

**Files changed:** `src/art/skins/{pin,scale}.ts`, `src/room/{pin,pieces,types}.ts` (`EffectOption` only), `src/content/rooms/r03-sluice-gate.ts`, `src/content/text/hr.ts` (`pin` texts only), `src/ui/scene/scale/{Pin,Piece}.tsx`, `src/ui/scene/scale/{layout,pin-layout,pin-tag-layout}.ts`, `src/ui/common/{scene-spots.ts,PinConfirm.tsx}`. New: `src/ui/scene/scale/{balloon-bob,use-balloon-bob}.ts`. Tests:
- New: `balloon-bob.test.ts`.
- Rewritten in place, each with a comment naming what 1.15 replaced: `art/skins/{pin,scale}.test.ts`, `room/pin.test.ts`, `content/rooms/rooms.test.ts`, `ui/scene/scale/{layout,pin-layout,pin-tag-layout}.test.ts`, `ui/common/{scene-spots,PinConfirm}.test.tsx`.
- Extended: `room/pieces.test.ts`.
- Not touched: `ui/notebook/notebook-aside.test.ts` (lane C's area) still says "pan-up" in one test title. `confirmSpot` keeps its unused `_kind` parameter, so that file needs no change.

**Checks:**
- `npm run check`: clean (225 files).
- `npm test`: 91 files, 1713 passed, 2 skipped.
- `npm run build`: passes, 0.33 MB of JavaScript gzipped.
- Browser: own Vite server on 5300, since stopped; 5173 untouched. The app's browser pane was hidden, which stalls the tweens, so this used headless Chrome through Playwright, at 1280 × 800 and 640 × 360:
  - Room 3.1: the flag in its holder, placed on 14 with Potvrdi, then confirmed and lit, with the pans level.
  - Room 3.2: both pictures with their words, the flag on `lijevo` and on `desno`, confirmed `desno` right and lit, with parts 0 → 2.
  - Room 4: the tray's bigger balloon.
  - The balloon bobs. It is still under reduced motion: the frames are byte-identical.
  - No console errors other than one existing 404 for a resource.
- Not seen in the browser: a divided spring, a large spring and a bunch. No room 1–4 has them; unit tests cover them.

### Lane B: Balance (AC 5–11), branch `lane/1-15-balance`

**Calls** (flag for veto):
- "First use already met" comes from `save.progress.firstUse`; since `trayOffered(room, tools)` keeps its signature, the root reducer stamps it into the stage (`rememberTray`, `stage.balance.trayMet`) after each room step.
- New `StageState.balance` (`moves`, `dialMaxed`, `trayMet`, `splitterSeen`) remembers why a tool is offered; reset keeps it, so a tool once offered stays for the stage.
- "Dial at its maximum" is the spec's `dial.max` reached by his own dial (`setDial`) with the pans not level there; the machine's pin test doesn't count.
- The splitter's moment is a side whose linear form is b = 0 and |numerator of a| ≥ 2 (`2x`, `27x`, `2x : 3`, `0 − 5x`), on the pans, in any committed line, or after a Balance move.
- The move line appends to each side as the pans show it (`2x + 5 = 23 − 5 + 5`); the split line divides each side as shown, with brackets (`(4x + 8) : 4 = 20 : 4`).
- Both Balance lines are judged against the lines before the move, so the move and its result are one step: `2x = 18` makes progress, `2x + 8 = 26` doesn't. Room 4's machine goes 0 → 0.2 → 0.4 → 0.9 → 1.
- An uneven split is ignored by the store (no change, no event). The scene shows the refusal from the pure `splitGroups` through a small `split-show` channel shared by the splitter and the scale.
- A tray piece lands anywhere in one scale zone (x 25–1575, y 200–840 in scene units). A pan piece comes off when let go anywhere off that zone, the tray included; over the zone it slides back.
- Springs are labelled `−x` / `−27x` (school minus, like floats `−6`), gears `x` / `27x`. The wider spring labels raise the tablet sweep's top from 243 to 221 (still inside the pan zones). `scene-zones.test.ts` is updated; the art bible's quote is the main session's.
- Tray: one column per piece, + directly above and − directly below its number. On the balloon the buttons cover the arrow and the string. At 640 × 360 the 48 px buttons make the shelf about 464 scene units tall, so it can cover the top ~16 units (the ring) of a weight on the right pan at rest.
- Splitter: a divider frame of n compartments with `: n` on its tag (`divisorLabel`), and + over − on the holder at the frame's end. The holder stays.
- A tray drop sends two copies flying to the level pans. An even split shows the groups separating, all but one fading, and the last sliding to the middle; the store's result then shows.
- After Balance, the dial can show a side with x below 0 (readout `−6`), as one-sided moves could before.
- `Pan.tsx` (no lane owns it) gained `piecesHidden` and `children` for the split groups.
- `MachineJammed.kind` is now only `'line'`. The dev panel's splitter text loses "on the pans".

**Files:** `src/room/{tray,splitter,scale,notebook,types,events,room,phases,dial}.ts` and their tests (`tray`, `splitter`, `scale`, `notebook`, `machine`, `room`, `dial`); `src/store/{actions,reducer}.ts`, `store.test.ts`, `playthrough.test.ts`; `src/art/skins/splitter.ts` and its test; `src/art/scene-zones.test.ts`; `src/dev/dev-view.ts` and its test; `src/ui/scene/SceneRoot.tsx`; `src/ui/scene/scale/{Scale,Pan,Tray,Splitter}.tsx`, `{piece-drag,splitter-drag,splitter-layout,tray-layout}.ts` and their tests; new `split-show.ts`, `split-show.test.ts` and `SplitGroups.tsx`.

**Checks:** `npm run check` clean; `npm test` 91 files, 1709 passed, 2 skipped; `npm run build` passes (JS 0.33 MB gzipped). Browser, port 5305, room 4 via `?dev`:
- 1280 × 800: the tray appears only at dial 6, and the splitter only after the first move.
- A −5 balloon dropped on the beam writes `2x + 5 − 5 = 23 − 5` and `2x = 18`, and the scale stays level with no readouts.
- Split by 3 separates and slides back; nothing is written.
- Split by 2 writes `2x : 2 = 18 : 2` and shows `x = 9`.
- Dragging the 9 off takes 9 off both sides.
- A dial notch returns to exploring.
- Gears show `x`. No console errors.
- 640 × 360 checked with the notebook aside. Server stopped.

### Lane C: the slider shows x, handover tags (AC 12–13)

**Calls**
- Handover steps are met as `handover-<id>` in `firstUse` (`HandoverId` plus a template type), because the existing `tray`/`splitter` ids are met on offer for the wiggle, and a handover only once he takes the step.
- His action, for the idle clock, means an action of his that changed the room. A touch or key that does nothing doesn't count, so if he is stuck tapping around, the tag still comes back. A stage starts its clock when it arrives (reset too).
- The clock tick sets `stage.idle` once 60 s pass. The earliest step that applies then shows again, met or not, until his next action.
- No handover shows while the pin is offered (its own tag asks), while jammed, or once locked.
- `dial` stops applying once the pans level, a line is acted out, the tray is offered, or Balance has been used.
- `write` also applies when Balance leaves `x = n` on the pans.
- `balance-goal` applies after a Balance-written line, until one side holds only x and the other no x.
- `balance-goal` is met only if it applied before the move that isolated x. So in room 4's straight path (`2x = 18` at once) it never shows, and the splitter tag comes next. Otherwise the goal tag would hide the splitter tag until the split.
- `splitter` applies only while x is isolated but not alone (and `splitterOffered`), so it can't jump ahead under today's offer rules.
- Met when: `dial` on any `dial/set`; `tray` on any `tray/drop`/`tray/take` that did something; `splitter` on a split; `write`/`check` when that line appears.
- Slider label: a paper plate above the knob, drawn outside the track's mask, moved by the drag's `onKnob`.
- `x = ?`, dimmed, follows `scaleView(room).actingOut`, so lane B's Balance acting-out flows through. During the pin test it shows the test's x.
- The dial's hit area grows up to cover the plate.
- Nudge: first after 1 s, then every 4 s. It goes one notch right and back (left at the end of the reach), and skips while he drags. Under reduced motion the knob blinks.
- Scene tags (`dial`, `tray`, `splitter`, `balance-goal`) reuse `pinSkin.tag` and are drawn over the tools with `eventMode="none"`. They take the clear place nearest the thing they are about.
- Tags never cover: the pans (every reachable x, plus acting out), the dial band from the label down, the pin (all places for a choice pin), the reset corner, or the tool the tag is about or he needs next (the splitter for its own tag, else the tray).
- Tags cover the machine, the stand or the other tool only when nothing else fits.
- Strings are at most 3 em and clear of the hard obstacles; otherwise the tag hangs from a nail. The goal tag always hangs from a nail, and a dash never starts a line.
- String ties: the dial's to the top of the knob's label, the tray's to its shelf's inner bottom corner, the splitter's to its holder's.
- Notebook tags (`write`, `check`) are HTML, between the lines and the pad. The lines shrink to fit, so the tag hangs right under them.
- The draft line pulses with an ink ring (no transform), and the list keeps the draft's top in view.
- Phone: while a scene tag shows, the notebook shows pushed aside, as for a waiting pin, and can be brought back the same way. With the step in the notebook and the notebook aside, its handle pulses.
- At 640 × 360 the tags often cover the machine and stand. Under today's offer rules (room 4 offers both tools at once), the tray and goal tags also cover the splitter's holder; lane B's rules remove that.

**Files**
- New: `src/room/handover.ts`, `src/room/handover.test.ts`, `src/store/handover.test.ts`, `src/ui/scene/scale/HandoverTag.tsx`, `src/ui/scene/scale/handover-tag-layout.ts`, `src/ui/scene/scale/handover-tag-layout.test.ts`, `src/ui/scene/scale/dial-label.ts`, `src/ui/scene/scale/dial-label.test.ts`, `src/ui/notebook/HandoverNote.tsx`.
- Changed: `src/room/types.ts` (`HandoverId`, `FirstUseId`, `lastActionAt`, `idle`), `src/room/room.ts` (the two fields at arrival), `src/room/first-use.ts` (comment), `src/store/reducer.ts` (`handOver`), `src/config/tuning.ts` (`hintIdleMs`, `dialNudgeMs`, `dialNudgeLengthMs`), `src/content/text/hr.ts` (`handover`), `src/art/skins/dial.ts` (`label`), `src/ui/scene/scale/Dial.tsx`, `src/ui/scene/SceneRoot.tsx`, `src/ui/notebook/Notebook.tsx`, `LineView.tsx`, `notebook.css`.
- Tests rewritten in place: `src/room/room.test.ts` (arrival fields). Added to: `src/art/skins/dial.test.ts`, `src/ui/notebook/Notebook.test.tsx`.

**For the merge**
- The tests read `trayOffered`/`splitterOffered`. The room 4 tray cases turn the dial to its end first.
- `handoverMove` keys off the action names `tray/drop`, `tray/take` and `splitter/split`.
- Re-run `handover-tag-layout.test.ts` once lane A's flag and direction pictures land. Pin boxes are the pin's hit area plus 12 units.
- `store/playthrough.test.ts` is unchanged.

**Checks**
- `npm run check` passes.
- `npm test`: 94 files, 1736 passed, 2 skipped.
- `npm run build` passes (JavaScript 0.33 MB gzipped).
- Browser at 1280 × 800 in the app's pane: room 1 shows the dial tag, the nudge, and the label following the knob; the tag goes on the first notch; at level the draft pulses with the write tag; after the answer, the check tag shows with `x = ?` dimmed.
- The pane then went hidden (other lanes share it), so the rest ran in headless Chrome (Playwright, system Chrome) on port 5310. Covered at 1280 × 800 and 640 × 360: the room 1 dial, write and check tags; the room 2 dial tag; the room 4 tray, goal and splitter tags; the dial tag shown again after idling. No page errors.
