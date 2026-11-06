# Story 1.14: Fix what the first playtest found

Status: in-progress

## Story

As Luka,
I want rooms 1–4 to make sense to someone who has never seen them,
so that the machine can teach without me standing next to it.

**Source:** Luka's first play-through on 2026-11-06. He gave up in room 3. In his words:

- "The door opens 90% when I solve the first line. I thought that was it... that I won..."
- "Division is just... weird... a big cog on top of a small one... no idea what it represents..."
- "The circle with the number inside and the arrow pointing down... I really, really, really, don't get it"
- "I moved one circle, got offered potvrdi, but couldn't move it afterwards."
- "What is the point of prediction when I can just move the slider left and right until it balances?"

What was really happening, checked in the browser:
- The door's height followed `machineProgress`, and the answer line sets that to 0.9. The check line moved the door the last 10% and lit a small lamp.
- `x : 3` was drawn as the x gear sitting on a small "3" gear (the GDD's "reducer").
- The circle was the prediction pin. Nothing said what it asks. The −6 float was also a circle with a number in it.
- Placing the pin froze the dial until **Potvrdi**, which sat in the far bottom-left corner. Before that, the dial had stopped at the end of the poke window with no visible reason.
- After confirming, dragging found the answer anyway. A wrong pin cost nothing, and a right one paid nothing until epic 3.

**Covers:** FR on prediction, the scale's pieces and the machine's progress (GDD: Prediction, Pieces, Machine). It changes some architecture and GDD rules, listed in Dev Notes.

## Acceptance Criteria

### A. The scene's drawings (built in the `lane/1-14-art` worktree)

1. **The door is latched until the check line.**
   - **Given** a stage that isn't locked **When** lines move `machineProgress` **Then** the door lifts by at most `tuning.doorLiftBeforeLock` of its travel (0.3 by default). Visible lift = progress × that share.
   - **And** a latch is drawn holding the door: a bolt or bar across the door's front that reads as "locked". It is drawn by shape, not colour (NFR4).
   - **Given** the answer line is accepted (progress 0.9) **Then** the latch rattles once, a short shake of the latch only, so it is clear one more thing is needed.
   - **Given** the stage locks **Then** the bolt slides out, and after it clears, the door rises all the way. The existing lock and restart timings stay within `tuning.presentationTimeoutMs`.
   - **And** a stage that isn't the room's last keeps its lit lamp as before, and the next stage starts with the door down and the latch on.
2. **`x : n` is drawn as one slice of a gear cut into n.**
   - **Given** a gear piece with a divisor n **Then** the full gear is drawn as a faint ghost outline, carrying the dial's x like any small gear. One n-th of it, a sector of 360°/n, is drawn solid, standing on the pan. The divisor shows as `: n` on a small tag on the slice, with the school sign.
   - **And** the small divider gear underneath goes. `x : 3` in room 2 shows the ghost gear with x and one solid third tagged `: 3`.
   - **And** a large gear with a divisor is drawn the same way. A spring with a divisor (not in rooms 1–4) draws its cap cut into n with one part solid, or keeps the current drawing; the builder's call, recorded.
   - **And** the piece's footprint and hit size keep the layout tests passing at 640 × 360 and on the tablet.
3. **A float looks like a balloon pulling up.**
   - **Given** a float piece **Then** it is drawn as a balloon: a teardrop shape with a knot at its bottom, floating clearly above the pan, on a string down to the pan with a slight curve.
   - **And** a clear upward arrow sits beside or above it, at least as tall as the balloon's knot-to-centre distance.
   - **And** its label reads with the school minus, `−6` (from `math/format.ts`), not `6`.
   - **And** it can't be mistaken for the pin: the pin is a round head on a post pointing down, and the balloon has no post and points up.

### B. The pin and the parts (built in the main checkout on `epic-1`)

4. **The pin asks its question, and the dial's stop is visible.**
   - **Given** a pin is offered (in its holder or placed, not yet confirmed) **Then** a paper tag hangs on the holder with the question from `hr.ts`:
     - level-x pin: `Gdje će se vaga uravnotežiti?`
     - effect pin with options `pan-down` / `pan-up`: `Kad x raste, ide li zdjelica s x gore ili dolje?`
   - **And** its text is at least 20 CSS px on every supported screen, and it never covers the dial, the pans or the pin's places at 640 × 360. It disappears when the pin is confirmed.
   - **Given** a poke window **Then** the dial's track has a clamp drawn across it at the window's end: a shape that blocks the track, not just a thicker tick. The track beyond it is drawn fainter. On confirm, the clamp opens or lifts away.
5. **Confirm sits next to the pin, and the dial keeps working inside its window.**
   - **Given** a placed, unconfirmed pin **Then** the confirm control (**Potvrdi**, HTML, at least 48 CSS px) is placed right next to the pin's head, follows it when the pin moves, and stays fully on screen at 640 × 360 and on the tablet. Its old bottom-left spot is no longer used.
   - **Given** the stage is in `pin` **When** he drags the dial **Then** it turns, clamped to the poke window (`dialOpen`), exactly as in `poke`. Placing or moving the pin no longer freezes the dial, and dragging the dial doesn't move the pin.
   - **And** a stage with a pin but no poke window (room 3 stage 2) still can't turn its dial before the pin is confirmed.
6. **On confirm, the machine tests the pin itself.**
   - **Given** a `level-x` pin whose value the dial can reach **When** he confirms **Then** the pin resolves at once (`PredictionMade` with `right`). The stage opens, and the machine turns the dial itself to the pin's value. In the store, `dialX` becomes the pin's value; on screen the knob moves there notch by notch, at `tuning.pinTestNotchMs` per notch (120 ms by default), and the pans follow.
     - Right: the pans come to rest level, and the pin lights as before.
     - Wrong: the pans come to rest tipped, and the pin dims as before.
     - Then the dial is his, over its full range.
   - **Given** a `level-x` pin beyond the dial (room 4's track reaches 12; the dial stops at 6) **When** he confirms **Then** it resolves at once. The pans weigh the pin's x for `tuning.pinRevealMs` (1.6 s), level or tipped, then return to the dial's x. This is today's wrong-pin reveal, now for right pins too and run at confirm.
   - **Given** an `effect` pin **When** he confirms **Then** it resolves at once, and the machine turns the dial itself up `tuning.pinEffectTestNotches` notches from where it is (3 by default, clamped to the dial). The x pan visibly moves.
   - **And** a dial turned by the machine fires no `DialNotch`, `PansLevel` or `WayUsed`, so it counts as neither his exploring nor his way. If he grabs the knob during the test, his drag takes over.
   - **And** no "correct" or praise text appears (NFR13). The lit or dimmed pin and the parts in AC 7 are the only signal.
   - **And** the old triggers are gone: a level-x pin no longer waits for the dial to level the pans, and an effect pin no longer waits for the first notch. Lock stays as a safety trigger only.
7. **A right pin pays 2 parts now.**
   - **Given** `PredictionMade { right: true }` for a stage not yet paid **Then** `save.economy` (`createEconomy()` from `src/economy/parts.ts`, in memory until epic 2's save) gains `tuning.predictionParts` (2) through `earnParts`.
     - The stage's key `${roomId}:${stage}` is added to `paidPredictions`, so resetting and re-pinning earns nothing (GDD: once per stage).
     - A wrong pin changes nothing.
   - **And** a parts counter shows in the scene area's bottom-left corner (HTML; a small cog-and-plate icon and the number via `formatNumber`, at least 20 CSS px). It appears once he has earned any parts, or while a pin is on screen.
   - **And** on a paid pin, a `+2` rises from the pin and travels to the counter, which then ticks up. This is the only reward signal; it is parts, which the GDD already pays for predictions, not praise.
   - **And** the root reducer applies this from the room's events; the room/ reducers stay unaware of the economy.

### C. Both

8. `npm run check && npm test && npm run build` pass.
   - Every changed rule has unit tests, and old tests asserting the replaced behaviour are updated, not deleted silently.
   - The layout tests still cover 640 × 360 and the tablet. The store playthrough test (`store/playthrough.test.ts`) plays rooms 1–4 with the new pin flow and the parts.
   - It is checked in the browser at 1280 × 800 and 640 × 360.

## Tasks / Subtasks

- [ ] A1 door latch: `src/art/skins/machine.ts`, `src/ui/scene/machine/*`, `tuning.doorLiftBeforeLock` (AC 1)
- [ ] A2 reducer slice: `src/art/skins/scale.ts`, `src/ui/scene/scale/Piece.tsx` and the label spots (AC 2)
- [ ] A3 balloon: `src/art/skins/scale.ts`, the float's label (AC 3)
- [x] B1 question tag and clamp: `src/ui/scene/scale/Pin.tsx`, `src/art/skins/pin.ts`, `src/ui/scene/scale/Dial.tsx`, `src/art/skins/dial.ts`, `src/content/text/hr.ts` (AC 4)
- [x] B2 confirm beside the pin, dial in `pin`: `src/ui/common/PinConfirm.tsx`, `common.css`, `src/room/dial.ts`, `src/room/pin.ts` (AC 5)
- [x] B3 machine tests the pin: `src/room/pin.ts`, `src/ui/scene/scale/Scale.tsx`, `Dial.tsx`, tuning (AC 6)
- [x] B4 parts: `src/store/*`, a new `src/ui/common/PartsCounter.tsx`, tuning, hr.ts (AC 7)
- [ ] Merge `lane/1-14-art` into `epic-1`; checks green (AC 8)
- [ ] One review, one fix pass
- [ ] Browser check at 1280 × 800 and 640 × 360

## Dev Notes

**Rules this story changes, to be written into the planning documents by the main session (builders don't edit planning documents):**
- **Architecture, Pattern 2 (Pin):**
  - "A pin drag freezes the dial" becomes "the dial keeps turning inside the poke window".
  - The pin resolves on confirm, and the machine tests it: it turns the dial itself, or weighs the pin's x beyond the dial.
  - Level and first-notch resolution are replaced, and lock stays as a safety trigger.
  - Confirm is placed next to the pin.
- **Architecture, state:** `save.economy` exists from epic 1. `PredictionMade` pays parts in the root reducer.
- **GDD:**
  - The Reducer is drawn as one slice of a gear, not a 3-to-1 gear under it.
  - The float is a balloon labelled with its minus.
  - The door is latched until the check line.
  - The pin's question shows on a tag, an exception to "no instructions before a room": it's on the machine, during the room.
  - Prediction: the machine tests the pin on confirm, and a right call pays 2 parts from epic 1.

**Fixed points:**
- Croatian text lives only in `src/content/text/hr.ts` (the architecture test enforces this).
- The Pixi rules stay: only `ui/scene` imports Pixi, per-frame values go through refs, and Graphics are built once and transformed.
- Shape always carries state; colour is never the only signal (NFR4).
- The grey-and-ink look holds: no colour except where it is already used (lamp, jam) (NFR12).
- `machineProgress` and the checker are unchanged. Only the door's drawing maps progress differently.
- The two lanes touch different files. Both add keys to `src/config/tuning.ts`; the merge keeps both.

## Dev Agent Record

(Builders fill in Calls, the file list and check results here, one section per lane.)

### Lane B (pin, parts; main checkout on `epic-1`)

**Calls** (flag any for veto):
- The question tag is placed by search, not a fixed spot: right above the holder with a short string down to its cradle when that is clear, else on the wall high on the left, hung from a nail (`pin-tag-layout.ts`). It keeps clear of the pans and readouts at every x the poke window reaches, the dial band, the pin's places and holder, the stand and needle, the machine and the reset control. Tablet: rooms 3.1 and 4 on the holder, 3.2 on the wall. 640 × 360: room 4 on the holder, rooms 3.1 and 3.2 on the wall, because 20 CSS px text has no room above the holder there.
- The tag's text is 20 CSS px exactly (`ceil(20 / scale)` scene units), normal weight, and its width is estimated at 0.5 em a character (measured 0.39–0.48 in the browser).
- The tag is not drawn in the dev panel's three-copy profile, like the tray and splitter: at a third of the scale, 20 CSS px text would cover the copies.
- The tag may cross the beam (not one of the parts the AC protects); it never crosses the pans, the needle or the stand's post.
- The holder stays drawn while the pin is offered, even with the pin placed, so the tag has something to hang on.
- The clamp is a C-clamp with jaws above and below the track, a bar across it and a screw on top, on the first notch past the window. It lifts and fades out in 360 ms on confirm. The track past it is drawn at a quarter of its alpha.
- Potvrdi is 132 × 56 CSS px, its bottom level with the pin head's bottom so it stays clear of the knob. An x pin's button goes on the side toward the dial's centre (clear of the readouts under the pans' outer halves); a choice pin's goes on the outer side (clear of the other option). It flips when there's no room, is clamped inside the scene area, and slides along as the pin moves place to place.
- The machine's turn is detected in the UI by comparing the room just before and after the confirm (`pin-test.ts`), so the room state gains no presentation fields. Each consumer (knob, pans, pin, counter) runs the same timeline (`use-pin-test.ts`); frames change once per notch, never per animation frame.
- Timeline: first notch after 120 ms, then one per 120 ms. The pin lights or dims 600 ms after the last notch (`pinTestRestMs`, a presentation constant, not tuning). A pin beyond the dial weighs its x for `pinRevealMs` and lights at 600 ms.
- Grabbing the dial during a test dispatches `dial/set` at the knob's shown x, so his drag takes over from where the knob is and the test ends everywhere. That fires one `DialNotch` for his grab. The machine's own turn fires none.
- An effect pin turns the dial up 3 notches clamped to the dial; with the dial already at its maximum nothing moves and the result shows at once.
- `resolvePin` lost its trigger argument (confirm and lock both resolve). `PinSpec.effect.resolvesOn` is still in the type and room 3's data, but nothing reads it now. Main session: drop it from the architecture's PinSpec, the type and `r03` when you update Pattern 2.
- `pinRevealMs` moved from `pin-layout.ts` into tuning. The reveal now covers any x pin beyond the dial, right or wrong. A wrong pin the dial reaches no longer reveals: the dial goes there.
- Parts: `payPrediction` and `predictionKey` in a new `economy/predictions.ts`; the key is `${roomId}:${stageIndex}` (0-based, so room 3's first stage is `r03:0`). The root reducer reads `PredictionMade` events after the room step.
- The counter (`PartsCounter.tsx`) shows `parts − flying`, so it ticks up only when the `+2` lands (900 ms CSS flight, rising 40 px then travelling). It has `pointer-events: none`, and is smaller on phones (44 px tall, 22 px text) to stay clear of the knob at notch 0. Under reduced motion the flight is hidden and the counter just ticks.
- The scene's CSS-px offset (`fit.x`, `fit.y`) is now passed to Pin, so the tag can avoid the HTML reset control precisely.

**Files changed:** `src/config/tuning.ts`, `src/content/text/hr.ts`, `src/room/{dial,pin,scale,notebook,phases,types,events}.ts`, `src/economy/{predictions.ts,predictions.test.ts,types.ts}`, `src/store/{reducer,types}.ts`, `src/art/skins/{pin,dial}.ts`, `src/ui/scene/SceneRoot.tsx`, `src/ui/scene/scale/{Pin,Dial,Scale}.tsx`, `src/ui/scene/scale/{pin-layout,pin-tag-layout,pin-test,use-pin-test}.ts`, `src/ui/common/{PinConfirm,PartsCounter}.tsx`, `src/ui/common/{scene-spots,use-area-size}.ts`, `src/ui/common/common.css`, `src/app/App.tsx`. Tests: new `pin-tag-layout.test.ts`, `pin-test.test.ts`, `scene-spots.test.ts`, `PartsCounter.test.tsx`, `predictions.test.ts`. Updated, with the replaced behaviour rewritten in place and commented: `room/pin.test.ts` (freezing dial, level and first-notch resolution, wrong-pin reveal), `room/dial.test.ts` (dial in `pin`), `room/phases.test.ts`, `room/tray.test.ts`, `store/store.test.ts`, `store/playthrough.test.ts` (new pin flow, no dial events on confirm, parts 0 → 4 → 6), `dev/dev-view.test.ts`, `art/skins/dial.test.ts` (clamp, faint track), `ui/common/PinConfirm.test.tsx`, `ui/scene/scale/pin-layout.test.ts`, and the `SaveState` literals in `piece-drag.test.ts` and `splitter-drag.test.ts`.

**Checks:** `npm run check` clean (219 files). `npm test`: 88 files, 1652 passed, 2 skipped. `npm run build` passes (JS 0.32 MB gzipped). Browser (own server on 5310, since stopped) at 1280 × 800 and 640 × 360: rooms 3.1, 3.2 and 4. I saw the tag on the holder and on the wall, the clamp and faint track and the clamp lifting, the dial turning in `pin`, Potvrdi beside the head on both sides, the knob turning notch by notch with the pans following, the pin lighting and dimming, room 4 weighing 9, a grab mid-test taking over at the knob's x, the `+2` rising, and the counter going 0 → 2 → 4 → 6. No console errors after a fresh load.

**Known, not fixed (phone only, 640 × 360):** with the pin on room 3.2's left option, Potvrdi covers the left pan's readout (there's no free spot beside the head). The counter covers the bottom of room 3.1's empty holder post (touches pass through). The phone notebook, when not pushed aside, still covers the right part of the pin track (as before this story).
