# Epic 8 report: Clues and doors

Everything here is off for your son (`tuning.part2.live` is false). Open the game with `?dev` to play it, on a second player (`#igraci`), because `?dev` writes the active player's real save.

## What you can play

After part 1: the foundry, the gate, the little one, up to Gornja ulica, talk to Vučetić, then tap "Dvije strane" on the wall or its pin on the trail map. The whole lead runs: showing, try, the little one's mistake, the street's doors, the lift, the school form, the thread, the card.

## Do clues look clearer than rooms?

Plainly: I can't tell without him, and I think mostly yes, with one risk.

**Why I think yes.** In the Knock a line does something he can see straight away: he writes it, the doors change. Rooms ask him to reason about a whole machine before anything moves. The wrong door is also a clearer failure than a jam, because he sees which number he claimed.

**The risk.** A Knock can be solved without thinking about pairs at all, because the sum is already started and only needs its result. That's fine for "7 · 2 + 1", and it's what the GDD asks for, but if he just calculates and never connects it to the lamps, the lesson didn't land. The little one's fix step is what guards against this. Watch whether he reads that step or taps through it.

## What to check yourself

1. **Does the showing feel long?** Each step waits 11 seconds, or one tap. Five steps. Is it read, or tapped through?
2. **Does he know to tap a line of the little one's?** The lines have dashed borders and the text says "Dodirni ga".
3. **The Croatian.** All of it is my draft, in `C:\Users\lpodobnik\Claude\matematika\src\content\text\hunt.ts` and `C:\Users\lpodobnik\Claude\matematika\src\content\text\hunt-leads.ts`. "Jedna viška" and the neighbours' lines most need your ear.
4. **The doors.** They're drawn in code for now. The painted facades come in epic 12.

## Calls I made

- **The first lead's clues.** The GDD gives the idea and `7 · 2 + 1 = 15`, and I had to choose clues before ranges are taught, so no `<`. The street has three clues: the side, the seven pairs, and "one more would make eight pairs" (`8 · 2 − 1`), which cross-checks the first. A second scene, a lift, is where he meets 0, with `☐ ∉ N` picking the floor.
- **Working on the way counts.** Before a wrong door, `7 · 2 + 1 = 14 + 1` is accepted if it's true, though the GDD only mentions a result. A child who works in two lines shouldn't be told off. A false one gets the shake.
- **Lines of a sum can chain.** The architecture had `left` and `right` on a sum; the code has a list of sides, because `423 − 37 − 54 = 423 − 91 = 332` needs three. `hunt/spec.ts` holds the lead's types instead of `hunt/types.ts`, which stays the save's.
- **A showing is a list of drawn states,** not a script of moves. It reads the same, and needed less code.
- **He can leave a scene.** Map button in the corner, and the same lead picks up where he left it. The stories didn't ask for it, but rooms have it and a child will want it.
- **People don't return yet.** Colour does. People need art, so they come with epic 12.
- **Nobody marks a find on the map by hand.** Vučetić is meant to; for now the red thread is simply drawn from what's solved.

## Tests

- Unit: all pass, about 215 new ones. `math/statements.table.ts` holds true, false and refused rows for every form.
- Browser: `e2e/hunt.spec.ts` and `e2e/lead.spec.ts`, tablet and phone. They play the lead with real taps, wrong door and reload included, and check that with the switch off nothing shows.
- Screenshots looked at on both sizes. Fixed from looking: doors stretched to full height, the draft line too small, the sound button over the first clue, the lift's bubble hiding the ground floor, and the corner's buttons covering floors on a phone.

## Known and left

- On a phone the notebook has room for about three clue lines above the pad. It scrolls to the one he's on, and it's usable, but tight. His tablet doesn't have this.
- No sound yet for doors or knocks (epic 12).
