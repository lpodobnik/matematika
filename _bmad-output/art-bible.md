---
title: 'Art Bible'
project: 'matematika (working title)'
date: '2026-11-06'
status: 'settled in story 2.12 (see Decided in story 2.12); reviewed once (see Review); every call is open to Luka''s veto'
sources: 'GDD Art and Audio Direction, World and Story; narrative-design.md; architecture Asset Management; src/ui/scene/scale/layout.ts'
---

# Art Bible

The rules that keep AI-generated images consistent with each other and with the parts drawn in code. The evidence is in `art-src/tests/`, with every prompt and seed in `art-src/CREDITS.md`.

## The look: a living blueprint

An inventor's ink drawing come to life: fine blue-grey pen lines on warm cream paper, light hatching for shade, and loose, flat watercolour washes inside the lines. Shapes are slightly simplified and a little whimsical (Machinarium's mood, not its detail), and every mechanism is exposed. A stopped thing is grey ink on paper; a restarted thing is the same drawing in colour, with brass and copper the most saturated colours on the page. Only restarted machines are ever shown in colour (NFR12; see Display state).

**Image or code** (architecture, Asset Management, which this follows). Images carry the map, room backdrops, machine housings, automatons and looks, and no image contains anything that moves. Code draws anything that moves or shows a number: the pans, pieces, gears, dial, chain, drum, dice and pins, and each room's moving part, such as the door, the sluice gate or the water wheel. It also draws every effect (light, water flow, steam, glow). A code-drawn part may be filled with a material texture such as brass or wood. The earlier draft made moving parts a separate image layer; the architecture has no such exception, so that is dropped.

## Palette

The tokens live in `src/art/palette.ts`, under these names; the ones the UI uses are also custom properties in `src/app/app.css`. `src/art/palette.test.ts` keeps the two in step, checks that every token's colour is in this table, and checks the ink's contrast.

| Token | Hex | Use |
|---|---|---|
| `paper` / `paperShade` / `table` | `#F4EFE3` / `#E8E0CE` / `#D9D2C1` | Image ground and grey-state lights / aged edges / the desk round the page |
| `ink` | `#3D4B5C` | Every outline, the grey-state darks, numbers on weights (7.8 : 1 on `paper`, 6.8 : 1 on `paperShade`) |
| `inkSoft` / `inkFaint` / `inkDeep` | `#6B7A8C` / `#A7B2BE` / `#26303B` | Interior lines and hatching / construction lines and unreached things / small darkest accents |
| `brass` (`brassLight`, `brassDark`) | `#B8893A` (`#E2C07A`, `#7A5A22`) | Restored machine metal: highlight streak, shade side |
| `copper` (`copperDark`) / `verdigris` | `#B5603A` (`#7A3A22`) / `#5E9C8F` | Pipes and valves / patina, lens tint |
| `iron` / `wood` / `stone` | `#59616B` / `#8A6A4A` / `#D8CFBF` | Frames and automatons / doors and buckets / walls, very light |
| `roof` / `water` | `#B9654A` / `#7FA7B5` | Terracotta roofs, muted / still water, pale |
| `lamp` / `jam` | `#E0A33A` / `#A8432F` | Code only: lamp light and restart glow / the game's one red: a jammed machine, a wrong line and the First Automaton's marks, never the only signal (NFR4) |
| `sheet` / `lampWash` | `#FFFFFF` / `#F3DFB4` | UI only, never in an image: a sheet laid on the page (speech, explanation cards, an input) / a lit lamp's light on paper (the goal banner once the goal is met) |

The UI's CSS writes every colour through these tokens: a translucent ink is `color-mix(in srgb, var(--ink) 18%, transparent)`, never a typed-out `rgb()`.

Buildings, stone and water stay muted; full-strength brass and copper belong to machines, so the eye goes to the mechanism.

## Line, ink and lighting

- One ink colour, `ink`, for all outlines in images and code, never black. At shipped size (1 texture px per scene unit), outer contours are 4 units on code-drawn parts and 3–4 px on housings, automatons and looks. Backdrops get 1.5–2 px with `inkSoft` detail, so machines stand in front.
- Shade is parallel hatching at 45°, falling down and right, under the wash, with no airbrushed gradients. Code-drawn parts copy this: an `ink` stroke, a flat material fill (brass may use a texture) and hatching on the shade side.
- One soft daylight from the upper left, the same everywhere, with no night, weather or drama. Backdrops have short soft shadows under overhangs only. Cut-outs have no cast shadow; the code adds a contact shadow. Changing light, such as lamps and glow, is an effect in code.

## Camera and perspective

- **Map:** axonometric bird's-eye view, parallel projection, about 50° down from the south, north up. Machines are two or three times house size and at most 120 units across. The 19 nodes each sit on their own open plot, at least 160 scene units apart, so a soft round mask centred on the node, fully on out to 120 units across and fading out by 160, restores one machine; a neighbour's mask stops at least 20 units short of it. Bare paper runs at least 60 units round the edges. Node markers and routes are drawn in code.
- **Backdrop:** frontal elevation at standing eye level with very weak perspective, like a flat theatre backdrop. The scale in code spans almost the whole width, so a backdrop is a plain wall between a top band and the ground, with the room's opening in the middle (Scene zones).
- **Housing:** frontal, symmetrical, no perspective, on the full 1600 × 1000 canvas at the backdrop's scale, so it lines up with no offset.
- **Automatons and looks:** full figure, three-quarter view at mid-height, little perspective. Facing is set in code by mirroring (the apprentice faces right, automatons left), so prompts leave it out.

## Scene zones

In scene units of the 1600 × 1000 scene, from `src/art/scene-zones.ts`. On the tablet the pans and pieces of every GDD room sweep x 65–1535 and y 243–739, and the zones add a margin round that. `src/art/scene-zones.test.ts` fails when the scale in code leaves them; then the zones and this guide change together. These zones are for one machine; rooms with linked machines (r12, and friends' rooms with up to three) need their own layout, set in epic 4.

| Zone | Where | What goes there |
|---|---|---|
| Top band | y 0–200, the top fifth | The top of the wall, house fronts and roofs with plain chimneys, a bare-paper sky. The only place for backdrop detail above the ground |
| Pan zones | x 40–560 and 1040–1560, y 200–760 | Plain wall: the pans and their pieces swing over all of it. No object, window, door, post, lamp, pipe, chain, plant or water |
| Bay | x 560–1040, y 80–850 | The housing's footprint (see Housings) |
| Opening | x 600–1000, y 200–760 | Empty in every image. The code draws the stand and the room's moving part here; the backdrop shows the room's opening (a doorway, a gate channel, a wheel pit) with nothing in it |
| Ground | y 800–1000, the bottom fifth | The wall's foot at y 800, never above 760. Paving, with plain flagstones under the dial (x 300–1300, y 860–1000). The stand's foot stands on it |
| Outer strips | x 0–40 and 1560–1600 | The edge of a building at most |

## Restored colour against the grey state

The grey state is a shader: each pixel's luminance is mapped onto the `ink` → `paper` ramp, and the restart animates the amount from 1 to 0. A local preview on t09 and t21 shows what the colour image needs:

- **Forms read by value alone.** Grey brass is nearly paper-light, so every metal part needs an ink outline and hatched shade.
- **Ground at `paper`,** so the page doesn't shift as the shader runs. **No large dark masses,** which turn into blocks of ink.
- **Paint the machine at rest, never in action.** No flames, lamp light, flowing water, steam or motion. Colour returns through the shader and action through code.
- On the map the amount is set per node through the masks, so each machine sits wholly inside its plot.

**Display state.** Every image is still made in its restored colours (architecture); what differs is the amount it is shown at.

| Asset | Shown | Changes |
|---|---|---|
| Map | Grey, through each node's mask | A node's plot restores when its room's machine restarts |
| Backdrop and housing | Grey (amount 1) | Both turn to colour in the restart of the room's last stage, and stay restored on later visits |
| Code-drawn machine parts: the scale, pieces, dial, chain, drum and the room's moving part | Ink on paper: `ink` strokes with `paper` and `inkFaint` fills | Their materials (brass, copper, wood) arrive in the same restart. A stage that locks before the last restarts only its own part, such as one lamp (story 1.8) |
| Automatons | Grey (1), always | Never in the MVP: they are machines he hasn't restarted. A beaten one winds down (its motion stops) and does not change colour |
| Apprentice and townspeople | Grey (1), always | Never: they are not machines, and NFR12 keeps colour for restarted machines |
| Effects: lamp light, restart glow, water, steam | Code | Only on a restarted machine or part |

**Decided (story 2.12, for Luka's veto): the apprentice stays grey,** as NFR12 says and the naming screen shows (story 2.4), so the look picker reads by shape and value. If the apprentice (and townspeople) should be in colour, that is an exception to NFR12 to write into the GDD. The looks below carry no brass or copper, so the exception would need no new images.

## Materials

**Brass:** `brass` wash, a hard `brassLight` streak on the lit edge, `brassDark` hatching, always outlined. **Copper:** pipes and valves, with `verdigris` on old pieces. **Iron:** `iron` wash with hatching; rivets as small ink circles. **Wood:** `wood` wash with `inkSoft` grain and iron straps. **Stone:** nearly bare paper, a light `stone` wash and `inkSoft` joints. **Glass:** almost no wash, two highlight arcs, a faint `verdigris` tint. **Punched tape:** paper with a row of punched dots, never writing. **Water:** still, a pale `water` wash with a few level lines.

## Housings frame the code-drawn scale

- A housing is the machine's fixed frame round the bay between the pans: two columns, a crossbeam with empty brackets where code-drawn pulleys or axles mount, and small feet on the ground. It has no plinth across the middle, because the stand's foot and the dial take the ground there. Everything inside is drawn in code (the stand, beam, pans, pieces, dial and the room's moving part), so the housing holds nothing that could contradict it.
- Its footprint is the bay, x 560–1040 and y 80–850: columns at x 560–600 and 1000–1040, a crossbeam at y 80–160 (which may overhang into the top band) and feet that end at y 850. The opening between the columns, x 600–1000, is empty, and nothing reaches the pan zones or the dial ground. t07 was drawn for an earlier, hanging scale and frames the wrong mechanism.
- **Mount points**, from `scaleGeometry` in `src/ui/scene/scale/layout.ts`, which wins:
  - the pivot at (800, 600), on a stand whose post runs down to the floor at y 820; the stand's foot is x 640–960, y 820–846;
  - the beam, 1000 long, tips up to ±15°, so its ends stay between y 471 and 729;
  - the pans are 470 wide on 40-unit posts: x 65–535 and 1065–1535 when level, centred at about (317, 431) and (1283, 689) at full tilt;
  - pieces stack up to about 190 above a pan on the tablet;
  - the dial runs below the foot, at about x 300–1300 and y 860–1000 (story 1.5 sets it);
  - the room's moving part sits in the opening, behind the stand.
- Cut-outs need alpha, which FLUX.2 can't produce. Generate on plain paper, then remove the background as a step of its own and record it in CREDITS. This step is untested so far.

## Automatons: one family in four sizes

Kristijan's helpers under the First Automaton's orders: curious, literal and a little absurd, never scary, and redeemable. **They share:** a cast-iron body, dark iron in a mid-value wash and never a solid dark mass, with riveted brass bands and copper pipes; one round glass lens in a brass bezel as the whole face, with no mouth or teeth; a big brass wind-up key on the back (they wind down and rewind); a chest slot with blank punched tape (their notices); tools, never weapons. **Armour shows as brass bands and plates,** so toughness reads in grey too, which is how automatons are always shown (Display state). The First Automaton's mark is drawn in code. Each image fills its frame, and the code sets the size.

| Armour | Height vs the apprentice | Body | Legs | Arms | Plates |
|---|---|---|---|---|---|
| 20 | Knee, 0.4× | Squat round pot, like a teapot | 3 thin | 1, pincers holding a cog | 1 band |
| 30 | Waist, 0.6× | Barrel on its side | 4, like a dog | 2 pincers | 2 bands, shoulder plate |
| 45 | Head, 1.0× | Upright boiler, small domed head | 2 sturdy | Wrench and pincers | 3 bands, shoulder plates |
| 60 | 2× | Round furnace, low domed head | 4 thick | Crane claw and magnet | Overlapping plates, chimney |

## The apprentice: six looks

About 11, in period work clothes, holding the notebook against the chest. One template and one seed for every look keep pose, proportions and scale identical (t14–t19). Faces are picture-book simple: dot eyes, no eyelashes, a calm half-smile, with the head about a sixth of the height, never chibi. **No look is gendered by default:** no skirts, bows or make-up, hair from cropped to chin length, and skin and hair varied across the set. **No brass or copper on clothes,** which keep those for machines (Display state); t14 still shows brass goggles and t18 copper buttons.

| Look | Skin, hair | Clothes |
|---|---|---|
| 1 | Light olive; short straight dark brown | Flat cap with leather goggles, canvas apron, striped shirt |
| 2 | Dark brown; short black curls, round glasses | Blue-grey overalls with a patched knee, tool belt |
| 3 | Fair, freckled; shaggy chin-length auburn | Mustard many-pocket waistcoat, green scarf, corduroys |
| 4 | Medium brown; short black twists | Leather aviator cap with goggles, patched grey jumper, satchel |
| 5 | Pale; black bowl cut | High-collared slate-blue smock, horn buttons, fingerless gloves |
| 6 | Deep brown; cropped black | Oversized rust work jacket, red neckerchief, wrench in pocket |

Townspeople, if they get images, use the same template; Penkala keeps a pencil behind his ear.

## Never in an image

Text, letters, numbers or digits (numbers are drawn in code), including clock faces, marked dials, signs, plaques and map labels. Signatures, initials, dates, watermarks, logos and real flags. Wires, bulbs, antennas, cars. People or animals in backdrops and on the map. Flames, light, flowing water, steam, smoke. Anything the code draws, including each room's moving part (door, gate, wheel). Weapons, scary faces, and anything from Luka and his son's table game. Borders, margin lines, paper grain, and shadows on cut-outs. (The template backdrop's faint paper fibres, from t22, are a known miss: epic 6 cleans the paper of every image it ships.)

## Image sizes and file names

`scripts/build-art.ts` writes @2x at 1 texture px per scene unit and @1x at half that. [ASSUMPTION: beside the notebook, the 1600 × 1000 scene shows at about half size on the tablet, at a device pixel ratio near 2; check in epic 6.]

| Asset | Source in `art-src/` | Generate at | Shipped @2x | Alpha |
|---|---|---|---|---|
| Map | `map-donji-kotac.png` | 1920 × 1200 | 1600 × 1000 | No |
| Backdrop | `backdrop-r01-door-lift.png` | 1920 × 1200 | 1600 × 1000 | No |
| Housing | `housing-r01-door-lift.png` | 1920 × 1200 | Trimmed; the manifest keeps the offset | Yes |
| Automaton | `automaton-45.png` | 1440 × 1440 | Its display height | Yes |
| Look | `look-3.png` | 1024 × 1536 | Its display height | Yes |

Names are kebab-case and follow the room files (`r01-door-lift.ts`) and lair ids (`lair-45` → `automaton-45`). Test images are `art-src/tests/<name>.tNN.webp`, where `NN` is the CREDITS number, and layout guides are `art-src/tests/<kind>-layout-guide.png`. `build-art.ts` skips `art-src/tests/` and `art-src/tools/`.

## Prompt template

**Model:** FLUX.2 [max] on fal.ai, which takes a seed and reference images. Use `fal-ai/flux-2-max` (text to image) for every new image. Use `fal-ai/flux-2-max/edit` only to change an existing image of the same subject, or to follow a layout guide (below). `art-src/tools/fal-generate.mjs` assembles the prompt, reads `FAL_KEY` from the environment, converts to WebP, writes the CREDITS entry and stops at the 30-image cap. `art-src/tools/quiet-zone.mjs` runs the overlay check.

**Order:** `[SUBJECT] [CAMERA] [COMPOSITION] [STATE] [STYLE BLOCK] [BACKGROUND, cut-outs only]`. The subject goes first, because FLUX.2 weighs early words most.

**Style block v4**, fixed; any change gets a new version in the script. A job that names no block gets the newest one, and CREDITS records the block used:

```text
Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
```

**Slots**, with the full tested wording in CREDITS (t22 to t28 for backdrops and housings):

| Asset | Camera and composition | State |
|---|---|---|
| Backdrop | Frontal elevation, flat theatre backdrop. The wall runs straight across; its top is "a simple stone coping a sixth of the way down", with roofs "and plain chimneys" only above it. "The foot of the wall is four fifths of the way down: the … ground is a strip along the bottom fifth only, with large plain flagstones in the middle." The room's opening is centred, a quarter of the width between its jambs, with the jambs outside that quarter, and empty (the full wording is under The template backdrop). "To the left and to the right of the gateway, from the gateway out to both edges of the picture … completely plain … nothing standing in front of it, because the game draws its moving machine parts there later." Sky bare paper | The room's moving part is left out: "Its door has been taken out … through it the passage is plain pale paper." No people, animals, vehicles, flames, flowing water, water above the ground line, smoke or steam |
| Housing | Frontal, symmetrical: two slim columns, a crossbeam with empty brackets for parts drawn in code, small feet. Follow the housing layout guide, because words alone placed the columns 30–140 units off (t23, t25) | At rest. "The opening … holds nothing … only plain flat cream paper"; no ground, ground line or shadow |
| Automaton, look | Three-quarter view, drawn large and centred | At rest, no glow or motion lines |
| Map | Bird's-eye, parallel projection; each machine on its own plot; edges fade to paper | No people, smoke or moving water |

Cut-outs end with "Isolated on plain flat cream paper with no ground, no scenery and no shadow." Seeds are fixed per family: backdrops `1101`, `1201` … by room, map `2101`, housings `3101`, automatons `4201`–`4601`, looks `5000`.

**Layout guides.** When placement has to be exact, draw the zones' shapes flat at 1920 × 1200 (scene units × 1.2) and send them to the edit endpoint with a reference line that says to keep every shape where it is and its size, and not to keep the flat fills (t27, t28). It placed the housing within about 7 units. On the backdrop it held the top band but not the ground line, and it turned the empty passage into a dark reveal. It also brings the edit endpoint's paper grain, which background removal takes out of cut-outs but not out of backdrops.

**Words that misfire:** "clockwork" draws numbered clock faces; "sketchbook page" invites signatures and margins; "butterfly-shaped key" draws a butterfly; "could be a boy or a girl" draws a girl; "knee-high" shrinks the figure (say "drawn large"); left and right are unreliable; never ask for signs or plaques. Fractions of the picture place things only roughly: in t22, t24 and t26 the wall top landed at y 195, 350 and 250 and the ground line at 730, 745 and 805, and "a quarter of the width apart" put the housing's columns too close (t23) while "wide" put them too far apart (t25). Naming empty regions ("the outer thirds are empty paper") works better than placing objects. Roofs grew antennas in t24 despite the style block, so the slot asks for plain chimneys.

**Review every image:** run `node art-src/tools/quiet-zone.mjs <backdrop|housing> <out-dir> <image>`, which must pass. It overlays the scene zones on the image, marks every 40 × 40 cell that holds an object, and fails a zone that holds more than stray marks. Then look at its overlay, check all four corners for signatures and small signs, tape and dials for glyphs, and that nothing is in action. Last, `node art-src/tools/grey-preview.mjs <out-dir> <image>` shows it in the grey state (luminance on the `ink` → `paper` ramp, as the shader does); forms must read by value alone.

## The template backdrop

`art-src/tests/backdrop-r01-door-lift.t22-refit.webp` is the template for the other twelve backdrops (story 2.12). It is t22, refitted to the zones: it passes the overlay check, reads in grey, and under the live room-1 scale at both ends of the dial the pans, pieces and tags sit on plain wall and the stand in the gateway.

**The recipe for each room's backdrop:**

1. Text to image (`fal-ai/flux-2-max`) with this prompt, filling the brackets for the room, with the room's seed (`1101`, `1201` …). It is t22's (CREDITS, entry 22) with two changes, both untested: the opening is set at exactly a quarter of the width with its jambs outside it (t22 asked for about a quarter and put its jambs inside the opening), and the roofs have plain chimneys (t24 drew antennas).

   ```text
   A room backdrop: [the room's setting, e.g. the old town wall facing a small cobbled square]. In the exact centre of the wall is one tall empty [opening: arched gateway, gate channel, wheel pit], exactly a quarter of the picture's width between its jambs, with the jambs outside that quarter, from just under the top of the wall down to the ground. [Its moving part has been taken out: it holds no door, no portcullis, no chains and no pulleys,] and through it the passage is plain pale paper. Straight-on frontal elevation at standing eye level, with very weak perspective, like a flat theatre backdrop. The wall runs straight across the whole picture from edge to edge. Its top is a simple stone coping a sixth of the way down; only above it, along the top sixth, do a few baroque house fronts with terracotta roofs and plain chimneys peek over, and the sky is bare paper. The cobbled ground fills the bottom fifth, with large plain flagstones in the middle. To the left and to the right of the gateway, from the gateway out to both edges of the picture and from the coping down to the ground, the wall is completely plain smooth pale limestone with only faint thin joints: no windows, no doors, no posts, no lamps, no pipes, no chains, no machines, no plants, no water and nothing standing in front of it, because the game draws its moving machine parts there later. Everything is still and at rest: no people, no animals, no vehicles, no moving parts, no flames, no smoke, no steam. [Style block, newest]
   ```

   Words place the wall top and the wall's foot only roughly; step 2 fixes small misses, so don't spend images on them.
2. Measure where the wall top and the wall's foot landed. Refit only when the top is within about 50 units of y 200 and the foot within about 80 units of y 800, so every band stays within about ±30 %; t22's were 5 and 70 off, its wall stretched by 1.13 and its ground squeezed to 0.74. Further off (t24's top at 350, t26's at 250) needs a new image. Refit with `node art-src/tools/refit.mjs <in> <out.webp> --y 0,<top>,<foot>,1000:0,200,800,1000`. A cut must never run through an object, only through plain wall, sky or ground. A round opening (the wheel pits of r04 and r11) turns oval when the wall is stretched, so keep its wall band near ×1 and take the difference out of the ground. Use `--x` only to widen or narrow plain wall, never across the opening.
3. Run the overlay check and the grey preview, then `node art-src/tools/scene-mock.mjs <dev-server-url> <grey preview> <out-dir>`, which multiplies the backdrop under the live room-1 scale at x = 1 and x = 10. Look at all three, and record the refit in CREDITS under "Derived images" with its exact command. The template's two mocks are `art-src/tests/backdrop-r01-door-lift.t22-refit.mock-x1.webp` and `…mock-x10.webp`.

**What a refit can't fix:** an object in a pan zone, anything in the opening, or a style miss. Those need a new image.

**For the next rooms:** t22's arch has its jambs just inside the opening (x 610–670 and 905–960), so the check passes there with little margin (2.7 % of a 3 % limit). Ask for "an opening exactly a quarter of the picture's width, with its jambs outside it", so the jambs stand behind the housing's columns.

## Test images

28 of the 30 allowed images were made, t22–t28 for the review fixes, so 2 remain, kept in reserve (story 2.12 needed neither). Best of each kind: for style, backdrop t21; for layout, the template backdrop t22-refit (above), which passes the overlay check; no housing passes yet, and the closest is t27. Automatons t09, t11 and t12, looks t14–t19, map t20 (concept only).

**What worked.** The ink-and-wash look holds across every asset type and greys convincingly. The fixed style block alone carries consistency: t21, made from text with no reference, matches t01 and t04 on smoother paper. One seed and template gives six looks with the same pose and scale. Writing the automatons' shared design into each prompt (t11, t12) matched the family as well as a reference did (t10), without its side effects. The review's Backdrop slot keeps objects out of the pan zones: t22, t24, t26 and t28 all have plain wall beside the gateway (1.9–5.9 % ink, where t01's plain wall measures 1 %). A layout guide places a housing almost to the unit (t27).

**What didn't.** No backdrop made before the review kept its quiet zone. Against the scale in code, t01, t03, t04, t05, t06 and t21 all fail the overlay check, with up to 60 % ink in a pan zone where plain wall has 1–2 %: doors, chains, gates, the wheel, lamp posts, pipes and canal water. All six also fail the old zone (x 320–1280, y 160–800), with 5–29 % ink in it. Signatures appeared in t01–t03, some with digits, and a signed reference spreads its signature. The edit endpoint adds paper grain (t03–t07, t10, t27, t28) and, given an unrelated reference, ignores the subject (t08, a clock-faced robot). The maps let in people, a car, smoke and a clock face (t02), plus glyphs on tiny signs and no margins (t20). No review image lands both the wall top and the ground line (t22: ground at about y 730; t24: wall top at 350; t26: wall top at 250, and its style drifted to a photographic wall on white; t28: ground at about 730 and a dark reveal). t23 and t25 put the housing's columns in the wrong place, and t27 still crosses the zone edges by 5–7 units and hangs two fittings into the opening. Nothing has alpha yet, and small misses remain, such as lit lamp glass, bulbs, a margin line and ground shadows.

**Changes that improved consistency.** v3 replaced "a page from a sketchbook" with "unsigned game art" and asked for hot-pressed paper. It also named the modern objects, which removed the signature and the antenna (t03 → t06, same seed); naming the signature alone, in v2, had not. v4 replaced "clockwork" with "gear-driven" and added "no clock faces", and no numerals appeared from t09 on. New subjects now use text to image rather than a reference. Characters got a picture-book face, no "boy or girl" line and one shared seed (t13 → t14). The Backdrop slot now leaves out the moving part and names everything that may not stand beside the opening (t21 → t22, quiet in the pan zones).

**Still to do (epic 6):**

- A map on 19 spaced plots with margins.
- The other twelve backdrops, from the template's recipe (The template backdrop).
- The door-lift housing from its layout guide with thinner columns and nothing under the brackets, then background removal, which must also take out t27's ground wash.
- Background removal for every cut-out.
- One moving part per room, drawn in code (provisional; the room names are placeholders and later rooms are designed in epic 4):

| Room | Moving part, drawn in code | The backdrop shows |
|---|---|---|
| r01 Door lift | The door, rising, with its chains and pulleys | The empty gateway |
| r02 Street lamps | None moves: the lamps' light is an effect, and the lamps belong to the housing | Plain wall |
| r03 Sluice gate | The gate panel and its handwheel | The empty gate channel, with no water above the ground line |
| r04 Water wheel | The wheel | The empty wheel pit |
| r05 Bridge | The bridge deck | The empty gap |
| r06 Weighing yard | The crane hook and crate | Plain wall |
| r07 Old logbook | The logbook's gear train | Plain wall |
| r08 Tram | The tram car | The empty track opening |
| r09 Steam lift | The lift cage (steam is an effect) | The empty shaft |
| r10 Market scales | None beyond the scale | Plain wall |
| r11 Great wheel | The wheel | The empty wheel pit |
| r12 Junction | The linking gears | Plain wall |
| r13 Clock tower | The pendulum and the winder, with no clock face | The empty belfry opening |

## Decided in story 2.12

Each is a call for Luka's veto.

1. **The apprentice stays grey** (Display state), keeping NFR12 to the letter.
2. **The standing scale stays.** `scaleGeometry` in `src/ui/scene/scale/layout.ts` is the source (story 1.4), and `src/art/scene-zones.ts` and this guide follow it.
3. **The palette is in `src/art/palette.ts`** (Palette). There is one red: the earlier `mark` (#A8343A) was a near twin of the code's `jam` (#A8432F), so the First Automaton's marks use `jam`. The lamp keeps the code's #E0A33A, the lamp seen since story 1.8, rather than this guide's earlier #F2B544.
4. **The template backdrop is t22, refitted** (The template backdrop). Both images left stay in reserve.
5. **The review's minor notes** (below):
   - **Dark automaton bodies:** they become "dark iron in a mid-value wash, never a solid dark mass". The bodies keep their outline and hatching, so in grey they read as ink drawings, not blocks. The automatons are drawn in epic 6, which applies it.
   - **t09 and t12 against the automaton table:** the table wins. t09 and t12 show the style only, and the epic 6 images follow the table. Seeds stay as CREDITS records them; new automaton images use `4201`, `4301`, `4401` and `4601` by armour.
   - **Map sizing:** the 70-unit mask is too small. A machine on the map is at most 120 units across, and its mask is a soft circle centred on its node, fully on out to 120 units across and gone by 160. Nodes stand at least 160 units apart, so a neighbour's mask stops at least 20 units short of a machine. The map's layout itself waits for epic 6.
   - **References that aren't kept:** they stay unkept. t02–t08 and t10 can't be regenerated from CREDITS, which says so. None of them is a template.
   - **`fal-generate.mjs`'s download:** it now checks the response status, and a failed download stops with an error (the image is still counted).
   - **`src/art/palette.ts`:** it now holds every token (Palette).

## Review

The guide was reviewed once, on 2026-11-05. Each finding, and what was done:

1. **Mount points, housing footprint and quiet zone followed a hanging scale** (pivot at about y 230, pans in x 420–1180), while story 1.4's code has a standing scale: pivot (800, 600), floor y 820, pans across x 65–1535. *Done:* followed the code, as this guide said it would. The zones now live in `src/art/scene-zones.ts`, tested against `scaleGeometry` and every GDD room's pieces in `src/art/scene-zones.test.ts`. Camera, Scene zones, Housings and the slots are rewritten from it. The housing was regenerated three times: t23 (columns too close), t25 (too far apart) and t27 (layout guide, within about 7 units, failing narrowly). If Luka prefers the hanging scale, `scaleGeometry` changes instead, and then the zones and this guide follow it. Only one of them is the source.
2. **"Every backdrop kept a clean quiet zone" was false,** and t21, named best and used as the template, broke it worst. *Done:* corrected. t01, t03, t04, t05, t06 and t21 are marked as failing here and in CREDITS, which adds t03 and t04 to the four the review found. The Backdrop slot keeps all detail to the top band and the ground, with plain wall beside the opening and no water above the ground line. The review step is now an overlay check (`art-src/tools/quiet-zone.mjs`, unit-tested in `scripts/art-tools.test.ts`). The slot was tried on four reserve images (t22, t24, t26, t28). All four kept objects out of the pan zones, but none landed both the wall top and the ground line, so no backdrop was called the template then. (Story 2.12 made the template from t22 by a refit; see The template backdrop.)
3. **Moving parts were painted into the backdrops,** the slot didn't exclude them, and "a separate image layer" contradicted the architecture. *Done:* followed the architecture. Moving parts are drawn in code, with a material texture if wanted, and are never in an image. The Backdrop slot says the part is left out and its opening is shown empty, and Still to do lists one moving part per room. The architecture needs no change.
4. **A job without `style` silently used v1.** *Done:* `fal-generate.mjs` now defaults to the newest block (`LATEST_STYLE`), refuses an unknown key before anything is sent and records the resolved key in CREDITS, and its schema comment lists the keys. This is tested in `scripts/art-tools.test.ts`. t22–t28 were made without a style key and CREDITS records v4.
5. **NFR12 keeps colour, brass and copper for restarted machines,** but the guide gave automatons and looks brass and copper and never said in which state each asset is shown. *Done:* added Display state. Backdrops and housings are grey until the room's last stage restarts, code-drawn parts are ink on paper until then, and automatons, the apprentice and townspeople are always grey. Looks 1 and 5 lose their brass goggles and copper buttons, so a colour apprentice (an NFR12 exception, for Luka's veto) would need no new images.

**Minor notes from the review, for Luka** (each decided in story 2.12; see Decided in story 2.12):

- Automatons are specified with a "dark cast-iron body" (line 72 of the reviewed draft), which contradicts the grey-state rule "No large dark masses, which turn into blocks of ink" (line 54). The bodies in t09–t12 would turn into blocks of ink under the shader. With automatons always grey (Display state), this now matters more.
- The images marked best do not match the automaton table: t09 (armour 20) has two arms where the table says one, t12 (armour 60) shows two legs where it says four plus a butterfly key, and t11 used seed 4451 rather than the 4401 that the 4201–4601 scheme implies.
- Map sizing: a "soft round mask about 70 units across" cannot hold a machine "two or three times house size" at the scale t20 shows (its machines are about 200–300 units). Give an absolute machine size or a larger mask.
- CREDITS cites references (`style-ref-a.png` and the `.tNN.png` originals) that are "not kept", so the edit-endpoint images t02–t08 and t10 cannot be regenerated from CREDITS. Keep the originals or say so. (The two layout guides behind t27 and t28 are kept in `art-src/tests/`.)
- `fal-generate.mjs` never checks the response status of the image download (`fetch(image.url)`). `src/art/palette.ts` still says "Placeholder … until the epic 2 style guide" and has none of the new tokens (`inkSoft`, `brass`, `brassLight` and the others) that the guide names for code. The test suite was not run for the reviewed commit, because it touched nothing that Vitest, tsc or Biome cover; this fix adds tests, and the checks run.
