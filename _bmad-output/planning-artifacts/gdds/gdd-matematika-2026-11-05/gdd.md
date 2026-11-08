---
title: "matematika (working title) - Game Design Document"
game_type: "puzzle (primary), metroidvania gating (secondary), adventure (part 2)"
platforms: "web browser, tablet first; phone and computer also work"
status: "part 1 final; part 2 awaiting Luka's review"
created: 2026-11-05
updated: 2026-11-08
---

# matematika (working title) - Game Design Document

**Author:** Luka
**Game Type:** Puzzle, with metroidvania-style tool gating
**Target Platform(s):** Web browser, tablet first; phone and computer also work

---

## Executive Summary

### Core Concept

A 2D exploration puzzle game in Croatian, set in a clockwork city that has stopped working. A 5th grader earns tools that are really maths ideas, uses them anywhere in the city, hunts clockwork automatons for parts, writes the maths the way school expects, then builds rooms to stump his friends.

**Core fantasy:** "I work out how this city really runs, then get it moving again when nobody thought I could."

**What he walks away with:** "Oh, so that's what it means," and the pride of a room his friend couldn't crack.

The MVP is the city's first district: one tool, the scale with draggable x, for linear equations.

Part 2 is the second district and the natural-numbers chapter: he tracks Kristijan with a small automaton at his heels, reading clues only someone who understands can read. See Part 2: The Trail. Sections outside it describe part 1 unless they say otherwise.

### Target Audience

**Primary: Luka's son.** 5th grade, in Croatian, playing mainly on a tablet. He plays Minecraft, Zelda and Roblox, also liked Wildermyth and Supraland, and plays a D&D-style game with Luka using a simplified Blades in the Dark mechanic. These games reward working out rules, building things and having a story that is his. None of them quizzes him, so they are the bar.

**Secondary: his friends and classmates.** They arrive through a link he sends them. The game is not designed for anyone else yet.

### Unique Selling Points (USPs)

- **The machine shows the idea.** The scale shows equality, and dragging x shows why the equation is called linear.
- **Writing starts the machine.** Each written line acts out on the scale, the connection CARNET's textbook text never makes.
- **The fight is the equation.** `6 · 3 + 2 = 20` is the strike, not a question in front of it.
- **Stumping a friend takes understanding.** Planting a believable wrong line means knowing why it is wrong.
- **In Croatian, tied to his book.** Forms and notation follow *Matematički izazovi 5*, for one known child.
- **Clues only understanding can read (part 2).** `100 − 20 · 3 + 10 : 2` is house 45. Left to right gives 125, where the automatons are searching.

---

## Goals and Context

### Project Goals

1. **Real understanding.** He can reason about a topic in situations he has not been drilled on: judging without calculating, predicting what changes, explaining why something is wrong, and moving between a story or picture and the maths.
2. **He comes back by choice.** The game has to compete with Zelda, not with homework.
3. **A structure that carries over.** Part 2 tests whether it does: the same world and pillars, with different play.

**Hypothesis the MVP tests:** tinkering with a visual model and using it in new places makes him better at the four understanding tasks on paper, and he comes back without being asked.

### Background and Rationale

School makes you solve exercises until you can solve exercises. It rarely shows what a linear equation is, or why it is called linear. Luka wants his son to really understand the maths he is learning. This is a passion project for one child, and possibly his classmates, and it stays with 5th grade for now.

The game is a deliberate surprise, so his son has no input before the MVP. The 10-minute proof of concept, `jednadzbe.html`, is not the basis; only two of its ideas carry over: an equation as a scale, and giving a puzzle to another kid.

The source brief, with research, curriculum references and the paper test, is in `_bmad-output/planning-artifacts/briefs/brief-matematika-2026-11-05/`.

---

## Core Gameplay

### Game Pillars

1. **The world teaches, not the text.** A new idea is shown with objects before he has to use it, in moments, not in a wall of text. Then he acts on the world and sees what his idea causes, so he can be wrong about the idea, not only the sum. Prompts fade. Rewards go to reasoning and predictions, not arithmetic. *Decides:* no wall of text before play, and no new idea he must use without having seen it.
2. **The city answers him.** Success shows as the city changing, never as a grade: no stars, scores or "correct" screens. *Decides:* solving a room or a lead changes something visible in the city.
3. **Every idea lands on paper.** Each idea connects to what he writes in class and how he is tested on paper. *Decides:* a room or a lead isn't finished until the solution is written the way school expects.
4. **Making is proof.** To build a room for a friend, he has to make it work himself; the game doesn't do that part for him. *Decides:* a room can't be sent until he has solved it himself.

### Core Gameplay Loop

Two nested loops: a room loop lasting minutes and a city loop lasting days.

**Room loop**

| Step | He does | He sees | Pillar |
|---|---|---|---|
| 1. Arrive | Opens a stopped machine | What's stuck and what it would drive | City |
| 2. Poke | Drags x and tips the pans | The machine's behaviour, with nothing at stake | World |
| 3. Predict | Commits to what will happen before it runs | A right call earns bonus parts; a wrong one shows what his idea caused | World |
| 4. Set | Finds where it balances | The pans level, but the machine still won't run | World |
| 5. Write | Writes the solution one line at a time | Each correct line moves the machine a little against its latch; the check line releases the latch and locks it | Paper |
| 6. Restart | Watches | Part of the city starts moving, and the next room or an upgrade opens | City |

Writing is the final move that starts the machine, not a chore after winning. `2x = 18` lifts 7 off both pans, so the scale shows why the written rule works.

**City loop:** fight automatons for parts → buy upgrades and room pieces → build a room and solve it himself → send it to a friend → the friend tries it and can build one back → build a harder one.

**Repetition:** predictions keep each room risky. Friends' rooms are the only content that never runs out.

### Win/Loss Conditions

**Win:** the MVP's goal is reached when the clock tower (room 13) runs and the line reveal plays. There is no final score. Fights, the workshop and friends' rooms stay open afterwards.

**Rooms can't be lost.** Wrong predictions and wrong lines cost nothing but a jam.

**Fights can be lost,** at the cost of dropped parts, as specified under Automaton fights.

**Friends' rooms have no fail state.** A friend can leave or give up at any time, and the sender hears only if the friend sends a reply link.

---

## Game Mechanics

### Primary Mechanics

All tuning numbers are provisional until playtesting. Examples here use equations from the brief; where the paper test uses them, they appear in no room.

#### The scale with draggable x

| Element | Spec |
|---|---|
| Pans | Each side of the equation sits on its own pan as objects from the piece kit below. |
| x dial | Whole numbers only, one notch per step. Range is set per room, and always reaches the room's answer: the slider is the one x, so he must be able to set it to what he found (Luka, after room 4). In division forms, each notch is a multiple of the divisor. |
| Tilt | 1° per unit of difference between the sides, clamped at ±15°; big-number rooms scale this per room. Each notch tips the pans by the same amount, and more gears tip them faster. |
| Readouts | Both sides' values show while dragging, except in rooms about judging without calculating. |
| Poke window | At first the dial moves only 3 or 4 notches. In `3x + 2 = 20` he sees 2, 5, 8, 11, then predicts where it levels. |
| Prediction | The pin is a small flag. A tag on its holder says what to do. He can still turn the dial inside the poke window, places the pin, and confirms beside it. The machine then tests the pin itself: it turns the dial to the pin (or weighs the pin's x where the dial can't reach), and the pans show whether he was right. A right call earns 2 bonus parts at once, from room 3 on, and once per stage, so resetting earns nothing. A wrong one loses nothing. Only then does the full dial range open. |
| Too slow to drag | In a big-number room the slider moves in coarse steps, with + and − on its plate for single steps, so it can reach the answer but only slowly. In `5 905 − 27x = 316` (x = 207) it runs 0–300 in tens. Its only finishing ways are Balance and Undo, so, as in room 4, `x = 207` counts only after he simplifies, and the slider is his check. |

**Piece kit**

| Piece | Stands for | Effect |
|---|---|---|
| Number weight | `+ 7` | Pushes the pan down by its number |
| x-gear | `+ x`; `3x` is 3 gears | Labelled `x`; pushes the pan down by x. Above 12, one large gear shows the count |
| Float | `− 6` | A balloon labelled `−6`, bobbing above the pan on a string; it lifts the pan by its number |
| x-balloon | `− x`; `− 5x` is 5 x-balloons | The same balloon carrying an x-gear emblem, labelled `−x`; lifts the pan by x. Every minus is a balloon |
| Reducer | `x : 3` | One slice of an x-gear cut into 3, tagged `: 3`, with the rest of the gear as a faint outline; it counts for a third of x |

A weight and a float of the same number cancel out, as do an x-gear and an x-balloon. The slider shows the value it gives x (`x = 9`); the pieces only ever show `x`.

#### Three ways to solve

All three are free to try and reversible until he writes. Any correct method is accepted.

| Way | Machine | Move | Written, for `2x + 7 = 25` |
|---|---|---|---|
| Try values | x dial | Drag until the pans level. | `x = 9` |
| Balance | Pans | Every move acts on both sides at once, because you may only do on the left what you do on the right. A weight or balloon from the tray, dropped on the scale, lands on both sides; a number dragged off one side comes off both; the splitter, set to n, divides both sides into n equal groups and keeps one. There is only one x, the slider's: the scale keeps weighing at it, so at a wrong x it stays out of balance through every move (at 6: 17 vs 23, 12 vs 18, 6 vs 9), and no move can fake a solution. A large goal banner above the scene (`Cilj`, a miniature scale with one x alone against a `?` weight, "x sam na jednoj strani") shows the target and gets a tick when the pans match it; on a phone, where there is no room above the scene, a small card in the scene does instead. Each move writes its lines (`2x + 5 − 5 = 23 − 5`, `2x = 18`); he writes `x = 9` himself, and in a room whose only way is Balance it is accepted only after a line with x alone against a number ("Prvo pojednostavi vagu."). A split that doesn't divide evenly is refused. | `2x = 18`, `x = 9` |
| Undo | Gear chain | Run the chain backward, one link at a time. | `2x = 25 − 7`, `2x = 18`, `x = 18 : 2`, `x = 9` |

Each ends with the check line.

**Gear chain.** A strip under the scale shows the equation as linked operations: `x → ·2 → +7 → 25`. He taps the last link and sets its inverse himself, choosing the operation and the number; the chain never offers the answer. The right inverse turns the output to 18 and the link goes dark. A wrong one drives the output the wrong way and jams the machine. In `135 − 5x = 100` the chain is `x → ·5 → 135 − ☐ → 100`, and the middle link's inverse is `135 − 100`, not `+135`.

**The chain and the pans move together.** Running a link backward also acts on the scale, so `2x + 7 = 25` reaches `2x = 18` on both. Undoing is the shortcut; balancing is the reason it works.

#### Notebook

| Element | Spec |
|---|---|
| Layout | Beside the scale in landscape, with a number pad using `·`, `:` and `x`. |
| Valid line | Any line with the same solution as the line before it, so he can skip steps. |
| Last lines | Every solution ends with `x = 9`, then the check `2 · 9 + 7 = 25`, which locks the machine. The shortest solution is these two lines. [ASSUMPTION: a final check line suits his class; the book page seen shows tasks, not method, but checking is sound either way.] |
| Correct line | The machine acts it out and moves one stage. A valid line with no move to act out, such as `2x + 8 = 26`, is accepted without moving the machine. |
| Wrong line | The machine acts it out, tips and jams. Nothing is counted, and he can edit the line. |

**Fading.** Each way fades on its own, so a new way starts with support even after earlier ones have faded.

| Way | Lines appear as he moves; he writes the last two | He fills in blanks (`2x = ☐`) | Blank page |
|---|---|---|---|
| Try values | None | Rooms 1–3 | From room 5 |
| Balance | Rooms 4–5, with the last two as blanks (`x = ☐`, then the check) once x is alone | Rooms 6–7 | From room 8 |
| Undo | Room 8 | Room 9 | From room 10 |

#### Automaton fights

Turn-based, with no time limit. The exercise is the fight, and fights never open the way forward.

1. He rolls 3 six-sided dice and places them as blade `a`, charge `b` and reach (the most blows this round).
2. He sets his blows on the same x dial and sees `a · x + b`, but not the total.
3. He strikes, and the banner shows the sum, such as `6 · 3 + 2 = 20`. If armour is left, the automaton dents him and the next round starts.

| Rule | Value |
|---|---|
| Hull | 3 dents |
| Steam | 10 per fight, 1 per blow; unspent steam pays out as parts on a win |
| Reward | Base parts + unspent steam |
| Clean cut | Armour landing on exactly 0 doubles the reward |
| Losing | Armour is checked first, so winning on the last steam counts. If armour is left and hull or steam is at 0, he drops a quarter of his unspent parts, rounded down, in a pile at that automaton. Beating it recovers the whole pile, and another loss adds to the pile. Parts already spent are safe. |
| Leaving | Free before his first strike; counts as losing after it |
| Beaten automaton | Winds down, drops its parts and punched tape, and rewinds later, so lairs restock |
| Torn pages | The armour 30, 45 and 60 automatons each carry one torn logbook page, lore only, returned to his notebook on the first win |
| Upgrades | 4th die, roll 4 and discard 1 (40 parts); +3 steam (20); +1 hull (30) |

Simulated with 40,000 fights per setting and scripted players, one reasoning perfectly and one placing dice at random and committing every blow it can. A real child falls between them.

| Armour | Base parts | Reasoning wins | Random wins | Parts per fight: reasoning vs random |
|---|---|---|---|---|
| 20 | 3 | 99.7% | 98% | 13 vs 7 |
| 30 | 4 | 97% | 83% | 12 vs 5.5 |
| 45 | 5 | 81% | 41% | 8.5 vs 2.5 |
| 60 | 6 | 39% | 8% | 3.5 vs 0.6 |

With all three upgrades, the reasoning player wins 98% at armour 60. At armour 20 and 30 a wrong idea mostly costs parts, which gives an easy start. From armour 45 it costs the fight.

#### Room builder

| Element | Spec |
|---|---|
| Unlock | A workshop on the map opens after room 6. He can use only forms and options he has already met in rooms. |
| Building | He places x-gears and weights and chooses every number himself. The game calculates nothing for him. |
| Limits | Coefficients up to 99; numbers up to 9 999. A room whose answer isn't a whole number can't level, so it can't be sent. |
| Costs | Number weight 1 part; x-gear, spring or float 2; decoration 3; each blind 5; planted mistake 5; each extra linked machine 15. Charged when he sends the room. |
| Sending | He must solve the room and write the solution himself before the link appears. |
| Link | The whole room travels in the link, so no server is needed. He picks its title from a fixed list, which keeps names and free text out. |
| Friend's side | A one-minute intro machine if they're new, then the room, with all three ways, a blank page and the usual help. Cracking it gives them a reply link and an offer to start the game and build their own. |
| Giving up | A friend can give up at any time. The machine then plays his written solution, and they get a reply link. |
| Reply link | When he opens it, a "cracked" or "uncracked" stamp appears on that room in the workshop, where his rooms hang. Without a reply, he hears nothing. |

**Ways to make a room hard**, on top of choosing the numbers:

- **Blinds:** hide the readouts, keep the pans still until x is written, or shorten the dial, so trying values stops working.
- **Planted mistake:** he writes a solution with one wrong line, and the friend finds and fixes it.
- **Linked machines:** up to 3 machines, where the answer to one becomes a weight in the next.

### Controls and Input

Designed touch-first for a tablet in landscape. Everything works with one finger, and a mouse does the same with no hover states.

| Action | Input |
|---|---|
| Move the x dial | Drag; one notch per 24 px, with a tick on each notch |
| Place a prediction pin | Drag onto the machine; a second drag moves it; confirm to run |
| Balance | Drag a piece from the tray onto the scale, or a number off it; set the splitter's parts and drop it on the scale. Each acts on both sides |
| Gear chain | Tap a link, then choose the operation and number |
| Notebook | On-screen number pad with digits, `x`, `+`, `−`, `·`, `:`, `=`, brackets, delete and enter. Number keys also work on a computer |
| Dice | Drag to a slot, or tap the die, then the slot |
| Map | Tap a connected node |

Touch targets are at least 48 px. On a phone in landscape, the notebook slides over the scale. The operating system's keyboard appears only once, for his character's name, after room 1.

---

## Puzzle Game Specific Elements

The world structure borrows gating, backtracking and softlock rules from metroidvania design. Sequence breaking does not apply, because rooms open from a fixed graph with no real-time action. As built, he walks the town by tapping, and rooms stand in its streets; see "Part 1 as built" under Part 2.

### Core Puzzle Mechanics

Primary mechanics are the scale, the three ways to solve and the notebook, specified under Game Mechanics.

**The scale is a tool he carries.** He attaches it to each machine, and that machine's parts become the pieces on the pans. Every room has something that must balance, fit or split, so x means something different in each. Rooms also differ by constraint: dial range, poke window, locked weights, hidden readouts and linked machines.

**Solution space.** Every room equation has exactly one solution, a whole number, and every listed way reaches it.

Room types carry the four understanding tasks from the brief:

| Room type | Understanding task | Constraint | What he pins |
|---|---|---|---|
| Solve | Using the model in a new place | None beyond dial range | Where it levels |
| Compare | Judging without calculating | Readouts hidden | x, before anything moves |
| Predict | Predicting what changes | Something behaves unexpectedly, or a number changes after he solves | The effect, before it runs |
| Find the mistake | Explaining why something is wrong | A notebook holds written lines, one of them wrong. He slides to where the first line balances, then taps each written line to put it on the scale at the slider's x: the right lines stay level there, the wrong one tips. He pins it, then rewrites it | The wrong line |
| Story | Moving between a story and the maths | He builds the pans from a story, then picks the story that fits a set of pans | The matching story |

### Puzzle Progression

13 rooms. Names are placeholders.

| # | Machine | Equation | x | x is | Type | What it teaches |
|---|---|---|---|---|---|---|
| 1 | Door lift | `x + 4 = 9` | 5 | Counterweight still needed | Solve | The dial and the pans; level means equal |
| 2 | Street lamps | `3x = 12`, then `x : 3 = 5` | 4, 15 | Oil per lamp, then a full tank | Solve | Each notch moves the pan by the same amount |
| 3 | Sluice gate | `x − 6 = 8`, then `20 − x = 6` | 14, 14 | Water before the release, then water to release | Predict | First pin; in the second form x pulls the other way. Earns Balance |
| 4 | Water wheel | `2x + 5 = 23` | 9 | Load per bucket | Solve | Balance only: the slider reaches 9 and is his check, but x = 9 counts only after he simplifies |
| 5 | Bridge | `3x + 4 = 22`, then the 22 becomes 25 | 6, 7 | Length per plank | Predict | What a change does, without solving |
| 6 | Weighing yard | `x + 56 = 58 + 27` | 29 | Weight of a crate | Compare | Judging equality without adding. Opens the workshop |
| 7 | Old logbook | `3x − 1 = 17`, `3x = 18`, with the wrong line `x = 15` | 6 | Teeth per gear | Find the mistake | `3x` is three of x, not 3 + x: at x = 6 the first two lines balance and `x = 15` tips. The wrong line is Kristijan's planted signal. Earns the gear chain |
| 8 | Tram | `4x + 9 = 41` | 8 | Length per rail | Solve | Running the chain backward moves the pans too |
| 9 | Steam lift | `135 − 5x = 100` | 7 | Pressure per valve | Predict | x-balloons: x lightens the pan, and the inverse is `135 − 100`. From here the tray also holds an x-gear, so Balance can add 5x to both sides |
| 10 | Market scales | `60 + 3x = 90`, then the story for `5 + 2x = 19` | 10, 7 | Price of a cog | Story | A wrench at 60 and 3 equal cogs cost 90 together; then pans into a story |
| 11 | Great wheel | `5 905 − 27x = 316` | 207 | Load per spoke | Solve | Too slow to drag: the slider can reach 207 only in tens and single steps, so he simplifies; the slider is his check |
| 12 | Junction | `2x + 3 = 11` feeds `3x + ☐ = 19` | 4, 5 | Gear sizes, the first passed to the second | Solve | Linked machines. Earns the recording drum |
| 13 | Clock tower | `3x + 5 = 20`, then `50 − 4x = 34` | 5, 4 | Turns of the winder | Predict | The line reveal |

| # | Dial range | Poke window | Pin | Ways that can finish |
|---|---|---|---|---|
| 1 | 0–10 | None | None | Try values |
| 2 | 0–10, then 0–30 in 3s | None | None | Try values |
| 3 | 6–20, then 0–20 | First 4 notches, then none | Where it levels, then which way the pan moves as x grows | Try values |
| 4 | 0–12 | None | None: room 4 introduces only Balance | Balance |
| 5 | 0–10 | First 4 notches | Where it levels, then where it levels after the change | Try values, Balance |
| 6 | 20–40 | None | x, with readouts hidden | Try values, Balance |
| 7 | 0–10 | None | The wrong line | Balance |
| 8 | 0–10 | First 4 notches | Where it levels | Balance, Undo |
| 9 | 0–10 | First 4 notches | Where it levels | All three |
| 10 | 0–15 | None | The matching story | All three |
| 11 | 0–300 in tens, ± for single steps | First 4 notches | x under 100, 100–300 or over 300 | Balance, Undo |
| 12 | 0–10 each | First 4 notches | Where each levels | All three |
| 13 | 0–10 | Whole dial, with the drum | The next dot | All three |

**Line reveal.** The recording drum draws a dot for each x he tries, with the right-hand side as a level line. In `3x + 5 = 20`, x = 3 to 7 gives 14, 17, 20, 23, 26. He pins the next dot before dragging, the dots form a straight line, and it crosses the level line at the answer. The second equation draws a falling line. Only then does the explanation appear: "linearna" comes from "linija".

**Rules from the playtests (2026-11-06).** Luka's and his son's first plays of rooms 1–4 set these for every room:

- **One x.** The slider is the only x. The scale is always weighed at it, and every room's slider reaches its answer.
- **One new idea per room.** It arrives with a short tag the first time it is needed (a handover), and the hint button is always there.
- **Balance acts on both sides.** Every Balance move does. A goal banner shows the target, x alone. In a room whose ways don't include Try values, `x = n` counts only after a simplified line.
- **Pictures mean one thing.** Every minus is a balloon, the pieces show `x` and never a number, and a prediction is a flag.
- **The last two lines are blanks.** The answer and the check come as blanks in Balance's `auto` rooms, so the step from the machine to the notebook is always the same.

**Difficulty pacing.** Numbers stay small until each idea has landed. Room 11 is the deliberate hard point. Equations from the paper test, before or after, must not appear in any room, compared up to swapped sides and the order of terms.

### Level Structure

**Order:** 1 → 2 → 3 → 4 → 5 and 6 in either order → 7 → 8 → 9 and 10 in either order → 11 → 12 → 13.

**Map connections:** 1–2, 2–3, 3–4, 2–5, 4–6, 5–7, 6–7, 7–8, 3–9, 8–10, 9–11, 10–11, 11–12, 12–13. Lairs hang off rooms 2, 5, 8 and 12; the workshop and the foundry gate hang off room 6. Tapping any reached node travels there at once.

| Earned | At the end of | Opens |
|---|---|---|
| Balance (weights can be moved) | Room 3 | Room 4, then room 5 |
| Workshop | Room 6 | Room building |
| Gear chain | Room 7 | Room 8, then room 9 |
| Recording drum | Room 12 | Room 13 |

**Backtracking.** The bridge (room 5) is visible from the street lamps (room 2), with its weights locked. The steam lift (room 9) is visible from the sluice gate (room 3), with its chain case locked. Both mean a return trip after earning the tool.

**Closed place.** The foundry gate, visible from room 6, shows a plate 5 wide that must cover an area of 40, `5 · x = 40`. It stays closed through the MVP and shows that a next tool is coming.

**Automaton lairs.** Four optional map nodes, each open once seen: armour 20 near room 2, 30 near room 5, 45 near room 8, and 60 near room 12. The 30, 45 and 60 automatons each carry a torn logbook page.

**Softlock prevention.** Tools are earned only in required rooms, and gates depend only on tools and completed rooms. Parts never open the way forward. Rooms consume nothing, and each one can be reset or left at any time.

### Player Assistance

No instructions appear before a room. During a room, a short tag tells him the next step the first time each step comes up: move the slider, write x when the scale levels, the check line, the pin, the tray, keeping x alone, the splitter. It goes as soon as he does the step and comes back after 60 seconds without acting. His first play (2026-11-06) showed he stops at every handover without it. A hint button (`?`, under the reset control) is always there: the first press shows the current step's tag, the second shows the exact next move (a ghost piece gliding from the tray to the scale, the splitter gliding over, the slider's direction, or the line to write). Hints are free and never recorded. Help arrives when he goes 60 seconds without acting or jams the machine 3 times in a row. It is free and never recorded.

| Level | Help |
|---|---|
| 1 | The piece he can move wiggles. |
| 2 | The machine shows the rate or marks the next move. |
| 3 | The notebook shows the structure of the next line, with blanks. |
| 4 | The machine solves the same form with other numbers. |

After a room's first use of an idea, a card of one or two sentences connects it to the school term, as the answer to Nikola's "how did you do that?" Every move is reversible until he writes, wrong lines can be edited, and a reset control restarts the current machine stage, so earlier stages of the room stay solved. Required rooms can't be skipped, but rooms 5–6 and 9–10 can be done in either order, and fights and the workshop stay open, so he has somewhere else to go when stuck.

### Replayability

Par times, perfect-solution challenges and daily puzzles are ruled out by Pillar 2. Solved rooms stay open as they were. Replay comes from friends' rooms and from fights, which are always available.

---

## World and Story

The story stays light and makes his character matter. Narrative detail is in `_bmad-output/narrative-design.md`.

**Premise.** Majstor Kristijan, the Clockmaker, ran the city from notebooks until the First Automaton kidnapped him, leaving only the written steps. People kept following them without knowing why they worked, so when something changed, nobody could fix it and the city seized up.

**His role.** He is an apprentice who finds a notebook and is the first to poke the machines. That is why writing moves them: the notebook is how the city is run. Townspeople doubt an apprentice at first, and that changes as the city restarts. After the first door opens, someone asks who he is, and he names his character and picks a look; townspeople use that name. The name stays on his device. The city's log records what he restarted, and his rooms hang in the workshop with their stamps, so the story is his.

**The villain: the First Automaton.** Kristijan's first machine, built to run the city by the steps. When the steps stopped being enough, it took him to ask why. It leaves literal punched-tape notices and corrects repairs that aren't in the steps. He doesn't meet it in the MVP.

**Automatons.** Kristijan's helpers, now under the First Automaton's orders and stripping the city for parts. Hunting them is how he takes those parts back. A beaten automaton winds down, drops parts and rewinds later, which is why lairs restock.

**Delivery.** One or two lines when a machine restarts, with no cutscenes. A few recurring townspeople show what each restart changes for them. The wrong line in the old logbook (room 7) is Kristijan's planted signal that he was taken, and the clock tower's drum trace points to the foundry gate, which carries the pull across districts: find Kristijan. Explanation cards answer the question of Nikola, the lamplighter's kid: "how did you do that?"

**Language.** Croatian text avoids gendered verb forms such as "uspio si", since classmates of any gender may play.

---

## Part 2: The Trail

The second district, teaching the chapter *Prirodni brojevi* (pp. 87–159). The content is in `C:\Users\lpodobnik\Claude\matematika\_bmad-output\planning-artifacts\content-prirodni-brojevi.md`, and the ideas in `C:\Users\lpodobnik\Claude\matematika\_bmad-output\brainstorming-session-2026-11-08.md`.

Place names are placeholders, and Luka writes or approves all Croatian lines. Numbers are starting values for playtesting.

**Terms used below:**
- **Lead:** one piece of the hunt, teaching one idea.
- **Clue:** what the game gives him, copied into the notebook.
- **His line:** what he writes.
- **Patrol:** an automaton walking a route in a Sneak board.
- **Rule guard:** an automaton running a wrong rule.
- **The little one:** the small automaton that follows him.

### Part 1 as built

The other sections of this document record the plan; the game has moved on. Part 2 builds on what exists:

- **Town:** he taps to walk inside 10 painted streets. Rooms, lairs and people stand in them, and a map overlay jumps between streets.
- **Order at the end:** room 12, then Nikola announces the boss, then the boss (`lair-60`) appears Pod tornjem, then room 13 opens once he is beaten, then the ending panels.
- **Fights:** armour 20, 30, 40 and 60. Upgrades cost 30, 10 and 20, or 60 in all. Automatons rewind after 5 minutes. Once any automaton is beaten, "Udari" first asks how big the strike will be, and a wrong answer costs nothing.
- **Help:** Nikola's room guide, the "Što sad?" line, the `?` hint and the help ladder. These already show things before he must do them.
- **Notebook:** only equations in `x`, judged against the stage's equation.
- **Foundry:** sealed for good. It says he needs a tool he doesn't have, and nothing accepts an answer to its plate.
- **Lairs:** an automaton in a street holds that street's machine until it is beaten.
- **Not in the game yet:** a follower, doors, things to knock on, an inventory, or anyone he can teach.

### Why the loop changes

Scene, talk, solve, colour, next scene would get boring fast. Part 2 keeps the world and pillars and changes five things:

1. **Open leads, not a chain.** He holds several at once and picks where to go.
2. **A rival on the same trail.** The First Automaton's search party is hunting Kristijan too.
3. **Scenes that play differently.** Four scene types, plus three one-offs.
4. **The little one grows.** New gear opens places he has already seen.
5. **Twists.** A forged clue, the little one wandering off, a disguised automaton, a guard tricked into dividing by zero.

The sums in this chapter are easy, so the hard part must be the idea. He should mostly not be calculating: reasoning has to be the short way, which is why big numbers appear once an idea is known.

### Tone

It should be cute and funny, with real stakes underneath.

- **The little one is cute.** It follows him like a duckling and gets things wrong with total confidence.
- **Wrong answers are funny, not sad.** Neighbours are grumpy and unimpressed. An accused townsperson is deeply offended. A rule guard thanks him politely for confirming its rule.
- **The First Automaton stays literal, polite and menacing.** When it moves Kristijan, the notice says so as a routine correction: "THIS HAS BEEN CORRECTED."
- **Crashing the robot is a child's dream.** Getting a guard to divide by zero, and watching it spin for good, is a peak of the part.
- **Why it matters.** He does for the little one what nobody did for the First Automaton: he shows it why. Everything the little one learns comes from him.

### Part 2 loop

Two nested loops: a lead loop lasting minutes and a trail loop across an act.

**Lead loop**

| Step | He does | He sees | Pillar |
|---|---|---|---|
| 1. Pick | Chooses an open lead on the trail map | Where it is, and where the black thread is heading | City |
| 2. Get shown | Finds Kristijan's cylinder, and the little one plays it | The new idea with objects. One tap speeds it up | World |
| 3. Try | Does it with objects and tiny numbers, then with numbers in the notebook | What his move causes | World, Paper |
| 4. Fix | The little one tries and goes wrong. He taps the wrong line, shows it right with the objects, and writes the right line | It nods, and never makes that mistake again | World |
| 5. Play | Plays the lead's scene | A wrong idea has a visible, usually funny, result | World |
| 6. Write | Writes the solution the way school expects | The line goes into the notebook in ink | Paper |
| 7. Thread | Watches | The red thread reaches the place, colour and people return, and new clues appear | City |

A showing can't be skipped the first time; replays can. If he goes wrong in the scene, it is offered again. Showings get shorter from act to act.

**Trail loop:** finish an act's leads → beat its rule guard → tie the knot → new leads and streets open. Alongside: fight automatons for parts → buy gear for the little one → go back to places he couldn't reach → find secrets.

**Repetition:** fights, secrets and friends' rooms stay open. Leads don't replay. Corrected streets and door locks bring back old ideas.

### Win and loss

**The part ends** when he opens the last door and reads Kristijan's note. Fights, secrets and the workshop stay open.

**Leads can't be lost.** A wrong door, a wrong accusation or being caught costs nothing but the attempt. Fights can be lost as before.

### Structure

Sixteen leads and three knots in four acts, one new idea per lead. Within an act, leads can be done in any order, except that the coat is last in Act 3, as its climax, and the locks are first in Act 4, because the leads after them use brackets. [ASSUMPTION: a lead takes 10–15 minutes, about 3–4 hours in all; untested.]

The order follows the book, with one change: the coat and the locks come before distributivity, remainders and the mean, because distributivity and the mean use brackets. The book lists brackets as already known from earlier grades, and his class may reach them in a different order. Units 9, 10 and 11, the chapter's hardest, get two leads each.

**The gate (opening).** Once room 13 is done and the boss is beaten, the foundry changes. He hears the knock, five then eight, sees the plate `5 · x = 40`, and solves it the way rooms do: `x = 8`, checked with `5 · 8 = 40`. A wrong line gets a knock back, with no cost. The gate opens on an empty foundry and a tiny automaton. The old line saying he needs a tool is reworded.

**Act 1: where they took him**

| Lead | Idea | Scene | What happens | Written | Numbers |
|---|---|---|---|---|---|
| Two sides | N, N₀, even and odd | Knock | Houses start at 1, a lift's ground floor is 0. Even and odd are the two sides of the street. "Seven pairs of lamps and one left over" is `7 · 2 + 1 = 15`, on the odd side | `0 ∉ N`, `0 ∈ N₀`, `7 · 2 + 1 = 15` | To 100 |
| The neighbours | Predecessor, successor | Knock | "The witness lives next door, at `n + 1`." 999 stands next to 1 000. The predecessor of the number whose predecessor is 17 | `n + 1 = 1 000` | To 10 000 |
| The archive | Place value, powers of ten | Little one alone | Halls, rows, shelves, boxes, folders. The route needs the missing place. A clerk's register goes both ways between digits and words, up to *milijun, milijarda, bilijun* | `34 072 = 3 · 10⁴ + 4 · 10³ + 7 · 10 + 2` | Route 5 digits, register to 13 |
| The tram line | Number line | Sneak (line) | Only some stops are labelled. He works out the step, on lines with different scales, one far from zero | `A = 25` | To 1 004 |

**Knot 1** is a Knock built from these finds. A rule guard stands in front of it. It earns the grappling hook.

**Act 2: which way they went.** It opens with the little one wandering off (see Story).

| Lead | Idea | Scene | What happens | Written | Numbers |
|---|---|---|---|---|---|
| The witnesses | Comparing, ranges | Knock | "Even side, past 230, before 240." `<` or `≤` decides whether one door counts. Ordering suspects from clues | `230 < x < 240`, `{232, 234, 236, 238}` | 3 digits, then 8 |
| The newspaper | Rounding, estimating | Unmask | "About 330" means 325 to 334. Two rough figures pin one down. One figure can't be true. The error is the distance between them | `334 ≈ 330`, `334 − 330 = 4` | To 7 digits |
| The ledgers | Adding, subtracting | Unmask (documents) | In, out and what's missing. Pairs that make round totals show who worked together. Order doesn't matter when adding. If one addend grows by 47 and the other by 26, what happens to the sum? | `423 − 37 − 54 = 423 − 91 = 332` | To 9 digits |
| The facade | Multiplying | Little one alone | Climbs with the hook. Windows are numbered along the rows, so the last of 6 rows of 7 is `6 · 7`. A wing of 0 windows | `6 · 7 = 42` | To `40 · 100` |

**Knot 2** is built from these finds, and one of them is forged. A rule guard stands in front of it.

**Act 3: the convoy**

| Lead | Idea | Scene | What happens | Written | Numbers |
|---|---|---|---|---|---|
| The crate yard | Swapping and grouping factors | Knock | Lot numbers given as products he can rearrange: `125 · 7 · 8`. The pairs that make 10, 100, 1 000. Rows of crates counted either way | `125 · 7 · 8 = 1 000 · 7 = 7 000` | To 6 digits |
| The sixth cart | Division's two meanings, zero | Load the carts | 120 crates, 20 per cart, is 6 carts, but a witness saw 5. "S nulom se ne dijeli" is shown here. A clue says one cart held *3 puta manje*, another *za 3 manje*. Clues write division both ways, `:` and `/` | `120 : 20 = 6` | To 4 digits |
| The coat | Order of operations | Unmask, then Knock | One of five people is an automaton in a coat, and it is Vučetić. Its tape holds Kristijan's address: `100 − 20 · 3 + 10 : 2` is house 45. Left to right gives 125, where the automatons are searching | `100 − 60 + 5 = 45` | Small, then to 3 digits |

**Knot 3** turns a story into one expression from his finds. A rule guard stands in front of it.

**Act 4: the hiding place**

| Lead | Idea | Scene | What happens | Written | Numbers |
|---|---|---|---|---|---|
| The locks | Brackets | Bracket locks | Doors locked with a sum that's only true with brackets in the right place. `( )`, `[ ]`, `{ }`. Number trees. Equations from part 1 return on some locks | `(3 + 4) · 3 + 3 = 24` | To 3 digits |
| Two witnesses | Distributivity, common factor | Unmask | `5 · (3 + 4)` and `5 · 3 + 5 · 4` agree. `5 · 3 + 4` is a lie. Judged without calculating, even for `409 · 86 − 309 · 86` and `100 · 86` | `409 · 86 − 309 · 86 = (409 − 309) · 86 = 8 600` | To 4 digits |
| The loop | Remainder | Sneak (loop) | A patrol walks a loop of 7 lamps with the key, and sleeps where it stands when the bell rings after 100 steps. In the Fix step the little one writes `55 : 9 = 5 ost. 10`, which can't be true, because that makes another group | `100 : 7 = 14 ost. 2` | To 3 digits |
| The hoist | Arithmetic mean | Level the load | The first part's scale returns as a bar. He levels the stacks until it balances. "38 a day in September" means 1 140 in all | `x̄ = (6 + 14) : 2 = 10`, `38 · 30 = 1 140` | To 5 digits |

**Last: the lamp oil.** Reading data, as a Knock in four steps. Each chart is new: bars of lamp oil by street, with an axis step that isn't 1; double bars for two weeks; dots of deliveries by day; blocks where one block means 10. He fills a table from a chart. One street burns at night, which is the "beyond the data" question. Written: `60 − 35 = 25` from values he read. The last rule guard stands at the door.

**Solution space.** Every clue set leaves exactly one door, every board can be solved, and every lead can be finished with all wrong paths tried. A clue he already holds, from another lead's street, removes one clue from a scene. At least one per act exists, which rewards a sharp player.

### Scene types

Each type has a first-time guided run with Nikola's guide, where only the asked move passes, and its own help.

**Knock.** He works out the door by writing.
- Clues appear in the notebook, 3–5 per scene, so he never has to remember them.
- The view closes in on a flat, scrolling row of 10–70 doors, with big plates in order. A control crosses the road, which switches between even and odd. Lifts show floors from 0.
- **His lines act on the row:**

| He writes | What happens |
|---|---|
| A clue's sum, which the notebook has already started, with his own result: `100 − 20 · 3 + 10 : 2 = 125` | The row scrolls and door 125 lights |
| A range or list using the clue's numbers, `230 < x < 240` | Doors inside stay lit, the rest go dark |
| Another line, `x ≠ 232`, `x < 236` | Fewer doors stay lit |
| Anything else, such as a bare number | The little one shakes and points at the clue. Nothing lights |
| A line that leaves no door | Same shake, and that line is struck through |

- **Undo:** tapping any of his lines strikes it through, and the doors it ruled out relight. A forged clue can be struck the same way.
- **The little one knocks only when one door is lit.** Tapping a door before then, or with clues left unused, gets the same shake and a point at the next clue. Writing is how he picks, and the notebook doesn't judge his line. The door does.
- **Right door:** it opens, with 2 parts if none of his lines were struck through in this scene.
- **Wrong door:** the door shows what his idea caused, and his line is struck through. At 125 the automatons are searching, with a left-to-right tape. A number he merely got wrong brings a grumpy neighbour. From then on, in this scene, he has to work a sum line by line, each line judged true, so changing the answer until a door opens doesn't work. On the second wrong door, the little one marks the first line that went wrong. On the third, a worked example with other numbers. No limit, and no cost.
- **Then he writes** the school form, as in the Written column.

**Sneak.** Nothing moves until he moves.
- **Goal:** reach the exit. Each tap moves him one lamp forward or back, or waits. Each patrol then takes one step along its drawn route. If a patrol ends on his lamp, he is caught.
- **Caught:** the patrol prints a notice and he returns to the start of the board. Nothing is lost.
- **Line boards, 3 per lead:** the exit is an unlabelled stop. He works it out from the labelled ones and writes it, `A = 25`, and only then does it light. A wrong stop is empty, and the next try asks for a different stop.
- **Loop boards, 3 per lead:** a patrol carries the key along a loop of lamps numbered from 0, where it starts. When a bell rings it sleeps where it stands, and he must be waiting at that lamp to take the key. First 5 lamps and 7 steps, then 7 lamps and 20, then 7 lamps and 100. He writes the division, `100 : 7 = 14 ost. 2`, and the line pins lamp 2. Time then runs by itself, counting whole loops, then the steps left over. If he's wrong he sees where it really stops, and the next try has a new bell, so he can't copy the answer.
- **Plain boards** have no maths and are used when a lead is sealed.
- A right stop or pin on the first try earns 2 parts.

**Unmask.** One of them is lying.
- 3–5 people or documents. Each question card is a sum, and asking one shows everyone's working on it. He has to ask at least 2 of the 2–4 cards before he can accuse. Documents work the same way, with each card checking one figure.
- **Two can be wrong in different ways,** so spotting the odd one out isn't enough. In the coat, one person slipped once, and the automaton goes wrong the same way every time.
- **A wrong accusation** brings offended indignation, and then that person's working is shown with the lead's object. He sees why they weren't lying, or that they slipped once and got the others right.
- **A right accusation** ends the question part, with 2 parts if it was his first. In the coat, the hat pops off to reveal gears.
- **The scene ends when he writes the guilty one's false line corrected,** line by line, each judged true. Tapping everyone can't finish it.
- Later numbers are too big to bother calculating, so he has to judge the structure.
- Penkala stands nearby reading the Book, gets `2 + 2 : 2` wrong the same way, and is not a suspect. That's the joke.

**Little one alone.** Places too small for him, so he plays as it, seen by its tiny built-in lamp.
- A small dark board with 5–8 junctions, each with a sign saying what it chooses. One tap per move.
- **The archive:** signs read hall (10⁴), row (10³), shelf (10²), box (10), folder (1), and pipes are numbered 0–9. The route comes as `3 · 10⁴ + 4 · 10³ + 7 · 10 + 2`, so he has to supply the missing 0. A wrong pipe is a dead end with a plate showing what his route means so far, such as 34 7. It beeps and goes back one junction, so it can't be lost.
- **The facade:** he taps a window to throw the hook. Windows are numbered along the rows. A wrong window shows its number and a sleepy resident, and he can turn to the other side, where the same count reads the other way.
- Reaching the end with no dead ends earns 2 parts.

**One-offs.**
- **Load the carts:** crates in tens, first shared onto 6 carts (how many on each?), which is the easier meaning, then in loads of 20 (how many carts?). Uneven carts tip. He then tries to share among 0 carts, and the crates stay on the ground for good. That shows why "S nulom se ne dijeli". Sharing 0 crates among 3 carts works fine, and each cart gets 0.
- **Level the load:** 2–6 stacks on a bar. He drags crates from tall to short, and the bar tilts until they're level. The total never changes, so each ends with total : count. Repeated values count each time.
- **Bracket locks:** a number strip with bracket pieces to drop in. Wrong placement shows the different result, and the lock stays shut. He can read a number tree as the strip.

**Rule guards.** Four, one in front of each knot and one at the last door. Each runs a misconception printed on its tape.

| Where | Rule on its tape | How he breaks it |
|---|---|---|
| Knot 1 | "A digit is worth the same wherever it stands" | 3 and 30 |
| Knot 2 | "5 always rounds down" | A number ending in 5 |
| Knot 3 | "Always calculate from left to right" | A sum where that gives the wrong result |
| Last door | "Anything can be divided by anything" | Dividing by 0 |

- All four must be beaten. He picks numbers from 6 tiles, because pupils this age struggle to find counterexamples, then writes the true line that breaks the rule. The first guard is walked through.
- A wrong pick makes the guard thank him, at no cost. A right one jams it, with 5 parts if it was his first.
- **The last guard:** dividing by zero, shown in the sixth cart, makes it spin for the rest of the game, in that street, for him to come back and look at.

**Help for each type**, free, rising one level after 60 seconds idle or after each wrong try in a scene:

| Level | Knock | Sneak | Unmask | Little one alone |
|---|---|---|---|---|
| 1 | The clue to use next wiggles | The next safe move wiggles | The card to ask next wiggles | The junction's sign wiggles |
| 2 | The line's structure, with blanks | The patrol's next 3 steps are drawn | Two suspects' working are placed side by side | The route's next part lights |
| 3 | A worked example with other numbers | A worked example on a smaller board | The lead's object shows one person's working | A worked example with another number |

Try, Fix, the one-offs and rule guards use the same steps: the next move wiggles, then is drawn, then is shown with other numbers. The `?` hint stays as it is: the first press shows the current step, the second the exact next move. A scene where he took the exact move doesn't pay its first-try parts, and nothing says so.

### Exploration and the trail map

- **The new district** has 6 streets, reached through the foundry. Grey again, with colour returning as leads finish. The ten old streets stay open.
- **Movement:** the same tap-to-walk, so nothing new to learn.
- **The trail map** extends the map overlay. Vučetić hands it over at the foundry and marks each find on it. Pins mark open leads and places, and a red thread links what he has solved.
- **The black thread** is the search party. It starts in Act 2 and has no timer.
  - It keeps up because Vučetić, who marks his finds, is the automaton in the coat, reporting to the First Automaton.
  - It reaches a lead he hasn't started twice: after the second lead he finishes in Act 2, and after the first in Act 3. The map shows beforehand which one. If he starts that lead first, it turns to another. That is the decision: which lead to save. It never reaches the coat.
  - A reached lead isn't lost. It is sealed and guarded, and gains one plain Sneak board. A lead can only be sealed once.
  - After the coat it can't read his map any more. It stops sealing, and he can watch it go to decoy doors, because it follows the steps. He has turned the hunt around.
- **"THIS HAS BEEN CORRECTED."** After the wandering-off beat and after Knot 2, one finished street with nothing open turns grey again. He can win it back at any time with a Knock of 2 clues or an equation lock. Nothing else waits on it.
- **Secrets:** 8 caches marked with Kristijan's chalk, 2 of them in the old streets, reachable only with bought gear. Each holds a sketch or lore line and 5 parts.

### The little one

Kristijan built it from scrap in the foundry. It knows one step, knocking, and imprints on whoever opens the door. He names it, and the name stays on the device. [ASSUMPTION: its body has no legs, as Luka prefers; it rolls on one wheel and hops. Final look comes with the art.]

- **It follows him** within 1–2 body lengths, reacts to where he is, and idles when he stops.
- **It is silent:** beeps, gestures, and maths it writes in the notebook. Its one printed word is "Zašto?". Tapping it replays the current lesson, and earlier lessons replay from their notebook pages.
- **It carries the lessons.** Kristijan hid the whys around the city, away from the First Automaton. Each lead has a cylinder to find, and the little one plays it.
- **It tries and goes wrong** in a predictable, funny way, writing its working in its own wobbly hand. He taps the wrong line, shows it right with the objects, and writes the right line. That mistake never comes back, so he can see it learning.
- **It never misleads him when he needs help.** The `?` hint and help stay truthful and separate, and its attempts always look like its attempts.
- **It knocks and fetches.** He can send it through chalk-marked gaps, and it comes back holding what it found.

**Gear:**

| Gear | How he gets it | What it does |
|---|---|---|
| Grappling hook | Free, from Knot 1 | Climbs to marked hooks; the facade lead uses it |
| Bright lamp | 15 parts | Shows hidden chalk and dark corners |
| Magnet | 25 parts | Pulls metal things out of gaps |
| Longer hook | 20 parts | Reaches higher hooks |
| Looks: paint and hats | 5–10 parts, 6 items | Nothing but looking good |

Bought gear opens only secrets, never leads, because parts never open the way forward.

### Teaching

Each lead follows the same steps. The research behind them comes from abstracts and summaries, some of it mixed, and it doesn't cover this game:

1. A cylinder shows the idea with objects: teach first at his age, concrete first.
2. He does it with objects and tiny numbers.
3. The same with numbers in the notebook: fading to symbols, and pillar 3.
4. The little one goes wrong and he fixes it: wrong examples beside right ones. Evidence for this is mixed, and for teaching an agent weaker still. It's here because it's cute and gives the finale its meaning.
5. The scene needs it, soon with numbers too big to bother calculating: relational thinking.

**Objects, 8 in all:** pairs (even and odd), crates (place value: 10 in a box, 10 boxes in a crate), the line (number line, neighbours, ranges, jumps, rounding), the grid (rows and columns, turned and split), packing (division and remainder), bundles (order of operations: `2 + 3 · 4` is 2 and three bundles of 4), stacks (the mean), and bars (a chart built by counting).

**Limits:** a showing lasts up to 60 seconds, with up to 2 short lines per step. After the lead, an explanation card answers Nikola's "Kako to radi?" in general terms and names the school term, 13 new cards in all. Reasons marked "added" in the content document are the ones the book doesn't give.

**School words:** objects, clues and rule guards use the book's terms throughout (*pribrojnik, umanjenik, faktor, djelitelj, ostatak, neposredni sljedbenik, jedinična dužina, tablica, stupac*), so he meets them often, not only on cards. Clues use the book's phrases: *za 54 veći, 54 puta manji, trokratnik, osmina*.

**Words to avoid:** the curriculum says not to introduce *baza, eksponent, ishodište* and *jedinična točka*. Croatian uses the long scale: 10⁹ is *milijarda* and 10¹² is *bilijun*.

### Notebook

Part 2 adds these forms:

| Form | Example | First in |
|---|---|---|
| Belonging | `10 ∈ N`, `0 ∉ N`, `0 ∈ N₀` | Two sides |
| Letter for a number | `n + 1 = 1 000` | The neighbours |
| Powers, expanded form | `10⁶`, `3 · 10² + 5 · 10 + 4` | The archive |
| Naming a point | `A = 25` | The tram line |
| Comparisons, ranges | `230 < x < 240`, `x ≠ 5`, `≤`, `≥` | The witnesses |
| Lists | `{232, 234, 236, 238}` | The witnesses |
| Approximately | `334 ≈ 330` | The newspaper |
| Sums with working, either side | `423 − 37 − 54 = 423 − 91 = 332` | The ledgers |
| All brackets | `( )`, `[ ]`, `{ }` | The locks |
| Remainder | `100 : 7 = 14 ost. 2`, `7 · 14 + 2 = 100` | The loop |
| Mean | `x̄ = (6 + 14) : 2 = 10` | The hoist |

- **The pad:** in a Knock it shows all the signs he has been taught so far, so a wrong idea can still be tried. For working lines it shows only the keys that line needs. Keys stay at least 48 px, on more than one page if needed.
- **Big numbers:** he can write up to 15 digits and reads longer ones.
- **His lines before a door** start from the clue, and end in a result, a range or a list. The door judges whether they're right.
- **Working lines** must be true: a sum must equal the line before and reach the find, and `∈`, `≈`, ranges and lists are checked for truth. A false one bounces and goes back to the draft, with a wobble from the little one. They use the same fading of blanks as rooms. Equations in rooms are judged as before.
- **Set-builder form,** `{x: x ∈ N i 3 ≤ x < 30}`, is read in clues but not typed.

### Story integration

Story lines come between scenes; scenes have their own short lines. Dialogue stays linear. Details go into the narrative document.

- **Opening:** the gate opens, the foundry is empty, and a notice says Kristijan has been moved. He meets and names the little one.
- **Act 1:** where they took him. Faust recognises the little one's scrap.
- **Start of Act 2, a beat:** the little one wanders off after a wind-up toy. It was Nikola's first attempt at an automaton. He finds it from neighbours' clues in one Knock, knocking himself, with its shakes replaced by the neighbours' grumbling. No other lead opens until then.
- **Knot 2, a beat:** one of his finds, brought by Vučetić, is a note in Kristijan's hand with a careless mistake, which Kristijan never makes. It sits among the clues, and striking it works like striking a line. If he follows it, the door is a trap: a plain Sneak board and a polite notice, and the note is then struck for him. The knot works without it.
- **Act 3:** the convoy. A warning that someone is reading his map builds to the coat at the end of the act, where Vučetić turns out to be the automaton. The real Vučetić is found locked away, and the black thread loses its way.
- **Midway, open:** Faust suggests the little one is Kristijan's second try: the first automaton got steps, and this one was to be taught why.
- **The end of this part is a near miss:** the lamp is still warm. Kristijan's note addresses him by name, the first time he speaks to him directly, and leaves a new cylinder for the little one. The First Automaton's last notice is the first it has ever put as a question: how did he read that? The last clue needs divisibility, the next chapter. One option is gear teeth that mesh only if one number divides the other.
- **The finale comes at the end of 5th grade,** not here. [ASSUMPTION: the story finishes then, because the brief stays with 5th grade for now; Luka can veto.] The First Automaton asks why, and the little one answers by replaying a year of what he showed it. It prints its usual "HVALA", and this time it means it. The save must keep his fixes from the first one.
- **Open, Luka's call for later:** whether the First Automaton takes the little one near the finale.
- **Townspeople:** Vučetić is his ally until the coat. Penkala reads left to right from the Book, Nikola builds his own little automaton, badly, and Faust looks after the little one in the workshop and knows more than he says. Zagorka reports his work as "netko pametan" and prints his name at the end of this part. Milka keeps trying to feed the little one kifle.

**Text:** about 300 short lines, and all need Luka's eye. Part 1 planned 73 and ended far larger, so this may grow too.

| Text | Lines |
|---|---|
| Story | About 60 |
| Clues, mostly numbers | About 60 |
| Showings | About 60 |
| Suspects and documents | About 40 |
| Neighbours and doors, a pool of 8 per act, none repeated in a scene | About 30 |
| Cards, lore, tapes, guides and help | About 50 |

### Items

There is no inventory screen. Clues and finds live in the notebook, gear shows on the little one, and secrets go to the workshop wall. A clue can be reread any time. Nothing is combined or used up.

### Environmental storytelling

Kristijan's chalk marks point to gaps and secrets. Punched-tape notices appear as the black thread arrives. Sealed doors and turned-out rooms show where the search party has been, and houses it has searched stay marked.

### Fights in part 2

Fights keep mental multiplying and adding going, and clues carry the ideas.

- **Three new lairs** in the new district: armour 80, 100 and 120, base parts 7, 8 and 9. Starting values, to be set by simulation like the first lairs. They stand apart and hold no lead, so fights never block the way.
- **New upgrade, brackets, 30 parts,** on sale after the coat: the strike can be `a · x + b` or `a · (x + b)`, chosen each strike. Brackets hit harder, but a clean cut may need the plain form. "Udari" still asks how big the strike will be.
- **Targets:** with all upgrades, a reasoning player wins about 90%, 80% and 60%, and a random player at most 40%, 20% and 10%.

### Economy in part 2

| Source | Parts |
|---|---|
| First-try door, accusation, pin or board | 2 each, about 30 across the part |
| Rule guard, first try | 5 each, 20 in all |
| Secret | 5 each, 40 in all |
| Fights | As before, plus the new lairs |

| Sink | Parts |
|---|---|
| Bright lamp, magnet, longer hook | 60 |
| Looks, 6 items | About 45 |
| Brackets upgrade | 30 |

Sinks come to about 135 against about 90 from outside fights, so buying everything takes at least 4 fights.

### Save

His live save must carry over. New data joins the current save version with safe defaults, so an old save simply starts with none of it. The gate opens from what the save already holds: room 13 done and the boss beaten, a record that survives his rewinding.

It must keep:
- **The little one:** name, looks, gear.
- **What it was taught:** every fix, with the lead, the mistake and what he showed and wrote, kept for the whole year. The finale reads this.
- **The hunt:** leads and knots done, sealed leads, thread positions, corrected streets, secrets, story beats and the forged note's state, jammed rule guards, first-try rewards already paid, doors tried, and his notebook pages for each lead.

Saving happens after every line, knock, accusation, pin, junction, finished board and fix. A lead in progress resumes from the last of these. The play log adds leads, doors tried, first tries and rule guards for Luka's view.

**His live save stays out of it until Luka opens it.** The main branch deploys to him, so part 2 stays behind the dev switch until enough is playable, and the gate stays sealed for him until then.

### Art and audio

- **Streets:** 6 painted streets, grey and restored, so 12 paintings.
- **Door rows:** 3 facade sets that repeat, with crisp number plates.
- **Boards and charts:** Sneak and Little one alone boards, bracket locks, carts, the hoist and charts, drawn on the blueprint look.
- **Characters:** the little one with poses for following, idling, hopping, knocking, shaking, pointing and fetching, plus 4 gear pieces and 6 looks; about 5 new townspeople; 2 patrols and 4 rule guards; Vučetić with his hat off, showing gears; three new lair automatons.
- **Audio:** its beeps, knocks and the tape printer, with one new music layer per act.

Images are recorded in the project's credits file.

### Technical targets

- 60 FPS on his tablet while walking with the little one following and while scrolling a door row.
- Doors, pad keys and suspects at least 48 px at 640 × 360.
- All 16 leads completable with every wrong path tried, without losing anything.

### Paper test for this part

The four task types carry over, with new numbers that don't appear in a lead. Items are in the brief's addendum. Each act has at least one predicting moment and one story-to-maths moment, so the test measures what was trained: the loop pin, the sum's change, the knot's expression.

### Success signals

Thresholds are working targets for one child. His reports beat any of them.

| Signal | Target | Tests |
|---|---|---|
| Comes back without being asked | At least 4 sessions he starts himself | Novelty, the reason for this loop |
| First tries, across all scene types | More often in Act 4 than Act 1 | Reasoning, not guessing |
| Open leads | He picks a lead other than the nearest at least once | Whether choice matters to him |
| Goes back | Finds at least 1 secret with bought gear | Growth |
| Paper test, before vs after | Better on at least 3 of 4 tasks | Pillars 1 and 3 |

**Check after the first lead.** When epic 8 ends, Luka plays the first street. If clues are muddier than rooms, this design changes before epics 9–12 begin.

### Not in part 2

- **A clue trail for a friend.** Deferred, because the workshop's rooms already carry pillar 4 and this would be another builder.
- **The finale.** Later chapters.
- **Divisibility and everything after it.**
- **Written column arithmetic as a taught skill.** He meets it at school, and big numbers are there to be reasoned about. Fights keep mental arithmetic going.
- **Any timer,** and any way to lose a lead.

---

## Progression and Balance

### Player Progression

| What grows | How | Where it shows |
|---|---|---|
| Understanding | Solving, predicting and writing | Prompts fade; he needs less help |
| Ways to solve | Balance in room 3, gear chain in room 7, recording drum in room 12 | New moves on the same machine |
| The city | One restart per room, 13 in all | Colour, motion and sound on the map |
| Fight strength | Three upgrades bought with parts | Harder automatons become winnable |
| Builder options | Forms and options met in rooms, pieces bought with parts | Harder rooms for friends |

### Difficulty Curve

Three things ramp separately: equation form, number size and scaffolding. Rooms 4, 9 and 11 are the hard points: he loses the dial, then x reverses direction, then the numbers go out of reach. Rooms 6, 10 and 12 change the kind of thinking rather than adding difficulty, so they double as breathers.

Fights ramp separately through armour 20, 30, 45 and 60, and he chooses when to take them on.

### Economy and Resources

Parts are the only currency, and they never open the way forward.

| Source | Parts |
|---|---|
| Right prediction | 2 each, about 30 across the district |
| Average fight with reasoning, simulated, losses included | 8.5–13 at armour 20–45 |
| Average fight placing dice at random, simulated, losses included | 2.5–7 at armour 20–45 |

| Sink | Parts |
|---|---|
| All three fight upgrades | 90 |
| Typical one-machine room | 10–15 |
| Three-machine room with two blinds and a planted mistake | About 60 |

All three upgrades take about 8–10 fights with good reasoning. Losing removes a quarter of his unspent parts until he recovers the pile, which rewards spending parts rather than hoarding them.

---

## Level Design Framework

### Level Types

| Node type | Count in MVP | Purpose |
|---|---|---|
| Room | 13 | The room loop, in the five types under Core Puzzle Mechanics |
| Automaton lair | 4 | Optional fights for parts |
| Workshop | 1 | Building and sending rooms |
| Closed gate | 1 | The foundry, signalling the next tool |
| Friend's room | Any | Opened by link, outside the map |

Rooms hold 1 to 3 machine stages and should take about 5–10 minutes each [ASSUMPTION: untested estimate]. That makes about 2 hours of rooms, plus fights and building.

### Level Progression

Room order, gates and return trips are under Level Structure. Each room's restart must change something visible on the map.

---

## Art and Audio Direction

### Art Style

**A living blueprint.** Ink line drawings on aged paper, like an engineer's sketchbook. Brass and copper appear only on machines he has restarted, so the map starts grey and gains colour and motion as he plays.

- Mechanisms are exposed, so cause and effect can be read at a glance. Machinarium is the reference for the mood, not the pixel hunting.
- Numbers on weights are at least 20 px on a tablet, and colour is never the only signal.
- With no artist, art is drawn in code and shaders, plus AI-generated or bought images where they look better. Anything that moves or shows a number (pans, pieces, gears, dial, chain, drum) is drawn in code, so its states stay exact. Images carry the map, room backdrops, machine housings, automatons and character looks.
- Each image is made in its restored colours; the grey state comes from a shader, so the two always match.

### Audio and Music

- **Machine sounds:** a tick per dial notch, a thunk when the pans level, a steam hiss on a jam.
- **The city's sound is the music.** Each restarted machine adds its own rhythmic loop at a shared tempo, so the city audibly comes back to life, in line with Pillar 2.
- **No voice acting.** A mute control is always available.

---

## Technical Specifications

### Performance Requirements

| Target | Value | Measured by |
|---|---|---|
| Frame rate | 60 FPS while dragging the dial | On his tablet, in a three-machine room |
| First load | A loading screen shows progress; under about 15 seconds | On home Wi-Fi, with an empty cache; later launches load from the device |
| Download size | No hard cap, because graphics come first; soft budget 30 MB | Total on first load |
| Touch response | Dial and pans follow the finger within one frame | On his tablet |

### Platform-Specific Details

- **Delivery:** a browser link with no installation, accounts or server. Hosting is static files only.
- **Devices:** his Android tablet in landscape first; phone in landscape and computer also work. Friends' devices are unknown, so links must also open on iPads and iPhones. [ASSUMPTION: his tablet is a model from the last few years, running Chrome.]
- **Saving:** automatic, on the device, after every written line and every fight. A backup link restores progress if browser data is cleared or he changes device.
- **Room links:** at most 2,000 characters, so they survive messaging apps. A link holds the room and nothing about the sender.
- **Privacy:** no analytics or tracking, and no personal data leaves the device. His character's name is never put in a link.
- **Play log:** dates, rooms, ways used, predictions, wrong lines, fights and rooms built are kept on the device only, in a view for Luka that his son doesn't see.
- **Language:** Croatian only, with all text kept in one place. Notation follows school: `·`, `:`, and a space as the thousands separator (`5 905`).

Engine and system design belong to `gds-game-architecture`.

### Asset Requirements

| Asset | Budget |
|---|---|
| Machine parts kit | About 30 reusable pieces |
| City map | 1 illustration with grey and restored states for 19 nodes |
| Character looks | 4–6 |
| Automatons | 4 sizes |
| Audio | 13 machine loops and about 20 effects, synthesised or openly licensed |
| Text | About 73 short lines (60 story lines, 13 notebook notes), 15 explanation cards and 20 room titles |

---

## Development Epics

### Epic Structure

Each epic ends in something playable. Details are in `epics.md`.

| # | Epic | Playable result | Estimate (hours) |
|---|---|---|---|
| 1 | First machine | Rooms 1–4 on the tablet, one after another | 10–14 |
| 2 | The city | Rooms 1–7 on a map, with saving, story and hints | 8–12 |
| 3 | Automaton fights | Four lairs, parts, drops and upgrades | 6–10 |
| 4 | The whole district | All 13 rooms, through the line reveal | 12–16 |
| 5 | Rooms for friends | Build a room, send it and get a reply | 8–12 |
| 6 | Ready for the surprise | Final art, sound, Croatian text and the paper test | 8–12 |
| 7 | The gate and the little one | The gate opens from his live save; he names it and it follows him | 8–12 |
| 8 | Clues and doors | One Knock lead played from the trail map to the written line, with the new notebook forms | 16–24 |
| 9 | Three more ways to play | One lead each of Sneak, Unmask and Little one alone | 20–30 |
| 10 | The whole trail | All 16 leads, the knots, rule guards, twists, the black thread and the near miss | 24–34 |
| 11 | Growth and fights | Gear and secrets, new lairs and brackets | 8–14 |
| 12 | Ready for him | New art, sound, Croatian text and the paper test | 8–12 |

**Sequence:** 1 → 2 → 3 and 4 in either order → 5 → 6. Part 2: 7 → 8 → 9 → 10 → 11 → 12.

**Size:** part 1 was planned at 52–76 hours, or about 5–8 weeks at 10 hours a week, plus 2 weeks of testing. This is more than the brief's 3–4 weeks, because the gear chain, linked machines, blinds, planted mistakes and reply link were added. If time runs short, linked machines and the reply link can come last within epic 5; nothing drops without Luka's say.

Part 2 is estimated at 84–126 hours, larger than part 1, because each scene type is a new build. The estimate is rough. Nothing drops without Luka's say.

---

## Success Metrics

### Technical Metrics

- The performance targets above are met on his tablet.
- No progress is lost during the 2-week test.
- Room links open correctly on tablet, phone and computer after passing through a messaging app.
- The line checker accepts every correct line, and rejects every wrong one, in a test table covering all 13 rooms.

### Gameplay Metrics

Measured over 2 weeks from the play log and the paper test. Thresholds are working targets for one child, not validated measures.

| Signal | Target | Tests |
|---|---|---|
| Comes back without being asked | At least 4 sessions he starts himself | Goal 2; "homework from Dad" if it fails |
| Paper test, before vs after with new numbers | Better on at least 3 of the 4 tasks | Pillar 1, Pillar 3 |
| Prediction accuracy | Higher in rooms 9–13 than in rooms 3–6 | Pillar 1: reasoning, not guessing |
| Ways used | At least two by room 11 | Three ways, one idea |
| Reaches the clock tower | By day 14 | Pillar 2 |
| Builds and sends a room | At least one, unprompted | Pillar 4 |
| Fights don't replace rooms | Rooms keep advancing, and he still takes armour 45 or more after a loss | "Quiz with swords"; fear of losing |

---

## Out of Scope

**Not in the MVP:**

- Live play with friends, and leaderboards
- Other topics and tools, including area and perimeter
- Equations with like terms, brackets or nesting, and `a : x = b`
- Inequalities as a taught topic; the fights use "enough blows" informally
- Large-number fights, such as a ×10 blade
- Accounts, a server, free-text chat and collection of children's personal data
- Par times, scores, stars and daily puzzles, ruled out by Pillar 2

**Deferred until after the MVP:**

- **Parts one at a time, adjusted to where his class is, in the order of his book:** natural numbers (part 2), divisibility and primes, shape and measurement including area, volume and angles, fractions, decimals. Sets come where they're needed. Each part may play differently.
- **Multiplayer path:** a server-backed view of friends' results, then live play with friends, with no time pressure and no free-text chat.
- **The rest of elementary school maths.** Parked as a possible growth path.

**Never taught in the game:** compass constructions and protractor work stay on paper. Units and money appear in clues and fights but aren't taught as topics. Rounding and data, once kept out, are taught in part 2.

---

## Assumptions and Dependencies

**Assumptions:**

- [ASSUMPTION: a final check line suits his class. The book page seen shows tasks, not method, but checking is sound either way.]
- [ASSUMPTION: rooms take about 5–10 minutes each; untested.]
- [ASSUMPTION: his Android tablet is a model from the last few years, running Chrome.]
- His son has not played the proof of concept, per the brief.
- Fight balance comes from scripted players, not people.
- Writing-driven machines will feel like a payoff, not homework. This is the biggest design bet, and it is tested only when he plays.
- **Part 2:** the detective format itself has no research behind it. Its teaching steps have some, read only in abstracts and summaries. Whether clues are clearer than rooms or muddier shows on the first street. The sources are in the brainstorming session.
- [ASSUMPTION: a part 2 lead takes 10–15 minutes.]
- [ASSUMPTION: the little one has no legs, rolling on one wheel and hopping. Final look comes with the art.]
- [ASSUMPTION: the story finishes at the end of 5th grade. Luka can veto.]
- Part 2 keeps the same tap-to-walk and look. Luka was offered this over side-on streets and a case board, then answered with the five changes, so this is assumed.

**Dependencies:**

- Luka with Claude Code, with no artist or composer. Art is drawn in code or comes from AI-generated or bought images; audio is synthesised or openly licensed.
- An image generator or bought asset packs for the images. Claude writes the style guide and the prompts; producing the images needs one of these.
- Free static hosting for the link.
- Messaging apps preserving links of up to 2,000 characters.
- `sources/` in the brief folder, for curriculum and textbook reference.
