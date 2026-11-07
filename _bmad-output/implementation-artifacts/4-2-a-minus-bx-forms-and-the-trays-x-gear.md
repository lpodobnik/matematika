# Story 4.2: `a − bx` forms and the tray's x-gear

Status: done

## Story

As Luka's son,
I want x to lighten the pan and still undo it,
so that I see the inverse of `135 − ☐` is `135 − 100`, not `+ 135`.

**Covers:** FR12 (`a − bx`); FR18 (x-balloons); GDD room 9's tray x-gear.

## Acceptance Criteria

1. **Given** `135 − 5x = 100`, **then** the pans show five x-balloons under the 135 weight, and the chain shows `x → · 5 → 135 − ☐ → 100`.
2. **When** he runs `135 − ☐` on the last link, **then** the move is `5x = 135 − 100`; `+ 135` jams.
3. **Given** a stage from room 9 on, with Balance, **then** the tray also holds an x-gear, with a stepper for how many. Dropped on the scale, it adds that many x to both sides: `135 − 5x = 100` becomes `135 = 5x + 100`.
4. **And** Balance's canonical solution, its hints and the content tests use the x-gear where x is taken away.

## Calls made (for Luka's veto)

- **The x-gear is a third column on the tray, left of the weight,** with its own + and −.
  - It shows `x` at 1, then a large gear `5x`, as the pans draw more than one x.
  - It is only there in stages that set `trayGear`. The content tests require that from room 9 on, wherever Balance is listed.
- **Dragging an x-balloon off a pan is not built.** The GDD doesn't ask for it, and adding gears does the same.
- **The x-gear's move is written like any Balance move:** the move as done, then the pans gathered (`135 = 5x + 100`, x pieces first). In room 9, Balance has faded to a blank page, so nothing is written there.
- **Balance's canonical lines with the gear** are `135 = 5x + 100`, `35 = 5x`, `7 = x`, then the check.
  - The 100 is more than the tray's 99. Dragging the 100 weight off the pan takes it off both sides, with no stepper limit.
  - The content test now allows a number that comes off as a weight on a pan.
- **The hint's Balance move** is "Dodaj 5x na obje strane: stavi zupčanik 5x na vagu." It shows once he has started with Balance in the stage; otherwise the hint prefers the chain (story 4.1).
- **The x-balloons and the chain's `135 − ☐` were already built:** the balloons in room 3, the chain and its `… − ☐` operation in story 4.1. This story adds the gear and the tests.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/room/types.ts`: `TrayKind` gets `gear`; `StageSpec.trayGear`.
- `src/room/tray.ts`: `trayHasGear`, `xOnBothSides`, and the gear's `dropOnScale`, `trayPiece` and `trayView.gear`.
- `src/room/room.ts`: the gear starts at 1.
- `src/math/steps.ts`: `StepOptions.trayGear`, and Balance's step where x is taken away. The hint, the worked example and the content tests pass the stage's gear.
- `src/room/hint.ts`, `ui/common/hint-text.ts`: the gear's move and its text.
- The tray in the scene:
  - `ui/scene/scale/tray-layout.ts`: `trayKindsOf`, and a divider per column;
  - `art/skins/tray.ts`: the dividers;
  - `Tray.tsx`: the gear's column;
  - `HintGhost.tsx`: the gear's ghost;
  - `handover-tag-layout.ts`: the wider shelf as an obstacle.

### Tests

- `src/room/tray-gear.test.ts`:
  - the gear from room 9, and its stepper;
  - its drop: `135 = 5x + 100`, with nothing written on a blank page;
  - no gear without `trayGear`;
  - the hint's gear move.
- `content/rooms/rooms.test.ts`: the gear from room 9 wherever Balance is listed, and every way within the tray's limits or by a weight dragged off.
- `math/lines.table.ts`: room 9's Balance lines with the gear (story 4.4).
- Updated for the gear: `room.test.ts`, `tray.test.ts`, `store.test.ts` and `art/skins/tray.test.ts`.
- Played with room 9 (story 4.4).

### Review (one pass, with story 4.4) and fixes

The review confirmed:
- A carried gear dispatches its drop.
- The shelf, anchored on its right, clears the machine and the splitter at every size.
- The gear's step works with x on the right.
- With Balance `auto`, the gear's lines replay on resume.
- After the gear, the chain reads `x → · 5 → + 100 → 135`.
- The short question is covered everywhere.
- The Croatian text has no gendered verb forms.

It found four issues, all fixed:

1. **A gear drop was never refused.** With the stepper at 1, the first drop left x on both sides (`135 − 4x = x + 100`). The chain went dark and the hint had nothing to show. A second gear made it worse, and only a reset got out.
   - The gear now lands only where its count cancels a side's x-balloons exactly. Otherwise it slides back, as a refused weight does.
2. **The tray and the splitter worked while `5x = ☐` waited.** A Balance move then turned the hint to Balance, and filling the blank silently undid the move. Both now wait for the blank, as the chain does.
3. **On small phones the goal card could cover the gear's column.** It still avoided the old, narrower shelf. One `stageTrayLayout` now gives the shelf with its gear to the goal card, the tags and the ghost.
4. **After the gear, the hint said to take off 99 with a balloon** (98 presses), then 1 more. For a weight bigger than the tray's largest, it now says "Odvuci uteg 100 s vage: skine se s obje strane." (no ghost; the tag only).

Minor fixes:
- The stepper refuses the gear where the stage has none.
- Stale comments fixed.
- `dividerX` removed.

New tests: a refused gear, x on the right, the tray waiting for the blank, the hint before any move, at the blank, and after the gear.

Left as they are:
- Nothing introduces the gear's column. The tray was met in room 4, and the hint names the gear once he has started with Balance.
- On a phone, the tray sits under the notebook until he pushes it aside, as before.

### Checks

- `npm run check`, `npm test` (2,425 passed, 2 skipped) and `npm run build` pass.
- Room 9 was played again at both sizes after the fixes.

