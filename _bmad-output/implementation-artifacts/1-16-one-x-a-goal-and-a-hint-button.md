# Story 1.16: One x, a goal and a hint button

Status: in-progress

## Story

As Luka's son,
I want one x I can trust, a picture of what I'm aiming for and a button that shows me the next step,
so that I can solve room 4 by simplifying, not by guessing, and never get stuck.

**Source:** Luka's play of story 1.15's room 4 (2026-11-06).
1. "Why should I write x all of a sudden, when I used to set x with the slider?"
2. "Why do I set x to 6 with the slider, but then balance it out with weights, when 6 is obviously wrong? x is unknown but the slider is on 6, although it says x = ?."
3. "There should be a better way that stops me solving without simplifying."
4. "If I put x at 6 and simplify, it should still be out of balance."
5. "A visual way that makes me say: this is too complicated, I need to simplify."
6. "We really need a hint button that shows the next step."

Story 1.15 weighed the scale at the true x during Balance and showed `x = ?` on the slider while its knob sat at 6. That gave two x's at once. This story keeps only the slider's x.

## Acceptance Criteria

### A. One x and simplify-first (worktree, branch `lane/1-16-rules`)

1. **The slider is the only x.**
   - The pans are always weighed at the slider's x: while exploring, after a typed line, and after a Balance move.
   - Readouts always show, unless the stage sets `readouts: false`.
   - The slider's plate always reads `x = <dial value>`. The `x = ?` state and its dimming are removed.
   - Balance moves still act on both sides at once (1.15). So at a wrong slider value the scale stays out of balance through every move. In room 4 with the slider at 6: 17 vs 23, then 12 vs 18, then 6 vs 9.
   - Acting out at the stage's solution is removed. Pieces still take the last committed line's layout, through the tween, as today.
   - The jam's minimum tilt for a wrong line stays.
   - Rewrite every test that asserted acting out at the solution, `?`, `x = ?` or hidden readouts; don't delete them silently.
   - The pin test's own weighing beyond the dial stays for later rooms. No room 1–4 has it after AC 3.
2. **Simplify before answering.**
   - Applies in a stage whose `ways` don't include `try` (room 4).
   - An answer line `x = n`, typed or filled into a blank, is accepted only if the last committed line already has x terms on one side only and a single number on the other. `2x = 18` and `18 = 2x` count; `2x + 5 = 23` doesn't.
   - Otherwise it is refused like an incomplete line: not stored, the draft wiggles, no jam.
   - A refusal tag shows, from `hr.ts`: `Prvo pojednostavi vagu.`
   - Simplifying lines he types himself count, as well as Balance's.
   - Stages whose ways include `try` are unchanged.
3. **Room 4: one new idea, Balance.**
   - Remove room 4's pin and poke window. The dial still runs 0–6.
   - Room 4 keeps the notebook's blanks for the last two lines. Once the last committed line has x alone (coefficient 1) against a number on the pans, the notebook shows `x = ☐`. After it, the check template `2 · ☐ + 5 = 23`.
   - Update the content tests and their GDD-table expectations. The main session updates the GDD's room 4 row (pin: none) and its fading row.
4. **The `answer` handover.**
   - When the pans show x alone against a number and no answer line is written, the notebook's `x = ☐` pulses. Tag at the notebook: `x je sam na vagi. Upiši koliko je x.`
   - Like the other handovers: once per game, and it returns after 60 s idle. Add it to `room/handover.ts` in its place in the order, before `check`.

### B. The goal card and the hint button (main checkout, `epic-1`)

5. **The goal card.**
   - In a stage where the tray is offered, a small paper card stands in the scene, labelled `Cilj: x sam`.
   - It shows a miniature scale: one x-gear alone on one pan, a weight marked `?` on the other.
   - When the pans match it (x pieces with count 1 on one side, a single number piece or none on the other), the card marks it by shape: a heavier frame and a tick, plus the lamp light already used for right pins. Shape is the signal, colour only adds to it (NFR4).
   - It never covers the pans, the dial, the tray, the splitter or the handover tags at 640 × 360 and on the tablet. Add a layout test.
   - Drawn in code (Pixi, `ui/scene`), text from `hr.ts`.
6. **The hint button.**
   - A round HTML button with `?`, at least 48 CSS px, directly under the reset control in the top-left corner, clear of the splitter's holder. It never takes focus, acts on release, and is available in every phase where he can act.
   - Hints are free and never recorded or paid (GDD Player Assistance).
   - **First press:** shows the current step's handover tag (`room/handover.ts`), even if it was met. If none applies, the tag for the step he is on is chosen by the same ordering.
   - **Second press while that tag shows:** shows the exact next move, from a pure `room/hint.ts` built on `math/steps.ts` `nextStep`:
     - **Try** (the slider): the knob's ghost moves two notches the right way and back, with the tag `Pomiči klizač udesno.` or `ulijevo`. Once the pans are level, the notebook blank pulses with `Upiši x = 5.`
     - **Balance, add or take a number:** a ghost of the right tray piece, for example the −5 balloon, rises from the tray and glides onto the scale, splitting into one copy per side, then fades. Tag: `Skini 5 s obje strane: stavi balon −5 na vagu.` or `Dodaj …` for a weight.
     - **Balance, split:** a ghost of the splitter frame glides onto the scale. Tag: `Podijeli obje strane s 2.`
     - **Answer:** the blank pulses with `Upiši x = 9.`
     - **Check:** the template pulses with `Prepiši prvu jednadžbu, a umjesto x upiši 9.`
     - **Pin:** the pin tag again. A prediction has no next move to show.
   - A ghost is presentation only: no store change, no event. Any action of his ends the hint. Texts are in `hr.ts`.
7. **The automatic 60 s hints stay as they are.**

### C. All

8. `npm run check && npm test && npm run build` pass.
   - `store/playthrough.test.ts` plays room 4 the new way: −5, split by 2, `x = 9` into the blank, then the check line. It also covers a refused early `x = 9`.
   - Checked in a browser at 1280 × 800 and 640 × 360.

## Tasks / Subtasks

- [x] Lane A: AC 1–4
- [x] Lane B: AC 5–7
- [x] Merge; checks green (AC 8)
- [x] One review, one fix pass
- [ ] Headless play-through, rooms 1–4

## Dev Notes

**File ownership:**

| Lane | Owns |
|---|---|
| A | `src/room/scale.ts`, `src/room/tray.ts`, `src/room/splitter.ts`, `src/room/notebook.ts`, `src/room/fading.ts`, `src/room/dial.ts`, `src/room/handover.ts`, `src/ui/scene/scale/Dial.tsx`, `dial-label.ts`, `Scale.tsx`, `src/content/rooms/r04-water-wheel.ts`, the content tests, the notebook UI only if the blanks need it |
| B | new `src/room/hint.ts`, new goal card files (skin, layout, component), new `src/ui/common/HintButton.tsx` and its CSS, the ghost animations (new components in `ui/scene/scale/`), `SceneRoot.tsx`, `App.tsx` mounting |

- Lane B reads `room/handover.ts`'s exported API (`handoverView` and the handover ids) and `math/steps.ts`. Don't change their signatures. Lane A only adds the `answer` id.
- Shared files (`hr.ts`, `tuning.ts`, `room/types.ts`, `store/*`): add your own keys and branches only.
- Builders don't edit planning documents.
- Croatian text only in `hr.ts`. Pixi only in `ui/scene`. Shape carries state. No praise text. StrictMode-safe.

## Dev Agent Record

(Each lane adds its own section: Calls, files, checks.)

### Lane A (`lane/1-16-rules`): one x, simplify first, room 4 blanks

**Calls** (flag any for veto):
- Acting out is gone from the state: `StageState.actingOut` and `ScaleView.actingOut` are removed. The pans are always weighed at `dialX`, readouts always show unless the stage hides them, and a jammed line is weighed at the dial's x too, keeping the jam's minimum tilt.
- The slider's plate shows the x the pans are weighed at: the dial's x, the machine's test x while a pin test turns the dial, and the pin's x while a pin beyond the dial is weighed (no room 1–4 has one now). It is never dimmed. `dialLabelState` and `dimmedLabelAlpha` are replaced by `dialLabelX`, and `dialLabelText` takes a number.
- "Simplified" is judged on the pieces the scale shows, not on the line's text. One pan holds only x pieces; the other holds one number piece or nothing. So the split line `2x : 2 = 18 : 2` (one gear against a 9) counts, while `2x = 23 − 5` (a weight and a balloon) doesn't.
- The rule reads `stage.pans`, which holds the last committed line or the result of Balance's moves. So after a split it reads `x = 9`, and with Balance `blank`, where no line is written, it still works.
- The rule applies wherever `ways` doesn't include `try`. It sits in `enterLine` (`answerAllowed`): the verdict stays the checker's `answer`, but nothing is stored, `refused` counts up and no event fires.
- The tag is `StageState.refusal: 'simplify' | null` (type `Refusal`). It is set on that refusal and cleared by any edit or enter. `refusalView` also hides it as soon as the pans are simplified, for example by a Balance move.
- The tag hangs at the notebook where the handover tags hang (`RefusalNote`, the same paper). Nothing pulses, and it takes the place of a notebook handover. Text: `hr.refusal.simplify`.
- The blanks come from the fading rule, not per room. A stage with Balance `auto` whose Try values isn't `blanks` gets `x = ☐` and the check template once x is alone on the pans (linear form `x` against no x). After the answer only the check template is left, and after the check line nothing (`room/fading.ts`, `lastLines`/`withLastLines`). They are applied after every typed line and every Balance move.
- If a later move leaves x not alone before the answer, the blanks go again. A number in the blank comes out as the free line `x = 9`. A free `x = 9` (for example a refused one) is carried into the blank when the blanks appear. Any other draft is cleared.
- `answer` is met only when the answer line is written while the step applied. Room 1's answer doesn't meet it, so room 4 still shows it once.
- `write` ("Vaga je u ravnoteži…") now needs the dial's x to level the pans and the answer to be allowed. It no longer fires on Balance's `x = n`, because the scale isn't level there at a wrong x; `answer` takes that case.
- The dial's handover used to stay away while a line was acted out. It now stays away once he has written a line himself (`wrote`).
- Room 4 keeps its 0–6 dial and `tiltPerUnit` 0.75, so no notch of any Balance line hits the 15° clamp (content test).
- Tests of pin rules that used room 4's pin (beyond-dial weighing, the tray offered by a pin test at the dial's end, the pin tag, Potvrdi on the phone) now use a local "pinned wheel" spec: room 4 as it was. This keeps the later-room behaviour covered.
- The dev panel's tablet profile no longer sets or confirms room 4's pin (`dev/dev-view.ts`).
- Files outside lane A's table, changed only because the types changed: `room/room.ts` (the arrival fields), `ui/scene/scale/HandoverTag.tsx` (layout key), `ui/scene/scale/handover-tag-layout.ts` (`answer` is a notebook handover), `ui/notebook/HandoverNote.tsx` and `Notebook.tsx` (the `answer` tag and the refusal tag), `dev/dev-view.ts`.

**For the merge with lane B:**
- `HandoverId` gains `answer`, between `write` and `check`. A `Record<HandoverId, …>` or an exhaustive switch in `room/hint.ts` needs an entry. `handoverView`'s signature is unchanged, and `math/steps.ts` is untouched.
- `actingOut` is gone from `StageState` and `ScaleView`. A goal card or hint that reads it should use `scaleView(room).level` and `stage.pans`.
- `SceneHandover` now excludes `answer` too.

**For the main session (planning documents not edited):**
- `project-context.md` rule 4, and the architecture's matching text, still describe acting out at the solution and `x = ?`.
- The GDD's room 4 row (pin: none) and its fading row (blanks for the last two lines) are for the main session, as the story says.
- The `balance-goal` text, `Vaga zna koliki je x.`, was written for the level, true-x scale. At a wrong slider value the scale now tips while it shows. Worth a second look.
- Not fixed, from 1.15: an edit after a jam puts the pans back to the last committed line (`edited`). With Balance `blank` (no room yet) that would lose moves that wrote no line. With `auto` the split line and its result look the same on the pans, so room 4 is unaffected.

**Files:**
- Changed: `src/room/{types,scale,notebook,fading,tray,splitter,dial,handover,room}.ts`, `src/content/rooms/r04-water-wheel.ts`, `src/content/text/hr.ts` (`handover.answer`, `refusal.simplify`), `src/ui/scene/scale/{Dial,HandoverTag}.tsx`, `src/ui/scene/scale/{dial-label,handover-tag-layout}.ts`, `src/ui/notebook/{Notebook,HandoverNote}.tsx`, `src/dev/dev-view.ts`.
- Tests rewritten in place, each with a comment naming what 1.16 replaced: `room/{scale,notebook,tray,splitter,handover,room,pin}.test.ts`, `content/rooms/rooms.test.ts` (room 4's GDD row and its own tests), `store/{store,playthrough}.test.ts`, `ui/scene/scale/{dial-label,piece-tween,pin-tag-layout,pin-test,handover-tag-layout}.test.ts`, `ui/notebook/notebook-aside.test.ts`, `dev/dev-view.test.ts`.
- New tests:
  - Simplify first: `notebook.test.ts`.
  - `xAlone`, `lastLines`, `withLastLines`: `fading.test.ts`.
  - The blanks through Balance moves: `tray.test.ts`.
  - The `answer` step, its order and when it is met, plus `write`'s new guard: `handover.test.ts`.
  - Content (`rooms.test.ts`): every Try-less stage keeps x off its dial; every blanks-once-alone stage finishes by filling both blanks; room 4 stays out of balance at every notch through its Balance lines.
  - The tags at the notebook: `Notebook.test.tsx`.
  - `playthrough.test.ts` (AC 8): room 4 plays −5, split by 2, 9 into `x = ☐`, then 9 into `2 · ☐ + 5 = 23`. It also covers the refused early `x = 9`, the 17/23, 12/18, 6/9 readouts at 6, and the blanks with the `answer` tag.

**Checks:**
- `npm run check`: clean (237 files).
- `npm test`: 96 files, 1823 passed, 2 skipped.
- `npm run build`: passes, 0.33 MB of JavaScript gzipped.
- Browser: headless Edge (Playwright) on my own Vite server, port 5340, since stopped; 5173 untouched. Room 4 at 1280 × 800 and 640 × 360:
  - No pin, and the dial is free at once.
  - Typing `x = 9` first is refused with `Prvo pojednostavi vagu.` under the draft, and no line is written.
  - The plate reads `x = 6`, with readouts 17/23, then 12/18 after −5, then 6/9 after the split. The scale tips each time.
  - After the split the notebook shows `x = ☐` pulsing with `x je sam na vagi. Upiši koliko je x.` and `2 · ☐ + 5 = 23` below it.
  - 9 then 9 locks the room.
  - Room 1's plate still reads `x = 5` after the answer line.
  - The only console error is the existing 404 for a resource.
- On the phone, the upcoming check template is partly hidden above the tag, as with 1.15's write tag; the draft stays in view.

### Lane B (`epic-1`): the goal card, the hint button, next-move ghosts (AC 5–7)

**Calls** (flag for veto):
- The hint's presses live in `ui.hint` (`{ level, presses }`), set by a new `hint/press` action that changes nothing in the room or the save and fires no event. Pure rules are in `room/hint.ts`.
- "Any action of his ends the hint" means an action of his that changes the room, the same rule the idle clock uses. A tap that does nothing keeps it. `room/enter`, a new stage or a locked stage end it too.
- The tray's and the splitter's steppers keep the hint, so he can set the number the tag names (`Skini 5 …`) while the ghost still shows. They are settings, not moves (as `resetStage` treats them).
- The clock and the phone's notebook slide keep the hint. Each press after the second replays the ghost.
- The first press always pops its tag in, so a press visibly answers even when the same handover tag was already up. While a hint shows, it takes the handover tag's place in the scene and at the notebook, so only one tag shows at a time.
- Where no handover step applies (a jam, or a line acted out), the first press shows the step the next move belongs to: slide → `dial`, tray → `tray` or `balance-goal`, split → `splitter`, answer → `write` (Try) or `answer` (Balance, once lane A adds it), check → `check`.
- The way for the next move is Try when the stage lists it and the dial reaches the solution, else Balance once earned. Balance before the tray is offered says "slide right", toward the dial's end where the tray comes.
- Balance moves are read off the pans, not the canonical lines: `2x + 2 = 20` says take 2; a splitter set to 3 still says split by 2. A number over 99 is capped at the tray's maximum.
- Answer step: keyed off "the pans hold x alone at the solution, no answer line" (`isAnswerLine(pans, n)`). Lane A's `answer` id is used when `handoverOrder` has it, else `write`; the tests accept either.
- A weight move says `Dodaj 5 na obje strane: stavi uteg 5 na vagu.`. Before 6 and 7 the split tag says "sa" (`sa 6`, `sa 7`).
- Goal card: label on two lines (`Cilj:` / `x sam`) beside a level miniature scale, in the scene's bottom-right corner, under the right pan and right of the dial. The picture is as big as fits there: 4 label-ems on the tablet, 2.3 at 640 × 360.
- In the miniature, `x` and `?` are 0.58 of the picture's em: about 20 CSS px on the tablet and about 12 at 640 × 360. They are part of a picture, not numbers on weights.
- Matched means one small, undivided x-gear alone against one number piece or nothing, on `stage.pans`. A jam never lights the card.
- Lit, the card shows a 2.2× frame and a tick in a ring over the miniature's pivot (shape), with a lamp-coloured glow, rays and a one-off bump (colour). There is no bump under reduced motion.
- The card's layout never covers the pans (every dial x and every tilt), the beam, the stand, the dial (track, knob and plate at every notch), the pin flag, the tray, the splitter (whenever Balance is earned, so the card doesn't move), the reset and hint corner, the parts counter or the phone's notebook handle. The handover tags and the hint's tags take it as a hard obstacle (`handover-tag-layout.ts`).
- With today's room 4 pin at 9 at 640 × 360, no corner spot is free, so the card stands over the machine. Lane A's pinless room 4 puts it in the corner.
- `resetCorner` (pin-tag-layout.ts) now covers the hint button too: 72 × 136 CSS px. Its test is updated; every pin and handover tag test still passes.
- Hint button: 56 px at (8, 72) on the tablet and 48 px on a phone, with a heavier ring while a hint shows. It is left-aligned on the phone, because centred it touched the left pan's sweep at −10° tilt.
- Ghosts: the knob goes two notches the right way and back. The tray piece rises, glides over the scale, splits to both pans and fades. The splitter frame glides over the beam's middle and fades. Each runs for 2.4 s with a 1.2 s pause while the hint shows, at 0.55 alpha, and takes no touches. Under reduced motion each holds still at its end.
- Dial.tsx's own nudge (lane A's file) is untouched, so during a `dial` handover it can run beside the knob ghost.
- The pin's question tag pops on a press while the pin is offered (`Pin.tsx`).
- The notebook's tag is a new `HintNote` reusing the handover note's CSS. `Notebook.tsx` gained the `hint` prop, and its phone aside logic treats a scene hint like a scene handover, one press at a time.

**Files:**
- New pure rules: `src/room/{hint,goal}.ts` and their tests.
- Store: `src/store/{actions,types,reducer}.ts`, new `store/hint.test.ts`, and `store.test.ts` (`ui.hint`).
- Shared: `src/content/text/hr.ts` with new `hr.test.ts`, and `src/config/tuning.ts`.
- New skin: `src/art/skins/goal.ts` and its test.
- New common UI: `src/ui/common/{HintButton.tsx,hint-button.css,hint-text.ts}` and tests.
- Notebook: new `src/ui/notebook/{HintNote.tsx,hint-note.css}` and test; `Notebook.tsx`.
- New scene parts: `src/ui/scene/scale/{GoalCard.tsx,HintTag.tsx,HintGhost.tsx,goal-card-layout.ts,hint-ghost.ts}` and tests.
- Changed: `SceneRoot.tsx`, `Pin.tsx`, `pin-tag-layout.ts` and its test, `handover-tag-layout.ts`, and `src/app/App.tsx`.

**Checks:**
- `npm run check` is clean.
- `npm test`: 106 files, 1847 passed, 2 skipped.
- `npm run build` passes (JS 0.34 MB gzipped).
- Headless Edge on port 5350, at 1280 × 800 and 640 × 360, through the real button, with no console errors:
  - Room 1: `?` shows the dial tag, then `Pomiči klizač udesno.` with the knob ghost. At x = 5 the notebook pulses with `Upiši x = 5.`
  - Room 3: `?` pops the pin's question.
  - Room 4, today's version and a pinless copy: the card appears once the tray is offered. `?` shows the tray tag, then the −5 balloon ghost with `Skini 5 …`.
  - A tray step keeps the hint; the drop ends it.
  - After the drop, `?`, `?` shows the frame ghost with `Podijeli obje strane s 2.` After the split the card lights, and `?`, `?` gives `Upiši x = 9.` at the notebook.
- Server stopped.

### Fix pass (`epic-1`): the one review's findings

**Calls** (flag any for veto):
- One rule for "x alone", on the pieces the scale shows: `room/pieces.ts` `aloneAgainst` / `xAlone` (one small gear, not divided, against one number piece or nothing) and `simplified` (only x pieces on one pan, one number piece or nothing on the other). The blanks (`fading.ts`), the `answer` handover and the hint (`handover.ts` `answerOnPans`, now exported), the goal card (`goal.ts`) and simplify first (`notebook.ts`) all use them. `xAlone` implies `simplified`, so a blank that shows always takes its number.
- So `x = 23 − 14` is an ordinary valid line now: no blanks, no `answer` tag, and `x = 9` from there is refused (the scale shows a weight and a balloon). The hint leads him out with the tray: weight 14 (any tray move combines each pan's numbers), then balloon 14, then `x = ☐`. With weights only (`x = 4 + 5`) it takes the smallest off as a balloon. He can also type `2x = 18` first.
- The splitter's handover now needs a side with more than one x (`readyToSplit`), not just "not x alone", so it doesn't come at `x = 23 − 14` or `x : 3 = 5`, where there is nothing to split.
- Simplify first refuses any valid line that would leave x alone (`x = 3 · 3`, `x = 18 : 2`, `x = 9 + 0`, `3 · 3 = x`) unless the pans before it were simplified. Same wiggle, same tag. Balance's own lines aren't gated; they are the simplifying moves.
- The jam is its own hint step (`HintStep` gains `jam`, `HintMove` gains `{ kind: 'jam' }`), checked before the pin's question. Both presses hang at the notebook, pulse the draft and the delete key (`data-pulse` on the pad key, its own `key-pulse` ring, a blink under reduced motion) and show no scene ghost. Texts: `hr.hint.jam.what` and `hr.hint.jam.fix`.
- The refusal's tag stays up only until his next action. Any action of his that changes the room takes it down (root reducer, `withoutRefusal`); the clock doesn't. A hint press doesn't change the room: its tag takes the refusal's place at the notebook (`notebookRefusal`), which is safe because the refused enter ends any hint, so a hint showing with a refusal was pressed after it. The scene hangs no tag while the refusal's shows (`sceneTag`).
- The dial's track scroll is a ref shared per scene copy (`DialScroll`, from `SceneCopy` to `Dial` and `HintGhost`); the knob's ghost reads it every frame (`knobAt`).
- New blanks always start empty. When the blanks go, a number in the old blank still comes out as free text, as before.
- The check move carries `template`; with a template the second press says `Upiši 9 umjesto x.` (`hr.hint.checkBlank`), on a blank page it still says `Prepiši prvu jednadžbu, a umjesto x upiši 9.`

**Files:**
- Rules: `src/room/{pieces,fading,goal,handover,notebook,hint}.ts`, `src/store/reducer.ts`, `src/content/text/hr.ts`.
- UI: `src/ui/common/hint-text.ts`, `src/ui/notebook/{Notebook,NumberPad}.tsx`, `src/ui/notebook/notebook.css`, `src/ui/scene/SceneRoot.tsx`, `src/ui/scene/scale/{Dial,HintGhost}.tsx`, `src/ui/scene/scale/dial-layout.ts`.
- Tests rewritten in place, each with a comment naming the old behaviour: `room/fading.test.ts` and `room/tray.test.ts` (no carried draft), `store/playthrough.test.ts` (he fills the 9 himself), `room/hint.test.ts` (the jam step, the check's `template`), `ui/common/hint-text.test.ts` (check on a blank page).
- New tests: `room/pieces.test.ts` (the one rule), `room/notebook.test.ts` (`x = 3 · 3` and the others refused; `x = 23 − 14` brings no blanks), `room/handover.test.ts` (no `answer` or splitter tag at `x = 23 − 14`), `room/hint.test.ts` (answer after a deleted jam on the split's line, never a split under 2, the jam in rooms 1 and 4 and on a jammed blank, the way out of `x = 23 − 14`, the check template), `store/hint.test.ts` (the refusal goes on his next action, not on the clock or a press), `ui/common/hint-text.test.ts` (jam spots, check text, one tag with the refusal), `content/text/hr.test.ts`, `ui/notebook/Notebook.test.tsx` (the delete key pulses), `ui/scene/scale/dial-layout.test.ts` (`knobAt` on a scrolled track), `ui/scene/scale/hint-ghost.test.ts` (the wiring).
- Each fix was reverted in turn with its tests run: every one failed without its fix (bugs 1–8).

**Checks:**
- `npm run check`: clean (260 files).
- `npm test`: 106 files, 1903 passed, 2 skipped.
- `npm run build`: passes, 0.34 MB of JavaScript gzipped.
- Headless Edge (Playwright, `channel: 'msedge'`) on my own Vite server, port 5360, since stopped; 5173 untouched. At 1280 × 800 and 640 × 360, through the real `?` button and keyboard, the store only setting up positions:
  - Bug 1: room 4, −5, split, 6 in `x = ☐` jams, delete: `?`, `?` says `Upiši x = 9.`
  - Bug 2: room 1 with 4 jammed, room 4 after `x = 8`, and room 4 with 8 jammed in the blank: the first press says `Stroj je zapeo: ovaj redak ne vrijedi.`, the second `Obriši ga tipkom ⌫ i napiši ponovno.`; the draft and the delete key pulse, and the blank still holds only the 8.
  - Bug 4: room 4, `x = 3 · 3` first is refused with `Prvo pojednostavi vagu.`, nothing stored, and no scene tag shows. After −5 the tag goes, and enter takes `x = 3 · 3`; an empty `x = ☐` appears.
  - The only console error is the existing 404 for `/favicon.ico`.

**Not done:**
- Still open from lane A: an edit after a jam puts the pans back to the last committed line, which would lose moves with Balance `blank` (no room yet).
- The headless play-through of rooms 1–4 (the story's last task) is not part of this pass.
