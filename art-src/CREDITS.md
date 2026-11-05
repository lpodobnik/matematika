images generated: 21/30

# Art credits

Every image source in `art-src/` has an entry here: file, origin and licence, and for
AI-generated images the model, prompt, seed and date (architecture, Asset Management). The
count above covers every image generated for the art style guide, retries included; the cap
is 30, with 6 kept in reserve for review fixes.

The test images in `art-src/tests/` explore the style in `_bmad-output/art-bible.md`. They are
not production sources, and `scripts/build-art.ts` must skip `art-src/tests/`.

Each entry was written by `art-src/tools/fal-generate.mjs`, which assembles the prompt from
the art bible's template (per-asset slots, then the fixed style block). The prompt below each
entry is exactly what was sent. "Review" is the verdict after looking at the image.

References name local files that are not in the repository: `<name>.tNN.png` is the
full-size PNG original of `tests/<name>.tNN.webp`, and `style-ref-a.png` is the original of
t01 cropped to 1920 × 1130 to remove its signature. References were sent at about 1 MP as
JPEG data URIs.

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
- Review: Good ink-and-wash look and a quiet centre; became the style anchor. Signed in the bottom-right corner, so the reference copy (style-ref-a.png, not kept) was cropped to 1920 × 1130.
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
- Review: Rejected. Signed with digits, a TV antenna, lamp glass painted lit, heavy paper grain from the edit endpoint. Composition good.
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
- Review: Usable concept. No signature; brass handwheel reads well; quiet centre. Heavy paper grain; a little splash at the gate.
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
- Review: Usable concept. Good wheel and pipework; drew a margin line round the picture and heavy grain.
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
- Review: Better: v3 removed the signature and the antenna. Lantern glass still shows bulb-like shapes; three lamps instead of four; grain remains (edit endpoint).
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
- Review: Good housing: clean opening, a central bracket for the beam pivot, a slot for the dial. Too wide for the backdrop (covers its door and crank) and needs a cut-out; a faint ground line.
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
- Review: Best backdrop. Without a reference, v4 alone matches t01 and t04, with smoother paper and no artefacts.
- Prompt:

  ```text
  A room backdrop: a stone-walled canal lock in the lower town. A heavy wooden sluice gate in an iron frame closes the canal at the left, with a toothed iron rack and a large brass handwheel above it. Behind the gate the water stands high and still; in front of it the channel is almost dry, with wet stones. Stone steps and an iron railing at the right edge. Houses with terracotta roofs behind the far wall. Straight-on frontal elevation at standing eye level, with very weak perspective, like a flat theatre backdrop. The stone quay fills the bottom fifth. The middle of the picture, from about a fifth to four fifths of the width and from a sixth to four fifths of the height, is a plain quiet stretch of canal wall with very little detail, because a machine will be placed in front of it later. Detail sits at the left and right edges and along the top. The sky is bare paper. Everything is still and at rest: no people, no animals, no vehicles, no moving parts, no flowing or splashing water, no smoke, no steam. Unsigned game art, hand-drawn in ink and watercolour like an inventor’s sketch come to life. Fine dark blue-grey ink linework (#3D4B5C) drawn with a technical pen: clean confident outer contours, thinner interior lines, light parallel hatching for shade, a few faint construction lines. Loose transparent watercolour washes inside the lines, flat and calm. Smooth flat cream ground (#F4EFE3) like hot-pressed paper, with no visible paper texture, grain, speckle or stains, and no border, frame or margin line. Palette: polished brass (#B8893A, highlights #E2C07A), warm copper (#B5603A), muted verdigris (#5E9C8F), dark iron (#59616B), weathered wood (#8A6A4A), pale limestone (#D8CFBF), terracotta roof tiles (#B9654A), everything else in soft greys of the ink; colours stay muted, and brass and copper are the most saturated colours in the picture. Soft even daylight from the upper left, gentle shading, no harsh or dramatic lighting. Gear-driven and steam-driven machines in a timeless Central European town with a Croatian character, before electricity: no wires, antennas, light bulbs, cars or other modern objects. Friendly and a little whimsical, like Machinarium, never grim. The image contains no text, no letters, no numbers, no labels, no logo and no clock faces; every dial, plate and sign is blank. No signature, initials, monogram or date anywhere; all four corners are empty.
  ```
