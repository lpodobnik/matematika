# Story 2.12: Finish the style guide

Status: done

## Story

As Luka,
I want the art direction settled before the city is drawn,
so that every room and the map look like one world.

**Covers:** the GDD's Art; architecture, Asset Management; the open calls in `_bmad-output/art-bible.md`.

## Acceptance Criteria

1. **The open calls are decided and recorded** in the art bible:
   - the apprentice's colour against NFR12;
   - the standing scale against the hanging one;
   - the review's minor notes, each fixed or given a decision.
2. **The palette tokens move into `src/art/palette.ts`,** each with its use. `src/app/app.css` keeps the tokens the UI uses, and a test keeps the two in step and checks the ink's contrast on paper.
3. **One backdrop passes the overlay check** (`art-src/tools/quiet-zone.mjs`) and becomes the template for the other twelve, using at most the 2 test images left:
   - its recipe (slot wording, seed, any processing step) is written in the guide;
   - any processing step is a tool in `art-src/tools/`, unit-tested in `scripts/art-tools.test.ts`, and recorded in CREDITS;
   - a grey preview reads by value alone;
   - a mock under the live room-1 scale at both ends of the dial shows the pans, pieces and tags on plain wall.
4. **Checks:** `npm run check`, `npm test`, `npm run build`.

## Calls made (for Luka's veto)

- **The apprentice stays grey,** as NFR12 says and the naming screen already shows (2.4). The looks were made without brass or copper, so colouring the apprentice later needs no new images, only a GDD exception.
- **The standing scale stays.** The code (story 1.4) is the source, and the zones and the guide follow it.
- **The template is t22 refitted, not a new image.** t22 missed the check by one busy cell and 0.2 % ink: its ground sat about 70 units high. Resizing two horizontal bands (the wall stretched by 1.13, the ground squeezed to 0.74) puts the wall's foot at y 800, and it passes every zone. A new generation would bring back the edit endpoint's paper grain or the text endpoint's loose placement, so both remaining images stay in reserve.
- **The recipe for the other twelve rooms** is t22's Backdrop slot through text to image, then the refit to the zones, then the check. A refit fixes a wall top within about 50 units of y 200 and a foot within about 80 units of y 800 without credits; a bigger miss needs a new image.
- **One red.** The guide's `mark` (#A8343A) and the code's `jam` (#A8432F) were near twins. The First Automaton's marks use `jam`, so the game has one red.
- **The lamp keeps the code's #E0A33A.** It is the lamp the son has seen since story 1.8, and the guide follows it.

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/art/palette.ts`: every token, each with its use, plus two UI-only tokens, `sheet` (#FFFFFF, speech bubbles, cards, inputs) and `lampWash` (#F3DFB4, the met goal banner), which the UI already used as raw colours.
- `src/art/palette.test.ts`: app.css in step with palette.ts; no raw colour in any CSS under `src` but the tokens; the bible's Palette table matches token for token; the ink's contrast.
- The UI's CSS writes translucent ink as `color-mix(in srgb, var(--ink) N%, transparent)` instead of typed-out `rgb(61 75 92 / …)`.
- `art-src/tools/refit.mjs` (band refit), `grey-preview.mjs` (the grey state), `scene-mock.mjs` (a backdrop under the live room-1 scale), with tests for the first two in `scripts/art-tools.test.ts`. `fal-generate.mjs` checks the image download.
- The template `art-src/tests/backdrop-r01-door-lift.t22-refit.webp` and its two mocks; CREDITS "Derived images".
- The art bible: the palette under code names, The template backdrop (with the exact prompt), Decided in story 2.12, and the review's minor notes decided.

### Review (one pass) and fixes

The review found no blocking bugs and confirmed the refit passes, the band maths, the records, the contrast maths and the guide against the code. It found twelve issues, all fixed:

1. **No evidence of the scale mock.** The mock is now a tool (`scene-mock.mjs`), and its two outputs are saved next to the template and named in CREDITS.
2. **The recipe contradicted itself.** "Up to 150 units off" against "±30 %", and "t22's slot word for word" against a slot table that said a third of the width. The bible now gives the exact prompt, marks its two changes from t22 as untested, and makes the slot table match. A refit now has stated limits: the top within about 50 units, the foot within about 80. Round openings keep their wall band near ×1.
3. **The template has paper grain, which the guide forbids.** It is now noted as a known miss that epic 6 cleans.
4. **Two CSS files still called the colours placeholders.** Both are reworded. The skins stay "placeholder", as they are until epic 6.
5. **The UI used colours that weren't tokens.** These were `#fff`, `#f3dfb4`, ten typed-out ink `rgb()`s, `--rule` and the dev panel's paper. They are now tokens or `color-mix` of tokens, and a test fails on any raw colour in `src` CSS.
6. **The bible check only looked for each hex anywhere.** It now parses the Palette table and matches each name to its colour.
7. **The CSS check could skip tokens.** It now reads every hex-valued custom property in `:root`, in either case and with hyphens, and fails on any that isn't a token.
8. **grey-preview dropped alpha unfilled and typed its colours in.** It now flattens onto paper, converts to sRGB, imports `palette`, and its test compares against `palette`.
9. **refit took bad input quietly.** It now refuses a third edge list, values outside the image, unknown flags and an output that isn't `.webp`. A test refits a synthetic image in y and x and checks that the lines land.
10. **Stale text in the bible:** the minor notes' heading, review item 2, the date, and the story's "100 units".
11. **Map masks reached the neighbouring machine.** Machines are now at most 120 across, with masks fully on out to 120 and gone by 160, so a neighbour's mask stops 20 units short.
12. **A failed download lost its URL.** The error now names it.

### Checks

- `npm run check`, `npm test` (2,225 passed) and `npm run build` pass.
- The template passes the overlay check: pan zones 0.9 % each, opening 2.7 % (max 3), dial ground 9.0 %, no busy cells.
- Its grey preview and its mocks at x = 1 and x = 10 were looked at. The phone mock (640 × 360) was looked at too.
- The game looks as before: the story cards, the naming form and the notebook were checked in a play-through of rooms 1–7 at both sizes. No images were generated; 2 remain.
