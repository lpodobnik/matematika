# matematika

A Croatian maths puzzle game for one 5th grader, played on an Android tablet. Luka builds it for his son, who playtests it.

- Live: https://lpodobnik.github.io/matematika/ (`?dev` opens the debug tools)
- Branch: work on `epic-1`; `main` deploys.
- Rules and sources: read `_bmad-output/project-context.md` before writing code. It lists the 10 rules agents must not break, and points to the stories, architecture, GDD and narrative.

## What matters most

**Clarity for a 10-year-old comes above everything.** If a 5th grader wouldn't get it, it's wrong, however correct the maths or the code. Reports from the son beat any spec or test.

- Luka judges as a player and a parent. Look at a room on screen before calling it done, and measure a layout bug instead of guessing its cause.
- Teach inside the game. Don't note that something isn't explained; explain it there.
- Explanations in the game must be general, not fitted to one example.
- Luka's own Croatian wording wins, always. Agents' Croatian is weak: use his sentences as given, and read new lines aloud in your head for sense ("šegrt nije u uputama" was not a sentence).

## Shipping

Luka has given standing approval to push every commit, without asking:

```bash
git branch -f main HEAD
git push -q origin main epic-1
node scripts/ci-status.mjs
```

- `scripts/ci-status.mjs` waits for CI and Deploy of `HEAD` and prints any failures from their logs.
- CI fails on formatting, so check before pushing: `npx biome ci . >/dev/null 2>&1; echo $?` must print 0. The one known warning (specificity in `notebook.css`) doesn't fail it. Formatting broke CI after a `sed` edit; Luka gets an email when that happens.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- When he says "pošalji live, onda vrti testove", ship first, then run the browser suite.
- Keep `.claude/` and `_bmad/` untracked. Never print or commit `FAL_KEY`, or the token from `git credential fill`.

## Testing

- `npm test` (Vitest, about 3,000 tests) and `npm run e2e` (Playwright on msedge, tablet 1280×800 and phone 640×360, about 11 minutes). Run e2e in the background.
- Don't edit `src` during an e2e run: reloads make tests such as "a new game" fail falsely. Rerun before believing such a failure.
- e2e starts its own server on 5291. Port 5173 is held by a stuck process that can't be killed ("Access is denied"), so leave it; use the `dev-claude` launch config (5290) or another port.
- **Seed tests from the real path.** Seeding a state past the point in question hides bugs. A test that seeded room 12 as done missed the deadlock of 2026-11-08, where the boss blocked room 12 before he had appeared. For any gate, test the moment before it opens as well as after.
- A quick look at a screen: write a temporary `test-look.mjs` in the repo root with the Write tool (bash heredocs and `node -e` mangle template strings), drive the dev server with `chromium` from `@playwright/test` (channel `msedge`), then delete it. Find the store through the performance entries ending in `/src/store/store.ts`, build a save with `newSave` from `/src/store/persist.ts`, and seed it with `boot/start`.
- `/tmp` from node resolves to `C:\tmp`. Use the session scratchpad.

## How the town works

- One area per street. `area.lair` is the automaton in that street.
- A lair's map node stays `closed` until a neighbouring room is done. An automaton holds a machine only once it is out (`lairIsOut` in `src/ui/town/TownScreen.tsx`).
- Order at the end: room 12 (Kotlovnica), then Nikola announces the boss, then the boss `lair-60` appears Pod tornjem, then room 13 (Toranj) opens once he is beaten, then the ending panels.
- Once any automaton has been beaten, "Udari" first asks how big the strike will be (`src/ui/fight/StrikeGuess.tsx`). A wrong answer costs nothing. It exists because the son mashed dice without thinking.
- Timers and prices are in `src/config/tuning.ts`.

## Saves and links must keep working

The son plays on a live save. Lair and room ids are stored in saves, so they stay stable even when the label changes: `lair-45` now has armour 40 and is called "Automat 40". Save fields join the current version; a new version, with a migration, is only for what an old save can't read. Room links keep old versions readable (`src/links/room-link.ts`).

## Art

- `node art-src/tools/fal-generate.mjs <job.json> "C:/Users/lpodobnik/AppData/Local/Temp/matematika-art-originals"` generates an image on Luka's fal credits, so keep batches small.
- Record every image in `art-src/CREDITS.md`. Its cap is self-imposed: use an image when it's the better fix.
- The `art-src/jobs/*.json` files in git status have never been committed. They only record how images were made, so don't be surprised by them.

## Where things stand (2026-11-08)

Everything is live at commit `2dd6b9b`; CI and Deploy are green, and unit tests pass. Town and fight browser specs passed before the last one-line fix, and the new boss test passes on both screens. The full e2e suite hasn't been rerun since that fix.

Known and not yet asked for:

- overlapping balloons in room 9
- room 11: the flat tilt, and the estimate
- wrong-flag messages that stay silent in rooms 7, 10 and 11
- the tray covering pieces
- the tram's arrival line

`_bmad-output/tekst-za-pregled.md` is Luka's page for reviewing all game text, and it is out of date. Regenerate it before his next review with a temporary Vitest test that walks `hr` from `src/content/text/hr.ts`. Apply his edits from that page when he says so.
