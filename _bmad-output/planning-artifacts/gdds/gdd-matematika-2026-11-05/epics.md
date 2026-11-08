---
title: "matematika: Development Epics"
status: "epics 1-6 final; epics 7-12 awaiting review"
created: 2026-11-05
updated: 2026-11-08
---

# matematika: Development Epics

Each epic ends in something playable. Estimates are hours with Claude Code and are unverified. Story-level detail is in `_bmad-output/planning-artifacts/epics.md`, from `gds-create-epics-and-stories`.

## Epic 1: First machine

**Goal:** prove on the tablet that the machine is fun to poke and that writing feels like the final move, not a chore. This is the design's biggest bet, so it comes first, and it needs room 4, where several written lines move the machine.

**In:**
- Scale with pans, piece kit (weights, x-gears, floats, springs, reducer) and tilt
- x dial, poke window and dial limits
- Prediction pin
- Notebook with number pad, line checking, correct-line and wrong-line behaviour, and the closing check line
- Balance: the tray of spare pieces and the splitter
- Fading stages for Try values and the first stage for Balance
- Restart animation and room reset
- Rooms 1–4, one after another

**Out:** map, saving, parts, final art.

**Depends on:** nothing.

**Playable result:** rooms 1–4 on the tablet, in placeholder art.

**Estimate:** 10–14 hours.

**High-level stories:**
1. Pans show an equation as objects and tilt by the difference.
2. The dial changes x one notch at a time and updates both sides.
3. The pin commits a prediction before the dial opens up.
4. The notebook takes lines from the number pad and checks them against the previous line.
5. Each correct line moves the machine, and the check line locks it.
6. A wrong line is acted out, jams the machine and stays editable.
7. Pieces move on and off both pans, and the splitter divides them.
8. Rooms 1–4 play in order and can be reset.

## Epic 2: The city

**Goal:** turn separate rooms into a world he wants to return to.

**In:**
- Map with 19 nodes, gates, return trips and the closed foundry gate
- Automatic saving and the backup link
- Character name and look, asked after room 1
- Story lines, Kristijan's notebook notes, the First Automaton's notices, townspeople and the city's log
- Remaining fading stages for Balance
- Hint ladder and explanation cards
- Rooms 5–7, including the compare, predict and find-the-mistake types
- Play log and Luka's view
- Art style guide (`_bmad-output/art-bible.md`): palette, line weight, lighting and a prompt template for the images

**Out:** fights, gear chain, workshop.

**Depends on:** epic 1.

**Playable result:** rooms 1–7 on a map, picked up where he left off.

**Estimate:** 8–12 hours.

**High-level stories:**
1. The map shows connected nodes and restored or grey states.
2. Gates open from tools earned and rooms completed, and locked rooms stay visible.
3. Progress saves automatically and can be restored by backup link.
4. After room 1, someone asks who he is, and he names his character and picks a look.
5. The hint ladder triggers on inactivity or repeated jams.
6. Rooms 5–7 play, including acting out the wrong line in the old logbook, which reveals Kristijan's planted signal.
7. The play log records sessions, ways used, predictions and wrong lines on the device.

## Epic 3: Automaton fights

**Goal:** give him a reason to practise that decides itself by maths, not by a quiz.

**In:**
- Dice, placement as blade, charge and reach, and blow commitment on the x dial
- Hull, steam, clean cuts and rewards
- Armour tiers 20, 30, 45 and 60, and four lairs
- Parts counter, dropped piles and recovery
- Beaten automatons winding down and rewinding
- Three torn logbook pages in the armour 30, 45 and 60 lairs
- Three upgrades
- Prediction parts in rooms
- Fights in the play log

**Out:** large-number fights, other fight types.

**Depends on:** epic 2.

**Playable result:** he can hunt in four lairs and buy upgrades.

**Estimate:** 6–10 hours.

**High-level stories:**
1. A round rolls dice, and he places them and commits blows without seeing the total.
2. A strike resolves armour, clean cuts and the automaton's dent.
3. Winning pays parts and winds the automaton down, and losing drops a recoverable pile.
4. The first win in the armour 30, 45 and 60 lairs returns a torn page to his notebook.
5. Upgrades change the fight's limits.
6. Right predictions in rooms pay parts, once per stage.

## Epic 4: The whole district

**Goal:** finish the solo game through the line reveal.

**In:**
- Gear chain with chosen inverses, moving together with the pans
- Fading stages for Undo
- Story room type
- Linked machines
- Recording drum and the line reveal
- Rooms 8–13

**Out:** workshop.

**Depends on:** epic 2.

**Playable result:** all 13 rooms, ending with the line reveal, with the foundry gate left closed.

**Estimate:** 12–16 hours.

**High-level stories:**
1. The chain shows the equation as links, and he sets each inverse himself.
2. Running a link backward also acts on the pans and writes the undo line.
3. The chain handles `a − bx` forms, including the `135 − ☐` link.
4. The story room builds pans from a story and matches pans to a story.
5. One machine's answer becomes a weight in the next.
6. The drum plots dots and the level line, and the reveal follows.
7. Rooms 8–13 play.

## Epic 5: Rooms for friends

**Goal:** make the pride of "my friend couldn't crack it" possible without a server.

**In:**
- Workshop, pieces, costs and the wall of his rooms
- Forms and options limited to what he has met
- Blinds, planted mistakes and linked machines
- Solve-before-sending rule
- Room in the link, with fixed titles
- Friend's intro machine, friend's room and offer to start the game
- Giving up, reply link, and "cracked" and "uncracked" stamps
- Rooms built in the play log

**Out:** server-backed results, live play.

**Depends on:** epics 3 and 4.

**Playable result:** he builds a room and sends it, a friend cracks it or gives up, and the stamp appears.

**Estimate:** 8–12 hours.

**High-level stories:**
1. He builds a machine from pieces, paid for with parts when he sends it.
2. He adds blinds and a planted mistake.
3. He links up to 3 machines.
4. He must solve and write the room before the link appears.
5. A friend opens the link and plays, with a short intro if new.
6. A friend who gives up sees his solution.
7. The reply link stamps the room.

## Epic 6: Ready for the surprise

**Goal:** make it hold up against Zelda on first contact, because the first impression can't be repeated.

**In:**
- Final blueprint art and the map's colour and motion
- Machine sounds, the city's layered music and a mute control
- All Croatian text, about 73 short lines plus cards and titles, checked against school terms and read through once by Luka
- Tablet, phone and computer testing, including links through messaging apps
- Line-checker test table for all 13 rooms
- The paper test, in before and after versions with new numbers

**Out:** new mechanics.

**Depends on:** epics 1–5.

**Playable result:** the finished MVP, ready to give him.

**Estimate:** 8–12 hours.

**High-level stories:**
1. Machines and the map take on the final look.
2. Each restart adds colour, motion and a sound loop.
3. All text is final in Croatian and avoids gendered verb forms.
4. Links and saving work on all three device types.
5. The paper test is ready, and none of its numbers appear in a room.

## Epic 7: The gate and the little one

**Goal:** his live save reaches something new, and he has a companion he likes.

**In:**
- The foundry gate opening from what the save already holds, with the knock as the code
- The old "needs a tool" line reworded
- The empty foundry, and the first street of the new district
- The little one: naming, following, beeps, "Zašto?", first art
- Vučetić arriving as his ally
- New save data with safe defaults
- His live save carried over, tested from the moment before the gate opens as well as after

**Out:** clues, scene types, gear.

**Depends on:** epics 1–6.

**Playable result:** the gate opens, he names the little one, and it follows him through a street.

**Estimate:** 8–12 hours.

**High-level stories:**
1. A finished save reaches the gate behind the dev switch; his live save and an unfinished one still see it sealed.
2. He solves `5 · x = 40`, and the foundry is empty.
3. He meets and names the little one.
4. It follows him, reacts and idles.
5. Tapping it prints "Zašto?".

## Epic 8: Clues and doors

**Goal:** one complete lead shows whether clues are clearer than rooms.

**In:**
- The trail map with pins and the red thread, marked by Vučetić
- The lead loop: pick, get shown, try, fix, play, write, thread
- Knock: clues in the notebook, door rows, crossing the road, lifts, lines that light doors, undo, wrong-door help
- First-time guide and help for Knock
- The first objects: pairs and the line
- The little one's wrong attempt and his fix, kept in the save
- The first new notebook forms, and the new pad

**Out:** other scene types, the black thread.

**Depends on:** epic 7.

**Playable result:** the "Two sides" lead, from the trail map to the written line. Luka plays it, and if clues are muddier than rooms the design changes before epic 9.

**Estimate:** 16–24 hours.

**High-level stories:**
1. A lead appears on the trail map and can be picked.
2. A cylinder shows an idea with objects, and he tries it.
3. The little one goes wrong, and he finds the line, shows it right and fixes it.
4. Clues reach the notebook, and his lines light and darken doors.
5. A door row is readable and tappable on a tablet and a phone.
6. A wrong door shows what his idea caused, then helps; a right one opens and moves the thread.

## Epic 9: Three more ways to play

**Goal:** each scene type works once, and he can learn it from play.

**In:**
- Sneak: turn-based boards, patrols, line boards, being caught
- Unmask: people and documents, question cards, accusing, writing the corrected line
- Little one alone: playing as it, junctions, dead ends that show his number
- First-time guide and help for each
- The objects and notebook forms these leads need: powers, points and `≈`

**Out:** loop boards and remainders, the remaining leads.

**Depends on:** epic 8.

**Playable result:** the tram line, the newspaper and the archive leads.

**Estimate:** 20–30 hours.

**High-level stories:**
1. Nothing moves until he moves, and he can read a patrol's route.
2. Being caught returns him to the start with nothing lost.
3. He works out a stop and writes it, and only then does it light.
4. He asks at least two cards, points at one, sees why, and writes the corrected line.
5. He plays as the little one and supplies a missing place in a route.

## Epic 10: The whole trail

**Goal:** the chapter is complete, from gate to near miss.

**In:**
- All 16 leads and the 3 knots, as data
- The remaining notebook forms, objects and explanation cards
- Loop boards, Load the carts, Level the load, Bracket locks including equation locks, and charts
- The black thread, sealed leads and corrected streets
- The hook and the facade
- All four rule guards, including the zero guard
- The little one wandering off, the forged note, the coat's reveal of Vučetić, the clues planted before it, and the real Vučetić
- The last door, the note and the First Automaton's question
- A test table covering every form and every wrong path

**Out:** bought gear, secrets, new lairs.

**Depends on:** epic 9.

**Playable result:** the whole part, played through without fights or bought gear.

**Estimate:** 24–34 hours.

**High-level stories:**
1. Each act's leads open as written, in any order within the act, with the coat last in Act 3 and the locks first in Act 4, and the last lead follows Act 4.
2. Each knot is built from his own finds, behind its rule guard.
3. The map shows where the black thread is heading, and he can save a lead by starting it. After the coat it goes to decoy doors.
4. A clue from another street shortens a scene.
5. The zero guard spins for good.
6. The part ends on the near miss and hands over to divisibility.

## Epic 11: Growth and fights

**Goal:** there is always a reason to go somewhere else, and a reason to fight.

**In:**
- Bright lamp, magnet, longer hook and looks, bought with parts
- 8 secrets, including 2 in the old streets
- 3 new lairs and the brackets upgrade, balanced by simulation for reasoning and random players
- Nikola's own little automaton

**Out:** a clue trail for a friend.

**Depends on:** epic 10.

**Playable result:** he buys gear, goes back and finds a secret, and wins a strike with brackets.

**Estimate:** 8–14 hours.

**High-level stories:**
1. Bought gear opens seen places, and never a lead.
2. Secrets hold sketches, parts and looks.
3. Brackets change a strike, and "Udari" asks how big it will be.
4. New lairs meet their simulated targets.

## Epic 12: Ready for him

**Goal:** the part holds up on his tablet.

**In:**
- 12 street paintings, 3 door facades, the little one's art and new characters
- Sounds and one music layer per act
- All new Croatian text, about 300 short lines, read through by Luka
- Tablet and phone testing, including saves carried over
- The paper test for this part

**Out:** new mechanics.

**Depends on:** epics 7–11.

**Playable result:** the finished part 2.

**Estimate:** 8–12 hours.

**High-level stories:**
1. The district goes from grey to colour as leads finish.
2. All text is final and avoids gendered verb forms.
3. Saves and resuming hold on both devices.
4. The paper test is ready, and none of its numbers appear in a lead.

## Mechanics coverage

| Mechanic | Epic |
|---|---|
| Scale, piece kit, dial, prediction, notebook | 1 |
| Try values, Balance | 1 |
| Map, gates, saving, story, hints | 2 |
| Fights, parts, upgrades | 3 |
| Gear chain, linked machines, line reveal | 4 |
| Room builder, links, giving up | 5 |
| Art, audio, final text, paper test | 6 |
| Gate, little one, follower, part 2 save data | 7 |
| Lead loop, trail map, Knock, door rows, first notebook forms | 8 |
| Sneak, Unmask, Little one alone | 9 |
| All leads, knots, black thread, rule guards, remaining forms, one-offs, twists | 10 |
| Gear, secrets, new lairs, brackets | 11 |
| Part 2 art, audio, text, paper test | 12 |
