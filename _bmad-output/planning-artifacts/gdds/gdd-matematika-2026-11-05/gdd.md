---
title: "matematika (working title) - Game Design Document"
game_type: "puzzle (primary), metroidvania gating (secondary)"
platforms: "web browser, tablet first; phone and computer also work"
status: final
created: 2026-11-05
updated: 2026-11-05
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

### Target Audience

**Primary: Luka's son.** 5th grade, in Croatian, playing mainly on a tablet. He plays Minecraft, Zelda and Roblox, also liked Wildermyth and Supraland, and plays a D&D-style game with Luka using a simplified Blades in the Dark mechanic. These games reward working out rules, building things and having a story that is his. None of them quizzes him, so they are the bar.

**Secondary: his friends and classmates.** They arrive through a link he sends them. The game is not designed for anyone else yet.

### Unique Selling Points (USPs)

- **The machine shows the idea.** The scale shows equality, and dragging x shows why the equation is called linear.
- **Writing starts the machine.** Each written line acts out on the scale, the connection CARNET's textbook text never makes.
- **The fight is the equation.** `6 · 3 + 2 = 20` is the strike, not a question in front of it.
- **Stumping a friend takes understanding.** Planting a believable wrong line means knowing why it is wrong.
- **In Croatian, tied to his book.** Forms and notation follow *Matematički izazovi 5*, for one known child.

---

## Goals and Context

### Project Goals

1. **Real understanding.** He can reason about a topic in situations he has not been drilled on: judging without calculating, predicting what changes, explaining why something is wrong, and moving between a story or picture and the maths.
2. **He comes back by choice.** The game has to compete with Zelda, not with homework.
3. **A structure that carries over.** The second tool, area and perimeter, tests whether it does. That test is after the MVP.

**Hypothesis the MVP tests:** tinkering with a visual model and using it in new places makes him better at the four understanding tasks on paper, and he comes back without being asked.

### Background and Rationale

School makes you solve exercises until you can solve exercises. It rarely shows what a linear equation is, or why it is called linear. Luka wants his son to really understand the maths he is learning. This is a passion project for one child, and possibly his classmates, and it stays with 5th grade for now.

The game is a deliberate surprise, so his son has no input before the MVP. The 10-minute proof of concept, `jednadzbe.html`, is not the basis; only two of its ideas carry over: an equation as a scale, and giving a puzzle to another kid.

The source brief, with research, curriculum references and the paper test, is in `_bmad-output/planning-artifacts/briefs/brief-matematika-2026-11-05/`.

---

## Core Gameplay

### Game Pillars

1. **The machine teaches, not the text.** He acts on the mechanism and sees what his idea causes, so he can be wrong about the idea, not only the sum. Rules come from poking at it; explanations follow and prompts fade. Rewards go to reasoning and predictions, not arithmetic. *Decides:* no instruction screen comes before a room.
2. **The city answers him.** Success shows as the city changing, never as a grade: no stars, scores or "correct" screens. *Decides:* solving a room restarts something visible on the map.
3. **Every idea lands on paper.** Each idea connects to what he writes in class and how he is tested on paper. *Decides:* a room isn't finished until the solution is written the way school expects.
4. **Making is proof.** To build a room for a friend, he has to make it work himself; the game doesn't do that part for him. *Decides:* a room can't be sent until he has solved it himself.

### Core Gameplay Loop

Two nested loops: a room loop lasting minutes and a city loop lasting days.

**Room loop**

| Step | He does | He sees | Pillar |
|---|---|---|---|
| 1. Arrive | Opens a stopped machine | What's stuck and what it would drive | City |
| 2. Poke | Drags x and tips the pans | The machine's behaviour, with nothing at stake | Machine |
| 3. Predict | Commits to what will happen before it runs | A right call earns bonus parts; a wrong one shows what his idea caused | Machine |
| 4. Set | Finds where it balances | The pans level, but the machine still won't run | Machine |
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
| x dial | Whole numbers only, one notch per step. Range is set per room. In division forms, each notch is a multiple of the divisor. |
| Tilt | 1° per unit of difference between the sides, clamped at ±15°; big-number rooms scale this per room. Each notch tips the pans by the same amount, and more gears tip them faster. |
| Readouts | Both sides' values show while dragging, except in rooms about judging without calculating. |
| Poke window | At first the dial moves only 3 or 4 notches. In `3x + 2 = 20` he sees 2, 5, 8, 11, then predicts where it levels. |
| Prediction | The pin is a small flag. A tag on its holder says what to do. He can still turn the dial inside the poke window, places the pin, and confirms beside it. The machine then tests the pin itself: it turns the dial to the pin (or weighs the pin's x where the dial can't reach), and the pans show whether he was right. A right call earns 2 bonus parts at once, from room 3 on, and once per stage, so resetting earns nothing. A wrong one loses nothing. Only then does the full dial range open. |
| Too far to drag | The dial stops short of the answer. In `5 905 − 27x = 316`, x = 207 but the dial reaches 30, so he sees the rate and needs another way. |

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
| Balance | Pans | Every move acts on both sides at once, because you may only do on the left what you do on the right. A weight or balloon from the tray, dropped on the scale, lands on both sides; a number dragged off one side comes off both; the splitter, set to n, divides both sides into n equal groups and keeps one. There is only one x, the slider's: the scale keeps weighing at it, so at a wrong x it stays out of balance through every move (at 6: 17 vs 23, 12 vs 18, 6 vs 9), and no move can fake a solution. A goal card beside the scale (`Cilj: x sam`) shows the target, one x alone against a number, and lights when the pans match it. Each move writes its lines (`2x + 5 − 5 = 23 − 5`, `2x = 18`); he writes `x = 9` himself, and in a room whose only way is Balance it is accepted only after a line with x alone against a number ("Prvo pojednostavi vagu."). A split that doesn't divide evenly is refused. | `2x = 18`, `x = 9` |
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

The world structure borrows gating, backtracking and softlock rules from metroidvania design. Sequence breaking does not apply, because rooms connect on a map with no free walking or real-time action.

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
| Find the mistake | Explaining why something is wrong | A notebook holds one wrong line and the machine is jammed. After pinning, he acts out what the line did on the pans, sees them tip, then fixes it | The wrong line |
| Story | Moving between a story and the maths | He builds the pans from a story, then picks the story that fits a set of pans | The matching story |

### Puzzle Progression

13 rooms. Names are placeholders.

| # | Machine | Equation | x | x is | Type | What it teaches |
|---|---|---|---|---|---|---|
| 1 | Door lift | `x + 4 = 9` | 5 | Counterweight still needed | Solve | The dial and the pans; level means equal |
| 2 | Street lamps | `3x = 12`, then `x : 3 = 5` | 4, 15 | Oil per lamp, then a full tank | Solve | Each notch moves the pan by the same amount |
| 3 | Sluice gate | `x − 6 = 8`, then `20 − x = 6` | 14, 14 | Water before the release, then water to release | Predict | First pin; in the second form x pulls the other way. Earns Balance |
| 4 | Water wheel | `2x + 5 = 23` | 9 | Load per bucket | Solve | The dial stops at 6, so he has to move weights |
| 5 | Bridge | `3x + 4 = 22`, then the 22 becomes 25 | 6, 7 | Length per plank | Predict | What a change does, without solving |
| 6 | Weighing yard | `x + 56 = 58 + 27` | 29 | Weight of a crate | Compare | Judging equality without adding. Opens the workshop |
| 7 | Old logbook | `3x − 1 = 17`, `3x = 18`, with the wrong line `x = 15` | 6 | Teeth per gear | Find the mistake | `3x` is three of x, not 3 + x. The wrong line is Kristijan's planted signal. Earns the gear chain |
| 8 | Tram | `4x + 9 = 41` | 8 | Length per rail | Solve | Running the chain backward moves the pans too |
| 9 | Steam lift | `135 − 5x = 100` | 7 | Pressure per valve | Predict | x-balloons: x lightens the pan, and the inverse is `135 − 100` |
| 10 | Market scales | `60 + 3x = 90`, then the story for `5 + 2x = 19` | 10, 7 | Price of a cog | Story | A wrench at 60 and 3 equal cogs cost 90 together; then pans into a story |
| 11 | Great wheel | `5 905 − 27x = 316` | 207 | Load per spoke | Solve | Too far to drag; the rate alone won't finish it |
| 12 | Junction | `2x + 3 = 11` feeds `3x + ☐ = 19` | 4, 5 | Gear sizes, the first passed to the second | Solve | Linked machines. Earns the recording drum |
| 13 | Clock tower | `3x + 5 = 20`, then `50 − 4x = 34` | 5, 4 | Turns of the winder | Predict | The line reveal |

| # | Dial range | Poke window | Pin | Ways that can finish |
|---|---|---|---|---|
| 1 | 0–10 | None | None | Try values |
| 2 | 0–10, then 0–30 in 3s | None | None | Try values |
| 3 | 6–20, then 0–20 | First 4 notches, then none | Where it levels, then which way the pan moves as x grows | Try values |
| 4 | 0–6 | None | None: room 4 introduces only Balance | Balance |
| 5 | 0–10 | First 4 notches | Where it levels, then where it levels after the change | Try values, Balance |
| 6 | 20–40 | None | x, with readouts hidden | Try values, Balance |
| 7 | Locked | None | The wrong line | Balance |
| 8 | 0–5 | First 4 notches | Where it levels, beyond the dial | Balance, Undo |
| 9 | 0–10 | First 4 notches | Where it levels | All three |
| 10 | 0–15 | None | The matching story | All three |
| 11 | 0–30 | First 4 notches | x under 100, 100–300 or over 300 | Balance, Undo |
| 12 | 0–10 each | First 4 notches | Where each levels | All three |
| 13 | 0–10 | Whole dial, with the drum | The next dot | All three |

**Line reveal.** The recording drum draws a dot for each x he tries, with the right-hand side as a level line. In `3x + 5 = 20`, x = 3 to 7 gives 14, 17, 20, 23, 26. He pins the next dot before dragging, the dots form a straight line, and it crosses the level line at the answer. The second equation draws a falling line. Only then does the explanation appear: "linearna" comes from "linija".

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

**Sequence:** 1 → 2 → 3 and 4 in either order → 5 → 6.

**Size:** 52–76 hours, or about 5–8 weeks at 10 hours a week, plus 2 weeks of testing. This is more than the brief's 3–4 weeks, because the gear chain, linked machines, blinds, planted mistakes and reply link were added. If time runs short, linked machines and the reply link can come last within epic 5; nothing drops without Luka's say.

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

- **Tools one at a time**, adjusted to where his class is, in the brief's proposed order: area and perimeter, divisibility and primes, fractions and decimals, volume, angles and symmetry, sets. Rooms needing several tools at once start with the second tool.
- **Multiplayer path:** a server-backed view of friends' results, then live play with friends, with no time pressure and no free-text chat.
- **The rest of elementary school maths.** Parked as a possible growth path.

**Never tools:** compass constructions and protractor work stay on paper; units, rounding, money and data belong in fights and story.

---

## Assumptions and Dependencies

**Assumptions:**

- [ASSUMPTION: a final check line suits his class. The book page seen shows tasks, not method, but checking is sound either way.]
- [ASSUMPTION: rooms take about 5–10 minutes each; untested.]
- [ASSUMPTION: his Android tablet is a model from the last few years, running Chrome.]
- His son has not played the proof of concept, per the brief.
- Fight balance comes from scripted players, not people.
- Writing-driven machines will feel like a payoff, not homework. This is the biggest design bet, and it is tested only when he plays.

**Dependencies:**

- Luka with Claude Code, with no artist or composer. Art is drawn in code or comes from AI-generated or bought images; audio is synthesised or openly licensed.
- An image generator or bought asset packs for the images. Claude writes the style guide and the prompts; producing the images needs one of these.
- Free static hosting for the link.
- Messaging apps preserving links of up to 2,000 characters.
- `sources/` in the brief folder, for curriculum and textbook reference.
