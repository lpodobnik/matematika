---
title: "matematika: Development Epics"
status: final
created: 2026-11-05
updated: 2026-11-05
---

# matematika: Development Epics

Each epic ends in something playable. Estimates are hours with Claude Code and are unverified. Story-level detail comes from `gds-create-epics-and-stories`.

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
