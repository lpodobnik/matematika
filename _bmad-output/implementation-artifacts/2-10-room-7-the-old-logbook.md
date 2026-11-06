# Story 2.10: Room 7, the old logbook

Status: done

## Story

As Luka's son,
I want to find the wrong line in someone else's notebook,
so that I can explain why it's wrong, not just that it is.

**Covers:** FR21 (mistake), FR22; GDD room 7; narrative, the logbook twist; architecture, Find the mistake.

## Acceptance Criteria

1. **The room** (`content/rooms/r07-old-logbook.ts`):
   - The notebook holds `3x − 1 = 17`, `3x = 18` and the wrong line `x = 15` (`presetLines`).
   - The right lines are committed as the logbook's; the wrong one is planted, shown but never committed.
   - Slider 1–10, open from the start; ways Balance.
2. **Levelling.** At 6 the stage equation balances.
3. **Tapping a line** (`notebook/show-line`) puts it on the scale at the slider's x: `3x = 18` stays level at 6, and `x = 15` tips. The dial moving, another tap, or a written line takes it off.
4. **The mistake pin** (`wrong-line`): he flags a written line in the notebook and confirms it. The machine turns the slider to 6 and puts that line on the scale. Either way, the planted line is then found:
   - it is struck through;
   - the pans take `3x = 18`;
   - he rewrites it, `x = ☐` and the check line as blanks, judged against the lines before it.
   - A reset after the pin keeps it found.
5. **Tags.**
   - Tapping lines: "Dodirni redak – vaga će ga pokazati.", until he taps one.
   - The mistake pin: "Koji je redak pogrešan? Stavi zastavicu na njega."
   - The rewrite: "Prekriženi redak nije točan. Napiši ga ispravno." Its handover is `rewrite`.
6. **Finishing it** tells Kristijan's planted signal on the story card (2.5), shows the "Traženje pogreške" card (2.6), and earns the gear chain (2.3). On the map the logbook opens.
7. **Checks.**
   - Pure tests (the opening, tapping, the pin right and wrong, the reset, the notebook's view) and render tests.
   - Content tests, line-table rows (both logbook lines, the rewrite, the check, and wrong lines including `x = 15`).
   - The play-through now runs rooms 1–7.
   - A headless play-through at 1280 × 800 and 640 × 360 with real taps on the lines, the flag and the confirm. Screenshots looked at.

## Calls made (for Luka's veto)

- **Slider 1–10, not 0–10:** at 0, `3x − 1` would weigh −1 on the readout.
- **The planted line is never committed,** so the checker, saving and resuming never see a wrong line among the committed ones. A reload rebuilds it from the room.
- **A wrong pin still finds the mistake.** As with every pin, a wrong one earns nothing, and the machine then shows him the right answer, here by striking the planted line, so he goes on to the rewrite.
- **The pin and its question live in the notebook,** on the lines, not in the scene. On a phone the notebook stays out while the pin is offered, rather than sliding aside as it does for scene pins.
- **The tap's tag and the pin's question** share the notebook's tag spot: first the tap, then, once he has tapped a line, the question.
- **Balance `auto`, not the GDD's `blanks`,** as in room 6: Balance `blanks` isn't built, and the rewrite needs no Balance move. Once the mistake is found, the tray and splitter are there too, so he may also finish with Balance from `3x = 18`.
- **The slider is open from the start** (`pokeNotches: 'all'`). The content test that stops a poke window giving the answer away skips a mistake pin, which is about a line, not x.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/room/logbook.ts` (pure): `logbookOpening`, `showLine`, `shownPans`, `foundMistake`, `logbookView`.
- Stage state: `planted`, `shownLine`, `linesTapped`; `source: 'logbook'`.
- The pin: the `line` track, its test and resolution (`pin.ts`).
- The scale shows the tapped line (`scale.ts`); the dial and a committed line take it off.
- The `notebook/show-line` action; the `rewrite` handover; the reset keeps a found mistake.
- `src/ui/notebook/LogbookLine.tsx`; the notebook's logbook lines, flag, confirm and tags. The scene's pin and confirm stay out for a line pin.
- `src/content/rooms/r07-old-logbook.ts`; the map's logbook glyph; `hr.logbook`, the pin question, the rewrite tag.

### Review (one pass) and fixes

The review confirmed saving and reloading at every point (before the pin, with it placed, after a wrong or right pin, after the answer), the reset, tapping while jammed or locked, the rewrite's jam, and the map's gates after room 7. It found:
1. After the rewrite, the notebook drew his own lines as the logbook's and put the struck line under them. His `x = 6` also shared the planted line's number. Now the logbook's lines come first, then the struck line, then his own lines, drawn as his. Only the logbook's lines and the planted one can be tapped, and the planted one's number wins (with tests).
2. Right after the pin, the scale showed the pinned line while the tray and splitter acted on `3x = 18` underneath. A tray drop, a take-off and a split now take a tapped line off the scale first (with a test).
3. While he chose the wrong line, the hint button and the help ladder showed nothing: the hint went to the scene pin, which isn't drawn for a line pin. A line pin's hint now hangs at the notebook with the pin's question (with a test). Not done: the level 1 wiggle on the flags, and a level 4 example that shows putting a line on the scale rather than solving.
4. The rewrite's tag, "Ovaj redak…", could read as his own empty line. It now reads "Prekriženi redak nije točan. Napiši ga ispravno."

Left as they are, noted for Luka:
- The struck line and the blanks appear as he confirms, before the scene's test has played.
- There's no mark of whether his pin was right, apart from the parts counter.
- The scene still keeps room for a pin that isn't drawn.

### Checks

- `npm run check` and `npm test` (2,199 passed) and the build pass.
- Headless play (`play210.mjs`, scratchpad), at 1280 × 800 and 640 × 360:
  - from a save with rooms 1–6 done, the launch opens room 7;
  - the tap's tag; the slider to 6; "3x = 18" tapped (level) and "x = 15" tapped (tips, 6 against 15);
  - the flag on "x = 15" and "Potvrdi";
  - the struck line, `x = ☐` and the check line with the rewrite's tag; 6 and 6;
  - the story card, then the map.
  - No console errors. Screenshots looked at.
