images generated: 71/100

# Art credits

Every image source in `art-src/` has an entry here: file, origin and licence, and for
AI-generated images the model, prompt, seed and date (architecture, Asset Management). The
count above covers every image generated for the art style guide, retries included; the cap
is 30, with 6 kept in reserve for review fixes. The review fixes used t22–t28, so 2 remain.

The test images in `art-src/tests/` explore the style in `_bmad-output/art-bible.md`. They are
not production sources, and `scripts/build-art.ts` must skip `art-src/tests/`.

Each entry was written by `art-src/tools/fal-generate.mjs`, which assembles the prompt from
the art bible's template (per-asset slots, then the fixed style block). The prompt below each
entry is exactly what was sent. "Review" is the verdict after looking at the image.

References name local files that are not in the repository: `<name>.tNN.png` is the
full-size PNG original of `tests/<name>.tNN.webp`, and `style-ref-a.png` is the original of
t01 cropped to 1920 × 1130 to remove its signature. References were sent at about 1 MP as
JPEG data URIs. The two layout guides are the exception: `housing-layout-guide.png` (t27)
and `backdrop-layout-guide.png` (t28) are kept in `tests/`. They are flat shapes drawn at
1920 × 1200 from `src/art/scene-zones.ts` (scene units × 1.2), not AI images, and count
toward nothing.

From t22 on, "Review" quotes the overlay check, `node art-src/tools/quiet-zone.mjs
<backdrop|housing> <out-dir> <image>`, against the scale drawn in code (art bible, "Review
every image"). The verdicts added to t01, t03–t07 and t21 come from the same check.

## Test images

### 01. `tests/backdrop-r01-door-lift.t01.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 1101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 52, 282 KB
- References: none
- Style block: v1
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Style anchor, text to image.
- Review: Good ink-and-wash look and a quiet centre; became the style anchor. Signed in the bottom-right corner, so the reference copy (style-ref-a.png, not kept) was cropped to 1920 × 1130. Review fix (overlay check, `tools/quiet-zone.mjs`): fails against the scale in code, with pan zones at 6.6 % and 20.1 % ink and the opening at 4.4 %. The door, chains and pulleys stand where the right pan swings, and the door belongs in code anyway.
- Prompt:

  ```text
  A room backdrop: a small cobbled square in front of the old town wall, where a tall heavy oak-and-iron door is lifted by a counterweight. The closed door stands at the right, with chains running up from it over large pulley wheels on a beam at the top of the wall. A worn crank handle on a post at the left. Baroque house fronts with terracotta roofs peek over the wall. Straight-on frontal elevation at standing eye level, with very weak perspective, like a flat theatre backdrop. The cobbled ground fills the bottom fifth. The middle of the picture, from about a fifth to four fifths of the width and from a sixth to four fifths of the height, is a plain quiet stretch of stone wall with very little detail, because a machine will be placed in front of it later. Detail sits at the left and right edges and along the top. The sky is bare paper. Everything is still and at rest: no people, no moving parts, no flames, no smoke, no steam. Hand-drawn illustration like a page from an inventor’s sketchbook that has come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm, with the paper showing through. Warm cream paper ground (#F4EFE3), clean and even, with no stains, tears, border or frame. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink. Brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Clockwork and steam technology in a timeless Central European town with a Croatian character; no electricity. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no signature and no logo; every dial, plate and sign is blank.
  ```

### 02. `tests/map-donji-kotac.t02.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 2101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 70, 286 KB
- References: `backdrop-r01-door-lift.t01.png`
- Style block: v2
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Map concept, edit endpoint with t01 as the style reference.
- Review: Rejected. The reference passed on the signature (with digits); a clock tower with numerals, people, a motor car, smoke and flowing water; edges drawn as a floating island.
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink line weight, hatching, watercolour washes, paper colour and palette. Do not copy its subject. A map of one district of a clockwork city, like an old hand-drawn bird's-eye city plan. A river crosses the lower part, with a sluice gate, a big water wheel and a stone bridge. Around it stand separate machines: a counterweight door lift in the old town wall, a street of oil lamps, a weighing yard with crates, a small workshop, a tram line on rails, a steam lift up a low cliff, a market square with a big balance scale, a great spoked wheel, a junction of linked machines, and a tall clock tower with a pendulum on a hill at the top. A closed foundry gate with tall chimneys at the right edge. Cobbled streets join them. Houses with terracotta roofs fill the blocks between. High bird's-eye view from the south, looking down at about fifty degrees, in parallel projection with no vanishing point, like an axonometric drawing. Each machine stands on its own clear plot with open space around it, spread evenly over the whole picture, so that each one could be circled on its own. Houses are small and simple; the machines are larger than life and easy to pick out. The edges fade out into bare paper. Everything is still and at rest: no people, no moving parts, no flames, no smoke, no steam. Hand-drawn illustration like a page from an inventor’s sketchbook that has come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm, with the paper showing through. Smooth warm cream paper ground (#F4EFE3), clean and even, with no grain, speckles, stains, tears, border or frame. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink. Brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Clockwork and steam technology in a timeless Central European town with a Croatian character; no electricity. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels and no logo; every dial, plate and sign is blank. No artist’s signature, initials or monogram anywhere, and all four corners are empty paper.
  ```

### 03. `tests/backdrop-r02-street-lamps.t03.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 1201
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 76, 238 KB
- References: `style-ref-a.png`
- Style block: v2
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Backdrop with the cropped t01 (style-ref-a.png) as the style reference.
- Review: Rejected. Signed with digits, a TV antenna, lamp glass painted lit, heavy paper grain from the edit endpoint. Composition good. Review fix: fails the overlay check (pan zones 11.3 % and 14.4 % ink: the lamp posts).
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink line weight, hatching, watercolour washes, paper colour and palette. Do not copy its subject. A room backdrop: a cobbled street of plastered town houses with green shutters and terracotta roofs. Four tall cast-iron oil street lamps with brass lanterns, all unlit and empty, two near the left edge and two near the right edge. A thin copper oil pipe runs along the house fronts between them. Straight-on frontal elevation at standing eye level, with very weak perspective, like a flat theatre backdrop. The cobbled ground fills the bottom fifth. The middle of the picture, from about a fifth to four fifths of the width and from a sixth to four fifths of the height, is a plain quiet house front with very little detail, because a machine will be placed in front of it later. Detail sits at the left and right edges and along the top. The sky is bare paper. Everything is still and at rest: no people, no animals, no vehicles, no moving parts, no flames, no light from the lamps, no smoke, no steam. Hand-drawn illustration like a page from an inventor’s sketchbook that has come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm, with the paper showing through. Smooth warm cream paper ground (#F4EFE3), clean and even, with no grain, speckles, stains, tears, border or frame. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink. Brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Clockwork and steam technology in a timeless Central European town with a Croatian character; no electricity. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels and no logo; every dial, plate and sign is blank. No artist’s signature, initials or monogram anywhere, and all four corners are empty paper.
  ```

### 04. `tests/backdrop-r03-sluice-gate.t04.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 1301
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 70, 289 KB
- References: `style-ref-a.png`
- Style block: v2
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Backdrop with style-ref-a.png as the style reference.
- Review: Usable concept. No signature; brass handwheel reads well; quiet centre. Heavy paper grain; a little splash at the gate. Review fix: fails the overlay check (pan zones 38.0 % and 9.8 %, opening 8.2 %, dial ground 14.7 %); the gate belongs in code.
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink line weight, hatching, watercolour washes, paper colour and palette. Do not copy its subject. A room backdrop: a stone-walled canal lock in the lower town. A heavy wooden sluice gate in an iron frame closes the canal at the left, with a toothed iron rack and a large brass handwheel above it. Behind the gate the water stands high and still; in front of it the channel is almost dry, with wet stones. Stone steps and an iron railing at the right edge. Straight-on frontal elevation at standing eye level, with very weak perspective, like a flat theatre backdrop. The stone quay fills the bottom fifth. The middle of the picture, from about a fifth to four fifths of the width and from a sixth to four fifths of the height, is a plain quiet stretch of canal wall with very little detail, because a machine will be placed in front of it later. Detail sits at the left and right edges and along the top. The sky is bare paper. Everything is still and at rest: no people, no animals, no vehicles, no moving parts, no flowing or splashing water, no smoke, no steam. Hand-drawn illustration like a page from an inventor’s sketchbook that has come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm, with the paper showing through. Smooth warm cream paper ground (#F4EFE3), clean and even, with no grain, speckles, stains, tears, border or frame. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink. Brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Clockwork and steam technology in a timeless Central European town with a Croatian character; no electricity. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels and no logo; every dial, plate and sign is blank. No artist’s signature, initials or monogram anywhere, and all four corners are empty paper.
  ```

### 05. `tests/backdrop-r04-water-wheel.t05.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 1401
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 70, 275 KB
- References: `style-ref-a.png`
- Style block: v2
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Backdrop with style-ref-a.png as the style reference.
- Review: Usable concept. Good wheel and pipework; drew a margin line round the picture and heavy grain. Review fix: fails the overlay check (right pan zone 31.4 %: the wheel and pipes); the wheel belongs in code.
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink line weight, hatching, watercolour washes, paper colour and palette. Do not copy its subject. A room backdrop: the side of an old stone mill house by a mill race. A large wooden overshot water wheel with wooden buckets and an iron hub stands at the right edge, fed by a wooden chute from above. A low stone wall with a small arched window at the left. Copper pipes and a brass gear housing on the mill wall near the hub. Straight-on frontal elevation at standing eye level, with very weak perspective, like a flat theatre backdrop. The stone yard fills the bottom fifth. The middle of the picture, from about a fifth to four fifths of the width and from a sixth to four fifths of the height, is a plain quiet stretch of mill wall with very little detail, because a machine will be placed in front of it later. Detail sits at the left and right edges and along the top. The sky is bare paper. Everything is still and at rest: no people, no animals, no vehicles, the wheel stopped, the chute empty, no flowing or splashing water, no smoke, no steam. Hand-drawn illustration like a page from an inventor’s sketchbook that has come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm, with the paper showing through. Smooth warm cream paper ground (#F4EFE3), clean and even, with no grain, speckles, stains, tears, border or frame. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink. Brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Clockwork and steam technology in a timeless Central European town with a Croatian character; no electricity. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels and no logo; every dial, plate and sign is blank. No artist’s signature, initials or monogram anywhere, and all four corners are empty paper.
  ```

### 06. `tests/backdrop-r02-street-lamps.t06.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 1201
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 70, 292 KB
- References: `style-ref-a.png`
- Style block: v3
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Retry of t03 with the same seed and style block v3, to test the signature, grain and antenna fixes.
- Review: Better: v3 removed the signature and the antenna. Lantern glass still shows bulb-like shapes; three lamps instead of four; grain remains (edit endpoint). Review fix: fails the overlay check (pan zones 19.4 % and 28.7 %: the lamp posts and the copper pipe).
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink line weight, hatching, watercolour washes, paper colour and palette. Do not copy its subject. A room backdrop: a cobbled street of plastered town houses with green shutters and terracotta roofs. Four tall cast-iron oil street lamps with brass lanterns of clear empty glass, unlit, two near the left edge and two near the right edge. A thin copper oil pipe runs along the house fronts between them. Straight-on frontal elevation at standing eye level, with very weak perspective, like a flat theatre backdrop. The cobbled ground fills the bottom fifth. The middle of the picture, from about a fifth to four fifths of the width and from a sixth to four fifths of the height, is a plain quiet house front with very little detail, because a machine will be placed in front of it later. Detail sits at the left and right edges and along the top. The sky is bare paper. Everything is still and at rest: no people, no animals, no vehicles, no moving parts, no flames, no light or glow from the lamps, no smoke, no steam. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Clockwork and steam technology in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels and no logo; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 07. `tests/housing-r01-door-lift.t07.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 3101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 82, 193 KB
- References: `style-ref-a.png`
- Style block: v3
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Housing on the full 16:10 scene canvas so it lines up with the backdrop.
- Review: Good housing: clean opening, a central bracket for the beam pivot, a slot for the dial. Too wide for the backdrop (covers its door and crank) and needs a cut-out; a faint ground line. Review fix: drawn for the old hanging scale. Against the standing scale in code its columns stand where the pans swing (pan zones 11.4 % and 9.8 % ink) and its plinth covers the dial (5.4 %). Superseded by t23, t25 and t27.
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink line weight, hatching, watercolour washes, paper colour and palette. Do not copy its subject. A machine housing for a game, drawn on its own: the brass and dark-iron frame of a counterweight door lift. Two tall riveted iron side columns, each topped by a brass pulley wheel with a short end of chain; a heavy polished brass crossbeam across the top with one sturdy empty bracket at its centre; a low stone-and-brass base plinth with a long empty slot along its front. Small details: rivets, oil cups, copper pipes, a worn crank handle on the left column. Straight-on frontal elevation, symmetrical, with no perspective. The frame surrounds one large empty opening in the middle of the picture, about two thirds of the width and two thirds of the height. Nothing hangs in the opening: no beam, no pans, no weights, no chains, no gears, no dials. The opening is plain flat cream paper. At rest: no motion, no steam, no smoke. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Clockwork and steam technology in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels and no logo; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no wall, no scenery and no shadow.
  ```

### 08. `tests/automaton-20.t08.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 4201
- Generated at 1440 × 1440 PNG; saved as WebP 1440 × 1440, quality 82, 178 KB
- References: `style-ref-a.png`
- Style block: v3
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Smallest automaton (armour 20); its design is the reference for the other three.
- Review: Rejected. The edit endpoint with a backdrop reference ignored the subject: a boxy robot with a clock face and numerals, small in frame, with a shadow.
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink line weight, hatching, watercolour washes, paper colour and palette. Do not copy its subject. A small clockwork automaton for a game, knee-high to a child: a round dark cast-iron body shaped like a squat teapot, ringed by one riveted brass band, standing on three thin jointed legs with round pad feet. One large round glass lens for an eye, in a brass bezel with an iris shutter. A brass wind-up key on its back. A narrow slot on its front with a short strip of blank punched paper tape poking out. One thin arm with small pincers holding a salvaged brass cog. A short copper steam valve on top. Curious and a little absurd, not scary. Three-quarter view from the front left, at the height of its body, with little perspective, facing left. The whole figure fits inside the picture with a clear margin on every side, standing on an invisible ground line near the bottom. At rest: no steam, no glow, no motion lines. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Clockwork and steam technology in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels and no logo; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 09. `tests/automaton-20.t09.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 4201
- Generated at 1440 × 1440 PNG; saved as WebP 1440 × 1440, quality 82, 135 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Retry of t08: text to image with no reference, style v4, the subject first and drawn large.
- Review: Best automaton. Follows the prompt closely, smooth ground, no shadow; sets the family look.
- Prompt:

  ```text
  A small wind-up automaton character for a game. Its body is a squat round dark cast-iron pot like a teapot, ringed by one riveted brass band, on three thin jointed iron legs with round pad feet. Its only face is one large round glass lens in a brass bezel. A big brass wind-up key sticks out of its back. A short strip of blank punched paper tape pokes out of a slot in its front. One thin jointed arm ends in small pincers holding a brass cog. A short copper valve pipe on top. Curious and a little absurd, not scary. Three-quarter view from the front left, at the height of its body, with little perspective, facing left. The figure is drawn large, centred, filling about three quarters of the picture's height, with a clear margin on every side. At rest: no steam, no glow, no motion lines. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 10. `tests/automaton-30.t10.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 4301
- Generated at 1440 × 1440 PNG; saved as WebP 1440 × 1440, quality 82, 272 KB
- References: `automaton-20.t09.png`
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Armour 30, edit endpoint with t09 as the design reference.
- Review: Good family match, but the edit endpoint brought back grain, drew a ghost fifth leg, a crank in place of the key and ruled lines on the tape.
- Prompt:

  ```text
  Image 1 shows the design family: keep its ink and watercolour style, dark cast iron, round glass lens in a brass bezel, big brass wind-up key, riveted brass bands and punched-tape slot. Draw a new, bigger automaton of the same family, not a copy of image 1. A medium wind-up automaton character for a game: a long dark cast-iron barrel body lying on its side, ringed by two riveted brass bands, with a curved brass plate over its shoulders, on four jointed iron legs like a dog. At the front, one large round glass lens in a brass bezel. A big brass wind-up key on its back. A slot in its front with a short strip of blank punched paper tape. Two thin arms with pincers. A copper valve pipe on top. Curious and a little absurd, not scary. Three-quarter view from the front left, at the height of its body, with little perspective, facing left. The figure is drawn large, centred, filling most of the picture's width, with a clear margin on every side. At rest: no steam, no glow, no motion lines. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 11. `tests/automaton-45.t11.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 4451
- Generated at 1440 × 1440 PNG; saved as WebP 1440 × 1440, quality 82, 119 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Armour 45, text to image with the shared design language written out, to compare with t10's reference.
- Review: Good. Matches t09 without a reference; the key became a handwheel.
- Prompt:

  ```text
  A tall wind-up automaton character for a game, as tall as a child: an upright dark cast-iron boiler body with three riveted brass bands and rounded brass shoulder plates, on two sturdy jointed iron legs with flat round feet. Its head is a small iron dome with one large round glass lens in a brass bezel. A big brass wind-up key sticks out of its back. A slot in its chest with a short strip of blank punched paper tape. One arm ends in a large iron wrench, the other in pincers. A short copper chimney pipe on one shoulder. Sturdy and a little absurd, not scary. Three-quarter view from the front left, at the height of its body, with little perspective, facing left. The figure is drawn large, centred, filling about four fifths of the picture's height, with a clear margin on every side. At rest: no steam, no glow, no motion lines. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 12. `tests/automaton-60.t12.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 4601
- Generated at 1440 × 1440 PNG; saved as WebP 1440 × 1440, quality 82, 225 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Armour 60, text to image with the shared design language written out.
- Review: Strong design, but "butterfly-shaped key" drew a real butterfly, and a small ground shadow. Plain "brass wind-up key" (t09) works.
- Prompt:

  ```text
  A huge wind-up automaton character for a game, twice as tall as a child: a massive round dark cast-iron furnace body covered in overlapping riveted brass armour plates, on four thick jointed iron legs with broad round feet. A low domed iron head at the front with one large round glass lens in a heavy brass bezel, its only face. A big butterfly-shaped brass wind-up key like on a wind-up toy sticks out of its back. A wide slot in its chest with a short strip of blank punched paper tape. One long crane arm ending in a three-fingered claw, and one short arm holding a round iron magnet. A tall copper chimney on its back. Imposing but still a little absurd, not scary. Three-quarter view from the front left, at the height of its body, with little perspective, facing left. The figure is drawn large, centred, filling most of the picture, with a clear margin on every side. At rest: no steam, no smoke, no glow, no motion lines. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 13. `tests/look-1.t13.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5000
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 156 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Character template with look 1; seed 5000 is shared by all six looks.
- Review: Charming but reads as a girl (eyelashes, bob) and faces left although the prompt said right.
- Prompt:

  ```text
  A game character: a young apprentice inventor about eleven years old, a child who could be a boy or a girl, standing in a relaxed pose and holding a small worn notebook against the chest with one hand. Light olive skin, short straight dark brown hair under a grey flat cap with brass goggles pushed up on it, a canvas work apron over a striped shirt with rolled sleeves, brown trousers and laced boots. Simple readable shapes and a friendly, curious expression; the proportions of a real eleven-year-old, slightly stylised, not chibi. Full-body three-quarter view from the front right, at the child's eye level, with little perspective, facing right. The figure is centred and fills about nine tenths of the picture's height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 14. `tests/look-1.t14.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5000
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 191 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Retry of t13 with the revised character template (picture-book face, no direction); seed 5000 shared by all six looks.
- Review: Good. More neutral face; same pose and scale as the rest of the set.
- Prompt:

  ```text
  A game character: a young apprentice inventor, an eleven-year-old child, standing in a relaxed pose and holding a small worn notebook against the chest with both hands. Light olive skin, short straight dark brown hair cropped above the ears under a grey flat cap with brass goggles pushed up on it, a canvas work apron over a striped shirt with rolled sleeves, brown trousers and laced boots. A simple picture-book face with small dark dot eyes, no eyelashes, a small nose and a calm, curious half-smile. Slightly stylised proportions of a real eleven-year-old, the head about one sixth of the height; not chibi. Full-body three-quarter view at the child’s eye level, with little perspective. The figure is centred and fills about nine tenths of the picture’s height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 15. `tests/look-2.t15.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5000
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 177 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Character template v2, seed 5000 shared by all six looks.
- Review: Good. Reads boyish; the set balances it.
- Prompt:

  ```text
  A game character: a young apprentice inventor, an eleven-year-old child, standing in a relaxed pose and holding a small worn notebook against the chest with both hands. Dark brown skin, short black curly hair, round wire-rimmed glasses, blue-grey work overalls with rolled cuffs and a patched knee, a leather tool belt with a few small tools, sturdy boots. A simple picture-book face with small dark dot eyes, no eyelashes, a small nose and a calm, curious half-smile. Slightly stylised proportions of a real eleven-year-old, the head about one sixth of the height; not chibi. Full-body three-quarter view at the child’s eye level, with little perspective. The figure is centred and fills about nine tenths of the picture’s height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 16. `tests/look-3.t16.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5000
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 207 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Character template v2, seed 5000 shared by all six looks.
- Review: Good. Reads neutral.
- Prompt:

  ```text
  A game character: a young apprentice inventor, an eleven-year-old child, standing in a relaxed pose and holding a small worn notebook against the chest with both hands. Fair freckled skin, shaggy chin-length auburn hair, a mustard waistcoat with many pockets over a cream shirt, a green knitted scarf, brown corduroy trousers and boots. A simple picture-book face with small dark dot eyes, no eyelashes, a small nose and a calm, curious half-smile. Slightly stylised proportions of a real eleven-year-old, the head about one sixth of the height; not chibi. Full-body three-quarter view at the child’s eye level, with little perspective. The figure is centred and fills about nine tenths of the picture’s height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 17. `tests/look-4.t17.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5000
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 144 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Character template v2, seed 5000 shared by all six looks.
- Review: Good. Reads neutral.
- Prompt:

  ```text
  A game character: a young apprentice inventor, an eleven-year-old child, standing in a relaxed pose and holding a small worn notebook against the chest with both hands. Medium brown skin, black hair in short twists, a leather aviator cap with ear flaps and brass goggles, a chunky grey knitted jumper with patched elbows, a canvas satchel across the body, dark trousers and boots. A simple picture-book face with small dark dot eyes, no eyelashes, a small nose and a calm, curious half-smile. Slightly stylised proportions of a real eleven-year-old, the head about one sixth of the height; not chibi. Full-body three-quarter view at the child’s eye level, with little perspective. The figure is centred and fills about nine tenths of the picture’s height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 18. `tests/look-5.t18.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5000
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 166 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Character template v2, seed 5000 shared by all six looks.
- Review: Good. Reads slightly girlish; the set balances it.
- Prompt:

  ```text
  A game character: a young apprentice inventor, an eleven-year-old child, standing in a relaxed pose and holding a small worn notebook against the chest with both hands. Pale skin, straight black hair in a short bowl cut with a blunt fringe, a high-collared slate-blue work smock with copper buttons, fingerless gloves, a canvas satchel, grey trousers and boots. A simple picture-book face with small dark dot eyes, no eyelashes, a small nose and a calm, curious half-smile. Slightly stylised proportions of a real eleven-year-old, the head about one sixth of the height; not chibi. Full-body three-quarter view at the child’s eye level, with little perspective. The figure is centred and fills about nine tenths of the picture’s height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 19. `tests/look-6.t19.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5000
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 171 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Character template v2, seed 5000 shared by all six looks.
- Review: Good. Reads boyish; the set balances it.
- Prompt:

  ```text
  A game character: a young apprentice inventor, an eleven-year-old child, standing in a relaxed pose and holding a small worn notebook against the chest with both hands. Deep brown skin, closely cropped black hair, an oversized rust-coloured work jacket with brass buttons and rolled sleeves, a red neckerchief, a small wrench in the jacket pocket, patched trousers and boots. A simple picture-book face with small dark dot eyes, no eyelashes, a small nose and a calm, curious half-smile. Slightly stylised proportions of a real eleven-year-old, the head about one sixth of the height; not chibi. Full-body three-quarter view at the child’s eye level, with little perspective. The figure is centred and fills about nine tenths of the picture’s height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 20. `tests/map-donji-kotac.t20.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 2101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 58, 288 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Retry of t02: text to image with style v4, the clock tower described without a face, people, vehicles and smoke named.
- Review: Mixed. Crisp axonometric city and no clock face, but it zooms in past the edges (no paper margin, the tower is cut off), the tram has passengers and tiny signboards carry glyphs.
- Prompt:

  ```text
  A game map of one district of a gear-driven town, like an old hand-drawn bird's-eye city plan. A river with a stone quay crosses the lower part, with a sluice gate, a big wooden water wheel and an arched stone bridge. Around it, each on its own open plot, stand large machines: a counterweight door lift in the old town wall at the bottom left, a short street of oil lamps, a weighing yard with crates, a small workshop with a brass roof vent, a tram on rails, a steam lift up a low cliff, a market square with a big balance scale, a great spoked wheel, a junction of linked gear machines, and on a hill at the top a slim stone tower with an open belfry and a long brass pendulum, with no clock face. A closed iron foundry gate with cold chimneys at the right edge. Cobbled streets join them. Small houses with terracotta roofs fill the blocks between. High bird's-eye view from the south, looking down at about fifty degrees, in parallel projection with no vanishing point, like an axonometric drawing, north at the top. The machines are larger than life and spread evenly over the whole picture, each on its own clear plot with open space around it, so that each one could be circled on its own. The edges fade out into bare paper. Everything is still and at rest: no people, no animals, no vehicles other than the tram, no moving water, no flames, no smoke, no steam. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 21. `tests/backdrop-r03-sluice-gate.t21.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 1301
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 76, 289 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Same slots and seed as t04, but text to image with style v4 and no reference, to test whether backdrops need the reference.
- Review: Best backdrop. Without a reference, v4 alone matches t01 and t04, with smoother paper and no artefacts. Review fix: still the best match for the style, but it fails the overlay check worst of all (pan zones 60.4 % and 24.4 %, opening 21.6 %): the gate, rack, wheel and canal water fill the middle. Not a layout template.
- Prompt:

  ```text
  A room backdrop: a stone-walled canal lock in the lower town. A heavy wooden sluice gate in an iron frame closes the canal at the left, with a toothed iron rack and a large brass handwheel above it. Behind the gate the water stands high and still; in front of it the channel is almost dry, with wet stones. Stone steps and an iron railing at the right edge. Houses with terracotta roofs behind the far wall. Straight-on frontal elevation at standing eye level, with very weak perspective, like a flat theatre backdrop. The stone quay fills the bottom fifth. The middle of the picture, from about a fifth to four fifths of the width and from a sixth to four fifths of the height, is a plain quiet stretch of canal wall with very little detail, because a machine will be placed in front of it later. Detail sits at the left and right edges and along the top. The sky is bare paper. Everything is still and at rest: no people, no animals, no vehicles, no moving parts, no flowing or splashing water, no smoke, no steam. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 22. `tests/backdrop-r01-door-lift.t22.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 1101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 76, 280 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Review fix: proves the tightened Backdrop slot for the code's standing scale (pans over almost the full width); the door is left out because code draws it. No style key, so the script's new default (the newest block) is used.
- Review: Closest backdrop. Plain wall in both pan zones (1.9 % ink each) and an empty, centred, arched gateway, in the style of t21. Fails narrowly: the ground line landed at about y 730, so cobbles show along the bottom of the left pan zone (4 busy cells, max 3), and the arch’s jambs and ring sit inside the opening (3.2 % ink, max 3). Paper fibres visible.
- Prompt:

  ```text
  A room backdrop: the old town wall facing a small cobbled square. In the exact centre of the wall is one tall empty arched gateway, about a quarter of the picture's width, from just under the top of the wall down to the ground. Its door has been taken out: the gateway holds no door, no portcullis, no chains and no pulleys, and through it the passage is plain pale paper. Straight-on frontal elevation at standing eye level, with very weak perspective, like a flat theatre backdrop. The wall runs straight across the whole picture from edge to edge. Its top is a simple stone coping a sixth of the way down; only above it, along the top sixth, do a few baroque house fronts with terracotta roofs peek over, and the sky is bare paper. The cobbled ground fills the bottom fifth, with large plain flagstones in the middle. To the left and to the right of the gateway, from the gateway out to both edges of the picture and from the coping down to the ground, the wall is completely plain smooth pale limestone with only faint thin joints: no windows, no doors, no posts, no lamps, no pipes, no chains, no machines, no plants, no water and nothing standing in front of it, because the game draws its moving machine parts there later. Everything is still and at rest: no people, no animals, no vehicles, no moving parts, no flames, no smoke, no steam. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 23. `tests/housing-r01-door-lift.t23.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 3101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 82, 180 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Review fix: regenerates the door-lift housing for the code's standing scale, as a narrow frame round the machine bay (x 560-1040) that leaves the pan zones empty. Text to image, no reference.
- Review: Right shape (a narrow frame, an empty opening, two axle brackets, clean outer thirds), wrong size: the columns stand inside the opening (about x 590–640 and 935–1000), leaving 280 units where the stand’s 320-unit foot goes, and the feet reach y 940, into the dial ground (2.9 % ink). Copper pipes outside the columns and a cast shadow. Fails.
- Prompt:

  ```text
  A machine housing for a game, drawn on its own: the frame of a counterweight door lift. Two tall slim riveted iron columns stand upright, a quarter of the picture's width apart, one on each side of the centre. A heavy polished brass crossbeam joins their tops, with two small empty brass axle brackets on its underside. Each column stands on a small square stone foot with a brass cap. Small details: rivets, oil cups, a thin copper pipe down the outside of each column. Straight-on frontal elevation, symmetrical, with no perspective. The frame is tall and narrow and stands in the middle of the picture: it is a little less than a third of the picture's width, from near the top edge to about five sixths of the way down. Between the columns is one tall empty opening of plain flat cream paper with nothing in it: no door, no gate, no beam, no pans, no weights, no chains, no pulleys, no gears and no dials. Left and right of the frame, the outer thirds of the picture are empty paper. At rest: no motion, no steam, no smoke. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no wall, no scenery and no shadow.
  ```

### 24. `tests/backdrop-r01-door-lift.t24.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 1101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 76, 253 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Review fix, retry of t22: the wall's foot named at four fifths (t22 put it at about 0.73) and a rectangular gateway as wide as the housing's bay, so its jambs sit behind the columns. No style key (newest block).
- Review: Rejected. The ground line is better (about y 745), but the wall top fell to y 350, so house fronts fill the top of every zone, and the roofs grew antennas despite the style block. Fails.
- Prompt:

  ```text
  A room backdrop: the old town wall facing a small cobbled square. In the exact centre of the wall is one tall empty rectangular gateway, a little under a third of the picture's width, with plain stone jambs and a flat stone lintel just under the top of the wall, running down to the ground. Its door has been taken out: the gateway holds no door, no portcullis, no chains and no pulleys, and through it the passage is plain pale paper. Straight-on frontal elevation at standing eye level, with very weak perspective, like a flat theatre backdrop. The wall runs straight across the whole picture from edge to edge. Its top is a simple stone coping a fifth of the way down; only above it, along the top fifth, do a few baroque house fronts with terracotta roofs peek over, and the sky is bare paper. The foot of the wall is four fifths of the way down: the cobbled ground is a strip along the bottom fifth only, with large plain flagstones in the middle. To the left and to the right of the gateway, from the gateway out to both edges of the picture and from the coping down to the foot of the wall, the wall is completely plain smooth pale limestone with only faint thin joints: no windows, no doors, no posts, no lamps, no pipes, no chains, no machines, no plants, no water and nothing standing in front of it, because the game draws its moving machine parts there later. Everything is still and at rest: no people, no animals, no vehicles, no moving parts, no flames, no smoke, no steam. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 25. `tests/housing-r01-door-lift.t25.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 3101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 82, 69 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Review fix, retry of t23: columns placed at the edges of the middle third so the opening is a quarter of the width (t23's was about 0.18, too narrow for the stand's foot), feet stopped at four fifths, no outside pipes, no shadow.
- Review: Overshot: the columns stand at about x 420–520 and 1080–1180, inside both pan zones (12.0 % and 11.1 % ink), and a hatched ground line runs under the feet. The opening is empty. Fails.
- Prompt:

  ```text
  A machine housing for a game, drawn on its own: the frame of a counterweight door lift. Two slim riveted iron columns stand upright, joined at the top by a heavy polished brass crossbeam with two small empty brass axle brackets on its underside. Each column stands on a small square stone foot with a brass cap. Small details: rivets and oil cups. Straight-on frontal elevation, symmetrical, with no perspective. The frame stands in the middle third of the picture. Its two columns stand just inside the left and right edges of the middle third, so the empty opening between them is wide: a quarter of the picture's width. The crossbeam is near the top edge, and the feet stop four fifths of the way down. The opening holds nothing: no door, no gate, no beam, no pans, no weights, no chains, no pulleys, no gears and no dials, only plain flat cream paper. The outer thirds of the picture and its bottom fifth are empty paper. At rest: no motion, no steam, no smoke. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no wall, no scenery and no shadow under the feet.
  ```

### 26. `tests/backdrop-r01-door-lift.t26.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 1101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 82, 278 KB
- References: none
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Review fix, third try at the Backdrop slot: t22's wording for the top (its coping landed at about 0.2), t24's for the ground (its wall foot landed at about 0.75), roofs with chimneys only (t24 drew antennas) and a wider gateway with slim jambs. No style key (newest block).
- Review: Ground line right (about y 805), plain walls (2.3 % and 2.7 % ink) and an empty rectangular gateway, but the coping landed at y 250, so windows of the houses behind dip into the top of the zones (10 and 7 busy cells), and the style drifted to a photographic wall on white, not cream. Fails.
- Prompt:

  ```text
  A room backdrop: the old town wall facing a small cobbled square. In the exact centre of the wall is one tall empty rectangular gateway, a third of the picture's width, with slim plain stone jambs and a flat stone lintel just under the top of the wall, running down to the ground. Its door has been taken out: the gateway holds no door, no portcullis, no chains and no pulleys, and through it the passage is plain pale paper. Straight-on frontal elevation at standing eye level, with very weak perspective, like a flat theatre backdrop. The wall runs straight across the whole picture from edge to edge. Its top is a simple stone coping a sixth of the way down; only above it, along the top sixth, do a few baroque house fronts with terracotta roofs and plain chimneys peek over, and the sky is bare paper. The foot of the wall is four fifths of the way down: the cobbled ground is a strip along the bottom fifth only, with large plain flagstones in the middle. To the left and to the right of the gateway, from the gateway out to both edges of the picture and from the coping down to the foot of the wall, the wall is completely plain smooth pale limestone with only faint thin joints: no windows, no doors, no posts, no lamps, no pipes, no chains, no machines, no plants, no water and nothing standing in front of it, because the game draws its moving machine parts there later. Everything is still and at rest: no people, no animals, no vehicles, no moving parts, no flames, no smoke, no steam. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 27. `tests/housing-r01-door-lift.t27.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 3101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 82, 179 KB
- References: `housing-layout-guide.png`
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Review fix, third try at the housing: words placed the columns too close (t23) and then too far apart (t25), so this one follows a flat layout guide drawn from src/art/scene-zones.ts (tests/housing-layout-guide.png: columns x 560-600 and 1000-1040, crossbeam y 80-160, feet down to y 850, in scene units) through the edit endpoint.
- Review: Best housing. The layout guide placed the frame within about 7 units of every mount point (columns at about x 553–600 and 995–1040, crossbeam y 65–160, feet to y 850), with the pan zones and dial ground clean apart from the edges. Fails narrowly: the column edges cross into the left pan zone and the opening by 5–7 units, two copper fittings hang from the brackets into the opening, and a watercolour ground wash under the feet must go in the cut-out step. Paper grain from the edit endpoint, as expected.
- Prompt:

  ```text
  Image 1 is a flat layout guide, not a drawing to copy. Redraw it as the finished housing described below, keeping every shape exactly where it is and exactly its size: the two columns, the crossbeam, the two small brackets under it and the two feet. Everything that is plain cream in image 1 stays plain empty cream paper. Do not keep its flat grey fill or its plain outlines. A machine housing for a game, drawn on its own: the frame of a counterweight door lift. Two slim riveted iron columns, joined at the top by a heavy polished brass crossbeam with two small empty brass axle brackets on its underside. Each column stands on a small square stone foot with a brass cap. Small details: rivets and oil cups. Straight-on frontal elevation, symmetrical, with no perspective. The opening between the columns holds nothing: no door, no gate, no beam, no pans, no weights, no chains, no pulleys, no gears and no dials, only plain flat cream paper. At rest: no motion, no steam, no smoke. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no ground line, no wall, no scenery and no shadow under the feet.
  ```

### 28. `tests/backdrop-r01-door-lift.t28.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 1101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 76, 293 KB
- References: `backdrop-layout-guide.png`
- Style block: v4
- Date: 2026-11-05
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Review fix, fourth try at the Backdrop slot: words left the wall top up to 150 units and the ground line up to 70 units off in t22, t24 and t26, so this one follows a flat layout guide drawn from src/art/scene-zones.ts (tests/backdrop-layout-guide.png: roofs only above y 200, wall to y 800, gateway x 560-1040 with its passage x 600-1000, in scene units) through the edit endpoint, as t27 did for the housing.
- Review: The guide held the top band (the roofs end at y 200) and the walls stayed plain (the right pan zone passes), but the gateway became a deep, dark-framed reveal (opening 11.4 % ink), the ground line still landed near y 730, the cobbles under the dial are dense (16.8 %) and the paper has grain. Fails.
- Prompt:

  ```text
  Image 1 is a flat layout guide, not a drawing to copy. Redraw it as the finished backdrop described below, keeping every area exactly where it is and exactly its size: the row of house fronts and roofs along the top, the top of the wall, the gateway with its jambs and lintel, the empty passage, the foot of the wall and the ground. Where image 1 shows plain wall, the wall stays plain. Do not keep its flat fills or its plain outlines. A room backdrop: the old town wall facing a small cobbled square, with one tall empty rectangular gateway in its centre. The gateway's door has been taken out: it holds no door, no portcullis, no chains and no pulleys, and through it the passage is plain pale paper. Straight-on frontal elevation at standing eye level, with very weak perspective, like a flat theatre backdrop. Baroque house fronts with terracotta roofs and plain chimneys peek over the top of the wall, and the sky is bare paper. Left and right of the gateway, the wall is completely plain smooth pale limestone with only faint thin joints: no windows, no doors, no posts, no lamps, no pipes, no chains, no machines, no plants, no water and nothing standing in front of it, because the game draws its moving machine parts there later. The ground is cobbles with large plain flagstones in the middle. Everything is still and at rest: no people, no animals, no vehicles, no moving parts, no flames, no smoke, no steam. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

## Derived images

Made from a test image by a tool in `art-src/tools/`, not generated, so they count toward
nothing. Each names its source and the exact command.

### 22-refit. `tests/backdrop-r01-door-lift.t22-refit.webp`

- Source: `tests/backdrop-r01-door-lift.t22.webp` (entry 22)
- Tool: `node art-src/tools/refit.mjs art-src/tests/backdrop-r01-door-lift.t22.webp art-src/tests/backdrop-r01-door-lift.t22-refit.webp --y 0,200,730,1000:0,200,800,1000`
- Saved as WebP 1600 × 1000, quality 76, 249 KB
- Date: 2026-11-06
- Origin and licence: as entry 22
- Notes: Story 2.12, the template backdrop. t22 put the wall's foot at about y 730; the refit keeps the top band as it is, stretches the wall (y 200–730) to y 200–800 and squeezes the ground (y 730–1000) into y 800–1000.
- Review: Passes the overlay check: pan zones 0.9 % ink and no busy cell each, opening 2.7 % (max 3) with no busy cell, dial ground 9.0 % (max 12). The grey preview reads by value alone, all four corners are empty, and under the live room-1 scale at x = 1 and x = 10 the pans, pieces and tags sit on plain wall and the stand in the gateway (`tests/backdrop-r01-door-lift.t22-refit.mock-x1.webp` and `…mock-x10.webp`, from `art-src/tools/scene-mock.mjs` on the grey preview; mocks, not images, so they count toward nothing). Left as they are: paper fibres from t22, a thin cord above the keystone and a faint construction rectangle on the right wall, all too light to count. The arch's jambs stand just inside the opening, so the check passes there with little margin.

### 29. `tests/town-square-ink.t29.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 7101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 52, 294 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town slice style test (2026-11-07): ink-and-watercolour v4 against pixel art px1, same subject and seed, isometric.
- Review: Good isometric square and the style test Luka is shown. Drew the lamps lit and the fountain running although the prompt said still; no workshop. Superseded by t33, edited from it.
- Prompt:

  ```text
  A small town square in the lower district of a gear-and-steam city, as the opening area of an adventure game. Cobbled streets meet at a square with a dry round stone fountain in the middle. On the north side runs the old town wall with a tall heavy oak-and-iron gate, closed, that is lifted by a counterweight machine: chains run up from the gate over two big pulley wheels on a beam above it. Along the east street stand four tall cast-iron oil street lamps with brass lanterns, unlit. In the west corner stands the inventor's workshop: a narrow two-storey house with a big round window and a brass weathervane, its door ajar. Plastered town houses with green shutters and terracotta roofs line the streets; a few crates and barrels, a bench, a tree in a stone planter. Isometric game view: classic 2:1 dimetric projection looking down at about thirty degrees from the south, parallel lines with no vanishing point, like the map of a top-down adventure game. The square and its streets fill the whole picture edge to edge. The cobbled ground is large open walkable space in the middle, with the buildings around the edges. Everything is at one scale: a house is about a sixth of the picture's width. Everything is still: no people, no animals, no vehicles, no smoke, no steam, no light from the lamps. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 30. `tests/town-square-pixel.t30.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 7101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 70, 289 KB
- References: none
- Style block: px1
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town slice style test (2026-11-07): ink-and-watercolour v4 against pixel art px1, same subject and seed, isometric.
- Review: Style test only: pixel art, the same subject and seed. Reads well and has the workshop, but a stray digit on the wall and lamps lit. Not used unless Luka picks pixel art.
- Prompt:

  ```text
  A small town square in the lower district of a gear-and-steam city, as the opening area of an adventure game. Cobbled streets meet at a square with a dry round stone fountain in the middle. On the north side runs the old town wall with a tall heavy oak-and-iron gate, closed, that is lifted by a counterweight machine: chains run up from the gate over two big pulley wheels on a beam above it. Along the east street stand four tall cast-iron oil street lamps with brass lanterns, unlit. In the west corner stands the inventor's workshop: a narrow two-storey house with a big round window and a brass weathervane, its door ajar. Plastered town houses with green shutters and terracotta roofs line the streets; a few crates and barrels, a bench, a tree in a stone planter. Isometric game view: classic 2:1 dimetric projection looking down at about thirty degrees from the south, parallel lines with no vanishing point, like the map of a top-down adventure game. The square and its streets fill the whole picture edge to edge. The cobbled ground is large open walkable space in the middle, with the buildings around the edges. Everything is at one scale: a house is about a sixth of the picture's width. Everything is still: no people, no animals, no vehicles, no smoke, no steam, no light from the lamps. Pixel art game graphics like a 16-bit era adventure game: crisp hand-placed square pixels, a limited palette of about 32 colours, clean dark outlines, simple dithered shading, no anti-aliasing blur, no gradients, no painterly texture. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), cobbles and walls in warm greys, leafy greens for trees; brass and copper are the most saturated colours. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere.
  ```

### 31. `tests/person-penkala.t31.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5100
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 156 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town slice townsperson (story 5.0), the looks' template.
- Review: Good. Penkala with the Book, cap and moustache; the pencil behind the ear is missing. Cut out with tools/cutout.mjs for the town.
- Prompt:

  ```text
  A game character: Gospon Penkala, a tram conductor in his fifties, a stout man standing stiffly and clutching a thick worn leather-bound rule book to his chest with both hands. A dark blue conductor's uniform jacket with two rows of brass buttons, a peaked conductor's cap, round wire spectacles, a neat grey moustache, a yellow pencil tucked behind one ear, a brass ticket punch on a chain at his belt, polished black boots. A simple picture-book face with small dark dot eyes and a doubtful, raised-eyebrow look; dry and a little comic, never mean. Slightly stylised proportions, the head about one sixth of the height; not chibi. Full-body three-quarter view at eye level, with little perspective. The figure is centred and fills about nine tenths of the picture's height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 32. `tests/person-nikola.t32.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5200
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 96 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town slice townsperson (story 5.0), the looks' template.
- Review: Good. Nikola with the lamplighter’s pole. Cut out for the town.
- Prompt:

  ```text
  A game character: Nikola, the lamplighter's son, an eager eight-year-old boy standing on tiptoe, holding a long thin brass lamplighter's pole with a small hook at the top, taller than himself. An oversized grey flat cap, a patched brown wool coat a size too big with rolled sleeves, short trousers, knee socks and scuffed boots, a small oil can hanging from his belt. Short dark hair, light skin. A simple picture-book face with small dark dot eyes and an excited open smile. Slightly stylised proportions of a real eight-year-old, the head about one fifth of the height; not chibi. Full-body three-quarter view at eye level, with little perspective. The figure is centred and fills about nine tenths of the picture's height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 33. `tests/town-square.t33.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 7102
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 52, 298 KB
- References: `town-square-ink.t29.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town slice: the square for the game, edited from t29 so positions hold (story 5.0).
- Review: Used: src/ui/town/art/square.webp. The edit kept every position of t29; lamps unlit, fountain dry, a brass-knocker door at the left for the workshop (no round window). Warmer colours, as asked.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, streets, ground, scale and drawing style. Change only what follows. All five street lamps are unlit: their glass is plain, cold and dark, with no light, no glow and no flame. The fountain in the middle is dry: an empty stone basin and a dry spout, with no water at all. The small arched wooden door in the wall at the far left becomes the front of the inventor's workshop: a narrow tall door of dark wood with a brass gear-shaped knocker, a large round window above it, and a small blank brass plate beside it. The colours are a little richer and warmer: honey-coloured limestone, warm terracotta roofs, gleaming brass and copper on the gate machine. Everything is still: no people, no animals, no smoke, no steam. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 34. `tests/town-square-gate-open.t34.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 7103
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 58, 299 KB
- References: `town-square.t33.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town slice: the square after room 1, the gate raised (story 5.0).
- Review: Used: src/ui/town/art/square-gate-open.webp. Same layout as t33 with the gate raised, the counterweights down and the road through the arch.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, streets, ground, scale and drawing style. Change only what follows. The big double gate in the town wall is now lifted open: both wooden gate leaves are raised high up inside the archway, hanging from their taut chains, and through the open archway a cobbled road leads on beyond the wall. The counterweights on the chains hang low. Everything is still: no people, no animals, no smoke, no steam. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 35. `tests/opening-1-city.t35.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 7201
- Generated at 1920 × 1080 PNG; saved as WebP 1600 × 893, quality 52, 290 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town slice opening panel (story 5.0).
- Review: Used: opening panel 1. A lively isometric city; small figures and steam are allowed here (the opening, not a room).
- Prompt:

  ```text
  Satograd, a city of gears and steam on a river, seen from above: tiled roofs, stone bridges, chimneys with thin plumes, big brass gear wheels turning on towers, a water wheel, a tram on rails, a clock tower on a hill. Morning light, busy and alive, everything running. High isometric bird's-eye view, parallel projection. The city fills the picture edge to edge. Calm, small plumes of steam are allowed. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 36. `tests/opening-2-book.t36.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 7202
- Generated at 1920 × 1080 PNG; saved as WebP 1600 × 893, quality 76, 287 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town slice opening panel (story 5.0).
- Review: Used: opening panel 2. The Book on its lectern; a light bulb on a shelf and a scribble on a wall card slipped through.
- Prompt:

  ```text
  The inside of an inventor's workshop: shelves full of small notebooks, gears and tools on the walls, a big round window. On a tall wooden lectern in the middle lies a huge thick rule book, open, its pages full of tiny step-by-step diagrams of machines drawn as plain lines with no writing. Isometric three-quarter view from above into the room, parallel projection. The lectern and the book are the centre of the picture. Warm and tidy, at rest, nobody there. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 37. `tests/opening-3-empty.t37.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 7203
- Generated at 1920 × 1080 PNG; saved as WebP 1600 × 893, quality 76, 277 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town slice opening panel (story 5.0).
- Review: Used: opening panel 3, shown grey. Strong; a light bulb, a clock face and pseudo-letters on papers slipped through, small at panel size.
- Prompt:

  ```text
  The same inventor's workshop, abandoned in a hurry: the chair knocked over, papers and notebooks scattered on the floor, the door hanging open, a lamp on its side, the big rule book still on its lectern. A long curling strip of blank punched paper tape lies across the floorboards. Outside the round window, the city's machines stand still. Isometric three-quarter view from above into the room, parallel projection. The empty room, with the paper tape leading to the open door. Still and quiet, nobody there, no smoke. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 38. `tests/opening-4-notebook.t38.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 7204
- Generated at 1920 × 1080 PNG; saved as WebP 1600 × 893, quality 82, 239 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town slice opening panel (story 5.0).
- Review: Used: opening panel 4. The notebook and the reaching hand, as asked.
- Prompt:

  ```text
  A small worn leather notebook with a brass clasp lies alone on old wooden floorboards, next to a stub of pencil, among scattered loose pages. A child's hand reaches in from the edge of the picture to pick it up. Close view from above at a slight angle. The notebook in the centre, large. Still and quiet. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 39. `tests/town-canal.t39.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 7301
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 70, 288 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town slice, second area: the lower town canal with room 3's sluice gate (story 5.1).
- Review: Used: src/ui/town/art/canal.webp, the canal street behind the gate (story 5.1). Lamps drawn lit, which fits: room 2 lights them before the canal opens.
- Prompt:

  ```text
  The lower town of a gear-and-steam city, as the second area of an adventure game, just inside the old town wall. A stone-walled canal runs diagonally across the middle of the picture. A heavy wooden sluice gate in an iron frame closes the canal, with a toothed iron rack and a large brass handwheel on top; behind the gate the water stands high and still, in front of it the channel is almost dry with wet stones. A wide cobbled quay runs along the near side of the canal, with an iron railing, a stone stair down to the water and two cast-iron oil street lamps with brass lanterns, unlit. In the bottom-left corner the inner side of the town wall with an open arched gateway, the way back to the square. On the far side of the canal, plastered houses with green shutters and terracotta roofs; at the top-right a narrow cobbled lane leads away uphill towards a big wooden water wheel on a mill house. Isometric game view: classic 2:1 dimetric projection looking down at about thirty degrees from the south, parallel lines with no vanishing point, like the map of a top-down adventure game. The scene fills the whole picture edge to edge. The cobbled quay is large open walkable space across the lower half, with the canal and the buildings beyond it. Everything is at one scale: a house is about a sixth of the picture's width. Everything is still: no people, no animals, no vehicles, no smoke, no steam, no light from the lamps, no flowing water. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 40. `tests/look-2.t40.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5000
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 117 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Look redrawn for a Croatian town (Luka, 2026-11-07): same outfit, new skin and hair; the template of t14.
- Review: Used: look 2 (src/ui/naming/looks). Fair, freckled, light-brown curls; same outfit as t15.
- Prompt:

  ```text
  A game character: a young apprentice inventor, an eleven-year-old child, standing in a relaxed pose and holding a small worn notebook against the chest with both hands. Fair skin with a few freckles, short light-brown curly hair, round wire-rimmed glasses, blue-grey work overalls with rolled cuffs and a patched knee, a leather tool belt with a few small tools, sturdy boots. A simple picture-book face with small dark dot eyes, no eyelashes, a small nose and a calm, curious half-smile. Slightly stylised proportions of a real eleven-year-old, the head about one sixth of the height; not chibi. Full-body three-quarter view at the child’s eye level, with little perspective. The figure is centred and fills about nine tenths of the picture’s height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 41. `tests/look-4.t41.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5000
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 192 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Look redrawn for a Croatian town (Luka, 2026-11-07): same outfit, new skin and hair; the template of t14.
- Review: Used: look 4. Fair, blond, the aviator cap and satchel of t17. The paper ground is grainier; the cutout clears it.
- Prompt:

  ```text
  A game character: a young apprentice inventor, an eleven-year-old child, standing in a relaxed pose and holding a small worn notebook against the chest with both hands. Fair skin, short straight blond hair under a leather aviator cap with ear flaps and brass goggles, a chunky grey knitted jumper with patched elbows, a canvas satchel across the body, dark trousers and boots. A simple picture-book face with small dark dot eyes, no eyelashes, a small nose and a calm, curious half-smile. Slightly stylised proportions of a real eleven-year-old, the head about one sixth of the height; not chibi. Full-body three-quarter view at the child’s eye level, with little perspective. The figure is centred and fills about nine tenths of the picture’s height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 42. `tests/look-5.t42.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5000
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 123 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Look redrawn for a Croatian town (Luka, 2026-11-07): same outfit, new skin and hair; the template of t14.
- Review: Rejected: kept black hair; redrawn as t44.
- Prompt:

  ```text
  A game character: a young apprentice inventor, an eleven-year-old child, standing in a relaxed pose and holding a small worn notebook against the chest with both hands. Fair skin, straight dark-blonde hair in a short bowl cut with a blunt fringe, a high-collared slate-blue work smock with copper buttons, fingerless gloves, a canvas satchel, grey trousers and boots. A simple picture-book face with small dark dot eyes, no eyelashes, a small nose and a calm, curious half-smile. Slightly stylised proportions of a real eleven-year-old, the head about one sixth of the height; not chibi. Full-body three-quarter view at the child’s eye level, with little perspective. The figure is centred and fills about nine tenths of the picture’s height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 43. `tests/look-6.t43.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5000
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 170 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Look redrawn for a Croatian town (Luka, 2026-11-07): same outfit, new skin and hair; the template of t14.
- Review: Used: look 6. Light olive skin, dark-brown hair; the outfit of t19.
- Prompt:

  ```text
  A game character: a young apprentice inventor, an eleven-year-old child, standing in a relaxed pose and holding a small worn notebook against the chest with both hands. Light olive skin, short dark-brown hair, an oversized rust-coloured work jacket with brass buttons and rolled sleeves, a red neckerchief, a small wrench in the jacket pocket, patched trousers and boots. A simple picture-book face with small dark dot eyes, no eyelashes, a small nose and a calm, curious half-smile. Slightly stylised proportions of a real eleven-year-old, the head about one sixth of the height; not chibi. Full-body three-quarter view at the child’s eye level, with little perspective. The figure is centred and fills about nine tenths of the picture’s height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 44. `tests/look-5.t44.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5001
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 173 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Look redrawn for a Croatian town (Luka, 2026-11-07): same outfit, new skin and hair; the template of t14. Retry: t42 kept black hair.
- Review: Used: look 5. Light-brown bob; the smock and satchel of t18.
- Prompt:

  ```text
  A game character: a young apprentice inventor, an eleven-year-old child, standing in a relaxed pose and holding a small worn notebook against the chest with both hands. Fair skin with rosy cheeks, light-brown hair in a short straight bob with a side parting, a high-collared slate-blue work smock with copper buttons, fingerless gloves, a canvas satchel, grey trousers and boots. A simple picture-book face with small dark dot eyes, no eyelashes, a small nose and a calm, curious half-smile. Slightly stylised proportions of a real eleven-year-old, the head about one sixth of the height; not chibi. Full-body three-quarter view at the child’s eye level, with little perspective. The figure is centred and fills about nine tenths of the picture’s height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 45. `tests/town-mill.t45.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 7401
- Generated at 1920 × 1200 PNG; saved as WebP 1440 × 900, quality 58, 289 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town, third area: the mill yard with room 4's water wheel (story 5.2).
- Review: Used: src/ui/town/art/mill.webp, the mill yard with room 4’s wheel (story 5.2). A thin trickle under the wheel slipped through.
- Prompt:

  ```text
  The mill yard of a gear-and-steam city, as an area of an adventure game. A big stone mill house with a terracotta roof stands at the top of the picture; against its side a large wooden overshot water wheel with wooden buckets and an iron hub, fed by a long wooden chute that comes from the canal at the top-left; the wheel is stopped and the chute is dry. A brass gear housing and copper pipes on the mill wall by the hub. A wide cobbled yard fills the lower half: a few sacks and crates, a millstone leaning on a wall, a bench, a small tree. In the bottom-left corner a cobbled path runs off along the canal wall, the way back to the canal. Plastered houses with green shutters at the right edge. Isometric game view: classic 2:1 dimetric projection looking down at about thirty degrees from the south, parallel lines with no vanishing point, like the map of a top-down adventure game. The scene fills the whole picture edge to edge. The cobbled yard is large open walkable space across the lower half. Everything is at one scale: a house is about a sixth of the picture's width. Everything is still: no people, no animals, no vehicles, no smoke, no steam, no flowing or splashing water, the wheel stopped. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 46. `tests/town-bridge.t46.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 7501
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 64, 297 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town area (story 5.3).
- Review: Rejected: a photoreal 3D render with a watermark, air conditioners and clock faces. Redrawn as t49 with the square as a style reference.
- Prompt:

  ```text
  A river street of a gear-and-steam city, as an area of an adventure game. A slow river crosses the top half of the picture. Over it, a stone-and-iron bridge whose deck hangs from a beam of brass counterweights and chains: under the deck, big iron weights hang on chains in a frame, stopped. A wide cobbled quay on the near side, with two cast-iron oil street lamps with brass lanterns, a bench and some crates. A street enters from the bottom-left corner, the way back to the square. At the right edge, a narrow dark alley between two houses with heaps of scrap metal and salvaged lamp parts, where an automaton hides. Plastered houses with green shutters and terracotta roofs along the far bank. Isometric game view: classic 2:1 dimetric projection looking down at about thirty degrees from the south, parallel lines with no vanishing point, like the map of a top-down adventure game. The scene fills the whole picture edge to edge. The cobbled ground is large open walkable space across the lower half. Everything is at one scale: a house is about a sixth of the picture's width. Everything is still: no people, no animals, no vehicles, no smoke, no steam, no flowing or splashing water. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 47. `tests/town-yard.t47.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 7601
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 46, 283 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town area (story 5.3).
- Review: Used: src/ui/town/art/yard.webp, the weighing yard with room 6’s balance and the logbook house (room 7). A small sign with pseudo-letters at the top right.
- Prompt:

  ```text
  The weighing yard of a gear-and-steam city, as an area of an adventure game. In the middle, a big platform weighbridge set into the cobbles, with a tall brass balance beam on an iron post beside it and a rack of iron weights; stacks of crates and sacks waiting to be weighed. At the left side, an old narrow stone house with a heavy wooden door studded with iron and a small barred window: the archive where the old logbook is kept; a blank brass plate by the door. A cobbled lane enters from the bottom-left corner, the way back to the mill. Warehouses with big wooden doors at the back. Isometric game view: classic 2:1 dimetric projection looking down at about thirty degrees from the south, parallel lines with no vanishing point, like the map of a top-down adventure game. The scene fills the whole picture edge to edge. The cobbled ground is large open walkable space across the lower half. Everything is at one scale: a house is about a sixth of the picture's width. Everything is still: no people, no animals, no vehicles, no smoke, no steam, no flowing or splashing water. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 48. `tests/person-faust.t48.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5300
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 195 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town townsperson (story 5.3): Faust, the old mechanic.
- Review: Used: Faust, cut out for the square after room 6.
- Prompt:

  ```text
  A game character: Faust, an old mechanic in his seventies, standing calmly with one hand in an apron pocket and the other holding a big brass oil can. A long leather work apron over a collarless striped shirt with rolled sleeves, a flat grey cap, round brass-rimmed spectacles pushed up on his forehead, a short white beard, thick forearms, worn boots. A simple picture-book face with small dark dot eyes and a calm, knowing half-smile. Slightly stylised proportions, the head about one sixth of the height; not chibi. Full-body three-quarter view at eye level, with little perspective. The figure is centred and fills about nine tenths of the picture's height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 49. `tests/town-bridge.t49.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 7502
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 70, 295 KB
- References: `town-square.t33.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town area (story 5.3). Retry: t46 came out as a photoreal render with a watermark.
- Review: Used: src/ui/town/art/bridge.webp, the bridge street (room 5) with the scrap alley for the armour-30 automaton. Grainier than the square, still close in style.
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink linework, hatching, watercolour washes, palette and isometric camera. Do not copy its subject. A river street of a gear-and-steam city, as an area of an adventure game. A slow river crosses the top half of the picture. Over it, a stone-and-iron bridge whose deck hangs from a beam of brass counterweights and chains: under the deck, big iron weights hang on chains in a frame, stopped. A wide cobbled quay on the near side, with two cast-iron oil street lamps with brass lanterns, a bench and some crates. A street enters from the bottom-left corner, the way back to the square. At the right edge, a narrow dark alley between two houses with heaps of scrap metal and salvaged lamp parts, where an automaton hides. Plastered houses with green shutters and terracotta roofs along the far bank. Isometric game view: classic 2:1 dimetric projection looking down at about thirty degrees from the south, parallel lines with no vanishing point, like the map of a top-down adventure game. The scene fills the whole picture edge to edge. The cobbled ground is large open walkable space across the lower half. Everything is at one scale: a house is about a sixth of the picture's width. Everything is still: no people, no animals, no vehicles, no smoke, no steam, no flowing or splashing water. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 50. `tests/town-tram.t50.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 7701
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 64, 283 KB
- References: `town-square.t33.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town area (story 5.4), with the square as style reference.
- Review: Used: tram depot (room 8). Painted a small robot in the alley, used as the armour-45 automaton’s spot; a route number on the tram.
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink linework, hatching, watercolour washes, palette and isometric camera. Do not copy its subject. A tram depot of a gear-and-steam city, as an area of an adventure game. A small wooden tram car with brass trim stands still on rails in front of a depot shed with a big arched door; above the rails a gear-driven cable drum with a row of big gears and a long chain belt running along the street. A cobbled platform with a waiting bench and a blank timetable board. A lane enters from the bottom-left corner. At the right edge, a dark gap behind the shed with a heap of scrap where an automaton hides. Isometric game view: classic 2:1 dimetric projection looking down at about thirty degrees from the south, parallel lines with no vanishing point, like the map of a top-down adventure game. The scene fills the whole picture edge to edge. The cobbled ground is large open walkable space across the lower half. Everything is at one scale: a house is about a sixth of the picture's width. Everything is still: no people, no animals, no smoke, no steam, no flowing water; every machine stopped. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 51. `tests/town-lift.t51.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 7801
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 64, 288 KB
- References: `town-square.t33.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town area (story 5.4), with the square as style reference.
- Review: Used: steam lift pier (room 9). Two gauges look like clock faces.
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink linework, hatching, watercolour washes, palette and isometric camera. Do not copy its subject. The foot of a low cliff in a gear-and-steam city, as an area of an adventure game. A steam lift: an iron cage on rails runs up the cliff face, with a boiler, pistons and pressure valves at its foot, its gate sealed with a heavy chain and a padlock. A cobbled landing in front, with crates and a pressure gauge on a post. Stone steps lead down from the bottom-left corner, the way back to the canal. Houses on top of the cliff. Isometric game view: classic 2:1 dimetric projection looking down at about thirty degrees from the south, parallel lines with no vanishing point, like the map of a top-down adventure game. The scene fills the whole picture edge to edge. The cobbled ground is large open walkable space across the lower half. Everything is at one scale: a house is about a sixth of the picture's width. Everything is still: no people, no animals, no smoke, no steam, no flowing water; every machine stopped. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 52. `tests/town-market.t52.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 7901
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 58, 297 KB
- References: `town-square.t33.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town area (story 5.4), with the square as style reference.
- Review: Used: Getaldićev trg, the market (room 10).
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink linework, hatching, watercolour washes, palette and isometric camera. Do not copy its subject. Getaldić Square, the market square of a gear-and-steam city, as an area of an adventure game. Market stalls with striped awnings, crates of vegetables, baskets, sacks, and in the middle a big public balance scale on a brass column with two large pans. A cobbled open square, a well, plastered houses with green shutters and terracotta roofs around it. A street enters from the bottom-left corner. Isometric game view: classic 2:1 dimetric projection looking down at about thirty degrees from the south, parallel lines with no vanishing point, like the map of a top-down adventure game. The scene fills the whole picture edge to edge. The cobbled ground is large open walkable space across the lower half. Everything is at one scale: a house is about a sixth of the picture's width. Everything is still: no people, no animals, no smoke, no steam, no flowing water; every machine stopped. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 53. `tests/town-wheel.t53.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 8001
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 58, 284 KB
- References: `town-square.t33.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town area (story 5.4), with the square as style reference.
- Review: Used: the great wheel (room 11). A sign with pseudo-letters at the top left.
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink linework, hatching, watercolour washes, palette and isometric camera. Do not copy its subject. A riverside terrace of a gear-and-steam city with a great wheel, as an area of an adventure game: a giant spoked iron-and-brass wheel, taller than the houses, standing in a stone frame by the river, with a huge gear train at its hub and counterweights. A wide cobbled terrace in front with an iron railing. A street enters from the bottom-left corner; another lane leads up a hill at the top-right. Isometric game view: classic 2:1 dimetric projection looking down at about thirty degrees from the south, parallel lines with no vanishing point, like the map of a top-down adventure game. The scene fills the whole picture edge to edge. The cobbled ground is large open walkable space across the lower half. Everything is at one scale: a house is about a sixth of the picture's width. Everything is still: no people, no animals, no smoke, no steam, no flowing water; every machine stopped. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 54. `tests/town-hill.t54.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 8101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 76, 287 KB
- References: `town-square.t33.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town area (story 5.4), with the square as style reference.
- Review: Used: the hill, linked machines (room 12) and the clock tower with its drum (room 13); a huge automaton painted in the back room is the armour-60 spot. A light bulb slipped through.
- Prompt:

  ```text
  Match the drawing style of image 1 exactly: the same ink linework, hatching, watercolour washes, palette and isometric camera. Do not copy its subject. The hilltop of a gear-and-steam city, as an area of an adventure game. On the left, a junction of three linked machines: gear trains, shafts and belts joining three brass housings on a stone platform. On the right, a tall stone clock tower with a big recording drum mechanism visible through an open arch at its foot, and no clock face, the dial plate blank. A cobbled hilltop square between them, a low wall and a view over roofs. A path comes up from the bottom-left corner. At the far right edge, behind the tower, a shadowed corner with scrap where a huge automaton waits. Isometric game view: classic 2:1 dimetric projection looking down at about thirty degrees from the south, parallel lines with no vanishing point, like the map of a top-down adventure game. The scene fills the whole picture edge to edge. The cobbled ground is large open walkable space across the lower half. Everything is at one scale: a house is about a sixth of the picture's width. Everything is still: no people, no animals, no smoke, no steam, no flowing water; every machine stopped. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 55. `tests/town-tram-clean.t55.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 8201
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 64, 300 KB
- References: `town-tram.t50.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an edit of an area picture (story 5.5).
- Review: Used: the tram depot, cleaned (no painted robot, blank signs); same layout as t50.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. Remove the small robot figure in the dark gap at the top right, leaving only the heap of scrap there. Remove the number and any letters on the tram's sign and the timetable boards, leaving them blank. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 56. `tests/town-wheel-clean.t56.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 8301
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 52, 293 KB
- References: `town-wheel.t53.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an edit of an area picture (story 5.5).
- Review: Used: the great wheel, signs blank; same layout as t53.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. Remove all letters from the signs at the top left, leaving the signboards blank. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 57. `tests/town-hill-clean.t57.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 8401
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 70, 278 KB
- References: `town-hill.t54.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an edit of an area picture (story 5.5).
- Review: Used: the hill, cleaned (no bulb, no painted automaton); same layout as t54.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. Remove the light bulb hanging at the top right, and remove the huge rusty automaton figure in the dark room at the right, leaving a heap of scrap there. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 58. `tests/town-canal-open.t58.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 8501
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 64, 292 KB
- References: `town-canal.t39.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an edit of an area picture (story 5.5).
- Review: Used: the canal after room 3, the sluice open and the water through.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. The sluice gate is now raised high in its frame, and the canal water flows through the open gateway: the channel in front of the gate is now full of moving water with small ripples and foam. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 59. `tests/town-mill-running.t59.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 8601
- Generated at 1920 × 1200 PNG; saved as WebP 1440 × 900, quality 58, 298 KB
- References: `town-mill.t45.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an edit of an area picture (story 5.5).
- Review: Rejected (Luka: "makes no sense"): the wheel drawn glassy and blurred, water from nowhere. Redrawn as t67.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. Water now pours down the wooden chute onto the top of the water wheel, filling its buckets and splashing off them, and a little steam rises from the copper pipe; the wheel is turning. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 60. `tests/town-bridge-down.t60.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 8701
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 64, 288 KB
- References: `town-bridge.t49.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an edit of an area picture (story 5.5).
- Review: Used: the bridge after room 5, deck down, weights low.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. The bridge deck is now level and complete, resting on its piers, and the big counterweights hang low and still near the water, the chains taut. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 61. `tests/town-lift-up.t61.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 8801
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 64, 283 KB
- References: `town-lift.t51.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an edit of an area picture (story 5.5).
- Review: Used: the lift after room 9, cage up, gate open.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. The lift cage has risen to the top of the cliff, the gate at its foot stands open with the chain and padlock lying on the ground, and a thin plume of steam rises from the boiler. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 62. `tests/town-market-level.t62.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 8901
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 52, 287 KB
- References: `town-market.t52.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an edit of an area picture (story 5.5).
- Review: Used: the market after room 10, the scale level.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. The big brass balance scale in the middle is now level, both pans at the same height, each holding a sack of grain. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 63. `tests/town-yard-level.t63.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 9001
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 52, 283 KB
- References: `town-yard.t47.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an area's machine running (story 6.3).
- Review: Used: the yard after room 6, the balance level (redrawn as a beam over the platform; doors and racks where they were).
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. The tall brass balance beam beside the weighbridge is now level, with a crate on the platform and a set of iron weights in its pan balancing it exactly. Remove the letters from the small sign at the top right, leaving it blank. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 64. `tests/town-tram-running.t64.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 9101
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 64, 283 KB
- References: `town-tram-clean.t55.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an area's machine running (story 6.3).
- Review: Used: the tram after room 8, lights on, pole on the wire.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. The tram's trolley pole now touches the wire above, its lamps glow warmly, its doors are open, and the gears and chain of the cable drum above the depot door are engaged and taut. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 65. `tests/town-wheel-turning.t65.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 9201
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 64, 285 KB
- References: `town-wheel-clean.t56.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an area's machine running (story 6.3).
- Review: Used: the great wheel after room 11, water streaming off it.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. The great wheel is turning: water streams off its lower rim in bright splashes, its gear train is engaged, and the river below shows ripples from it. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 66. `tests/town-hill-running.t66.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 9301
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 70, 287 KB
- References: `town-hill-clean.t57.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an area's machine running (story 6.3).
- Review: Used: the hill after room 13, the machines steaming and the drum’s paper trace running across the square (the drum machine itself left out).
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. The three linked brass machines on the left are running, with thin wisps of steam and engaged gears; the recording drum at the foot of the tower turns with a long strip of paper unrolling from it, drawn with a single straight ink line. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 67. `tests/town-mill-running.t67.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max/edit`
- Seed: 8602
- Generated at 1920 × 1200 PNG; saved as WebP 1600 × 1000, quality 52, 286 KB
- References: `town-mill.t45.png`
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town: an edit of an area picture (story 5.5). Retry: t59 drew the wheel glassy and blurred, with water from nowhere (Luka: makes no sense).
- Review: Used: the mill after room 4: water down the chute onto a solid wheel and out below it.
- Prompt:

  ```text
  Edit image 1. Keep everything exactly as it is: the same composition, camera angle, buildings, ground, scale and drawing style. Change only what follows. Water now runs down the long wooden chute from the canal and spills over its end onto the top of the water wheel, filling the top buckets; a thin stream falls from the lowest buckets into a small stone channel at the foot of the wheel. The wheel itself stays exactly as drawn: solid wooden spokes and buckets, sharp and opaque, not transparent, not blurred, no motion blur. A little steam rises from the copper pipe on the mill wall. No people, no animals. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```

### 68. `tests/person-milka.t68.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5400
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 131 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town townsperson: Milka, the miller, asks for the sluice and the mill wheel.
- Review: Used: Milka, cut out for the canal (before room 3) and the mill.
- Prompt:

  ```text
  A game character: Milka, a sturdy fair-skinned Croatian woman miller in her forties, standing with her hands on her hips, a small cloth sack of flour slung over one shoulder. A headscarf tied at the back over brown hair in a bun, a white blouse with rolled sleeves dusted with flour, a long brown skirt, a wide flour-dusted canvas apron, sturdy boots. A simple picture-book face with small dark dot eyes, rosy cheeks and a determined, friendly look. Slightly stylised proportions, the head about one sixth of the height; not chibi. Full-body three-quarter view at eye level, with little perspective. The figure is centred and fills about nine tenths of the picture's height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 69. `tests/person-vucetic.t69.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5500
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 94 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town townsperson: Stražar Vučetić, the bridge guard, asks for the drawbridge.
- Review: Used: Vučetić, cut out for the bridge.
- Prompt:

  ```text
  A game character: Vučetić, a tall thin fair-skinned Croatian bridge guard in his sixties, standing upright and peering at a small notebook through a brass magnifying glass held in one hand. A long dark green guard's coat with brass buttons and a belt, a stiff round guard's cap with a blank brass badge, a long curled grey moustache, high black boots. A simple picture-book face with small dark dot eyes and a fussy, careful look; dry and a little comic, never mean. Slightly stylised proportions, the head about one sixth of the height; not chibi. Full-body three-quarter view at eye level, with little perspective. The figure is centred and fills about nine tenths of the picture's height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 70. `tests/person-zagorka.t70.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 5600
- Generated at 1024 × 1536 PNG; saved as WebP 1024 × 1536, quality 82, 100 KB
- References: none
- Style block: v4
- Date: 2026-11-07
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town townsperson: Zagorka, the newspaper reporter, asks for the steam lift.
- Review: Used: Zagorka, cut out for the lift and the great wheel. Her newspaper's masthead came out with lettering, too small to read at game size; kept, as the cap is spent.
- Prompt:

  ```text
  A game character: Zagorka, a lively fair-skinned Croatian woman newspaper reporter in her thirties, standing mid-step with a small notepad in one hand and a pencil raised in the other, a folded blank newspaper under her arm. A fitted dark plum jacket over a high-collared white blouse, a long grey skirt, a small brimmed hat with a feather, dark hair pinned up, buttoned ankle boots. A simple picture-book face with small dark dot eyes and a curious, eager look. Slightly stylised proportions, the head about one sixth of the height; not chibi. Full-body three-quarter view at eye level, with little perspective. The figure is centred and fills about nine tenths of the picture's height, with a clear margin on every side. Calm and at rest. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty. Isolated on plain flat cream paper with no ground, no scenery and no shadow.
  ```

### 71. `tests/opening-4-notebook.t71.webp`

- Model: FLUX.2 [max], fal.ai endpoint `fal-ai/flux-2-max`
- Seed: 7204
- Generated at 1920 × 1080 PNG; saved as WebP 1600 × 893, quality 76, 262 KB
- References: none
- Style block: v4
- Date: 2026-11-08
- Origin and licence: AI-generated through the fal.ai API; used under fal.ai’s terms for model outputs
- Notes: Town slice opening panel (story 5.0).
- Prompt:

  ```text
  A small worn leather notebook with a brass clasp lies alone on old wooden floorboards, next to a stub of pencil, among scattered loose pages. No people, no hands, nobody in the picture. Close view from above at a slight angle. The notebook in the centre, large. Still and quiet. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```
- opening-4-notebook.t71 (2026-11-08): regenerated with no hand; the first showed a four-fingered hand (seen in playtest). Replaces src/ui/opening/art/panel-4.webp.
