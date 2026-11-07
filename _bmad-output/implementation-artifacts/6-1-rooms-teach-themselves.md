# Story 6.1: The rooms teach themselves

Status: review

## Why

Luka has said again and again that nothing in the game explains itself: the GDD rule "no instructions, the machine teaches itself" was applied too far, and in the first playtest his son "needed help at every step". The guided first fight (Nikola talks him through it, the control for the step ringed, the rest dimmed, shown once) worked; this story does the same for the rooms.

## Story

As Luka's son,
I want Nikola to show me what each new control in a room does, the first time I need it,
so that I can find the answer myself without asking my dad at every step.

## Acceptance criteria

1. The first time a room needs a tool, Nikola's card says what it does, one short line per step (at most about 80 characters, present tense or imperatives, never a gendered past tense addressed to him), with the control ringed and the rest dimmed. It tells him what a control does, never the answer.
2. Covered: the slider, reading the pans and what level means, the hint button, the notebook and its blanks, the enter key, the check line (room 1); the prediction flag and its confirm, then the tilt flag (room 3); the tray, weights and balloons, the drop, the goal, and the splitter (room 4); the old logbook's lines and its wrong line (room 7); the gear chain (room 8); the tray's x-gear (room 9); the story, then the story that fits (room 10); the range pin, the coarse slider and its single steps (room 11); the linked machines (room 12); the drum and its next-dot pin (room 13).
3. A step he reads closes with "Dalje" (the topic's last one "U redu"); a step that asks for a move says "Probaj!" and moves on when he makes it. Every move still reaches the room: the guide never holds one back.
4. Each topic shows once: once its last step is done it is saved (`guide-<topic>` in `save.progress.firstUse`) and never shows again, after a reload too.
5. The hint button's text at each level points to the next step concretely.
6. NFR11: the line-checker table covers every correct line and rejects wrong ones for all 13 rooms.
7. Touch targets at least 48 px; it works at 1280 × 800 and 640 × 360; on a phone the card never covers what it points at.

## The lines (Croatian, with an English gloss)

| Room | Topic | Step | Rings | Moves on | Line | Gloss |
|---|---|---|---|---|---|---|
| 1 | dial | dial | slider | slider moved | Ovo je klizač. Pomiči ga i gledaj vagu. | This is the slider. Move it and watch the scale. |
| 1 | dial | dial-x | slider, pans | Dalje | Klizač pokazuje koliko je x. Toliko teži zupčanik s x na vagi. | The slider shows how much x is. The x-gear on the scale weighs that much. |
| 1 | dial | readouts | pans | Dalje | Broj ispod svake zdjele kaže koliko je teška ta strana. | The number under each pan says how heavy that side is. (Skipped where readouts are hidden.) |
| 1 | dial | level | pans | Dalje | Teža strana ide dolje. Kad su strane jednako teške, vaga je ravna. | The heavier side goes down. When the sides weigh the same, the scale is level. |
| 1 | dial | hint | ? button | U redu | Ako zapneš, dodirni ? i pokazat ću ti sljedeći korak. | If you get stuck, tap ? and I'll show you the next step. |
| 1 | notebook | notebook | notebook lines | Dalje | Ovo je bilježnica. Ono što vaga pokaže, ovdje zapisuješ. | This is the notebook. What the scale shows, you write here. |
| 1 | notebook | blanks | line to fill, pad | Dalje | Prazna kućica čeka broj. Tipkaj ga na tipkama ispod. | The empty box waits for a number. Type it on the keys below. (Only where the lines are blanks.) |
| (4+) | notebook | free | line, pad | Dalje | Ovdje cijeli redak pišeš tipkama: x, znak = i brojeve. | Here you write the whole line with the keys: x, the = sign and numbers. (Only on a blank page.) |
| 1 | notebook | enter | ↵ key | a line entered | Dodirni ↵ i stroj će provjeriti redak. | Tap ↵ and the machine will check the line. |
| 1 | check | check-blank | check line | U redu | Zadnji redak je provjera: u kućicu ide tvoj broj umjesto x. | The last line is the check: your number goes in the box instead of x. |
| (4+) | check | check-free | line, pad | U redu | Provjeri: prepiši prvi redak, a umjesto x upiši svoj broj. | Check: copy the first line, and write your number instead of x. |
| 3 | pin | pin | flag | Dalje | Ovo je zastavica. Njome pogađaš prije nego što isprobaš. | This is the flag. With it you guess before you try. |
| 3 | pin | poke | slider | Dalje | Klizač zasad ide samo malo. Probaj ga i gledaj kako se vaga mijenja. | For now the slider moves only a little. Try it and watch how the scale changes. |
| 3 | pin | pin-drag | flag, slider | flag placed | Odvuci zastavicu tamo gdje misliš da će vaga biti ravna. | Drag the flag to where you think the scale will be level. (Skipped if already placed.) |
| 3 | pin | pin-confirm | Potvrdi | confirmed | Dodirni Potvrdi i stroj će provjeriti tvoju zastavicu. | Tap Potvrdi and the machine will check your flag. |
| 3 | tilt | tilt | flag | Dalje | Sad pogađaš smjer: kamo se vaga nagne kad x raste? | Now you guess a direction: which way does the scale tip as x grows? |
| 3 | tilt | tilt-drag | flag | flag placed | Odvuci zastavicu na lijevo ili desno, kako misliš. | Drag the flag to left or right, as you think. |
| 3 | tilt | pin-confirm | Potvrdi | confirmed | (as above) | |
| 4 | tray | tray | tray | Dalje | Ovo je polica s utezima. Tipkama − i + biraš broj na njima. | This is the shelf of weights. With − and + you pick the number on them. |
| 4 | tray | tray-kinds | tray | Dalje | Uteg vuče svoju stranu dolje. Balon je diže, kao da oduzima. | A weight pulls its side down. A balloon lifts it, as if it takes away. |
| 4 | tray | tray-drop | tray, pans | a drop (or a drag off) | Odvuci jedan na vagu. Ide na obje strane odjednom. | Drag one onto the scale. It goes on both sides at once. |
| 4 | tray | auto | notebook lines | Dalje | Svaki potez na vagi bilježnica zapisuje sama. | The notebook writes every move on the scale by itself. (Only where Balance is `auto`.) |
| 4 | tray | goal | goal banner (phone: goal card) | U redu | Cilj: x sam na jednoj strani, a samo broj na drugoj. | Goal: x alone on one side, and only a number on the other. |
| 4 | splitter | splitter | splitter | Dalje | Ovo je razdjelnik. Dijeli obje strane na jednake dijelove. | This is the splitter. It divides both sides into equal parts. |
| 4 | splitter | split | splitter, pans | a split | Tipkama − i + biraš broj dijelova. Onda ga odvuci na vagu. | With − and + you pick the number of parts. Then drag it onto the scale. |
| 7 | logbook | logbook | logbook lines | Dalje | Ovo je stari dnevnik. Ovaj zadatak u njemu je već riješen. | This is the old logbook. This task is already solved in it. |
| 7 | logbook | logbook-tap | logbook lines | a line tapped | Dodirni redak i vaga ga pokaže uz isti x. | Tap a line and the scale shows it at the same x. (Skipped if already tapped.) |
| 7 | logbook | logbook-flag | logbook lines | confirmed | Jedan redak ne vrijedi. Stavi zastavicu na njega, pa potvrdi. | One line doesn't hold. Put the flag on it, then confirm. |
| 8 | chain | chain | chain | Dalje | Ovo je lanac. Karike redom pokazuju što se radi s x. | This is the chain. Its links show, in order, what is done to x. |
| 8 | chain | chain-undo | chain | Dalje | Dodirni zadnju kariku i odaberi što je poništava. | Tap the last link and pick what undoes it. |
| 8 | chain | chain-run | chain, pad | a run | Upiši broj i dodirni Pokreni. Vaga i bilježnica idu za lancem. | Type the number and tap Pokreni. The scale and the notebook follow the chain. |
| 9 | gear | gear | tray | Dalje | Na polici je sad i zupčanik x. On dodaje x na obje strane. | The shelf now has an x-gear too. It adds x to both sides. |
| 9 | gear | gear-why | pans | U redu | Balon s x oduzima x. Zupčanik ga vraća, i to na obje strane. | A balloon with x takes x away. The gear brings it back, on both sides. |
| 10 | story | story | story | Dalje | Ovo je priča. U njoj se krije jednadžba. | This is a story. An equation hides in it. |
| 10 | story | story-x | story | Dalje | Ono što priča ne kaže je x. Ostale brojeve uzmi iz priče. | What the story doesn't say is x. Take the other numbers from the story. |
| 10 | story | story-write | line, pad | a line entered | Zapiši priču kao redak i dodirni ↵. Onda se vaga napuni. | Write the story as a line and tap ↵. Then the scale fills. |
| 10 | story-choice | story-choice | stories | Dalje | Tri priče, a vagi odgovara samo jedna. Usporedi ih s vagom. | Three stories, and only one fits the scale. Compare them with the scale. |
| 10 | story-choice | story-flag | stories | confirmed | Stavi zastavicu na priču koja odgovara, pa dodirni Potvrdi. | Put the flag on the story that fits, then tap Potvrdi. |
| 11 | range | range | ranges | Dalje | Prvo samo procijeni koliki je x. Ne treba točan broj. | First just estimate how big x is. No exact number needed. |
| 11 | range | range-flag | ranges | confirmed | Stavi zastavicu na jedan dio, pa dodirni Potvrdi. | Put the flag on one part, then tap Potvrdi. |
| 11 | coarse | coarse | slider | Dalje | Ovaj klizač skače po 10. Do velikog broja treba dugo. | This slider jumps by 10. Getting to a big number takes long. |
| 11 | coarse | fine | − x + | U redu | Gumbi − i + mijenjaju x za 1, kad si blizu. | The − and + buttons change x by 1, when you're close. |
| 12 | linked | linked | linked panel | Dalje | Ova dva stroja su povezana. Tvoj x odavde ide u sljedeći. | These two machines are linked. Your x from here goes into the next. |
| 12 | linked | linked-slot | linked panel | U redu | Prazno mjesto u sljedećem stroju čeka baš taj broj. | The empty place in the next machine waits for exactly that number. |
| 12 | linked-fed | linked-fed | linked panel | U redu | Broj iz prvog stroja sad je uteg na ovoj vagi. | The number from the first machine is now a weight on this scale. |
| 13 | drum | drum | drum | Dalje | Ovo je bubanj. Za svaki x koji probaš nacrta točkicu. | This is the drum. For every x you try it draws a dot. |
| 13 | drum | drum-dot | drum | Dalje | Točkica je težina lijeve strane. Crta je težina desne. | A dot is the left side's weight. The line is the right side's. |
| 13 | drum | drum-try | slider | slider moved | Probaj klizač na prvim mjestima i gledaj točkice. | Try the slider at the first places and watch the dots. (While the pin asks.) |
| 13 | drum | drum-pin | drum | confirmed | Gdje pada sljedeća točkica? Stavi zastavicu, pa Potvrdi. | Where does the next dot land? Put the flag, then Potvrdi. (While the pin asks.) |

Buttons: `Dalje` (next), `U redu` (OK, a topic's last step), `Probaj!` (try it!, on a step that waits for a move). The card is signed `Nikola`; screen readers hear "Nikola objašnjava".

## The hint button, level by level

The hint's first press shows the current step's tag; the second the exact next move; the help ladder adds the line's shape (level 3) and a worked example (level 4). Checked for each step that the text names a concrete next action:

| Step | 1st press | 2nd press |
|---|---|---|
| dial | Pomiči klizač – tako mijenjaš x. | Pomiči klizač udesno. / ulijevo. |
| write / answer | Vaga je u ravnoteži. Upiši x u bilježnicu. / x je sam na vagi. Upiši koliko je x. | Upiši x = 5. |
| check | Provjeri: uvrsti broj umjesto x. | Upiši 5 umjesto x. / Prepiši prvu jednadžbu, a umjesto x upiši 5. |
| tray, balance-goal | Stavi broj s police na vagu – ide na obje strane. / Ostavi x samog na jednoj strani, kao na kartici Cilj. | Skini 5 s obje strane: stavi balon −5 na vagu. (and the weight, the x-gear, a weight dragged off) |
| splitter | Razdjelnik dijeli obje strane na jednake dijelove. | **changed:** Podijeli obje strane s 2: odvuci razdjelnik na vagu. (was "Podijeli obje strane s 2.", which didn't say how) |
| pin (all six kinds) | the pin's own question | **changed:** how to place it and confirm it, by kind, e.g. "Odvuci zastavicu po klizaču, pa dodirni Potvrdi.", "Dodirni zastavicu kod retka koji ne vrijedi, pa Potvrdi." (it used to ask the same question again) |
| chain | Dodirni zadnju kariku lanca i poništi je. | Dodirni kariku + 9 i odaberi − 9. |
| story | Pročitaj priču i zapiši je kao jednadžbu. | Zapiši priču kao jednadžbu: 60 + 3x = 90. |
| rewrite | Prekriženi redak nije točan. Napiši ga ispravno. | Upiši x = 6. |
| jam | Stroj je zapeo: ovaj redak ne vrijedi. | Obriši ga tipkom ⌫ i napiši ponovno. (the delete key pulses) |
| chain blank | Lanac je napravio korak. Upiši što je ostalo na vagi. | Upiši 32 u prazno polje. |

## NFR11, the line-checker table

`src/math/lines.table.test.ts` now reads every stage off the authored rooms (13 rooms, 19 stages) and asks each for: the canonical solution of every way that finishes it, line by line; a skipped-step answer and its check line; the answer both ways round (`x = n` and `n = x`); a wrong answer straight after the equation; a wrong check line after the answer; at least two wrong lines. The gaps it found (37) are filled in `src/math/lines.table.ts`, section "every room: the answer both ways round, and the wrong lines (story 6.1)": `n = x` for 15 stages, a wrong undivided answer for 9 stages (rooms 7–13), and a check line with the wrong number for 13 stages (rooms 5–13). The old hard-coded stage list now includes room 13 too.

## Calls made (for Luka's veto)

- **Topics, not rooms.** A guide belongs to a tool or idea (17 topics), shown the first time a stage needs it, wherever that is; so a dev jump to room 4 still gets the slider's guide first. A topic whose room is already finished counts as met, so a save from before this story (his son's) doesn't get room 1's slider guide in room 8.
- **The guide never holds a move back.** Unlike the fight's guide, the dimming takes no touches and every move reaches the room: a room has many controls and many ways, and blocking them would make the guide a cage. A step that waits for a move moves on when he makes it; a step whose move is already made is skipped (the flag already placed, a line already tapped).
- **Steps that wait for a move say "Probaj!"** instead of a button, as the fight's do with no button.
- **Topics in progress are not saved**, only the finished ones (as `fightGuide`). Leaving a room halfway through a topic starts that topic over the next time it applies.
- **The handover tags step back while Nikola talks** (his card says the step), and come back once the topic is read. The hint button keeps working under the guide.
- **Room 11's range pin comes before its coarse slider**: while the pin asks, a phone's notebook hides the slider's single steps, which that guide points at.
- **A notebook step rings only the notebook** (the logbook's lines, the stories, the drum), not the scale too: on a phone the notebook covers half the scale, and there was nowhere left for the card.
- **The scale is ringed pan by pan**, so a tall stack (room 9's five balloons) leaves room for the card over the other pan.
- **On a phone, the notebook slides away while a step rings the scene and comes back while a step rings the notebook**, as it already does for the handover tags; he can still bring it back with its handle.
- **The goal step rings the goal banner on the tablet and the scene's small goal card on a phone.**
- **The card keeps clear of the pin's question tag** where it can: the question says what the flag is for.
- **The splitter's second hint got shorter than first drafted** ("…: odvuci razdjelnik na vagu."): the longer version covered the goal card on a phone (goal-card-layout test).
- **No Croatian letters in ui/**: every word is in `hr.ts` (`hr.roomGuide`, `hr.hint.pinHow`).

## Dev Agent Record

### Files

- `src/room/guide.ts` (pure): the 17 topics, their steps, targets, awaited moves and skips; which topic shows (`guideOrder`); advancing. `src/room/types.ts`: `guideTopicIds`, `GuideTopic`, `guide-<topic>` in `FirstUseId`. `src/save/decode.ts` keeps the new ids.
- `src/store/room-guide.ts`: the room reducer with the guide around it (`room/guide-next`, moves that take a waiting step on, met topics saved); `ui.roomGuide` in `src/store/types.ts`; wired in `src/store/reducer.ts`.
- `src/ui/common/RoomGuide.tsx`, `room-guide.css`, `guide-spots.ts`: the card, the dimming with its rings (an SVG mask, no touches), where the scene's parts are, and where the card stands; mounted in `src/app/App.tsx`.
- `src/ui/notebook/Notebook.tsx`: the phone's notebook follows the guide; the handover note waits. `src/ui/common/hint-text.ts`: no scene handover tag while the guide shows; `pinHowText` and the notebook pins' second press. `src/ui/scene/scale/Pin.tsx`: the flag's tag on the second press. `src/ui/scene/scale/goal-card-layout.ts`: `panBoxes` and `dialBoxes` exported.
- `src/content/text/hr.ts`: `hr.roomGuide`, `hr.hint.pinHow`, `hr.hint.split`.
- `src/math/lines.table.ts`, `src/math/lines.table.test.ts`: NFR11.

### Tests

- Unit: `src/room/guide.test.ts`, `src/store/room-guide.test.ts`, `src/ui/common/guide-spots.test.ts`, `src/ui/common/RoomGuide.test.tsx`, additions to `src/content/text/hr.test.ts` (length, no gendered past tense), `src/ui/common/hint-text.test.ts`, `src/save/save.test.ts`, `src/math/lines.table.test.ts`.
- E2E: `e2e/room-guide.spec.ts`: room 1's guide shows once (tapped through for real, gone after leaving and after a reload); every room's guide step by step, screenshotted, with a check that the card covers none of its rings, at both sizes. `e2e/rooms-1-7.spec.ts` and `e2e/town.spec.ts` now go through the guides (and on a phone bring the notebook back to write); `e2e/rooms-8-13.spec.ts` boots with the guides read.
