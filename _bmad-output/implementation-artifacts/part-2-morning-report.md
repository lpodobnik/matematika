# Part 2: where things stand

**For Luka, written while you slept.** Your son's game hasn't changed: everything is behind `tuning.part2.live`, which is false and pinned by a test. To see part 2, open the live game with `?dev`, on a second player (`#igraci`), because `?dev` writes the active player's real save.

Details per epic:
- `C:\Users\lpodobnik\Claude\matematika\_bmad-output\implementation-artifacts\epic-8-report.md`

## What's built

| Epic | State | What you can play |
|---|---|---|
| 7: The way in | Done | Gate with `5 · x = 40`, the empty foundry, naming the little one, Gornja ulica, Vučetić and the map |
| 8: Clues and doors | Done | "Dvije strane": showing, try, fixing the little one, Knock with a wrong door, the lift, the school form, the thread and the card |
| 9: Three more ways to play | Done | "Tramvajska linija" (Sneak), "Novine" (Unmask), "Arhiv" (Little one alone), each with a first-time guide |

## Do clues look clearer than rooms?

I can't tell without him. See the epic 8 report: the writing-acts-on-doors loop looks clearer to me, and the risk is that he only calculates and never connects it to the lamps.

## What most needs your eye

1. **The Croatian.** All of it is my draft, in `C:\Users\lpodobnik\Claude\matematika\src\content\text\hunt.ts` and `C:\Users\lpodobnik\Claude\matematika\src\content\text\hunt-leads.ts`.
2. **Whether the lessons are too long,** at 11 seconds a step or one tap.
3. **The little one.** Drawn in code for now. If you like it, the art can follow it.

## Calls I made in epic 9

- **All four written leads start in Gornja ulica,** each at its own door, until the other streets are painted. Moving one is one entry in `C:\Users\lpodobnik\Claude\matematika\src\content\town.ts`.
- **Patrols can go round the corner** (route stop -1), so there's a reason to wait and watch. A line with no way past would otherwise need him to walk through it.
- **Sneak's guide ends after the first board.** The others end when the scene does.
- **The newspaper's three suspects are Zagorka, a typesetter and a paperboy.** The typesetter always rounds up, and the paperboy slips once, so spotting the odd one out isn't enough.
- **The clerk's register** (words to digits) is one try task for now: "trideset tisuća petnaest". The GDD asks for more, and it can grow.
- **Loop boards aren't built yet.** They come with the loop lead in epic 10.
