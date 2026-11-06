# Story 3.4: Torn logbook pages

Status: done

## Story

As Luka's son,
I want the stronger automatons to carry something more than parts,
so that beating them tells me more about Kristijan.

**Covers:** FR42; narrative design, Found Documents.

## Acceptance Criteria

1. **Given** his first win against the armour 30, 45 or 60 automaton, **then** its torn page is returned: the page shows as a card in Kristijan's hand, and is then kept.
2. **And** pages he has can be read again from the map, in story order, and later wins return nothing more.
3. **And** the three pages' text is in `hr.ts`, placeholder until epic 6, and hints at why the First Automaton wants to know why.

## Calls made (for Luka's veto)

- **Returning a page was already in the store** (`settleFight` adds it to `progress.tornPages` on the first win at that lair, in the step that settles the fight; story 3.1's store test covers the first win and a later win that returns nothing). This story shows it and keeps it readable.
- **The page shows by itself over the fight's end, once the win's parts have landed** (1.3 s, so the banner, the "+n" and the counter's tick are seen first), as a dialog: "Automat je nosio otrgnutu stranicu iz dnevnika." and the page, torn along its top, in a handwriting font, signed "— K.". "Zatvori" closes it and leaves the end (and its parts) underneath.
- **The pages live on the map, not in the notebook.** The notebook exists only inside a room, and the pages are lore that opens nothing. A torn-page button shows under the city's log once he has a page; it opens "Otrgnute stranice" with "Pronađeno: 1 od 3" and the pages he has, in story order whatever order he won them in. Pages he doesn't have don't show, so nothing is spoiled.
- **The three pages (placeholders):** the First Automaton asks Kristijan why step three comes before step four and isn't satisfied with "the book says so"; a worn wheel makes the steps stop working while the city keeps following the book, and the automaton knows every step and no reason; "whoever reads this: learn why, not only how". Kristijan writes in the first person; nothing addresses the player in a gendered past tense.
- **The handwriting is the system's** ("Segoe Print", else any cursive) until epic 6's art.
- **With rooms 1–7 only page 1 can be won** (the armour 30 lair hangs off room 5). Pages 2 and 3 need the armour 45 and 60 lairs, beside rooms 8 and 12 (epic 4).

## Dev Agent Record

### Built (main session, `epic-1`)

- `src/ui/pages/TornPages.tsx`, `pages.css`: `TornPage`, `PageReturned` (over the fight's end), `PagesReader` (from the map), `PAGE_ORDER`.
- `src/ui/fight/FightScreen.tsx`: the returned page over the end until closed.
- `src/ui/map/MapScreen.tsx`, `map.css`: the pages button and the reader.
- `src/content/text/hr.ts`: `pages`.

### Review (one pass) and fixes

The review found no blocking bugs: the page shows once, only on a win that returned it, never after a reload, and the dialogs don't fight each other. It found seven issues, all fixed:

1. **The page hid the win's only reward signal:** it opened in the step the fight ended, covering the banner, the "+n" and the counter's tick. It now waits until the parts have landed (`pageDelayMs`, 1.3 s).
2. **"Zato ga muči." read as the Automaton tormenting Kristijan.** Now "Prvi Automat zna sve korake napamet, a nijedan razlog. To ga muči."
3. **Other Croatian:** "me je danas pitao" (the auxiliary), "Knjiga" capitalised as the narrative design does, and "Pronađeno: 1 od 3" instead of "Stranica", which read as a page number.
4. **The pages button overlapped room 13 on a phone.** It sits under the city's log button now.
5. **Focus:** each dialog's "Zatvori" takes the focus, so Enter can't leave the fight behind an unread page.
6. **The reader's "Zatvori" scrolled away on a phone.** Its header is sticky.
7. **The store test's "later win" was guarded by an `if`** and could pass without checking. The same seed now wins again and the test asserts it. The page's show-once logic is a pure helper (`showsPage`) with its own test.

### Tests

- `src/ui/pages/TornPages.test.tsx` (3): one page per armour 30, 45, 60 automaton in story order; the returned page's dialog; the reader in story order with only the pages he has.
- `src/ui/fight/FightScreen.test.tsx` (1 new): the page only once the parts have landed, until read, only when the win returned one; the end and its parts show first.
- `src/ui/map/MapScreen.test.tsx` (1 new): the pages button only once he has a page.
- Returning the page on the first win only: `src/store/fight.test.ts` (story 3.1), `src/fight/settle.test.ts` (the rules).

### Checks

- `npm run check`, `npm test` (2,288 passed, 2 skipped) and `npm run build` pass.
- Headless screenshots at 1280 × 800 and 640 × 360, looked at, after the fixes: a win at the armour 30 lair with its parts first, then page 1, the end after closing it, the map with the pages button, and the reader. No page errors.
