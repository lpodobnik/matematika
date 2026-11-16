# Part 2: where things stand

**For Luka, written while you slept.** Your son's game hasn't changed: everything is behind `tuning.part2.live`, which is false and pinned by a test. The review checked for leaks and found none.

## To see it

Open the live game with `?dev`, on a second player (`#igraci`), because `?dev` writes the active player's real save. The dev panel has a new row, "part 2: everything before it done", with a button for the gate, the street and every lead. A button sets the save and reloads.

## What's built

The whole chapter plays, from the foundry gate to the warm lamp.

| Epic | State | What's there |
|---|---|---|
| 7: The way in | Done | Gate with `5 · x = 40`, empty foundry, naming the little one, Gornja ulica, Vučetić and the map |
| 8: Clues and doors | Done | The new line language, Knock, "Dvije strane" |
| 9: Other ways to play | Done | Sneak, Unmask, Little one alone, each with a first-time guide |
| 10: The whole trail | Done, with the gaps below | 16 leads, 3 knots, the wandering-off, 4 rule guards, the black thread, the coat, the ending |
| 11: Growth and fights | Not started | Gear to buy, secrets, new lairs, brackets, Nikola's automaton |
| 12: Ready for him | Not started | Art, sound, your text review, paper test, opening it |

I stopped at epic 11 on purpose. It should wait for what your son does with the first leads, and epic 12's art costs your credits.

## Do clues look clearer than rooms?

I can't tell without him. Writing a line and seeing the doors change looks clearer to me than reasoning about a machine. The risk is that he only calculates and never connects it to the lamps. Watch whether he reads the fix step or taps through it.

## What most needs your eye

1. **The Croatian: about 1,100 lines, all my draft.** It's in order of play in `C:\Users\lpodobnik\Claude\matematika\_bmad-output\tekst-drugi-dio-za-pregled.md`. Write corrections there and tell me. Lines I'm least sure of are listed at the end of this report.
2. **Play one lead yourself, then the coat.** Jump to `l01`, then `l11`. If the loop feels wrong, that's cheaper to change now.
3. **The doors, stacks and carts are drawn in code.** Say if you want any of them painted, since that spends credits.

## How it was checked

- **Unit tests:** 3,613 pass. `src/store/hunt-playthrough.test.ts` plays the whole chapter through the store, with a reload in every scene.
- **Browser:** the full suite passes 94 of 94 at `c9c5e9d`, on tablet and phone sizes, with part 2's specs and part 1's together.
- **Screens:** I looked at the main boards on both sizes. I haven't seen every lead's screens, only one of each kind.
- **Review:** one independent read found 23 things, and I fixed the ones listed below.

**One CI failure:** commit `4ffaf62` had a lint error I pushed past, so you may have had an email. It was fixed in the next commit. Live play wasn't affected.

## What the review found and I fixed

- A typo in the first Knock left him only a false line to write, so the guide now lets him take a line back.
- Write-ups asked for numbers no longer on screen. They now show them.
- True lines said another way, such as `15 = 7 · 2 + 1`, got "can't be read". They're now accepted, and a true line that isn't what's asked says so.
- The l16 charts' marks didn't line up with the bars, enough to misread them. It's now one plot with lines.
- Tapping his own line to undo it was never taught. The shake now says so.
- A line was refused if another clue was selected. It now goes to the clue it fits.
- Starting a second lead wiped the first. Each now waits where he left it.
- A new session left him in the square with no way to find the trail. He now starts in the street, and the trail map opens from anywhere.
- Also: a false loop line, a wrong stop being asked for again, a saved knot that could dead-end, an unexplained black thread, the little one following him while "missing", Vučetić still standing there after the coat, the bar looking level when it wasn't, and two false lesson lines.

## Added on 2026-11-14

- **Five more streets,** painted and mapped: Arhivska ulica, Novinska ulica, Dvorište, Ulica brava and Pusta ulica. Each lead starts in its own; a session starts in the street of the first open lead.
- **Four townspeople** by their leads, with two lines each before and after (yours to check: `hr.town.people` in `src/content/text/hr.ts`).
- **House fronts in the Knock row:** the odd and the even side of a street look different, a lit door comes back in colour with its lamp, and an open door is a dark doorway.
- **The coat's five people stand in its Unmask board** (2026-11-16): Milka, Nikola, Belušić, Zagorka and Vučetić, with their town figures; he taps a person to point at them. Once he has found the automaton, its cap jumps off and a lens on its card shows the gears. The ledgers, which are documents and not people, keep their names.

## Gaps closed on 2026-11-16

- **Corrected streets:** after the wandering-off, Arhivska ulica turns grey again under a tape notice ("OVA ULICA JE ISPRAVLJENA. HVALA."); after Knot 2, Gornja ulica does. A two-clue Knock at the notice wins each back, with ideas from that street (place value and neighbours; rounding and ranges). Nothing waits on them.
- **The forged note's trap:** following the note brings the automatons, and a short Sneak board plays before he's back at the doors, with the note struck.
- **People return:** the typesetter and the newspaper boy in Novinska ulica after the newspaper; Milka, Nikola and Zagorka in Dvorište after the coat; the bell-ringer, the miller and the chimney sweep in Ulica brava after the two witnesses. The newspaper's and the two witnesses' Unmask boards now show their people too.
- **The real Vučetić's tool room** is a place: Knot 3 starts at the door in the bridge's pier, back in the old district, and once it's done the door leads into the tool room, where he stands among his walls.
- **Bracket locks:** one lock shows a number tree in place of its number (read from the bottom up), and one opens on x from part 1's `5 · x = 250`. The archive has two more register tasks: millions in words to digits, and a bilijun as 10¹².
- **Sound:** a pen tick for a line in ink, a latch when a scene opens, a clank when the cap jumps off, steam for the trap and for being caught, a chime when the little one learns.
- **On a phone** clue lines are 48 px, and the notebook page scrolls.

All new Croatian is mine and is on your review page.

## What's not there

- **Epics 11 and 12** (gear, secrets, new lairs, Nikola's automaton; then your text review, a paper test and switching it on).
- **The finale** at the end of 5th grade.

## Calls I made

- **Scenes:** l01 got a lift for meeting 0, l02 has no sides so that "next door" means `n + 1`, and the coat's second clue is `x > 40` so that 125 can still be knocked on.
- **Knot 1's guard is walked through by a guide,** like every scene type's first time. Each guide runs once.
- **A line can be worked on the way,** before a wrong door too, if it's true.
- **The little one's name** shows when he taps it. It appears nowhere else yet.
- **"Pet osoba" on the map,** not "Kaput", so the map doesn't spoil the coat.
- **Text:** the agents that drafted Acts 1-4 made their own smaller calls, all in the text file for you to read.

## Croatian I'm least sure of

- `KAKO TO ČITAŠ.` (the First Automaton's question; "KAKO SI TO PROČITAO" is a gendered past)
- `Još ne smijem čekati.` and `Ostalo mu pokaži ti.` (Kristijan's note)
- `SVE SE MOŽE PODIJELITI SA SVIME.` and `ZNAMENKA VRIJEDI ISTO GDJE GOD STOJI.`
- `Broj te kuće je neposredni prethodnik onog broja čiji je neposredni prethodnik 17.` (hard on purpose, maybe too hard)
- `Tih je kuća 3 puta manje nego sanduka, a sanduka je 60.`
- `Faktore smijemo i združiti` (from the book's "združivanje"; maybe "grupirati")
- `svežanj` for bundles, `korak na osi` for an axis step, `Pročelje` or `Fasada`, `Prvi čvor` for a knot
- `Ljut sam, po redu.` and `Nismo ništa vidjeli. Ni ja ni moji brkovi.` (jokes that may not land)
