---
title: "Game Brief: matematika (working title)"
status: final
created: 2026-11-05
updated: 2026-11-05
---

# Game Brief: matematika (working title)

**Pitch:** a 2D exploration puzzle game in Croatian, set in a clockwork city that has stopped working. A 5th grader earns tools that are really maths ideas, uses them anywhere in the city, hunts clockwork automatons for parts, writes the maths down the way school expects, then builds rooms to stump his friends.

## Why this exists

School makes you solve exercises until you can solve exercises. It rarely shows what a linear equation is, or why it is called linear. Luka wants his son, in 5th grade, to really understand the maths he is learning, and the game exists for that.

This is a passion project for one child, and possibly his classmates. For now, it stays with 5th grade, starting with one topic.

Luka's earlier proof of concept, `jednadzbe.html`, built in 10 minutes, is not the basis of this game. Only two of its ideas carry over: seeing an equation as a scale, which shows that things are equal, and giving a puzzle to another kid.

## Vision

**Core fantasy (draft):** "I work out how this city really runs, then get it moving again when nobody thought I could."

**What he walks away with:** "Oh, so that's what it means," and the pride of a room his friend couldn't crack.

**What understanding means here:** He can reason about a topic in situations he has not been drilled on. That means four tasks: judging without calculating, predicting what changes, explaining why something is wrong, and moving between a story or picture and the maths. Using a tool somewhere new tests this inside the world; the paper test and examples are in `addendum.md`.

## Players

**Primary: Luka's son.** 5th grade, in Croatian. He plays Minecraft, Zelda and Roblox, and also liked Wildermyth and Supraland. He and Luka play a D&D-style game with a simplified Blades in the Dark mechanic. His games reward working out rules, building things and having a story that is his. None of them quizzes him, so those games are the bar.

**Secondary: his friends and classmates.** They arrive through a link he sends them. The game is not designed for anyone else yet.

## Core fundamentals

**Genre:** 2D exploration puzzle game in the spirit of Zelda and Supraland, with turn-based dice fights, played alone, but with rooms shared between friends.

**World and look:** a clockwork city that has stopped working. Everything is a mechanism, so balancing, fitting and splitting feel natural, and progress is visible as parts of the city start moving again. Why it stopped is open for the game design document (GDD). The story stays light and makes his character matter. The look is 2D and mechanical; style and audio are not decided.

**Structure: one world, with maths ideas as tools.**
- Each idea is a tool he earns and keeps, and it works anywhere in the city.
- Places he can't reach until he has the right tool stay visible.
- Later rooms need several tools together. For example, a plate 5 wide that must cover an area of 40 is `5 · x = 40`, which ties equations to geometry.
- Rooms connect on a map, with no free walking and no real-time action, to keep the game buildable.

**Core loop:**
1. Reach a room with a problem: something must balance, fit or split.
2. Tinker with his tools and watch what happens.
3. Predict before checking.
4. Solve it, then write the steps.
5. Watch part of the city start moving again, earn the next tool, and return to places that were closed.
6. Build a room and send it to a friend.

**Pillars:**
1. **He can be wrong about the idea, not only the sum.** He acts on the model and sees the consequences. Rewards go to reasoning and predictions, not clean arithmetic.
2. **He works it out before being told.** As in Supraland and Zelda, the rules come from poking at the system. Explanations follow, and prompts fade.
3. **Every idea lands on paper.** The game connects each idea to what he writes in class and how he is tested on paper, or it hasn't worked.
4. **Making is proof.** To build a room for a friend, he has to make it work himself. The game doesn't do that part for him.

**First tool: the scale with draggable x.** In `3x + 2 = 20`, x = 5, 6, 7 gives 17, 20, 23. Each step moves the left side by 3, so the scale tips steadily and has one level point. Plotting those values reveals a straight line, which is why the equation is called linear. The scale shows equality, and dragging shows linearity.

**Three ways to solve, one idea.** He tries values by dragging, balances both sides, and undoes operations. In `2x + 7 = 25`, balancing and undoing both lead to `2x = 18`, which shows why undoing works. Any correct method is accepted. He also sees the inverse-operation form that 5th grade materials mostly use, so nothing clashes with class.

**Combat is where the exercises live.** He hunts clockwork automatons for parts in short turn-based fights with dice. The exercise is the fight, not a question in front of it: dice set the numbers, and he works out how many blows he needs or where to place his dice before striking, so a wrong idea costs him the fight. Parts pay for upgrades and for pieces of the rooms he builds. Repetition builds confidence, so fights are always available, but they never block the way forward and have no time pressure. Examples are in `addendum.md`.

## References

| Title | Take | Leave |
|---|---|---|
| Supraland | Learning rules by experimenting; new tools reopen earlier places | 3D, length |
| Zelda | Small puzzle rooms; tools that work everywhere | Open world |
| Wildermyth | A story that makes his character matter | Tactical combat |
| Machinarium | A 2D mechanical city explored room by room | Pixel hunting; puzzles that don't build on each other |
| Minecraft, Roblox | Gathering parts, making things and sharing them | Open chat, accounts |
| Zombie Division | The maths is the attack | Its younger audience |
| Prodigy | Fights as a reason to keep playing | A quiz in front of each attack; ad load |
| DragonBox Algebra | Showing algebra as objects first | Heavy scaffolding |

**What is different:** CARNET's open textbook shows a balance scale and teaches written equation rules, but its text never connects the two (its videos and applets were not seen). It also states the area and volume formulas and the divisibility rules without giving reasons. This game exists to make those connections, in Croatian, tied to his actual book, for one known child.

## Scope and MVP

**Platform:** a browser link that works on phone and computer, with no installation, accounts or server.

**Team and time:** Luka with Claude Code, 3 to 10 hours a week, possibly more, so time is not the limit. Estimated at about 3 to 4 weeks to build the minimum viable product (MVP), then 2 weeks of testing with his son.

**MVP (the first district of the city):**
- One tool, the scale with draggable x, ending with the line reveal.
- About 12 connected rooms, covering equations from one-step forms up to the two-step forms on p. 78 of his book, such as `2x + 7 = 25` and `135 − 5x = 100`, plus word problems that can be written in those forms.
- One type of automaton fight with dice, for the exercises.
- One closed place that shows a next tool is coming.
- All three ways to solve, with the written steps for each.
- Sending a room to a friend by link.

**The hypothesis it tests:** tinkering with a visual model and using it in new places makes him better at the four understanding tasks on paper, and he comes back without being asked.

**How it is tested:** give him the paper test before he plays and again afterwards with new numbers, then watch whether he returns by himself over 2 weeks.

**Not in the MVP:** live play with friends; other topics; equations with like terms, brackets or nesting; `a : x = b`; leaderboards; and the rest of elementary school maths.

**Later multiplayer:** seeing whether a friend cracked a room he sent, then playing live with friends. No time pressure, no free-text chat and no collection of children's personal data. The path is in `addendum.md`.

**After the MVP:** tools are added one at a time, adjusted to where his class is. The proposed order and reasons are in `addendum.md`, under Candidate tools. Some topics won't get a tool: compass constructions stay on paper, and memorised facts like units belong in fights and practice.

## Risks and open questions

- **It feels like homework from Dad.** The biggest risk. His bar is Zelda, and this is his parent's goal, not his. The game is a deliberate surprise, so he has no input before the MVP, and whether he returns by choice is the first real signal. That is another reason to keep the MVP small.
- **Combat turns into a quiz with swords.** If a question just stands in front of each hit, it is the drill Luka wants to escape. The maths has to decide the fight. His son could also grind and skip the puzzles, which is why fights never open the way forward.
- **Dragging turns into guessing.** Counter this by making him predict first, and by using numbers too large to drag through.
- **Skills stay in the game.** A known weakness of maths games. Pillar 3 and the paper test address it. Evidence for this age group is thin.
- **The structure may not carry over.** The MVP tests only one tool. The second tool, area and perimeter, tests whether the structure carries over, because it reuses draggable x.
- **Scope.** The year has 17 curriculum outcomes across two books, and every tool is a real build. A world also adds map, art and story work that separate minigames wouldn't need. One tool at a time is the only defence.