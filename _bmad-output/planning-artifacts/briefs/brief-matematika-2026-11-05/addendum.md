---
title: "Addendum: matematika game brief"
status: final
created: 2026-11-05
updated: 2026-11-05
---

# Addendum: matematika game brief

Supporting detail for the game design document (GDD) that does not belong in the brief.

Outcome codes such as B.5.1 come from the national curriculum, NN 7/2019. CARNET *Matematika 5* is an open textbook that is not Ministry-approved.

## National curriculum

The full reference is `sources/kurikulum-5-razred.md`: all 17 outcomes, achievement levels, teaching materials, equation methods and lesson-to-outcome coverage. The contents of Luka's son's textbook, volume 1, leave 9 outcomes uncovered and 5 partly covered; volume 2's titles appear to cover the rest.

Full-text sources for the whole year:
- **CARNET [*Matematika 5*](https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/index.html):** 7 modules, 44 units, full lessons, CC BY-NC-SA, open access. It uses a different order from Luka's son's book. The lesson-by-lesson reference and outcome audit are in `sources/matematika-5-carnet-lekcije.md`. All 44 units were read as text through a summarising tool, and videos and applets were not seen, so "not found" in that file means not found in the text. CARNET's book touches all 17 outcomes; most gaps are in constructions (C.5.2).
- **Profil Klett [*Matematika 5*](https://hr.izzi.digital/DOS/204/205.html):** 8 chapters, viewable without signing in, but only part of its interactive pages could be extracted.
- **Ministry [edition of the curriculum](https://mzom.gov.hr/UserDocsImages/dokumenti/Publikacije/Predmetni/Kurikulumi%20nastavnih%20predmeta%20Matematika%20za%20osnovne%20skole%20i%20gimnazije%20i%20Matematika%20za%20srednje%20strukovne%20skole%20na%20razini%204.2..pdf):** outcomes and all achievement levels, not lessons.

Details not in the reference file:
- Recommended forms in B.5.1 use one operation: x + a = b, x − a = b, a − x = b, a · x = b, a : x = b. The curriculum alone does not show what Luka's son's class faces.
- ax + b = 0 arrives in B.7.2 ([NN 7/2019](https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html)).
- The publisher Element's 5th grade book also has [two parts](https://os-cvjetno-naselje-zg.skole.hr/wp-content/uploads/sites/2380/2025/06/5.-a-i-b_2025_2026_popis_udzbenika.pdf).

## Textbook contents: volume 1

Read from the photographed contents page (`sources/udzbenik-sadrzaj.webp`). Numbers give each lesson's first page. Lessons are grouped into clusters for planning; the clusters are not the book's own.

The book is identified as *Matematički izazovi 5, prvi dio* (Alfa), volume 1 of 2, from a contents match with the publisher's sample. The cover and edition are unconfirmed, which doesn't affect the game. Volume 2 holds geometry, fractions and decimals.

**Ponovimo (review), p. 9**
- Pisanje, čitanje i uspoređivanje brojeva do milijun 10; Zbrajanje i oduzimanje 11; Množenje i dijeljenje 12; Mjerne jedinice 13; Priprema za uvodni ispit 14

**Mjerenje i uvod u algebru (measurement and intro to algebra), p. 17**
- Measurement: Jedinice za novac 18; Mjerenje vremena 25; Mjerenje duljine dužine 30; Mjerenje mase 34
- Sets and data: Skup, zapis skupa 37; Razvrstavanje podataka 42; Podskup, presjek, unija 47
- Algebra: Algebarski izrazi 53; Linearna jednadžba 57; Zbrajanje i oduzimanje algebarskih izraza 61; Vrijednost algebarskog izraza 64; Kvadrati brojeva 68; Rješavanje linearnih jednadžbi vezom zbrajanja i oduzimanja 71; Rješavanje linearnih jednadžbi vezom množenja i dijeljenja 75; Nejednadžba 79
- Priprema za ispit 84

**Prirodni brojevi (natural numbers), p. 87**
- Number sense: Skup prirodnih brojeva 88; Veliki brojevi 92; Brojevni pravac 96; Prethodnik i sljedbenik 99; Uspoređivanje 102; Zaokruživanje 107
- Operations: Zbrajanje u N₀ 110; Svojstva zbrajanja 113; Oduzimanje u N₀ 116; Množenje u N₀ 121; Osnovna svojstva množenja 128, 131; Dijeljenje 134; Izvođenje više računskih radnji 141, 143
- Sets and data: Aritmetička sredina 148; Podatci 150
- Priprema za ispit 158

**Djeljivost prirodnih brojeva (divisibility), p. 161**
- Divisibility: Višekratnik 162; Djelitelj 165; Svojstva djeljivosti 168; Djeljivost s 10, 5, 2 171; Djeljivost s 3 i 9 174; Djeljivost s 10, 5, 2, 3, 9 177; Prosti i složeni brojevi 179; Rastavljanje na proste faktore 182, 185
- Priprema za ispit 188

## Textbook evidence: equations

From exercises 12–24 in `sources/udzbenik-zadatci-12-24.webp`, on p. 78, the last page before the inequalities lesson. Whether the class is assigned these is unknown. The footer appears to read "Zadatci za vježbu". The page shows tasks, not the method taught.

- **Two-step:** 2x + 7 = 25; 3x − 1 = 17; 135 − 5x = 100; 5 905 − 27 · x = 316
- **Like terms:** 2x + 2x = 624; 13a − 7a = 792; 13m − m = 3 000
- **Brackets and nesting:** 225 : (x : 9) = 25; 27 · (x + 254) = 11 340; (152 + y) · 84 = 16 800
- **Word problems that need modelling:** exercise 21 (a dictionary plus several notebooks, which can be written as 45 + 2x = 59) and exercise 24 (photos across three albums, which can be written as x + 2x + 2(x + 2x) = 72)
- **Number size:** results and constants run into the thousands.

## Understanding test

A paper test of about 10 minutes, used before he plays and again afterwards with new numbers. It is a working design, not a validated instrument.

1. **Compare without calculating:** is 47 + 38 = 46 + 39 true, and how can you tell without adding?
2. **Predict:** in 3x + 2 = 20, the 20 becomes 23. What happens to x, without solving?
3. **Find the mistake:** someone wrote 3x + 2 = 20, so 3x = 22. What went wrong, and why is it wrong?
4. **Go both ways:** write a story for 2x + 7 = 25, then turn a problem like exercise 21 into an equation. Exercise 24 is the stretch version, because it needs brackets and like terms.

This is the equations version. The four task types carry over to other topics:

| Task type | Divisibility | Area and perimeter |
|---|---|---|
| Compare without calculating | Is 3 · 5 · 7 · 11 divisible by 21? | Which has the larger perimeter, a 6 × 6 or a 5 × 7 rectangle? |
| Predict | A number is divisible by 9. Swap two of its digits. Is it still? | Double a rectangle's sides. What happens to its perimeter and area? |
| Find the mistake | "Anything divisible by 4 and by 6 is divisible by 24." | "Same perimeter means same area." |
| Go both ways | Use 36 = 2 · 2 · 3 · 3 to find how many ways 36 chairs can form equal rows. | Draw a shape with perimeter 2 · (3 + 5), then write the calculation for a drawn shape. |

Limits: the task types do not cover memorised facts and notation, constructions with tools (C.5.2) or calculation speed. Examples exist for equations, divisibility, and area and perimeter, not yet for all 17 outcomes.

Background: Skemp's [relational and instrumental understanding](https://lancashire.gov.uk/media/940445/relational-and-instrumental-understanding-richard-skemp.pdf); equal-sign understanding linked to equation solving, controlling for achievement, in 177 grade 6–8 students ([Knuth et al. 2006](https://www.nctm.org/Publications/journal-for-research-in-mathematics-education/2006/Vol37/Issue4/Does-Understanding-the-Equal-Sign-Matter_-Evidence-from-Solving-Equations/)); true/false sentences judged without calculating ([NRICH](https://nrich.maths.org/14797)).

## First tool: draggable x

The mechanic is in the brief. In 135 − 5x = 100, a weight lightens as x grows.

- **Curriculum placement (NN 7/2019):** "linearna jednadžba" appears in 5th grade (B.5.1); graphs of data in the first quadrant are 5th grade (E.5.1); the coordinate system is 6th (D.6.5); y = ax + b and its graph are 7th (B.7.4).
- **The balance scale in teaching:** it is absent from the official 5th grade curriculum text. It appears as a context in one CARNET 5th grade unit and as the explanation of solving in the 6th grade materials reviewed. Nearly all 5th grade materials reviewed use inverse operations ("veza"). What his son's class does is unknown, so the game teaches all three ways and accepts any correct method.
- **Forms it can't carry:** a : x = b is listed under linear equations in B.5.1, but its left side is a curve as x changes. The same goes for 225 : (x : 9) = 25. A balance also has no natural picture for a − x = b or a : x = b without draggable x (inferred).

## Three ways to solve

The same equation, `2x + 7 = 25`:

| Way | What he does | Written |
|---|---|---|
| Try values | Drag x: 8 gives 23, 9 gives 25, 10 gives 27 | x = 9 |
| Balance | Take 7 from both sides, then halve both sides | 2x = 18, x = 9 |
| Undo | Undo + 7 with − 7, then undo · 2 with : 2 | 2x = 25 − 7, x = 18 : 2 |

Balancing and undoing reach the same line, 2x = 18, so undoing is the shortcut and balancing is the reason it works. CARNET's text never makes that connection. Equivalence of equations is officially 6th grade (B.6.1), so balancing puts him slightly ahead, and nothing in the 5th grade text forbids it.

## Combat: examples

Design ideas, untested. The rule is that the exercise is the fight, not a question in front of it.

| Topic | In a fight | What he reasons about |
|---|---|---|
| Expressions and order of operations | Roll three dice and place them in ☐ · ☐ + ☐ | Which placement does most damage. With 2, 5, 6: 6 · 5 + 2 = 32, but 2 · 5 + 6 = 16 |
| Equations and inequalities | Each blow does 3, a charged gear adds 2 once, and the automaton has 20 armour | How many blows to commit before striking: 3x + 2 ≥ 20, so x = 6 |
| Divisibility and primes (later) | An automaton with 36 plates splits under a blade whose number divides 36, as in Zombie Division | Which blades work; an automaton with 37 plates can't be split that way |

Parts pay for upgrades and for pieces of the rooms he builds. Fights have no time pressure and never block the way forward. Large-number arithmetic can live here too, since the numbers come from the dice and his gear.

## Candidate tools (proposed)

Design ideas, untested. Findings about CARNET come from its lesson text; its videos and applets were not seen. Adjust the order to where his class is.

| Order | Topic | Tool (placeholder, to fit the world) | What he works out | Why here |
|---|---|---|---|---|
| MVP | Equations (B.5.1) | Scale with draggable x | Both sides are equal at one point, and the change is steady | Luka's starting point. CARNET's text never connects the balance to the written rule |
| 2 | Area and perimeter (D.5.4) | Drag a plate's edges on a grid | Area is a count of squares; doubling the sides quadruples the area but only doubles the perimeter | Reuses draggable x and tests the structure on geometry. CARNET states the area formula without a reason |
| 3 | Divisibility and primes (A.5.2) | Mesh gears with different tooth counts | A small gear makes whole turns only if its teeth divide the big gear's; a prime gear has no smaller partner that fits evenly | CARNET's text gives the rules no reasons. Covered in his volume 1 |
| 4 | Fractions and decimals (A.5.3 to A.5.5) | Set a dial to part of a turn and read it on a number line | The same amount can be written differently | 50 of 140 hours in the 2021./2022. Ministry-hosted plan |
| 5 | Volume (D.5.5) | Fill a tank with unit cubes, layer by layer | Volume is a count of cubes, and the layers give the formula | Extends area. CARNET states the formula without a reason |
| 6 | Angles and symmetry (C.5.1, C.5.3, D.5.1) | Turn crossing levers; stamp a part and its mirror image | Vertical angles stay equal; adjacent angles add up to a straight angle; a shape and its image move together | Visual, and CARNET has pupils find some of these rules from applets |
| 7 | Sets (B.5.2) | Route parts through sorting gates into a Venn diagram | What intersection and union mean | Already taught visually with Venn diagrams, so the need is lowest |

Not planned as tools: large-number arithmetic, rounding, units, money and data stay in fights and story. Compass constructions (C.5.2) and protractor work stay on paper.

Example of the shared loop, for area and perimeter: drag the edges, predict what doubling the sides does, write the formula the way his class does, then send a friend a room to solve.

Tools can combine: B.5.1 asks pupils to use perimeter and area to find side lengths, so 5 · x = 40 is a plate 5 wide with area 40, and 2 · (x + 5) = 26 is a frame with perimeter 26.

## Research digest: design evidence

- **Design takeaways (inferred):** make the child choose and write each step, fade prompts, and test in paper format. In group play, avoid time pressure and allow comebacks. Direct evidence for ages 10–12 is thin.
- **Intrinsic integration:** Zombie Division (ages 7–11) gave more learning under fixed time (n=58) and seven times longer voluntary play (n=16) ([abstract](https://nottingham-repository.worktribe.com/output/23577510)). An adult study (n=210) also found more learning, with no significant motivation effect ([Cutting & Iacovides](https://eprints.whiterose.ac.uk/189921/1/LearningByDoingCuttingAndIacovides090822.pdf)).
- **Transfer:** out-of-game fluency did not vary by play mode ([Plass 2013](https://doi.org/10.1037/a0032688)). Instructional support adds d=.34 ([Wouters](https://www.bohrium.com/paper-details/a-meta-analytic-review-of-the-role-of-instructional-support-in-game-based-learning/813283383005151233-9279)). A review of 34 balance-model articles found no clear pattern ([Otten 2019](https://doaj.org/article/b332ab9319134adaa076247c3118c3fd)).
- **Peers:** competition and collaboration both raised middle schoolers' interest; collaboration raised replay intent but lowered in-game performance ([Plass 2013](https://doi.org/10.1037/a0032688), n=58). Across 93 Kahoot studies, pupils named time pressure, fear of losing and difficulty catching up as downsides ([Wang & Tahir](https://research.gold.ac.uk/id/eprint/39435/1/1-s2.0-S0360131520300208-main.pdf)). Only small [Blooket studies](https://www.ceeol.com/search/article-detail?id=1373914) turned up.

## Research digest: comparable games

These first-pass notes were not rechecked, and some come from search snippets.

- **DragonBox Algebra:** it was more enjoyable and players solved more problems, but a tutoring system beat it on the post-test with 190 grade 7–8 pupils ([abstract](https://unpaywall.org/10.1145%2F3057889), search snippet only). Vincent Aleven criticises its heavy scaffolding ([CMU](https://www.cmu.edu/homepage/computing/2014/spring/fun-and-games.shtml)). Croatian is absent from [Algebra 2's listing](https://apps.apple.com/us/app/-/id1550574547); the first app is unchecked.
- **Prodigy:** has a free tier, and the company cites a two-school Johns Hopkins report ([EdWeek](https://www.edweek.org/technology/popular-interactive-math-game-prodigy-is-target-of-complaint-to-federal-trade-commission/2021/02)). Advocates object to its ad load relative to maths exercises ([Fairplay](https://fairplayforkids.org/feb-19-2021-advocates-to-ftc-prodigy-math-game-preys-on-kids-and-families/)). No [Croatian](https://webflow.prodigygame.com/llms.txt) version.
- **Matific:** [in Croatian](https://www.matific.com/hr/hr/home/why-matific/multilingual/). A 2020 report on its Croatian rollout shows 93,319 pupils, 46.9% of tasks done on phones or tablets, and outcome B.5.1 tracked ([report](https://mzom.gov.hr/UserDocsImages/dokumenti/SkolaZaZivot/Matific%20u%20Hrvatskoj%20-%20pregled%20rezultata.pdf)). The efficacy evidence found is [vendor-published](https://www.matific.com/us/en-us/home/why-matific/validation/). Current free access is unconfirmed. Worth taking: Croatian language and tracking against outcomes. How it explains equations has not been examined.
- **SolveMe Mobiles:** free hanger-balance puzzles ([App Store](https://apps.apple.com/us/app/id977720372)). No transfer study found; Croatian unconfirmed. Worth taking: balance puzzles. Worth leaving: it has no tie to school.
- **CARNET *Matematika 5*:** worth taking: full-year coverage and Croatian contexts. Worth leaving: activities built on quizzes and answer codes.
- **Croatian tools:** Alfa's [digital edition](https://kabinet.alfa.hr/storage/244a0db3-d766-4631-8194-370995dbd0ec.pdf) and free [e-Škole content](https://gov.hr/hr/digitalni-obrazovni-sadrzaji-kao-pomoc-u-ucenju/1096); 5th grade maths there is unconfirmed. No Croatian equation game turned up, which does not prove none exists.

## Parked roadmap

- **Whole elementary school maths.** Raised by Luka on 5 November 2026 as a possible growth path; 5th grade comes first.
- **Multiplayer path.**
  1. MVP: send a room by link.
  2. Next: see whether a friend cracked a room he sent, which needs a small server.
  3. Later: play live with friends, without time pressure, with comebacks possible, without free-text chat, and without collecting children's personal data.
- **Classmates.** Whatever works for him may not work for them, since testing starts with one child.
