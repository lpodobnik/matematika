# Story 5.6: Rooms for friends

Status: review

## Why

Epic 5's promise (GDD, Room builder; FR44–FR51, NFR5–NFR7): "the pride of a room his friend couldn't crack". He builds a machine at the workshop, proves it by solving it, sends it as a link, and sees on the workshop wall whether the friend cracked it. No server: the whole room travels in the URL fragment.

## Story

As Luka's son,
I want to build a machine at the workshop, solve it myself and send it to a friend as a link,
so that I can see on the workshop wall whether my friend cracked it.

## What a player sees

**Him, in his game**

1. At the workshop (Faust's counter, open after room 6) the upgrades are on top as before; under them is **Napravi stroj** and the **Zid radionice** (the wall), empty at first.
2. **Napravi stroj** opens the builder. He picks a form from those he has met in rooms (buttons such as `ax + b = c`), and sets every number with − / + or by typing (a 2–99; b and d 1–9 999; c 0–9 999). The equation shows large as he sets it. Under it the game says only **"Vaga se može izravnati."** or why not ("x ne bi bio cijeli broj", "x mora biti barem 1", …). It never shows x.
3. **Da bude teže**: the blinds and the planted line he has met (hide the readouts, a short dial, plant a wrong line), each with its price. From room 12 on, **Spoji još jedan stroj** adds a linked machine (up to 3). Its fed number shows as "☐ je rješenje stroja 1".
4. The bill: the cost in parts, what he has, and how many he is short. **Isprobaj i riješi** is on only while the design keeps the rules.
5. He plays the machine in the normal room screen (pad, Balance, the chain, hints, reset). The map button takes him back to the builder with his design kept. When the restart ends he is back in the workshop: **"Stroj radi!"**
6. If he chose a planted line: he taps one of his own lines (not the check line) and changes its numbers with − / + until it says **"Krivi redak je spreman."** (wrong where it stands).
7. He picks a title from the fixed list of 12 and taps **Pošalji**. The parts are paid now (FR46). The link appears with **Podijeli** (the native share sheet, where the browser has one), **Kopiraj**, and the link as selectable text.
8. The room hangs on the wall with its title, its equations and **"Čeka odgovor"**. Each card can show its link again.

**The friend, from the link**

1. **"Stroj za tebe"**: the title, and "Prijatelj ti šalje stroj …". A device with no save of the game also gets "Prvo kratka proba".
2. New to the game: the intro machine, `2x = 6`, with room 1's blanks and handover tags (about a minute). Then **"Sad znaš kako"**, then **Na stroj**.
3. The room: all three ways, a blank page, the usual hint and reset. In place of the map button there is a white flag, **Odustajem**, which asks once ("Pokazati rješenje?").
4. Cracked: **"Stroj radi!"**, the reply link (`#r=<id>.c`) with share and copy, and **Igraj cijelu igru**.
5. Given up: his written solution plays a line at a time under each machine's equation, then the reply link (`#r=<id>.u`) and the same offer.
6. A link that doesn't read shows **"Stroj stiže pokvaren"**.

**Him again**: opening the reply link starts his game, stamps the room **RIJEŠEN** or **NERIJEŠEN** on the wall, opens the counter with "Stigao je odgovor za „…“: RIJEŠEN" (scrolled into view on a phone), and removes `#r=` from the address.

## Calls made (for Luka's veto)

- **Forms met** are the ten that rooms 1–10 show: `x + b = c` (r01), `ax = c` and `x : a = c` (r02), `x − b = c` and `b − x = c` (r03), `ax + b = c` (r04), `x + b = c + d` (r06), `ax − b = c` (r07), `b − ax = c` (r09), `b + ax = c` (r10). `ax = bx + c` is not offered: no room shows x on both sides. A form unlocks when its room is done.
- **Options met**: hidden readouts in room 6, the short dial in room 4 (the first room where Try values can't finish), the planted line in room 7, linked machines in room 12.
- **"Keep the pans still until x is written" is not built.** The room engine has no such blind (`blinds.stillPans` exists only as a type). It is a later step, with its own scene work. **Decorations (3 parts) are not built** either: there is nothing to decorate yet.
- **Limits**: a 2–99 (1 would just be x); b and d 1–9 999; c 0–9 999; x from 1 to 9 999, whole. With a short dial x must be at least 4 notches, so the dial has somewhere to stop.
- **Costs** (FR46): each piece on the pans (an x-gear, a weight, a float or a spring, by form: `2x + 5 = 23` is 2 + 1 + 1 = 4), 5 per blind, 5 for a planted line, 15 per extra machine. Paid on sending. Sending the same room again doesn't charge twice. Built rooms have no pins, so they pay nothing.
- **He can design and solve without the parts**, and sending waits until he has them. The solved room stays in memory while he goes to fight for parts (not over a reload).
- **The game never shows x** in the builder (GDD: "the game calculates nothing for him"). It only says whether the machine can level.
- **The room engine plays built rooms unchanged**: a new `room/enter-spec` action enters a `RoomSpec` that isn't authored. A built room's stages are `solve`, with all three ways, faded to a blank page (as rooms 12–13), the tray's x-gear for forms that take x away, and the `junction` skin. The dial runs to the next ten past x + 3 (5 → 0–10, 9 → 0–20), and goes coarse past 30 notches, ending on a notch. The short dial stops at half of x. The tilt per unit keeps the widest tilt near 14°, as room 11 tunes it.
- **His solution is captured as each machine locks** (`StageLocked`), so linked machines keep every machine's lines. Up to 12 lines a machine and 40 pad characters a line go in a link. A longer solution says so and asks for a shorter one.
- **The planted line is made from his own solution**: he picks one of his lines before the check line and changes its numbers until it is wrong (`check` says `wrong` against the lines before it). The friend gets a find-the-mistake stage, as room 7: his lines up to it, then the wrong one, a line pin, then `x = ☐` and the check line. He solves the plain machine himself. Typing a whole new wrong line on a pad is left for later: changing a number is enough to make it believable, and it is far easier on a tablet.
- **The link format** (`#s=`, version 1): bits, then base64url. Version, title, blinds, the planted flag, the machine count; each machine's form and only the numbers it takes (a in 7 bits, the others in 14); the planted line; each machine's lines, pad characters at 5 bits each. Numbers go in as numbers rather than as token streams (the architecture's wording), because they are shorter and easy to range-check. The largest legal room (3 machines, every blind, a planted line, 12 lines of 40 characters each) is **1,180 characters including the origin**, under NFR7's 2,000. A fixture keeps version 1 readable forever (`src/links/__fixtures__/room-v1.ts`).
- **A link is untrusted**: every field is range-checked, the room must keep the builder's rules with every form and option allowed, the fed numbers must be the answers before them, his solution must solve each machine and end on the check line, and a planted line must be wrong where it stands. Anything else is the broken machine. Nothing about the sender goes in (no name, no look, no dates).
- **The room id** is the cyrb53 hash of the link's bytes, in base36 (architecture, Pattern 3). The reply link is `#r=<id>.c` or `.u`.
- **One stamp per room, the last reply wins.** Several friends may answer; counting them is a later step.
- **A friend's page never reads the save, so it never writes one.** The friend plays in memory, with Balance and the chain, and gets the intro only when the device has no save of the game at all. A friend who has the game keeps their own save untouched.
- **The intro is `2x = 6`** on 0–10 with room 1's blanks; the handover tags guide it. There is no give-up in the intro, only in the friend's room.
- **The give-up control** is a white flag where the map control sits, with its word on the tablet, a 48 px circle on a phone (the word would cover the dial's label). It asks once.
- **The playback on giving up** shows his written lines one by one (700 ms each) under each machine's equation, as text. The machine itself doesn't replay them. Driving the scene through them is a later step.
- **The titles** are 12 fixed Croatian names in `hr.workshop.titles`. A link carries the index, so the list only grows at its end.
- **Saving**: `SaveV1.workshop.rooms` (`id`, `payload`, `title`, `stamp`), newest 40 kept, decoded leniently. A save from before has an empty wall. No new save version.
- **No gendered past tense to the player**: present tense and imperatives only. ("Stigao je odgovor" is about the reply, not him.)
- **The play log doesn't record rooms built and sent yet.** The architecture lists a `built` log event for Luka's view; it is a later step.

## Later steps

- The "pans still until x is written" blind, and decorations.
- Typing a planted line freely on the pad.
- Replaying the builder's solution on the machine itself when a friend gives up.
- Keeping a solved but unsent room over a reload.
- A `built` play-log event and the "rooms built and sent" line in Luka's view.
- Counting replies per room when several friends answer.

## Files

- Pure: `src/workshop/forms.ts`, `src/workshop/design.ts` (rules, limits, costs, the RoomSpec, the intro), `src/links/room-link.ts` (encoding, validation, hash, reply links), `src/links/__fixtures__/room-v1.ts`.
- Store: `src/store/workshop-reducer.ts` (over the shop's and fights' layers), with small additions to `src/store/reducer.ts` (`room/enter-spec`; the workshop and friend screens keep `onMap`), `src/store/actions.ts`, `src/store/types.ts`, `src/store/persist.ts`.
- Save: `src/save/schema.ts` (`workshop`), `src/save/decode.ts`.
- App: `src/app/friend.ts`, `src/main.tsx` (the `#s=` and `#r=` routes), `src/app/App.tsx` (two screens; the give-up flag in a friend's room).
- UI: `src/ui/workshop/` (builder, planted line, wall, links), `src/ui/friend/` (cards, give-up), `src/ui/common/ShareLink.tsx`, and the wall under the counter in `src/ui/shop/ShopScreen.tsx`.
- Text: `hr.workshop` and `hr.friend` in `src/content/text/hr.ts`.
- Tests: `src/workshop/design.test.ts`, `src/links/room-link.test.ts`, `src/store/workshop.test.ts`, `src/save/decode-workshop.test.ts`, `src/content/text/hr-workshop.test.ts`, `e2e/friend-room.spec.ts`.

## Checks

- `npx tsc --noEmit -p .`: clean.
- `npm run check` (Biome CI): clean.
- `npx vitest run`: all pass.
- `npx playwright test e2e/friend-room.spec.ts` at 1280 × 800 and 640 × 360: three flows each. He builds `3x + 4 = 31` with the readouts hidden, solves it on the pad and sends it (30 → 21 parts). A fresh browser opens it as a new friend: welcome, the intro machine, the room cracked on the pad, the reply link. Back in his game the reply link stamps it RIJEŠEN. A friend gives up and sees the solution play with an uncracked reply. He plants `2x = 19` for `2x = 18` and sends it. Port 5291 was busy with other sessions, so these ran against a Vite of this worktree on 5333 (`E2E_URL`).
