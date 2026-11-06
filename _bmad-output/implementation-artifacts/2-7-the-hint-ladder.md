# Story 2.7: The hint ladder

Status: done

## Story

As Luka's son,
I want help that gets more specific the longer I'm stuck,
so that I never have to give up.

**Covers:** FR33 for rooms 1–7.

## Acceptance Criteria

1. **Climbing.** Help climbs one level after each 60 s without an action of his (`tuning.hintIdleMs`), and after every 3 jams in a row (`tuning.helpJams`), up to level 4.
   - It climbs only while there is a step to show (as the hint button works).
   - A line that moves him on (a committed line), or a new stage, takes it back to none.
   - A reset of the stage doesn't, since it doesn't move him on.
2. **The levels** (decided by Luka, 2026-11-06: "Just keep going"; the plan's level 3 had become what every room shows anyway, since the last two lines are always blanks):
   1. the current step's tag, and the piece he can move wiggles (stories 1.15, 1.16);
   2. the next move, as the hint button's second press shows it;
   3. for a move on the machine (the tray, the splitter), the line it will write, with blanks: "Taj se korak zapisuje ovako: 2x + 5 − □ = 23 − □";
   4. the same kind of equation with other numbers, solved line by line to its check line: "Isto, s drugim brojevima: x + 4 = 7, x = 3, 3 + 4 = 7".
3. **With the hint button.** The button works as in story 1.16. What shows is the higher of its level and the help's.
4. **Free and never recorded.** The help lives in the stage: no event, nothing saved.
5. **On a phone.** With the notebook pushed aside, its handle pulses while levels 3 and 4 wait in it.
6. **Checks.**
   - Store and UI tests: climbing on idle and on jams, back to none, through a reset, nothing recorded, level 3's line in room 4, level 4's example for rooms 1–4.
   - A headless play-through at 1280 × 800 and 640 × 360, with a fake clock, through all four levels in rooms 4 and 1. Screenshots looked at.

## Calls made (for Luka's veto)

- Levels 3 and 4 as proposed on 2026-11-06, which Luka let stand for his morning review.
- **Level 3 is for machine moves only.** For the slider, the answer and the check, it shows what level 2 shows, as their lines are already blanks.
- **Level 4's example** keeps the stage's left side and gives the right side a new value at a new, small solution, solved the way the stage is (Try values or Balance). Examples: room 1's x + 4 = 9 becomes x + 4 = 7; room 4's 2x + 5 = 23 becomes 2x + 5 = 11, then 2x = 6, x = 3.
- **The example is written lines only.** A second, small machine acting it out is scene work for epic 6.
- **Help doesn't drop on an action** of his that doesn't move him on: poking around while stuck keeps it. It drops on a committed line.
- **On a phone the notebook doesn't slide in by itself**, since it would cover the move on the machine. Its handle pulses instead.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/room/help.ts` (pure): `withHelp` (climbing and dropping), `workedExample`.
- Stage state: `help`, `helpAt`; the reset keeps them; `tuning.helpJams`.
- `src/room/hint.ts`: `HintView.level` 1–4 is the higher of the button's and the help's; `example`.
- The reducer runs `withHelp` with the idle clock (`handOver`).
- `src/ui/common/hint-text.ts`: `helpStructure`, `helpExample`.
- `src/ui/notebook/HelpNote.tsx`, its CSS, and the handle's pulse; `hr.hint.structure` and `hr.hint.example`.

### Review (one pass) and fixes

The review confirmed the timing, jam counting, reset, lock, stage changes and all six worked examples. It found these, all fixed:
1. The scene's move ghost showed only at exactly level 2, so it vanished at levels 3 and 4. `HintGhost` now shows from level 2 up; the play-through shows the ghost balloons at level 3.
2. Level 3's split line didn't bracket a side of several terms: `2x + 5 − 5 : □` instead of `(2x + 5 − 5) : □`. The line is now built as an equation and formatted as the machine writes it (with a test).
3. Climbing raised the stage's wiggle level, which wiggled every offered control once at most, or nothing. That side effect is gone. Level 1 is the tag, with the wiggles stories 1.15 and 1.16 already give, as the plan says.
4. A valid line that doesn't move him on (a weight of 1 on both sides) dropped help to none, so poking at the tray while stuck kept resetting it. Help now drops only on a line that makes progress (with a test).
5. On a phone with the notebook open, level 4's card pushed the equation and the draft out of sight. There it now shows only the example, on one line with arrows, in smaller type.
6. The level 3 label said the machine "will write" the line, which is true only with Balance `auto`. It now reads "Taj se korak zapisuje ovako:".
7. The worked example used Balance whenever the stage lists it. It now uses the hint's way: Balance only once he has earned it.

### Checks

- `npm run check` and `npm test` (2,054 passed) and the build pass.
- Headless play (`play27.mjs`, scratchpad, Playwright's fake clock), at 1280 × 800 and 640 × 360: in room 4 the levels went 1, 2, 3, 4, one per minute. At 3, the tray's tag ("Skini 5 s obje strane…") and the line with blanks. At 4, the example 2x + 5 = 11 … 2 · 3 + 5 = 11. Room 1's level 4 shows x + 4 = 7, x = 3, 3 + 4 = 7. On the phone, the handle pulses while the notebook is aside. No console errors. Screenshots looked at.
