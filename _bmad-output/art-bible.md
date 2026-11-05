---
title: 'Art Bible'
project: 'matematika (working title)'
date: '2026-11-05'
status: 'draft for the epic 2 style-guide story; every call is open to Luka''s veto'
sources: 'GDD Art and Audio Direction, World and Story; narrative-design.md; architecture Asset Management'
---

# Art Bible

The rules that keep AI-generated images consistent with each other and with the parts drawn in code. The evidence is in `art-src/tests/`, with every prompt and seed in `art-src/CREDITS.md`.

## The look: a living blueprint

An inventor's ink drawing come to life: fine blue-grey pen lines on warm cream paper, light hatching for shade, and loose, flat watercolour washes inside the lines. Shapes are slightly simplified and a little whimsical (Machinarium's mood, not its detail), and every mechanism is exposed. A stopped thing is grey ink on paper; a restarted thing is the same drawing in colour, with brass and copper the most saturated colours on the page.

**Image or code** (architecture). Images carry the map, room backdrops, machine housings, automatons and looks. Code draws anything that moves or shows a number (pans, pieces, gears, dial, chain, drum, dice, pins) and every effect (light, water flow, steam, glow). Anything that moves on restart, like the door or the water wheel, is a separate image layer on the same canvas, never part of the backdrop.

## Palette

`paper`, `table` and `ink` keep the placeholder values in `src/art/palette.ts` and `app.css`.

| Token | Hex | Use |
|---|---|---|
| `paper` / `paperShade` / `table` | `#F4EFE3` / `#E8E0CE` / `#D9D2C1` | Image ground and grey-state lights / aged edges / the desk round the page |
| `ink` | `#3D4B5C` | Every outline, the grey-state darks, numbers on weights (7.8 : 1 on `paper`) |
| `inkSoft` / `inkFaint` / `inkDeep` | `#6B7A8C` / `#A7B2BE` / `#26303B` | Interior lines and hatching / construction lines and unreached things / small darkest accents |
| `brass` (light, dark) | `#B8893A` (`#E2C07A`, `#7A5A22`) | Restored machine metal: highlight streak, shade side |
| `copper` (dark) / `verdigris` | `#B5603A` (`#7A3A22`) / `#5E9C8F` | Pipes and valves / patina, lens tint |
| `iron` / `wood` / `stone` | `#59616B` / `#8A6A4A` / `#D8CFBF` | Frames and automatons / doors and buckets / walls, very light |
| `roof` / `water` | `#B9654A` / `#7FA7B5` | Terracotta roofs, muted / still water, pale |
| `lamp` / `mark` | `#F2B544` / `#A8343A` | Code only: lamp light and restart glow / the First Automaton's marks, its only red, never the only signal |

Buildings, stone and water stay muted; full-strength brass and copper belong to machines, so the eye goes to the mechanism.

## Line, ink and lighting

- One ink colour, `ink`, for all outlines in images and code, never black. At shipped size (1 texture px per scene unit), outer contours are 4 units on code-drawn parts and 3–4 px on housings, automatons and looks. Backdrops get 1.5–2 px with `inkSoft` detail, so machines stand in front.
- Shade is parallel hatching at 45°, falling down and right, under the wash, with no airbrushed gradients. Code-drawn parts copy this: an `ink` stroke, a flat material fill (brass may use a texture) and hatching on the shade side.
- One soft daylight from the upper left, the same everywhere, with no night, weather or drama. Backdrops have short soft shadows under overhangs only. Cut-outs have no cast shadow; the code adds a contact shadow. Changing light, such as lamps and glow, is an effect in code.

## Camera and perspective

- **Map:** axonometric bird's-eye view, parallel projection, about 50° down from the south, north up. Machines are two or three times house size. The 19 nodes each sit on their own open plot, at least 160 scene units apart, so a soft round mask about 70 units across restores one node and nothing else. Bare paper runs at least 60 units round the edges. Node markers and routes are drawn in code.
- **Backdrop:** frontal elevation at standing eye level with very weak perspective, like a flat theatre backdrop. Ground fills the bottom fifth; the sky is bare paper. The **quiet zone**, x 320–1280 and y 160–800 of the 1600 × 1000 scene, is plain wall for the housing and scale, and the housing's plinth stands on the ground below it. Detail sits at the sides and top.
- **Housing:** frontal, symmetrical, no perspective, on the full 1600 × 1000 canvas at the backdrop's scale, so it lines up with no offset.
- **Automatons and looks:** full figure, three-quarter view at mid-height, little perspective. Facing is set in code by mirroring (the apprentice faces right, automatons left), so prompts leave it out.

## Restored colour against the grey state

The grey state is a shader: each pixel's luminance is mapped onto the `ink` → `paper` ramp, and the restart animates the amount from 1 to 0. A local preview on t09 and t21 shows what the colour image needs:

- **Forms read by value alone.** Grey brass is nearly paper-light, so every metal part needs an ink outline and hatched shade.
- **Ground at `paper`,** so the page doesn't shift as the shader runs. **No large dark masses,** which turn into blocks of ink.
- **Paint the machine at rest, never in action.** No flames, lamp light, flowing water, steam or motion. Colour returns through the shader and action through code.
- On the map the amount is set per node through the masks, so each machine sits wholly inside its plot. A beaten automaton can grey out the same way as it winds down.

## Materials

**Brass:** `brass` wash, a hard `brassLight` streak on the lit edge, `brassDark` hatching, always outlined. **Copper:** pipes and valves, with `verdigris` on old pieces. **Iron:** `iron` wash with hatching; rivets as small ink circles. **Wood:** `wood` wash with `inkSoft` grain and iron straps. **Stone:** nearly bare paper, a light `stone` wash and `inkSoft` joints. **Glass:** almost no wash, two highlight arcs, a faint `verdigris` tint. **Punched tape:** paper with a row of punched dots, never writing. **Water:** still, a pale `water` wash with a few level lines.

## Housings frame the code-drawn scale

- A housing is the machine's frame (columns, crossbeam, plinth) round one empty opening. The code draws the beam, pans, pieces, gears and dial inside it, so the opening holds nothing that could contradict the code.
- Its footprint stays within x 320–1280, the width of the backdrop's quiet zone. The test housing t07 is too wide and covers the backdrop's door and crank.
- Mount points are recorded in the skin as coordinates. The beam pivot hangs from a bracket at top centre (x 800, about y 230). The dial runs in a plinth slot (about y 860–940). The pans swing within x 420–1180 and y 300–780. These are art targets; the scale's layout in code wins, and this list follows it.
- Moving parts (`part-r01-door`) are separate files on the same canvas.
- Cut-outs need alpha, which FLUX.2 can't produce. Generate on plain paper, then remove the background as a step of its own and record it in CREDITS. This step is untested so far.

## Automatons: one family in four sizes

Kristijan's helpers under the First Automaton's orders: curious, literal and a little absurd, never scary, and redeemable. **They share:** a dark cast-iron body with riveted brass bands and copper pipes; one round glass lens in a brass bezel as the whole face, with no mouth or teeth; a big brass wind-up key on the back (they wind down and rewind); a chest slot with blank punched tape (their notices); tools, never weapons. **Armour shows as brass bands and plates,** so toughness reads in grey too. The First Automaton's mark is drawn in code. Each image fills its frame, and the code sets the size.

| Armour | Height vs the apprentice | Body | Legs | Arms | Plates |
|---|---|---|---|---|---|
| 20 | Knee, 0.4× | Squat round pot, like a teapot | 3 thin | 1, pincers holding a cog | 1 band |
| 30 | Waist, 0.6× | Barrel on its side | 4, like a dog | 2 pincers | 2 bands, shoulder plate |
| 45 | Head, 1.0× | Upright boiler, small domed head | 2 sturdy | Wrench and pincers | 3 bands, shoulder plates |
| 60 | 2× | Round furnace, low domed head | 4 thick | Crane claw and magnet | Overlapping plates, chimney |

## The apprentice: six looks

About 11, in period work clothes, holding the notebook against the chest. One template and one seed for every look keep pose, proportions and scale identical (t14–t19). Faces are picture-book simple: dot eyes, no eyelashes, a calm half-smile, with the head about a sixth of the height, never chibi. **No look is gendered by default:** no skirts, bows or make-up, hair from cropped to chin length, and skin and hair varied across the set.

| Look | Skin, hair | Clothes |
|---|---|---|
| 1 | Light olive; short straight dark brown | Flat cap with brass goggles, canvas apron, striped shirt |
| 2 | Dark brown; short black curls, round glasses | Blue-grey overalls with a patched knee, tool belt |
| 3 | Fair, freckled; shaggy chin-length auburn | Mustard many-pocket waistcoat, green scarf, corduroys |
| 4 | Medium brown; short black twists | Leather aviator cap with goggles, patched grey jumper, satchel |
| 5 | Pale; black bowl cut | High-collared slate-blue smock, copper buttons, fingerless gloves |
| 6 | Deep brown; cropped black | Oversized rust work jacket, red neckerchief, wrench in pocket |

Townspeople, if they get images, use the same template; Penkala keeps a pencil behind his ear.

## Never in an image

Text, letters, numbers or digits (numbers are drawn in code), including clock faces, marked dials, signs, plaques and map labels. Signatures, initials, dates, watermarks, logos and real flags. Wires, bulbs, antennas, cars. People or animals in backdrops and on the map. Flames, light, flowing water, steam, smoke. Anything the code draws. Weapons, scary faces, and anything from Luka and his son's table game. Borders, margin lines, paper grain, and shadows on cut-outs.

## Image sizes and file names

`scripts/build-art.ts` writes @2x at 1 texture px per scene unit and @1x at half that. [ASSUMPTION: beside the notebook, the 1600 × 1000 scene shows at about half size on the tablet, at a device pixel ratio near 2; check in epic 6.]

| Asset | Source in `art-src/` | Generate at | Shipped @2x | Alpha |
|---|---|---|---|---|
| Map | `map-donji-kotac.png` | 1920 × 1200 | 1600 × 1000 | No |
| Backdrop | `backdrop-r01-door-lift.png` | 1920 × 1200 | 1600 × 1000 | No |
| Housing, moving part | `housing-r01-door-lift.png`, `part-r01-door.png` | 1920 × 1200 | Trimmed; the manifest keeps the offset | Yes |
| Automaton | `automaton-45.png` | 1440 × 1440 | Its display height | Yes |
| Look | `look-3.png` | 1024 × 1536 | Its display height | Yes |

Names are kebab-case and follow the room files (`r01-door-lift.ts`) and lair ids (`lair-45` → `automaton-45`). Test images are `art-src/tests/<name>.tNN.webp`, where `NN` is the CREDITS number. `build-art.ts` skips `art-src/tests/` and `art-src/tools/`.

## Prompt template

**Model:** FLUX.2 [max] on fal.ai, which takes a seed and reference images. Use `fal-ai/flux-2-max` (text to image) for every new image, and `fal-ai/flux-2-max/edit` only to change an existing image of the same subject. `art-src/tools/fal-generate.mjs` assembles the prompt, reads `FAL_KEY` from the environment, converts to WebP, writes the CREDITS entry and stops at the 30-image cap.

**Order:** `[SUBJECT] [CAMERA] [COMPOSITION] [STATE] [STYLE BLOCK] [BACKGROUND, cut-outs only]`. The subject goes first, because FLUX.2 weighs early words most.

**Style block v4**, fixed; any change gets a new version in the script:

```text
Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
```

**Slots**, with the full tested wording in CREDITS:

| Asset | Camera and composition | State |
|---|---|---|
| Backdrop | Frontal elevation, flat theatre backdrop; the middle is "plain quiet wall … because a machine will be placed in front of it later"; sky bare paper | No people, animals, vehicles, flames, flowing water or steam |
| Housing | Frontal, symmetrical; a frame round one empty opening with nothing in it | At rest |
| Automaton, look | Three-quarter view, drawn large and centred | At rest, no glow or motion lines |
| Map | Bird's-eye, parallel projection; each machine on its own plot; edges fade to paper | No people, smoke or moving water |

Cut-outs end with "Isolated on plain flat cream paper with no ground, no scenery and no shadow." Seeds are fixed per family: backdrops `1101`, `1201` … by room, map `2101`, housings `3101`, automatons `4201`–`4601`, looks `5000`.

**Words that misfire:** "clockwork" draws numbered clock faces; "sketchbook page" invites signatures and margins; "butterfly-shaped key" draws a butterfly; "could be a boy or a girl" draws a girl; "knee-high" shrinks the figure (say "drawn large"); left and right are unreliable; never ask for signs or plaques.

**Review every image:** check all four corners for signatures and small signs, tape and dials for glyphs, then that nothing is in action, the quiet zone is quiet and a grey preview reads.

## Test images

21 of the 30 allowed images were made, so 9 remain for review fixes. Best of each kind: backdrop t21, housing t07, automatons t09, t11 and t12, looks t14–t19, map t20 (concept only).

**What worked.** The ink-and-wash look holds across every asset type and greys convincingly. The fixed style block alone carries consistency: t21, made from text with no reference, matches t01 and t04 on smoother paper. One seed and template gives six looks with the same pose and scale. Writing the automatons' shared design into each prompt (t11, t12) matched the family as well as a reference did (t10), without its side effects. Every backdrop kept a clean quiet zone.

**What didn't.** Signatures appeared in t01–t03, some with digits, and a signed reference spreads its signature. The edit endpoint adds paper grain (t03–t07, t10) and, given an unrelated reference, ignores the subject (t08, a clock-faced robot). The maps let in people, a car, smoke and a clock face (t02), plus glyphs on tiny signs and no margins (t20). t07 is too wide, nothing has alpha yet, and small misses remain, such as lit lamp glass, bulbs, a margin line and ground shadows.

**Changes that improved consistency.** v3 replaced "a page from a sketchbook" with "unsigned game art" and asked for hot-pressed paper. It also named the modern objects, which removed the signature and the antenna (t03 → t06, same seed); naming the signature alone, in v2, had not. v4 replaced "clockwork" with "gear-driven" and added "no clock faces", and no numerals appeared from t09 on. New subjects now use text to image rather than a reference. Characters got a picture-book face, no "boy or girl" line and one shared seed (t13 → t14).

**Still to do (epic 6):** a map on 19 spaced plots with margins, a narrower door-lift housing with `part-r01-door` as its own layer, background removal for cut-outs, and the other nine backdrops from this template.
