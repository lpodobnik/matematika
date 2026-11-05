---
title: "Matematika 5 (CARNET DOS): lesson-by-lesson reference and outcome audit"
status: draft
created: 2026-11-05
scope: "What the lesson text of CARNET's open digital textbook Matematika 5 teaches, unit by unit, tested against the 17 official 5th grade outcomes"
---

# Matematika 5 (CARNET DOS): lesson-by-lesson reference and outcome audit

## Attribution and licence

- **Source work:** *Matematika 5*, open digital educational content. <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/index.html>
- **Authors:** Tanja Soucie, Ivana Katalenac.
- **Editor:** Štefica Dumančić Poljski (editor of digital educational content, per the *Impresum* page).
- **Publisher:** Hrvatska akademska i istraživačka mreža, CARNET, Zagreb. Version label on the pages: v. 20210401. The *Impresum* gives no year or ISBN.
- **Licence:** Creative Commons BY-NC-SA. The pages link to the 3.0 legal code. Open access, co-financed by the European Social Fund.
- **This file** is a structured reference written in English, in my own words, with Croatian terms kept. It is not a copy of the textbook. Maths exercises are given in shortened form for reference.
- **[MINE]** It is a derivative summary, so if it is shared, keep this attribution and treat it under the same non-commercial, share-alike terms. This rests on my reading of the licence name, not on legal advice.

## How to read this file

**Labels**

| Label | Meaning |
|---|---|
| [MINE] | My reading, inference or comparison, with what it rests on. Everything without this label is what the lesson text shows |
| [formula not extracted] | A formula or value that seems to exist on the page but did not reach the extracted text. Never reconstructed |
| [EXT] | Extension material, such as *Kutak za znatiželjne* |
| [ENR] | Side enrichment, mainly *Zanimljivost* boxes |
| [VIDEO] | A video sits here. Its content could not be read, because the extracted text shows only a "browser does not support the video tag" notice |
| [APPLET] | An interactive item. Its instructions are in the text, but what it shows and does on screen could not be seen |

**What "read in full" means**

- Each page was fetched with WebFetch, which answers through a small model. I did not see raw page text directly.
- Every page was checked for its true length by requesting an offset past the end. About the first 10,000 characters of each page are the shared navigation menu. Page lengths are given in each entry and include that menu.
- "Read in full" means extraction passes reached the page footer with the headings in unbroken order. Long lessons had a whole-page pass and a further pass from about the midpoint. It does not mean I saw every character, because the small model compresses. Where it looked incomplete, the entry says so.
- Some pages show a "[Content truncated due to length...]" marker. On Unit 1.4 I tested this at offsets 6,000, 14,000, 20,000, 21,000 and 33,000: the marker appears after the true footer and no content was missing. So I treat it as harmless when the footer precedes it.
- Videos, applets and images were not available as content. "Read in full" covers the text only. Alt text was read where it exists. Answer keys are mostly absent from the extracted text, because answers appear only after a pupil interacts.

**Across the whole book**

- Every lesson has a *Što ću naučiti?* panel listing goals. These are recorded in each entry in shortened English. [MINE] Most closely follow the curriculum's *razrada* wording, judged by comparing them with section 2 of the curriculum file. A goal is therefore weak evidence that a lesson teaches something, so the audit looks for teaching text.
- Lessons do not name outcome codes. Each entry confirms this for its unit.
- The last lesson of some groups ends in an embedded *Procijenite svoje znanje* quiz with a *Moje znanje* results screen. The outcome lists on that screen are empty in the extracted text.
- Prices are in kuna (kn). I scanned for the word *euro* on most pages where money appears. See the D.5.3 audit.

**Book-level statements read**

- The index page lists nine book-level goals under *Što ću naučiti?*: sets, calculating in N₀, divisibility and prime factors, measurement units, measurable properties of shapes and solids, decimal calculation, equivalent notations of non-negative rationals, linear equations, and data. None mentions money or measuring angles.
- The teacher guidance page (<https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/12300_instructions_teachers.html>) says the content is mainly for independent pupil work, and that teachers may also use it in class or for homework. It contains no outcome codes and no unit-to-outcome table.
- I did not find a claim of full coverage on the index, *Impresum* or teacher guidance pages. The claim comes from the catalogue page cited in `C:\Users\lpodobnik\Claude\matematika\_bmad-output\planning-artifacts\briefs\brief-matematika-2026-11-05\sources\kurikulum-5-razred.md`, section 3, which I did not re-open.

---

# Module 1: Skupovi

Module page: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/170_skupovi.html>

## 1.1 Zadavanje i označavanje skupova

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/171_zadavanje_i_oznacavanje_skupova.html>
- **Read:** read in full (23,663 characters, footer reached). One [VIDEO] unavailable.
- **Goals:** use symbols when writing sets; find the number of elements; recognise the empty set; use the language of sets. **Codes:** none.
- **Concepts:**
  - *skup*: objects combined by some rule into one whole.
  - *članovi* or *elementi skupa*: its members. Sets are named with a capital letter.
  - *pripada* (∈), *ne pripada* (∉).
  - *prazan skup* (∅): a set with no members. A second symbol for it is mentioned [formula not extracted].
  - N, from Latin *naturalis*.
  - The symbol | is read *takvi da*, and a colon notation is used too.
- **Methods and reasons:**
  - A set can be given three ways: in words, by listing in braces, or with symbols.
  - Reason given: a very large or infinite set cannot be listed, so you state a few members and a property they all share.
  - Count elements from the list. If nothing meets the rule, the set is empty.
- **Problem forms:**
  - Two-digit numbers below 21 (11 elements).
  - Find the rule behind a list (days of the week).
  - The same set written three ways (seasons; even naturals).
  - Set-builder sets, including one with exactly one member (three-digit numbers ≤ 100) and an empty one (naturals that give 11 when doubled).
  - Mark odd digits, even two-digit numbers, geometric solids, Croatian rivers.
  - Sort books by author. True/false, for example whether 0 is natural.
  - Mark infinite sets (even numbers, points on a line, points of a square).
- **Models and visuals:** picture sets of shapes, digits and vowels; an oval to sort shapes into. No Venn diagram, number line, balance, grid or cubes.
- **Extension:** [ENR] *Zanimljivost* on the origin of N and on reading set-builder notation. No *Kutak za znatiželjne*.
- **Interactive:** [APPLET] sort shapes by colour or shape; match picture sets to rules; find matching pairs; closing task: sort shapes into an oval, discover the rule, then pick shapes that fit.

## 1.2 Vennovi dijagrami

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/172_vennovi_dijagrami.html>
- **Read:** read in full (17,704 characters, footer reached). One [VIDEO] unavailable. Diagram values mostly in images.
- **Goals:** form and show sets of numbers and data, and their relations, with Venn diagrams (*presjek, unija, podskup*). **Codes:** none.
- **Concepts:** *Vennovi dijagrami*: closed lines, usually circles or ovals. John Venn is named, with a photo.
- **Methods and reasons:** no general procedure. Pupils place an item by clicking it, then clicking the matching region. Totals come from adding region counts (8 + 4 = 12; 8 + 7 + 4 + 3 = 22). No reason beyond the arithmetic.
- **Problem forms:**
  - Which days a pharmacist works and which are free.
  - Pupils who read one book, both or neither, with the class total from a two-oval diagram.
  - Electives and pets from diagrams.
  - A three-way survey of 117 pupils, marked *Dodatna nastava*.
  - Zadatak 5: 27 pupils with pets, given as "only" and "two of" counts, entered into a diagram.
- **Models and visuals:** Venn diagrams throughout: two ovals, three ovals (M, P, R). Interactive hat sorting.
- **Extension:** the three-way survey is marked *Dodatna nastava*. No *Kutak za znatiželjne*.
- **Interactive:** [APPLET] sort hats by property, then by two properties; sort numbers by conditions; choose the rule from a dropdown; enter counts into a diagram; closing task: choose conditions for two circles and place shapes.

## 1.3 Podskup

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/173_podskup.html>
- **Read:** read in full (24,915 characters, footer reached). Two [VIDEO] unavailable. One set in a true/false task is blank in the text.
- **Goals:** show sets and subset relations with Venn diagrams; use symbols for sets and their relations. **Codes:** none.
- **Concepts:**
  - *podskup*: a set contained in another; A ⊆ B when every member of A is also in B.
  - Every set is a subset of itself. ∅ is a subset of every set.
  - *jednakost skupova*: same members, regardless of order.
- **Methods and reasons:** check that every member of A is in B. *Prebrojimo!* introduces counting arrangements with no general rule. A two-activities problem is solved by Venn diagram and subtraction, shown as steps.
- **Problem forms:**
  - Shopping-cart story; pupils of a class within a school; single digits within naturals.
  - Which listed sets are subsets of Croatian islands. The lists include Istra and Pelješac. [MINE] These read as deliberate wrong options, because neither is an island; that is my geography, and the page marks no answer.
  - Match subsets to primes and composites.
  - Sort candidate subsets of names.
  - Digits of two numbers: true statements about ⊆ and =.
  - Ice cream: three flavours, different scoops; later five flavours, two scoops, count the combinations.
  - 24 pupils, 15 in music school, 18 in language school, 3 in neither: how many do both?
  - Sort counties into continental and coastal; mark Croatian mountains.
- **Models and visuals:** nested ovals. Map of counties, photo of islands.
- **Extension:** none marked. The ice-cream counting tasks are early combinatorics in the main flow. [MINE] This rests on the task text, since the page does not call it *kombinatorika*.
- **Interactive:** [APPLET] sort continents and animals into a diagram; ice-cream combinations; true/false, matching and sorting tasks; an embedded knowledge check.

## 1.4 Unija i presjek skupova

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/174_unija_i_presjek_skupova.html>
- **Read:** read in full (33,638 characters; five passes at different offsets, footer reached). One [VIDEO] unavailable. Figures for point-set tasks are images.
- **Goals:** show sets and relations (*presjek, unija, podskup*) with Venn diagrams; use symbols for sets and relations. **Codes:** none.
- **Concepts:**
  - *presjek* (A ∩ B): members in both sets.
  - *unija* (A ∪ B): members in at least one.
  - *disjunktni skupovi*: empty intersection ([ENR] *Zanimljivost*).
  - Laws stated: A ∪ A = A, A ∩ A = A, A ∪ ∅ = A, A ∩ ∅ = ∅; *komutativnost* and *asocijativnost* for ∪ and ∩.
- **Methods and reasons:**
  - Place elements belonging to both sets in the shared region. The explanation: two named friends play both sports, so their names go in the overlap.
  - For a union, list everything from either set without repeating.
  - Commutativity is stated as the order of the sets not changing the result, without proof. Associativity is shown on one number example.
- **Problem forms:**
  - Friends and sports (football, tennis, volleyball): who plays both, who plays neither, disjoint sets, union.
  - Number sets: find ∩ and ∪, then three-set expressions.
  - Three-set Venn with letters: read off and match.
  - **Point sets:** intersections of two triangles; circle or disc with a segment; points and segments on a line; rays. These link to C.5.1 and B.5.2.
- **Models and visuals:** Venn diagrams with shaded regions; two overlapping triangles; circle with a segment; points on a line. "Jesen u voćnjaku" appears as the title of the closing activity.
- **Extension:** [EXT] *Kutak za znatiželjne*: two worked checks of the distributive laws for ∪ and ∩. [ENR] Disjoint sets. A *Projekt*: freshwater, marine and land organisms, do these sets overlap, and name a member if so.
- **Interactive:** [APPLET] place numbers in a diagram; sow flower seeds into overlapping beds; place animals; shade regions; place names in three sets; matching; a final orchard activity. Embedded *Procijenite svoje znanje*: a set of terminology, set-operation and always/never items.

## Module 1: Aktivnosti za učenje

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/179_aktivnosti_za_ucenje.html> (28,458 characters, read in full). Labelled independent learning. New content appears here that is not in the numbered units.

- **Revision:** sort seven sets into finite and infinite; pick images of a set; membership of points in a triangle.
- **Point sets:** intersection of two rectangles; a square and a line; union of two rays.
- **New content, *razlika skupova*:** A − B and B − A from a Venn diagram of pets, with the note that the two differ.
- **New content, element counts:** k(A), k(B), k(A ∪ B), k(A ∩ B). The worked Primjer computes the union from the diagram (5 + 6 + 8 = 19). A general rule follows in a *Zanimljivost* box, as plain text.
- **Word problems:** language school with 105 pupils and four languages, entered into an interactive Venn diagram.
- **[EXT] *Kutak za znatiželjne*:** routes from A to C through B; arranging a shop window. A worked outfit example (3 hats, 4 jackets, 2 trousers) gives 3·4·2 = 24 and generalises to a product rule. Two tasks count two-digit numbers built from digit sets.

## Module 1: Procjena znanja

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/170_knowledge_assessment.html> (17,245 characters, read in full). 16 items.

Pupils answer yes/no, fill-in, matching and sorting items:

- Is ∅ = 0? Read the symbols ∈ and ∉.
- Union of evens and odds.
- Number of points where two perpendicular lines, two parallel lines or two squares with a shared side intersect.
- Match Z ∪ O, O − Z, Z − O, Z ∩ O to descriptions of choir and orchestra pupils. Pick the Venn diagram showing a difference.
- Number of subsets of a three-element set.
- Subset truth checks, including ∅ against 0 as trap items.
- Sort subsets of an animal set.
- A class with 18 in sport, 11 in music, 5 in both, 2 in neither: find the class size.

---

# Module 2: Prirodni brojevi

Module page: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/175_prirodni_brojevi.html>

## 2.1 Prirodni brojevi

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/176_prirodni_brojevi.html>
- **Read:** read in full (29,687 characters; two passes, footer reached). The googolplex exponent is garbled [formula not extracted].
- **Goals:** read and write naturals, including above a million; use symbols and language of sets; apply rounding rules and round sensibly by the task's conditions. **Codes:** none.
- **Concepts:**
  - *prirodni brojevi*: counting numbers. N = {1, 2, 3, ...} is infinite, smallest element 1, no largest.
  - *neposredni prethodnik*, *neposredni sljedbenik*: every natural has a successor; all but 1 have a predecessor.
  - N₀ adds zero.
  - *parni* and *neparni*, defined by remainder on dividing by 2 and by last digit.
  - *znamenke*, *dekadski sustav*, *dekadske jedinice*, *mjesna vrijednost*; place names *jedinice* to *stotisućice*.
  - Sign ≈ read *približno*.
- **Methods and reasons:**
  - Expanded form with powers of ten: dekadske jedinice shown as 10⁰ up to 10⁵, then 2 345 = 2·10³ + 3·10² + 4·10¹ + 5·10⁰. Reason given: the system is positional, so a digit's value depends on its place.
  - Reading large numbers with a place-value table and a names table up to 10¹⁵ (*milijun, milijarda, bilijun, bilijarda*).
  - *Zaokruživanje*: a dropped digit below 5 keeps the digits before it, 5 or more raises the preceding digit, the rest become zeros. Reason given: useful for practical calculation and for checking an answer is sensible.
- **Problem forms:**
  - Primjer: 7·1000 + 4·100 + 2·10 + 3·1 to 7 423; 9·10⁵ + 3·10⁴ + 6·10³ + 5·10² to 936 500.
  - Sort by digit count and parity; predecessors and successors (784, 1 000).
  - Roman numerals; number words to digits, up to billions.
  - Round 19 862 to each place.
  - Marko adds 1 358 + 235 and gets 3 708; Andrea's estimate (1 400 + 200) exposes the error.
  - Večer matematike: 95 954 reported as 100 000; which rounding suits a newspaper?
  - Zagreb to Copenhagen distances rounded.
- **Models and visuals:** place-value table; Venn diagram of N inside N₀; photo of the Ishango bone. No number line here.
- **Extension:** [ENR] *Zanimljivost* boxes: the Pirahã people, the Ishango bone, the letter N, the origin of numerals, googol and googolplex, reading large numbers. No *Kutak za znatiželjne*.
- **Interactive:** [APPLET] Zadatak 8: guide a turtle to lettuce by rounding to tens and hundreds; an optional further game. Closing task: find ten facts with large numbers and make a poster.

## 2.2 Uspoređivanje prirodnih brojeva

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/177_usporedivanje_prirodnih_brojeva.html>
- **Read:** read in full (25,165 characters; two passes, footer reached). Building chart and scale values are in images.
- **Goals:** read, write and interpret <, >, ≤, ≥, =, ≠ in N₀; use *produljena nejednakost*; interpret a result in context; show solutions of a simple *nejednadžba* in set notation. **Codes:** none.
- **Concepts:**
  - A natural's size depends on its number of digits.
  - a < b also reads as b > a. Every natural is greater than 0.
  - For any two numbers in N₀ exactly one of =, <, > holds.
  - Chained inequality a < b < c.
  - ≤ read *manje ili jednako*, ≥ read *veće ili jednako*.
- **Methods and reasons:**
  - Compare by digit count first. A true/always/sometimes item tests the naive rule that the larger units digit decides.
  - Two inequalities combine into one, justified by a < b and b < c giving a < c.
  - Primjer 3 reasons about minimum packs: 22 pupils, each gets 2 cakes and a bottle; boxes of 8, packs of 6; 5 boxes are not enough, so 6.
- **Problem forms:**
  - Set-builder sets from inequalities (x ∈ N, x < 5; one-digit, x ≥ 5).
  - Heights 123, 140, 136 written as a chain.
  - Sort ascending and descending.
  - Fill * with a digit: *57 < 362, 2*45 < 2 601.
  - 17 < x ≤ 22; match inequalities to sets; sort into x ≤ 15, 15 < x < 30, x ≥ 30.
  - Smallest and largest ten-digit number from six tiles.
  - Island populations (2011 census).
- **Models and visuals:** bar chart of the ten tallest buildings; a scale (*vaga*) for reading masses of fruit and vegetables. Here the scale is a measuring device, not an equation model. [MINE] Based on the task wording, which only asks to read and compare masses.
- **Extension:** none marked.
- **Interactive:** [APPLET] order tiles to make numbers; read masses on a scale and compare; enter a number below 1 000 000 and sort tiles.

## 2.3 Brojevni pravac

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/1140_brojevni_pravac.html>
- **Read:** read in full (23,951 characters; two passes, footer reached). Two [VIDEO] unavailable. Number-line figures are images, and one exercise's options are garbled.
- **Goals:** assign naturals to points on a number line and read them; comparison signs; chained inequality; interpret results; set notation for simple inequalities. **Codes:** none.
- **Concepts:** *brojevni pravac*: a line with a marked *jedinična dužina*. *ishodište* (point O, number 0) and *jedinična točka* (point E, number 1) are both defined. [MINE] The curriculum's *preporuka* in A.5.1 says not to introduce these two terms, so this goes beyond it.
- **Methods and reasons:**
  - Mark O and E, then transfer the unit segment repeatedly to the right.
  - Reason given: gaps between points of neighbouring naturals are always equal, so two numbered points fix the line.
  - Without zero: choose two points for two consecutive numbers and take that distance as the step (S = {56, 59, 60, 62, 65}).
  - With a larger step: O = 0, A = 5, plot T = {15, 25, 40, 60, 75}.
- **Problem forms:**
  - Match thermometers to temperatures.
  - Read points with various scales (for example 300 to 750, 900 to 1 400).
  - Place numbers on a line.
  - Plot solutions of 11 < x ≤ 16 on a line.
  - Which line shows 125 ≤ x ≤ 130; which inequality matches a marked set 265 to 269.
  - Statements about two consecutive numbers a and b.
- **Models and visuals:** number line throughout; thermometers; everyday mentions of clinical thermometers and lift floors.
- **Extension:** [ENR] *Zanimljivost*: coordinates among Egyptian builders and Babylonian astronomers; the number line as an abstract idea from the early twentieth century.
- **Interactive:** [APPLET] place numbers on lines; closing number-line applet with no described task.

## 2.4 Zbrajanje i oduzimanje prirodnih brojeva

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/181_zbrajanje_i_oduzimanje_prirodnih_brojeva.html>
- **Read:** read in full (32,683 characters; two passes, footer reached). [VIDEO] parts of Primjer 1 and 2 (number line and money model) are unavailable, as are written-method images.
- **Goals:** add and subtract in N₀ applying properties; mental calculation and estimation; interpret results; rounding rules and the effect of rounding error; set notation for inequalities; interpret data in tables, pictures, lists and graphs; answer questions beyond direct reading. **Codes:** none.
- **Concepts:**
  - *pribrojnici*, *zbroj* (*suma*); *umanjenik*, *umanjitelj*, *razlika* (*diferencija*).
  - 0 is the *neutralni element* for addition.
  - *Komutativnost* and *asocijativnost* of addition.
  - A sum of naturals is natural. A difference is natural only when the minuend is greater.
  - Subtraction is not commutative (23 − 12 ≠ 12 − 23).
- **Methods and reasons:**
  - The same sum done four ways: place-value table, number line [VIDEO], money model [VIDEO], written column method.
  - Group addends whose sum is a round number. Reason given: commutativity and associativity make mental calculation easier.
  - Estimate by rounding (134 + 89 ≈ 130 + 90).
  - Primjer 3 shows rounding's cost: 1 132 pupils rounded to 1 100 keychains leaves 32 pupils without.
- **Problem forms:**
  - Budget: 1 000 kn for seven novels priced 99 to 189 kn.
  - Ticket totals; olive production over three years with differences; reading a chart of bottle caps.
  - Dates of Hawking, Einstein and Galileo: years elapsed.
  - Odometer readings.
  - How a sum or difference changes when addends change (+27 and +56 raises the sum by 83).
  - If a square's side grows 7 cm, its perimeter grows 28 cm.
- **Models and visuals:** place-value table; number line and money model in video; chart of bottle caps; column layouts as images.
- **Extension:** none marked. *Istražimo* boxes explore order and grouping.
- **Interactive:** [APPLET] written addition and subtraction practice; two *Istražimo* applets; crossword that fills in when tasks are solved. Embedded *Procijenite svoje znanje*, 12 items spanning Units 2.1 to 2.4, including bus trip duration (10:48 to 15:32), the rounding range of a 1 900 kn course, and tourist nights.

## 2.5 Množenje prirodnih brojeva

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/182_mnozenje_prirodnih_brojeva.html>
- **Read:** read in full (30,458 characters; two passes, footer reached). Two [VIDEO] unavailable. Column layouts are garbled in the text.
- **Goals:** multiply in N₀; write dekadske jedinice as powers of 10; link a product of two equal naturals to the square; mental calculation and estimation; recognise squares up to 10; interpret results; work with data. **Codes:** none.
- **Concepts:** multiplication as repeated addition of equal addends; *faktori*; *umnožak* (*produkt*); *kvadriranje*: a · a = a², read *a na kvadrat*; *procjena*.
- **Methods and reasons:**
  - Multiply by 10, 100, 1 000 by appending zeros.
  - Multiples of ten: multiply the non-zero parts, then append zeros (250 · 30).
  - **Area model:** split a factor by place value (52 = 50 + 2), multiply parts, add. A rectangle's area is described as the number of unit squares covering it. Primjer 3 uses it for squares (side 5 cm, 25 cm²; side 7 m, 49 m²).
  - Written multiplication: multiply by each digit, each row shifts one place. Reason given: the omitted zeros change nothing in the place-value sum.
  - Estimate by rounding factors. Reason given: it helps check an answer makes sense.
  - Parity: *Istražimo* reasons about which products are even or odd to decide whether a dice game is fair.
- **Problem forms:**
  - Match 210 · 400 and similar to results; match squares to values.
  - Unit conversions inside exercises (9 km to m, 4 t to kg).
  - Money in context: 27 kn saved a day over a week, month and year; car repair 268 · 12 + 2 456; gym plans (monthly, quarterly, yearly) compared; speech therapy sessions.
  - Pictogram: one square equals 120 cakes, including fractional squares.
- **Models and visuals:** Algebris game board (12 · 10 = 120 squares); square grids of 25 and 49; area rectangles; pictogram.
- **Extension:** none marked. *Istražimo* dice game.
- **Interactive:** [APPLET] multiplication table to 100; area model for three-digit × one-digit; two-digit × two-digit with optional steps; memory game for squares; card chain (each result is the next card's task); closing game.

## 2.6 Svojstva množenja

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/183_svojstva_mnozenja.html>
- **Read:** read in full (32,530 characters; two passes, footer reached). Some fill-in fragments are scrambled.
- **Goals:** multiply in N₀ using properties (with powers of 10 and squares); interpret results in context. **Codes:** none.
- **Concepts:**
  - 1 is the *neutralni element* for multiplication; a product with 0 is 0.
  - *Komutativnost*, *asocijativnost*, *distributivnost prema zbrajanju* and *prema oduzimanju*.
  - *Izlučivanje zajedničkog faktora*: put the shared factor before a bracket, the rest inside.
- **Methods and reasons:**
  - Rearrange to simplify (237 · 25 · 4 as 237 · 100).
  - Distributivity is explained with an **area model**: a garden 25 m × 8 m split at 18 m gives 18 · 8 + 7 · 8 = (18 + 7) · 8.
  - Write 999 as 1000 − 1 for 1 234 · 999.
  - Primjer 5 solves a trip budget both ways: per item then sum, or per pupil then multiply.
  - **Like terms come from factoring out the letter:** 2a + 3a + 7a = 12a; 6a + 5b − 2a + b = 4a + 6b. The word *monom* is not used.
- **Problem forms:**
  - Choose equivalent expressions; which property does an equality use?
  - 126 · 597 + 126 · 403 by factoring.
  - Class supplies and choir clothing, cost per person and total.
  - Simplify and choose from options: 3a + 2a + a (55a, 6, 6a); 5a + 4b − 2a (3a − 4b, 7ab, 11ab, 3a + 4b).
- **Models and visuals:** garden area diagrams (*Bakin vrt*); bar chart of vegetable prices. No balance, number line or cubes.
- **Extension:** [EXT] *Kutak za znatiželjne*: the garden split into four beds, giving 18·5 + 7·5 + 18·3 + 7·3 = (18 + 7)·(5 + 3). [ENR] *Zanimljivost* on Servois and Hamilton.
- **Interactive:** [APPLET] four *Istražimo* applets, one per property; chest-code puzzle at the start. Embedded *Procijenite svoje znanje*, 13 items, including: largest product of two naturals with sum 24; does side 10 cm follow from area 100 cm²; market sales from a price chart (total 1 815 kn in the page's *Postupak*); a recipe scaled from 3 to 12 people.

## 2.7 Dijeljenje prirodnih brojeva

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/184_dijeljenje_prirodnih_brojeva.html>
- **Read:** read in full (26,495 characters; two passes, footer reached). Two [VIDEO] unavailable, one carrying Primjer 4. Some exponents in a powers item are not visible [formula not extracted].
- **Goals:** divide in N₀; mental calculation and estimation; interpret results; calculate in N₀ applying properties. **Codes:** none.
- **Concepts:** *djeljenik*, *djelitelj*, *količnik* (*kvocijent*), *ostatak*, *nepotpuni količnik*. Division by zero is not allowed (a *Zapamti!* box). Dividing by 1 changes nothing, and a number divided by itself gives 1. Division is not associative, so go left to right.
- **Methods and reasons:**
  - Intro: 72 biscuits for 24 people by repeated subtraction, so 72 : 24 = 3.
  - **Division is justified through multiplication:** 0 : 26 = 0 because 0 · 26 = 0; 5 : 0 has no answer because no quotient times 0 gives 5.
  - Written division said aloud step by step, in a longer and a shorter layout.
  - Cross out matching trailing zeros.
  - Check with a remainder: divisor · quotient + remainder = dividend (42 · 3 + 2 = 128).
  - Estimate by rounding (18 to 20; 95 to 100).
- **Problem forms:**
  - 896 : 8, 3 120 : 12, 5 778 : 54.
  - Lavender bags, 128 in packs of 3: 42 and 2 left.
  - **Rounding up by context:** 116 batteries in packs of 8 needs 15 packs; 179 people on 58-seat buses needs 4.
  - Interest-free instalments 3 120 kn over 12; pizza 288 kn split among four.
  - How many butter packs for 130 kn at 18 kn; towels with 450 kn at 95 kn.
  - A week's noon temperatures with a request for the average. See E.5.1 in the audit.
- **Models and visuals:** photo of macarons; written-division images; no number line, balance or grid.
- **Extension:** none marked.
- **Interactive:** [APPLET] division table; link between multiplication and division; division practice; game *Morana u matematičkom muzeju*: jump on every number that divides the shown number, 5 points unlocks a door.

## 2.8 Jednostavni algebarski izrazi (u skupu N)

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/185_jednostavni_algebarski_izrazi_(u_skupu_n).html>
- **Read:** read in full (26,876 characters; two passes, footer reached). Three [VIDEO] unavailable. One answer list is run together.
- **Goals:** calculate the value of simple algebraic expressions. **Codes:** none.
- **Concepts:** *redoslijed računskih operacija*; *zagrade*; the multiplication sign may be dropped between a number and a letter (8a) or two letters (ab).
- **Methods and reasons:**
  - Without brackets: × and : first, left to right, then + and −. With brackets: brackets first.
  - Reason given: so that there is no doubt and everyone calculates the same way. It opens with 7 + 3 · 2 and pupils disagreeing (20 or 13).
  - Simplify by factoring out the letter: 3a + 4a + a = a · (3 + 4 + 1) = 8a.
  - Evaluate by substituting, or simplify first then substitute: 8a − 2a + 15a − 6a for a = 19 is 15 · 19 = 285.
- **Problem forms:**
  - 345 + 225 : (5 − 2); 4 · (29 − 3 · 7) + 12 : (43 − 37).
  - Same numbers with different brackets.
  - **Missing-number sentences without using the word equation:** 6 · 4 + __ = 34; 5 · (7 + __) − 10 = 65; (__ − 11) · 4 + 3 = 23. [MINE] These are multi-step unknowns earlier than the equation lessons, judged from the blanks' positions; the page does not call them equations.
  - Translate phrases: 5 more than a, 5 times smaller than a; 6 less than double x.
  - Value of 2a + 3b − 6 for a = 7, b = 2.
- **Models and visuals:** an animated image of the order of operations; no balance, number line or grid.
- **Extension:** [EXT] *Kutak za znatiželjne*: 5·(a + b + 18) − 3a + 2b − 10 at a = 12, b = 9, solved by substitution and by simplifying (167). [ENR] *Zanimljivost*: Diophantus and Viète on symbols for unknowns.
- **Interactive:** [APPLET] order-of-operations practice; fill rectangles to make an equality true. Embedded *Procijenite svoje znanje*, 11 items, including: paper clips shared; 538 pupils and 45 teachers on 56-seat buses; ordering expressions.

## Module 2: Aktivnosti za učenje

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/186_aktivnosti_za_ucenje.html> (22,596 characters; two passes, read in full). Goals here include practising the four operations and order of operations, setting up and solving equations, and reading data. **This page, not a numbered unit, is where equations first appear in the book.**

- **Story game *the missing homework*:** Adrian's homework has vanished. Pupils solve expressions such as 11 · 12 − 56 and 120 − {32 − [3 · (30 − 6 · 4) : 2]} · 3 + 1 to eliminate suspects, then what happened, then which room.
- **Section *Veza između računskih operacija*, Primjer 1:** Borna has run 39 km of a 57 km race. The page first shows a box, 39 + ☐ = 57, then replaces it with a letter: 39 + x = 57, x = 57 − 39, x = 18, and checks 39 + 18 = 57.
- **Definitions:** *nepoznanica*: the letter standing for the number to find. *jednadžba*: an equality with an unknown. Solving means finding the number that replaces the unknown.
- **Three addition/subtraction forms**, each with its own rule named from the operation's parts, each checked by substituting:
  - a + 203 = 405: subtract the known addend from the sum.
  - b − 109 = 207: add the subtrahend to the difference.
  - 116 − c = 98: subtract the difference from the minuend.
- **Three multiplication/division forms**, same pattern:
  - 4 · p = 192 (pizza): p = 192 : 4.
  - d · 24 = 2 472; e : 7 = 252: multiply quotient by divisor; 2 323 : c = 23: divide dividend by quotient.
- **No reason for the rules** beyond naming the *veza zbrajanja i oduzimanja* and *veza množenja i dijeljenja*, and the check by substitution. The page does not call them inverse (*suprotna*).
- **Balance-scale applets [APPLET]:**
  - Zadatak 5: add weights to the suitable sides to balance the scale, then remove an equal number of weights from both sides to find the "mass" of a bag of money. Then match x + 56 = 108, 155 − x = 98 and similar to solutions.
  - Zadatak 6: for multiplication and division, add weights to balance, then remove a bag from the left and a certain number of weights from the right to find one bag's mass. Then match 52 · x = 1 924, x : 2 = 19 and similar.
  - The written examples do not use the both-sides idea, and the page never connects the scale to the written method.
- **Applet:** Zadatak 4, simple equations through the link between addition and subtraction.
- **Word problems:** Tiana's hourly wage (52 · y = 1 248); pupils' sales; choose the equation for a discount (x − 107 = 131, 131 − x = 107, 131 + x = 107); stickers; pick all valid equations for a hearing aid discount, more than one being correct.
- **Closing:** optional crossword on order of operations.
- **Kutak za znatiželjne:** none on this page.

## Module 2: Procjena znanja

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/175_knowledge_assessment.html> (15,269 characters, read in full). The page's pager shows 12 items. My two passes numbered them differently, so treat the count as about 12.

Pupils:

- Write 2·10⁵ + 3·10³ + 4·10² + 10⁰ as a number, and number words in digits.
- Choose the set for 163 ≤ x < 168.
- Say how a sum changes when one addend rises by 16 and the other falls by 7.
- Choose the commutative operations.
- Order six expressions by value.
- **Word problems with an unknown price or part:** 28 hot dogs at 14 kn and 42 juices total 896 kn, find the juice price; 220 km cycled over five days, 48 km on the first, the rest equal.
- Round distances to tens.
- **Solve five one-operation equations** by choosing an answer: x + 43 = 146; x : 13 = 8; 525 : x = 5; x · 4 = 428; 164 − x = 56.
- Mark true statements about N and N₀.
- Scale a recipe from 4 to 16 people.
- Read a column chart of colour choices in three classes.

---

# Module 3: Djeljivost prirodnih brojeva

Module page: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/187_djeljivost_prirodnih_brojeva.html>

## 3.1 Višekratnik i djelitelj

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/188_visekratnik_i_djelitelj.html>
- **Read:** read in full (28,486 characters; two passes, footer reached). The *Kutak za znatiželjne* holds only a [VIDEO], so its content is unknown.
- **Goals:** recognise and find multiples and divisors of a natural; apply divisibility and explain the procedure. **Codes:** none.
- **Concepts:**
  - *višekratnik*: the product of a natural with any natural n, written n · a.
  - *djelitelj*: a number that divides n without remainder.
  - Also uses *djeljiv*, *ostatak*, *presjek*, *unija*.
- **Methods and reasons:**
  - List multiples by multiplying by 1, 2, 3, and so on.
  - Zero is not a multiple of a natural, because no natural times a gives 0. You cannot divide by zero.
  - Find divisors by writing the number as a product in every way: 24 = 1·24 = 2·12 = 3·8 = 4·6.
  - Find a multiple in a range with division and remainder: 100 : 7 = 14 remainder 2, so the first above 100 is 105.
  - Two divisor sets always intersect, because 1 divides every natural.
- **Problem forms:**
  - Tibor saves 5 kn a day: after 58 days, after n days (5 · n).
  - 24 pupils into equal groups, as a table.
  - Magnets at 15 kn and a bill of 107 kn: 107 is not a multiple of 15, so it is wrong.
  - Gingerbread between 100 and 120 on seven tables; pralines between 490 and 500; orchestra of 110 to 120 in 13 rows.
  - Sort numbers into divisors of 9, of 16, of both.
  - Is 17 a divisor of 2 244?
- **Models and visuals:** geoboard (*geoploča*) in a photo and as the context for grouping; group table. No Venn diagram or number line.
- **Extension:** [EXT] *Kutak za znatiželjne*: [VIDEO] only. Optional poster on *savršeni brojevi*.
- **Interactive:** [APPLET] practising divisors and multiples.

## 3.2 Pravila djeljivosti

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/189_pravila_djeljivosti.html>
- **Read:** read in full (29,207 characters; two passes, footer reached). Two [VIDEO] unavailable, one of them *Otkrijmo pravilo!*, which introduces the digit-sum rule.
- **Goals:** recognise and find multiples and divisors; apply rules for 2, 3, 5, 9, 10; apply divisibility and explain the procedure. **Codes:** none.
- **Concepts:** rules stated as facts: 2 (even units digit); 5 (0 or 5); 10 (0); 100 (last two digits 0); 3 and 9 (digit sum divisible by 3 or 9, and conversely).
- **Methods and reasons:**
  - No reason is given in the text for why any rule works.
  - For 3, the page has pupils see that the units digit does not decide, then moves to the rule through the [VIDEO].
  - Missing digit: 4*258 for 9: digit sum 19, next multiple of 9 is 27, so * is 8. 62*4 for 3: sum 12, so 0, 3, 6, 9.
- **Problem forms:**
  - Five multiples of 2 between 20 and 50.
  - Sort 20 numbers into divisible by 2 but not 5, 5 but not 2, both, neither.
  - Divisible by 100: yes/no statements.
  - Always, sometimes, never: a units digit of 9 means a multiple of 9.
  - Martin bought 12 equal notebooks: which bill (166, 156, 180, 157 kn) is impossible?
- **Models and visuals:** none beyond the videos. No diagram.
- **Extension:** none marked.
- **Interactive:** [APPLET] one enlargeable item, undescribed; sorting and matching. Embedded *Procijenite svoje znanje*, 8 items spanning Units 3.1 and 3.2.

## 3.3 Prosti i složeni brojevi

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/190_prosti_i_slozeni_brojevi.html>
- **Read:** read in full (19,908 characters; whole-page pass plus a tail pass, footer reached). The sieve is an image only.
- **Goals:** distinguish primes and composites; find divisors; apply divisibility and explain. **Codes:** none.
- **Concepts:** *prosti* (*prim*) *brojevi*: exactly two divisors. *složeni brojevi*: at least three. 1 is neither. *Eratostenovo sito* is named.
- **Methods and reasons:**
  - **Tokens explain primes:** arrange 4, 5, 6, 7, 8, 12 *žetoni* in equal rows. 5 and 7 allow the fewest arrangements, because only 1 and themselves divide them.
  - Count divisors, then sort.
  - Show a number is composite with a divisibility rule (1 522 even; 755 ends in 5; 261 digit sum).
  - The sieve's steps are not in the text.
- **Problem forms:**
  - Primes below 20; primes 13 ≤ p ≤ 23.
  - Which x makes 10 − x prime.
  - How many even primes? No prime has digit sum 18. A product of two primes is composite. Smallest difference between neighbouring primes.
- **Models and visuals:** *žetoni* in rows; an image of a sieve with numbers.
- **Extension:** [ENR] *Zanimljivost* on Eratosthenes.
- **Interactive:** [APPLET] token arrangements; sort numbers into prime, composite, neither.

## 3.4 Rastavljanje broja na proste faktore

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/191_rastavljanje_broja_na_proste_faktore.html>
- **Read:** read in full (25,753 characters; two passes, footer reached). One [VIDEO] and method images (48, 100, 117) unavailable.
- **Goals:** distinguish primes and composites; factorise a composite and write repeated factors as a power; apply divisibility and explain. **Codes:** none.
- **Concepts:** *rastav na proste faktore*: every composite is a product of primes and the factorisation is unique (stated, not shown). Repeated factors are written as *potencija*. The words *baza* and *eksponent* are not used.
- **Methods and reasons:**
  - Opening: write 60 with as many factors (≠ 1) as possible. Five pupils try. 2·2·3·5 is the best, and adding 1s is rejected.
  - Two layouts, largely in images: repeated splitting with primes circled; repeated division until the quotient is 1.
  - Reason given: the most factors come when all factors are prime.
- **Problem forms:**
  - 18 = 2·3²; 100 = 2²·5²; 117 = 3²·13; 41 is prime.
  - Match numbers to factorisations; order cards.
  - From factorisation to number: 2³·3²·5 = 360.
  - Six numbers between 10 and 20 with product 6 276 270; three consecutive with product 336.
  - Common prime factors of 154 and 182.
- **Models and visuals:** images of factorisation layouts. No tree is named in the text.
- **Extension:** none marked.
- **Interactive:** robot game [APPLET]: factorise the shown number, a right answer is your point and a wrong answer the robot's; *Igra - faktorizacija* [VIDEO]. Embedded *Procijenite svoje znanje*, 8 items, including a statement that 1 645 is divisible by 2 because of its digit sum, which the *Postupak* answers with the last-digit rule.

## Module 3: Aktivnosti za učenje

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/192_aktivnosti_za_ucenje.html> (25,909 characters, read in full). Three [VIDEO] unavailable. **This page is where the curriculum's extended content on divisibility of sums, differences and products sits.**

- **Story:** a charity raffle gives chocolate for a number divisible by 2, a toy for divisible by 3. Which of ten tickets wins both?
- **Set work:** S has 20 numbers. Match subsets by divisor, then pairwise intersections, and answer what their members share.
- **Combined rules (boxed):** 2 and 3 give 6; 3 and 5 give 15; 2 and 9 give 18; 5 and 9 give 45. Digits a and b in 12a5b divisible by 15; 789ab by 6; a755b by 15.
- ***Djeljivost zbroja i razlike***: 35 + 15 nuts among 5 (7 + 3 each, or 50 : 5); five friends and 100 kn; differences such as 106 − 61 = 45 kn among 5.
- ***Djeljivost umnoška***: 6 boxes of 10 candies among 3 people, then among 4; walnuts packed in 75 kg sacks and 3 kg bags.
- ***Pogodi moj broj***: a multiple of 9, below 50, the square of a composite (36); a three-digit number divisible by 3, 7, 8 with digit sum 9 (504); the rule for 4 from the last two digits, followed by a sort and two yes/no items.
- **Kutak za znatiželjne:** none on this page.

## Module 3: Procjena znanja

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/187_knowledge_assessment.html> (16,156 characters, read in full). 15 items.

Pupils:

- Choose sets of multiples of 3; multiples of 8; smallest and largest two-digit multiples of 23.
- Match numbers to divisor lists; mark divisors of 18; judge "a larger natural has more divisors".
- Sort by divisibility by 2; find digits for 62*53 divisible by 3; choose numbers divisible by 9.
- Sort primes and composites; judge "all primes are odd".
- Match power forms such as 2³·5 to values; factorise 294.
- Judge five statements.
- A closing puzzle: four people aged over 50 and under 100 give divisibility clues to their ages.

---

# Module 4: Skupovi točaka u ravnini

Module page: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/193_skupovi_tocaka_u_ravnini.html>

## 4.1 Skupovi točaka u ravnini

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/194_skupovi_tocaka_u_ravnini.html>
- **Read:** read in full (31,768 characters; two passes, footer reached). Two [VIDEO] on drawing parallels and perpendiculars are unavailable, and these carry the drawing method.
- **Goals:** describe points, lines, rays and segments in maths language; sketch, draw and label them and their relations; describe *sukladnost dužina*; draw *usporedne* and *okomite* lines. **Codes:** none. [MINE] Congruent segments are named in this goal, but the content is in Unit 4.2.
- **Concepts:**
  - *točka*: marks a position, no size, capital letter.
  - *ravnina*: unbounded flat surface, no thickness.
  - *pravac*: unbounded, infinitely many points.
  - *polupravac*: a point T splits a line into two rays; *suprotni polupravci*.
  - *paralelni* (*usporedni*) lines: no common points. *sjecište*: single common point. *podudaraju se*: all points shared. *okomiti pravci*: a special case of intersecting.
  - Symbols ∥, ⊥, ≡, ∈, ∉, ⊂, ∩, ∅.
  - [ENR] *pramen pravaca*.
- **Methods and reasons:**
  - One point gives infinitely many lines; two points give exactly one, so a line is uniquely determined by two points. Pupils explore this with applets.
  - Four points non-collinear give six lines.
  - Perpendicular lines split the plane into four congruent parts.
- **Problem forms:**
  - Draw all lines through four points.
  - Match a ∥ b, a ⊥ b, a ≡ b to meanings and to the number of common points.
  - If a ∥ b, is a ∩ b = ∅?
  - Membership statements for points on a line or plane.
  - Does a ray's start point belong to it? Is ray CE a subset of line p?
  - Which pictured rays intersect?
- **Models and visuals:** real-world lines (road, aircraft trail, wires), lasers and sunbeams as rays, pixels as points, a clock at 12.
- **Extension:** [ENR] *Zanimljivost*: Euclid and *Elementi*, pixels, the ∞ symbol.
- **Interactive:** [APPLET] lines through one point, through two points, positions of two lines; memory game on notation and terms.

## 4.2 Simetrala dužine i njezina svojstva

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/195_simetrala_duzine_i_njezina_svojstva.html>
- **Read:** read in full (24,226 characters; two passes, footer reached). [VIDEO] on the construction and a shortest-path animation are unavailable, though the construction steps are also in text.
- **Goals:** construct and define *simetrala dužine*; describe and apply its properties. **Codes:** none.
- **Concepts:**
  - *dužina*, *krajnje* or *rubne točke*; separate notation for a segment and for its length.
  - *sukladne dužine* (equal lengths, symbol ≅); *paralelne* and *okomite dužine*.
  - *polovište*: the point equally far from both ends.
  - *simetrala dužine*: the line through the midpoint, perpendicular to the segment.
- **Methods and reasons:**
  - Properties are found by measuring in an applet, not proved: any point on the simetrala is equally far from both ends; a circle centred on it through one end passes through the other.
  - Construction: circle at A through B, circle at B through A, join the two intersections. It cuts the segment at the midpoint. No proof in the text.
  - Perpendicular through a point on a line, and off a line: draw a circle at the point to get A and B, then take the simetrala of AB.
  - Counting segments among points: 5 points, 4·5 = 20 ordered pairs, halved because JK and KJ are the same.
- **Problem forms:**
  - Count segments (4, 5, 6 points).
  - Perpendicular, parallel and congruent side pairs in a rectangle and square.
  - AB = 46 mm, midpoint distance; PA = 48 mm, find AB.
  - Find B given A and T on the simetrala.
- **Models and visuals:** construction diagrams. *Šestar* is not named on this page, and constructions are described with circles.
- **Extension:** [ENR] *Zanimljivost* on Euclid. Closing applet: where the three simetrale of a triangle's sides meet, relative to the vertices.
- **Interactive:** [APPLET] observing distances from a segment's ends; measuring on the simetrala; drawing the circle.

## 4.3 Susjedni i vršni kutovi

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/196_susjedni_i_vrsni_kutovi.html>
- **Read:** read in full (31,352 characters; three passes, footer reached). [VIDEO] on measuring (Primjer 3) and drawing (Primjer 4) with a protractor are unavailable, and these carry the entire protractor method.
- **Goals:** recognise and classify angles; measure and draw angles; calculate size in degrees and minutes; draw and describe adjacent and vertical angles; find their sizes. **Codes:** none. [MINE] This one unit, whose title names only adjacent and vertical angles, carries nearly all of outcome D.5.1.
- **Concepts:**
  - *kut*: part of the plane bounded by two rays from a common start, including the rays. *vrh kuta*, *krakovi kuta*.
  - Angle kinds with sizes: *šiljasti*, *pravi* (90°), *tupi*, *ispruženi* (180°), *izbočeni*, *puni* (360°).
  - *kutni stupanj*: 1° = 60 *kutnih minuta*, 1′ = 60 *kutnih sekundi*, so 1° = 3600″. *mjera kuta* is another name for *veličina kuta*.
  - Notation ∡AVB; Greek letters for sizes. If no arc is drawn, the smaller angle is meant.
  - *susjedni kutovi* (*sukuti*): one shared arm, the others opposite rays; sum 180°.
  - *suplementarni kutovi*: sum 180°, need not share an arm.
  - *vršni kutovi*: common vertex, opposite-ray arms, equal size (stated without proof).
- **Methods and reasons:**
  - An angle forms as a ray rotates around a fixed point (a door [VIDEO]).
  - **Protractor:** the text only says size is measured with a *kutomjer*, and shows images of 180° and 360° protractors. Where to place it and which scale to read are absent from the text.
  - Convert by × 60 or : 60, because 1° = 60′.
  - Sukut: β = 180° − α. To subtract minutes, rewrite 180° as 179°60′.
  - **Primjer 8 is an equation in all but name:** one of two supplementary angles is three times the other, set out as α + 3·α = 180°, 4·α = 180°, α = 180° : 4, α = 45°. The page does not use the word *jednadžba* or name a rule. [MINE] This is the book's first worked collection of like terms in an equation, by module order.
- **Problem forms:**
  - 12° = 720′; 4°3′ = 14 580″; 25 200″ = 7°.
  - α = 112°14′, so β = 67°46′.
  - Which points belong to an angle?
  - Match pictures to angle kinds.
  - Is a sukut always supplementary, and the reverse?
  - Unknown angles from figures (values in images).
- **Models and visuals:** protractor images; photos as angle examples (geese, dancer, petals, lemon, tortoise, grass); scissors [VIDEO] for vertical angles.
- **Extension:** none marked.
- **Interactive:** [APPLET] move a point to change and name an angle; measuring practice (Zadatak 2); sukut sizes; closing estimation of angle sizes.

## 4.4 Kutovi uz presječnicu

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/197_kutovi_uz_presjecnicu.html>
- **Read:** read in full (26,172 characters; three passes, footer reached). Two [VIDEO] unavailable. Figures are images.
- **Goals:** draw angles at a transversal of parallel lines; analyse angles with parallel arms; find their sizes. **Codes:** none.
- **Concepts:** *presječnica*: a line crossing two parallel lines. Eight angles: four acute, four obtuse. *Kutovi s paralelnim kracima*.
- **Methods and reasons:**
  - All acute angles are equal, all obtuse angles are equal, and an acute plus an obtuse makes 180°. No reason beyond exploring in the applet.
  - A perpendicular transversal gives eight right angles.
  - Parallel arms: same kind means equal, different kinds means sum 180°.
- **Problem forms:**
  - Given 28°, find the rest; given 151°20′, find the acute as 179°60′ − 151°20′ = 28°40′.
  - Two transversals across parallel lines, six unknown angles.
  - Parallel-arm pairs: α = 44°, both acute; β = 112°, different kinds.
  - [MINE] The text shows no ruler-and-triangle drawing task, despite the goal; tasks read figures.
- **Models and visuals:** figures only. No protractor is mentioned on this page.
- **Extension:** [EXT] *Kutak za znatiželjne*: choose pictures of two acute angles with parallel arms sharing no points; describe supplementary non-adjacent pairs.
- **Interactive:** [APPLET] see the marked sizes, then judge statements; practise unknown angles. Embedded *Procijenite svoje znanje*, 8 items spanning Units 4.1 to 4.4, including sorting angle sizes (237°18′, 23°, 136°45′) into acute, obtuse and reflex.

## 4.5 Trokut

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/198_trokut.html>
- **Read:** read in full (27,931 characters; two passes, footer reached). Triangle classification depends on images.
- **Goals:** describe a triangle (vertices, sides, angles); distinguish kinds. **Codes:** none.
- **Concepts:**
  - *trokut*: three non-collinear points determine three segments and the bounded part of the plane.
  - *vrhovi*, *stranice*, *unutarnji kutovi*; conventions a = BC, α at A.
  - By sides: *jednakostraničan* (also isosceles, not the reverse), *jednakokračan* (*krakovi*, *osnovica*), *raznostraničan*.
  - By angles: *šiljastokutan*, *pravokutan*, *tupokutan*.
- **Methods and reasons:**
  - Side and angle relation is explored in an applet: opposite the longest side is the largest angle, and opposite the shortest the smallest. Pupils judge statements, and help boxes state the rule.
  - A triangle has only one obtuse angle. Base angles of an isosceles triangle are equal.
  - The 180° angle sum appears only in a [ENR] *Zanimljivost* on triangulation, with no derivation.
  - **No construction of any triangle and no existence condition in the text.** *Šestar* and *nejednakost trokuta* are absent.
- **Problem forms:**
  - Classify triangles by sides and angles (images).
  - a = 4 cm, b = 3 cm, c = 52 mm: order the angles. Note the mixed units.
  - α = 42°, β = 76°, γ = 62°: order the sides.
  - Can an isosceles triangle be obtuse?
- **Models and visuals:** nine triangles; plan of the Trokut neighbourhood in Zagreb.
- **Extension:** [ENR] *Zanimljivost*: triangulation with a theodolite; the Trokut neighbourhood.
- **Interactive:** [APPLET] labelling vertices and sides; side and angle relation.

## 4.6 Pravokutnik i kvadrat

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/199_pravokutnik_i_kvadrat.html>
- **Read:** read in full (24,150 characters; two passes, footer reached). One [VIDEO] unavailable: it holds the only construction here.
- **Goals:** describe and label a rectangle and a square; describe and apply their properties. **Codes:** none.
- **Concepts:**
  - *pravokutnik*: a quadrilateral with four right angles.
  - *susjedni* and *nasuprotni* vertices and sides; *dijagonale*.
  - *kvadrat*: a rectangle with equal adjacent sides. Every square is a rectangle.
  - Properties: opposite sides equal and parallel; diagonals equal and bisecting each other; a square adds equal sides and perpendicular diagonals.
- **Methods and reasons:**
  - Properties are explored by applet and stated, not proved.
  - A square is a rectangle because it has all rectangle properties.
  - If all angles of a quadrilateral are equal, each is 90°.
  - **No step-by-step construction in the text.** A closing [VIDEO] shows constructing a square from a known diagonal. *Simetrala* does not appear. A rectangle construction is absent.
- **Problem forms:**
  - Which points belong to a rectangle?
  - Opposite and adjacent vertices and sides in rectangle OPRS.
  - Match seven statements to rectangle, square or both.
  - Is every rectangle a square?
  - Riddles *Pogodi tko sam!*
- **Models and visuals:** Mondrian composition; everyday squares (clock, QR code, parking sign, chessboard); a set diagram of squares inside rectangles.
- **Extension:** none marked. *Opseg*, *površina*, tangram and motifs do not appear.
- **Interactive:** [APPLET] rectangle sides; diagonals; square properties.

## 4.7 Krug i kružnica i njihovi dijelovi

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/200_krug_i_kruznica_i_njihovi_dijelovi.html>
- **Read:** read in full (32,585 characters; two passes, footer reached). One [VIDEO] unavailable.
- **Goals:** define *kružnica* and *krug*; describe *polumjer*, *promjer*, *tetiva*; describe and draw *kružni isječak*, *kružni odsječak*, *kružni vijenac*. **Codes:** none.
- **Concepts:**
  - *kružnica*: all points equally far from a point S, the *središte*. Notation k(S, r).
  - *polumjer*; *tetiva*; *promjer*: longest chord through the centre, d = 2r.
  - *kružni luk*, *koncentrične kružnice*.
  - *krug*: points bounded by the circle, including it. Notation K(S, r).
  - *isječak*: two radii and an arc. *odsječak*: chord and arc. *vijenac*: between concentric circles, width is the difference of radii.
  - *polukružnica*, *polukrug*.
- **Methods and reasons:**
  - An applet shows a circle formed by a string pinned at a point.
  - Conventions only: the smaller arc is meant unless stated; points are listed counterclockwise in dynamic geometry software.
  - **No compass construction steps and no drawing of parts in the text.** *Šestar* is absent, though the goal says "draw".
- **Problem forms:**
  - Which points are on k(S, r)?
  - Match k(S, 23 mm) to descriptions.
  - Radius 34 mm, find the diameter.
  - Annulus r₁ = 23 mm, r₂ = 3 cm: width (mixed units).
  - Is a half-disc a sector, a segment, both?
  - Name parts in pictures.
- **Models and visuals:** photos (wheel, Ferris wheel, mill, cake, Kandinsky-style art, pizza, pie chart, roundabout); definition diagrams.
- **Extension:** [ENR] *Zanimljivost*: the Φ sign in everyday use; arc conventions; a legend of Archimedes and his circles in the sand.
- **Interactive:** [APPLET] string circle; find pairs for concentric circles and for parts. Embedded *Procijenite svoje znanje*, 10 items spanning Units 4.5 to 4.7.

## 4.8 Osnosimetrično i centralnosimetrično preslikavanje skupova točaka u ravnini

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/201_osnosimetricno_i_centralnosimetricno_preslikavanje_skupova_tocaka_u_ravnini.html>
- **Read:** read in full (43,674 characters; three passes, footer reached). The longest lesson in the book. [VIDEO] carries Primjer 2, Primjer 3 and Zadatak 2 solutions. Figures are images.
- **Goals:** draw and construct axial and central images of simple plane figures; recognise symmetric figures; find the axis or centre. **Codes:** none.
- **Concepts:**
  - *osna simetrija*, *os simetrije*, *osnosimetričan lik*: a line maps the figure onto itself.
  - *centralna simetrija*, *centar* or *središte simetrije*: S is the midpoint of AA′.
  - Images: a point goes to a point; a segment to an equal segment; a figure to a congruent figure.
- **Methods and reasons:**
  - Axial, point: drop a perpendicular to the axis at A₁, circle at A₁ through A gives A′. Reason given: A₁ is then the midpoint, so the axis is the simetrala of AA′. A point on the axis maps to itself.
  - Central, point: draw the ray from A through S and transfer AS past S with a *šestar*.
  - Segments and triangles: map the ends or vertices and join them.
  - Given T and T′, the centre is the midpoint, found with the simetrala.
- **Problem forms:**
  - Paper folded, cut and unfolded: name the shape.
  - Is this façade symmetric (Taj Mahal, HNK Zagreb)?
  - Count axes (square, equilateral triangle, rectangle, segment, line).
  - Triangle on a square grid.
  - Is B the image of A (quadrilaterals, triangles, circles, as figures to judge)?
  - Mark centrally symmetric figures and flags.
  - Playing cards.
- **Coverage note:** quadrilaterals appear in judge-this-figure and grid tasks. No worked example maps a circle under either symmetry, and the central image of a line is absent. The square grid is used only for axial symmetry. A mirror is not mentioned.
- **Models and visuals:** paper folding and cutting; grid; flags; buildings; playing cards; butterfly [VIDEO].
- **Extension:** none marked. *Istražimo*: playing with an axis [VIDEO].
- **Interactive:** [APPLET] place an axis by moving points; reflect a triangle on a grid; closing: choose a symmetry, watch a moving point's trace, colour a figure to make it symmetric. Embedded *Procijenite svoje znanje*, 14 items, ten of them classifying pictured figures.

## Module 4: Aktivnosti za učenje

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/202_aktivnosti_za_ucenje.html> (17,393 characters, read in full). The whole page is one story, with no separate game or tool.

- **Escape-room frame:** teacher Josip's prizes for World Multiplication Table Day are locked behind four padlocks, and each set of tasks opens one.
- **Lock 1:** order five figures by number of symmetry axes.
- **Lock 2:** list the points on a segment, a line and a ray, then form a term from the letters.
- **Lock 3:** true or false: a reflex angle is smaller than an obtuse angle; supplementary angles must share an arm; a segment's endpoint belongs to it; adjacent angles must be acute and obtuse; a circle's centre belongs to it.
- **Lock 4:** five calculations in a notebook, with the answers summed as a code: minutes in 7°; straight angle; obtuse angle from 46° at a transversal; supplement of 36°; sukut of 27°.
- **Absent:** no constructions, no triangle construction, no tangram, motifs or protractor use. **Kutak za znatiželjne:** none.

## Module 4: Procjena znanja

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/193_knowledge_assessment.html> (17,936 characters, read in full). 18 items.

Pupils:

- Match notation for a segment, a line and a length.
- Judge intersections of segments on a line.
- Fill in names for rectangle and square parts.
- Judge "every rectangle is a square" and the reverse.
- Judge statements about a simetrala.
- Sort angles at a vertex into acute and obtuse; order angle kinds by size.
- Sukut of 78°; which statement about vertical angles cannot hold.
- Transversal with an acute angle of 35°20′: find obtuse angles in degrees and minutes.
- Sort triangles by given side lengths; order angles from sides.
- Fill in definitions of circle, chord, diameter, disc parts.
- Choose axially symmetric figures; match shapes to their number of axes.
- **Absent:** no item asks a pupil to measure or draw an angle, or to construct anything.

---

# Module 5: Razlomci i decimalni brojevi

Module page: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/203_razlomci_i_decimalni_brojevi.html>

**Note on fractions in this module:** fraction bars do not survive extraction, so a fraction reaches me as two numerals with a space, such as "3 5". I write these as 3/5. Stacked layouts are [formula not extracted]. Mixed numbers arrive as three numerals, such as "2 1 3" for 2 1/3.

## 5.1 Pojam i prikazivanje razlomaka

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/204_pojam_i_prikazivanje_razlomaka.html>
- **Read:** read in full (35,459 characters; two passes, footer reached). One [VIDEO] unavailable. Fraction bars lost.
- **Goals:** link pictorial and numeric forms of a fraction; write and interpret a fraction as division; describe and find a share (*udio*) in a set of like data. **Codes:** none.
- **Concepts:**
  - *razlomak*: expresses a part of a whole.
  - *brojnik*: how many parts we consider. *nazivnik*: how many equal parts the whole is divided into. *razlomačka crta*.
  - Names: *polovina*, *trećina*, *četvrtina*, *petina*, *šestina*, *osmina*.
  - Numerator 0 gives 0. Any natural can have denominator 1. Equal numerator and denominator give 1.
  - *ekvivalentni razlomci*: describe equal parts of a whole.
- **Methods and reasons:**
  - **Fraction as division, from sharing:** one chocolate among 2, 4 or 8 children gives 1 : 2 = 1/2 and so on, so a : b = a/b.
  - Fraction of a quantity: (quantity : denominator) · numerator. 3/4 of 60 min = 45 min; 5/8 of 200 m = 125 m.
  - Parts must be equal: one task asks which shape is not properly split into quarters.
  - Many ways to halve a square (four examples).
  - *Proširivanje* (multiply both parts) and *skraćivanje* (divide both by a common divisor) are given in [ENR] *Zanimljivost* boxes, shown by example and not drilled as procedures.
- **Problem forms:**
  - A coin thrown on a board of 8 parts (yellow 3/8, blue 5/8): is the game fair?
  - Maja's cake in eighths; family vote as a share (4/6, 2/6).
  - Sort fractions into equal to 1, equal to 0, equal to a natural.
  - Units from fractions: 1/4 m = ? cm; 2/3 h = ? min.
  - 20 pupils, 3 with hearing aids; 4 l syrup in 5 bottles.
  - Petar had 60 kn and spent 2/5; Tomica had 300 kn and spent 5/6.
  - Two pizzas: 2/8 left and 1/4 left, so equal.
  - Which of 1/2, 1/3, 1/4 equals the shaded part (9 figures).
- **Models and visuals:** shaded shapes; apple, cake, chocolate bar, pizzas, lollipops; bar chart of a vote. No number line here.
- **Extension:** [ENR] the two *Zanimljivost* boxes above.
- **Interactive:** [APPLET] shading fractions; choose a fraction and list equivalents; story of Benedictine sisters on Rab recovering the *rapska torta* recipe; memory game pairing fractions with pictures.

## 5.2 Razlomci i brojevni pravac

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/205_razlomci_i_brojevni_pravac.html>
- **Read:** read in full (38,556 characters; two passes, footer reached). Three [VIDEO] unavailable. Number lines are images.
- **Goals:** show a fraction on a number line. **Codes:** none.
- **Concepts:** *brojevni pravac*; *ishodište* O (from *origo*); *jedinična točka* E (from *ekvidistancija*); *jedinična dužina* OE. [MINE] The curriculum's *preporuka* for A.5.3 says not to introduce *ishodište* and *jedinična točka*, so this goes beyond it, as in Unit 2.3.
- **Methods and reasons:**
  - To plot a/b: divide the unit segment into b equal parts, then transfer one part a times to the right of O.
  - To read: count parts between two naturals for the denominator; the numerator is the distance from O in those parts.
  - Equal denominators: the larger numerator is larger, because its point lies further right. Checked with rectangles and circles.
  - Equal numerators: the smaller denominator is larger, because the same whole split into more parts gives smaller parts.
- **Problem forms:**
  - A garden: cypresses at 1/2 m and roses at 2/5 m intervals, plotted along 6 m. Convert first (1/2 m = 5 dm, 2/5 m = 4 dm).
  - Read A(1/3), B(7/3), C(8/3), D(11/3).
  - Plot 1/5, 4/5, 7/5, 11/5, 18/5.
  - 3/5 and 4/5; 7/8 and 11/8; Maja's 3/5 and Petra's 3/10 of a chocolate.
  - True statements such as 3/8 < 3/9.
- **Models and visuals:** number line throughout; rectangles and circles for comparison; star and quadrilateral pictures in the quiz.
- **Extension:** [EXT] a *Kutak za znatiželjne* with one sentence, that the line lets us compare fractions, heading the two comparison sections. [MINE] So comparing fractions appears to be framed as extension; the box markup is not clear from the text. [ENR] *Zanimljivost* on the letters O and E.
- **Interactive:** [APPLET] number-line practice; closing letter puzzle: find fractions on a line and spell where fractions were used about 1,800 years before Christ. Embedded *Procijenite svoje znanje*, 10 items, including: 24 candies, 8 strawberry, which fraction does not describe this?

## 5.3 Nepravi razlomci i mješoviti brojevi

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/206_nepravi_razlomci_i_mjesoviti_brojevi.html>
- **Read:** read in full (21,448 characters; two passes, footer reached). Two [VIDEO] unavailable. Fraction bars lost.
- **Goals:** connect notations of improper fractions, mixed numbers and naturals. **Codes:** none.
- **Concepts:** *pravi razlomak* (less than 1); *nepravi razlomak* (greater than 1); fractions equal to 1; *mješoviti broj*: a whole part and a proper fractional part.
- **Methods and reasons:**
  - Classify by comparing numerator and denominator.
  - **Sharing motivates it:** 5 chocolates among 4 people gives 5 : 4 = 5/4, or one whole and a quarter each. 7 apples among 3 gives 2 whole and 1/3 more each. Both splits give the same amount.
  - Improper to mixed: divide; the quotient is the whole part, and the remainder over the denominator is the rest (21/4 = 5 1/4).
  - Mixed to improper: whole × denominator + numerator, over the denominator (4 1/3 = 13/3).
- **Problem forms:**
  - Sort 17 fractions into three groups.
  - Match improper fractions to mixed numbers.
  - True statements such as 11/3 = 3 2/3.
  - Luka says one and a half hours is 3/2, Matija says 1 1/2: who is right?
- **Models and visuals:** piles of apples and chocolates; "plati 4 nosi 5" shop sign; coloured triangles. No number line.
- **Extension:** none marked.
- **Interactive:** [APPLET] drag cards, matching. **Closing game with two dice:** one die sets the shared denominator, each player rolls two dice for a two-digit numerator, converts to a mixed number, checks the other's work; a correct conversion or larger number scores; first to 5 wins.

## 5.4 Zapis decimalnim brojem i razlomkom

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/207_zapis_decimalnim_brojem_i_razlomkom.html>
- **Read:** read in full (30,310 characters; two passes, footer reached). One [VIDEO] unavailable. Repeat-digit dots are garbled in the text [formula not extracted for exact placement].
- **Goals:** describe and write decimals; show and apply equality among notations (naturals, decimals, decimal fractions, fractions, mixed numbers, percent, promil); discover infinite decimals; choose a suitable notation. **Codes:** none.
- **Concepts:**
  - *dekadski* or *decimalni razlomak*: denominator is a dekadska jedinica.
  - *decimalni broj*: whole part and decimal part, separated by *decimalna točka*.
  - *desetinka, stotinka, tisućinka*; *decimale*.
  - *postotak* (%): a fraction with denominator 100.
  - *promil* (‰): a fraction with denominator 1000; Croatian *potisućak*.
  - *beskonačni periodički decimalni broj*; notation with a dot or dash above the repeat.
- **Methods and reasons:**
  - Read by place value: 3.8 as *tri cijela i osam desetinki*.
  - Decimal fraction to decimal: as many decimals as the denominator has zeros.
  - Reverse: digits without the point over a power of ten.
  - Units through decimal fractions: 54 mm = 5 cm 4 mm = 5.4 cm. 1 234 lp = 12 kn 34 lp. 43 g = 0.043 kg.
  - Percent of an amount as a fraction of it: 30 % of 400 = 400 : 100 · 30 = 120.
  - Discovered by calculator: 1/3 gives 0.333..., and 2/7 and 1/6 too.
- **Problem forms:**
  - Read 2.0001. Match 17/1000 to 0.017.
  - Grid of 100: a Christmas tree, each square 1/100, share of colours as decimal and percent.
  - 3 % = 0.03; 150 % = 1.5; 7 ‰ = 0.007.
  - Jacket 400 kn at −30 %; an item 200 kn plus 25 % *PDV*.
  - 3 of 1000 people with side effects; birth rate 9 ‰; Ionian Sea 35 g salt per 1000 g.
- **Models and visuals:** place-value table extended right of the point; **grid of 100 squares**; receipt; sale sign; water and land 71 % and 29 %; salinity table; 0.5 ‰ alcohol limit.
- **Extension:** [ENR] *Zanimljivost*: Stevin's *Desetka* (1585) and al-Kashi; *pro mille*; a non-periodic infinite decimal 0.1234567891011...
- **Interactive:** [APPLET] place value; converting among forms; card matching. Embedded *Procijenite svoje znanje*, 9 items spanning Units 5.1 to 5.4.

## 5.5 Decimalni brojevi i brojevni pravac

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/208_decimalni_brojevi_i_brojevni_pravac.html>
- **Read:** read in full (26,571 characters; two passes, footer reached). One [VIDEO] unavailable. Lines are images.
- **Goals:** pair points on a line with decimals and read them. **Codes:** none.
- **Concepts:** *ishodište* O, *jedinična točka* E, *jedinična dužina* again; *koordinata točke* ([ENR] *Zanimljivost*).
- **Methods and reasons:**
  - Reading a point goes through decimal fractions: 1/10 is 0.1, so A = 0.1.
  - To place numbers with one decimal, choose a unit easy to split into 10 parts.
  - For two decimals, read between marked tenths.
- **Problem forms:** A = 1.7, B = 2.3; thermometer 38.4 °C; match points to 12.68, 12.75; place 1.75, 1.8, 1.84, 1.93 on a line from 1.7 to 1.95.
- **Models and visuals:** number line; thermometers.
- **Extension:** [ENR] coordinate of a point.
- **Interactive:** [APPLET] read a marked point to one or two decimals; place points; closing practice.

## 5.6 Uspoređivanje decimalnih brojeva

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/209_usporedivanje_decimalnih_brojeva.html>
- **Read:** read in full (22,944 characters; two passes, footer reached). Some images carry prices and square models.
- **Goals:** read, write and interpret <, >, ≤, ≥, =, ≠ for decimals. **Codes:** none. [MINE] This page does not state goals on chained inequality, though it teaches it.
- **Concepts:** compare whole parts first, then tenths, then hundredths. *produljena nejednakost*. Appending zeros changes nothing: 4 = 4.0 = 4.00.
- **Methods and reasons:**
  - Numbers further right on the line are larger.
  - Zero-padding is justified with squares: one whole, 10 tenths, 100 hundredths all fill one square, so 1 = 1.0 = 1.00.
  - Find a digit inside a chain: 5.4 < 5.4* < 5.49.
- **Problem forms:**
  - Dolphin adoption: 221.70 kn needed, 223.50 kn collected.
  - Fever: 37.5, 38.2, 38.5 °C on a line.
  - Fuel prices 9.31, 9.25, 9.24 kn: which is cheapest?
  - Road sections; gymnastics scores to order.
  - 2.3̄ against 2.3. Sort around 1.3 (1.033, 1.30, 1.300, 1.31).
- **Models and visuals:** number line 35 to 41; ear thermometer; fuel price sign; three squares.
- **Extension:** none marked.
- **Interactive:** click dots in order; sorting. **Closing dice game:** roll four dice, set aside any 1s, make a decimal with whole part 0 from the rest; the smaller number scores; first to 5 wins. It links to an online dice roller.

## 5.7 Zaokruživanje decimalnih brojeva

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/210_zaokruzivanje_decimalnih_brojeva.html>
- **Read:** read in full (22,377 characters; two passes, footer reached). One [VIDEO] and the *Istražimo* applet unavailable.
- **Goals:** apply rounding rules sensibly by the task's conditions; notice a rounding error and estimate its effect; interpret results in context. **Codes:** none.
- **Concepts:** *zaokruživanje* gives approximate values when an exact figure is not needed; ≈ read *približno*; rounding to the nearest *cijelo, desetinka, stotinka, tisućinka*.
- **Methods and reasons:**
  - The same two rules as for naturals, based on the dropped digit.
  - Carry: 5.978 to the nearest tenth gives 6.0.
  - Rounding to the first decimal is the same as to the nearest tenth, and to the second decimal the same as to the nearest hundredth.
  - Reason given: exact calculation is not always needed, for practical work or for checking sense.
  - *Istražimo*: is Petar closer to home or school? A point on a line between the two motivates rounding.
- **Problem forms:**
  - 23.6537 to each place.
  - Anita has 200 kn and needs three of each at 18, 21, 17 kn; rounding each to 20 gives 180 kn, enough.
  - Ana's average about 4.34: which grade?
  - A number rounds to 1 and to 0.5: smallest such number?
  - 40 l at 10.05 kn; 45 minutes for 40 questions.
- **Models and visuals:** number line; colour-coded digits.
- **Extension:** none marked.
- **Interactive:** [APPLET] closer to home or school. Embedded *Procijenite svoje znanje*, 11 items.

## 5.8 Grafički prikaz frekvencija podataka

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/211_graficki_prikaz_frekvencija_podataka.html>
- **Read:** read in full (23,637 characters; two passes, footer reached). One [VIDEO] on the tally method and all charts are images, with values only through alt text.
- **Goals:** connect, compare and interpret data in tables, pictures, lists and graphs in the first quadrant; put characteristics on the horizontal axis and counts on the vertical, or the reverse; answer questions beyond direct reading. **Codes:** none.
- **Concepts:**
  - *tablica crtica*: possible values in one column and a tick per occurrence in the other.
  - *stupčasti dijagram*: bar heights set by data; bars separated and of equal width; bars may be vertical or horizontal.
  - *linijski dijagram*: values as points joined by segments; usually a change over time.
  - The word *frekvencija* is in the title only, and the body uses *broj pojavljivanja*.
- **Methods and reasons:**
  - A tally gives a better view of results than the raw list.
  - Each occurrence becomes one rectangle in that value's column.
- **Problem forms:**
  - Two dice thrown 20 times: organise the sums, which is most frequent, which never appears?
  - Shirts sold by type and colour in a table: totals and differences.
  - Favourite fruit in a bar chart: how many more prefer oranges than kiwis?
  - Temperature over 24 hours: when was the 5 °C change?
  - Share price in euros over six months: the largest rise, equal months.
- **Models and visuals:** tally table; bar charts; line graphs. **Pie charts are not mentioned** here.
- **Extension:** none marked. Arithmetic mean does not appear on this page.
- **Interactive:** [APPLET] two enlargeable items with no described content; quizzes.

## Module 5: Aktivnosti za učenje

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/220_aktivnosti_za_ucenje.html> (22,444 characters; two passes, read in full). **This page and Module 6's activities page, not numbered units, hold the book's direct teaching of unit price, currency and exchange-rate lists.** The goals in this page's *Što ću naučiti?* box are: link unit price to the price of products and services; know currency (euro and one other) and exchange-rate lists; convert one currency into another.

- **Story, a shop (*Gabrijela i Lauro*):**
  - Write discounts as percent (0.25, 30/100, 0.2, 1/10), then find new prices.
  - Shelve shirts by price (145.98, 146, 151.99, 152.1 kn).
  - Take prices from a voice message as decimals.
  - Round prices to the nearest hundredth (24.5682 kn).
  - Hang shirts by decimal value.
  - Crack a six-digit safe code from fraction and number-line tasks.
- **Section *Novac u svakodnevnom životu*, ordinary content, not marked optional:**
  - **Primjer 1, which milk is best value:** 10 × 1 l for 68 kn, 4 × 1 l for 24.48 kn, 0.5 l for 3.50 kn. Per litre: 6.80, 6.12, 7 kn. *Jedinična cijena* is total price divided by quantity.
  - Badges: 100 for 390 kn; unit price with a 10 % discount. Potatoes: 10 kg for 89 kn. Paint: 10 l covers 45 m².
  - **Zadatak 11, a bank's *tečajna lista* (bank *Naš novac*):** DKK, GBP, EUR, PLN, HUF (per 100). Round to two decimals, find 1 HUF, rank currencies from most to least valuable.
  - **Zadatak 12:** euro rate over a week from a graph; highest and lowest day.
- **What it does not do:** no task on this page converts an amount between currencies; that comes in Unit 6.3 and on Module 6's activities page. *Valuta* and *tečajna lista* are used here but not defined. *Kupovni, prodajni, srednji tečaj*, *štednja*, *džeparac*, *kućni budžet*, history of money are absent.
- **Closing:** a nine-square puzzle where touching tasks and answers must match.
- **Kutak za znatiželjne:** none.

## Module 5: Procjena znanja

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/203_knowledge_assessment.html> (19,680 characters, read in full). The pager shows 20 items, while my extraction counted 21 blocks.

Pupils:

- Name parts of 5/6; choose pictures showing 1/3; say which fractions describe 9 of 12 parts.
- Can every proper fraction be written as a mixed number? Sort fractions around 1; match improper to mixed.
- 7 of 25 pupils with top grades as a fraction. 2/3 as a quotient and 2/3 h in minutes.
- Match words to decimals; 13/100 and 1 203/1000 as decimals.
- Units: 2.3 m = ? dm; 0.275 km = ? m.
- Match 12.7 %, 12.7 ‰, 127/10, 127/100 to decimals. A shaded 3/4 as decimal and percent.
- Read number lines; insert signs; order decimals; judge rounded values.
- Read a bar chart of grades and a table of packages.
- **Absent:** no item on money, unit price or currency.

---

# Module 6: Računanje s decimalnim brojevima

Module page: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/213_racunanje_s_decimalnim_brojevima.html>

## 6.1 Zbrajanje decimalnih brojeva

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/214_zbrajanje_decimalnih_brojeva.html>
- **Read:** read in full (24,802 characters; two passes, footer reached). Two [VIDEO] unavailable. One associativity formula box is garbled [formula not extracted].
- **Goals:** add decimals, applying properties and the relationship between operations; interpret results; solve a problem situation; work with money in a problem situation. **Codes:** none.
- **Concepts:** *cijeli dio*, *decimalni dio*, *decimalna točka*; *potpisivanje*; 1 kn = 100 lp; adding 0 changes nothing (not named here); *komutativnost* and *asocijativnost* of addition hold for decimals; *PDV*; *napojnica*.
- **Methods and reasons:**
  - First by splitting money: add kuna and lipa separately, then convert. Reason: 100 lp = 1 kn. The page calls this impractical for larger cases.
  - Column addition: whole part under whole part, point under point. Reason: it keeps place values matched.
  - Pad with zeros (1.6 = 1.60). Reason: added zeros do not change the value.
  - Carry explained in words: 11 tenths is 1 whole and 1 tenth.
  - Group addends to make whole subtotals, by commutativity and associativity.
- **Problem forms:**
  - Zoran 12.3 + 10.8 km: he says 23.1, Mihaela 22.11; she wrote 11 tenths as 11 hundredths.
  - Café price list: two orders, total, rounded with a tip.
  - Estimate first, then calculate the mass of Luka's fruit.
  - Phone bill plus *PDV*; Europe and Asia areas.
  - Which property does an equality use?
- **Models and visuals:** column layouts as images, shopping photo.
- **Extension:** none marked.
- **Interactive:** [APPLET] addition practice; matching; crossword.

## 6.2 Oduzimanje decimalnih brojeva

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/215_oduzimanje_decimalnih_brojeva.html>
- **Read:** read in full (28,190 characters; two passes, footer reached). Magic-square grids are not in the text.
- **Goals:** subtract decimals; interpret results; solve a problem situation; work with money. **Codes:** none.
- **Concepts:** subtraction done like naturals. *Magični kvadrat* and *magični zbroj* ([ENR] *Zanimljivost*).
- **Methods and reasons:**
  - First by unit conversion: 14 m 7 dm − 2.4 m as 147 dm − 24 dm. The page calls this usually impractical.
  - Column method, padding with zeros.
- **Problem forms:**
  - 8.2 − 3.48; 200 − 14.7.
  - Filip's card payment; change from 500 kn; flour stock.
  - Which pairs have difference 4.7?
  - Equal-value expressions across + and −.
  - A 106.5 km route over four days.
  - Sanja's budget of 2 000 kn.
  - **Garden fence:** four sides added, wire needed against rolls held. The word *opseg* does not appear.
- **Models and visuals:** photo of ribbon and scissors; column images.
- **Extension:** [ENR] magic squares, with history as protective charms, followed by Zadatak 5 and 6 to fill them.
- **Interactive:** [APPLET] subtraction practice; closing number pyramids. Embedded *Procijenite svoje znanje*, 8 items, including cake choices from a price list and Tihomir's 200 kn for books.

## 6.3 Množenje decimalnih brojeva

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/216_mnozenje_decimalnih_brojeva.html>
- **Read:** read in full (37,129 characters; two passes, footer reached). Three [VIDEO] unavailable.
- **Goals:** multiply decimals, applying properties and the relationship between operations; interpret results; solve a problem situation; work with money. **Codes:** none.
- **Concepts:**
  - Multiplying by 10, 100, 1 000 moves the point right.
  - *Komutativnost*, *asocijativnost*, *distributivnost* hold for decimals.
  - **The square of a decimal is absent:** no *kvadrat* of a decimal, no decimal with an exponent, and the goals do not mention it.
- **Methods and reasons:**
  - **Rule from pattern, not from reason:** *Istražimo* compares 3 · 0.4 = 1.2 with 3 · 4 = 12, and pupils check more on a calculator. Multiply as naturals; the product has as many decimals as the factors together. Why is not explained.
  - **Area model for two decimals:** onions at 3.6 kn/kg, 0.5 kg. Three squares and six tenths show 3.6, half of it is 1.8.
  - Estimate by bounds: since 2 < 2.4 < 3, 2.4 · 27 lies between 54 and 81.
- **Problem forms:**
  - Tomatoes at market and shop: which package (1 kg, 2 kg, 4 kg) is best value? 34.99 < 35.58 < 35.77 < 35.96 < 40.
  - 10 items at 3.79 kn; 3 · 0.4.
  - **Primjer 9, currency conversion:** Nenad has 24.50 euro, 7.44 kn for 1 euro, 24.50 · 7.44 = 182.28 kn.
  - 10.8 km/h for 0.2 h; 0.4 h in minutes.
  - Fabric, paint, watermelon, puzzle sets priced by quantity.
- **Models and visuals:** area model; column images; point-shift images.
- **Extension:** none marked.
- **Interactive:** matching, closing practice; *Istražimo* with calculator.

## 6.4 Dijeljenje decimalnog broja prirodnim brojem

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/217_dijeljenje_decimalnog_broja_prirodnim_brojem.html>
- **Read:** read in full (31,323 characters; two passes, footer reached). Three [VIDEO] unavailable, and Primjer 8's method and result appear only in video.
- **Goals:** divide decimals by naturals; interpret results; solve a problem situation; work with money. **Codes:** none.
- **Concepts:** a natural becomes decimal by writing a point and zeros. Write the point in the quotient when the first decimal digit is brought down. 1 lp = 0.01 kn.
- **Methods and reasons:**
  - Convert units first when the division is not whole (kg to dag, kn to lp). Reason given: the result then comes out whole.
  - Append zeros after the remainder: 134 : 8 = 16.75.
  - Fraction to decimal by division: 13/4 = 3.25; also shown as 325/100.
  - Divide by 10, 100, 1 000: the point moves left.
- **Problem forms:**
  - 24 biscuits, 16 bottles, 2 kg apples, 156 kn among eight people.
  - 10 euro shared by four girls.
  - 11.3 kn for 10 small packs.
  - **Averages:** the mean mass of four bags of potatoes; 362 km in 5 hours as an average speed.
  - Ivo's change from 100 kn: book plus three notebooks (12.75 kn in the *Postupak*).
  - Which sides give area 274 cm² (matching).
- **Models and visuals:** handwritten division images; tables. No number line.
- **Extension:** [EXT] *Kutak za znatiželjne*: 2018 monthly rainfall for Varaždin and Rijeka: yearly totals, monthly averages to one decimal, months above the other city, month closest to average.
- **Interactive:** matching, ordering; closing activity: solve tasks and colour a picture.

## 6.5 Dijeljenje decimalnog broja decimalnim brojem

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/1141_dijeljenje_decimalnog_broja_decimalnim_brojem.html>
- **Read:** read in full (37,059 characters; two passes, footer reached). Two [VIDEO] unavailable.
- **Goals:** divide decimals; interpret results; solve a problem situation; work with money. **Codes:** none.
- **Concepts:** a number divided by itself is 1; divided by 1 it is unchanged; decimal division is not commutative or associative (pupils test with a calculator in *Istražimo*).
- **Methods and reasons:**
  - **Shift the point:** multiply dividend and divisor by the same power of ten so the divisor is natural. Reason given: multiplying both by the same number leaves the quotient unchanged.
  - Coins motivate it: 6 kn in 0.50 kn coins is 600 : 50.
  - Dividing by 0.1, 0.01, 0.001 moves the point right, which equals multiplying by 10, 100, 1 000.
- **Problem forms:**
  - 168 kg plums in 10.5 kg buckets; 9 l juice in 0.75 l bottles.
  - **Finding a side from area:** area 18 m², length 4.8 m, width 18 : 4.8 = 3.75 m; then perimeter 17.1 m.
  - **Gaps and posts:** 1.53 km street, 42.5 m spacing: 36 gaps, 37 saplings.
  - Price per kg from a fraction of a kg: 0.7 kg at 29.89 kn gives 42.7 kn.
  - Calls at 0.20 € a minute, 6.70 € paid.
  - Population density of Croatia, Zagreb and islands.
- **Models and visuals:** coin exchange pictures; county map; division image.
- **Extension:** none marked.
- **Interactive:** matching, ordering. Embedded *Procijenite svoje znanje*, 8 items, including paint coverage and pack counts, and *Plati 4 nosi 5!* chocolates compared across two shops for 22 pupils.

## 6.6 Jednostavni algebarski izrazi

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/218_jednostavni_algebarski_izrazi.html>
- **Read:** read in full (25,593 characters; two passes, footer reached). One [VIDEO] in the *Kutak* unavailable. Some matching options are run together.
- **Goals:** calculate with decimals using properties; find the value of simple algebraic expressions. **Codes:** none.
- **Concepts:** *brojevni izraz*; *redoslijed računskih radnji*; *istoimeni algebarski izrazi*; 8a for 8 · a and ab for a · b. The word *monom* is not used, and neither is *formula*.
- **Methods and reasons:**
  - Order of operations again, with decimals. Reason given: agreed rules mean everyone gets the same result. Opens with 11.4 − 1.4 : 0.2 giving 50 or 4.4.
  - Only like terms combine, written as products: 2 · x + 4 · x = 6 · x.
  - **Perimeter leads to expressions:** a fence around a square bed, a + a + a + a = 4a; around a rectangle, a + b + a + b = 2a + 2b (*Promotri*).
  - Evaluate: simplify, then substitute.
- **Problem forms:**
  - Same numbers, different brackets.
  - 1.2a + 2.4a + a = 4.6a; 2a + 3.2b − 0.7a + 1.44b = 1.3a + 4.64b.
  - 17.1a − 5.6a − 1.2a + 1.4a at a = 2.7 is 31.59.
  - Match phrases to expressions: 2.3 times smaller than x; 2.3 more than three times x.
- **Models and visuals:** order-of-operations diagram; garden, bed and fence pictures.
- **Extension:** [EXT] *Kutak za znatiželjne*: four tasks with brackets and two letters, such as 0.1 · (15.2a − 6.7) + 3.4b at a = 1.8, b = 0.9; simplify 5.41 + 4.2a + 3.1 · (1.4b − 1.1 + 2.1b).
- **Interactive:** matching; crossword on order of operations.

## 6.7 Linearna jednadžba s jednom nepoznanicom ax = b

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/219_linearna_jednadzba_s_jednom_nepoznanicom_ax_=_b.html>
- **Read:** read in full (23,002 characters; three passes, footer reached). Primjer 3's solutions are in a [VIDEO], unavailable. Primjer 1's steps are handwritten images, read through alt text.
- **Goals:** solve ax = b with natural or decimal a and b, checking the solution; express an unknown from a simple linear equation using *veza među računskim operacijama*. **Codes:** none.
- **Concepts:**
  - *Prisjeti se* box: *nepoznanica*; *jednadžba*; solving means finding the value that replaces the unknown.
  - *Linearna jednadžba s jednom nepoznanicom*: one that can be written as a · x + b = 0 with a ≠ 0.
  - *Rješenje*: the value that makes the equation true.
  - **Not on the page:** *koeficijent*, left or right side of an equation, *ekvivalentne jednadžbe*.
- **Methods and reasons:**
  - **Opening:** Roman paid 49.42 kn for cheese and ham, cheese 23.64 kn. First a box, as in lower grades, 23.64 + ☐ = 49.42, then a letter: x = 49.42 − 23.64, x = 25.78, checked by substituting.
  - **One worded rule per form, named after the parts of the operation:**
    - Unknown *pribrojnik*: subtract the known one from the *zbroj*.
    - *Umanjenik*: add the *umanjitelj* to the *razlika*.
    - *Umanjitelj*: subtract the *razlika* from the *umanjenik*.
    - Unknown *faktor*: divide the *umnožak* by the known factor.
    - *Djeljenik*: multiply *količnik* by *djelitelj*.
    - *Djelitelj*: the worked line is d = 1.96 : 2.8, dividend by quotient. [MINE] The rule's wording appears reversed on this page (it names dividing the quotient by the dividend) while the line is correct, and Module 2's activities page states it the correct way round. Based on comparing the two.
  - **The only reason offered is naming the *veza*, and the check by substitution.** It is never said to do the same to both sides. *Vaga*, *ravnoteža* and *ekvivalent* do not appear.
- **Problem forms:**
  - a + 4.35 = 8.1; b − 1.295 = 3.82; 17.4 − c = 5.62; 2 · a = 3.52; 1.5 · b = 2.25; c : 1.4 = 1.3; 1.96 : d = 2.8.
  - Matching, choice and fill-in collections in all of these forms, including x : a = b.
- **Models and visuals:** photo of ham and cheese with a price label; handwritten steps. The box ☐ is a notation device.
- **Extension:** [EXT] *Kutak za znatiželjne*:
  - Primjer 3: 3.1x + 4.6 = 8.32; 1.8x − 0.56 = 1.96, solutions in [VIDEO].
  - Kolekcija #3 follows the *Kutak* heading and before *...i na kraju*: 5.6 + 0.2x = 7.8; 1.4x − 1.3 = 2.62, and others. Its *Pomoć* says to apply the addition and subtraction link first, then the multiplication and division link. Printed *Postupak*: 1.4x = 2.62 + 1.3, 1.4x = 3.92, x = 2.8. [MINE] The markup does not show where the box ends, so I read Kolekcija #3 as part of the extension from its position.
- **Interactive:** [APPLET] simple equations; closing puzzle (*slagalica*) linking equations to solutions.

## 6.8 Primjena linearne jednadžbe s jednom nepoznanicom u jednostavnim situacijama

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/1142_primjena_linearne_jednadzbe_s_jednom_nepoznanicom_u_jednostavnim_situacijama.html>
- **Read:** read in full (25,944 characters; three passes, footer reached). Primjer 1's solution is in a [VIDEO], unavailable. Balance pictures are read through alt text.
- **Goals:** recognise the unknown in a problem; write the problem as a linear equation; express the unknown using the *veza*; solve ax = b and check. **Codes:** none.
- **Concepts:** everyday problems can be written with symbols as a linear equation. Parts-of-operation rules are recalled in hints.
- **Methods and reasons:**
  - **Routine:** say what the unknown stands for, set up the equation, solve it, check accuracy and whether the answer makes sense.
  - **Opening with three *dvokrake vage* (two-pan balances),** asking the mass of each solid, with *ravnoteža* named as the basis:
    - Cylinder alone against 0.2 kg: v = 0.2 kg.
    - Cylinder and ball against 0.2 kg and 0.1 kg: v + k = 0.2 kg + 0.1 kg, substitute, 0.2 kg + k = 0.2 kg + 0.1 kg, k = 0.1 kg.
    - Two cones against 0.5 kg and 0.3 kg: s + s = 0.5 kg + 0.3 kg, 2 · s = 0.8 kg, **2 · s : 2 = 0.8 kg : 2**, s = 0.4 kg.
    - The equation is written straight from the picture. Left and right pans are not matched to sides in the running text, *obje strane* does not appear, and nothing is removed from both pans in words. **The printed line dividing both sides is unexplained, and it is the only written both-sides step I found in the book.** [MINE] "Only" rests on my passes over the pages that contain equations.
    - The balance does not return later in the lesson. The later *vaga* in the orchard problem is a scale reading.
- **Problem forms:**
  - Leon: 4.75 · x = 39.90, price per kg.
  - Choose the equation: fuel 9.98 · x = 354.29; a tank 26.7 + x = 50, also x = 50 − 26.7, more than one option valid.
  - Worked with checks: 0.85 · x = 47.6; 12.34 + x = 25.72; 3 · x = 374.4; 12.6 : x = 4.2.
  - Verbal number problems: 7.904 : b = 7.6; a number decreased by 5.04 gives 12.7.
- **Models and visuals:** two-pan balances; orchard photo.
- **Extension:** [EXT] *Kutak za znatiželjne*: Primjer 4, 7.8 + 2x = 34.4, so 2x = 26.6, x = 13.3, checked. Zadatak 2: three times a number minus 5.4 gives 26.1, and others, with equations in hints.
- **Interactive:** [APPLET] closing game: write the unknown's value on the line. Embedded *Procijenite svoje znanje* spanning Units 6.6 to 6.8, including 1.2x − 3.8 = 0.52, a two-step equation not marked as extension.

## Module 6: Aktivnosti za učenje

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/212_aktivnosti_za_ucenje.html> (23,242 characters; two passes, read in full). **This page teaches currency conversion directly, and is ordinary content except for the rate table.** Goals: link unit price to product prices; know currency (euro and another) and exchange-rate lists, and convert one into another.

- **Detective story:** Professor Matkić's notebook is missing. Pupils solve decimal calculations to clear suspects by number, then find out what happened. A safe code comes from equations: the tenths digit of the solution of 13.7 · x = 9.59; the digit sum for 4.35 − x = 2.65; the value of 5.1a − 2.34a at a = 1.2; the units digit for 11.96 : x = 2.3.
- ***Valuta*:** money issued by a state's bank as legal tender. [ENR] The word is Italian for value. Flip cards: kuna, euro, Hungarian forint.
- **Worked conversions:**
  - 250 euro into kuna at 7.38: 1 845 kn.
  - 1 078.94 kn into euro at 7.39: 146 euro.
  - A chain: 1 980 kn into forints at 100 HUF = 2.20 kn; spending; the rest into euro; how much more kuna for 350 euro.
- **[EXT] *Kutak za znatiželjne*:** a *tečajna lista* table (EUR, HUF per 100, GBP), with no task.
- ***Kolika je cijena?*, *jedinična cijena*:** price per unit of product. Strawberries 0.75 kg at 16.50 kn; cherries 1.2 kg at 34.20 kn. Perfume in four bottle sizes, cost per 10 ml. Detergent in three packs.
- **Closing project:** choose a product sold in several sizes, research prices in at least three shops, present the comparison, recommend the best value, show all calculations.
- **Absent:** *kupovni, prodajni, srednji tečaj*, *provizija*, *štednja*, *džeparac*, *kućni budžet*, history of money.

## Module 6: Procjena znanja

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/213_knowledge_assessment.html> (14,678 characters, read in full). 14 items.

Pupils:

- Add, subtract; move the point for × and : by 10, 100.
- Match decimal products and quotients to values.
- Coat at 845.78 kn with 543.89 kn saved; six cups at 24.73 kn; a jug and two cups totalling 79.87 kn, jug 38.99 kn.
- Solve 17.1 − x = 13.78 and 7.9 · x = 15.879.
- Choose equations: how many times is 7.8 smaller than 46.8? A hiker at 3 km/h on a 7.5 km path to Risnjak.
- Judge: if 1 euro gives 7.41 kn, does 100 euro give 741 kn?
- *Plati 4, nosi 5!* at 5.25 kn with 50 kn: how many, and what is left?

---

# Module 7: Geometrijski likovi i tijela

Module page: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/221_geometrijski_likovi_i_tijela.html>

## 7.1 Preračunavanje mjernih jedinica

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/222_preracunavanje_mjernih_jedinica.html>
- **Read:** read in full (27,861 characters; two passes, footer reached). One [VIDEO] unavailable. A fill-in table on cups is blank in the text.
- **Goals:** convert units of length, mass, time and liquid volume and apply them to problems. **Codes:** none.
- **Concepts:**
  - Length: 1 km = 1 000 m; 1 m = 10 dm = 100 cm = 1 000 mm. Prefixes *kilo, deci, centi, mili*.
  - Mass: 1 t = 1 000 kg; 1 kg = 100 dag = 1 000 g; 1 g = 1 000 mg.
  - Liquid: 1 hl = 100 l; 1 l = 10 dl = 1 000 ml; 1 l = 1 dm³. Measured with a *menzura*.
  - Time: base unit given as the hour; 1 h = 60 min = 3 600 s; months and *prijestupna godina*; *desetljeće, stoljeće, tisućljeće*.
- **Methods and reasons:** to a smaller unit, multiply; to a larger unit, divide. No reason beyond the unit relations.
- **Problem forms:** 3.4 m to cm; 7 km to cm; 56 mg to g; 67 dag to kg; 0.25 dl to ml; 1.7 h to s; 243 s to min; 1 week to hours; glasses of 2 dl filling 3 l; 540 ml in 1 l; sort months by length. [MINE] Two solution lines look mistyped (4.4 m for 3.4 m; 15 min for 5 min), based on the question and answer disagreeing with them.
- **Models and visuals:** unit tables; photos of tools (ruler, tape, scale, measuring cylinders, hourglass, sundial). The scale is a measuring tool here.
- **Extension:** [ENR] *Zanimljivost*: table of prefixes.
- **Interactive:** flip cards for *tisućljeće*, *stoljeće*, *desetljeće*; ordering and matching; one enlargeable item.

## 7.2 Opseg kvadrata, pravokutnika i trokuta

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/223_opseg_kvadrata_pravokutnika_i_trokuta.html>
- **Read:** read in full (28,731 characters; two passes, footer reached). Two animations ([VIDEO]) are unavailable, including the one under Primjer 1's formulas.
- **Goals:** describe and calculate perimeter of a figure and of shapes built from squares, rectangles, triangles; discover and justify the formula; use perimeter and area to find side lengths. **Codes:** none.
- **Concepts:** *opseg*: the sum of a figure's side lengths. Triangle kinds recalled. *Nepoznata stranica*.
- **Methods and reasons:**
  - **Formula grows from the sum:** a plot 8 m × 4 m: 8 + 4 + 8 + 4, then 2 · (8 + 4). Rectangle: o = c + d + c + d = 2·c + 2·d = 2·(c + d), because two pairs of opposite sides are equal. Equilateral o = 3·a. Square o = 4·a. Isosceles o = a + 2·b. Scalene o = c + d + f.
  - Convert to the same unit before adding.
  - **Finding a side uses equations by name:** the word *jednadžba* appears. Rectangle: 15.6 = 2·3.4 + 2·b, 2·b = 8.8, b = 4.4.
  - Two formulas are used in a word problem: length is 4× width, perimeter 53 cm, so 10·b = 53. An isosceles triangle gives 3.5·b = 18.9. [MINE] These are like-term equations. They follow the *Kutak* heading, and the markup does not show if they are inside it.
- **Problem forms:**
  - Ribbon around tiles; picture frame.
  - Scalene: perimeter 35.4 cm, sides 10.5 and 8.7, find the third.
  - Isosceles: base 88 m, perimeter 200 m.
  - Tripling a square's sides triples its perimeter (12·a against 4·a).
  - How many rectangles with whole sides have perimeter 48 cm?
- **Models and visuals:** photos of fence, tiles, canvas; labelled figures. No grid, no tangram.
- **Extension:** [EXT] *Kutak za znatiželjne*: a blue shape from three parts and a yellow irregular shape, express the perimeter with symbols. [ENR] It links to an nrich.maths.org source.
- **Interactive:** [APPLET] rectangle perimeter. Embedded *Procijenite svoje znanje*, 10 items spanning Units 7.1 and 7.2.

## 7.3 Površina kvadrata i pravokutnika

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/224_povrsina_kvadrata_i_pravokutnika.html>
- **Read:** read in full (39,670 characters; three passes, footer reached).
- **Goals:** describe and calculate area of squares and rectangles; discover and justify the formula; link a product of two equal numbers to a square and to the area unit; know km², m², dm², cm², mm²; use area to find side lengths. **Codes:** none.
- **Concepts:**
  - *kvadratni* (*četvorni*) *metar* as the base unit; *jedinična površina*.
  - Area of a shape: the number of unit squares that fully cover it.
  - 1 km² = 1 000 000 m²; 1 m² = 100 dm² = 10 000 cm² = 1 000 000 mm². *Ar* and *hektar* are absent.
- **Methods and reasons:**
  - Count unit squares on a grid.
  - **Leaf on grids (*Istražimo*):** which grid suits best, and can the exact area be found? No, because the edges are not straight, and larger squares give less precision.
  - **Formula stated, not derived in words:** rectangle p = a · b, square p = a · a. Rows × columns is not given as the reason. The grid and an applet come just before.
  - Composite shapes: split and add (8 + 30) or enclose and subtract (42 − 4). Primjer 6 shows four methods all giving 100 m².
  - Unknown side: 9.5 · b = 34.2, called an equation. a · a = 64, with the number described as *kvadriran*.
- **Problem forms:**
  - Convert 3.4 m² to cm². Match objects to units (*stan* m², *nokat* mm², *Hrvatska* km²).
  - L-shaped figures. A picture 72 × 45 cm with a frame; a pool with a path; bathroom tiles at 2.5 dm.
  - Rectangles of 120 cm²: match side pairs across mixed units.
  - A square of perimeter 60 cm with the same area as a rectangle with side 2.5 dm.
  - Rectangles with whole sides and area 36 cm²: which has the smallest perimeter?
- **Models and visuals:** **square grid (*kvadratna mreža*) throughout**; floor plan; grid papers of 9, 36, 144 squares; leaf on a grid. No tangram.
- **Extension:** none marked. [MINE] The curriculum's *preporuka* for D.5.4 says to introduce area unit signs without converting, so converting here goes beyond it.
- **Interactive:** [APPLET] draw a rectangle on a grid and find an unknown; matching. Embedded *Procijenite svoje znanje*, about 9 items, including a playground 24 × 16 m with a path and tile count.

## 7.4 Volumen kocke i kvadra

- **URL:** <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/225_volumen_kocke_i_kvadra.html>
- **Read:** read in full (29,154 characters; three passes, footer reached).
- **Goals:** explain volume as the number of unit cubes; discover and justify the formula; estimate and calculate volume in problems; link a product of three equal naturals to the cube of a natural and the volume unit; know m³, dm³, cm³. **Codes:** none.
- **Concepts:**
  - *volumen* (*obujam*): the space a solid takes up, the number of unit cubes that fill it.
  - *kocka*: six congruent squares, 8 *vrhova*, 12 *bridova*. *kvadar*: three pairs of congruent rectangles.
  - Units m³, km³, dm³, cm³, mm³, with conversions; 1 l = 1 dm³.
  - V = a · a · a, shortened to a³. V = a · b · c.
- **Methods and reasons:**
  - **Build first:** all buildings of three unit cubes: are they different? Same volume, differently placed.
  - *Istražimo*: fill a box with unit cubes, no gaps or overlaps. Picture of a 3 × 2 × 4 box beside a unit cube.
  - **The formula is stated, not derived in words:** layers are not used as the reason. The word *kub* is not used for a number, and how a³ is read is not given.
  - Make units the same before multiplying.
  - Unknown edge by equation: 35 200 = 32 · 25 · c. Aquarium: 18 000 = 1 200 · h, the word *jednadžba* appears.
- **Problem forms:**
  - 2.7 dm³ to cm³; cube a = 0.7 dm gives 0.343 dm³; box 4 cm × 6 cm × 1 dm.
  - How many 5 cm cubes fill a 4 dm cube-shaped box?
  - Aquarium 40 × 30 × 25 cm with 18 l: water height, how much more fits.
  - Two boxes with equal volume, find a third edge.
  - Water moved from one vessel to another.
  - Two metal cubes dropped into an aquarium: what spills, how far the level rises.
- **Models and visuals:** **unit cubes**; buildings of three cubes; cube with edges 1, 2, 3; a box with partly filled rows; geometric solids. No net here.
- **Extension:** none marked. [MINE] The curriculum's *preporuka* for D.5.5 says to introduce volume unit signs without converting, so converting here goes beyond it.
- **Interactive:** [APPLET] two *Istražimo* explorations. Embedded *Procijenite svoje znanje*, 8 items.

## Module 7: Aktivnosti za učenje

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/226_aktivnosti_za_ucenje.html> (23,623 characters, read in full). Page title in my extraction: *Oplošje i volumen kocke i kvadra*. One [VIDEO] unavailable.

- **Escape story:** Darko must escape a bear into a locked hut, and each task opens a lock.
- **Volume by cubes:** a vase with one layer and one column shown; an aquarium; a box of 144 cm³ with 6 × 6 on top, find the height; a building of 8, 3, 1 cubes.
- **Lock codes:** find sides from perimeter and area, then order the answers to spell a word; sum of perimeters of all rectangles with area 36 cm² and whole sides, entered in mm; convert 5.45 dm².
- **New content, *oplošje kocke*:** the cube and its *mreža*: is any arrangement of six squares a net? Choose a net. O = 6 · a²; a = 2.5 cm gives 37.5 cm². [MINE] Surface area and nets are not in the 5th grade outcomes in section 2 of the curriculum file.
- **[EXT] *Kutak za znatiželjne*:** *pravokutno projiciranje*, *tlocrt, nacrt, bokocrt* (a correlation note), and the surface of an L-shaped solid of 5 unit cubes: 22 unit squares, by counting faces or by 30 minus 8 touching faces. A follow-up on a J shape.
- **Closing:** build solids from 8 unit cubes; do they all have the same volume, the same surface?

## Module 7: Procjena znanja

URL: <https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/221_knowledge_assessment.html> (17,146 characters, read in full). 17 items.

Pupils:

- Judge: a week has 168 hours. Convert 67.3 m³ to cm³. Order durations from 5 min to one *tisućljeće*.
- Find a rectangle's length from its perimeter; match shapes to perimeter formulas.
- Find a side and perimeter from area 94.86 cm²; a side from an equilateral perimeter.
- Perimeter and area of a Z-shape on a grid; of a composite figure; a square cut from a rectangle.
- Match rectangles to areas across mixed units.
- Which whole-side rectangle with perimeter 18 cm has the largest area?
- Area of a path along two sides of a playground.
- Order boxes by volume; find a third edge; largest cube cut from a box and the waste.
- **Absent:** nothing on surface area, despite the activities page.

---

# How the book explains equations

This section gathers what the unit entries show, in the book's order.

| Where | What the pupil meets |
|---|---|
| Unit 2.8 | Missing-number sentences with blanks: 6 · 4 + __ = 34; (__ − 11) · 4 + 3 = 23. Neither the word *jednadžba* nor a method is given |
| Module 2 activities page | **First teaching.** Box to letter: 39 + ☐ = 57, then 39 + x = 57. Defines *nepoznanica* and *jednadžba*. Six forms, one rule each, named *veza zbrajanja i oduzimanja* and *veza množenja i dijeljenja*. Check by substituting |
| Module 2 activities page, applets | **Balance applets:** make the scale balance, then remove equal weights from both sides to find a bag's "mass". For × and :, remove the bag and a certain number of weights. Then match written equations to solutions. The page does not connect the scale to the written rule |
| Module 2 *Procjena znanja* | Five one-operation equations in N, in natural numbers, solved by choosing |
| Unit 4.3, Primjer 8 | α + 3·α = 180°, 4·α = 180°, α = 180° : 4. No word *jednadžba*, no rule named |
| Unit 6.7 | The *veza* rules again with decimals. Formal definition a · x + b = 0. Two-step equations after the *Kutak za znatiželjne* heading, with the hint: first the addition and subtraction link, then the multiplication and division link |
| Unit 6.8 | Opens with three two-pan balances and *ravnoteža*, including the printed line 2 · s : 2 = 0.8 kg : 2, unexplained. Then a four-step routine for word problems, solved by the parts-of-operation rules. The word *veza* is only in its goal panel |
| Units 7.2, 7.3, 7.4 | Equations return as tools to find a side or edge, with the word *jednadžba*: 2·b = 8.8; 9.5 · b = 34.2; a · a = 64; 18 000 = 1 200 · h. Unit 7.2 also has 10·b = 53 and 3.5·b = 18.9 |
| Module 6 activities page | Safe code from solving 13.7 · x = 9.59, 4.35 − x = 2.65, 11.96 : x = 2.3 |

**What this adds up to [MINE: my reading of the rows above]**

- **The method is inverse operations, named from the parts of the operation.** It is not "do the same to both sides". Pupils learn six named rules, one per form, and the only justification is a named link plus a check by substitution. This matches the official text's *veza među računskim operacijama*.
- **The balance and the written method sit side by side and are never connected.** The balance is shown twice, first as an applet and then as pictures, but no written solution uses it as an argument. The one printed both-sides line (2 · s : 2 = 0.8 kg : 2) has no words around it, and the rest of 6.8 and Unit 7.2 go back to undoing one operation with its partner. *Ekvivalentne jednadžbe*, left side and right side are absent.
- **Two-step equations are treated as extension, handled by applying the same link twice.** They sit under *Kutak za znatiželjne* in 6.7 and 6.8. One escapes into the ordinary self-check of 6.8 (1.2x − 3.8 = 0.52), and word problems in Module 2's and Module 6's *Procjena znanja* need two steps without being written as equations.
- **Like terms come from the distributive property, not from objects.** 2a + 3a + 7a is factored as a · (2 + 3 + 7) (Units 2.6, 2.8). In equations, s + s appears on a balance, and α + 3·α in Unit 4.3.
- **The textbook's forms go beyond the curriculum's listed forms** by including x : a = b, which the curriculum list omits, as noted in section 4A of the curriculum file.

# How the book explains other ideas

**[MINE: patterns across the unit entries, each with its evidence named]**

- **Stories carry the activities pages.** Missing homework (Module 2), raffle (Module 3), padlocks (Module 4), a shop (Module 5), a detective (Module 6), an escape from a bear (Module 7). Codes and elimination by answer are the common mechanism.
- **Sharing motivates fractions.** Chocolate among children for a : b = a/b (5.1); chocolates and apples into piles for mixed numbers (5.3).
- **Grids and cubes carry measurement.** Unit squares (2.5, 7.3), unit cubes (7.4). The step from counting to the formula is left to an applet or simply stated, in both 7.3 and 7.4.
- **Rules are often found from a pattern, not reasoned.** Decimal point in a product (6.3, *Istražimo* with calculator); side and angle relation (4.5, applet); transversal angles (4.4, applet); simetrala properties (4.2, measuring). Divisibility rules come with no reason in the text (3.2).
- **Reasons are given where they are short.** Why you cannot divide by zero (2.7); why zero padding is safe (5.6, squares); why the quotient survives shifting the point (6.5); why the axis is the simetrala (4.8).
- **Real-world data is frequent and Croatian.** Island populations, census, Večer matematike, Croatian counties, tourist nights, Adriatic salinity, Varaždin and Rijeka rainfall, Risnjak.

---

# Outcome audit

Outcomes are from section 2 of `C:\Users\lpodobnik\Claude\matematika\_bmad-output\planning-artifacts\briefs\brief-matematika-2026-11-05\sources\kurikulum-5-razred.md`. Lines are shortened to English glosses, with Croatian terms kept.

**Status words**

- **Taught:** the lesson text explains or works it.
- **Partly:** part of the line is missing, or it is carried only by a goal panel, a video, an applet or bare tasks.
- **Not found:** I looked in the pages named and it is absent from the text.
- *Context:* a cross-subject note, with the evidence I saw.

A title or goal panel alone never counts as Taught. "Module N activities" means that module's *Aktivnosti za učenje* page.

## Verdict on the publisher's claim

**[MINE: rests on the tables below]** The book touches all 17 outcomes, so the claim holds at outcome level. It does not hold line by line. Most gaps fall in C.5.2 (constructions and motifs), and smaller ones in C.5.1, C.5.3, D.5.1, D.5.5, E.5.1 and A.5.5. D.5.1 and D.5.3, the two with no obvious unit, are both present, in unexpected places.

| Outcome | Result | Main place | Weak or missing |
|---|---|---|---|
| A.5.1 | Taught, one small gap | 2.1 to 2.8 | ≠ only in goals |
| A.5.2 | Taught | 3.1 to 3.4; extended on Module 3 activities | None |
| A.5.3 | Taught | 5.1 to 5.3 | None |
| A.5.4 | Mostly | 5.4 | Choosing a suitable form: goal only |
| A.5.5 | Mostly | 5.5, 5.6, 6.1 to 6.6 | Square of a decimal not found; ≠ only in goals |
| A.5.6 | Mostly | 2.1, 5.7 | Effect of rounding error thin |
| B.5.1 | Taught | Module 2 activities, 6.7, 6.8, 7.2, 7.3 | None; goes beyond the listed forms |
| B.5.2 | Taught | 1.1 to 1.4, 2.2, 2.3 | None |
| C.5.1 | Mostly | 4.1 to 4.4 | Congruent angles not found; drawing in video only |
| C.5.2 | **Weak** | 4.5 to 4.7 | Constructions and motifs not found |
| C.5.3 | Mostly | 4.8 | Mapping a circle or disc not found; central image of a line not found |
| D.5.1 | Mostly | 4.3 | Protractor technique in video and applet only |
| D.5.2 | Taught | 7.1 | None |
| D.5.3 | Taught, off the main path | Module 5 and Module 6 activities, 6.3 | No numbered unit; no exchange-rate types |
| D.5.4 | Mostly | 7.2, 7.3 | Area formula stated, not derived |
| D.5.5 | Mostly | 7.4 | Estimating not found; formula stated, not derived |
| E.5.1 | Mostly | 5.8 | Pupil placing data on axes not found |

## A: Brojevi

### MAT OŠ A.5.1. Numerical expression models a problem in N₀

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Read and write naturals, including above a million | 2.1: place-value and names tables to 10¹⁵, words to digits | Taught |
| 2 | Read, write, interpret <, >, ≤, ≥, =, ≠ in N₀ | 2.2, 2.3 for the first five. ≠ is only in the goals panel of 2.2 (checked), though used in passing: 23 − 12 ≠ 12 − 23 (2.4) | Partly |
| 3 | *Produljena nejednakost* | 2.2, 2.3 | Taught |
| 4 | Add, subtract, multiply, divide with properties; dekadska jedinica as a power of 10; equal factors as a square | 2.1 (powers of 10), 2.4, 2.5, 2.6, 2.7 | Taught |
| 5 | Recognise squares to 10 | 2.5 (matching, memory game), 2.6 quiz | Taught |
| 6 | Naturals on a number line, read them; mental calculation and estimating | 2.3; 2.4, 2.5, 2.7 | Taught |
| 7 | Interpret a solution in context | 2.2 Primjer 3; 2.4 Primjer 3; 2.7 buses and batteries | Taught |
| 8 | Value of simple algebraic expressions | 2.8; like terms 2.6 | Taught |

Notes: modelling with an expression appears in 2.5 (268 · 12 + 2 456). [MINE] Unit 2.3 defines *ishodište* and *jedinična točka*, which the *preporuka* says not to introduce. The *preporuka*'s avoidance of *baza* and *eksponent* is kept in the Module 2 pages scanned and in 3.4. Puzzle formats named in the *preporuka*: magic squares appear in 6.2. My passes surfaced no *sudoku* or matchstick puzzles, but I did not scan for those words.

### MAT OŠ A.5.2. Prime factors and divisibility

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Use the terms *djeljivost, djelitelj, višekratnik, biti djeljiv, prosti, složeni* | 3.1, 3.2, 3.3 | Taught |
| 2 | Apply divisibility by 2, 3, 5, 9, 10 | 3.2, also 100; Module 3 activities adds 4, 6, 15, 18, 45. Rules stated with no reason in the text, and the digit-sum rule is introduced via [VIDEO] | Taught |
| 3 | Factorise; repeated factors as a power | 3.4 | Taught |
| 4 | Apply divisibility and interpret the procedure | 3.1 (magnets, gingerbread), 3.2 (Martin's bills), 3.3 (why composite), 3.4 | Taught |
| 5 | Extended: divisibility of a product, sum and difference | **Module 3 activities only**: *Djeljivost zbroja i razlike*, *Djeljivost umnoška*, with worked examples and [VIDEO] | Taught |

### MAT OŠ A.5.3. Representations of fractions

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Picture to number and back | 5.1 | Taught |
| 2 | Fraction linked to division | 5.1, 5.3 | Taught |
| 3 | Fractions on a number line | 5.2 | Taught |
| 4 | Improper fractions, mixed numbers, naturals | 5.3; natural as fraction 5.1 | Taught |
| 5 | Share in a set of like data | 5.1 (vote, 3 of 20 pupils); 5.2 quiz; Module 5 *Procjena znanja* | Taught |
| 6 | Interpret a solution in context | 5.1 (coin game fairness, Petar's money) | Taught |

Notes: the percent link in *sadržaj* is in 5.4. *Dan – noć*, named in the *preporuka*, was not found in 5.1 (scanned). [MINE] Equivalent fractions are in, with *proširivanje* and *skraćivanje* shown by example inside *Zanimljivost* boxes, matching the *preporuka*'s "without calculation procedure". Comparing fractions (5.2) is extra: the *razrada* does not list it.

### MAT OŠ A.5.4. Equivalent notations of a decimal

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Describe and write decimals | 5.4 | Taught |
| 2 | Equality among notations, including percent and promil | 5.4; fraction to decimal also 6.4; Module 5 activities (discounts) | Taught |
| 3 | Discover infinite decimals | 5.4 (1/3 by calculator; periodic notation) | Taught |
| 4 | Choose a suitable notation | 5.4 goal panel only. No task asks it (checked). Closest: 5.3 Luka and Matija | Partly |
| 5 | Share in like data | 5.4 (grid of 100), Module 5 *Procjena znanja* | Taught |
| 6 | Interpret a solution in context | 5.4 (discount, birth rate) | Taught |
| 7 | Context: Geography and Nature | 5.4: salinity, birth rate, water and land | *Context* |

Notes: the *preporuka*'s remark that some fractions are not usefully converted to decimals is absent from 5.4 (checked).

### MAT OŠ A.5.5. Calculating with decimals

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1a | Add, subtract, multiply, divide with properties | 6.1 to 6.5 | Taught |
| 1b | Link equal decimal factors to the square of a decimal | **Absent from 6.3 and its goals (checked).** No decimal squared in 6.4, 6.5, 6.6 extractions. Closest: 6.7's 1.5 · b = 2.25, not called a square | **Not found** |
| 2 | Read, write, interpret signs for decimals | 5.6 for the first five. ≠ is only in the goals panel (checked) | Partly |
| 3 | Discover infinite decimals | 5.4; 5.6 compares 2.3̄ and 2.3; 5.7 quiz. *Beskonačni* is absent from 6.4 and 6.5 (scanned) | Taught |
| 4 | Points on a line and read them | 5.5, 5.6 | Taught |
| 5 | Value of simple algebraic expressions | 6.6 | Taught |
| 6 | Solve a problem situation | 6.1 to 6.5, Module 6 activities | Taught |
| 7 | Context: Geography and Nature | 6.4 rainfall, 6.5 population density, 6.1 continents | *Context* |

Notes: the *preporuka* on decimal point and decimal comma: *decimalni zarez* is absent from 5.4 (checked).

### MAT OŠ A.5.6. Rounding

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Apply rules; round sensibly by the task's conditions | 2.1, 5.7, Module 5 activities | Taught |
| 2 | Notice a rounding error and estimate its effect | Worked once in 2.4 Primjer 3 (1 132 rounded to 1 100 leaves 32 short); 2.4 quiz on a 1 900 kn rounding range. 5.7 has it as a goal, and my passes found no worked case there | Partly |
| 3 | Interpret a solution in context | 2.1 (newspaper figures), 5.7 (Anita), 6.1 (tip) | Taught |
| 4 | Context: Geography, Entrepreneurship, Personal development | 2.1 distances, 5.7 and Module 5 activities money | *Context* |

## B: Algebra i funkcije

### MAT OŠ B.5.1. Linear equation

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Recognise the unknown in a problem | Module 2 activities; 6.7 opening; 6.8 | Taught |
| 2 | Write a problem as a linear equation | 6.8 (routine, choose the equation); Module 2 activities; Module 6 *Procjena znanja* | Taught |
| 3 | Solve ax = b with natural or decimal a and b, checking | Module 2 activities (naturals); 6.7 (decimals) | Taught |
| 4 | Express the unknown using *veza među računskim operacijama* | Module 2 activities; 6.7 | Taught |
| 5 | Use perimeter and area to find side lengths | 7.2, 7.3; also 6.5 Zadatak 2, 7.4 for an edge, Module 7 activities | Taught |
| 6 | Context: Geography and Nature | Thin: Risnjak hiker (Module 6 *Procjena znanja*) | *Context* |

Notes: see *How the book explains equations*. All five forms in the *preporuka* appear, plus x : a = b.

### MAT OŠ B.5.2. Sets

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Form and show sets and relations with Venn diagrams (*presjek, unija, podskup*) | 1.2, 1.3, 1.4 | Taught |
| 2 | Number of elements; empty set | 1.1; Module 1 activities k(A) | Taught |
| 3 | Symbols for sets and relations | 1.1, 1.3, 1.4 | Taught |
| 4 | Set notation for solutions of a simple inequality in N₀ | 2.2 Primjer 1; 2.3 Primjer 3 | Taught |
| 5 | Extended: list and count elements in combinatorial tasks | 1.3 (ice cream); Module 1 activities [EXT] (routes, outfits, product rule) | Taught |

Notes: beyond the lines: *razlika skupova* and k(A ∪ B) on Module 1 activities; distributive laws [EXT] in 1.4. The *preporuka* on point sets is met in 1.4, Module 1 activities and Module 4 *Procjena znanja*.

## C: Oblik i prostor

### MAT OŠ C.5.1. Point sets in the plane

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1a | Describe, define and label points, lines, rays, segments, angles, and relations | 4.1, 4.2, 4.3 | Taught |
| 1b | Sketch and draw with tools | 4.1 [VIDEO] for parallels and perpendiculars; bare tasks draw lines through points | Partly |
| 1c | Congruence of segments | 4.2 (≅) | Taught |
| 1d | Congruence of angles | **Absent from 4.3 (checked).** 4.4 uses *sukladan* once, in a statement to judge. No glossary entry. The book speaks of equal sizes (*jednakih veličina*) | **Not found** |
| 2a | Draw parallel and perpendicular lines | 4.1 [VIDEO]; perpendicular by construction in 4.2 Zadatak 6 and 7 | Partly |
| 2b | Draw adjacent, vertical and transversal angles | 4.3 and 4.4 goals. 4.4 tasks read figures (checked) | Partly |
| 2c | Analyse angles with parallel arms | 4.4 | Taught |
| 3 | Kinds of angle, acute to full | 4.3, with Module 4 *Procjena znanja* | Taught |
| 4 | Construct and define the simetrala, its properties | 4.2 (properties by measuring, no proof) | Taught |
| 5 | Context: Geography and Nature | 4.5 triangulation for maps | *Context* |

### MAT OŠ C.5.2. Describe, draw, construct shapes and create motifs

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1a | Draw or construct a square | 4.6 closing [VIDEO] only, from the diagonal. No text steps | Partly |
| 1b | Draw or construct a rectangle | Absent from 4.6 and from Module 4 activities and *Procjena znanja* | **Not found** |
| 1c | Draw or construct a triangle | Absent from 4.5 (checked), including equilateral and isosceles and existence by side lengths | **Not found** |
| 1d | Draw or construct a circle, disc | Absent from 4.7 (checked). A string applet shows how a circle forms, to observe only | **Not found** |
| 2 | Describe triangle, square, rectangle | 4.5, 4.6 | Taught |
| 3 | Define circle and disc; *polumjer, promjer, tetiva* | 4.7 | Taught |
| 4 | Describe and draw *isječak, odsječak, vijenac* | Describe: 4.7. Draw: goal panel only (checked) | Partly |
| 5 | Context: Geography, Nature, Technical culture | Mondrian and Kandinsky-style pictures, everyday circles | *Context* |
| Title | Create motifs with shapes | Absent from 4.5, 4.6, 4.7 (checked) and Module 4 activities. *Tangram* absent from 4.5, 4.6, Module 4 activities, 7.2, 7.3 and Module 7 activities (scanned). Nearest: colouring a figure to make it symmetric in 4.8 | **Not found** |

**[MINE]** This is the book's largest gap. The curriculum's *sadržaj* names these constructions, and the construction skill it does teach, the simetrala (4.2) and perpendicular through a point, is not carried over to shapes.

### MAT OŠ C.5.3. Axial and central symmetry

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Map point, segment, line, triangle, quadrilateral, disc, circle under both symmetries | Point, segment, triangle: 4.8 (both). Line: axial only, solution in [VIDEO]; central image **not found**. Quadrilateral: grid task (axial) and judge-this-figure (central). Disc and circle: **not found** as mapping; only a judge-this-figure item (checked) | Partly |
| 2 | Recognise symmetric figures; find axis or centre | 4.8, Module 4 activities and *Procjena znanja* | Taught |
| 3 | Context: Informatics | Applets in 4.8 | *Context* |

## D: Mjerenje

### MAT OŠ D.5.1. Measure and draw angles; adjacent and vertical angles

**Looked at closely.** The unit title names only adjacent and vertical angles, but Unit 4.3 is this outcome's home. Its goals, content and tasks cover nearly all of it.

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1a | Measure and draw with a *kutomjer* | 4.3: the text says size is measured with a *kutomjer* and shows 180° and 360° protractors. **The method itself is only in [VIDEO] (Primjer 3, Primjer 4) and an [APPLET] (Zadatak 2).** Placement and scale reading are absent from the text (checked). *Procjena znanja* asks no measuring | Partly |
| 1b | Classify angles, acute to full | 4.3, with sizes; also *izbočeni*; Module 4 *Procjena znanja* orders them | Taught |
| 2a | Calculate size in degrees and minutes | 4.3 Primjeri 5 to 7 (also seconds, 1° = 3600″), 179°60′ device; 4.4 | Taught |
| 2b | Draw angles of a given size | 4.3 Primjer 4 [VIDEO] only | Partly |
| 3 | Describe adjacent and vertical angles | 4.3 | Taught |
| 4 | Find sizes of adjacent and vertical angles | 4.3, 4.4, Module 4 activities (lock 4) and *Procjena znanja* | Taught |

### MAT OŠ D.5.2. Units

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Convert length, mass, time, liquid volume, and apply | 7.1 covers every unit named, including mg, hl, *desetljeće, stoljeće, tisućljeće*. Earlier use: 2.5, 5.1, 5.4, 6.3. Applied: 7.2 to 7.4 | Taught |
| 2 | Context: Geography, Nature, Croatian | Pictures of measuring tools in 7.1 | *Context* |

### MAT OŠ D.5.3. Calculating with money

**Looked at closely.** No numbered unit is about money, and no money term is in the glossary. All of it is present, split among activities pages and goals on the decimal units. The book-level goal list also omits it.

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Calculate with money in a problem | Goal panels of 6.1 to 6.5; worked throughout (2.4, 2.5, 2.7, 3.1, 5.1, 5.6, 5.7, 6.1 to 6.5) | Taught |
| 2 | Link unit price to product and service prices | **Module 5 activities** Primjer 1 (milk, defined as total divided by quantity); **Module 6 activities** (strawberries, perfume, detergent, shop project). Also 6.3 tomatoes and 6.5 price per kg, unnamed | Taught |
| 3a | Know currency: euro and another | **Module 6 activities** (*valuta* defined; kuna, euro, forint). **Module 5 activities** (DKK, GBP, EUR, PLN, HUF, undefined) | Taught |
| 3b | Know the exchange-rate list | Module 5 activities Zadatak 11 and 12; Module 6 activities (Primjer 2, table under [EXT]) | Taught |
| 3c | Convert one currency into another | **Module 6 activities** Primjeri 1 to 3, both directions and a chain; 6.3 Primjer 9; Module 6 *Procjena znanja* | Taught |
| 4 | Context: Croatian, Entrepreneurship, Personal development | 6.3 best-value tomatoes; shop project on Module 6 activities | *Context* |

Notes: the *preporuka* on rounding to two decimals is met (Module 5 activities). Saving appears as context (3.1 Tibor, 2.5 cigarettes), and *džeparac*, *kućni budžet* and history of money are absent from the two activities pages (checked). Buying, selling and middle rates are absent. **[MINE]** The book uses kuna as home currency and treats the euro as foreign, so a game built on it today would need the roles swapped. This rests on the kuna figures read here plus my general knowledge that Croatia adopted the euro in 2023. Section 3 of the curriculum file also notes the examples are still in kuna. The euro appears elsewhere only in passing: 5.8 (share price), 6.4 (sharing 10 euro), 6.5 (call prices in €).

### MAT OŠ D.5.4. Perimeter and area

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Describe and calculate perimeter, including composed shapes | 7.2; expressions 6.6; grid figures 7.3; Module 7 *Procjena znanja* | Taught |
| 2 | Describe and calculate area of square and rectangle | 7.3; first met in 2.5 Primjer 3 | Taught |
| 3a | Discover and justify perimeter formulas | 7.2, 6.6: from the sum to the formula, with reasons | Taught |
| 3b | Discover and justify area formulas | 7.3: unit squares and a rectangle applet, then the formula stated. Rows × columns absent (checked). 2.5's area model comes closest | Partly |
| 4 | Link equal factors to the square of a number and to the area unit | 2.5 (*kvadriranje*, 25 cm²); 7.3 (a · a, *kvadriran*). m² is not described as a square of side 1 m (checked) | Partly |
| 5 | Know km², m², dm², cm², mm² | 7.3 (also converts, beyond the *preporuka*) | Taught |

Notes: *tangram*, named in the *preporuka*, is absent from 7.2, 7.3 and Module 7 activities. Pupil estimation before calculating is absent from 7.3 (checked).

### MAT OŠ D.5.5. Volume

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Explain volume as a number of unit cubes | 7.4; Module 7 activities | Taught |
| 2 | Discover and justify the volume formula | 7.4: fill a box with cubes in an [APPLET], then the formula stated. Layers not used in words (checked) | Partly |
| 3a | Estimate volume | 7.4 goal panel only (checked) | **Not found** |
| 3b | Calculate volume in problems | 7.4 (aquarium, boxes, displaced water) | Taught |
| 3c | Link three equal factors to the cube of a natural and to the volume unit | 7.4: V = a · a · a shortened to a³; units. The word *kub* for a number is only in the goal panel (checked) | Partly |
| 4 | Know m³, dm³, cm³ | 7.4; also km³, mm³, with conversions beyond the *preporuka* | Taught |

## E: Podatci, statistika i vjerojatnost

### MAT OŠ E.5.1. Data shown in different ways

| # | Line | Lesson text | Status |
|---|---|---|---|
| 1 | Connect, compare, interpret tables, pictures, lists, graphs in the first quadrant | 5.8 (table, tally, bar, line); 2.2 buildings; 2.4 bottle caps; 2.5 pictogram; 5.4 salinity table. Pie charts only as pictures (4.7, 5.4), not taught | Taught |
| 2 | Put characteristics on the horizontal axis and counts on the vertical, or the reverse | 5.8 goal panel; axes only in the goal panel and image descriptions (checked). Primjer 3 describes building columns. **No pupil draws a chart or collects data (checked)** | Partly, with the pupil task **not found** |
| 3 | Questions beyond direct reading | 5.8 totals, differences; Module 2 and Module 5 *Procjena znanja*; 2.6 market sales | Taught |
| 4 | Extended: arithmetic mean | Under the word *prosječna*: 2.7 Kolekcija #3 gives the method (add and divide by the count); 6.4 potatoes, average speed; [EXT] rainfall. The term *aritmetička sredina* is absent from these and the glossary | Taught, under another name |
| 5 | Context: Geography, Nature, Croatian, Entrepreneurship, Health | 6.4 rainfall; 5.8 temperature; 5.8 shirts sold | *Context* |

---

# Units not fully read, and gaps

## Units I could not read fully

**By the definition at the top, all 44 numbered units and all 14 module pages (*Aktivnosti za učenje*, *Procjena znanja*) were read in full as text: passes reached each page's footer, with no result failing.** None is "partly read" or "could not read". Three limits apply.

**1. WebFetch's small model stands between me and the text.** It compresses. Exact wording and every exercise item may be incomplete. I saw no raw text. Where passes disagreed, the entry says so (Module 2 *Procjena znanja* count; Module 5 *Procjena znanja* count).

**2. Videos and applets could not be seen.** These units have teaching in a video or animation, which reaches me only as a "browser does not support the video tag" notice:

| Effect | Units |
|---|---|
| A method is carried by video | 2.4 (number line, money model); 2.7 (Primjer 4); 3.2 (digit-sum rule); 4.1 (drawing parallels and perpendiculars); 4.3 (protractor); 4.6 (square construction); 4.8 (Primjer 2, 3, Zadatak 2); 5.8 (tally); 6.4 (Primjer 8); 6.7 (Primjer 3 two-step solutions); 6.8 (Primjer 1); 7.2 (Primjer 1, Zadatak 3 animations) |
| A [VIDEO] exists, with steps also in text or content unknown | 1.1, 1.2, 1.3, 1.4, 2.3, 2.5, 2.8, 3.1 (the whole *Kutak*), 3.4, 4.2, 4.4, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 6.1, 6.3, 6.5, 6.6, 7.1; Module 3 activities; Module 7 activities |
| No [VIDEO] reported in my passes | 2.1, 2.2, 2.6, 3.3, 4.5, 5.6, 6.2, 7.3, 7.4 |

Every unit also has applets or interactive tasks whose on-screen content I could not see, and most have answer keys that appear only after interaction. A video or applet could teach something this file marks as absent. **"Not found" means not found in the text.** The two most exposed findings are the protractor (D.5.1) and square construction (C.5.2), where a video is known to exist. The triangle and rectangle constructions have no sign of any video in the text.

**3. Formulas and images.** Fraction bars are lost in Module 5 and in 6.4. Some items are garbled or blank:

- 1.1, second empty-set symbol.
- 1.3, set D in a true/false task.
- 2.1, googolplex exponent.
- 2.7, exponents in a powers item.
- 5.4, placement of repeat dots.
- 6.1, associativity box.
- Many figures, charts and number lines are read only through alt text, or not at all where there is none.

**Not read at all:** the seven module landing pages listed at each module heading, and the student instructions page. These were outside the brief's units, and I did not rely on them.

## Outcome lines not found in the text

1. **A.5.5:** link equal decimal factors to the square of a decimal.
2. **C.5.1:** congruence of angles.
3. **C.5.2:** construct or draw a rectangle.
4. **C.5.2:** construct or draw a triangle, including equilateral and isosceles.
5. **C.5.2:** construct or draw a circle and disc.
6. **C.5.2 title:** create motifs with shapes.
7. **C.5.3:** map a circle or disc under either symmetry. Central image of a line.
8. **D.5.5:** estimate volume.
9. **E.5.1:** pupil places data on axes, draws a chart or collects data.

## Outcome lines only partly present

- **A.5.1, A.5.5:** ≠ for comparing: goal panels only.
- **A.5.4:** choose a suitable notation: goal panel only.
- **A.5.6:** effect of rounding error: one worked case, in natural numbers (2.4).
- **C.5.1:** drawing with tools: video or goal panel only.
- **C.5.2:** square: closing video only. Drawing disc parts: goal panel only.
- **C.5.3:** quadrilateral: grid and judging only. Line: axial only, solution in video.
- **D.5.1:** protractor technique: video and applet only, not tested in *Procjena znanja*.
- **D.5.4:** area formula stated without a rows-by-columns reason. m² not described as a square of side 1 m.
- **D.5.5:** volume formula stated without a layers reason. *Kub* for a number: goal panel only.

## Other gaps and things to know

- **Content that sits off the main path.** Unit price and currency (Module 5 and 6 activities), first equations and the balance (Module 2 activities), divisibility of sums and products (Module 3 activities), set difference and element counts (Module 1 activities). A pupil working only through numbered units would miss them. [MINE: from where the content sits; the teacher guidance describes these pages as for independent learning, not as optional.]
- **Beyond the 5th grade lines.** *Ishodište* and *jedinična točka* (2.3, 5.2, 5.5); conversions of area and volume units (7.3, 7.4); angle seconds (4.3); *oplošje* and *mreža kocke*, *tlocrt, nacrt, bokocrt* (Module 7 activities); set difference (Module 1 activities); two-step and like-term equations (6.7, 6.8, 7.2). [MINE: from comparing with section 2 of the curriculum file.]
- **No outcome codes anywhere.** No lesson names MAT OŠ codes, and the *Moje znanje* lists are empty in the text, so the mapping above is mine.
- **Terms absent from the glossary** (<https://edutorij-admin-api.carnet.hr/storage/extracted/8ca807ad-1e1d-443a-8d79-a2476244e7e2/html/pojmovnik.html>): *aritmetička sredina, prosjek, valuta, tečaj, jedinična cijena, monom, kutomjer, kutni stupanj, sukladni kutovi, oplošje, vaga*. *Jednadžba* and *nepoznanica* appear only inside longer entries.
- **Scans were targeted.** A "checked" in the audit means I asked about that term on that page. Term scans did not cover every term on every page. So "absent" holds for the pages named, and is otherwise inference from the passes.
- **Apparent slips on the pages, worth not copying into a game.** [MINE: each rests on the page's own numbers disagreeing with itself. Some could be extraction faults.]
  - 6.7: rule for an unknown *djelitelj* is worded the wrong way round.
  - 6.8: Primjer 3's closing sentence swaps the numbers; the opening calls the ball's mass the cylinder's.
  - 6.6: Primjer 7 names sides b and c, solves with a and b.
  - 2.6: 126 · 406 against 403.
  - 2.7: 112 < 114 where 116 is meant.
  - 1.3: alt text 8 against 18 in set B.
  - 7.1: two solution lines (4.4 m for 3.4 m; 15 min for 5 min).
  - 7.2: an isosceles task solved with three equal sides; an answer asked in mm for lengths given in m.
  - 7.3: frame help box using 2.5 for a 4.5 cm frame.
  - 7.4: an intermediate line 32 500 = 800 · c.
